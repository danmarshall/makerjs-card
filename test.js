var makerjs = require('makerjs');
var DRAWING = require('./index.js');
console.log(makerjs.exporter.toSVG(new DRAWING()));
