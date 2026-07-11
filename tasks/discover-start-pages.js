import ignoredStartPages from "../data/ignored-start-pages.json" with { type: "json" };
import { getServices } from "../lib/data.js";
import { getTransactionResults } from "../lib/search-api.js";

const services = await getServices();
const existingStartPages = [];
const newStartPages = [];

for (const service of services) {
  const startPages = service.startPage;

  if (Array.isArray(startPages)) {
    existingStartPages.push(...startPages);
  } else if (startPages) {
    existingStartPages.push(startPages);
  }
}

try {
  const results = await getTransactionResults();

  const startPages = results.map(
    (result) => `https://www.gov.uk${result.link}`,
  );

  for (const startPage of startPages) {
    if (
      !existingStartPages.includes(startPage) &&
      !ignoredStartPages.includes(startPage)
    ) {
      newStartPages.push(startPage);
    }
  }

  console.log(`${newStartPages.length} new start pages found:\n`);
  for (const startPage of newStartPages.sort()) {
    console.log(startPage);
  }
} catch (error) {
  console.error(error.message);
}
