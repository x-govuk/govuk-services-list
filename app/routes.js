var express = require('express'),
    router  = express.Router(),
    moment  = require('moment'),
    tog     = require(__dirname + "/../lib/tog.js"),
    _       = require('underscore');

/*
  A way to force the ordering of the themes.
*/
var theme_order = [
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

var organisation_order = [
      'Home Office',
      'Department for Work and Pensions',
      'Ministry of Justice',
      'Land Registry',
      'Department for Environment, Food & Rural Affairs',
      'Department for Education',
      'NHS Digital',
      'Companies House',
      'Skills Funding Agency',
      'Insolvency Service'
    ];

/*
  A way to force the ordering of the phases.
*/
var phase_order = ['unknown','discovery','alpha','beta','public beta','live'];

/*
  A function to gather the data by
  'phase' and then 'facing' so the
  index.html can spit them out.
*/
function indexify(data)
{
  var new_data = {};
  _.each(data, function(value, key, list)
  {
    var item = _.groupBy(value,'phase');
    new_data[key] = {};
    _.each(item, function(v,k,l)
    {
      var piece = _.groupBy(v,'facing');
      new_data[key][k] = piece;
    });
  });
  return new_data;
}

/*
  - - - - - - - - - -  INDEX PAGE - - - - - - - - - -
*/
router.get('/', function (req, res)
{
  var data = _.groupBy(req.app.locals.data, 'theme');
  var new_data = indexify(data);
  var phases = _.countBy(req.app.locals.data, 'phase');
  var countByOrder = _.countBy(req.app.locals.data, 'theme');
  res.render('index', {
    "data":new_data,
    "counts":phases,
    "countByOrder": countByOrder,
    "view":"theme",
    "theme_order":theme_order,
    "phase_order":phase_order
    }
  );
});

/*
  - - - - - - - - - -  ORGANISATION INDEX PAGE - - - - - - - - - -
*/
router.get('/organisation/', function (req, res)
{
  var data = _.groupBy(req.app.locals.data, 'organisation');
  var new_data = indexify(data);

  var org_order = [];
  _.each(data, function(value, key, list)
  {
    org_order.push(key);
  });
  org_order.sort();

  var countByOrder = _.countBy(req.app.locals.data, 'organisation');

  var phases = _.countBy(req.app.locals.data, 'phase');
  res.render('index', {
    "data":new_data,
    "counts":phases,
    "countByOrder": countByOrder,
    "view":"organisation",
    "theme_order":org_order,
    "phase_order":phase_order
  });
});


/*
  - - - - - - - - - -  PROJECT PAGE - - - - - - - - - -
*/
router.get('/projects/:slug', function (req, res)
{
  var data = _.findWhere(req.app.locals.data, {slug:req.params.slug});
  res.render('project', {
    "data":data,
    "phase_order":phase_order,
  });
});

/*
  - - - - - - - - - -  PROTOTYPE REDRIECT - - - - - - - - - -
*/
router.get('/projects/:slug/prototype', function (req, res)
{
  var id = req.params.id;
  var data = _.findWhere(req.app.locals.data, {slug: req.params.slug});
  if (typeof data.prototype == 'undefined')
  {
    res.render('no-prototype',{
      "data":data,
    });
  } else {
    res.redirect(data.prototype);
  }
});

/*
  - - - - - - - - - -  ALL THE DATA AS JSON - - - - - - - - - -
*/

router.get('/api', function (req, res) {
  console.log(req.app.locals.data);
  res.json(req.app.locals.data);
});

router.get('/api/:id', function (req, res) {
  var data = _.findWhere(req.app.locals.data, {id: (parseInt(req.params.id))});
  if (data) {
    res.json(data);
  } else {
    res.json({error: 'ID not found'});
  }
});

module.exports = router;
