import ignoredStartPages from "../data/ignored-start-pages.json" with { type: "json" };
import { getServices } from "../lib/data.js";

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

async function getData() {
  const url =
    "https://www.gov.uk/api/search.json?filter_format=transaction&count=1000&start=0";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    const results = json.results;

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
}

getData();
