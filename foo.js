var SVG2VMLPath = {
	svgData: [],
	data: [],

	svgDataLength: 0,
	lastX: 0,
	lastY: 0,

	maxDataLen: -1,
	minDataLen: 1000000,
	count: 0,

	convert: function(svgData) {
		this.svgData = svgData;
		this.svgDataLength = svgData.length;
		this.parse();

		this.maxDataLen = this.svgDataLength > this.maxDataLen ? this.svgDataLength : this.maxDataLen;
		this.minDataLen = this.svgDataLength < this.minDataLen ? this.svgDataLength : this.minDataLen;
		this.count++;

		return this.data;
	},

	move: function (x, y) {
		this.data.push('m');

		this.data.push(x);
		this.lastX = x;

		this.data.push(y);
		this.lastY = y;
	},

	lineto: function(x, y) {
		this.data.push('l');

		if (x) {
			this.data.push(x);
			this.lastX = x;
		}

		if (y) {
			this.data.push(y);
			this.lastY = y;
		}
	},

	close: function (data) {
		this.data.push('x');
	},

	getSvgData: function(index) {
		return parseFloat(this.svgData[index]);
	},

	parse: function() {
		var i, command;

		for (i=0; i<this.svgDataLength; ++i) {
			command = this.svgData[i];

			// we expect a command of type string
			if (typeof command !== "string") {
				alert("Error parsing path data: " + this.svgData);
			}

			switch (command) {
			case 'm':	// SVG 'relative moveto' -> VML 'absolute moveto'
				this.move(
					this.lastX + this.getSvgData(++i),
					this.lastY + this.getSvgData(++i)
				);
				break;

			case 'M':	// SVG 'absolute moveto' -> VML 'absolute moveto'
				this.move(
					this.getSvgData(++i),
					this.getSvgData(++i)
				);
				break;

			case 'l':	// SVG 'relative lineto' -> VML 'absolute lineto'
				this.lineto(
					this.lastX + this.getSvgData(++i),
					this.lastY + this.getSvgData(++i)
				);
				break;

			case 'L':	// SVG 'absolute lineto' -> VML 'absolute lineto'
				this.lineto(
					this.getSvgData(++i),
					this.getSvgData(++i)
				);
				break;

			case 'H':	// SVG 'absolute horizontal lineto' -> VML 'absolute lineto'
				this.lineto(
					this.getSvgData(++i),
					this.lastY
				);
				break;

			case 'h':	// SVG 'relative horizontal lineto' -> VML 'absolute lineto'
				this.lineto(
					this.lastX + this.getSvgData(++i),
					this.lastY
				);
				break;

			case 'V':	// SVG 'absolute vertical lineto' -> VML 'absolute lineto'
				this.lineto(
					this.lastX,
					this.getSvgData(++i)
				);
				break;

			case 'v':	// SVG 'relative vertical lineto' -> VML 'absolute lineto'
				this.lineto(
					this.lastX,
					this.lastY + this.getSvgData(++i)
				);
				break;

			case 'z':
			case 'Z':
				this.close();
				break;

			default:
				//this.data.push(command);
				break;
			}
		}
	}
}

var SVG2Highcharts = {
	ELEMENT_TYPE: 1,

	container: null,
	renderer: null,

	defaultStyles: {
		'stroke-width': 0.6,
		stroke: 'black'
	},

    elementCache: {},

	/**
	 * Fetches the specified SVG map, parses it and draws it via the HighCharts library.
	 *
	 * @param container 	selector for element to be used as canvas
	 * @param svgUrl		the URL of the SVG map
	 */
	load: function(container, svgUrl) {
		var that = this;

		this.container = $(container);

		this.renderer = new Highcharts.Renderer(
			this.container[0],
			this.container.css('width').replace(/px/, ''),
			this.container.css('height').replace(/px/, '')
		);

		this.cssNode = $('style');

		// load SVG
		$.get(svgUrl, function(xml) {
			// process child elements of the root SVG element
			var svgRoot = xml.getElementsByTagName('svg')[0];
			that.processNodes(svgRoot.childNodes);
		}, 'xml');
	},

	processNodes: function(nodes, group) {
		var that = this,
			elements = $.grep(nodes, function(node, index) {
				return node.nodeType == that.ELEMENT_TYPE;
			}),
			name,
			element;

		$.each(elements, function(index, node) {
			switch (node.nodeName) {
			case 'path':
				element = that.path.call(that, node);
				break;
			case 'g':
				element = that.g.call(that, node);
				that.processNodes(node.childNodes, element);
				break;
			case 'style':
				// append SVG style to current stylesheet
				/*
				var val = node.firstChild.nodeValue;
				that.cssNode.html(that.cssNode.html() + "\n" + val);
				*/
				return; // stop here
			default:
				return; // stop here
			}

			if (group) {
                //that.add(element, group);
				element.add(group);
			} else {
                //that.add(element);
				element.add();
			}
		});
	},

    add: function(element, group) {
        this.elementCache[element] = group ? group : null;
    },

	path: function(node) {
		var rawCoords, vmlCoords;

		rawCoords = node.getAttribute('d').replace(/(-)/g, ' $1').replace(/([a-zA-Z])/g, ' $1 ').split(/[ ,]/);

		vmlCoords = SVG2VMLPath.convert(rawCoords);
		if ($.browser.msie && ($.browser.version == "7.0" || $.browser.version == "8.0")) {

			return this.renderer.path(vmlCoords).attr(this.defaultStyles);
		} else {
			return this.renderer.path($.grep(rawCoords, function(item, index) {
				return item; // filter all empty strings or null values
			})).attr(this.defaultStyles);
		}


	},

	g: function(node) {
		return this.renderer.g(node.id);
	}
}



