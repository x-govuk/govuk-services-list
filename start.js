import path from "node:path";

import express from "express";

import exemplars from "./data/exemplars.json" with { type: "json" };
import phases from "./data/phases.json" with { type: "json" };
import themes from "./data/themes.json" with { type: "json" };
import {
  errorInternalController,
  errorNotFoundController,
  markdownController,
  organisationController,
  projectController,
  screenshotController,
  serviceController,
  viewController,
  appsController,
} from "./lib/controllers.js";
import {
  getAtoZ,
  getDomains,
  getEvents,
  getOrganisations,
  getServices,
  getVerbs,
} from "./lib/data.js";
import { nunjucksEnv } from "./lib/nunjucks.js";

const services = await getServices();
const organisations = getOrganisations(services);

const app = express();
const port = process.env.PORT || 3100;

nunjucksEnv(app);

app.locals.aToZ = getAtoZ(services);
app.locals.domains = getDomains(services);
app.locals.events = getEvents(services);
app.locals.exemplars = exemplars;
app.locals.organisations = organisations;
app.locals.phases = phases;
app.locals.services = services;
app.locals.themes = themes;
app.locals.verbs = getVerbs(services);

app.use("/", express.static("static"));
app.use("/images", express.static("app/assets/images"));

const contributingFile = path.join(import.meta.dirname, "CONTRIBUTING.md");

app.get("/organisation{/:slug}", organisationController(organisations));
app.get("/projects{/:slug}", projectController);
app.get("/screenshots", screenshotController(services));
app.get("/apps", appsController(services));
app.get("/service{/:slug}", serviceController(services));
app.get("/data.json", (request, response) => response.json({ services }));
app.get("/contribute", markdownController(contributingFile, "Contributing"));
app.get("{/:view}", viewController);

app.use(errorNotFoundController, errorInternalController);

app.listen(port, () =>
  console.info(`App listening at http://localhost:${port}`),
);
