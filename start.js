const express = require('express')
const fs = require('fs')
const app = express()
const port = process.env.PORT || 3100
var path = require('path');
var nunjucks = require('nunjucks')

var sassMiddleware = require('node-sass-middleware');

app.use(sassMiddleware({
  src: path.join(__dirname, 'app/assets/sass'),
  dest: path.join(__dirname, 'static'),
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true
}));

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
  'Department for Transport',
  'Department for Work and Pensions',
  'Department of Health and Social Care',
  'Foreign & Commonwealth Office',
  'Home Office',
  'Ministry of Defence',
  'Ministry of Housing, Communities and Local Government',
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

    var phase = app.locals.phases.filter(function(p) { return p.name == project.phase })

    if (phase.length > 0) {
      phase[0].projects_count += 1;
    }
  }
})


app.use('/', express.static(path.join(__dirname, 'static')))
// app.use(express.static('views'))

var env = nunjucks.configure(['app/views/',
    'node_modules/govuk-frontend/'], {
    autoescape: true,
    express: app,
    watch: (process.env.ENV === 'development')
});

env.addFilter('slugify', function(str) {
  return str.replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()’]/g,"").replace(/ +/g,'_').toLowerCase();
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


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))


