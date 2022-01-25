const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const process = require('process');

const servicesFolder = path.join(__dirname, '..', 'app', 'services');
const screenshotsFolder = path.join(__dirname, '..', 'app', 'assets', 'images', 'service-screenshots');

var screenshotsToTake = [];

fs.readdirSync(servicesFolder).forEach(function(filename) {
  if (filename != '_template.json') {
    var project = JSON.parse(fs.readFileSync(servicesFolder + '/' + filename).toString());
    if (project.liveservice && project.phase != 'retired') {
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
      console.warn(error)
    }
  }

  await browser.close();
})();
