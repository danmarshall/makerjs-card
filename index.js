var makerjs = require('makerjs');
var makerjs_logo = require('makerjs-logo');
var makerjs_monotext = require('makerjs-monotext');
var doubleBisection = require('double-bisection');

function card() {
    this.units = makerjs.unitType.Millimeter;
	this.paths = {};
	
	var w = 75;
	var h = 60;
	var outerRadius = 4;
	var rim = 4;
	var conn = 2.75;
	var logoOutline = 1.3;
	var logoY = 17;
	var logoAngle = 19.01;
	var tabMargin = 7;
	var tabHeight = 9.5;
	var tabR = 1.5;
	var textY = 3.5;
	var textScale = .03;
	var logoScale = 3.33;
	var boltRadius = 1.5;
	
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
	
	function trimLines(line1, line1prop, line2, line2prop) {
		var intersection = makerjs.path.intersection(line1, line2);
		var point = intersection.intersectionPoints[0];

		line1[line1prop] = point;
		line2[line2prop] = point;
		
		return point;
	}
	
	function trimArcAndLine(arc, arcProp, line, lineProp) {
		var intersection = makerjs.path.intersection(arc, line);
		var point = intersection.intersectionPoints[0];

		arc[arcProp] = intersection.path1Angles[0];
		line[lineProp] = point;
		
		return point;
	}
	
	function gap(paths, prop, lines) {
		var sections = doubleBisection(paths[prop], lines);
		delete paths[prop];
		paths[prop + '1'] = sections[0];
		paths[prop + '2'] = sections[2];
		return [sections[1].origin, sections[1].end];
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

	function gapAndBridge(paths1, prop1, paths2, prop2, paths3, prop3, prop4){
		gap(paths1, prop1, [paths3[prop3], paths3[prop4]]);
		gap(paths2, prop2, [paths3[prop3], paths3[prop4]]);
	
		var b1 = bridgeGaps(
			[paths1[prop1 + 1].end, paths1[prop1 + 2].origin],
			[paths2[prop2 + 1].end, paths2[prop2 + 2].origin]
		);
		
		paths1[prop3] = b1[0];
		paths1[prop4] = b1[1];	
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

	var inner = new makerjs.models.RoundRectangle(innerW, innerH, rim);
	inner.origin = [rim, rim];
	flipArcs(inner);

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

	var b1 = bridgeGaps([p1, p2], g1);
	inner.paths['n1'] = b1[0];
	inner.paths['n2'] = b1[1];	
	
	gapAndBridge(tab.paths, 'Top', logo.paths, 'outBottom', plus.paths, 's1', 's2');
	gapAndBridge(inner.paths, 'Left', logo.paths, 'outHome', plus.paths, 'w1', 'w2');
	gapAndBridge(inner.paths, 'Right', logo.models.leg3.models.b3.paths, 'Vertical', plus.paths, 'e1', 'e2');

}

module.exports = card;
