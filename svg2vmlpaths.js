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