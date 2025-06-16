import fs from "node:fs";
import path from "node:path";

import govukPrototypeFilters from "@x-govuk/govuk-prototype-filters";

export const getServices = async () => {
  const services = new Set();
  const servicesPath = path.join(import.meta.dirname, "..", "app", "services");
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

    if (!Array.isArray(service["start-page"])) {
      if (service["start-page"]) {
        service["start-page"] = [service["start-page"]];
      } else {
        service["start-page"] = [];
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
