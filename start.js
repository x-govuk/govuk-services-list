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

app.locals.allEvents = [];
app.locals.organisations = organisations;
app.locals.phases = phases;
app.locals.services = [];
app.locals.themes = themes;

const servicesDirectory = path.join(import.meta.dirname, "/app/services/");

fs.readdirSync(servicesDirectory).forEach(function (filename) {
  if (filename !== "_template.json" && filename.endsWith(".json")) {
    const serviceFile = path.join(
      import.meta.dirname,
      "app/services",
      filename,
    );
    const service = JSON.parse(fs.readFileSync(serviceFile).toString());

    service.filename = filename;
    service.slug = filename.replace(".json", "");
    app.locals.services.push(service);

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
      if (
        !app.locals.organisations.find(function (org) {
          return org.name === organisation;
        })
      ) {
        app.locals.organisations.push({
          name: organisation,
          slug: govukPrototypeFilters.slugify(organisation),
        });
      }
    }

    const screenshotFile = path.join(
      import.meta.dirname,
      "app/assets/images/service-screenshots",
      `${service.slug}.png`,
    );

    if (fs.existsSync(screenshotFile)) {
      service.screenshot = true;
    }

    if (service.timeline) {
      for (const item of service.timeline.items) {
        app.locals.allEvents.push({
          service: {
            name: service.name,
            slug: service.slug,
          },
          date: item.date,
          label: item.label,
        });
      }
    }

    const phase = app.locals.phases.filter(function (p) {
      return p.name === service.phase;
    });

    if (phase.length > 0) {
      phase[0].projects_count += 1;
    }
  }
});

for (const organisation of app.locals.organisations) {
  organisation.slug = govukPrototypeFilters.slugify(organisation.name);
  organisation.services = app.locals.services.filter(function (service) {
    return service.organisation.includes(organisation.name);
  });
}

app.locals.verbs = [];
app.locals.domains = [];

const servicesWithValidVerbs = app.locals.services.filter((service) => {
  const verb = service.name.split(" ")[0].toLowerCase();
  return !ignoredVerbs.includes(verb);
});

for (const service of servicesWithValidVerbs) {
  const verb = service.name.split(" ")[0].toLowerCase();

  let existingVerb = app.locals.verbs.find((v) => v.name === verb);

  if (!existingVerb) {
    existingVerb = { name: verb, services: [], count: 0 };
    app.locals.verbs.push(existingVerb);
  }

  existingVerb.services.push(service);
  existingVerb.count += 1;
}

const servicesWithValidDomains = app.locals.services
  .filter((service) => service.liveservice)
  .filter((service) => service.phase !== "Retired")
  .filter((service) => {
    const { hostname } = new URL(service.liveservice);

    return hostname.replace(/www\./, "") !== "gov.uk";
  });

for (const service of servicesWithValidDomains) {
  const { hostname } = new URL(service.liveservice);

  const existingDomain = app.locals.domains.find(
    (domain) => domain.domain === hostname,
  );
  if (existingDomain) {
    existingDomain.services.push({
      slug: service.slug,
      name: service.name,
    });
  } else {
    app.locals.domains.push({
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

app.use(
  "/images",
  express.static(path.join(import.meta.dirname, "app/assets/images")),
);

app.use("/", express.static(path.join(import.meta.dirname, "static")));

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

app.get("/service/:slug", function (req, res) {
  const service = req.app.locals.services.filter(function (service) {
    return service.slug === req.params.slug;
  })[0];
  res.render("service.html", {
    service,
  });
});

app.get("/", function (req, res) {
  res.render(path.join(import.meta.dirname, "app/views/index.html"));
});

app.get("/a-z", function (req, res) {
  res.render(path.join(import.meta.dirname, "app/views/a-z.html"));
});

app.get("/topic", function (req, res) {
  res.render(path.join(import.meta.dirname, "app/views/topic.html"));
});

app.get("/organisation", function (req, res) {
  res.render("organisations.html");
});

app.get("/phase", function (req, res) {
  res.render("phase.html");
});

app.get("/top-75", function (req, res) {
  res.render("top-75.html");
});

app.get("/govuk-one-login", function (req, res) {
  res.render("govuk-one-login.html");
});

app.get("/original-25-exemplars", function (req, res) {
  res.render("original-25-exemplars.html", { exemplars });
});

app.get("/organisation/:slug", function (req, res) {
  const organisation = app.locals.organisations.find(function (org) {
    return org.slug === req.params.slug;
  });
  if (organisation) {
    res.render("organisation.html", { organisation });
  } else {
    res.status(404).send("Page not found");
  }
});

app.get("/contribute", function (req, res) {
  res.render("contribute.html");
});

app.get("/verbs", function (req, res) {
  res.render("verbs.html");
});

app.get("/screenshots", function (req, res) {
  res.render("screenshots.html");
});

app.get("/domains", function (req, res) {
  res.render("domains.html");
});

app.get("/source-code", function (req, res) {
  res.render("source-code.html");
});

app.get("/data", function (req, res) {
  res.render("data.html");
});

app.get("/data.json", function (req, res) {
  // res.setHeader('Content-Type', 'application/json');
  res.json({ services: app.locals.services });
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`),
);
