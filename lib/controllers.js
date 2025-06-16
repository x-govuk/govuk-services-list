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

    if (!slug) {
      return response.render("organisations.njk", { organisations });
    }

    const organisation = organisations.find((org) => org.slug === slug);
    if (organisation) {
      return response.render("organisation.njk", { organisation });
    }

    next();
  };
};

export const serviceController = (services) => {
  return (request, response, next) => {
    const { slug } = request.params;

    if (!slug) {
      return response.redirect("/", { services });
    }

    const service = services.find((service) => service.slug === slug);
    if (service) {
      return response.render("service.njk", { service });
    }

    next();
  };
};

export const viewController = (request, response, next) => {
  const view = request.params.view || "index";

  response.render(`${view}.njk`);
};
