const fs = require('fs');
const path = require('path');

let existingStartPages = []
let newStartPages = []

const servicesFolder = path.join(__dirname, '..', 'app', 'services');
const tasksFolder = path.join(__dirname, '..', 'tasks');
var services = []

fs.readdirSync(servicesFolder).forEach(function(filename) {
    if (filename != '_template.json' && filename.endsWith('.json')) {
      services.push(filename.replace('.json', ''))
    }
});

const ignoredStartPages = fs.readFileSync(tasksFolder + '/ignored_start_page_urls.txt').toString().split('\n')

for (service of services) {
  service = service.replace('.json', '');

  var project = JSON.parse(fs.readFileSync(servicesFolder + '/' + service + '.json').toString());

  const startPages = project['start-page']

  if (Array.isArray(startPages)) {
    existingStartPages.push(...startPages)
  } else if (startPages) {
    existingStartPages.push(startPages)
  }
}

async function getData() {
  const url = "https://www.gov.uk/api/search.json?filter_format=transaction&count=1000&start=0";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    const results = json.results;

    const startPages = results.map((result) => `https://www.gov.uk${result.link}`)

    for (startPage of startPages) {
      if (!existingStartPages.includes(startPage) && !ignoredStartPages.includes(startPage)) {
        newStartPages.push(startPage)
      }
    }

    console.log(`${newStartPages.length} new start pages found:\n`)
    for (startPage of newStartPages.sort()) {
      console.log(startPage)
    }
  } catch (error) {
    console.error(error.message);
  }
}

getData();
