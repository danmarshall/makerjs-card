var makerjs = require('makerjs');
var makerjs_logo = require('makerjs-logo');
var makerjs_monotext = require('makerjs-monotext');
var doubleBisection = require('double-bisection');

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
	
	function trimLines(line1, line1prop, line2, line2prop) {
		var intersection = makerjs.path.intersection(line1, line2);
		if (intersection) {
			var point = intersection.intersectionPoints[0];
	
			return {
				create: function () {
					line1[line1prop] = point;
					line2[line2prop] = point;
				},
				point: point 
			};
		}
	}
	
	function trimArcAndLine(arc, arcProp, line, lineProp) {
		var intersection = makerjs.path.intersection(arc, line);
		if (intersection) {
			var point = intersection.intersectionPoints[0];
			return {
				create: function() {
					arc[arcProp] = intersection.path1Angles[0];
					line[lineProp] = point;
				},
				point: point
			};
		}
	}
	
	function gap(paths, prop, lines) {
		var sections = doubleBisection(paths[prop], lines);
		if (sections) {
			return {
				create: function () {
					delete paths[prop];
					paths[prop + '1'] = sections[0];
					paths[prop + '2'] = sections[2];
				}, 
				points: [sections[1].origin, sections[1].end] 
			};
		}
	}

    function bridgeGaps(gap1, gap2) {
        var lines = [];

        for (var i = 2; i--;) {
            lines.push(new makerjs.paths.Line(gap1[i], gap2[i]));
        }

        if (makerjs.path.intersection(lines[0], lines[1])) {
            //swap endpoints
            for (var i = 2; i--;) {
                lines[i].end = gap2[i];
            }
        }

        return lines;
    }

	function gapAndBridge(model1, pathId1, model2, pathId2, lineModel, lineIds){
		var lines = [
			lineModel.paths[lineIds[0]], 
			lineModel.paths[lineIds[1]]
		];
		var gap1 = gap(model1.paths, pathId1, lines);
		var gap2 = gap(model2.paths, pathId2, lines);
	
		if (gap1 && gap2) {
			gap1.create();
			gap2.create();
			
			var bridge = bridgeGaps(gap1.points, gap2.points);
			
			model1.paths[lineIds[0]] = bridge[0];
			model1.paths[lineIds[1]] = bridge[1];
		}
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

	delete tab.paths['BottomLeft'];
	delete tab.paths['Bottom'];
	delete tab.paths['BottomRight'];

	var innerW = w - 2 * rim;
	var innerH = h - 2 * rim;

	var inner = new makerjs.models.RoundRectangle(innerW, innerH, rim);
	inner.origin = [rim, rim];
	flipArcs(inner);

	this.units = makerjs.unitType.Millimeter;
	this.paths = {};
	this.models = {
		logo: logo, text: text, outer: outer, bolts: bolts, inner: inner, tab: tab
	};
	
	makerjs.model.originate(this);

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
	makerjs.model.originate(plus);

	var bottom1 = new makerjs.paths.Line(inner.paths['Bottom'].origin, tab.paths['Left'].end);
    var bottom2 = new makerjs.paths.Line(inner.paths['Bottom'].end, tab.paths['Right'].origin)

	delete inner.paths['Bottom'];

    this.paths.bottom1 = bottom1; 
	this.paths.bottom2 = bottom2;

 	var p1 = trimLines(plus.paths.n1, 'origin', logo.models.leg2.models.b3.paths.Horizontal, 'end');
 	var p2 = trimArcAndLine(logo.models.leg2.models.b3.paths.arc, 'endAngle', plus.paths.n2, 'origin');
	var g1 = gap(inner.paths, 'Top', [plus.paths.n1, plus.paths.n2]);

	if (p1 && p2 && g1) {
		p1.create();
		p2.create();
		g1.create();
		var b1 = bridgeGaps([p1.point, p2.point], g1.points);
		inner.paths['n1'] = b1[0];
		inner.paths['n2'] = b1[1];	
	} else {
		gapAndBridge(inner, 'Top', logo.models.leg2.models.b3, 'Horizontal', plus, ['n1', 'n2']);	
	}
	
	gapAndBridge(tab, 'Top', logo, 'outBottom', plus, ['s1', 's2']);
	gapAndBridge(inner, 'Left', logo, 'outHome', plus, ['w1', 'w2']);
	gapAndBridge(inner, 'Right', logo.models.leg3.models.b3, 'Vertical', plus, ['e1', 'e2']);

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
