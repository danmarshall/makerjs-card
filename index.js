var makerjs = require('makerjs');
var makerjs_logo = require('makerjs-logo');
var makerjs_monotext = require('makerjs-monotext');

function card(w, h, outerRadius, rim, boltRadius, conn, logoOutline, logoScale, logoY, logoAngle, textScale, textY, tabMargin, tabHeight, tabR ) {

	if (arguments.length == 0) {    
		var defaultValues = makerjs.kit.getParameterValues(card);
		function v() { 
			return defaultValues.shift();
		}
		w = v();
		h = v();
		outerRadius = v();
		rim = v();
		boltRadius = v();
		conn = v();
		logoOutline = v();
		logoScale = v();
		logoY = v();
		logoAngle = v();
		textScale = v();
		textY = v();
		tabMargin = v();
		tabHeight = v();
		tabR = v();
	}
	
	function hCenter(model, y) {

	    var measure = makerjs.measure.modelExtents(model);
	    var mw = measure.high[0];
	    model.origin = [(w - mw) / 2, y];

	    return mw;
	}

	function flipArcs(roundRect) {

	    function findAndFlip(arcId, origin) {
	        var arc = roundRect.paths[arcId];
	        arc.startAngle = makerjs.angle.mirror(arc.startAngle, true, true);
	        arc.endAngle = makerjs.angle.mirror(arc.endAngle, true, true);
	        arc.origin = origin;
        }

	    findAndFlip('BottomLeft', [0, 0]);
	    findAndFlip('BottomRight', [innerW, 0]);
	    findAndFlip('TopLeft', [0, innerH]);
	    findAndFlip('TopRight', [innerW, innerH]);
	}
	
	var outer = new makerjs.models.RoundRectangle(w, h, outerRadius);

	var bolts = new makerjs.models.BoltRectangle(w - 2 * rim, h - 2 * rim, boltRadius);
	bolts.origin = [rim, rim];

	var logo = makerjs.model.scale(new makerjs_logo(1.06, .3, .35, logoOutline, 8.3, .65, logoAngle, 1, 2.7, 1.32, 2.31), logoScale);
	hCenter(logo, logoY);

	var text = makerjs.model.scale(new makerjs_monotext('MAKERJS.ORG'), textScale);
	var textW = hCenter(text, textY);

	var tabW = textW + tabMargin;
	var tab = new makerjs.models.RoundRectangle(tabW, tabHeight, tabR);
	hCenter(tab, rim - tabR);

	var innerW = w - 2 * rim;
	var innerH = h - 2 * rim;

	var inner = new makerjs.models.RoundRectangle(innerW, innerH, rim);
	inner.origin = [rim, rim];
	flipArcs(inner);

	this.units = makerjs.unitType.Millimeter;
	this.paths = {};
	
	var plus = {
		origin: [(w - conn) / 2, (h - conn) / 2],
		paths: {
			n1: new makerjs.paths.Line([0, 0], [0, h]),
			n2: new makerjs.paths.Line([conn, 0], [conn, h]),
			s1: new makerjs.paths.Line([0, -h], [0, 0]),
			s2: new makerjs.paths.Line([conn, -h], [conn, 0]),
			w1: new makerjs.paths.Line([-w, 0], [0, 0]),
			w2: new makerjs.paths.Line([-w, conn], [0, conn]),
			e1: new makerjs.paths.Line([0, 0], [w, 0]),
			e2: new makerjs.paths.Line([0, conn], [w, conn])
		}
	}
	
	makerjs.model.rotate(plus, -logoAngle, plus.origin);

	this.models = {
		logo: logo, text: text, outer: outer, bolts: bolts, inner: inner, tab: tab, plus: plus
	};

	makerjs.model.originate(this);

	makerjs.model.combine(tab, inner, true, false, false, true);
	makerjs.model.combine(plus, { models: { inner: inner, tab: tab} }, true, false, false, true);
	makerjs.model.combine(plus, logo.models.outline, false, true, false, true);
}

card.metaParameters = [
    { title: "width", type: "range", min: 30, max: 200, value: 75 },
    { title: "height", type: "range", min: 30, max: 200, value: 60 },
    { title: "outer radius", type: "range", min: 0, max: 10, step: .5, value: 4 },
    { title: "rim", type: "range", min: 1, max: 10, step: .5, value: 4 },
    { title: "bolt radius", type: "range", min: 0, max: 5, step: .1, value: 1.5 },
    { title: "connector width", type: "range", min: .5, max: 5, step: .1, value: 2.75 },
    { title: "logo outline", type: "range", min: .3, max: 3, step: .1, value: 1.3 },
    { title: "logo scale", type: "range", min: 1, max: 6, step: .1, value: 3.33 },
    { title: "logo y-offset", type: "range", min: 0, max: 30, step: 1, value: 17 },
    { title: "logo angle", type: "range", min: 0, max: 45, step: 1, value: 19 },
    { title: "text scale", type: "range", min: .005, max: .05, step: .001, value: .03 },
    { title: "text y-offset", type: "range", min: 0, max: 10, step: .1, value: 3.5 },
    { title: "text margin", type: "range", min: 1, max: 10, step: .1, value: 7 },
    { title: "tab height", type: "range", min: 2, max: 15, step: .5, value: 9.5 },
    { title: "tab radius", type: "range", min: 0, max: 2, step: .1, value: 1.5 },
];

module.exports = card;
