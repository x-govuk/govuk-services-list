# UK Government digital services

A community-maintained list of digital services from the UK government.

## Data sources

* [Service Standard Reports](https://www.gov.uk/service-standard-reports)
* [Services on GOV.UK](https://www.gov.uk/search/services)
* [UK government accounts on GitHub](https://government.github.com/community/#governments-uk-central)

### Previous data sources

* [Government Service Register](https://government-service.register.gov.uk) (no longer maintained)
* [Performance Platform](https://www.gov.uk/performance) (no longer maintained)
* [DWP Digital Service Portfolio](http://dwp-digital-services.herokuapp.com/)
* [HMPPS Digital Studio](https://github.com/noms-digital-studio/hmpps-portfolio)
* [Land Registry Digital Services](https://github.com/LandRegistry/lr-portfolio)

## How to run this project

You'll need
1. Node 12 or above
2. NPM (should come with Node 4 and above :))

Using a command line run

```bash
npm install
npm start
```

## How to add or update screenshots

Screenshots of services (the first page) can be added automatically by running a script.

First, you need to have the latest version of [Google Chrome](https://www.google.com/chrome/) installed.

You then need to tell the script exactly where this is installed on your computer. Add the full path to the
Google Chrome executable by adding it to a file named `.env` (in the same folder as this README file), using this
named environment variable:

`GOOGLE_CHROME_PATH=""`

For example, on a Mac, this may be something like this:

`GOOGLE_CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`

Once this is set up, you can run the script to add the screenshots using this command:

`npm run screenshots register-to-vote`

Substitute `register-to-vote` with the name of the file for the service you want to screenshot.

You can also update all the screenshots (which will take a while) by running this:

`npm run screenshots all`

Screenshots will be saved in the `app/assets/images/service-screenshots` folder, using the same name as the json file
within `app/services`. Images are all 2160x2160 pixels (1080x1080 at 2x resolution), and will be rendered with no cookies
set (and so will include any cookie banner).


