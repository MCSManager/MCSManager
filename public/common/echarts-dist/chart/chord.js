define("echarts/chart/chord", [
  "require",
  "./base",
  "zrender/shape/Text",
  "zrender/shape/Line",
  "zrender/shape/Sector",
  "../util/shape/Ribbon",
  "../util/shape/Icon",
  "zrender/shape/BezierCurve",
  "../config",
  "../util/ecData",
  "zrender/tool/util",
  "zrender/tool/vector",
  "../data/Graph",
  "../layout/Chord",
  "../chart",
], function (t) {
  "use strict";
  function e(t, e, s, o, a) {
    i.call(this, t, e, s, o, a),
      (this.scaleLineLength = 4),
      (this.scaleUnitAngle = 4),
      this.refresh(o);
  }
  var i = t("./base"),
    s = t("zrender/shape/Text"),
    o = t("zrender/shape/Line"),
    a = t("zrender/shape/Sector"),
    n = t("../util/shape/Ribbon"),
    r = t("../util/shape/Icon"),
    h = t("zrender/shape/BezierCurve"),
    l = t("../config");
  l.chord = {
    zlevel: 0,
    z: 2,
    clickable: !0,
    radius: ["60%", "70%"],
    center: ["50%", "50%"],
    padding: 2,
    sort: "none",
    sortSub: "none",
    startAngle: 90,
    clockWise: !0,
    ribbonType: !0,
    minRadius: 10,
    maxRadius: 20,
    symbol: "circle",
    showScale: !1,
    showScaleText: !1,
    itemStyle: {
      normal: {
        borderWidth: 0,
        borderColor: "#000",
        label: { show: !0, rotate: !1, distance: 5 },
        chordStyle: {
          width: 1,
          color: "black",
          borderWidth: 1,
          borderColor: "#999",
          opacity: 0.5,
        },
      },
      emphasis: {
        borderWidth: 0,
        borderColor: "#000",
        chordStyle: {
          width: 1,
          color: "black",
          borderWidth: 1,
          borderColor: "#999",
        },
      },
    },
  };
  var d = t("../util/ecData"),
    c = t("zrender/tool/util"),
    p = t("zrender/tool/vector"),
    u = t("../data/Graph"),
    g = t("../layout/Chord");
  return (
    (e.prototype = {
      type: l.CHART_TYPE_CHORD,
      _init: function () {
        var t = this.series;
        this.selectedMap = {};
        for (var e = {}, i = {}, s = 0, o = t.length; o > s; s++)
          if (t[s].type === this.type) {
            var a = this.isSelected(t[s].name);
            (this.selectedMap[t[s].name] = a),
              a && this.buildMark(s),
              this.reformOption(t[s]),
              (e[t[s].name] = t[s]);
          }
        for (var s = 0, o = t.length; o > s; s++)
          if (t[s].type === this.type)
            if (t[s].insertToSerie) {
              var n = e[t[s].insertToSerie];
              t[s]._referenceSerie = n;
            } else i[t[s].name] = [t[s]];
        for (var s = 0, o = t.length; o > s; s++)
          if (t[s].type === this.type && t[s].insertToSerie) {
            for (var r = t[s]._referenceSerie; r && r._referenceSerie; )
              r = r._referenceSerie;
            i[r.name] && this.selectedMap[t[s].name] && i[r.name].push(t[s]);
          }
        for (var h in i) this._buildChords(i[h]);
        this.addShapeList();
      },
      _getNodeCategory: function (t, e) {
        return t.categories && t.categories[e.category || 0];
      },
      _getNodeQueryTarget: function (t, e) {
        var i = this._getNodeCategory(t, e);
        return [e, i, t];
      },
      _getEdgeQueryTarget: function (t, e, i) {
        return (
          (i = i || "normal"),
          [e.itemStyle && e.itemStyle[i], t.itemStyle[i].chordStyle]
        );
      },
      _buildChords: function (t) {
        for (
          var e = [],
            i = t[0],
            s = function (t) {
              return t.layout.size > 0;
            },
            o = function (t) {
              return function (e) {
                return t.getEdge(e.node2, e.node1);
              };
            },
            a = 0;
          a < t.length;
          a++
        ) {
          var n = t[a];
          if (this.selectedMap[n.name]) {
            var r;
            n.data && n.matrix
              ? (r = this._getSerieGraphFromDataMatrix(n, i))
              : n.nodes &&
                n.links &&
                (r = this._getSerieGraphFromNodeLinks(n, i)),
              r.filterNode(s, this),
              n.ribbonType && r.filterEdge(o(r)),
              e.push(r),
              (r.__serie = n);
          }
        }
        if (e.length) {
          var h = e[0];
          if (!i.ribbonType) {
            var l = i.minRadius,
              d = i.maxRadius,
              c = 1 / 0,
              p = -1 / 0;
            h.eachNode(function (t) {
              (p = Math.max(t.layout.size, p)),
                (c = Math.min(t.layout.size, c));
            });
            var u = (d - l) / (p - c);
            h.eachNode(function (t) {
              var e = this._getNodeQueryTarget(i, t),
                s = this.query(e, "symbolSize");
              t.layout.size =
                p === c ? s || c : s || (t.layout.size - c) * u + l;
            }, this);
          }
          var f = new g();
          (f.clockWise = i.clockWise),
            (f.startAngle = (i.startAngle * Math.PI) / 180),
            f.clockWise || (f.startAngle = -f.startAngle),
            (f.padding = (i.padding * Math.PI) / 180),
            (f.sort = i.sort),
            (f.sortSub = i.sortSub),
            (f.directed = i.ribbonType),
            f.run(e);
          var m = this.query(i, "itemStyle.normal.label.show");
          if (i.ribbonType) {
            this._buildSectors(i, 0, h, i, e),
              m && this._buildLabels(i, 0, h, i, e);
            for (var a = 0, y = 0; a < t.length; a++)
              this.selectedMap[t[a].name] &&
                this._buildRibbons(t, a, e[y++], i);
            i.showScale && this._buildScales(i, 0, h);
          } else {
            this._buildNodeIcons(i, 0, h, i, e),
              m && this._buildLabels(i, 0, h, i, e);
            for (var a = 0, y = 0; a < t.length; a++)
              this.selectedMap[t[a].name] &&
                this._buildEdgeCurves(t, a, e[y++], i, h);
          }
          this._initHoverHandler(t, e);
        }
      },
      _getSerieGraphFromDataMatrix: function (t, e) {
        for (var i = [], s = 0, o = [], a = 0; a < t.matrix.length; a++)
          o[a] = t.matrix[a].slice();
        for (var n = t.data || t.nodes, a = 0; a < n.length; a++) {
          var r = {},
            h = n[a];
          h.rawIndex = a;
          for (var l in h) "name" === l ? (r.id = h.name) : (r[l] = h[l]);
          var d = this._getNodeCategory(e, h),
            c = d ? d.name : h.name;
          if (((this.selectedMap[c] = this.isSelected(c)), this.selectedMap[c]))
            i.push(r), s++;
          else {
            o.splice(s, 1);
            for (var p = 0; p < o.length; p++) o[p].splice(s, 1);
          }
        }
        var g = u.fromMatrix(i, o, !0);
        return (
          g.eachNode(function (t) {
            (t.layout = { size: t.data.outValue }),
              (t.rawIndex = t.data.rawIndex);
          }),
          g.eachEdge(function (t) {
            t.layout = { weight: t.data.weight };
          }),
          g
        );
      },
      _getSerieGraphFromNodeLinks: function (t, e) {
        for (
          var i = new u(!0), s = t.data || t.nodes, o = 0, a = s.length;
          a > o;
          o++
        ) {
          var n = s[o];
          if (n && !n.ignore) {
            var r = this._getNodeCategory(e, n),
              h = r ? r.name : n.name;
            if (
              ((this.selectedMap[h] = this.isSelected(h)), this.selectedMap[h])
            ) {
              var l = i.addNode(n.name, n);
              l.rawIndex = o;
            }
          }
        }
        for (var o = 0, a = t.links.length; a > o; o++) {
          var d = t.links[o],
            c = d.source,
            p = d.target;
          "number" == typeof c && ((c = s[c]), c && (c = c.name)),
            "number" == typeof p && ((p = s[p]), p && (p = p.name));
          var g = i.addEdge(c, p, d);
          g && (g.rawIndex = o);
        }
        return (
          i.eachNode(function (t) {
            var i = t.data.value;
            if (null == i)
              if (((i = 0), e.ribbonType))
                for (var s = 0; s < t.outEdges.length; s++)
                  i += t.outEdges[s].data.weight || 0;
              else
                for (var s = 0; s < t.edges.length; s++)
                  i += t.edges[s].data.weight || 0;
            t.layout = { size: i };
          }),
          i.eachEdge(function (t) {
            t.layout = { weight: null == t.data.weight ? 1 : t.data.weight };
          }),
          i
        );
      },
      _initHoverHandler: function (t, e) {
        var i = t[0],
          s = e[0],
          o = this;
        s.eachNode(function (t) {
          (t.shape.onmouseover = function () {
            s.eachNode(function (t) {
              (t.shape.style.opacity = 0.1),
                t.labelShape &&
                  ((t.labelShape.style.opacity = 0.1), t.labelShape.modSelf()),
                t.shape.modSelf();
            });
            for (var i = 0; i < e.length; i++)
              for (var a = 0; a < e[i].edges.length; a++) {
                var n = e[i].edges[a],
                  r = o._getEdgeQueryTarget(e[i].__serie, n.data);
                (n.shape.style.opacity = 0.1 * o.deepQuery(r, "opacity")),
                  n.shape.modSelf();
              }
            (t.shape.style.opacity = 1),
              t.labelShape && (t.labelShape.style.opacity = 1);
            for (var i = 0; i < e.length; i++) {
              var h = e[i].getNodeById(t.id);
              if (h)
                for (var a = 0; a < h.outEdges.length; a++) {
                  var n = h.outEdges[a],
                    r = o._getEdgeQueryTarget(e[i].__serie, n.data);
                  n.shape.style.opacity = o.deepQuery(r, "opacity");
                  var l = e[0].getNodeById(n.node2.id);
                  l &&
                    (l.shape && (l.shape.style.opacity = 1),
                    l.labelShape && (l.labelShape.style.opacity = 1));
                }
            }
            o.zr.refreshNextFrame();
          }),
            (t.shape.onmouseout = function () {
              s.eachNode(function (t) {
                (t.shape.style.opacity = 1),
                  t.labelShape &&
                    ((t.labelShape.style.opacity = 1), t.labelShape.modSelf()),
                  t.shape.modSelf();
              });
              for (var t = 0; t < e.length; t++)
                for (var a = 0; a < e[t].edges.length; a++) {
                  var n = e[t].edges[a],
                    r = [n.data, i];
                  (n.shape.style.opacity = o.deepQuery(
                    r,
                    "itemStyle.normal.chordStyle.opacity"
                  )),
                    n.shape.modSelf();
                }
              o.zr.refreshNextFrame();
            });
        });
      },
      _buildSectors: function (t, e, i, s) {
        var o = this.parseCenter(this.zr, s.center),
          n = this.parseRadius(this.zr, s.radius),
          r = s.clockWise,
          h = r ? 1 : -1;
        i.eachNode(function (i) {
          var l = this._getNodeCategory(s, i.data),
            c = this.getColor(l ? l.name : i.id),
            p = (i.layout.startAngle / Math.PI) * 180 * h,
            u = (i.layout.endAngle / Math.PI) * 180 * h,
            g = new a({
              zlevel: this.getZlevelBase(),
              z: this.getZBase(),
              style: {
                x: o[0],
                y: o[1],
                r0: n[0],
                r: n[1],
                startAngle: p,
                endAngle: u,
                brushType: "fill",
                opacity: 1,
                color: c,
                clockWise: r,
              },
              clickable: s.clickable,
              highlightStyle: { brushType: "fill" },
            });
          (g.style.lineWidth = this.deepQuery(
            [i.data, s],
            "itemStyle.normal.borderWidth"
          )),
            (g.highlightStyle.lineWidth = this.deepQuery(
              [i.data, s],
              "itemStyle.emphasis.borderWidth"
            )),
            (g.style.strokeColor = this.deepQuery(
              [i.data, s],
              "itemStyle.normal.borderColor"
            )),
            (g.highlightStyle.strokeColor = this.deepQuery(
              [i.data, s],
              "itemStyle.emphasis.borderColor"
            )),
            g.style.lineWidth > 0 && (g.style.brushType = "both"),
            g.highlightStyle.lineWidth > 0 &&
              (g.highlightStyle.brushType = "both"),
            d.pack(g, t, e, i.data, i.rawIndex, i.id, i.category),
            this.shapeList.push(g),
            (i.shape = g);
        }, this);
      },
      _buildNodeIcons: function (t, e, i, s) {
        var o = this.parseCenter(this.zr, s.center),
          a = this.parseRadius(this.zr, s.radius),
          n = a[1];
        i.eachNode(function (i) {
          var a = i.layout.startAngle,
            h = i.layout.endAngle,
            l = (a + h) / 2,
            c = n * Math.cos(l),
            p = n * Math.sin(l),
            u = this._getNodeQueryTarget(s, i.data),
            g = this._getNodeCategory(s, i.data),
            f = this.deepQuery(u, "itemStyle.normal.color");
          f || (f = this.getColor(g ? g.name : i.id));
          var m = new r({
            zlevel: this.getZlevelBase(),
            z: this.getZBase() + 1,
            style: {
              x: -i.layout.size,
              y: -i.layout.size,
              width: 2 * i.layout.size,
              height: 2 * i.layout.size,
              iconType: this.deepQuery(u, "symbol"),
              color: f,
              brushType: "both",
              lineWidth: this.deepQuery(u, "itemStyle.normal.borderWidth"),
              strokeColor: this.deepQuery(u, "itemStyle.normal.borderColor"),
            },
            highlightStyle: {
              color: this.deepQuery(u, "itemStyle.emphasis.color"),
              lineWidth: this.deepQuery(u, "itemStyle.emphasis.borderWidth"),
              strokeColor: this.deepQuery(u, "itemStyle.emphasis.borderColor"),
            },
            clickable: s.clickable,
            position: [c + o[0], p + o[1]],
          });
          d.pack(m, t, e, i.data, i.rawIndex, i.id, i.category),
            this.shapeList.push(m),
            (i.shape = m);
        }, this);
      },
      _buildLabels: function (t, e, i, o) {
        var a = this.query(o, "itemStyle.normal.label.color"),
          n = this.query(o, "itemStyle.normal.label.rotate"),
          r = this.query(o, "itemStyle.normal.label.distance"),
          h = this.parseCenter(this.zr, o.center),
          l = this.parseRadius(this.zr, o.radius),
          d = o.clockWise,
          c = d ? 1 : -1;
        i.eachNode(function (t) {
          var e = (t.layout.startAngle / Math.PI) * 180 * c,
            i = (t.layout.endAngle / Math.PI) * 180 * c,
            d = (e * -c + i * -c) / 2;
          (d %= 360), 0 > d && (d += 360);
          var u = 90 >= d || d >= 270;
          d = (d * Math.PI) / 180;
          var g = [Math.cos(d), -Math.sin(d)],
            f = 0;
          f = o.ribbonType ? (o.showScaleText ? 35 + r : r) : r + t.layout.size;
          var m = p.scale([], g, l[1] + f);
          p.add(m, m, h);
          var y = {
            zlevel: this.getZlevelBase(),
            z: this.getZBase() + 1,
            hoverable: !1,
            style: {
              text: null == t.data.label ? t.id : t.data.label,
              textAlign: u ? "left" : "right",
              color: a || "#000000",
            },
          };
          n
            ? ((y.rotation = u ? d : Math.PI + d),
              (y.style.x = u ? l[1] + f : -l[1] - f),
              (y.style.y = 0),
              (y.position = h.slice()))
            : ((y.style.x = m[0]), (y.style.y = m[1])),
            (y.style.textColor =
              this.deepQuery(
                [t.data, o],
                "itemStyle.normal.label.textStyle.color"
              ) || "#fff"),
            (y.style.textFont = this.getFont(
              this.deepQuery([t.data, o], "itemStyle.normal.label.textStyle")
            )),
            (y = new s(y)),
            this.shapeList.push(y),
            (t.labelShape = y);
        }, this);
      },
      _buildRibbons: function (t, e, i, s) {
        var o = t[e],
          a = this.parseCenter(this.zr, s.center),
          r = this.parseRadius(this.zr, s.radius);
        i.eachEdge(function (h, l) {
          var c,
            p = i.getEdge(h.node2, h.node1);
          if (p && !h.shape) {
            if (p.shape) return void (h.shape = p.shape);
            var u = (h.layout.startAngle / Math.PI) * 180,
              g = (h.layout.endAngle / Math.PI) * 180,
              f = (p.layout.startAngle / Math.PI) * 180,
              m = (p.layout.endAngle / Math.PI) * 180;
            c = this.getColor(
              1 === t.length
                ? h.layout.weight <= p.layout.weight
                  ? h.node1.id
                  : h.node2.id
                : o.name
            );
            var y,
              _,
              x = this._getEdgeQueryTarget(o, h.data),
              v = this._getEdgeQueryTarget(o, h.data, "emphasis"),
              b = new n({
                zlevel: this.getZlevelBase(),
                z: this.getZBase(),
                style: {
                  x: a[0],
                  y: a[1],
                  r: r[0],
                  source0: u,
                  source1: g,
                  target0: f,
                  target1: m,
                  brushType: "both",
                  opacity: this.deepQuery(x, "opacity"),
                  color: c,
                  lineWidth: this.deepQuery(x, "borderWidth"),
                  strokeColor: this.deepQuery(x, "borderColor"),
                  clockWise: s.clockWise,
                },
                clickable: s.clickable,
                highlightStyle: {
                  brushType: "both",
                  opacity: this.deepQuery(v, "opacity"),
                  lineWidth: this.deepQuery(v, "borderWidth"),
                  strokeColor: this.deepQuery(v, "borderColor"),
                },
              });
            h.layout.weight <= p.layout.weight
              ? ((y = p.node1), (_ = p.node2))
              : ((y = h.node1), (_ = h.node2)),
              d.pack(
                b,
                o,
                e,
                h.data,
                null == h.rawIndex ? l : h.rawIndex,
                h.data.name || y.id + "-" + _.id,
                y.id,
                _.id
              ),
              this.shapeList.push(b),
              (h.shape = b);
          }
        }, this);
      },
      _buildEdgeCurves: function (t, e, i, s, o) {
        var a = t[e],
          n = this.parseCenter(this.zr, s.center);
        i.eachEdge(function (t, i) {
          var s = o.getNodeById(t.node1.id),
            r = o.getNodeById(t.node2.id),
            l = s.shape,
            c = r.shape,
            p = this._getEdgeQueryTarget(a, t.data),
            u = this._getEdgeQueryTarget(a, t.data, "emphasis"),
            g = new h({
              zlevel: this.getZlevelBase(),
              z: this.getZBase(),
              style: {
                xStart: l.position[0],
                yStart: l.position[1],
                xEnd: c.position[0],
                yEnd: c.position[1],
                cpX1: n[0],
                cpY1: n[1],
                lineWidth: this.deepQuery(p, "width"),
                strokeColor: this.deepQuery(p, "color"),
                opacity: this.deepQuery(p, "opacity"),
              },
              highlightStyle: {
                lineWidth: this.deepQuery(u, "width"),
                strokeColor: this.deepQuery(u, "color"),
                opacity: this.deepQuery(u, "opacity"),
              },
            });
          d.pack(
            g,
            a,
            e,
            t.data,
            null == t.rawIndex ? i : t.rawIndex,
            t.data.name || t.node1.id + "-" + t.node2.id,
            t.node1.id,
            t.node2.id
          ),
            this.shapeList.push(g),
            (t.shape = g);
        }, this);
      },
      _buildScales: function (t, e, i) {
        var a,
          n,
          r = t.clockWise,
          h = this.parseCenter(this.zr, t.center),
          l = this.parseRadius(this.zr, t.radius),
          d = r ? 1 : -1,
          c = 0,
          u = -1 / 0;
        t.showScaleText &&
          (i.eachNode(function (t) {
            var e = t.data.value;
            e > u && (u = e), (c += e);
          }),
          u > 1e10
            ? ((a = "b"), (n = 1e-9))
            : u > 1e7
            ? ((a = "m"), (n = 1e-6))
            : u > 1e4
            ? ((a = "k"), (n = 0.001))
            : ((a = ""), (n = 1)));
        var g = c / (360 - t.padding);
        i.eachNode(function (e) {
          for (
            var i = (e.layout.startAngle / Math.PI) * 180,
              c = (e.layout.endAngle / Math.PI) * 180,
              u = i;
            ;

          ) {
            if ((r && u > c) || (!r && c > u)) break;
            var f = (u / 180) * Math.PI,
              m = [Math.cos(f), Math.sin(f)],
              y = p.scale([], m, l[1] + 1);
            p.add(y, y, h);
            var _ = p.scale([], m, l[1] + this.scaleLineLength);
            p.add(_, _, h);
            var x = new o({
              zlevel: this.getZlevelBase(),
              z: this.getZBase() - 1,
              hoverable: !1,
              style: {
                xStart: y[0],
                yStart: y[1],
                xEnd: _[0],
                yEnd: _[1],
                lineCap: "round",
                brushType: "stroke",
                strokeColor: "#666",
                lineWidth: 1,
              },
            });
            this.shapeList.push(x), (u += d * this.scaleUnitAngle);
          }
          if (t.showScaleText)
            for (var v = i, b = 5 * g * this.scaleUnitAngle, S = 0; ; ) {
              if ((r && v > c) || (!r && c > v)) break;
              var f = v;
              (f %= 360), 0 > f && (f += 360);
              var z = 90 >= f || f >= 270,
                T = new s({
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase() - 1,
                  hoverable: !1,
                  style: {
                    x: z
                      ? l[1] + this.scaleLineLength + 4
                      : -l[1] - this.scaleLineLength - 4,
                    y: 0,
                    text: Math.round(10 * S) / 10 + a,
                    textAlign: z ? "left" : "right",
                  },
                  position: h.slice(),
                  rotation: z
                    ? [(-f / 180) * Math.PI, 0, 0]
                    : [(-(f + 180) / 180) * Math.PI, 0, 0],
                });
              this.shapeList.push(T),
                (S += b * n),
                (v += d * this.scaleUnitAngle * 5);
            }
        }, this);
      },
      refresh: function (t) {
        if (
          (t && ((this.option = t), (this.series = t.series)),
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
        this.backupShapeList(), this._init();
      },
      reformOption: function (t) {
        var e = c.merge;
        (t = e(e(t || {}, this.ecTheme.chord), l.chord)),
          (t.itemStyle.normal.label.textStyle = this.getTextStyle(
            t.itemStyle.normal.label.textStyle
          ));
      },
    }),
    c.inherits(e, i),
    t("../chart").define("chord", e),
    e
  );
}),
  define("echarts/util/shape/Ribbon", [
    "require",
    "zrender/shape/Base",
    "zrender/shape/util/PathProxy",
    "zrender/tool/util",
  ], function (t) {
    function e(t) {
      i.call(this, t), (this._pathProxy = new s());
    }
    var i = t("zrender/shape/Base"),
      s = t("zrender/shape/util/PathProxy"),
      o = t("zrender/tool/util");
    return (
      (e.prototype = {
        type: "ribbon",
        buildPath: function (t, e) {
          var i = e.clockWise || !1,
            s = this._pathProxy;
          s.begin(t);
          var o = e.x,
            a = e.y,
            n = e.r,
            r = (e.source0 / 180) * Math.PI,
            h = (e.source1 / 180) * Math.PI,
            l = (e.target0 / 180) * Math.PI,
            d = (e.target1 / 180) * Math.PI,
            c = o + Math.cos(r) * n,
            p = a + Math.sin(r) * n,
            u = o + Math.cos(h) * n,
            g = a + Math.sin(h) * n,
            f = o + Math.cos(l) * n,
            m = a + Math.sin(l) * n,
            y = o + Math.cos(d) * n,
            _ = a + Math.sin(d) * n;
          s.moveTo(c, p),
            s.arc(o, a, e.r, r, h, !i),
            s.bezierCurveTo(
              0.7 * (o - u) + u,
              0.7 * (a - g) + g,
              0.7 * (o - f) + f,
              0.7 * (a - m) + m,
              f,
              m
            ),
            (e.source0 !== e.target0 || e.source1 !== e.target1) &&
              (s.arc(o, a, e.r, l, d, !i),
              s.bezierCurveTo(
                0.7 * (o - y) + y,
                0.7 * (a - _) + _,
                0.7 * (o - c) + c,
                0.7 * (a - p) + p,
                c,
                p
              ));
        },
        getRect: function (t) {
          return t.__rect
            ? t.__rect
            : (this._pathProxy.isEmpty() || this.buildPath(null, t),
              this._pathProxy.fastBoundingRect());
        },
      }),
      o.inherits(e, i),
      e
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
                  c = a.nodes[h],
                  p = a.addEdge(d, c, {});
                if (((p.data.weight = l), n !== h && s && e[h][n])) {
                  var u = a.addEdge(c, d, {});
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
  define("echarts/layout/Chord", ["require"], function () {
    var t = function (t) {
      (t = t || {}),
        (this.sort = t.sort || null),
        (this.sortSub = t.sortSub || null),
        (this.padding = 0.05),
        (this.startAngle = t.startAngle || 0),
        (this.clockWise = null == t.clockWise ? !1 : t.clockWise),
        (this.center = t.center || [0, 0]),
        (this.directed = !0);
    };
    t.prototype.run = function (t) {
      t instanceof Array || (t = [t]);
      var s = t.length;
      if (s) {
        for (
          var o = t[0], a = o.nodes.length, n = [], r = 0, h = 0;
          a > h;
          h++
        ) {
          var l = o.nodes[h],
            d = { size: 0, subGroups: [], node: l };
          n.push(d);
          for (var c = 0, p = 0; p < t.length; p++) {
            var u = t[p],
              g = u.getNodeById(l.id);
            if (g) {
              d.size += g.layout.size;
              for (
                var f = this.directed ? g.outEdges : g.edges, m = 0;
                m < f.length;
                m++
              ) {
                var y = f[m],
                  _ = y.layout.weight;
                d.subGroups.push({ weight: _, edge: y, graph: u }), (c += _);
              }
            }
          }
          r += d.size;
          for (var x = d.size / c, m = 0; m < d.subGroups.length; m++)
            d.subGroups[m].weight *= x;
          "ascending" === this.sortSub
            ? d.subGroups.sort(e)
            : "descending" === this.sort &&
              (d.subGroups.sort(e), d.subGroups.reverse());
        }
        "ascending" === this.sort
          ? n.sort(i)
          : "descending" === this.sort && (n.sort(i), n.reverse());
        for (
          var x = (2 * Math.PI - this.padding * a) / r,
            v = this.startAngle,
            b = this.clockWise ? 1 : -1,
            h = 0;
          a > h;
          h++
        ) {
          var d = n[h];
          (d.node.layout.startAngle = v),
            (d.node.layout.endAngle = v + b * d.size * x),
            (d.node.layout.subGroups = []);
          for (var m = 0; m < d.subGroups.length; m++) {
            var S = d.subGroups[m];
            (S.edge.layout.startAngle = v),
              (v += b * S.weight * x),
              (S.edge.layout.endAngle = v);
          }
          v = d.node.layout.endAngle + b * this.padding;
        }
      }
    };
    var e = function (t, e) {
        return t.weight - e.weight;
      },
      i = function (t, e) {
        return t.size - e.size;
      };
    return t;
  });