// Ported to Javascript by Nathan Manousos (nathanm@gmail.com) for AFAR Media (http://afar.com)

// Original ActionScript Code written and owned by Chris Youderian
// All code is licensed under the GPLv2.
// This means that any derivate works that you create using this code must be released under the same license.
// If you wish to use this code in a product you want to resell, you need to ask for permission.
// Contact form available at:  http://www.flashworldmap.com/contactus.php
// See original posting at: http://www.flashmap.org/robinson-projection-in-as3-gpl/

var Robinson = function(mapWidth, mapHeight, fudgeX, fudgeY){
	// map width and height are asked for because they are what the
	// earthRadius value relies upon. You can use either, as long as
	// the image is sized such that width = height*1.97165551906973
	// you can use either to do the calculation, but as of now I
	// require both and only use width. both are used in projectToCSS.
	this.mapWidth = mapWidth;
	this.mapHeight = mapHeight;
	this.earthRadius = (mapWidth/2.666269758)/2;

	// fudgeX, fudgeY are used to offset points, this is to calibrate
	// the points if they aren't showing up in the right place exactly
	this.fudgeX = (typeof fudgeX === 'undefined') ? 0 : fudgeX;
	this.fudgeY = (typeof fudgeY === 'undefined') ? 0 : fudgeY;

	// these tables are created by robinson and are what the projection is based upon
	this.AA = [0.8487,0.84751182,0.84479598,0.840213,0.83359314,0.8257851,0.814752,0.80006949,0.78216192,0.76060494,0.73658673,0.7086645,0.67777182,0.64475739,0.60987582,0.57134484,0.52729731,0.48562614,0.45167814];
	this.BB = [0,0.0838426,0.1676852,0.2515278,0.3353704,0.419213,0.5030556,0.5868982,0.67182264,0.75336633,0.83518048,0.91537187,0.99339958,1.06872269,1.14066505,1.20841528,1.27035062,1.31998003,1.3523];
};

Robinson.prototype.projectToCSS = function(lat,lng){
	// changes the coordinate system of a projected point to the one CSS uses
	var point = this.project(lat,lng);
	point.x = (point.x + (this.mapWidth/2));
	point.y = ((this.mapHeight/2) - point.y);
	return point;
};

Robinson.prototype.project = function(lat,lng){
	// returns the robinson projected point for a given lat/lng based on
	// the earth radius value determined in the contructor

	var roundToNearest = function(roundTo, value){
		return Math.floor(value/roundTo)*roundTo;  //rounds down
	};
	var getSign = function(value){
		return value < 0 ? -1 : 1;
	};

	var lngSign = getSign(lng), latSign = getSign(lat); //deals with negatives
	lng = Math.abs(lng);lat = Math.abs(lat); //all calculations positive
	var radian = 0.017453293; //pi/180
	var low = roundToNearest(5, lat-0.0000000001); //want exact numbers to round down
	low = (lat == 0) ? 0 : low; //except when at 0
	var high = low + 5;

	// indicies used for interpolation
	var lowIndex = low/5;
	var highIndex = high/5;
	var ratio = (lat-low)/5;

	// interpolation in one dimension
	var adjAA = ((this.AA[highIndex]-this.AA[lowIndex])*ratio)+this.AA[lowIndex];
		var adjBB = ((this.BB[highIndex]-this.BB[lowIndex])*ratio)+this.BB[lowIndex];

	//create point from robinson function
	var point = {
		x : (adjAA * lng * radian * lngSign * this.earthRadius) + this.fudgeX,
		y : (adjBB * latSign * this.earthRadius) + this.fudgeY
	};

	return point;

};







