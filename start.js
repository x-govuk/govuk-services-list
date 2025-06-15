import fs from "node:fs";
import path from "node:path";

import govukPrototypeFilters from "@x-govuk/govuk-prototype-filters";
import express from "express";
import nunjucks from "nunjucks";

import exemplars from "./data/exemplars.json" with { type: "json" };
import ignoredVerbs from "./data/ignored-verbs.json" with { type: "json" };
import organisations from "./data/organisations.json" with { type: "json" };
import phases from "./data/phases.json" with { type: "json" };
import themes from "./data/themes.json" with { type: "json" };

const app = express();
const port = process.env.PORT || 3100;

const events = [];
const services = [];

const servicesDirectory = path.join(import.meta.dirname, "/app/services/");
fs.readdirSync(servicesDirectory).forEach((filename) => {
  if (filename !== "_template.json" && filename.endsWith(".json")) {
    const serviceFile = path.join(
      import.meta.dirname,
      "app/services",
      filename,
    );
    const service = JSON.parse(fs.readFileSync(serviceFile).toString());

    service.filename = filename;
    service.slug = filename.replace(".json", "");
    services.push(service);

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

    for (const organisation of service.organisation) {
      if (!organisations.find(({ name }) => name === organisation)) {
        organisations.push({
          name: organisation,
          slug: govukPrototypeFilters.slugify(organisation),
        });
      }
    }

    const screenshotFile = path.join(
      import.meta.dirname,
      "app",
      "assets",
      "images",
      "service-screenshots",
      `${service.slug}.png`,
    );

    if (fs.existsSync(screenshotFile)) {
      service.screenshot = true;
    }

    if (service.timeline) {
      for (const item of service.timeline.items) {
        events.push({
          service: {
            name: service.name,
            slug: service.slug,
          },
          date: item.date,
          label: item.label,
        });
      }
    }

    const phase = phases.filter((phase) => phase.name === service.phase);

    if (phase.length > 0) {
      phase[0].services_count += 1;
    }
  }
});

for (const organisation of organisations) {
  organisation.slug = govukPrototypeFilters.slugify(organisation.name);
  organisation.services = services.filter((service) =>
    service.organisation.includes(organisation.name),
  );
}

const verbs = [];

const servicesWithValidVerbs = services.filter((service) => {
  const verb = service.name.split(" ")[0].toLowerCase();
  return !ignoredVerbs.includes(verb);
});

for (const service of servicesWithValidVerbs) {
  const verb = service.name.split(" ")[0].toLowerCase();

  let existingVerb = verbs.find((v) => v.name === verb);

  if (!existingVerb) {
    existingVerb = { name: verb, services: [], count: 0 };
    verbs.push(existingVerb);
  }

  existingVerb.services.push(service);
  existingVerb.count += 1;
}

const domains = [];

const servicesWithValidDomains = services
  .filter((service) => service.liveservice)
  .filter((service) => service.phase !== "Retired")
  .filter((service) => {
    const { hostname } = new URL(service.liveservice);

    return hostname.replace(/www\./, "") !== "gov.uk";
  });

for (const service of servicesWithValidDomains) {
  const { hostname } = new URL(service.liveservice);

  const existingDomain = domains.find((domain) => domain.domain === hostname);
  if (existingDomain) {
    existingDomain.services.push({
      slug: service.slug,
      name: service.name,
    });
  } else {
    domains.push({
      domain: hostname,
      services: [
        {
          slug: service.slug,
          name: service.name,
        },
      ],
    });
  }
}

const env = nunjucks.configure(
  [
    "app/views/",
    "node_modules/govuk-frontend/dist",
    "node_modules/@x-govuk/govuk-prototype-components/src",
  ],
  {
    autoescape: true,
    express: app,
    watch: process.env.ENV === "development",
  },
);

env.addFilter("find", (array, key, value) =>
  array.find((item) => item[key] === value),
);

env.addFilter("govukDate", govukPrototypeFilters.govukDate);

env.addFilter("slugify", govukPrototypeFilters.slugify);

app.locals.domains = domains;
app.locals.events = events;
app.locals.exemplars = exemplars;
app.locals.organisations = organisations;
app.locals.phases = phases;
app.locals.services = services;
app.locals.themes = themes;
app.locals.verbs = verbs;

app.use("/", express.static("static"));

app.use("/images", express.static("app/assets/images"));

app.get("/", (request, response) => {
  response.render("index.html");
});

app.get("/organisation{/:slug}", (request, response, next) => {
  const { slug } = request.params;

  if (!slug) {
    return response.render("organisations.html");
  }

  const organisation = organisations.find((org) => org.slug === slug);
  if (organisation) {
    return response.render("organisation.html", { organisation });
  }

  next();
});

app.get("/service{/:slug}", (request, response, next) => {
  const { slug } = request.params;

  if (!slug) {
    return response.redirect("/");
  }

  const service = services.find((service) => service.slug === slug);
  if (service) {
    return response.render("service.html", { service });
  }

  next();
});

app.get("/data.json", (request, response) => {
  response.json({ services });
});

app.get("/:view", (request, response) => {
  response.render(`${request.params.view}.html`);
});

app.use((request, response) => {
  response.status(404);
  response.render("404.html");
});

app.use((error, request, response, next) => {
  console.error(error.stack);
  response.status(500);
  response.render("500.html", { error });
});

app.listen(port, () =>
  console.log(`App listening at http://localhost:${port}`),
);
