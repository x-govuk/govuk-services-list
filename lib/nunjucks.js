import govukPrototypeFilters from "@x-govuk/govuk-prototype-filters";
import nunjucks from "nunjucks";
import "dotenv/config";

export const nunjucksEnv = (app) => {
  const views = [
    "app/views/",
    "node_modules/govuk-frontend/dist",
    "node_modules/@x-govuk/govuk-prototype-components/src",
  ];

  const options = {
    autoescape: true,
    express: app,
    watch: process.env.NODE_ENV === "development",
  };

  const env = nunjucks.configure(views, options);

  env.addFilter("find", (array, key, value) =>
    array.find((item) => item[key] === value),
  );

  env.addFilter("govukDate", govukPrototypeFilters.govukDate);

  env.addFilter("plural", govukPrototypeFilters.plural);

  env.addFilter("slugify", govukPrototypeFilters.slugify);

  return env;
};
