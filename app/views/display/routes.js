var express     = require('express'),
    _           = require("underscore"),
    router      = express.Router();

router.get('/display/:number?/:location?', function(req,res,next)
{
  req.data = {};

  // Grab number from URL. 0 is default.
  var number = req.params.number;
  if (!number) number = 0;

  // Grab location from URL (if it's there)
  var location = req.params.location;

  // put data into simpler var for consise-ity (take out backlog stuff).
  var data = _.filter(req.app.locals.data,function(el) {
    return (el.phase !== 'backlog');
  });

  // if we've got a location filter the data.
  if (location)
  {
    data = _.filter(data, function(el) {
      return (el.location.toLowerCase() == location.toLowerCase());
    });
    // pass the location into the template for use there.
    req.data.location = location;
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
