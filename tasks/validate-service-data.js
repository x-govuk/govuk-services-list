import fs from "node:fs";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const servicesPath = path.join(import.meta.dirname, "..", "data", "services");
const schemaPath = path.join(import.meta.dirname, "..", "data", "service.schema.json");

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const validate = ajv.compile(schema);

const files = fs
  .readdirSync(servicesPath)
  .filter((filename) => filename.endsWith(".json"))
  .filter((filename) => filename !== "_template.json")
  .sort();

let hasErrors = false;

for (const filename of files) {
  const filePath = path.join(servicesPath, filename);

  let service;

  try {
    service = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    hasErrors = true;
    console.error(`${filename}`);
    console.error(`  Invalid JSON: ${error.message}`);
    continue;
  }

  const isValid = validate(service);

  if (!isValid) {
    hasErrors = true;
    console.error(`${filename}`);

    for (const error of validate.errors) {
      const instancePath = error.instancePath || "/";
      const property = error.params?.additionalProperty;
      const suffix = property ? ` (${property})` : "";

      console.error(`  ${instancePath} ${error.message}${suffix}`);
    }
  }
}

if (hasErrors) {
  process.exitCode = 1;
  console.error("\nService data validation failed.");
} else {
  console.info(`Validated ${files.length} service files against data/service.schema.json`);
}
