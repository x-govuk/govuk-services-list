import fs from "node:fs";
import path from "node:path";

import govukPrototypeFilters from "@x-govuk/govuk-prototype-filters";

import ignoredVerbs from "../data/ignored-verbs.json" with { type: "json" };

export const getServices = async () => {
  const services = new Set();
  const servicesPath = path.join(import.meta.dirname, "..", "data", "services");
  const serviceFilenames = fs
    .readdirSync(servicesPath)
    .filter((filename) => filename !== "_template.json")
    .filter((filename) => filename.endsWith(".json"));

  for await (const filename of serviceFilenames) {
    const servicePath = path.join(servicesPath, filename);

    const { default: service } = await import(servicePath, {
      with: { type: "json" },
    });

    service.slug = filename.replace(".json", "");

    if (!Array.isArray(service.organisation)) {
      service.organisation = [service.organisation];
    }

    if (!Array.isArray(service.startPage)) {
      if (service.startPage) {
        service.startPage = [service.startPage];
      } else {
        service.startPage = [];
      }
    }

    const screenshotFile = path.join(
      import.meta.dirname,
      "..",
      "app",
      "assets",
      "images",
      "service-screenshots",
      `${service.slug}.png`,
    );

    if (fs.existsSync(screenshotFile)) {
      service.screenshot = true;
    }

    if (service.liveService) {
      const { hostname } = new URL(service.liveService);
      service.domain = hostname.replace(/^www\.(?!gov\.uk(?:\/|$))/, "");
    }

    const verb = service.name.split(" ")[0].toLowerCase();
    if (!ignoredVerbs.includes(verb)) {
      service.verb = verb;
    }

    services.add(service);
  }

  return [...services];
};

export const getEvents = (services) => {
  const events = new Set();

  for (const service of services) {
    if (service.timeline) {
      for (const item of service.timeline.items) {
        events.add({
          service: {
            name: service.name,
            slug: service.slug,
          },
          date: item.date,
          label: item.label,
        });
      }
    }
  }

  return [...events];
};

export const getOrganisations = (services) => {
  const serviceOrganisations = services
    .filter((service) => service.organisation?.length > 0)
    .flatMap((service) =>
      service.organisation.map((organisation) => ({ service, organisation })),
    );

  const servicesGroupedByOrganisation = Object.groupBy(
    serviceOrganisations,
    (service) => service.organisation,
  );

  const organisations = Object.entries(servicesGroupedByOrganisation)
    .map(([organisation, services]) => ({
      name: organisation,
      slug: govukPrototypeFilters.slugify(organisation),
      count: services.length,
      services: services.map((service) => service.service),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return organisations;
};

export const getAtoZ = (services) => {
  const servicesGroupedByFirstLetter = Object.groupBy(services, (service) =>
    service.name.charAt(0).toLowerCase(),
  );

  const aToZ = Object.entries(servicesGroupedByFirstLetter)
    .map(([index, services]) => ({
      name: index.toUpperCase(),
      slug: index,
      count: services.length,
      services: services.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return aToZ;
};

export const getDomains = (services) => {
  const servicesGroupedByDomain = Object.groupBy(
    services
      .filter((service) => service.domain)
      .filter((service) => service.phase !== "Retired"),
    (service) => service.domain,
  );

  const domains = Object.entries(servicesGroupedByDomain)
    .map(([domain, services]) => ({
      name: domain,
      count: services.length,
      services,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return domains;
};

export const getVerbs = (services) => {
  const servicesGroupedByVerb = Object.groupBy(
    services.filter((service) => service.verb),
    (service) => service.verb,
  );

  const verbs = Object.entries(servicesGroupedByVerb)
    .filter(([, services]) => services.length > 1)
    .map(([verb, services]) => ({
      name: verb.charAt(0).toUpperCase() + verb.slice(1),
      slug: verb,
      count: services.length,
      services,
    }))
    .sort((a, b) => b.count - a.count);

  return verbs;
};