/**
 * options: {
 * 		container: ...,
 * 		width: ...,
 * 		height: ...,
 * 		robinson: {
 * 			width: ..., height: ..., offsetX: ..., offsetY: ...
 * 		},
 *
 * 		// optional
 * 		linkSuffix: ...,
 * 		origin: { latitude: ..., longitude: ..., headline: ..., text: , url: ..., position: ... },,
 * 		destinations: [
 * 			{ latitude: ..., longitude: ..., headline: ..., text: , url: ..., position: ... },
 *  		...
 * 		]
 * }
 */
function HighchartsMap(container, options) {
	this.options = options;
	this.options.container = container;

	this.styles = {
		standard:	{'z-index': 3, fill: '#032C57', 'fill-opacity': 0.8},
		line:		{'z-index': 1, fill: 'none', stroke: '#032C57', 'stroke-width': 1, 'stroke-opacity': 0.5}
	};

	this.hoverOpacity = 0.9;

	this.pointRadius = 3;
	this.pointLabelDistance = 3;
	this.pin = {width: 10, height: 7};
	this.textPadding = {left: 5, bottom: 3};
	this.curveThreshold = 40;

	this.defaultLabelPosition = 'top';
	this.positionToQtip = {
			top: {
				corner: 'bottomMiddle',
				adjust: {x: 0, y: -this.pointLabelDistance},
				size: {x: 36, y: 10}
			},
			right: {
				corner: 'leftMiddle',
				adjust: {x: this.pointLabelDistance, y: 0},
				size: {x: 9, y: 20}
			},
			left: {
				corner: 'rightMiddle',
				adjust: {x: -this.pointLabelDistance, y: 0},
				size: {x: 9, y: 20}
			},
			bottom: {
				corner: 'topMiddle',
				adjust: {x: 0, y: this.pointLabelDistance},
				size: {x: 36, y: 10}
			},
			nolabel: null
		};


	this.linkSuffix = options.linkSuffix ? options.linkSuffix : ' » ';

	/*
	 * FOR DEBUGGING PURPOSES ONLY (to find out Robinson projection parameters):
	 *
		var urlParams = {};
		(function () {
		    var e,
		        a = /\+/g,  // Regex for replacing addition symbol with a space
		        r = /([^&=]+)=?([^&]*)/g,
		        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
		        q = window.location.search.substring(1);

		    while (e = r.exec(q))
		       urlParams[d(e[1])] = d(e[2]);
		})();

		options.projection.width   	= urlParams['_width']    ? parseInt(urlParams['_width'])      : options.projection.width;
		options.projection.height  	= urlParams['_height']   ? parseInt(urlParams['_height'])     : options.projection.height;
		options.projection.offsetX 	= urlParams['_xoff']     ? parseInt(urlParams['_xoff'])       : options.projection.offsetX;
		options.projection.offsetY 	= urlParams['_yoff']     ? parseInt(urlParams['_yoff'])       : options.projection.offsetY;
		options.projection.stretchY = urlParams['_stretchy'] ? parseFloat(urlParams['_stretchy']) : options.projection.stretchY;
	 */

	this.createProjection(options.projection);
	this.renderer = new Highcharts.Renderer(options.container, options.width, options.height);

	this.origin = this.getProjection(options.origin);

	function isNotNone(param) {return typeof param !== "string" || param.toLowerCase() !== "none";}

	if (isNotNone(options.origin.display)) {
		// draw the origin
		this.drawPoint(options.origin, true);
	}

	// draw label if some data was given
	for (var i in options.destinations) {
		if (isNotNone(options.destinations[i].display)) {
			this.drawPoint(options.destinations[i]);

			if (isNotNone(options.origin.display)) {
				this.drawConnectionLine(options.origin, options.destinations[i]);
			}
		}
	}

	// fix layout problems in IE (one pixel offset)
	$('.qtip.offersMapLabel .qtip-tip[rel=leftMiddle]').css('left', 0);
	$('.qtip.offersMapLabel .qtip-tip[rel=topMiddle]').css('top', 0);
};

/**
 * Draws a point and a label for it.
 *
 * The label contains two lines of text linking to the specified URL.
 *
 * @param item	{
 * 				latitude: 'the latitude of the point',
 * 				longitude: 'the latitude of the point',
 * 				headline: 'the first line of text, rendered bold'
 * 				text: 'the second line with text'
 *				url: 'the link destination'
 * 			}
 * @param isOrigin	true if the point to be drawn is the origin
 */
