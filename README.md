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

You’ll need

1. Node 20
2. NPM

Using a command line run

```bash
npm install
npm start
```

## How to add or update screenshots

Screenshots for service landing or home pages can be added automatically by running a script.

First, you need to have the latest version of [Google Chrome](https://www.google.com/chrome/) installed.

To tell the script where the Google Chrome executable is located on your computer, create a file named `.env` (in the same folder as this `README.md` file) and add this named environment variable:

`GOOGLE_CHROME_PATH=""`

For example, on a Mac, this may be something like this:

`GOOGLE_CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`

Once this is set up, you can run the script to add the screenshots using this command:

`npm run screenshots register-to-vote`

Substitute `register-to-vote` with the name of the file for the service you want to screenshot.

You can also update all the screenshots (which will take a while) by running this command:

`npm run screenshots all`

Screenshots will be saved in the `app/assets/images/service-screenshots` folder, using the same name as the json file within `app/services`. Images are all 2160×2160 pixels (1080x1080 at 2× resolution), and will be rendered with no cookies set (so will include any cookie banner).


