const express = require('express')
const fs = require('fs')
const app = express()
const port = process.env.PORT || 3100
var path = require('path');
var nunjucks = require('nunjucks')

app.locals.phases = [
  {
    name: "unknown",
    class: "",
    projects_count: 0
  },
  {
    name: "alpha",
    class: "purple",
    projects_count: 0
  },
  {
    name: "beta",
    class: "pink",
    projects_count: 0
  },
  {
    name: "live",
    class: "green",
    projects_count: 0
  },
  {
    name: "retired",
    class: "grey",
    projects_count: 0
  }
]

app.locals.themes = [
  'Coronavirus (COVID-19)',
  'Benefits',
  'Births, deaths, marriages and care',
  'Business and self-employed',
  'Childcare and parenting',
  'Citizenship and living in the UK',
  'Crime, justice and the law',
  'Disabled people',
  'Driving and transport',
  'Education, training and skills',
  'Employing people',
  'Environment and countryside',
  'Housing and local services',
  'Government Internal',
  'Money and tax',
  'Passports, travel and living abroad',
  'Visas and immigration',
  'Working, jobs and pensions',
];

app.locals.organisations = [
  'Cabinet Office',
  'Department for Business, Energy & Industrial Strategy',
  'Department for Education',
  'Department for Environment, Food & Rural Affairs',
  'Department for International Trade',
  'Department for Levelling Up, Housing & Communities',
  'Department for Transport',
  'Department for Work and Pensions',
  'Department of Health and Social Care',
  'Foreign, Commonwealth & Development Office',
  'Home Office',
  'Ministry of Defence',
  'Ministry of Justice',
  'HM Revenue and Customs',
  'Environment Agency',
  'NHS Digital',
  'Companies House',
  'Ofsted',
  'Insolvency Service',
  'Land Registry',
];

app.locals.projects = []

fs.readdirSync(__dirname + '/app/services/').forEach(function(filename) {

  if (filename != '_template.json') {
    var project = JSON.parse(fs.readFileSync(__dirname + '/app/services/' + filename).toString());

    project.filename = filename
    project.slug = filename.replace('.json', '');
    app.locals.projects.push(project)

    if (!app.locals.organisations.includes(project.organisation)) {
      app.locals.organisations.push(project.organisation)
    }

    if (fs.existsSync(__dirname + '/app/assets/images/service-screenshots/' + project.slug + '.png')) {
      project.screenshot = true
    }

    var phase = app.locals.phases.filter(function(p) { return p.name == project.phase })

    if (phase.length > 0) {
      phase[0].projects_count += 1;
    }
  }
})

app.locals.verbs = []

const ignoredVerbs = ["gov.uk", "trade", "home", "flood", "electronic", "digital", "registered", "application", "online", "payment", "passport"]

for (project of app.locals.projects) {
    const verb = project.name.split(" ")[0].toLowerCase()

    if (ignoredVerbs.includes(verb)) { continue }

    let existingVerb = app.locals.verbs.find(v => v.name == verb)

    if (!existingVerb) {
      existingVerb = {name: verb, services: [], count: 0}
      app.locals.verbs.push(existingVerb)
    }

    existingVerb.services.push({name: project.name, slug: project.slug})
    existingVerb.count += 1
}

app.use('/images', express.static(path.join(__dirname, 'app/assets/images')))

app.use('/', express.static(path.join(__dirname, 'static')))

var env = nunjucks.configure(['app/views/',
    'node_modules/govuk-frontend/'], {
    autoescape: true,
    express: app,
    watch: (process.env.ENV === 'development')
});

env.addFilter('slugify', function(str) {
  return str.replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()’]/g,"").replace(/ +/g,'_').toLowerCase();
});

env.addFilter('formatdate', function(str) {
  var date = new Date(str);

  var monthNames = {
    0: "January",
    1: "February",
    2: "March",
    3: "April",
    4: "May",
    5: "June",
    6: "July",
    7: "August",
    8: "September",
    9: "October",
    10: "November",
    11: "December"
  }

  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`
});

app.get('/projects/:slug', function (req, res) {
  project = req.app.locals.projects.filter(function(p) { return p.slug == req.params.slug})[0]
  res.render('project.html', {
    'project': project
  });
});

app.get('/', function(req, res) {
    res.render(path.join(__dirname, 'app/views/index.html'))
});

app.get('/organisation', function(req, res) {
    res.render('organisations.html')
});

app.get('/contribute', function(req, res) {
    res.render('contribute.html')
});

app.get('/verbs', function(req, res) {
  res.render('verbs.html')
});


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))


