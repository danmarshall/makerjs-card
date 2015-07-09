var makerjs = require('makerjs');
var makerjs_logo = require('makerjs-logo');
var makerjs_monotext = require('makerjs-monotext');

function card() {
    this.units = makerjs.unitType.Millimeter;

	var w = 90;
	var h = 70;
	var rim = 4;
	var conn = 2;

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
	        var find = makerjs.findById(roundRect.paths, arcId);
	        var arc = find.item;
	        arc.startAngle = makerjs.angle.mirror(arc.startAngle, true, true);
	        arc.endAngle = makerjs.angle.mirror(arc.endAngle, true, true);
	        arc.origin = origin;
        }

	    findAndFlip('BottomLeft', [0, 0]);
	    findAndFlip('BottomRight', [innerW, 0]);
	    findAndFlip('TopLeft', [0, innerH]);
	    findAndFlip('TopRight', [innerW, innerH]);

	}

	var outer = new makerjs.models.RoundRectangle('outer', w, h, 4);

	var bolts = new makerjs.models.BoltRectangle('bolts', w - 2 * rim, h - 2 * rim, 2);
	bolts.origin = [rim, rim];


	var logo = makerjs.model.scale(new makerjs_logo(), 4);
	hCenter(logo, 21);

	var text = makerjs.model.scale(new makerjs_monotext('MAKERJS.ORG'), .04);
	var textW = hCenter(text, 5);

	var tabR = 1.5;
	var tabW = textW + 7;
	var tab = new makerjs.models.RoundRectangle('inner', tabW, 13, tabR);
	hCenter(tab, rim - tabR);

	makerjs.removeById(tab.paths, 'BottomLeft');
	makerjs.removeById(tab.paths, 'Bottom');
	makerjs.removeById(tab.paths, 'BottomRight');

	var inner = new makerjs.models.RoundRectangle('inner', innerW, innerH, rim);
	inner.origin = [rim, rim];
	flipArcs(inner);

	makerjs.removeById(inner.paths, 'Bottom');

	this.models = [
		logo, text, outer, bolts, inner, tab
	];

	makerjs.model.originate(this);

	var bottom1 = new makerjs.paths.Line('bottom1', [2 * rim, rim], [rim + (innerW - tabW) / 2, rim]);
    var bottom2 = new makerjs.paths.Line('bottom2', makerjs.point.add(bottom1.end, [tabW, 0]), [innerW ,rim])

    this.paths = [
        bottom1, bottom2
    ];

    function bridge(main, m1, idm1, b1, m2, idm2, b2) {
        var gap1 = makerjs.tools.gapPath(m1, idm1, conn, b1);
        var gap2 = makerjs.tools.gapPath(m2, idm2, conn, b2);
        var bridge = makerjs.tools.bridgeGaps(gap1, gap2);

        main.paths = main.paths.concat(bridge);
    }

    bridge(this, tab, 'Top', .53, logo, 'outBottom', .545);
    bridge(this, inner, 'Left', .45, logo, 'outHome', .5);

    var legH = makerjs.findById(makerjs.findById(logo.models, 'leg1').item.models, 'leg1b3').item
    bridge(this, inner, 'Top', .655, legH, 'Horizontal', .5);

    var legV = makerjs.findById(makerjs.findById(logo.models, 'leg3').item.models, 'leg3b3').item;
    bridge(this, inner, 'Right', .325, legV, 'Vertical', .5);

}

module.exports = card;
