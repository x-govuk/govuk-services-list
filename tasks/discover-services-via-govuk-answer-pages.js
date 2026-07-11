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
  existingServices
    .filter((service) => service.startPage)
    .map((service) => service.startPage),
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

  const startLink = hrefMatch[2];
  if (!startLink) continue;

  let startLinkHost;
  try {
    startLinkHost = new URL(startLink).hostname;
  } catch {
    continue;
  }

  if (!startLinkHost) continue;
  if (existingLiveServiceHosts.includes(startLinkHost)) continue;
  if (!startLinkHost.endsWith(".service.gov.uk")) continue;

  // Extract subdomain (e.g. "something" from "something.service.gov.uk",
  // or "sub1.sub2" from "sub1.sub2.service.gov.uk")
  // Hostname must have at least 4 parts: <subdomain>.service.gov.uk
  const hostParts = startLinkHost.split(".");
  if (hostParts.length < 4) continue;
  const subdomain = hostParts.slice(0, -3).join(".");

  const newService = {
    name: result.title,
    description: content.description ?? "",
    organisation: "** TODO **",
    theme: "** TODO **",
    phase: "** TODO **",
    liveService: startLink,
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
      `Skipping ${startLink}: file ${subdomain}.json already exists`,
    );
    continue;
  }

  fs.writeFileSync(
    filePath,
    `${JSON.stringify(newService, null, 2)}\n`,
    "utf-8",
  );

  existingServices.push({ ...newService, file: filePath });
  existingLiveServiceHosts.push(startLinkHost);
  existingStartPages.add(startPage);
}