HighchartsMap.prototype.drawPoint = function(item, isOrigin) {
	var display = item.display;
	// default value: no label for origin, top label for destinations
	var defaultDisplay = isOrigin ? "nolabel" : "top";

	// no position specified
	if (display !== null) {
		display = display.toLowerCase();

		// specified position is invalid
		if (this.positionToQtip[display] === undefined) {
			display = defaultDisplay;
		}
	} else  {
		display = defaultDisplay;
	}

	var point = this.getProjection(item);

	// draw destination point
	var renderedPoint = this.renderer.circle(point.x, point.y, this.pointRadius).attr(this.styles.standard).add();

	// return if no label should be shown
	if (display === "nolabel") return renderedPoint;

	var text = jQuery('<div>')
		.append( jQuery('<b/>').text( item.headline ) )
		.append( jQuery('<span/>').text( this.linkSuffix ) );

	// no second line provided (e.g. because no offer was found)
	if (item.text !== null) {
		text.append( jQuery('<br/>') )
			.append( jQuery('<span/>').text( item.text ) );
	}

	var container = jQuery(this.options.container);
	container.qtip( {
			content: text,
			style: {
				classes: {
					tooltip: 'offersMapLabel'
					//,tip: ''
				},
				tip: {
					color: this.styles.standard.fill,
					corner: this.positionToQtip[display].corner,
					size: {
						x: this.positionToQtip[display].size.x,
						y: this.positionToQtip[display].size.y
					}
				},
				padding: 2,
				border: {
					width: 0,
					radius: 3,
					color: this.styles.standard.fill
				},
				background: this.styles.standard.fill,
				fontFamily: 'Tahoma,Arial,sans-serif',
				fontSize: '11px',
				lineHeight: '1.2em',
				whiteSpace: 'nowrap',
				color: 'white'
			},
			show: {
				ready: true
			},
			hide: {
				when: {
					event: null
				}
			} ,
			position: {
				corner: {
					target: "topLeft",
					tooltip: this.positionToQtip[display].corner
				},
				adjust: {
					x: point.x + this.positionToQtip[display].adjust.x,
					y: point.y + this.positionToQtip[display].adjust.y
				}
			},
			api: {
				onRender: function( a, b ) {
					var tooltip = this.elements.tooltip;
					var wrapper = this.elements.wrapper;
					wrapper.click( function() {top.location.href = item.url;} );
					wrapper.mouseover( function() {tooltip.addClass('qtip-hover')} );
					wrapper.mouseout( function() {tooltip.removeClass('qtip-hover')} );
				}
			}
	} );

	return renderedPoint;
};

HighchartsMap.prototype.drawConnectionLine = function(fromItem, toItem) {
	// get projection for points
	var from = this.getProjection(fromItem),
		to = this.getProjection(toItem);

	// delta x = |x1-x2|, delta y = |y1-y2|
	var delta = {x: Math.abs(from.x-to.x), y: Math.abs(from.y-to.y)};

	// distance between from and to
	var distance = Math.sqrt(Math.pow(delta.x, 2) + Math.pow(delta.y, 2));

	if (distance < this.curveThreshold) {
		// draw straight line from origin to destination
		return this.renderer.path([
		        'M', from.x, from.y,
		        'L', to.x, to.y
		]).attr(this.styles.line).add();
	}

	// signum(x)
	var sign = {x: to.x < from.x ? 1 : -1, y: 1};

	// offset for control points
	var offset = {x: delta.y/110 * (-20),	y: delta.x/110 * (-20)};

	// control points: (x1,y1) is near to the start point, (x2,y2) is near the destination
	var ctrl	= {x1: from.x - sign.x*delta.x/3 + offset.x,
					y1: from.y + delta.y/3 + offset.y,
					x2: to.x + sign.x*delta.x/3 + offset.x,
					y2: to.y - delta.y/3 + offset.y};

	// draw bezier curve control points (for debugging)
	//this.renderer.circle(ctrl.x1, ctrl.y1, 2).attr({'z-index': 20, fill: 'red', 'fill-opacity': 1}).add();
	//this.renderer.circle(ctrl.x2, ctrl.y2, 2).attr({'z-index': 20, fill: 'red', 'fill-opacity': 1}).add();

	// draw curved line from origin to destination
	return this.renderer.path([
	           'M', from.x, from.y,			// origin
	           'C', ctrl.x1, ctrl.y1,		// 1st control point
	           		ctrl.x2, ctrl.y2,		// 2nd control point
	           		to.x, to.y				// destination
	]).attr(this.styles.line).add();
};

HighchartsMap.prototype.createProjection = function(options) {
	this.projection = {
			robinson: new Robinson(options.width, options.height, options.offsetX, options.offsetY),
			stretchY: options.stretchY
	}
}

HighchartsMap.prototype.getProjection = function(item) {
	var proj = this.projection.robinson.projectToCSS(item.latitude, item.longitude)
	return {x: proj.x, y: proj.y * this.projection.stretchY};
}
