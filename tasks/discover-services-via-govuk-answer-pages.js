import fs from "node:fs";
import path from "node:path";

import { getGovukPages } from "../lib/search-api.js";

const servicesPath = path.join(import.meta.dirname, "..", "data", "services");

// Load all existing services, tracking their file paths
const existingServices = [];
const serviceFilenames = fs
  .readdirSync(servicesPath)
  .filter((filename) => filename !== "_template.json")
  .filter((filename) => filename.endsWith(".json"));

for (const filename of serviceFilenames) {
  const filePath = path.join(servicesPath, filename);
  const service = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  service.file = filePath;
  existingServices.push(service);
}

// Collect the hostnames of all services that already have a live service URL
const existingLiveServiceHosts = existingServices
  .filter((service) => service.liveService)
  .map((service) => new URL(service.liveService).hostname);
const existingStartPages = new Set(
  existingServices.flatMap((service) => {
    if (!service.startPage) return [];
    return Array.isArray(service.startPage)
      ? service.startPage
      : [service.startPage];
  }),
);

const results = await getGovukPages({ format: "answer" });

for (const result of results) {
  const startPage = `https://www.gov.uk${result.link}`;
  if (existingStartPages.has(startPage)) continue;

  // Fetch the content API to find the start button link
  const contentUrl = `https://www.gov.uk/api/content${result.link}`;
  const contentResponse = await fetch(contentUrl);

  if (!contentResponse.ok) {
    console.error(
      `Content API error for ${result.link}: ${contentResponse.status}`,
    );
    continue;
  }

  const content = await contentResponse.json();

  // Parse the body HTML to find the start button href
  const body = content.details?.body;
  if (!body) continue;

  const startButtonTagMatch = body.match(
    /<a\b[^>]+\bclass="[^"]*govuk-button--start[^"]*"[^>]*/,
  );
  if (!startButtonTagMatch) continue;

  const hrefMatch = startButtonTagMatch[0].match(/\bhref=(["'])([^"']+)\1/);
  if (!hrefMatch) continue;

  const liveService = hrefMatch[2];
  if (!liveService) continue;

  let liveServiceHost;
  try {
    liveServiceHost = new URL(liveService).hostname;
  } catch {
    continue;
  }

  if (!liveServiceHost) continue;

  // If an existing service already uses this live service URL, check whether
  // this start page is listed for it and add it if not
  const existingServiceWithSameLiveService = existingServices.find((s) => {
    if (!s.liveService) return false;
    try {
      return new URL(s.liveService).hostname === liveServiceHost;
    } catch {
      return false;
    }
  });

  if (existingServiceWithSameLiveService) {
    const currentStartPages = Array.isArray(
      existingServiceWithSameLiveService.startPage,
    )
      ? existingServiceWithSameLiveService.startPage
      : existingServiceWithSameLiveService.startPage
        ? [existingServiceWithSameLiveService.startPage]
        : [];

    if (!currentStartPages.includes(startPage)) {
      const serviceToWrite = { ...existingServiceWithSameLiveService };
      delete serviceToWrite.file;
      serviceToWrite.startPage = [...currentStartPages, startPage];

      // If the page title doesn't match the service name or an existing
      // synonym, add it as a new synonym
      const pageTitle = result.title;
      const existingSynonyms = serviceToWrite.synonyms ?? [];
      if (
        pageTitle !== serviceToWrite.name &&
        !existingSynonyms.includes(pageTitle)
      ) {
        serviceToWrite.synonyms = [...existingSynonyms, pageTitle];
      }

      fs.writeFileSync(
        existingServiceWithSameLiveService.file,
        `${JSON.stringify(serviceToWrite, null, 2)}\n`,
        "utf-8",
      );

      existingStartPages.add(startPage);
    }

    continue;
  }

  if (!liveServiceHost.endsWith(".service.gov.uk")) continue;

  // Extract the main subdomain (e.g. "something" from "something.service.gov.uk"
  // or "www.something.service.gov.uk")
  // Hostname must have at least 4 parts: <subdomain>.service.gov.uk
  const hostParts = liveServiceHost.split(".");
  if (hostParts.length < 4) continue;
  const subdomain = hostParts.at(-4);

  const newService = {
    name: result.title,
    description: content.description ?? "",
    organisation: "** TODO **",
    theme: "** TODO **",
    phase: "** TODO **",
    liveService: liveService,
    startPage,
  };

  const organisations = content.links?.organisations ?? [];
  if (organisations.length > 0) {
    newService.organisation = organisations[0].title;
  }

  // Write a new service file named after the subdomain
  const filePath = path.join(servicesPath, `${subdomain}.json`);

  if (fs.existsSync(filePath)) {
    console.warn(
      `Skipping ${liveService}: file ${subdomain}.json already exists`,
    );
    continue;
  }

  fs.writeFileSync(
    filePath,
    `${JSON.stringify(newService, null, 2)}\n`,
    "utf-8",
  );

  existingServices.push({ ...newService, file: filePath });
  existingLiveServiceHosts.push(liveServiceHost);
  existingStartPages.add(startPage);
}
