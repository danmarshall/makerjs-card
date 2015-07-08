var makerjs = require('makerjs');
var makerjs_logo = require('makerjs-logo');
var makerjs_monotext = require('makerjs-monotext');

function card() {
	var logo = new makerjs_logo();
	var text = new makerjs_monotext('MAKERJS.ORG');
	 
	this.models = [
		logo, text
	];
	
    this.paths = [
        new makerjs.paths.Circle('circle1', [0, 0], 7)
    ];
}

module.exports = card;