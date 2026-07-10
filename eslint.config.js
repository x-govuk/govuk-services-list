import xGovukConfig from "@x-govuk/eslint-config";

export default [
  ...xGovukConfig,
  {
    ignores: ["static"],
  },
  {
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
