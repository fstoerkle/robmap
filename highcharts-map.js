/**
 * options: {
 *      container: ...,
 *      width: ...,
 *      height: ...,
 *      robinson: {
 *          width: ..., height: ..., offsetX: ..., offsetY: ...
 *      },
 *
 *      // optional
 *      linkSuffix: ...,
 *      origin: { latitude: ..., longitude: ..., headline: ..., text: , url: ..., position: ... },,
 *      destinations: [
 *          { latitude: ..., longitude: ..., headline: ..., text: , url: ..., position: ... },
 *          ...
 *      ]
 * }
 */
function HighchartsMap(container, options) {
    this.options = options;
    this.options.container = container;

    this.styles = {
        standard:   {'z-index': 3, fill: '#032C57', 'fill-opacity': 0.8},
        line:       {'z-index': 1, fill: 'none', stroke: '#032C57', 'stroke-width': 1, 'stroke-opacity': 0.5}
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

        options.projection.width    = urlParams['_width']    ? parseInt(urlParams['_width'])      : options.projection.width;
        options.projection.height   = urlParams['_height']   ? parseInt(urlParams['_height'])     : options.projection.height;
        options.projection.offsetX  = urlParams['_xoff']     ? parseInt(urlParams['_xoff'])       : options.projection.offsetX;
        options.projection.offsetY  = urlParams['_yoff']     ? parseInt(urlParams['_yoff'])       : options.projection.offsetY;
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
 * @param item  {
 *              latitude: 'the latitude of the point',
 *              longitude: 'the latitude of the point',
 *              headline: 'the first line of text, rendered bold'
 *              text: 'the second line with text'
 *              url: 'the link destination'
 *          }
 * @param isOrigin  true if the point to be drawn is the origin
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
    var offset = {x: delta.y/110 * (-20),   y: delta.x/110 * (-20)};

    // control points: (x1,y1) is near to the start point, (x2,y2) is near the destination
    var ctrl    = {x1: from.x - sign.x*delta.x/3 + offset.x,
                    y1: from.y + delta.y/3 + offset.y,
                    x2: to.x + sign.x*delta.x/3 + offset.x,
                    y2: to.y - delta.y/3 + offset.y};

    // draw bezier curve control points (for debugging)
    //this.renderer.circle(ctrl.x1, ctrl.y1, 2).attr({'z-index': 20, fill: 'red', 'fill-opacity': 1}).add();
    //this.renderer.circle(ctrl.x2, ctrl.y2, 2).attr({'z-index': 20, fill: 'red', 'fill-opacity': 1}).add();

    // draw curved line from origin to destination
    return this.renderer.path([
               'M', from.x, from.y,         // origin
               'C', ctrl.x1, ctrl.y1,       // 1st control point
                    ctrl.x2, ctrl.y2,       // 2nd control point
                    to.x, to.y              // destination
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