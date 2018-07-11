# Government Digital Services

Feed this thing data or it will die!

Data sources:
* [Government Organisation Register](https://government-organisation.register.gov.uk/)
* [Government Service Register](https://government-service.register.gov.uk)
* [Service Standard Assessments](https://www.gov.uk/service-standard-reports)
* [Performance Platform](https://www.gov.uk/performance)


Existing portfolios I have partially or entirely cannibalised for this:

* [DWP Digital Service Portfolio](http://dwp-digital-services.herokuapp.com/)
* [HMPPS Digital Studio](https://github.com/noms-digital-studio/hmpps-portfolio)
* [Land Registry](https://github.com/LandRegistry/lr-portfolio)

## How to run this project

You'll need
1. Node 4 or above
2. NPM (should come with Node 4 and above :))

Using a command line run

```bash
npm install
npm start
```
Alternatively, you can use Docker to avoid installing anything apart from Docker.
```
docker build -t service-catalogue /path/to/Dockerfile
docker run -d -p 3100:3100 service-catalogue
```
and point your browser to localhost:3100
