define("echarts/chart/force", [
  "require",
  "./base",
  "../data/Graph",
  "../layout/Force",
  "zrender/shape/Line",
  "zrender/shape/BezierCurve",
  "zrender/shape/Image",
  "../util/shape/Icon",
  "../config",
  "../util/ecData",
  "zrender/tool/util",
  "zrender/config",
  "zrender/tool/vector",
  "../chart",
], function (t) {
  "use strict";
  function e(t, e, a, l, d) {
    var p = this;
    n.call(this, t, e, a, l, d),
      (this.__nodePositionMap = {}),
      (this._graph = new r(!0)),
      (this._layout = new h()),
      (this._layout.onupdate = function () {
        p._step();
      }),
      (this._steps = 1),
      (this.ondragstart = function () {
        i.apply(p, arguments);
      }),
      (this.ondragend = function () {
        o.apply(p, arguments);
      }),
      (this.ondrop = function () {}),
      (this.shapeHandler.ondragstart = function () {
        p.isDragstart = !0;
      }),
      (this.onmousemove = function () {
        s.apply(p, arguments);
      }),
      this.refresh(l);
  }
  function i(t) {
    if (this.isDragstart && t.target) {
      var e = t.target;
      (e.fixed = !0),
        (this.isDragstart = !1),
        this.zr.on(y.EVENT.MOUSEMOVE, this.onmousemove);
    }
  }
  function s() {
    (this._layout.temperature = 0.8), this._step();
  }
  function o(t, e) {
    if (this.isDragend && t.target) {
      var i = t.target;
      (i.fixed = !1),
        (e.dragIn = !0),
        (e.needRefresh = !1),
        (this.isDragend = !1),
        this.zr.un(y.EVENT.MOUSEMOVE, this.onmousemove);
    }
  }
  function a(t, e, i) {
    var s = m.create();
    return (
      (s[0] = (Math.random() - 0.5) * i + t),
      (s[1] = (Math.random() - 0.5) * i + e),
      s
    );
  }
  var n = t("./base"),
    r = t("../data/Graph"),
    h = t("../layout/Force"),
    l = t("zrender/shape/Line"),
    d = t("zrender/shape/BezierCurve"),
    p = t("zrender/shape/Image"),
    c = t("../util/shape/Icon"),
    u = t("../config");
  u.force = {
    zlevel: 1,
    z: 2,
    center: ["50%", "50%"],
    size: "80%",
    preventOverlap: !1,
    coolDown: 0.99,
    minRadius: 10,
    maxRadius: 20,
    ratioScaling: !1,
    large: !1,
    useWorker: !1,
    steps: 1,
    scaling: 1,
    gravity: 1.2,
    symbol: "circle",
    symbolSize: 0,
    linkSymbol: null,
    linkSymbolSize: [10, 15],
    draggable: !0,
    clickable: !0,
    roam: !1,
    itemStyle: {
      normal: {
        label: { show: !1, position: "inside" },
        nodeStyle: {
          brushType: "both",
          borderColor: "#5182ab",
          borderWidth: 1,
        },
        linkStyle: { color: "#5182ab", width: 1, type: "line" },
      },
      emphasis: {
        label: { show: !1 },
        nodeStyle: {},
        linkStyle: { opacity: 0 },
      },
    },
  };
  var g = t("../util/ecData"),
    f = t("zrender/tool/util"),
    y = t("zrender/config"),
    m = t("zrender/tool/vector");
  return (
    (e.prototype = {
      constructor: e,
      type: u.CHART_TYPE_FORCE,
      _init: function () {
        var t,
          e = this.component.legend,
          i = this.series;
        this.clear();
        for (var s = 0, o = i.length; o > s; s++) {
          var a = i[s];
          if (a.type === u.CHART_TYPE_FORCE) {
            if (
              ((i[s] = this.reformOption(i[s])),
              (t = i[s].name || ""),
              (this.selectedMap[t] = e ? e.isSelected(t) : !0),
              !this.selectedMap[t])
            )
              continue;
            this.buildMark(s), this._initSerie(a, s);
            break;
          }
        }
        this.animationEffect();
      },
      _getNodeCategory: function (t, e) {
        return t.categories && t.categories[e.category || 0];
      },
      _getNodeQueryTarget: function (t, e, i) {
        i = i || "normal";
        var s = this._getNodeCategory(t, e) || {};
        return [
          e.itemStyle && e.itemStyle[i],
          s && s.itemStyle && s.itemStyle[i],
          t.itemStyle[i].nodeStyle,
        ];
      },
      _getEdgeQueryTarget: function (t, e, i) {
        return (
          (i = i || "normal"),
          [e.itemStyle && e.itemStyle[i], t.itemStyle[i].linkStyle]
        );
      },
      _initSerie: function (t, e) {
        (this._temperature = 1),
          (this._graph = t.data
            ? this._getSerieGraphFromDataMatrix(t)
            : this._getSerieGraphFromNodeLinks(t)),
          this._buildLinkShapes(t, e),
          this._buildNodeShapes(t, e);
        var i = t.roam === !0 || "move" === t.roam,
          s = t.roam === !0 || "scale" === t.roam;
        this.zr.modLayer(this.getZlevelBase(), { panable: i, zoomable: s }),
          (this.query("markPoint.effect.show") ||
            this.query("markLine.effect.show")) &&
            this.zr.modLayer(u.EFFECT_ZLEVEL, { panable: i, zoomable: s }),
          this._initLayout(t),
          this._step();
      },
      _getSerieGraphFromDataMatrix: function (t) {
        for (var e = [], i = 0, s = [], o = 0; o < t.matrix.length; o++)
          s[o] = t.matrix[o].slice();
        for (var a = t.data || t.nodes, o = 0; o < a.length; o++) {
          var n = {},
            h = a[o];
          for (var l in h) "name" === l ? (n.id = h.name) : (n[l] = h[l]);
          var d = this._getNodeCategory(t, h),
            p = d ? d.name : h.name;
          if (((this.selectedMap[p] = this.isSelected(p)), this.selectedMap[p]))
            e.push(n), i++;
          else {
            s.splice(i, 1);
            for (var c = 0; c < s.length; c++) s[c].splice(i, 1);
          }
        }
        var u = r.fromMatrix(e, s, !0);
        return (
          u.eachNode(function (t, e) {
            (t.layout = { size: t.data.value, mass: 0 }), (t.rawIndex = e);
          }),
          u.eachEdge(function (t) {
            t.layout = { weight: t.data.weight };
          }),
          u
        );
      },
      _getSerieGraphFromNodeLinks: function (t) {
        for (
          var e = new r(!0), i = t.data || t.nodes, s = 0, o = i.length;
          o > s;
          s++
        ) {
          var a = i[s];
          if (a && !a.ignore) {
            var n = this._getNodeCategory(t, a),
              h = n ? n.name : a.name;
            if (
              ((this.selectedMap[h] = this.isSelected(h)), this.selectedMap[h])
            ) {
              var l = e.addNode(a.name, a);
              l.rawIndex = s;
            }
          }
        }
        for (var s = 0, o = t.links.length; o > s; s++) {
          var d = t.links[s],
            p = d.source,
            c = d.target;
          "number" == typeof p && ((p = i[p]), p && (p = p.name)),
            "number" == typeof c && ((c = i[c]), c && (c = c.name));
          var u = e.addEdge(p, c, d);
          u && (u.rawIndex = s);
        }
        return (
          e.eachNode(function (t) {
            var e = t.data.value;
            if (null == e) {
              e = 0;
              for (var i = 0; i < t.edges.length; i++)
                e += t.edges[i].data.weight || 0;
            }
            t.layout = { size: e, mass: 0 };
          }),
          e.eachEdge(function (t) {
            t.layout = { weight: null == t.data.weight ? 1 : t.data.weight };
          }),
          e
        );
      },
      _initLayout: function (t) {
        var e = this._graph,
          i = e.nodes.length,
          s = this.query(t, "minRadius"),
          o = this.query(t, "maxRadius");
        (this._steps = t.steps || 1),
          (this._layout.center = this.parseCenter(this.zr, t.center)),
          (this._layout.width = this.parsePercent(t.size, this.zr.getWidth())),
          (this._layout.height = this.parsePercent(
            t.size,
            this.zr.getHeight()
          )),
          (this._layout.large = t.large),
          (this._layout.scaling = t.scaling),
          (this._layout.ratioScaling = t.ratioScaling),
          (this._layout.gravity = t.gravity),
          (this._layout.temperature = 1),
          (this._layout.coolDown = t.coolDown),
          (this._layout.preventNodeEdgeOverlap = t.preventOverlap),
          (this._layout.preventNodeOverlap = t.preventOverlap);
        for (var n = 1 / 0, r = -1 / 0, h = 0; i > h; h++) {
          var l = e.nodes[h];
          (r = Math.max(l.layout.size, r)), (n = Math.min(l.layout.size, n));
        }
        for (var d = r - n, h = 0; i > h; h++) {
          var l = e.nodes[h];
          d > 0
            ? ((l.layout.size = ((l.layout.size - n) * (o - s)) / d + s),
              (l.layout.mass = l.layout.size / o))
            : ((l.layout.size = (o - s) / 2), (l.layout.mass = 0.5));
        }
        for (var h = 0; i > h; h++) {
          var l = e.nodes[h];
          if ("undefined" != typeof this.__nodePositionMap[l.id])
            (l.layout.position = m.create()),
              m.copy(l.layout.position, this.__nodePositionMap[l.id]);
          else if ("undefined" != typeof l.data.initial)
            (l.layout.position = m.create()),
              m.copy(l.layout.position, l.data.initial);
          else {
            var p = this._layout.center,
              c = Math.min(this._layout.width, this._layout.height);
            l.layout.position = a(p[0], p[1], 0.8 * c);
          }
          var u = l.shape.style,
            g = l.layout.size;
          (u.width = u.width || 2 * g),
            (u.height = u.height || 2 * g),
            (u.x = -u.width / 2),
            (u.y = -u.height / 2),
            m.copy(l.shape.position, l.layout.position);
        }
        (i = e.edges.length), (r = -1 / 0);
        for (var h = 0; i > h; h++) {
          var f = e.edges[h];
          f.layout.weight > r && (r = f.layout.weight);
        }
        for (var h = 0; i > h; h++) {
          var f = e.edges[h];
          f.layout.weight /= r;
        }
        this._layout.init(e, t.useWorker);
      },
      _buildNodeShapes: function (t, e) {
        var i = this._graph,
          s = this.query(t, "categories");
        i.eachNode(function (i) {
          var o = this._getNodeCategory(t, i.data),
            a = [i.data, o, t],
            n = this._getNodeQueryTarget(t, i.data),
            r = this._getNodeQueryTarget(t, i.data, "emphasis"),
            h = new c({
              style: {
                x: 0,
                y: 0,
                color: this.deepQuery(n, "color"),
                brushType: "both",
                strokeColor:
                  this.deepQuery(n, "strokeColor") ||
                  this.deepQuery(n, "borderColor"),
                lineWidth:
                  this.deepQuery(n, "lineWidth") ||
                  this.deepQuery(n, "borderWidth"),
              },
              highlightStyle: {
                color: this.deepQuery(r, "color"),
                strokeColor:
                  this.deepQuery(r, "strokeColor") ||
                  this.deepQuery(r, "borderColor"),
                lineWidth:
                  this.deepQuery(r, "lineWidth") ||
                  this.deepQuery(r, "borderWidth"),
              },
              clickable: t.clickable,
              zlevel: this.getZlevelBase(),
              z: this.getZBase(),
            });
          h.style.color || (h.style.color = this.getColor(o ? o.name : i.id)),
            (h.style.iconType = this.deepQuery(a, "symbol")),
            (h.style.width = h.style.height =
              2 * (this.deepQuery(a, "symbolSize") || 0)),
            h.style.iconType.match("image") &&
              ((h.style.image = h.style.iconType.replace(
                new RegExp("^image:\\/\\/"),
                ""
              )),
              (h = new p({
                style: h.style,
                highlightStyle: h.highlightStyle,
                clickable: h.clickable,
                zlevel: this.getZlevelBase(),
                z: this.getZBase(),
              }))),
            this.deepQuery(a, "itemStyle.normal.label.show") &&
              ((h.style.text = null == i.data.label ? i.id : i.data.label),
              (h.style.textPosition = this.deepQuery(
                a,
                "itemStyle.normal.label.position"
              )),
              (h.style.textColor = this.deepQuery(
                a,
                "itemStyle.normal.label.textStyle.color"
              )),
              (h.style.textFont = this.getFont(
                this.deepQuery(a, "itemStyle.normal.label.textStyle") || {}
              ))),
            this.deepQuery(a, "itemStyle.emphasis.label.show") &&
              ((h.highlightStyle.textPosition = this.deepQuery(
                a,
                "itemStyle.emphasis.label.position"
              )),
              (h.highlightStyle.textColor = this.deepQuery(
                a,
                "itemStyle.emphasis.label.textStyle.color"
              )),
              (h.highlightStyle.textFont = this.getFont(
                this.deepQuery(a, "itemStyle.emphasis.label.textStyle") || {}
              ))),
            this.deepQuery(a, "draggable") &&
              (this.setCalculable(h),
              (h.dragEnableTime = 0),
              (h.draggable = !0),
              (h.ondragstart = this.shapeHandler.ondragstart),
              (h.ondragover = null));
          var l = "";
          if ("undefined" != typeof i.category) {
            var o = s[i.category];
            l = (o && o.name) || "";
          }
          g.pack(h, t, e, i.data, i.rawIndex, i.data.name || "", i.category),
            this.shapeList.push(h),
            this.zr.addShape(h),
            (i.shape = h);
        }, this);
      },
      _buildLinkShapes: function (t, e) {
        for (var i = this._graph, s = i.edges.length, o = 0; s > o; o++) {
          var a = i.edges[o],
            n = a.data,
            r = a.node1,
            h = a.node2,
            p = this._getEdgeQueryTarget(t, n),
            u = this.deepQuery(p, "type");
          t.linkSymbol && "none" !== t.linkSymbol && (u = "line");
          var y = "line" === u ? l : d,
            m = new y({
              style: { xStart: 0, yStart: 0, xEnd: 0, yEnd: 0 },
              clickable: this.query(t, "clickable"),
              highlightStyle: {},
              zlevel: this.getZlevelBase(),
              z: this.getZBase(),
            });
          if (
            (f.merge(m.style, this.query(t, "itemStyle.normal.linkStyle"), !0),
            f.merge(
              m.highlightStyle,
              this.query(t, "itemStyle.emphasis.linkStyle"),
              !0
            ),
            "undefined" != typeof n.itemStyle &&
              (n.itemStyle.normal && f.merge(m.style, n.itemStyle.normal, !0),
              n.itemStyle.emphasis &&
                f.merge(m.highlightStyle, n.itemStyle.emphasis, !0)),
            (m.style.lineWidth = m.style.lineWidth || m.style.width),
            (m.style.strokeColor = m.style.strokeColor || m.style.color),
            (m.highlightStyle.lineWidth =
              m.highlightStyle.lineWidth || m.highlightStyle.width),
            (m.highlightStyle.strokeColor =
              m.highlightStyle.strokeColor || m.highlightStyle.color),
            g.pack(
              m,
              t,
              e,
              a.data,
              null == a.rawIndex ? o : a.rawIndex,
              a.data.name || r.id + " - " + h.id,
              r.id,
              h.id
            ),
            this.shapeList.push(m),
            this.zr.addShape(m),
            (a.shape = m),
            t.linkSymbol && "none" !== t.linkSymbol)
          ) {
            var _ = new c({
              style: {
                x: -5,
                y: 0,
                width: t.linkSymbolSize[0],
                height: t.linkSymbolSize[1],
                iconType: t.linkSymbol,
                brushType: "fill",
                color: m.style.strokeColor,
              },
              highlightStyle: { brushType: "fill" },
              position: [0, 0],
              rotation: 0,
            });
            (m._symbolShape = _), this.shapeList.push(_), this.zr.addShape(_);
          }
        }
      },
      _updateLinkShapes: function () {
        for (
          var t = m.create(), e = this._graph.edges, i = 0, s = e.length;
          s > i;
          i++
        ) {
          var o = e[i],
            a = o.node1.shape,
            n = o.node2.shape,
            r = a.position,
            h = n.position;
          if (
            ((o.shape.style.xStart = r[0]),
            (o.shape.style.yStart = r[1]),
            (o.shape.style.xEnd = h[0]),
            (o.shape.style.yEnd = h[1]),
            "bezier-curve" === o.shape.type &&
              ((o.shape.style.cpX1 = (r[0] + h[0]) / 2 - (h[1] - r[1]) / 4),
              (o.shape.style.cpY1 = (r[1] + h[1]) / 2 - (r[0] - h[0]) / 4)),
            o.shape.modSelf(),
            o.shape._symbolShape)
          ) {
            var l = o.shape._symbolShape;
            m.copy(l.position, n.position),
              m.sub(t, a.position, n.position),
              m.normalize(t, t),
              m.scaleAndAdd(l.position, l.position, t, n.style.width / 2 + 2);
            var d = Math.atan2(t[1], t[0]);
            (l.rotation = Math.PI / 2 - d), l.modSelf();
          }
        }
      },
      _syncNodePositions: function () {
        for (var t = this._graph, e = 0; e < t.nodes.length; e++) {
          var i = t.nodes[e],
            s = i.layout.position,
            o = i.data,
            a = i.shape,
            n = a.fixed || o.fixX,
            r = a.fixed || o.fixY;
          n === !0 ? (n = 1) : isNaN(n) && (n = 0),
            r === !0 ? (r = 1) : isNaN(r) && (r = 0),
            (a.position[0] += (s[0] - a.position[0]) * (1 - n)),
            (a.position[1] += (s[1] - a.position[1]) * (1 - r)),
            m.copy(s, a.position);
          var h = o.name;
          if (h) {
            var l = this.__nodePositionMap[h];
            l || (l = this.__nodePositionMap[h] = m.create()), m.copy(l, s);
          }
          a.modSelf();
        }
      },
      _step: function () {
        this._syncNodePositions(),
          this._updateLinkShapes(),
          this.zr.refreshNextFrame(),
          this._layout.temperature > 0.01
            ? this._layout.step(this._steps)
            : this.messageCenter.dispatch(
                u.EVENT.FORCE_LAYOUT_END,
                {},
                {},
                this.myChart
              );
      },
      refresh: function (t) {
        if (
          (t && ((this.option = t), (this.series = this.option.series)),
          (this.legend = this.component.legend),
          this.legend)
        )
          (this.getColor = function (t) {
            return this.legend.getColor(t);
          }),
            (this.isSelected = function (t) {
              return this.legend.isSelected(t);
            });
        else {
          var e = {},
            i = 0;
          (this.getColor = function (t) {
            return e[t] ? e[t] : (e[t] || (e[t] = this.zr.getColor(i++)), e[t]);
          }),
            (this.isSelected = function () {
              return !0;
            });
        }
        this._init();
      },
      dispose: function () {
        this.clear(),
          (this.shapeList = null),
          (this.effectList = null),
          this._layout.dispose(),
          (this._layout = null),
          (this.__nodePositionMap = {});
      },
      getPosition: function () {
        var t = [];
        return (
          this._graph.eachNode(function (e) {
            e.layout &&
              t.push({
                name: e.data.name,
                position: Array.prototype.slice.call(e.layout.position),
              });
          }),
          t
        );
      },
    }),
    f.inherits(e, n),
    t("../chart").define("force", e),
    e
  );
}),
  define("echarts/data/Graph", ["require", "zrender/tool/util"], function (t) {
    var e = t("zrender/tool/util"),
      i = function (t) {
        (this._directed = t || !1),
          (this.nodes = []),
          (this.edges = []),
          (this._nodesMap = {}),
          (this._edgesMap = {});
      };
    (i.prototype.isDirected = function () {
      return this._directed;
    }),
      (i.prototype.addNode = function (t, e) {
        if (this._nodesMap[t]) return this._nodesMap[t];
        var s = new i.Node(t, e);
        return this.nodes.push(s), (this._nodesMap[t] = s), s;
      }),
      (i.prototype.getNodeById = function (t) {
        return this._nodesMap[t];
      }),
      (i.prototype.addEdge = function (t, e, s) {
        if (
          ("string" == typeof t && (t = this._nodesMap[t]),
          "string" == typeof e && (e = this._nodesMap[e]),
          t && e)
        ) {
          var o = t.id + "-" + e.id;
          if (this._edgesMap[o]) return this._edgesMap[o];
          var a = new i.Edge(t, e, s);
          return (
            this._directed && (t.outEdges.push(a), e.inEdges.push(a)),
            t.edges.push(a),
            t !== e && e.edges.push(a),
            this.edges.push(a),
            (this._edgesMap[o] = a),
            a
          );
        }
      }),
      (i.prototype.removeEdge = function (t) {
        var i = t.node1,
          s = t.node2,
          o = i.id + "-" + s.id;
        this._directed &&
          (i.outEdges.splice(e.indexOf(i.outEdges, t), 1),
          s.inEdges.splice(e.indexOf(s.inEdges, t), 1)),
          i.edges.splice(e.indexOf(i.edges, t), 1),
          i !== s && s.edges.splice(e.indexOf(s.edges, t), 1),
          delete this._edgesMap[o],
          this.edges.splice(e.indexOf(this.edges, t), 1);
      }),
      (i.prototype.getEdge = function (t, e) {
        return (
          "string" != typeof t && (t = t.id),
          "string" != typeof e && (e = e.id),
          this._directed
            ? this._edgesMap[t + "-" + e]
            : this._edgesMap[t + "-" + e] || this._edgesMap[e + "-" + t]
        );
      }),
      (i.prototype.removeNode = function (t) {
        if ("string" != typeof t || (t = this._nodesMap[t])) {
          delete this._nodesMap[t.id],
            this.nodes.splice(e.indexOf(this.nodes, t), 1);
          for (var i = 0; i < this.edges.length; ) {
            var s = this.edges[i];
            s.node1 === t || s.node2 === t ? this.removeEdge(s) : i++;
          }
        }
      }),
      (i.prototype.filterNode = function (t, e) {
        for (var i = this.nodes.length, s = 0; i > s; )
          t.call(e, this.nodes[s], s)
            ? s++
            : (this.removeNode(this.nodes[s]), i--);
      }),
      (i.prototype.filterEdge = function (t, e) {
        for (var i = this.edges.length, s = 0; i > s; )
          t.call(e, this.edges[s], s)
            ? s++
            : (this.removeEdge(this.edges[s]), i--);
      }),
      (i.prototype.eachNode = function (t, e) {
        for (var i = this.nodes.length, s = 0; i > s; s++)
          this.nodes[s] && t.call(e, this.nodes[s], s);
      }),
      (i.prototype.eachEdge = function (t, e) {
        for (var i = this.edges.length, s = 0; i > s; s++)
          this.edges[s] && t.call(e, this.edges[s], s);
      }),
      (i.prototype.clear = function () {
        (this.nodes.length = 0),
          (this.edges.length = 0),
          (this._nodesMap = {}),
          (this._edgesMap = {});
      }),
      (i.prototype.breadthFirstTraverse = function (t, e, i, s) {
        if (("string" == typeof e && (e = this._nodesMap[e]), e)) {
          var o = "edges";
          "out" === i ? (o = "outEdges") : "in" === i && (o = "inEdges");
          for (var a = 0; a < this.nodes.length; a++)
            this.nodes[a].__visited = !1;
          if (!t.call(s, e, null))
            for (var n = [e]; n.length; )
              for (var r = n.shift(), h = r[o], a = 0; a < h.length; a++) {
                var l = h[a],
                  d = l.node1 === r ? l.node2 : l.node1;
                if (!d.__visited) {
                  if (t.call(d, d, r)) return;
                  n.push(d), (d.__visited = !0);
                }
              }
        }
      }),
      (i.prototype.clone = function () {
        for (var t = new i(this._directed), e = 0; e < this.nodes.length; e++)
          t.addNode(this.nodes[e].id, this.nodes[e].data);
        for (var e = 0; e < this.edges.length; e++) {
          var s = this.edges[e];
          t.addEdge(s.node1.id, s.node2.id, s.data);
        }
        return t;
      });
    var s = function (t, e) {
      (this.id = t),
        (this.data = e || null),
        (this.inEdges = []),
        (this.outEdges = []),
        (this.edges = []);
    };
    (s.prototype.degree = function () {
      return this.edges.length;
    }),
      (s.prototype.inDegree = function () {
        return this.inEdges.length;
      }),
      (s.prototype.outDegree = function () {
        return this.outEdges.length;
      });
    var o = function (t, e, i) {
      (this.node1 = t), (this.node2 = e), (this.data = i || null);
    };
    return (
      (i.Node = s),
      (i.Edge = o),
      (i.fromMatrix = function (t, e, s) {
        if (
          e &&
          e.length &&
          e[0].length === e.length &&
          t.length === e.length
        ) {
          for (var o = e.length, a = new i(s), n = 0; o > n; n++) {
            var r = a.addNode(t[n].id, t[n]);
            (r.data.value = 0), s && (r.data.outValue = r.data.inValue = 0);
          }
          for (var n = 0; o > n; n++)
            for (var h = 0; o > h; h++) {
              var l = e[n][h];
              s &&
                ((a.nodes[n].data.outValue += l),
                (a.nodes[h].data.inValue += l)),
                (a.nodes[n].data.value += l),
                (a.nodes[h].data.value += l);
            }
          for (var n = 0; o > n; n++)
            for (var h = n; o > h; h++) {
              var l = e[n][h];
              if (0 !== l) {
                var d = a.nodes[n],
                  p = a.nodes[h],
                  c = a.addEdge(d, p, {});
                if (((c.data.weight = l), n !== h && s && e[h][n])) {
                  var u = a.addEdge(p, d, {});
                  u.data.weight = e[h][n];
                }
              }
            }
          return a;
        }
      }),
      i
    );
  }),
  define("echarts/layout/Force", [
    "require",
    "./forceLayoutWorker",
    "zrender/tool/vector",
  ], function (t) {
    function e() {
      if ("undefined" != typeof Worker && "undefined" != typeof Blob)
        try {
          var t = new Blob([s.getWorkerCode()]);
          i = window.URL.createObjectURL(t);
        } catch (e) {
          i = "";
        }
      return i;
    }
    var i,
      s = t("./forceLayoutWorker"),
      o = t("zrender/tool/vector"),
      a =
        window.requestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        function (t) {
          setTimeout(t, 16);
        },
      n = "undefined" == typeof Float32Array ? Array : Float32Array,
      r = function (t) {
        "undefined" == typeof i && e(),
          (t = t || {}),
          (this.width = t.width || 500),
          (this.height = t.height || 500),
          (this.center = t.center || [this.width / 2, this.height / 2]),
          (this.ratioScaling = t.ratioScaling || !1),
          (this.scaling = t.scaling || 1),
          (this.gravity = "undefined" != typeof t.gravity ? t.gravity : 1),
          (this.large = t.large || !1),
          (this.preventNodeOverlap = t.preventNodeOverlap || !1),
          (this.preventNodeEdgeOverlap = t.preventNodeEdgeOverlap || !1),
          (this.maxSpeedIncrease = t.maxSpeedIncrease || 1),
          (this.onupdate = t.onupdate || function () {}),
          (this.temperature = t.temperature || 1),
          (this.coolDown = t.coolDown || 0.99),
          (this._layout = null),
          (this._layoutWorker = null);
        var s = this,
          o = this._$onupdate;
        this._$onupdate = function (t) {
          o.call(s, t);
        };
      };
    return (
      (r.prototype.updateConfig = function () {
        var t = this.width,
          e = this.height,
          i = Math.min(t, e),
          s = {
            center: this.center,
            width: this.ratioScaling ? t : i,
            height: this.ratioScaling ? e : i,
            scaling: this.scaling || 1,
            gravity: this.gravity || 1,
            barnesHutOptimize: this.large,
            preventNodeOverlap: this.preventNodeOverlap,
            preventNodeEdgeOverlap: this.preventNodeEdgeOverlap,
            maxSpeedIncrease: this.maxSpeedIncrease,
          };
        if (this._layoutWorker)
          this._layoutWorker.postMessage({ cmd: "updateConfig", config: s });
        else for (var o in s) this._layout[o] = s[o];
      }),
      (r.prototype.init = function (t, e) {
        if (i && e)
          try {
            this._layoutWorker ||
              ((this._layoutWorker = new Worker(i)),
              (this._layoutWorker.onmessage = this._$onupdate)),
              (this._layout = null);
          } catch (o) {
            (this._layoutWorker = null),
              this._layout || (this._layout = new s());
          }
        else
          this._layout || (this._layout = new s()),
            this._layoutWorker &&
              (this._layoutWorker.terminate(), (this._layoutWorker = null));
        (this.temperature = 1), (this.graph = t);
        for (
          var a = t.nodes.length,
            r = new n(2 * a),
            h = new n(a),
            l = new n(a),
            d = 0;
          a > d;
          d++
        ) {
          var p = t.nodes[d];
          (r[2 * d] = p.layout.position[0]),
            (r[2 * d + 1] = p.layout.position[1]),
            (h[d] = "undefined" == typeof p.layout.mass ? 1 : p.layout.mass),
            (l[d] = "undefined" == typeof p.layout.size ? 1 : p.layout.size),
            (p.layout.__index = d);
        }
        a = t.edges.length;
        for (var c = new n(2 * a), u = new n(a), d = 0; a > d; d++) {
          var g = t.edges[d];
          (c[2 * d] = g.node1.layout.__index),
            (c[2 * d + 1] = g.node2.layout.__index),
            (u[d] = g.layout.weight || 1);
        }
        this._layoutWorker
          ? this._layoutWorker.postMessage({
              cmd: "init",
              nodesPosition: r,
              nodesMass: h,
              nodesSize: l,
              edges: c,
              edgesWeight: u,
            })
          : (this._layout.initNodes(r, h, l), this._layout.initEdges(c, u)),
          this.updateConfig();
      }),
      (r.prototype.step = function (t) {
        var e = this.graph.nodes;
        if (this._layoutWorker) {
          for (var i = new n(2 * e.length), s = 0; s < e.length; s++) {
            var r = e[s];
            (i[2 * s] = r.layout.position[0]),
              (i[2 * s + 1] = r.layout.position[1]);
          }
          this._layoutWorker.postMessage(i.buffer, [i.buffer]),
            this._layoutWorker.postMessage({
              cmd: "update",
              steps: t,
              temperature: this.temperature,
              coolDown: this.coolDown,
            });
          for (var s = 0; t > s; s++) this.temperature *= this.coolDown;
        } else {
          a(this._$onupdate);
          for (var s = 0; s < e.length; s++) {
            var r = e[s];
            o.copy(this._layout.nodes[s].position, r.layout.position);
          }
          for (var s = 0; t > s; s++)
            (this._layout.temperature = this.temperature),
              this._layout.update(),
              (this.temperature *= this.coolDown);
        }
      }),
      (r.prototype._$onupdate = function (t) {
        if (this._layoutWorker) {
          for (
            var e = new Float32Array(t.data), i = 0;
            i < this.graph.nodes.length;
            i++
          ) {
            var s = this.graph.nodes[i];
            (s.layout.position[0] = e[2 * i]),
              (s.layout.position[1] = e[2 * i + 1]);
          }
          this.onupdate && this.onupdate();
        } else if (this._layout) {
          for (var i = 0; i < this.graph.nodes.length; i++) {
            var s = this.graph.nodes[i];
            o.copy(s.layout.position, this._layout.nodes[i].position);
          }
          this.onupdate && this.onupdate();
        }
      }),
      (r.prototype.dispose = function () {
        this._layoutWorker && this._layoutWorker.terminate(),
          (this._layoutWorker = null),
          (this._layout = null);
      }),
      r
    );
  }),
  define("zrender/shape/BezierCurve", [
    "require",
    "./Base",
    "../tool/util",
  ], function (t) {
    "use strict";
    var e = t("./Base"),
      i = function (t) {
        (this.brushTypeOnly = "stroke"),
          (this.textPosition = "end"),
          e.call(this, t);
      };
    return (
      (i.prototype = {
        type: "bezier-curve",
        buildPath: function (t, e) {
          t.moveTo(e.xStart, e.yStart),
            "undefined" != typeof e.cpX2 && "undefined" != typeof e.cpY2
              ? t.bezierCurveTo(e.cpX1, e.cpY1, e.cpX2, e.cpY2, e.xEnd, e.yEnd)
              : t.quadraticCurveTo(e.cpX1, e.cpY1, e.xEnd, e.yEnd);
        },
        getRect: function (t) {
          if (t.__rect) return t.__rect;
          var e = Math.min(t.xStart, t.xEnd, t.cpX1),
            i = Math.min(t.yStart, t.yEnd, t.cpY1),
            s = Math.max(t.xStart, t.xEnd, t.cpX1),
            o = Math.max(t.yStart, t.yEnd, t.cpY1),
            a = t.cpX2,
            n = t.cpY2;
          "undefined" != typeof a &&
            "undefined" != typeof n &&
            ((e = Math.min(e, a)),
            (i = Math.min(i, n)),
            (s = Math.max(s, a)),
            (o = Math.max(o, n)));
          var r = t.lineWidth || 1;
          return (
            (t.__rect = {
              x: e - r,
              y: i - r,
              width: s - e + r,
              height: o - i + r,
            }),
            t.__rect
          );
        },
      }),
      t("../tool/util").inherits(i, e),
      i
    );
  }),
  define("echarts/layout/forceLayoutWorker", [
    "require",
    "zrender/tool/vector",
  ], function t(e) {
    "use strict";
    function i() {
      (this.subRegions = []),
        (this.nSubRegions = 0),
        (this.node = null),
        (this.mass = 0),
        (this.centerOfMass = null),
        (this.bbox = new h(4)),
        (this.size = 0);
    }
    function s() {
      (this.position = n.create()),
        (this.force = n.create()),
        (this.forcePrev = n.create()),
        (this.speed = n.create()),
        (this.speedPrev = n.create()),
        (this.mass = 1),
        (this.inDegree = 0),
        (this.outDegree = 0);
    }
    function o(t, e) {
      (this.node1 = t), (this.node2 = e), (this.weight = 1);
    }
    function a() {
      (this.barnesHutOptimize = !1),
        (this.barnesHutTheta = 1.5),
        (this.repulsionByDegree = !1),
        (this.preventNodeOverlap = !1),
        (this.preventNodeEdgeOverlap = !1),
        (this.strongGravity = !0),
        (this.gravity = 1),
        (this.scaling = 1),
        (this.edgeWeightInfluence = 1),
        (this.center = [0, 0]),
        (this.width = 500),
        (this.height = 500),
        (this.maxSpeedIncrease = 1),
        (this.nodes = []),
        (this.edges = []),
        (this.bbox = new h(4)),
        (this._rootRegion = new i()),
        (this._rootRegion.centerOfMass = n.create()),
        (this._massArr = null),
        (this._k = 0);
    }
    var n,
      r = "undefined" == typeof window && "undefined" == typeof e;
    n = r
      ? {
          create: function (t, e) {
            var i = new Float32Array(2);
            return (i[0] = t || 0), (i[1] = e || 0), i;
          },
          dist: function (t, e) {
            var i = e[0] - t[0],
              s = e[1] - t[1];
            return Math.sqrt(i * i + s * s);
          },
          len: function (t) {
            var e = t[0],
              i = t[1];
            return Math.sqrt(e * e + i * i);
          },
          scaleAndAdd: function (t, e, i, s) {
            return (t[0] = e[0] + i[0] * s), (t[1] = e[1] + i[1] * s), t;
          },
          scale: function (t, e, i) {
            return (t[0] = e[0] * i), (t[1] = e[1] * i), t;
          },
          add: function (t, e, i) {
            return (t[0] = e[0] + i[0]), (t[1] = e[1] + i[1]), t;
          },
          sub: function (t, e, i) {
            return (t[0] = e[0] - i[0]), (t[1] = e[1] - i[1]), t;
          },
          dot: function (t, e) {
            return t[0] * e[0] + t[1] * e[1];
          },
          normalize: function (t, e) {
            var i = e[0],
              s = e[1],
              o = i * i + s * s;
            return (
              o > 0 &&
                ((o = 1 / Math.sqrt(o)), (t[0] = e[0] * o), (t[1] = e[1] * o)),
              t
            );
          },
          negate: function (t, e) {
            return (t[0] = -e[0]), (t[1] = -e[1]), t;
          },
          copy: function (t, e) {
            return (t[0] = e[0]), (t[1] = e[1]), t;
          },
          set: function (t, e, i) {
            return (t[0] = e), (t[1] = i), t;
          },
        }
      : e("zrender/tool/vector");
    var h = "undefined" == typeof Float32Array ? Array : Float32Array;
    if (
      ((i.prototype.beforeUpdate = function () {
        for (var t = 0; t < this.nSubRegions; t++)
          this.subRegions[t].beforeUpdate();
        (this.mass = 0),
          this.centerOfMass &&
            ((this.centerOfMass[0] = 0), (this.centerOfMass[1] = 0)),
          (this.nSubRegions = 0),
          (this.node = null);
      }),
      (i.prototype.afterUpdate = function () {
        this.subRegions.length = this.nSubRegions;
        for (var t = 0; t < this.nSubRegions; t++)
          this.subRegions[t].afterUpdate();
      }),
      (i.prototype.addNode = function (t) {
        if (0 === this.nSubRegions) {
          if (null == this.node) return void (this.node = t);
          this._addNodeToSubRegion(this.node), (this.node = null);
        }
        this._addNodeToSubRegion(t), this._updateCenterOfMass(t);
      }),
      (i.prototype.findSubRegion = function (t, e) {
        for (var i = 0; i < this.nSubRegions; i++) {
          var s = this.subRegions[i];
          if (s.contain(t, e)) return s;
        }
      }),
      (i.prototype.contain = function (t, e) {
        return (
          this.bbox[0] <= t &&
          this.bbox[2] >= t &&
          this.bbox[1] <= e &&
          this.bbox[3] >= e
        );
      }),
      (i.prototype.setBBox = function (t, e, i, s) {
        (this.bbox[0] = t),
          (this.bbox[1] = e),
          (this.bbox[2] = i),
          (this.bbox[3] = s),
          (this.size = (i - t + s - e) / 2);
      }),
      (i.prototype._newSubRegion = function () {
        var t = this.subRegions[this.nSubRegions];
        return (
          t || ((t = new i()), (this.subRegions[this.nSubRegions] = t)),
          this.nSubRegions++,
          t
        );
      }),
      (i.prototype._addNodeToSubRegion = function (t) {
        var e = this.findSubRegion(t.position[0], t.position[1]),
          i = this.bbox;
        if (!e) {
          var s = (i[0] + i[2]) / 2,
            o = (i[1] + i[3]) / 2,
            a = (i[2] - i[0]) / 2,
            n = (i[3] - i[1]) / 2,
            r = t.position[0] >= s ? 1 : 0,
            h = t.position[1] >= o ? 1 : 0,
            e = this._newSubRegion();
          e.setBBox(
            r * a + i[0],
            h * n + i[1],
            (r + 1) * a + i[0],
            (h + 1) * n + i[1]
          );
        }
        e.addNode(t);
      }),
      (i.prototype._updateCenterOfMass = function (t) {
        null == this.centerOfMass && (this.centerOfMass = n.create());
        var e = this.centerOfMass[0] * this.mass,
          i = this.centerOfMass[1] * this.mass;
        (e += t.position[0] * t.mass),
          (i += t.position[1] * t.mass),
          (this.mass += t.mass),
          (this.centerOfMass[0] = e / this.mass),
          (this.centerOfMass[1] = i / this.mass);
      }),
      (a.prototype.nodeToNodeRepulsionFactor = function (t, e, i) {
        return (i * i * t) / e;
      }),
      (a.prototype.edgeToNodeRepulsionFactor = function (t, e, i) {
        return (i * t) / e;
      }),
      (a.prototype.attractionFactor = function (t, e, i) {
        return (t * e) / i;
      }),
      (a.prototype.initNodes = function (t, e, i) {
        this.temperature = 1;
        var o = t.length / 2;
        this.nodes.length = 0;
        for (var a = "undefined" != typeof i, n = 0; o > n; n++) {
          var r = new s();
          (r.position[0] = t[2 * n]),
            (r.position[1] = t[2 * n + 1]),
            (r.mass = e[n]),
            a && (r.size = i[n]),
            this.nodes.push(r);
        }
        (this._massArr = e), a && (this._sizeArr = i);
      }),
      (a.prototype.initEdges = function (t, e) {
        var i = t.length / 2;
        this.edges.length = 0;
        for (var s = "undefined" != typeof e, a = 0; i > a; a++) {
          var n = t[2 * a],
            r = t[2 * a + 1],
            h = this.nodes[n],
            l = this.nodes[r];
          if (h && l) {
            h.outDegree++, l.inDegree++;
            var d = new o(h, l);
            s && (d.weight = e[a]), this.edges.push(d);
          }
        }
      }),
      (a.prototype.update = function () {
        var t = this.nodes.length;
        if (
          (this.updateBBox(),
          (this._k =
            0.4 * this.scaling * Math.sqrt((this.width * this.height) / t)),
          this.barnesHutOptimize)
        ) {
          this._rootRegion.setBBox(
            this.bbox[0],
            this.bbox[1],
            this.bbox[2],
            this.bbox[3]
          ),
            this._rootRegion.beforeUpdate();
          for (var e = 0; t > e; e++) this._rootRegion.addNode(this.nodes[e]);
          this._rootRegion.afterUpdate();
        } else {
          var i = 0,
            s = this._rootRegion.centerOfMass;
          n.set(s, 0, 0);
          for (var e = 0; t > e; e++) {
            var o = this.nodes[e];
            (i += o.mass), n.scaleAndAdd(s, s, o.position, o.mass);
          }
          i > 0 && n.scale(s, s, 1 / i);
        }
        this.updateForce(), this.updatePosition();
      }),
      (a.prototype.updateForce = function () {
        for (var t = this.nodes.length, e = 0; t > e; e++) {
          var i = this.nodes[e];
          n.copy(i.forcePrev, i.force),
            n.copy(i.speedPrev, i.speed),
            n.set(i.force, 0, 0);
        }
        this.updateNodeNodeForce(),
          this.gravity > 0 && this.updateGravityForce(),
          this.updateEdgeForce(),
          this.preventNodeEdgeOverlap && this.updateNodeEdgeForce();
      }),
      (a.prototype.updatePosition = function () {
        for (var t = this.nodes.length, e = n.create(), i = 0; t > i; i++) {
          var s = this.nodes[i],
            o = s.speed;
          n.scale(s.force, s.force, 1 / 30);
          var a = n.len(s.force) + 0.1,
            r = Math.min(a, 500) / a;
          n.scale(s.force, s.force, r),
            n.add(o, o, s.force),
            n.scale(o, o, this.temperature),
            n.sub(e, o, s.speedPrev);
          var h = n.len(e);
          if (h > 0) {
            n.scale(e, e, 1 / h);
            var l = n.len(s.speedPrev);
            l > 0 &&
              ((h = Math.min(h / l, this.maxSpeedIncrease) * l),
              n.scaleAndAdd(o, s.speedPrev, e, h));
          }
          var d = n.len(o),
            r = Math.min(d, 100) / (d + 0.1);
          n.scale(o, o, r), n.add(s.position, s.position, o);
        }
      }),
      (a.prototype.updateNodeNodeForce = function () {
        for (var t = this.nodes.length, e = 0; t > e; e++) {
          var i = this.nodes[e];
          if (this.barnesHutOptimize)
            this.applyRegionToNodeRepulsion(this._rootRegion, i);
          else
            for (var s = e + 1; t > s; s++) {
              var o = this.nodes[s];
              this.applyNodeToNodeRepulsion(i, o, !1);
            }
        }
      }),
      (a.prototype.updateGravityForce = function () {
        for (var t = 0; t < this.nodes.length; t++)
          this.applyNodeGravity(this.nodes[t]);
      }),
      (a.prototype.updateEdgeForce = function () {
        for (var t = 0; t < this.edges.length; t++)
          this.applyEdgeAttraction(this.edges[t]);
      }),
      (a.prototype.updateNodeEdgeForce = function () {
        for (var t = 0; t < this.nodes.length; t++)
          for (var e = 0; e < this.edges.length; e++)
            this.applyEdgeToNodeRepulsion(this.edges[e], this.nodes[t]);
      }),
      (a.prototype.applyRegionToNodeRepulsion = (function () {
        var t = n.create();
        return function (e, i) {
          if (e.node) this.applyNodeToNodeRepulsion(e.node, i, !0);
          else {
            if (0 === e.mass && 0 === i.mass) return;
            n.sub(t, i.position, e.centerOfMass);
            var s = t[0] * t[0] + t[1] * t[1];
            if (s > this.barnesHutTheta * e.size * e.size) {
              var o = (this._k * this._k * (i.mass + e.mass)) / (s + 1);
              n.scaleAndAdd(i.force, i.force, t, 2 * o);
            } else
              for (var a = 0; a < e.nSubRegions; a++)
                this.applyRegionToNodeRepulsion(e.subRegions[a], i);
          }
        };
      })()),
      (a.prototype.applyNodeToNodeRepulsion = (function () {
        var t = n.create();
        return function (e, i, s) {
          if (e !== i && (0 !== e.mass || 0 !== i.mass)) {
            n.sub(t, e.position, i.position);
            var o = t[0] * t[0] + t[1] * t[1];
            if (0 !== o) {
              var a,
                r = e.mass + i.mass,
                h = Math.sqrt(o);
              n.scale(t, t, 1 / h),
                this.preventNodeOverlap
                  ? ((h = h - e.size - i.size),
                    h > 0
                      ? (a = this.nodeToNodeRepulsionFactor(r, h, this._k))
                      : 0 >= h && (a = this._k * this._k * 10 * r))
                  : (a = this.nodeToNodeRepulsionFactor(r, h, this._k)),
                s || n.scaleAndAdd(e.force, e.force, t, 2 * a),
                n.scaleAndAdd(i.force, i.force, t, 2 * -a);
            }
          }
        };
      })()),
      (a.prototype.applyEdgeAttraction = (function () {
        var t = n.create();
        return function (e) {
          var i = e.node1,
            s = e.node2;
          n.sub(t, i.position, s.position);
          var o,
            a = n.len(t);
          o =
            0 === this.edgeWeightInfluence
              ? 1
              : 1 == this.edgeWeightInfluence
              ? e.weight
              : Math.pow(e.weight, this.edgeWeightInfluence);
          var r;
          if (!(this.preventOverlap && ((a = a - i.size - s.size), 0 >= a))) {
            var r = this.attractionFactor(o, a, this._k);
            n.scaleAndAdd(i.force, i.force, t, -r),
              n.scaleAndAdd(s.force, s.force, t, r);
          }
        };
      })()),
      (a.prototype.applyNodeGravity = (function () {
        var t = n.create();
        return function (e) {
          n.sub(t, this.center, e.position),
            this.width > this.height
              ? (t[1] *= this.width / this.height)
              : (t[0] *= this.height / this.width);
          var i = n.len(t) / 100;
          this.strongGravity
            ? n.scaleAndAdd(e.force, e.force, t, i * this.gravity * e.mass)
            : n.scaleAndAdd(
                e.force,
                e.force,
                t,
                (this.gravity * e.mass) / (i + 1)
              );
        };
      })()),
      (a.prototype.applyEdgeToNodeRepulsion = (function () {
        var t = n.create(),
          e = n.create(),
          i = n.create();
        return function (s, o) {
          var a = s.node1,
            r = s.node2;
          if (a !== o && r !== o) {
            n.sub(t, r.position, a.position), n.sub(e, o.position, a.position);
            var h = n.len(t);
            n.scale(t, t, 1 / h);
            var l = n.dot(t, e);
            if (!(0 > l || l > h)) {
              n.scaleAndAdd(i, a.position, t, l);
              var d = n.dist(i, o.position) - o.size,
                p = this.edgeToNodeRepulsionFactor(
                  o.mass,
                  Math.max(d, 0.1),
                  100
                );
              n.sub(t, o.position, i),
                n.normalize(t, t),
                n.scaleAndAdd(o.force, o.force, t, p),
                n.scaleAndAdd(a.force, a.force, t, -p),
                n.scaleAndAdd(r.force, r.force, t, -p);
            }
          }
        };
      })()),
      (a.prototype.updateBBox = function () {
        for (
          var t = 1 / 0, e = 1 / 0, i = -1 / 0, s = -1 / 0, o = 0;
          o < this.nodes.length;
          o++
        ) {
          var a = this.nodes[o].position;
          (t = Math.min(t, a[0])),
            (e = Math.min(e, a[1])),
            (i = Math.max(i, a[0])),
            (s = Math.max(s, a[1]));
        }
        (this.bbox[0] = t),
          (this.bbox[1] = e),
          (this.bbox[2] = i),
          (this.bbox[3] = s);
      }),
      (a.getWorkerCode = function () {
        var e = t.toString();
        return e.slice(e.indexOf("{") + 1, e.lastIndexOf("return"));
      }),
      r)
    ) {
      var l = null;
      self.onmessage = function (t) {
        if (t.data instanceof ArrayBuffer) {
          if (!l) return;
          for (
            var e = new Float32Array(t.data), i = e.length / 2, s = 0;
            i > s;
            s++
          ) {
            var o = l.nodes[s];
            (o.position[0] = e[2 * s]), (o.position[1] = e[2 * s + 1]);
          }
        } else
          switch (t.data.cmd) {
            case "init":
              l || (l = new a()),
                l.initNodes(
                  t.data.nodesPosition,
                  t.data.nodesMass,
                  t.data.nodesSize
                ),
                l.initEdges(t.data.edges, t.data.edgesWeight);
              break;
            case "updateConfig":
              if (l) for (var n in t.data.config) l[n] = t.data.config[n];
              break;
            case "update":
              var r = t.data.steps;
              if (l) {
                var i = l.nodes.length,
                  e = new Float32Array(2 * i);
                l.temperature = t.data.temperature;
                for (var s = 0; r > s; s++)
                  l.update(), (l.temperature *= t.data.coolDown);
                for (var s = 0; i > s; s++) {
                  var o = l.nodes[s];
                  (e[2 * s] = o.position[0]), (e[2 * s + 1] = o.position[1]);
                }
                self.postMessage(e.buffer, [e.buffer]);
              } else {
                var h = new Float32Array();
                self.postMessage(h.buffer, [h.buffer]);
              }
          }
      };
    }
    return a;
  });
