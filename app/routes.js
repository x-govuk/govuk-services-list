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
  res.render('index', {
    "data":new_data,
    "counts":phases,
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

  var loc_order = [];
  _.each(data, function(value, key, list)
  {
    loc_order.push(key);
  });
  loc_order.sort();

  var phases = _.countBy(req.app.locals.data, 'phase');
  res.render('index', {
    "data":new_data,
    "counts":phases,
    "view":"organisation",
    "theme_order":org_order,
    "phase_order":phase_order
  });
});


/*
  - - - - - - - - - -  PROJECT PAGE - - - - - - - - - -
*/
router.get('/projects/:id/:slug', function (req, res)
{
  var data = _.findWhere(req.app.locals.data, {id:parseInt(req.params.id)});
  res.render('project', {
    "data":data,
    "phase_order":phase_order,
  });
});

/*
  - - - - - - - - - -  PROTOTYPE REDRIECT - - - - - - - - - -
*/
router.get('/projects/:id/:slug/prototype', function (req, res)
{
  var id = req.params.id;
  var data = _.findWhere(req.app.locals.data, {id:parseInt(id)});
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

router.get('/showntells/all/:loc?', function (req, res, next)
{
  var loc = req.params.loc;

  var data = [];
  _.each(req.app.locals.data, function(el)
  {
    if (el.showntells)
    _.each(el.showntells, function(sup)
    {
      if (loc && loc !== el.location) {}
      else {
        data.push({
          "name":el.name,
          "date":moment(sup, "D MMMM YYYY, HH:mm"),
          "id":el.id,
          "location":el.location,
        })
      }
    })
  })

  req.data = req.data || {};
  req.data.all = true;
  req.data.loc = loc;
  req.data.places = _.unique(_.pluck(req.app.locals.data,'location'));
  req.data.showntells = _.sortBy(data, "date");

  req.url = '/showntells';
  next();
  // res.end(tog(newdata))
});

router.get('/showntells/today/:loc?', function (req, res, next)
{
  var loc = req.params.loc;
  var data = [];
  _.each(req.app.locals.data, function(el)
  {
    if (el.showntells)
    _.each(el.showntells, function(sup)
    {
        supdate = moment(sup, "D MMMM YYYY, HH:mm");
        if (supdate.isSame(moment(), 'day'))
        {
          if (loc && loc !== el.location) {}
          else {
            data.push({
              "name":el.name,
              "date":supdate,
              "id":el.id,
              "location":el.location,
            })
          }
        }
    })
  })
  req.data = req.data || {};
  req.data.today = true;
  req.data.loc = loc;
  req.data.places = _.unique(_.pluck(req.app.locals.data,'location'));
  req.data.showntells = _.sortBy(data, "date");
  req.url = '/showntells';
  next();
})

module.exports = router;
