import fs from "node:fs";
import path from "node:path";

import { getGovukPages } from "../lib/search-api.js";

const servicesPath = path.join(import.meta.dirname, "..", "data", "services");
// Match an anchor tag whose class attribute includes `govuk-button--start`.
// The lookahead lets the class attribute appear anywhere in the tag.
const startButtonTagPattern =
  /<a\b(?=[^>]*\bclass\s*=\s*(["'])[^"']*\bgovuk-button--start\b[^"']*\1)[^>]*>/;
// Match either quoted or unquoted href attributes and return the matching URL
// through named capture groups.
const hrefAttributePattern =
  /\bhref\s*=\s*(?:(?<quote>["'])(?<quotedUrl>[^"']+)\k<quote>|(?<unquotedUrl>[^\s>]+))/;
const pageFormats = [
  {
    format: "transaction",
    getLiveServiceUrl(content) {
      return content.details?.transaction_start_link;
    },
  },
  {
    format: "answer",
    getLiveServiceUrl(content) {
      const body = content.details?.body;
      if (!body) {
        return undefined;
      }

      const startButtonTagMatch = body.match(startButtonTagPattern);
      if (!startButtonTagMatch) {
        return undefined;
      }

      const hrefMatch = startButtonTagMatch[0].match(hrefAttributePattern);
      return hrefMatch?.groups?.quotedUrl ?? hrefMatch?.groups?.unquotedUrl;
    },
  },
];

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

const toArray = (value) => {
  if (value == null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const asStringOrArray = (values) => (values.length === 1 ? values[0] : values);

const normalizeLiveServiceUrl = (value) => {
  try {
    const url = new URL(value);
    url.protocol = "https:";

    return `${url.origin}${url.pathname.replace(/\/+$/, "")}${url.search}${url.hash}`;
  } catch {
    return undefined;
  }
};

const getNormalizedLiveServices = (value) => {
  const normalizedLiveServices = [];

  for (const liveService of toArray(value)) {
    const normalizedLiveService = normalizeLiveServiceUrl(liveService);

    if (
      normalizedLiveService &&
      !normalizedLiveServices.includes(normalizedLiveService)
    ) {
      normalizedLiveServices.push(normalizedLiveService);
    }
  }

  return normalizedLiveServices;
};

const writeService = (service) => {
  const serviceToWrite = { ...service };
  delete serviceToWrite.file;

  fs.writeFileSync(
    service.file,
    `${JSON.stringify(serviceToWrite, null, 2)}\n`,
    "utf-8",
  );
};

const getServiceByLiveService = (liveService) =>
  existingServices.find((service) =>
    getNormalizedLiveServices(service.liveService).includes(liveService),
  );

const getServiceByStartPage = (startPage) =>
  existingServices.find((service) =>
    toArray(service.startPage).includes(startPage),
  );

const updateStartPagesAndSynonyms = ({ service, startPage, pageTitle }) => {
  const currentStartPages = toArray(service.startPage);
  const nextStartPages = currentStartPages.includes(startPage)
    ? currentStartPages
    : [...currentStartPages, startPage];
  const currentSynonyms = service.synonyms ?? [];
  const nextSynonyms =
    pageTitle === service.name || currentSynonyms.includes(pageTitle)
      ? currentSynonyms
      : [...currentSynonyms, pageTitle];

  const startPagesChanged = nextStartPages.length !== currentStartPages.length;
  const synonymsChanged = nextSynonyms.length !== currentSynonyms.length;

  if (startPagesChanged || synonymsChanged) {
    service.startPage = asStringOrArray(nextStartPages);

    if (nextSynonyms.length > 0) {
      service.synonyms = nextSynonyms;
    }

    writeService(service);
  }
};

const updateLiveService = ({ service, liveService }) => {
  const currentLiveServices = getNormalizedLiveServices(service.liveService);
  const nextLiveServices = currentLiveServices.includes(liveService)
    ? currentLiveServices
    : [...currentLiveServices, liveService];
  const nextLiveServiceValue = asStringOrArray(nextLiveServices);

  if (JSON.stringify(service.liveService) !== JSON.stringify(nextLiveServiceValue)) {
    service.liveService = nextLiveServiceValue;
    writeService(service);
  }
};

const createService = ({
  content,
  liveService,
  result,
  subdomain,
  startPage,
}) => {
  const newService = {
    name: result.title,
    description: content.description ?? "",
    organisation: "** TODO **",
    theme: "** TODO **",
    phase: "** TODO **",
    liveService,
    startPage,
  };

  const organisations = content.links?.organisations ?? [];
  if (organisations.length > 0) {
    newService.organisation = organisations[0].title;
  }

  const filePath = path.join(servicesPath, `${subdomain}.json`);

  if (fs.existsSync(filePath)) {
    console.warn(
      `Skipping ${liveService}: file ${subdomain}.json already exists`,
    );
    return;
  }

  fs.writeFileSync(
    filePath,
    `${JSON.stringify(newService, null, 2)}\n`,
    "utf-8",
  );
  existingServices.push({ ...newService, file: filePath });
};

const processResult = async ({ getLiveServiceUrl, result }) => {
  const startPage = `https://www.gov.uk${result.link}`;
  const contentUrl = `https://www.gov.uk/api/content${result.link}`;
  const contentResponse = await fetch(contentUrl);

  if (!contentResponse.ok) {
    console.error(
      `Content API error for ${result.link}: ${contentResponse.status}`,
    );
    return;
  }

  const content = await contentResponse.json();
  const liveService = normalizeLiveServiceUrl(getLiveServiceUrl(content));
  if (!liveService) {
    return;
  }

  const existingServiceWithSameLiveService =
    getServiceByLiveService(liveService);
  if (existingServiceWithSameLiveService) {
    updateLiveService({
      service: existingServiceWithSameLiveService,
      liveService,
    });
    updateStartPagesAndSynonyms({
      service: existingServiceWithSameLiveService,
      startPage,
      pageTitle: result.title,
    });
    return;
  }

  let liveServiceHost;
  try {
    liveServiceHost = new URL(liveService).hostname;
  } catch {
    return;
  }

  if (!liveServiceHost.endsWith(".service.gov.uk")) {
    return;
  }

  const existingServiceWithSameStartPage = getServiceByStartPage(startPage);
  if (existingServiceWithSameStartPage) {
    updateLiveService({
      service: existingServiceWithSameStartPage,
      liveService,
    });
    return;
  }

  // Extract subdomain (e.g. "something" from "something.service.gov.uk")
  // Hostname must have at least 4 parts: <subdomain>.service.gov.uk
  const hostParts = liveServiceHost.split(".");
  if (hostParts.length < 4) {
    return;
  }

  const subdomain = hostParts.at(-4);
  createService({ content, liveService, result, startPage, subdomain });
};

for (const pageFormat of pageFormats) {
  const results = await getGovukPages({ format: pageFormat.format });

  for (const result of results) {
    await processResult({
      getLiveServiceUrl: pageFormat.getLiveServiceUrl,
      result,
    });
  }
}
