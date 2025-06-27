import fs from "node:fs";

import govukPrototypeFilters from "@x-govuk/govuk-prototype-filters";

export const errorInternalController = (error, request, response, next) => {
  console.error(error.stack);
  response.status(500);
  response.render("500.njk", { error });
};

export const errorNotFoundController = (request, response) => {
  response.status(404);
  response.render("404.njk");
};

export const markdownController = (filepath, title) => {
  return (request, response) => {
    const content = fs.readFileSync(filepath).toString();
    const markdown = govukPrototypeFilters.govukMarkdown(content);

    response.render(`markdown.njk`, {
      markdown,
      title,
    });
  };
};

export const organisationController = (organisations) => {
  return (request, response, next) => {
    const { slug } = request.params;

    response.locals.section = "organisation";

    if (!slug) {
      return response.render("organisations.njk", { organisations });
    }

    // Organisation slugs previously used underscores
    // Rewrite slug to use hyphens and then permanently redirect to new page
    if (slug.includes("_")) {
      const newSlug = slug.replaceAll("_", "-");
      return response.redirect(301, `/organisation/${newSlug}`);
    }

    const organisation = organisations.find((org) => org.slug === slug);
    if (organisation) {
      return response.render("organisation.njk", { organisation });
    }

    next();
  };
};

export const projectController = (request, response, next) => {
  const { slug } = request.params;

  if (!slug) {
    return response.redirect(301, "/service");
  }

  response.redirect(301, `/service/${slug}`);
};

export const serviceController = (services) => {
  return (request, response, next) => {
    const { slug } = request.params;

    if (!slug) {
      return response.redirect("/");
    }

    const service = services.find((service) => service.slug === slug);
    if (service) {
      return response.render("service.njk", {
        productPage: true,
        service,
      });
    }

    next();
  };
};

export const screenshotController = (services) => {
  return (request, response, next) => {
    services = services.filter((service) => service.phase !== "Retired");

    return response.render("screenshots.njk", { services });
  };
};

export const viewController = (request, response, next) => {
  const view = request.params.view || "index";

  response.render(`${view}.njk`, {
    productPage: view === "index",
  });
};
