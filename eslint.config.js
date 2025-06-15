import xGovukConfig from "@x-govuk/eslint-config";

export default [
  ...xGovukConfig,
  {
    ignores: ["dist", "_site"],
  },
];
