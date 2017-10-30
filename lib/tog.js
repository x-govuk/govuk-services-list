var util = require("util");
var tog = function(data) { var o = '<pre>'; o += util.inspect(data,{depth:10}); o += '</pre>'; return o; }
module.exports = tog;
