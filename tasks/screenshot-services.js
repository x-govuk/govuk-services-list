const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const process = require('process');

const servicesFolder = path.join(__dirname, '..', 'app', 'services');
const screenshotsFolder = path.join(__dirname, '..', 'app', 'assets', 'images', 'service-screenshots');

var screenshotsToTake = [];

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

fs.readdirSync(servicesFolder).forEach(function(filename) {
  if (filename != '_template.json') {
    var project = JSON.parse(fs.readFileSync(servicesFolder + '/' + filename).toString());
    if (project.liveservice && project.phase != 'retired' && !servicesToSkip.includes(filename.replace('.json', ''))) {
      screenshotsToTake.push({url: project.liveservice, service: filename.replace('.json', '')})
    }
  }
});

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({
    width: 1080,
    height: 1080,
    deviceScaleFactor: 2,
  });

  for (screenshotToTake of screenshotsToTake) {
    try {
      await page.goto(screenshotToTake.url);
      await page.screenshot({ path: screenshotsFolder + '/' + screenshotToTake.service + '.png' });
      process.stdout.write('.')
    } catch(error) {
      console.warn('Error fetching ' + screenshotToTake.url)
    }
  }

  await browser.close();
})();
