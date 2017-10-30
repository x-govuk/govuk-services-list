var path        = require('path'),
    fs          = require('fs'),
    merge       = require('merge'),
    express     = require('express'),
    browserSync = require('browser-sync'),
    nunjucks    = require('express-nunjucks'),
    _           = require('underscore'),
    moment      = require('moment'),
    routes      = require(__dirname + '/app/routes.js'),
    dis_routes  = require(__dirname + '/app/views/display/routes.js'),
    favicon     = require('serve-favicon'),
    app         = express(),
    port        = process.env.PORT || 3100,
    env         = process.env.NODE_ENV || 'development';

/*
  Load all the project data from the files.
*/
var defaults = JSON.parse(fs.readFileSync(__dirname + '/lib/projects/defaults.json').toString());
var files = fs.readdirSync(__dirname + '/lib/projects/');
app.locals.data = [];
_.each(files,function(el)
{
  if (el == 'defaults.json') return;
  var file = fs.readFileSync(__dirname + '/lib/projects/'+el).toString();
  try {
    var json = merge(true,defaults,JSON.parse(file));
    json.filename = el;
    app.locals.data.push(json);
  } catch(err) {
    console.log(err);
  }
});

// Application settings
app.set('view engine', 'html');
app.set('views', [__dirname + '/app/views/', __dirname + '/lib/']);

// Middleware to serve static assets
app.use('/public', express.static(__dirname + '/public'));
app.use('/public', express.static(__dirname + '/govuk_modules/govuk_template/assets'));
app.use('/public', express.static(__dirname + '/govuk_modules/govuk_frontend_toolkit'));
app.use('/public/images/icons', express.static(__dirname + '/govuk_modules/govuk_frontend_toolkit/images'));

nunjucks.setup({
    autoescape: true,
    watch: true
}, app, function(env) {
  env.addFilter('slugify', function(str) {
      return str.replace(/[.,-\/#!$%\^&\*;:{}=\-_`~()’]/g,"").replace(/ +/g,'_').toLowerCase();
  });
  env.addFilter('formatDate', function(str,format) {
      return moment(str).format(format);
  });
  env.addFilter('log', function log(a) {
    var nunjucksSafe = env.getFilter('safe');
  	return nunjucksSafe('<script>console.log(' + JSON.stringify(a, null, '\t') + ');</script>');
  });
});

// Elements refers to icon folder instead of images folder
app.use(favicon(path.join(__dirname, 'govuk_modules', 'govuk_template', 'assets', 'images','favicon.ico')));

// send assetPath to all views
app.use(function (req, res, next) {
  // res.locals.assetPath="/public/";
  res.locals.asset_path="/public/";
  next();
});

// routes (found in app/routes.js)
if (typeof(routes) != "function"){
  console.log(routes.bind);
  console.log("Warning: the use of bind in routes is deprecated - please check the prototype kit documentation for writing routes.")
  routes.bind(app);
} else {
  app.use("/", dis_routes);
  app.use("/", routes);
}

// auto render any view that exists
app.get(/^\/([^.]+)$/, function (req, res)
{
	var path = (req.params[0]);

  // remove the trailing slash because it seems nunjucks doesn't expect it.
  if (path.substr(-1) === '/') path = path.substr(0, path.length - 1);

	res.render(path, req.data, function(err, html)
  {
		if (err) {
			res.render(path + "/index", req.data, function(err2, html)
      {
        if (err2) {
          res.status(404).send(path+'<br />'+err+'<br />'+err2);
        } else {
          res.end(html);
        }
      });
		} else {
			res.end(html);
		}
	});
});

// start the app
if (env === 'production') {
  app.listen(port);
} else {
  // for development use browserSync as well
  app.listen(port,function()
  {
    browserSync({
      proxy:'localhost:'+port,
      files:['public/**/*.{js,css}','app/views/**/*.html'],
      ghostmode:{clicks:true, forms: true, scroll:true},
      open:false,
      port:(port+1),
    });
  });
}

console.log('');
console.log('Listening on port ' + port);
console.log('');
