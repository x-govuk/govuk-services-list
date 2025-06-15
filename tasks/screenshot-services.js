const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');

const puppeteer = require('puppeteer-core');

const useHeadless = false; // set to false for services which prevent screen-scraping
const delayInSeconds = 2; // add a delay for services which use slow client-side rendering

require('dotenv').config();

// Display a helpful error if path to Google Chrome is missing
if (!Object.keys(process.env).includes('GOOGLE_CHROME_PATH')) {
  console.error("Error: Missing path for Google Chrome application.\n\nAdd GOOGLE_CHROME_PATH=\"/path/to/Chrome\" to a file named .env\n\nFor example, on Mac OS add GOOGLE_CHROME_PATH=\"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome\"")
  process.exit()
}

// Specific services to screenshot can be specified as command line arguments
let services = process.argv.slice(2)

const servicesToSkip = [
  "analyse-school-performance",
  "applications-manage-authority",
  "apply-for-plant-export-certificates-and-inspections",
  "book-pupil-theory-test",
  "book-your-driving-test",
  "book-your-theory-test",
  "check-mot-history",
  "check-vehicle-compatibility-e10-petrol",
  "check-vehicle-recalls",
  "claim-chargepoint-grants",
  "claim-tax-relief-for-expenses-of-employment",
  "comply-chemical-regulations",
  "company-car-tax",
  "consular-appointments",
  "create-a-uk-catch-certificate",
  "debt-respite-breathing-space",
  "drone-registration",
  "find-energy-certificate",
  "find-property-information",
  "get-help-with-esfa-services",
  "give-feedback-on-care",
  "goods-vehicle-movement-service",
  "help-to-save",
  "join-childcare-register",
  "local-land-charges",
  "log-coronavirus-test-site-results",
  "manage-fleet-vehicles",
  "money-claims",
  "money-laundering-supervision",
  "mot-testing",
  "online-crime-reporting",
  "overseas-crisis",
  "recruit-an-apprentice",
  "register-for-the-soft-drinks-industry-levy",
  "register-nursery-daycare",
  "register-trailer",
  "relief-at-source",
  "report-nursery-daycare-changes",
  "sign-mortgage-deed",
  "sorn",
  "support-t-levels",
  "vehicle-operator-licensing",
  "vehicle-tax",
  "view-designs-journal",
  "view-the-orphan-works-register"
]

const servicesFolder = path.join(__dirname, '..', 'app', 'services');
const screenshotsFolder = path.join(__dirname, '..', 'app', 'assets', 'images', 'service-screenshots');

if (services.includes('all')) {
  services = []
  fs.readdirSync(servicesFolder).forEach(function(filename) {
    if (filename !== '_template.json' && !servicesToSkip.includes(filename.replace('.json', ''))) {
      services.push(filename.replace('.json', ''))
    }
  });
}

if (services.length === 0) {
  console.log("npm run screenshots <command>\n")
  console.log('Usage:')
  console.log('npm run screenshots <filename>   Collect a screenshot for the service in the filename given (.json can be omitted)')
  console.log('npm run screenshots all        Collect screenshots for all non-retired services')
  process.exit()
}


(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.GOOGLE_CHROME_PATH,
    headless: useHeadless
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1080,
    height: 1080,
    deviceScaleFactor: 2,
  });

  for (let service of services) {

    service = service.replace('.json', '');

    const project = JSON.parse(fs.readFileSync(`${servicesFolder  }/${  service  }.json`).toString());

    if (project.liveservice && project.phase !== 'Retired') {
      try {
        await page.goto(project.liveservice);
        await page.mouse.click(0, 0, {
          delay: (delayInSeconds * 1000)
        });
        await page.screenshot({ path: `${screenshotsFolder  }/${  service  }.png` });
        process.stdout.write('.')
      } catch(error) {
        console.warn(`Error fetching ${  project.liveservice}`)
        console.error(error)
      }
    }
  }

  await browser.close();
})();
