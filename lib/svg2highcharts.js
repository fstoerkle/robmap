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
     * @param container     selector for element to be used as canvas
     * @param svgUrl        the URL of the SVG map
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

        // workaround for IE7/8 which do not support SVG
        vmlCoords = convertSvg2Vml(rawCoords);
        if ($.browser.msie && ($.browser.version == "7.0" || $.browser.version == "8.0")) {

            return this.renderer.path(vmlCoords).attr(this.defaultStyles);
        } else {
            return this.renderer.path($.grep(rawCoords, function(item, index) {
                return item; // filters all empty strings or null values
            })).attr(this.defaultStyles);
        }


    },

    g: function(node) {
        return this.renderer.g(node.id);
    }
}