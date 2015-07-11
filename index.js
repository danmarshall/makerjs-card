var makerjs = require('makerjs');
var makerjs_logo = require('makerjs-logo');
var makerjs_monotext = require('makerjs-monotext');

function card() {
    this.units = makerjs.unitType.Millimeter;

	var w = 75;
	var h = 60;
	var rim = 4;
	var conn = 2.75;

	var innerW = w - 2 * rim;
	var innerH = h - 2 * rim;

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
	
	function doubleLine(model, pathId) {
		var line = model.paths[pathId];
		model.paths[pathId + '2'] = new makerjs.paths.Line(line.origin, line.end);		
	}

	function trimLines(line1, line1prop, line2, line2prop) {
		var intersection = makerjs.tools.pathIntersection(line1, line2);
		var point = intersection.intersectionPoints[0];

		line1[line1prop] = point;
		line2[line2prop] = point;
	}
	
	function trimArcAndLine(arc, arcProp, line, lineProp) {
		var intersection = makerjs.tools.pathIntersection(arc, line);
		arc[arcProp] = intersection.path1Angles[0];
		line[lineProp] = intersection.intersectionPoints[0];		
	}
	
	var outer = new makerjs.models.RoundRectangle(w, h, 4);

	var bolts = new makerjs.models.BoltRectangle(w - 2 * rim, h - 2 * rim, 1.5);
	bolts.origin = [rim, rim];


	var logo = makerjs.model.scale(new makerjs_logo(1.06, .3, .35, 1.3, 8.3, .65, 19.01, 1, 2.7, 1.32, 2.31), 3.33);
	hCenter(logo, 17);

	var text = makerjs.model.scale(new makerjs_monotext('MAKERJS.ORG'), .03);
	var textW = hCenter(text, 3.5);

	var tabR = 1.5;
	var tabW = textW + 7;
	var tab = new makerjs.models.RoundRectangle(tabW, 9.5, tabR);
	hCenter(tab, rim - tabR);

	delete tab.paths['BottomLeft'];
	delete tab.paths['Bottom'];
	delete tab.paths['BottomRight'];

	var inner = new makerjs.models.RoundRectangle(innerW, innerH, rim);
	inner.origin = [rim, rim];
	flipArcs(inner);

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
	
	makerjs.model.rotate(plus, -19.01, plus.origin);

	this.models = {
		logo: logo, text: text, outer: outer, bolts: bolts, inner: inner, tab: tab, plus: plus
	};

	makerjs.model.originate(this);

	doubleLine(tab, 'Top');
	doubleLine(inner, 'Top');
	doubleLine(inner, 'Left');
	doubleLine(inner, 'Right');
	doubleLine(logo, 'outHome');
	doubleLine(logo, 'outBottom');
	doubleLine(logo.models.leg3.models.b3, 'Vertical');

	trimLines(plus.paths.n1, 'origin', logo.models.leg2.models.b3.paths.Horizontal, 'end');
	trimLines(plus.paths.n1, 'end', inner.paths.Top, 'origin');
	trimLines(plus.paths.n2, 'end', inner.paths.Top2, 'end');
	trimArcAndLine(logo.models.leg2.models.b3.paths.arc, 'endAngle', plus.paths.n2, 'origin');

	trimLines(plus.paths.e1, 'origin', logo.models.leg3.models.b3.paths.Vertical, 'end');
	trimLines(plus.paths.e1, 'end', inner.paths.Right, 'end');
	trimLines(plus.paths.e2, 'origin', logo.models.leg3.models.b3.paths.Vertical2, 'origin');
	trimLines(plus.paths.e2, 'end', inner.paths.Right2, 'origin');
	
	trimLines(plus.paths.w1, 'end', logo.paths.outHome, 'end');
	trimLines(plus.paths.w1, 'origin', inner.paths.Left, 'origin');
	trimLines(plus.paths.w2, 'end', logo.paths.outHome2, 'origin');
	trimLines(plus.paths.w2, 'origin', inner.paths.Left2, 'end');

	trimLines(plus.paths.s1, 'origin', tab.paths.Top, 'origin');
	trimLines(plus.paths.s1, 'end', logo.paths.outBottom, 'end');
	trimLines(plus.paths.s2, 'end', logo.paths.outBottom2, 'origin');
	trimLines(plus.paths.s2, 'origin', tab.paths.Top2, 'end');
	
	var bottom1 = new makerjs.paths.Line(inner.paths['Bottom'].origin, tab.paths['Left'].end);
    var bottom2 = new makerjs.paths.Line(inner.paths['Bottom'].end, tab.paths['Right'].origin)

	delete inner.paths['Bottom'];

    this.paths = {
        bottom1: bottom1, 
		bottom2: bottom2
	};

}

module.exports = card;
