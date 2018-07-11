var express     = require('express'),
    _           = require("underscore"),
    router      = express.Router();

router.get('/display/:number?/:organisation?', function(req,res,next)
{
  req.data = {};

  // Grab number from URL. 0 is default.
  var number = req.params.number;
  if (!number) number = 0;

  // Grab organisation from URL (if it's there)
  var organisation = req.params.organisation;

  // put data into simpler var for consise-ity (take out backlog stuff).
  var data = _.filter(req.app.locals.data,function(el) {
    return (el.phase !== 'backlog');
  });

  // if we've got a organisation filter the data.
  if (organisation)
  {
    data = _.filter(data, function(el) {
      return (el.organisation.toLowerCase() == organisation.toLowerCase());
    });
    // pass the organisation into the template for use there.
    req.data.organisation = organisation;
  }

  // if number is too big for the current data reset it.
  if (number >= data.length) number = 0;

  // gather template data for rendering.
  req.data.data = data[number];
  req.data.total = data.length;
  req.data.number = number;

  // make sure we use the right template to render.
  req.url = '/display/';
  next();
});

module.exports = router;
