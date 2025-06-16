import fs from "node:fs";
import path from "node:path";

import govukPrototypeFilters from "@x-govuk/govuk-prototype-filters";
import express from "express";

import exemplars from "./data/exemplars.json" with { type: "json" };
import ignoredVerbs from "./data/ignored-verbs.json" with { type: "json" };
import phases from "./data/phases.json" with { type: "json" };
import themes from "./data/themes.json" with { type: "json" };
import { getEvents, getOrganisations, getServices } from "./lib/data.js";
import { nunjucksEnv } from "./lib/nunjucks.js";

const app = express();
const port = process.env.PORT || 3100;

nunjucksEnv(app);

const services = await getServices();
const organisations = getOrganisations(services);

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

let aToZ = Object.groupBy(services, (service) =>
  service.name.charAt(0).toUpperCase(),
);

aToZ = Object.entries(aToZ)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([index, services]) => ({
    index,
    services: services.sort((a, b) => a.name.localeCompare(b.name)),
  }));

app.locals.aToZ = aToZ;
app.locals.domains = domains;
app.locals.events = getEvents(services);
app.locals.exemplars = exemplars;
app.locals.organisations = organisations;
app.locals.phases = phases;
app.locals.services = services;
app.locals.themes = themes;
app.locals.verbs = verbs;

app.use("/", express.static("static"));

app.use("/images", express.static("app/assets/images"));

app.get("/", (request, response) => {
  response.render("index.njk");
});

app.get("/organisation{/:slug}", (request, response, next) => {
  const { slug } = request.params;

  if (!slug) {
    return response.render("organisations.njk");
  }

  const organisation = organisations.find((org) => org.slug === slug);
  if (organisation) {
    return response.render("organisation.njk", { organisation });
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
    return response.render("service.njk", { service });
  }

  next();
});

app.get("/data.json", (request, response) => {
  response.json({ services });
});

app.get("/contribute", (request, response) => {
  const contributingFile = path.join(import.meta.dirname, "CONTRIBUTING.md");
  const content = fs.readFileSync(contributingFile).toString();
  const markdown = govukPrototypeFilters.govukMarkdown(content);

  response.render(`markdown.njk`, {
    markdown,
    title: "Contribute",
  });
});

app.get("/:view", (request, response) => {
  response.render(`${request.params.view}.njk`);
});

app.use((request, response) => {
  response.status(404);
  response.render("404.njk");
});

app.use((error, request, response, next) => {
  console.error(error.stack);
  response.status(500);
  response.render("500.njk", { error });
});

app.listen(port, () =>
  console.log(`App listening at http://localhost:${port}`),
);
