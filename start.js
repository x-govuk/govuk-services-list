import fs from "node:fs";
import path from "node:path";

import govukPrototypeFilters from "@x-govuk/govuk-prototype-filters";
import express from "express";
import nunjucks from "nunjucks";

const app = express();
const port = process.env.PORT || 3100;

app.locals.phases = [
  {
    name: "Unknown",
    class: "",
    projects_count: 0,
  },
  {
    name: "Retired",
    class: "grey",
    projects_count: 0,
  },
  {
    name: "Alpha",
    class: "purple",
    projects_count: 0,
  },
  {
    name: "Beta",
    class: "pink",
    projects_count: 0,
  },
  {
    name: "Live",
    class: "green",
    projects_count: 0,
  },
];

app.locals.themes = [
  "Benefits",
  "Births, deaths, marriages and care",
  "Business and self-employed",
  "Childcare and parenting",
  "Citizenship and living in the UK",
  "Crime, justice and the law",
  "Driving and transport",
  "Education, training and skills",
  "Employing people",
  "Environment and countryside",
  "Housing and local services",
  "Government Internal",
  "Health",
  "Money and tax",
  "Passports, travel and living abroad",
  "Visas and immigration",
  "Working, jobs and pensions",
  "Coronavirus (COVID-19)",
];

app.locals.organisations = [
  { name: "Cabinet Office" },
  { name: "Department for Business and Trade" },
  { name: "Department for Education" },
  { name: "Department for Environment, Food & Rural Affairs" },
  { name: "Department for International Trade" },
  { name: "Ministry of Housing, Communities & Local Government" },
  { name: "Department for Transport" },
  { name: "Department for Work and Pensions" },
  { name: "Department of Health and Social Care" },
  { name: "Department for Energy Security and Net Zero" },
  { name: "Foreign, Commonwealth & Development Office" },
  { name: "Home Office" },
  { name: "Ministry of Defence" },
  { name: "Ministry of Justice" },
  { name: "HM Revenue and Customs" },
  { name: "Environment Agency" },
  { name: "NHS England" },
  { name: "Companies House" },
  { name: "Ofsted" },
  { name: "Insolvency Service" },
  { name: "Land Registry" },
];

app.locals.allEvents = [];

app.locals.projects = [];

const servicesDirectory = path.join(import.meta.dirname, "/app/services/");

fs.readdirSync(servicesDirectory).forEach(function (filename) {
  if (filename !== "_template.json" && filename.endsWith(".json")) {
    const projectFile = path.join(
      import.meta.dirname,
      "app/services",
      filename,
    );
    const project = JSON.parse(fs.readFileSync(projectFile).toString());

    project.filename = filename;
    project.slug = filename.replace(".json", "");
    app.locals.projects.push(project);

    if (!Array.isArray(project.organisation)) {
      project.organisation = [project.organisation];
    }

    if (!Array.isArray(project["start-page"])) {
      if (project["start-page"]) {
        project["start-page"] = [project["start-page"]];
      } else {
        project["start-page"] = [];
      }
    }

    for (const organisation of project.organisation) {
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
      `${project.slug}.png`,
    );

    if (fs.existsSync(screenshotFile)) {
      project.screenshot = true;
    }

    if (project.timeline) {
      for (const item of project.timeline.items) {
        app.locals.allEvents.push({
          service: {
            name: project.name,
            slug: project.slug,
          },
          date: item.date,
          label: item.label,
        });
      }
    }

    const phase = app.locals.phases.filter(function (p) {
      return p.name === project.phase;
    });

    if (phase.length > 0) {
      phase[0].projects_count += 1;
    }
  }
});

for (const organisation of app.locals.organisations) {
  organisation.slug = govukPrototypeFilters.slugify(organisation.name);
  organisation.services = app.locals.projects.filter(function (service) {
    return service.organisation.includes(organisation.name);
  });
}

app.locals.verbs = [];
app.locals.domains = [];

const ignoredVerbs = [
  "gov.uk",
  "trade",
  "home",
  "flood",
  "electronic",
  "digital",
  "registered",
  "application",
  "online",
  "payment",
  "passport",
  "vehicle",
  "the",
  "civil",
  "supplier",
];

const projectsWithValidVerbs = app.locals.projects.filter((project) => {
  const verb = project.name.split(" ")[0].toLowerCase();
  return !ignoredVerbs.includes(verb);
});

for (const project of projectsWithValidVerbs) {
  const verb = project.name.split(" ")[0].toLowerCase();

  let existingVerb = app.locals.verbs.find((v) => v.name === verb);

  if (!existingVerb) {
    existingVerb = { name: verb, services: [], count: 0 };
    app.locals.verbs.push(existingVerb);
  }

  existingVerb.services.push(project);
  existingVerb.count += 1;
}

const projectsWithValidDomains = app.locals.projects
  .filter((project) => project.liveservice)
  .filter((project) => project.phase !== "Retired")
  .filter((project) => {
    const { hostname } = new URL(project.liveservice);

    return hostname.replace(/www\./, "") !== "gov.uk";
  });

for (const project of projectsWithValidDomains) {
  const { hostname } = new URL(project.liveservice);

  const existingDomain = app.locals.domains.find(
    (domain) => domain.domain === hostname,
  );
  if (existingDomain) {
    existingDomain.services.push({ slug: project.slug, name: project.name });
  } else {
    app.locals.domains.push({
      domain: hostname,
      services: [{ slug: project.slug, name: project.name }],
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

app.get("/projects/:slug", function (req, res) {
  const project = req.app.locals.projects.filter(function (p) {
    return p.slug === req.params.slug;
  })[0];
  res.render("project.html", {
    project,
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
  const exemplars = {
    "cabinet-office": ["register-to-vote"],
    "Department for Business Innovation & Skills": [
      "find-apprenticeship",
      "redundancy-payments",
      "patent",
      "find-property-information",
      "student-finance-account",
    ],
    "department-for-environment-food-rural-affairs": [
      "waste-carriers-registration",
      "rural-payments",
    ],
    "department-for-transport": [
      "view-driving-record",
      "personalised-vehicle-registration",
      "register-vehicle",
    ],
    "department-for-work-and-pensions": [
      "carers-allowance",
      "personal-independence-payment",
      "universal-credit",
    ],
    "hm-revenue-and-customs": [
      "company-car-tax",
      "pay-self-assessment",
      "tax-business-account",
      "agent-services-account",
    ],
    "home-office": [
      "registered-traveller",
      "passport",
      "visas-and-immigration",
    ],
    "ministry-of-justice": [
      "money-claims",
      "employment-tribunal",
      "prison-visits",
      "lasting-power-of-attorney",
    ],
  };

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
  res.json({ services: app.locals.projects });
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`),
);
