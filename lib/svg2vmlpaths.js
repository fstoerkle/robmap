/*
 *
 * The meaning of characters in the path element's data attribute of SVG and
 * VML respectively, as looked up in the corresponding spec.
 *
 * SVG
 *   m/M : relative/absolute moveto
 *   l/L : relative/absolute lineto
 *   h/H : relative/absolute horizontal lineto
 *   v/V : relative/absolute vertical lineto
 *   z/Z : close
 *
 * VML
 *   m   : absolute moveto
 *   l   : absolute lineto
 *   x   : close
 *
 */

var convertSvg2Vml = (function() {
	var svgData = [], data = [],
		svgDataLength = 0,
		lastX = 0, lastY = 0,
		maxDataLen = -1, minDataLen = 1000000,
		count = 0;

	function move(x, y) {
		data.push('m');

		data.push(x);
		lastX = x;

		data.push(y);
		lastY = y;
	}

	function lineto(x, y) {
		data.push('l');

		if (x) {
			data.push(x);
			lastX = x;
		}

		if (y) {
			data.push(y);
			lastY = y;
		}
	}

	function close() {
		data.push('x');
	}

	function getSvgData(index) {
		return parseFloat(svgData[index]);
	}

	function parse() {
		var i, command;

		for (i=0; i<svgDataLength; ++i) {
			command = svgData[i];

			// we expect a command of type string
			if (typeof command !== "string") {
				alert("Error parsing path data: " + svgData);
			}

			switch (command) {
			case 'm':	// SVG 'relative moveto' -> VML 'absolute moveto'
				move(lastX + getSvgData(++i), lastY + getSvgData(++i));
				break;

			case 'M':	// SVG 'absolute moveto' -> VML 'absolute moveto'
				move(getSvgData(++i), getSvgData(++i));
				break;

			case 'l':	// SVG 'relative lineto' -> VML 'absolute lineto'
				lineto(lastX + getSvgData(++i), lastY + getSvgData(++i));
				break;

			case 'L':	// SVG 'absolute lineto' -> VML 'absolute lineto'
				lineto(getSvgData(++i), getSvgData(++i));
				break;

			case 'H':	// SVG 'absolute horizontal lineto' -> VML 'absolute lineto'
				lineto(getSvgData(++i), lastY);
				break;

			case 'h':	// SVG 'relative horizontal lineto' -> VML 'absolute lineto'
				lineto(lastX + getSvgData(++i), lastY);
				break;

			case 'V':	// SVG 'absolute vertical lineto' -> VML 'absolute lineto'
				lineto(lastX, getSvgData(++i));
				break;

			case 'v':	// SVG 'relative vertical lineto' -> VML 'absolute lineto'
				lineto(lastX, lastY + getSvgData(++i));
				break;

			case 'z':
			case 'Z':
				close();
				break;

			default:
				//this.data.push(command);
				break;
			}
		}
	}

	return function(svg) {
		svgData = svg;
		svgDataLength = svg.length;

		parse();

		maxDataLen = svgDataLength > maxDataLen ? svgDataLength : maxDataLen;
		minDataLen = svgDataLength < minDataLen ? svgDataLength : minDataLen;
		count++;

		return data;
	}
})();