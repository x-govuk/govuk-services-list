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

// Collect the live service URLs of all services that already have one
const existingLiveServiceUrls = new Set(
  existingServices.flatMap((service) => {
    if (!service.liveService) return [];
    return Array.isArray(service.liveService)
      ? service.liveService
      : [service.liveService];
  }),
);

const results = await getGovukPages({ format: "transaction" });

for (const result of results) {
  // Fetch the content API to find the transaction start link
  const contentUrl = `https://www.gov.uk/api/content${result.link}`;
  const contentResponse = await fetch(contentUrl);

  if (!contentResponse.ok) {
    console.error(
      `Content API error for ${result.link}: ${contentResponse.status}`,
    );
    continue;
  }

  const content = await contentResponse.json();

  const liveService = content.details?.transaction_start_link;
  if (!liveService) continue;

  let liveServiceHost;
  try {
    liveServiceHost = new URL(liveService).hostname;
  } catch {
    continue;
  }

  if (existingLiveServiceUrls.has(liveService)) continue;
  if (!liveServiceHost.endsWith(".service.gov.uk")) continue;

  // Extract subdomain (e.g. "something" from "something.service.gov.uk")
  // Hostname must have at least 4 parts: <subdomain>.service.gov.uk
  const hostParts = liveServiceHost.split(".");
  if (hostParts.length < 4) continue;
  const subdomain = hostParts.at(-4);

  const startPage = `https://www.gov.uk${result.link}`;

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

  const existingServiceWithSameStartPage = existingServices.find(
    (s) => s.startPage === startPage,
  );

  if (existingServiceWithSameStartPage) {
    // Update the liveService URL on the existing record
    const serviceToWrite = { ...existingServiceWithSameStartPage };
    delete serviceToWrite.file;
    serviceToWrite.liveService = liveService;

    fs.writeFileSync(
      existingServiceWithSameStartPage.file,
      `${JSON.stringify(serviceToWrite, null, 2)}\n`,
      "utf-8",
    );
  } else {
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
    existingLiveServiceUrls.add(liveService);
  }
}
