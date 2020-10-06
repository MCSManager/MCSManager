define("echarts/chart/line", [
  "require",
  "./base",
  "zrender/shape/Polyline",
  "../util/shape/Icon",
  "../util/shape/HalfSmoothPolygon",
  "../component/axis",
  "../component/grid",
  "../component/dataZoom",
  "../config",
  "../util/ecData",
  "zrender/tool/util",
  "zrender/tool/color",
  "../chart",
], function (t) {
  function e(t, e, i, s, n) {
    o.call(this, t, e, i, s, n), this.refresh(s);
  }
  function i(t, e, i) {
    var o = e.x,
      s = e.y,
      r = e.width,
      a = e.height,
      h = a / 2;
    e.symbol.match("empty") && (t.fillStyle = "#fff"), (e.brushType = "both");
    var l = e.symbol.replace("empty", "").toLowerCase();
    l.match("star")
      ? ((h = l.replace("star", "") - 0 || 5), (s -= 1), (l = "star"))
      : ("rectangle" === l || "arrow" === l) && ((o += (r - a) / 2), (r = a));
    var d = "";
    if (
      (l.match("image") &&
        ((d = l.replace(new RegExp("^image:\\/\\/"), "")),
        (l = "image"),
        (o += Math.round((r - a) / 2) - 1),
        (r = a += 2)),
      (l = n.prototype.iconLibrary[l]))
    ) {
      var c = e.x,
        p = e.y;
      t.moveTo(c, p + h),
        t.lineTo(c + 5, p + h),
        t.moveTo(c + e.width - 5, p + h),
        t.lineTo(c + e.width, p + h);
      var u = this;
      l(
        t,
        { x: o + 4, y: s + 4, width: r - 8, height: a - 8, n: h, image: d },
        function () {
          u.modSelf(), i();
        }
      );
    } else t.moveTo(o, s + h), t.lineTo(o + r, s + h);
  }
  var o = t("./base"),
    s = t("zrender/shape/Polyline"),
    n = t("../util/shape/Icon"),
    r = t("../util/shape/HalfSmoothPolygon");
  t("../component/axis"), t("../component/grid"), t("../component/dataZoom");
  var a = t("../config");
  a.line = {
    zlevel: 0,
    z: 2,
    clickable: !0,
    legendHoverLink: !0,
    xAxisIndex: 0,
    yAxisIndex: 0,
    itemStyle: {
      normal: {
        label: { show: !1 },
        lineStyle: {
          width: 1.5,
          type: "solid",
          shadowColor: "rgba(0,0,0,0)",
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
      },
      emphasis: { label: { show: !1 } },
    },
    symbolSize: 2,
    showAllSymbol: !1,
  };
  var h = t("../util/ecData"),
    l = t("zrender/tool/util"),
    d = t("zrender/tool/color");
  return (
    (e.prototype = {
      type: a.CHART_TYPE_LINE,
      _buildShape: function () {
        (this.finalPLMap = {}), this._buildPosition();
      },
      _buildHorizontal: function (t, e, i, o) {
        for (
          var s,
            n,
            r,
            a,
            h,
            l,
            d,
            c,
            p,
            u = this.series,
            g = i[0][0],
            f = u[g],
            m = this.component.xAxis.getAxis(f.xAxisIndex || 0),
            y = {},
            _ = 0,
            v = e;
          v > _ && null != m.getNameByIndex(_);
          _++
        ) {
          n = m.getCoordByIndex(_);
          for (var x = 0, b = i.length; b > x; x++) {
            (s = this.component.yAxis.getAxis(u[i[x][0]].yAxisIndex || 0)),
              (h = a = d = l = s.getCoord(0));
            for (var S = 0, T = i[x].length; T > S; S++)
              (g = i[x][S]),
                (f = u[g]),
                (c = f.data[_]),
                (p = this.getDataFromOption(c, "-")),
                (y[g] = y[g] || []),
                (o[g] = o[g] || {
                  min: Number.POSITIVE_INFINITY,
                  max: Number.NEGATIVE_INFINITY,
                  sum: 0,
                  counter: 0,
                  average: 0,
                }),
                "-" !== p
                  ? (p >= 0
                      ? ((a -= S > 0 ? s.getCoordSize(p) : h - s.getCoord(p)),
                        (r = a))
                      : 0 > p &&
                        ((l += S > 0 ? s.getCoordSize(p) : s.getCoord(p) - d),
                        (r = l)),
                    y[g].push([n, r, _, m.getNameByIndex(_), n, h]),
                    o[g].min > p &&
                      ((o[g].min = p), (o[g].minY = r), (o[g].minX = n)),
                    o[g].max < p &&
                      ((o[g].max = p), (o[g].maxY = r), (o[g].maxX = n)),
                    (o[g].sum += p),
                    o[g].counter++)
                  : y[g].length > 0 &&
                    ((this.finalPLMap[g] = this.finalPLMap[g] || []),
                    this.finalPLMap[g].push(y[g]),
                    (y[g] = []));
          }
          a = this.component.grid.getY();
          for (var z, x = 0, b = i.length; b > x; x++)
            for (var S = 0, T = i[x].length; T > S; S++)
              (g = i[x][S]),
                (f = u[g]),
                (c = f.data[_]),
                (p = this.getDataFromOption(c, "-")),
                "-" == p &&
                  this.deepQuery([c, f, this.option], "calculable") &&
                  ((z = this.deepQuery([c, f], "symbolSize")),
                  (a += 2 * z + 5),
                  (r = a),
                  this.shapeList.push(
                    this._getCalculableItem(
                      g,
                      _,
                      m.getNameByIndex(_),
                      n,
                      r,
                      "horizontal"
                    )
                  ));
        }
        for (var L in y)
          y[L].length > 0 &&
            ((this.finalPLMap[L] = this.finalPLMap[L] || []),
            this.finalPLMap[L].push(y[L]),
            (y[L] = []));
        this._calculMarkMapXY(o, i, "y"),
          this._buildBorkenLine(t, this.finalPLMap, m, "horizontal");
      },
      _buildVertical: function (t, e, i, o) {
        for (
          var s,
            n,
            r,
            a,
            h,
            l,
            d,
            c,
            p,
            u = this.series,
            g = i[0][0],
            f = u[g],
            m = this.component.yAxis.getAxis(f.yAxisIndex || 0),
            y = {},
            _ = 0,
            v = e;
          v > _ && null != m.getNameByIndex(_);
          _++
        ) {
          r = m.getCoordByIndex(_);
          for (var x = 0, b = i.length; b > x; x++) {
            (s = this.component.xAxis.getAxis(u[i[x][0]].xAxisIndex || 0)),
              (h = a = d = l = s.getCoord(0));
            for (var S = 0, T = i[x].length; T > S; S++)
              (g = i[x][S]),
                (f = u[g]),
                (c = f.data[_]),
                (p = this.getDataFromOption(c, "-")),
                (y[g] = y[g] || []),
                (o[g] = o[g] || {
                  min: Number.POSITIVE_INFINITY,
                  max: Number.NEGATIVE_INFINITY,
                  sum: 0,
                  counter: 0,
                  average: 0,
                }),
                "-" !== p
                  ? (p >= 0
                      ? ((a += S > 0 ? s.getCoordSize(p) : s.getCoord(p) - h),
                        (n = a))
                      : 0 > p &&
                        ((l -= S > 0 ? s.getCoordSize(p) : d - s.getCoord(p)),
                        (n = l)),
                    y[g].push([n, r, _, m.getNameByIndex(_), h, r]),
                    o[g].min > p &&
                      ((o[g].min = p), (o[g].minX = n), (o[g].minY = r)),
                    o[g].max < p &&
                      ((o[g].max = p), (o[g].maxX = n), (o[g].maxY = r)),
                    (o[g].sum += p),
                    o[g].counter++)
                  : y[g].length > 0 &&
                    ((this.finalPLMap[g] = this.finalPLMap[g] || []),
                    this.finalPLMap[g].push(y[g]),
                    (y[g] = []));
          }
          a = this.component.grid.getXend();
          for (var z, x = 0, b = i.length; b > x; x++)
            for (var S = 0, T = i[x].length; T > S; S++)
              (g = i[x][S]),
                (f = u[g]),
                (c = f.data[_]),
                (p = this.getDataFromOption(c, "-")),
                "-" == p &&
                  this.deepQuery([c, f, this.option], "calculable") &&
                  ((z = this.deepQuery([c, f], "symbolSize")),
                  (a -= 2 * z + 5),
                  (n = a),
                  this.shapeList.push(
                    this._getCalculableItem(
                      g,
                      _,
                      m.getNameByIndex(_),
                      n,
                      r,
                      "vertical"
                    )
                  ));
        }
        for (var L in y)
          y[L].length > 0 &&
            ((this.finalPLMap[L] = this.finalPLMap[L] || []),
            this.finalPLMap[L].push(y[L]),
            (y[L] = []));
        this._calculMarkMapXY(o, i, "x"),
          this._buildBorkenLine(t, this.finalPLMap, m, "vertical");
      },
      _buildOther: function (t, e, i, o) {
        for (var s, n = this.series, r = {}, a = 0, h = i.length; h > a; a++)
          for (var l = 0, d = i[a].length; d > l; l++) {
            var c = i[a][l],
              p = n[c];
            s = this.component.xAxis.getAxis(p.xAxisIndex || 0);
            var u = this.component.yAxis.getAxis(p.yAxisIndex || 0),
              g = u.getCoord(0);
            (r[c] = r[c] || []),
              (o[c] = o[c] || {
                min0: Number.POSITIVE_INFINITY,
                min1: Number.POSITIVE_INFINITY,
                max0: Number.NEGATIVE_INFINITY,
                max1: Number.NEGATIVE_INFINITY,
                sum0: 0,
                sum1: 0,
                counter0: 0,
                counter1: 0,
                average0: 0,
                average1: 0,
              });
            for (var f = 0, m = p.data.length; m > f; f++) {
              var y = p.data[f],
                _ = this.getDataFromOption(y, "-");
              if (_ instanceof Array) {
                var v = s.getCoord(_[0]),
                  x = u.getCoord(_[1]);
                r[c].push([v, x, f, _[0], v, g]),
                  o[c].min0 > _[0] &&
                    ((o[c].min0 = _[0]), (o[c].minY0 = x), (o[c].minX0 = v)),
                  o[c].max0 < _[0] &&
                    ((o[c].max0 = _[0]), (o[c].maxY0 = x), (o[c].maxX0 = v)),
                  (o[c].sum0 += _[0]),
                  o[c].counter0++,
                  o[c].min1 > _[1] &&
                    ((o[c].min1 = _[1]), (o[c].minY1 = x), (o[c].minX1 = v)),
                  o[c].max1 < _[1] &&
                    ((o[c].max1 = _[1]), (o[c].maxY1 = x), (o[c].maxX1 = v)),
                  (o[c].sum1 += _[1]),
                  o[c].counter1++;
              }
            }
          }
        for (var b in r)
          r[b].length > 0 &&
            ((this.finalPLMap[b] = this.finalPLMap[b] || []),
            this.finalPLMap[b].push(r[b]),
            (r[b] = []));
        this._calculMarkMapXY(o, i, "xy"),
          this._buildBorkenLine(t, this.finalPLMap, s, "other");
      },
      _buildBorkenLine: function (t, e, i, o) {
        for (
          var n,
            a = "other" == o ? "horizontal" : o,
            c = this.series,
            p = t.length - 1;
          p >= 0;
          p--
        ) {
          var u = t[p],
            g = c[u],
            f = e[u];
          if (g.type === this.type && null != f)
            for (
              var m = this._getBbox(u, a),
                y = this._sIndex2ColorMap[u],
                _ = this.query(g, "itemStyle.normal.lineStyle.width"),
                v = this.query(g, "itemStyle.normal.lineStyle.type"),
                x = this.query(g, "itemStyle.normal.lineStyle.color"),
                b = this.getItemStyleColor(
                  this.query(g, "itemStyle.normal.color"),
                  u,
                  -1
                ),
                S = null != this.query(g, "itemStyle.normal.areaStyle"),
                T = this.query(g, "itemStyle.normal.areaStyle.color"),
                z = 0,
                L = f.length;
              L > z;
              z++
            ) {
              var C = f[z],
                w = "other" != o && this._isLarge(a, C);
              if (w) C = this._getLargePointList(a, C);
              else
                for (var M = 0, A = C.length; A > M; M++)
                  (n = g.data[C[M][2]]),
                    (this.deepQuery([n, g, this.option], "calculable") ||
                      this.deepQuery([n, g], "showAllSymbol") ||
                      ("categoryAxis" === i.type &&
                        i.isMainAxis(C[M][2]) &&
                        "none" != this.deepQuery([n, g], "symbol"))) &&
                      this.shapeList.push(
                        this._getSymbol(
                          u,
                          C[M][2],
                          C[M][3],
                          C[M][0],
                          C[M][1],
                          a
                        )
                      );
              var E = new s({
                zlevel: this.getZlevelBase(),
                z: this.getZBase(),
                style: {
                  miterLimit: _,
                  pointList: C,
                  strokeColor: x || b || y,
                  lineWidth: _,
                  lineType: v,
                  smooth: this._getSmooth(g.smooth),
                  smoothConstraint: m,
                  shadowColor: this.query(
                    g,
                    "itemStyle.normal.lineStyle.shadowColor"
                  ),
                  shadowBlur: this.query(
                    g,
                    "itemStyle.normal.lineStyle.shadowBlur"
                  ),
                  shadowOffsetX: this.query(
                    g,
                    "itemStyle.normal.lineStyle.shadowOffsetX"
                  ),
                  shadowOffsetY: this.query(
                    g,
                    "itemStyle.normal.lineStyle.shadowOffsetY"
                  ),
                },
                hoverable: !1,
                _main: !0,
                _seriesIndex: u,
                _orient: a,
              });
              if (
                (h.pack(E, c[u], u, 0, z, c[u].name), this.shapeList.push(E), S)
              ) {
                var k = new r({
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  style: {
                    miterLimit: _,
                    pointList: l.clone(C).concat([
                      [C[C.length - 1][4], C[C.length - 1][5]],
                      [C[0][4], C[0][5]],
                    ]),
                    brushType: "fill",
                    smooth: this._getSmooth(g.smooth),
                    smoothConstraint: m,
                    color: T ? T : d.alpha(y, 0.5),
                  },
                  highlightStyle: { brushType: "fill" },
                  hoverable: !1,
                  _main: !0,
                  _seriesIndex: u,
                  _orient: a,
                });
                h.pack(k, c[u], u, 0, z, c[u].name), this.shapeList.push(k);
              }
            }
        }
      },
      _getBbox: function (t, e) {
        var i = this.component.grid.getBbox(),
          o = this.xMarkMap[t];
        return null != o.minX0
          ? [
              [
                Math.min(o.minX0, o.maxX0, o.minX1, o.maxX1),
                Math.min(o.minY0, o.maxY0, o.minY1, o.maxY1),
              ],
              [
                Math.max(o.minX0, o.maxX0, o.minX1, o.maxX1),
                Math.max(o.minY0, o.maxY0, o.minY1, o.maxY1),
              ],
            ]
          : ("horizontal" === e
              ? ((i[0][1] = Math.min(o.minY, o.maxY)),
                (i[1][1] = Math.max(o.minY, o.maxY)))
              : ((i[0][0] = Math.min(o.minX, o.maxX)),
                (i[1][0] = Math.max(o.minX, o.maxX))),
            i);
      },
      _isLarge: function (t, e) {
        return e.length < 2
          ? !1
          : "horizontal" === t
          ? Math.abs(e[0][0] - e[1][0]) < 0.5
          : Math.abs(e[0][1] - e[1][1]) < 0.5;
      },
      _getLargePointList: function (t, e) {
        var i;
        i =
          "horizontal" === t
            ? this.component.grid.getWidth()
            : this.component.grid.getHeight();
        for (var o = e.length, s = [], n = 0; i > n; n++)
          s[n] = e[Math.floor((o / i) * n)];
        return s;
      },
      _getSmooth: function (t) {
        return t ? 0.3 : 0;
      },
      _getCalculableItem: function (t, e, i, o, s, n) {
        var r = this.series,
          h =
            r[t].calculableHolderColor ||
            this.ecTheme.calculableHolderColor ||
            a.calculableHolderColor,
          l = this._getSymbol(t, e, i, o, s, n);
        return (
          (l.style.color = h),
          (l.style.strokeColor = h),
          (l.rotation = [0, 0]),
          (l.hoverable = !1),
          (l.draggable = !1),
          (l.style.text = void 0),
          l
        );
      },
      _getSymbol: function (t, e, i, o, s, n) {
        var r = this.series,
          a = r[t],
          h = a.data[e],
          l = this.getSymbolShape(
            a,
            t,
            h,
            e,
            i,
            o,
            s,
            this._sIndex2ShapeMap[t],
            this._sIndex2ColorMap[t],
            "#fff",
            "vertical" === n ? "horizontal" : "vertical"
          );
        return (
          (l.zlevel = this.getZlevelBase()),
          (l.z = this.getZBase() + 1),
          this.deepQuery([h, a, this.option], "calculable") &&
            (this.setCalculable(l), (l.draggable = !0)),
          l
        );
      },
      getMarkCoord: function (t, e) {
        var i = this.series[t],
          o = this.xMarkMap[t],
          s = this.component.xAxis.getAxis(i.xAxisIndex),
          n = this.component.yAxis.getAxis(i.yAxisIndex);
        if (
          e.type &&
          ("max" === e.type || "min" === e.type || "average" === e.type)
        ) {
          var r =
            null != e.valueIndex ? e.valueIndex : null != o.maxX0 ? "1" : "";
          return [
            o[e.type + "X" + r],
            o[e.type + "Y" + r],
            o[e.type + "Line" + r],
            o[e.type + r],
          ];
        }
        return [
          "string" != typeof e.xAxis && s.getCoordByIndex
            ? s.getCoordByIndex(e.xAxis || 0)
            : s.getCoord(e.xAxis || 0),
          "string" != typeof e.yAxis && n.getCoordByIndex
            ? n.getCoordByIndex(e.yAxis || 0)
            : n.getCoord(e.yAxis || 0),
        ];
      },
      refresh: function (t) {
        t && ((this.option = t), (this.series = t.series)),
          this.backupShapeList(),
          this._buildShape();
      },
      ontooltipHover: function (t, e) {
        for (var i, o, s = t.seriesIndex, n = t.dataIndex, r = s.length; r--; )
          if ((i = this.finalPLMap[s[r]]))
            for (var a = 0, h = i.length; h > a; a++) {
              o = i[a];
              for (var l = 0, d = o.length; d > l; l++)
                n === o[l][2] &&
                  e.push(
                    this._getSymbol(
                      s[r],
                      o[l][2],
                      o[l][3],
                      o[l][0],
                      o[l][1],
                      "horizontal"
                    )
                  );
            }
      },
      addDataAnimation: function (t) {
        for (var e = this.series, i = {}, o = 0, s = t.length; s > o; o++)
          i[t[o][0]] = t[o];
        for (
          var n, r, a, h, l, d, c, o = this.shapeList.length - 1;
          o >= 0;
          o--
        )
          if (((l = this.shapeList[o]._seriesIndex), i[l] && !i[l][3])) {
            if (
              this.shapeList[o]._main &&
              this.shapeList[o].style.pointList.length > 1
            ) {
              if (
                ((d = this.shapeList[o].style.pointList),
                (r = Math.abs(d[0][0] - d[1][0])),
                (h = Math.abs(d[0][1] - d[1][1])),
                (c = "horizontal" === this.shapeList[o]._orient),
                i[l][2])
              ) {
                if ("half-smooth-polygon" === this.shapeList[o].type) {
                  var p = d.length;
                  (this.shapeList[o].style.pointList[p - 3] = d[p - 2]),
                    (this.shapeList[o].style.pointList[p - 3][c ? 0 : 1] =
                      d[p - 4][c ? 0 : 1]),
                    (this.shapeList[o].style.pointList[p - 2] = d[p - 1]);
                }
                this.shapeList[o].style.pointList.pop(),
                  c ? ((n = r), (a = 0)) : ((n = 0), (a = -h));
              } else {
                if (
                  (this.shapeList[o].style.pointList.shift(),
                  "half-smooth-polygon" === this.shapeList[o].type)
                ) {
                  var u = this.shapeList[o].style.pointList.pop();
                  c ? (u[0] = d[0][0]) : (u[1] = d[0][1]),
                    this.shapeList[o].style.pointList.push(u);
                }
                c ? ((n = -r), (a = 0)) : ((n = 0), (a = h));
              }
              this.zr.modShape(
                this.shapeList[o].id,
                { style: { pointList: this.shapeList[o].style.pointList } },
                !0
              );
            } else {
              if (
                i[l][2] &&
                this.shapeList[o]._dataIndex === e[l].data.length - 1
              ) {
                this.zr.delShape(this.shapeList[o].id);
                continue;
              }
              if (!i[l][2] && 0 === this.shapeList[o]._dataIndex) {
                this.zr.delShape(this.shapeList[o].id);
                continue;
              }
            }
            (this.shapeList[o].position = [0, 0]),
              this.zr
                .animate(this.shapeList[o].id, "")
                .when(this.query(this.option, "animationDurationUpdate"), {
                  position: [n, a],
                })
                .start();
          }
      },
    }),
    (n.prototype.iconLibrary.legendLineIcon = i),
    l.inherits(e, o),
    t("../chart").define("line", e),
    e
  );
}),
  define("echarts/util/shape/HalfSmoothPolygon", [
    "require",
    "zrender/shape/Base",
    "zrender/shape/util/smoothBezier",
    "zrender/tool/util",
    "zrender/shape/Polygon",
  ], function (t) {
    function e(t) {
      i.call(this, t);
    }
    var i = t("zrender/shape/Base"),
      o = t("zrender/shape/util/smoothBezier"),
      s = t("zrender/tool/util");
    return (
      (e.prototype = {
        type: "half-smooth-polygon",
        buildPath: function (e, i) {
          var s = i.pointList;
          if (!(s.length < 2))
            if (i.smooth) {
              var n = o(s.slice(0, -2), i.smooth, !1, i.smoothConstraint);
              e.moveTo(s[0][0], s[0][1]);
              for (var r, a, h, l = s.length, d = 0; l - 3 > d; d++)
                (r = n[2 * d]),
                  (a = n[2 * d + 1]),
                  (h = s[d + 1]),
                  e.bezierCurveTo(r[0], r[1], a[0], a[1], h[0], h[1]);
              e.lineTo(s[l - 2][0], s[l - 2][1]),
                e.lineTo(s[l - 1][0], s[l - 1][1]),
                e.lineTo(s[0][0], s[0][1]);
            } else t("zrender/shape/Polygon").prototype.buildPath(e, i);
        },
      }),
      s.inherits(e, i),
      e
    );
  }),
  define("echarts/component/axis", [
    "require",
    "./base",
    "zrender/shape/Line",
    "../config",
    "../util/ecData",
    "zrender/tool/util",
    "zrender/tool/color",
    "./categoryAxis",
    "./valueAxis",
    "../component",
  ], function (t) {
    function e(t, e, o, s, n, r) {
      i.call(this, t, e, o, s, n),
        (this.axisType = r),
        (this._axisList = []),
        this.refresh(s);
    }
    var i = t("./base"),
      o = t("zrender/shape/Line"),
      s = t("../config"),
      n = t("../util/ecData"),
      r = t("zrender/tool/util"),
      a = t("zrender/tool/color");
    return (
      (e.prototype = {
        type: s.COMPONENT_TYPE_AXIS,
        axisBase: {
          _buildAxisLine: function () {
            var t = this.option.axisLine.lineStyle.width,
              e = t / 2,
              i = {
                _axisShape: "axisLine",
                zlevel: this.getZlevelBase(),
                z: this.getZBase() + 3,
                hoverable: !1,
              },
              s = this.grid;
            switch (this.option.position) {
              case "left":
                i.style = {
                  xStart: s.getX() - e,
                  yStart: s.getYend(),
                  xEnd: s.getX() - e,
                  yEnd: s.getY(),
                  lineCap: "round",
                };
                break;
              case "right":
                i.style = {
                  xStart: s.getXend() + e,
                  yStart: s.getYend(),
                  xEnd: s.getXend() + e,
                  yEnd: s.getY(),
                  lineCap: "round",
                };
                break;
              case "bottom":
                i.style = {
                  xStart: s.getX(),
                  yStart: s.getYend() + e,
                  xEnd: s.getXend(),
                  yEnd: s.getYend() + e,
                  lineCap: "round",
                };
                break;
              case "top":
                i.style = {
                  xStart: s.getX(),
                  yStart: s.getY() - e,
                  xEnd: s.getXend(),
                  yEnd: s.getY() - e,
                  lineCap: "round",
                };
            }
            var n = i.style;
            "" !== this.option.name &&
              ((n.text = this.option.name),
              (n.textPosition = this.option.nameLocation),
              (n.textFont = this.getFont(this.option.nameTextStyle)),
              this.option.nameTextStyle.align &&
                (n.textAlign = this.option.nameTextStyle.align),
              this.option.nameTextStyle.baseline &&
                (n.textBaseline = this.option.nameTextStyle.baseline),
              this.option.nameTextStyle.color &&
                (n.textColor = this.option.nameTextStyle.color)),
              (n.strokeColor = this.option.axisLine.lineStyle.color),
              (n.lineWidth = t),
              this.isHorizontal()
                ? (n.yStart = n.yEnd = this.subPixelOptimize(n.yEnd, t))
                : (n.xStart = n.xEnd = this.subPixelOptimize(n.xEnd, t)),
              (n.lineType = this.option.axisLine.lineStyle.type),
              (i = new o(i)),
              this.shapeList.push(i);
          },
          _axisLabelClickable: function (t, e) {
            return t
              ? (n.pack(e, void 0, -1, void 0, -1, e.style.text),
                (e.hoverable = !0),
                (e.clickable = !0),
                (e.highlightStyle = {
                  color: a.lift(e.style.color, 1),
                  brushType: "fill",
                }),
                e)
              : e;
          },
          refixAxisShape: function (t, e) {
            if (this.option.axisLine.onZero) {
              var i;
              if (this.isHorizontal() && null != e)
                for (var o = 0, s = this.shapeList.length; s > o; o++)
                  "axisLine" === this.shapeList[o]._axisShape
                    ? ((this.shapeList[o].style.yStart = this.shapeList[
                        o
                      ].style.yEnd = this.subPixelOptimize(
                        e,
                        this.shapeList[o].stylelineWidth
                      )),
                      this.zr.modShape(this.shapeList[o].id))
                    : "axisTick" === this.shapeList[o]._axisShape &&
                      ((i =
                        this.shapeList[o].style.yEnd -
                        this.shapeList[o].style.yStart),
                      (this.shapeList[o].style.yStart = e - i),
                      (this.shapeList[o].style.yEnd = e),
                      this.zr.modShape(this.shapeList[o].id));
              if (!this.isHorizontal() && null != t)
                for (var o = 0, s = this.shapeList.length; s > o; o++)
                  "axisLine" === this.shapeList[o]._axisShape
                    ? ((this.shapeList[o].style.xStart = this.shapeList[
                        o
                      ].style.xEnd = this.subPixelOptimize(
                        t,
                        this.shapeList[o].stylelineWidth
                      )),
                      this.zr.modShape(this.shapeList[o].id))
                    : "axisTick" === this.shapeList[o]._axisShape &&
                      ((i =
                        this.shapeList[o].style.xEnd -
                        this.shapeList[o].style.xStart),
                      (this.shapeList[o].style.xStart = t),
                      (this.shapeList[o].style.xEnd = t + i),
                      this.zr.modShape(this.shapeList[o].id));
            }
          },
          getPosition: function () {
            return this.option.position;
          },
          isHorizontal: function () {
            return (
              "bottom" === this.option.position ||
              "top" === this.option.position
            );
          },
        },
        reformOption: function (t) {
          if (
            (!t || (t instanceof Array && 0 === t.length)
              ? (t = [{ type: s.COMPONENT_TYPE_AXIS_VALUE }])
              : t instanceof Array || (t = [t]),
            t.length > 2 && (t = [t[0], t[1]]),
            "xAxis" === this.axisType)
          ) {
            (!t[0].position ||
              ("bottom" != t[0].position && "top" != t[0].position)) &&
              (t[0].position = "bottom"),
              t.length > 1 &&
                (t[1].position = "bottom" === t[0].position ? "top" : "bottom");
            for (var e = 0, i = t.length; i > e; e++)
              (t[e].type = t[e].type || "category"),
                (t[e].xAxisIndex = e),
                (t[e].yAxisIndex = -1);
          } else {
            (!t[0].position ||
              ("left" != t[0].position && "right" != t[0].position)) &&
              (t[0].position = "left"),
              t.length > 1 &&
                (t[1].position = "left" === t[0].position ? "right" : "left");
            for (var e = 0, i = t.length; i > e; e++)
              (t[e].type = t[e].type || "value"),
                (t[e].xAxisIndex = -1),
                (t[e].yAxisIndex = e);
          }
          return t;
        },
        refresh: function (e) {
          var i;
          e &&
            ((this.option = e),
            "xAxis" === this.axisType
              ? ((this.option.xAxis = this.reformOption(e.xAxis)),
                (i = this.option.xAxis))
              : ((this.option.yAxis = this.reformOption(e.yAxis)),
                (i = this.option.yAxis)),
            (this.series = e.series));
          for (
            var o = t("./categoryAxis"),
              s = t("./valueAxis"),
              n = Math.max((i && i.length) || 0, this._axisList.length),
              r = 0;
            n > r;
            r++
          )
            !this._axisList[r] ||
              !e ||
              (i[r] && this._axisList[r].type == i[r].type) ||
              (this._axisList[r].dispose && this._axisList[r].dispose(),
              (this._axisList[r] = !1)),
              this._axisList[r]
                ? this._axisList[r].refresh &&
                  this._axisList[r].refresh(i ? i[r] : !1, this.series)
                : i &&
                  i[r] &&
                  (this._axisList[r] =
                    "category" === i[r].type
                      ? new o(
                          this.ecTheme,
                          this.messageCenter,
                          this.zr,
                          i[r],
                          this.myChart,
                          this.axisBase
                        )
                      : new s(
                          this.ecTheme,
                          this.messageCenter,
                          this.zr,
                          i[r],
                          this.myChart,
                          this.axisBase,
                          this.series
                        ));
        },
        getAxis: function (t) {
          return this._axisList[t];
        },
        clear: function () {
          for (var t = 0, e = this._axisList.length; e > t; t++)
            this._axisList[t].dispose && this._axisList[t].dispose();
          this._axisList = [];
        },
      }),
      r.inherits(e, i),
      t("../component").define("axis", e),
      e
    );
  }),
  define("echarts/component/grid", [
    "require",
    "./base",
    "zrender/shape/Rectangle",
    "../config",
    "zrender/tool/util",
    "../component",
  ], function (t) {
    function e(t, e, o, s, n) {
      i.call(this, t, e, o, s, n), this.refresh(s);
    }
    var i = t("./base"),
      o = t("zrender/shape/Rectangle"),
      s = t("../config");
    s.grid = {
      zlevel: 0,
      z: 0,
      x: 12,
      y: 60,
      x2: 12,
      y2: 60,
      backgroundColor: "rgba(0,0,0,0)",
      borderWidth: 0,
      borderColor: "#ccc",
    };
    var n = t("zrender/tool/util");
    return (
      (e.prototype = {
        type: s.COMPONENT_TYPE_GRID,
        getX: function () {
          return this._x;
        },
        getY: function () {
          return this._y;
        },
        getWidth: function () {
          return this._width;
        },
        getHeight: function () {
          return this._height;
        },
        getXend: function () {
          return this._x + this._width;
        },
        getYend: function () {
          return this._y + this._height;
        },
        getArea: function () {
          return {
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height,
          };
        },
        getBbox: function () {
          return [
            [this._x, this._y],
            [this.getXend(), this.getYend()],
          ];
        },
        refixAxisShape: function (t) {
          for (
            var e,
              i,
              o,
              n = t.xAxis._axisList.concat(t.yAxis ? t.yAxis._axisList : []),
              r = n.length;
            r--;

          )
            (o = n[r]),
              o.type == s.COMPONENT_TYPE_AXIS_VALUE &&
                o._min < 0 &&
                o._max >= 0 &&
                (o.isHorizontal() ? (e = o.getCoord(0)) : (i = o.getCoord(0)));
          if ("undefined" != typeof e || "undefined" != typeof i)
            for (r = n.length; r--; ) n[r].refixAxisShape(e, i);
        },
        refresh: function (t) {
          if (
            t ||
            this._zrWidth != this.zr.getWidth() ||
            this._zrHeight != this.zr.getHeight()
          ) {
            this.clear(),
              (this.option = t || this.option),
              (this.option.grid = this.reformOption(this.option.grid));
            var e = this.option.grid;
            (this._zrWidth = this.zr.getWidth()),
              (this._zrHeight = this.zr.getHeight()),
              (this._x = this.parsePercent(e.x, this._zrWidth)),
              (this._y = this.parsePercent(e.y, this._zrHeight));
            var i = this.parsePercent(e.x2, this._zrWidth),
              s = this.parsePercent(e.y2, this._zrHeight);
            (this._width =
              "undefined" == typeof e.width
                ? this._zrWidth - this._x - i
                : this.parsePercent(e.width, this._zrWidth)),
              (this._width = this._width <= 0 ? 10 : this._width),
              (this._height =
                "undefined" == typeof e.height
                  ? this._zrHeight - this._y - s
                  : this.parsePercent(e.height, this._zrHeight)),
              (this._height = this._height <= 0 ? 10 : this._height),
              (this._x = this.subPixelOptimize(this._x, e.borderWidth)),
              (this._y = this.subPixelOptimize(this._y, e.borderWidth)),
              this.shapeList.push(
                new o({
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    x: this._x,
                    y: this._y,
                    width: this._width,
                    height: this._height,
                    brushType: e.borderWidth > 0 ? "both" : "fill",
                    color: e.backgroundColor,
                    strokeColor: e.borderColor,
                    lineWidth: e.borderWidth,
                  },
                })
              ),
              this.zr.addShape(this.shapeList[0]);
          }
        },
      }),
      n.inherits(e, i),
      t("../component").define("grid", e),
      e
    );
  }),
  define("echarts/component/dataZoom", [
    "require",
    "./base",
    "zrender/shape/Rectangle",
    "zrender/shape/Polygon",
    "../util/shape/Icon",
    "../config",
    "../util/date",
    "zrender/tool/util",
    "../component",
  ], function (t) {
    function e(t, e, o, s, n) {
      i.call(this, t, e, o, s, n);
      var r = this;
      (r._ondrift = function (t, e) {
        return r.__ondrift(this, t, e);
      }),
        (r._ondragend = function () {
          return r.__ondragend();
        }),
        (this._fillerSize = 30),
        (this._isSilence = !1),
        (this._zoom = {}),
        (this.option.dataZoom = this.reformOption(this.option.dataZoom)),
        (this.zoomOption = this.option.dataZoom),
        (this._handleSize = this.zoomOption.handleSize),
        (this._location = this._getLocation()),
        (this._zoom = this._getZoom()),
        this._backupData(),
        this.option.dataZoom.show && this._buildShape(),
        this._syncData();
    }
    var i = t("./base"),
      o = t("zrender/shape/Rectangle"),
      s = t("zrender/shape/Polygon"),
      n = t("../util/shape/Icon"),
      r = t("../config");
    r.dataZoom = {
      zlevel: 0,
      z: 4,
      show: !1,
      orient: "horizontal",
      backgroundColor: "rgba(0,0,0,0)",
      dataBackgroundColor: "#eee",
      fillerColor: "rgba(144,197,237,0.2)",
      handleColor: "rgba(70,130,180,0.8)",
      handleSize: 20,
      showDetail: !0,
      realtime: !1,
    };
    var a = t("../util/date"),
      h = t("zrender/tool/util");
    return (
      (e.prototype = {
        type: r.COMPONENT_TYPE_DATAZOOM,
        _buildShape: function () {
          this._buildBackground(),
            this._buildFiller(),
            this._buildHandle(),
            this._buildFrame();
          for (var t = 0, e = this.shapeList.length; e > t; t++)
            this.zr.addShape(this.shapeList[t]);
          this._syncFrameShape();
        },
        _getLocation: function () {
          var t,
            e,
            i,
            o,
            s = this.component.grid;
          return (
            "horizontal" == this.zoomOption.orient
              ? ((i = this.zoomOption.width || s.getWidth()),
                (o = this.zoomOption.height || this._fillerSize),
                (t = null != this.zoomOption.x ? this.zoomOption.x : s.getX()),
                (e =
                  null != this.zoomOption.y
                    ? this.zoomOption.y
                    : this.zr.getHeight() - o - 2))
              : ((i = this.zoomOption.width || this._fillerSize),
                (o = this.zoomOption.height || s.getHeight()),
                (t = null != this.zoomOption.x ? this.zoomOption.x : 2),
                (e = null != this.zoomOption.y ? this.zoomOption.y : s.getY())),
            { x: t, y: e, width: i, height: o }
          );
        },
        _getZoom: function () {
          var t = this.option.series,
            e = this.option.xAxis;
          !e || e instanceof Array || ((e = [e]), (this.option.xAxis = e));
          var i = this.option.yAxis;
          !i || i instanceof Array || ((i = [i]), (this.option.yAxis = i));
          var o,
            s,
            n = [],
            a = this.zoomOption.xAxisIndex;
          if (e && null == a) {
            o = [];
            for (var h = 0, l = e.length; l > h; h++)
              ("category" == e[h].type || null == e[h].type) && o.push(h);
          } else o = a instanceof Array ? a : null != a ? [a] : [];
          if (((a = this.zoomOption.yAxisIndex), i && null == a)) {
            s = [];
            for (var h = 0, l = i.length; l > h; h++)
              "category" == i[h].type && s.push(h);
          } else s = a instanceof Array ? a : null != a ? [a] : [];
          for (var d, h = 0, l = t.length; l > h; h++)
            if (
              ((d = t[h]),
              d.type == r.CHART_TYPE_LINE ||
                d.type == r.CHART_TYPE_BAR ||
                d.type == r.CHART_TYPE_SCATTER ||
                d.type == r.CHART_TYPE_K)
            ) {
              for (var c = 0, p = o.length; p > c; c++)
                if (o[c] == (d.xAxisIndex || 0)) {
                  n.push(h);
                  break;
                }
              for (var c = 0, p = s.length; p > c; c++)
                if (s[c] == (d.yAxisIndex || 0)) {
                  n.push(h);
                  break;
                }
              null == this.zoomOption.xAxisIndex &&
                null == this.zoomOption.yAxisIndex &&
                d.data &&
                this.getDataFromOption(d.data[0]) instanceof Array &&
                (d.type == r.CHART_TYPE_SCATTER ||
                  d.type == r.CHART_TYPE_LINE ||
                  d.type == r.CHART_TYPE_BAR) &&
                n.push(h);
            }
          var u =
              null != this._zoom.start
                ? this._zoom.start
                : null != this.zoomOption.start
                ? this.zoomOption.start
                : 0,
            g =
              null != this._zoom.end
                ? this._zoom.end
                : null != this.zoomOption.end
                ? this.zoomOption.end
                : 100;
          u > g && ((u += g), (g = u - g), (u -= g));
          var f = Math.round(
            ((g - u) / 100) *
              ("horizontal" == this.zoomOption.orient
                ? this._location.width
                : this._location.height)
          );
          return {
            start: u,
            end: g,
            start2: 0,
            end2: 100,
            size: f,
            xAxisIndex: o,
            yAxisIndex: s,
            seriesIndex: n,
            scatterMap: this._zoom.scatterMap || {},
          };
        },
        _backupData: function () {
          this._originalData = { xAxis: {}, yAxis: {}, series: {} };
          for (
            var t = this.option.xAxis,
              e = this._zoom.xAxisIndex,
              i = 0,
              o = e.length;
            o > i;
            i++
          )
            this._originalData.xAxis[e[i]] = t[e[i]].data;
          for (
            var s = this.option.yAxis,
              n = this._zoom.yAxisIndex,
              i = 0,
              o = n.length;
            o > i;
            i++
          )
            this._originalData.yAxis[n[i]] = s[n[i]].data;
          for (
            var a,
              h = this.option.series,
              l = this._zoom.seriesIndex,
              i = 0,
              o = l.length;
            o > i;
            i++
          )
            (a = h[l[i]]),
              (this._originalData.series[l[i]] = a.data),
              a.data &&
                this.getDataFromOption(a.data[0]) instanceof Array &&
                (a.type == r.CHART_TYPE_SCATTER ||
                  a.type == r.CHART_TYPE_LINE ||
                  a.type == r.CHART_TYPE_BAR) &&
                (this._backupScale(), this._calculScatterMap(l[i]));
        },
        _calculScatterMap: function (e) {
          (this._zoom.scatterMap = this._zoom.scatterMap || {}),
            (this._zoom.scatterMap[e] = this._zoom.scatterMap[e] || {});
          var i = t("../component"),
            o = i.get("axis"),
            s = h.clone(this.option.xAxis);
          "category" == s[0].type && (s[0].type = "value"),
            s[1] && "category" == s[1].type && (s[1].type = "value");
          var n = new o(
              this.ecTheme,
              null,
              !1,
              { xAxis: s, series: this.option.series },
              this,
              "xAxis"
            ),
            r = this.option.series[e].xAxisIndex || 0;
          (this._zoom.scatterMap[e].x = n.getAxis(r).getExtremum()),
            n.dispose(),
            (s = h.clone(this.option.yAxis)),
            "category" == s[0].type && (s[0].type = "value"),
            s[1] && "category" == s[1].type && (s[1].type = "value"),
            (n = new o(
              this.ecTheme,
              null,
              !1,
              { yAxis: s, series: this.option.series },
              this,
              "yAxis"
            )),
            (r = this.option.series[e].yAxisIndex || 0),
            (this._zoom.scatterMap[e].y = n.getAxis(r).getExtremum()),
            n.dispose();
        },
        _buildBackground: function () {
          var t = this._location.width,
            e = this._location.height;
          this.shapeList.push(
            new o({
              zlevel: this.getZlevelBase(),
              z: this.getZBase(),
              hoverable: !1,
              style: {
                x: this._location.x,
                y: this._location.y,
                width: t,
                height: e,
                color: this.zoomOption.backgroundColor,
              },
            })
          );
          for (
            var i = 0,
              n = this._originalData.xAxis,
              a = this._zoom.xAxisIndex,
              h = 0,
              l = a.length;
            l > h;
            h++
          )
            i = Math.max(i, n[a[h]].length);
          for (
            var d = this._originalData.yAxis,
              c = this._zoom.yAxisIndex,
              h = 0,
              l = c.length;
            l > h;
            h++
          )
            i = Math.max(i, d[c[h]].length);
          for (
            var p,
              u = this._zoom.seriesIndex[0],
              g = this._originalData.series[u],
              f = Number.MIN_VALUE,
              m = Number.MAX_VALUE,
              h = 0,
              l = g.length;
            l > h;
            h++
          )
            (p = this.getDataFromOption(g[h], 0)),
              this.option.series[u].type == r.CHART_TYPE_K && (p = p[1]),
              isNaN(p) && (p = 0),
              (f = Math.max(f, p)),
              (m = Math.min(m, p));
          var y = f - m,
            _ = [],
            v = t / (i - (i > 1 ? 1 : 0)),
            x = e / (i - (i > 1 ? 1 : 0)),
            b = 1;
          "horizontal" == this.zoomOption.orient && 1 > v
            ? (b = Math.floor((3 * i) / t))
            : "vertical" == this.zoomOption.orient &&
              1 > x &&
              (b = Math.floor((3 * i) / e));
          for (var h = 0, l = i; l > h; h += b)
            (p = this.getDataFromOption(g[h], 0)),
              this.option.series[u].type == r.CHART_TYPE_K && (p = p[1]),
              isNaN(p) && (p = 0),
              _.push(
                "horizontal" == this.zoomOption.orient
                  ? [
                      this._location.x + v * h,
                      this._location.y +
                        e -
                        1 -
                        Math.round(((p - m) / y) * (e - 10)),
                    ]
                  : [
                      this._location.x +
                        1 +
                        Math.round(((p - m) / y) * (t - 10)),
                      this._location.y + x * (l - h - 1),
                    ]
              );
          "horizontal" == this.zoomOption.orient
            ? (_.push([this._location.x + t, this._location.y + e]),
              _.push([this._location.x, this._location.y + e]))
            : (_.push([this._location.x, this._location.y]),
              _.push([this._location.x, this._location.y + e])),
            this.shapeList.push(
              new s({
                zlevel: this.getZlevelBase(),
                z: this.getZBase(),
                style: {
                  pointList: _,
                  color: this.zoomOption.dataBackgroundColor,
                },
                hoverable: !1,
              })
            );
        },
        _buildFiller: function () {
          (this._fillerShae = {
            zlevel: this.getZlevelBase(),
            z: this.getZBase(),
            draggable: !0,
            ondrift: this._ondrift,
            ondragend: this._ondragend,
            _type: "filler",
          }),
            (this._fillerShae.style =
              "horizontal" == this.zoomOption.orient
                ? {
                    x:
                      this._location.x +
                      Math.round(
                        (this._zoom.start / 100) * this._location.width
                      ) +
                      this._handleSize,
                    y: this._location.y,
                    width: this._zoom.size - 2 * this._handleSize,
                    height: this._location.height,
                    color: this.zoomOption.fillerColor,
                    text: ":::",
                    textPosition: "inside",
                  }
                : {
                    x: this._location.x,
                    y:
                      this._location.y +
                      Math.round(
                        (this._zoom.start / 100) * this._location.height
                      ) +
                      this._handleSize,
                    width: this._location.width,
                    height: this._zoom.size - 2 * this._handleSize,
                    color: this.zoomOption.fillerColor,
                    text: "::",
                    textPosition: "inside",
                  }),
            (this._fillerShae.highlightStyle = {
              brushType: "fill",
              color: "rgba(0,0,0,0)",
            }),
            (this._fillerShae = new o(this._fillerShae)),
            this.shapeList.push(this._fillerShae);
        },
        _buildHandle: function () {
          var t = this.zoomOption.showDetail
            ? this._getDetail()
            : { start: "", end: "" };
          (this._startShape = {
            zlevel: this.getZlevelBase(),
            z: this.getZBase(),
            draggable: !0,
            style: {
              iconType: "rectangle",
              x: this._location.x,
              y: this._location.y,
              width: this._handleSize,
              height: this._handleSize,
              color: this.zoomOption.handleColor,
              text: "=",
              textPosition: "inside",
            },
            highlightStyle: {
              text: t.start,
              brushType: "fill",
              textPosition: "left",
            },
            ondrift: this._ondrift,
            ondragend: this._ondragend,
          }),
            "horizontal" == this.zoomOption.orient
              ? ((this._startShape.style.height = this._location.height),
                (this._endShape = h.clone(this._startShape)),
                (this._startShape.style.x =
                  this._fillerShae.style.x - this._handleSize),
                (this._endShape.style.x =
                  this._fillerShae.style.x + this._fillerShae.style.width),
                (this._endShape.highlightStyle.text = t.end),
                (this._endShape.highlightStyle.textPosition = "right"))
              : ((this._startShape.style.width = this._location.width),
                (this._endShape = h.clone(this._startShape)),
                (this._startShape.style.y =
                  this._fillerShae.style.y + this._fillerShae.style.height),
                (this._startShape.highlightStyle.textPosition = "bottom"),
                (this._endShape.style.y =
                  this._fillerShae.style.y - this._handleSize),
                (this._endShape.highlightStyle.text = t.end),
                (this._endShape.highlightStyle.textPosition = "top")),
            (this._startShape = new n(this._startShape)),
            (this._endShape = new n(this._endShape)),
            this.shapeList.push(this._startShape),
            this.shapeList.push(this._endShape);
        },
        _buildFrame: function () {
          var t = this.subPixelOptimize(this._location.x, 1),
            e = this.subPixelOptimize(this._location.y, 1);
          (this._startFrameShape = {
            zlevel: this.getZlevelBase(),
            z: this.getZBase(),
            hoverable: !1,
            style: {
              x: t,
              y: e,
              width: this._location.width - (t > this._location.x ? 1 : 0),
              height: this._location.height - (e > this._location.y ? 1 : 0),
              lineWidth: 1,
              brushType: "stroke",
              strokeColor: this.zoomOption.handleColor,
            },
          }),
            (this._endFrameShape = h.clone(this._startFrameShape)),
            (this._startFrameShape = new o(this._startFrameShape)),
            (this._endFrameShape = new o(this._endFrameShape)),
            this.shapeList.push(this._startFrameShape),
            this.shapeList.push(this._endFrameShape);
        },
        _syncHandleShape: function () {
          "horizontal" == this.zoomOption.orient
            ? ((this._startShape.style.x =
                this._fillerShae.style.x - this._handleSize),
              (this._endShape.style.x =
                this._fillerShae.style.x + this._fillerShae.style.width),
              (this._zoom.start =
                ((this._startShape.style.x - this._location.x) /
                  this._location.width) *
                100),
              (this._zoom.end =
                ((this._endShape.style.x +
                  this._handleSize -
                  this._location.x) /
                  this._location.width) *
                100))
            : ((this._startShape.style.y =
                this._fillerShae.style.y + this._fillerShae.style.height),
              (this._endShape.style.y =
                this._fillerShae.style.y - this._handleSize),
              (this._zoom.start =
                ((this._location.y +
                  this._location.height -
                  this._startShape.style.y) /
                  this._location.height) *
                100),
              (this._zoom.end =
                ((this._location.y +
                  this._location.height -
                  this._endShape.style.y -
                  this._handleSize) /
                  this._location.height) *
                100)),
            this.zr.modShape(this._startShape.id),
            this.zr.modShape(this._endShape.id),
            this._syncFrameShape(),
            this.zr.refreshNextFrame();
        },
        _syncFillerShape: function () {
          var t, e;
          "horizontal" == this.zoomOption.orient
            ? ((t = this._startShape.style.x),
              (e = this._endShape.style.x),
              (this._fillerShae.style.x = Math.min(t, e) + this._handleSize),
              (this._fillerShae.style.width =
                Math.abs(t - e) - this._handleSize),
              (this._zoom.start =
                ((Math.min(t, e) - this._location.x) / this._location.width) *
                100),
              (this._zoom.end =
                ((Math.max(t, e) + this._handleSize - this._location.x) /
                  this._location.width) *
                100))
            : ((t = this._startShape.style.y),
              (e = this._endShape.style.y),
              (this._fillerShae.style.y = Math.min(t, e) + this._handleSize),
              (this._fillerShae.style.height =
                Math.abs(t - e) - this._handleSize),
              (this._zoom.start =
                ((this._location.y + this._location.height - Math.max(t, e)) /
                  this._location.height) *
                100),
              (this._zoom.end =
                ((this._location.y +
                  this._location.height -
                  Math.min(t, e) -
                  this._handleSize) /
                  this._location.height) *
                100)),
            this.zr.modShape(this._fillerShae.id),
            this._syncFrameShape(),
            this.zr.refreshNextFrame();
        },
        _syncFrameShape: function () {
          "horizontal" == this.zoomOption.orient
            ? ((this._startFrameShape.style.width =
                this._fillerShae.style.x - this._location.x),
              (this._endFrameShape.style.x =
                this._fillerShae.style.x + this._fillerShae.style.width),
              (this._endFrameShape.style.width =
                this._location.x +
                this._location.width -
                this._endFrameShape.style.x))
            : ((this._startFrameShape.style.y =
                this._fillerShae.style.y + this._fillerShae.style.height),
              (this._startFrameShape.style.height =
                this._location.y +
                this._location.height -
                this._startFrameShape.style.y),
              (this._endFrameShape.style.height =
                this._fillerShae.style.y - this._location.y)),
            this.zr.modShape(this._startFrameShape.id),
            this.zr.modShape(this._endFrameShape.id);
        },
        _syncShape: function () {
          this.zoomOption.show &&
            ("horizontal" == this.zoomOption.orient
              ? ((this._startShape.style.x =
                  this._location.x +
                  (this._zoom.start / 100) * this._location.width),
                (this._endShape.style.x =
                  this._location.x +
                  (this._zoom.end / 100) * this._location.width -
                  this._handleSize),
                (this._fillerShae.style.x =
                  this._startShape.style.x + this._handleSize),
                (this._fillerShae.style.width =
                  this._endShape.style.x -
                  this._startShape.style.x -
                  this._handleSize))
              : ((this._startShape.style.y =
                  this._location.y +
                  this._location.height -
                  (this._zoom.start / 100) * this._location.height),
                (this._endShape.style.y =
                  this._location.y +
                  this._location.height -
                  (this._zoom.end / 100) * this._location.height -
                  this._handleSize),
                (this._fillerShae.style.y =
                  this._endShape.style.y + this._handleSize),
                (this._fillerShae.style.height =
                  this._startShape.style.y -
                  this._endShape.style.y -
                  this._handleSize)),
            this.zr.modShape(this._startShape.id),
            this.zr.modShape(this._endShape.id),
            this.zr.modShape(this._fillerShae.id),
            this._syncFrameShape(),
            this.zr.refresh());
        },
        _syncData: function (t) {
          var e, i, o, s, n;
          for (var a in this._originalData) {
            e = this._originalData[a];
            for (var h in e)
              (n = e[h]),
                null != n &&
                  ((s = n.length),
                  (i = Math.floor((this._zoom.start / 100) * s)),
                  (o = Math.ceil((this._zoom.end / 100) * s)),
                  this.getDataFromOption(n[0]) instanceof Array &&
                  this.option[a][h].type != r.CHART_TYPE_K
                    ? (this._setScale(),
                      (this.option[a][h].data = this._synScatterData(h, n)))
                    : (this.option[a][h].data = n.slice(i, o)));
          }
          this._isSilence ||
            (!this.zoomOption.realtime && !t) ||
            this.messageCenter.dispatch(
              r.EVENT.DATA_ZOOM,
              null,
              { zoom: this._zoom },
              this.myChart
            );
        },
        _synScatterData: function (t, e) {
          if (
            0 === this._zoom.start &&
            100 == this._zoom.end &&
            0 === this._zoom.start2 &&
            100 == this._zoom.end2
          )
            return e;
          var i,
            o,
            s,
            n,
            r,
            a = [],
            h = this._zoom.scatterMap[t];
          "horizontal" == this.zoomOption.orient
            ? ((i = h.x.max - h.x.min),
              (o = (this._zoom.start / 100) * i + h.x.min),
              (s = (this._zoom.end / 100) * i + h.x.min),
              (i = h.y.max - h.y.min),
              (n = (this._zoom.start2 / 100) * i + h.y.min),
              (r = (this._zoom.end2 / 100) * i + h.y.min))
            : ((i = h.x.max - h.x.min),
              (o = (this._zoom.start2 / 100) * i + h.x.min),
              (s = (this._zoom.end2 / 100) * i + h.x.min),
              (i = h.y.max - h.y.min),
              (n = (this._zoom.start / 100) * i + h.y.min),
              (r = (this._zoom.end / 100) * i + h.y.min));
          for (var l, d = 0, c = e.length; c > d; d++)
            (l = e[d].value || e[d]),
              l[0] >= o && l[0] <= s && l[1] >= n && l[1] <= r && a.push(e[d]);
          return a;
        },
        _setScale: function () {
          var t =
              0 !== this._zoom.start ||
              100 !== this._zoom.end ||
              0 !== this._zoom.start2 ||
              100 !== this._zoom.end2,
            e = { xAxis: this.option.xAxis, yAxis: this.option.yAxis };
          for (var i in e)
            for (var o = 0, s = e[i].length; s > o; o++)
              e[i][o].scale = t || e[i][o]._scale;
        },
        _backupScale: function () {
          var t = { xAxis: this.option.xAxis, yAxis: this.option.yAxis };
          for (var e in t)
            for (var i = 0, o = t[e].length; o > i; i++)
              t[e][i]._scale = t[e][i].scale;
        },
        _getDetail: function () {
          var t = "horizontal" == this.zoomOption.orient ? "xAxis" : "yAxis",
            e = this._originalData[t];
          for (var i in e) {
            var o = e[i];
            if (null != o) {
              var s = o.length,
                n = Math.floor((this._zoom.start / 100) * s),
                r = Math.ceil((this._zoom.end / 100) * s);
              return (
                (r -= r > 0 ? 1 : 0),
                {
                  start: this.getDataFromOption(o[n]),
                  end: this.getDataFromOption(o[r]),
                }
              );
            }
          }
          var h = this._zoom.seriesIndex[0],
            l = this.option.series[h][t + "Index"] || 0,
            d = this.option[t][l].type,
            c = this._zoom.scatterMap[h][t.charAt(0)].min,
            p = this._zoom.scatterMap[h][t.charAt(0)].max,
            u = p - c;
          if ("value" == d)
            return {
              start: c + (u * this._zoom.start) / 100,
              end: c + (u * this._zoom.end) / 100,
            };
          if ("time" == d) {
            (p = c + (u * this._zoom.end) / 100),
              (c += (u * this._zoom.start) / 100);
            var g = a.getAutoFormatter(c, p).formatter;
            return { start: a.format(g, c), end: a.format(g, p) };
          }
          return { start: "", end: "" };
        },
        __ondrift: function (t, e, i) {
          this.zoomOption.zoomLock && (t = this._fillerShae);
          var o = "filler" == t._type ? this._handleSize : 0;
          if (
            ("horizontal" == this.zoomOption.orient
              ? t.style.x + e - o <= this._location.x
                ? (t.style.x = this._location.x + o)
                : t.style.x + e + t.style.width + o >=
                  this._location.x + this._location.width
                ? (t.style.x =
                    this._location.x + this._location.width - t.style.width - o)
                : (t.style.x += e)
              : t.style.y + i - o <= this._location.y
              ? (t.style.y = this._location.y + o)
              : t.style.y + i + t.style.height + o >=
                this._location.y + this._location.height
              ? (t.style.y =
                  this._location.y + this._location.height - t.style.height - o)
              : (t.style.y += i),
            "filler" == t._type
              ? this._syncHandleShape()
              : this._syncFillerShape(),
            this.zoomOption.realtime && this._syncData(),
            this.zoomOption.showDetail)
          ) {
            var s = this._getDetail();
            (this._startShape.style.text = this._startShape.highlightStyle.text =
              s.start),
              (this._endShape.style.text = this._endShape.highlightStyle.text =
                s.end),
              (this._startShape.style.textPosition = this._startShape.highlightStyle.textPosition),
              (this._endShape.style.textPosition = this._endShape.highlightStyle.textPosition);
          }
          return !0;
        },
        __ondragend: function () {
          this.zoomOption.showDetail &&
            ((this._startShape.style.text = this._endShape.style.text = "="),
            (this._startShape.style.textPosition = this._endShape.style.textPosition =
              "inside"),
            this.zr.modShape(this._startShape.id),
            this.zr.modShape(this._endShape.id),
            this.zr.refreshNextFrame()),
            (this.isDragend = !0);
        },
        ondragend: function (t, e) {
          this.isDragend &&
            t.target &&
            (!this.zoomOption.realtime && this._syncData(),
            (e.dragOut = !0),
            (e.dragIn = !0),
            this._isSilence ||
              this.zoomOption.realtime ||
              this.messageCenter.dispatch(
                r.EVENT.DATA_ZOOM,
                null,
                { zoom: this._zoom },
                this.myChart
              ),
            (e.needRefresh = !1),
            (this.isDragend = !1));
        },
        ondataZoom: function (t, e) {
          e.needRefresh = !0;
        },
        absoluteZoom: function (t) {
          (this._zoom.start = t.start),
            (this._zoom.end = t.end),
            (this._zoom.start2 = t.start2),
            (this._zoom.end2 = t.end2),
            this._syncShape(),
            this._syncData(!0);
        },
        rectZoom: function (t) {
          if (!t)
            return (
              (this._zoom.start = this._zoom.start2 = 0),
              (this._zoom.end = this._zoom.end2 = 100),
              this._syncShape(),
              this._syncData(!0),
              this._zoom
            );
          var e = this.component.grid.getArea(),
            i = { x: t.x, y: t.y, width: t.width, height: t.height };
          if (
            (i.width < 0 && ((i.x += i.width), (i.width = -i.width)),
            i.height < 0 && ((i.y += i.height), (i.height = -i.height)),
            i.x > e.x + e.width || i.y > e.y + e.height)
          )
            return !1;
          i.x < e.x && (i.x = e.x),
            i.x + i.width > e.x + e.width && (i.width = e.x + e.width - i.x),
            i.y + i.height > e.y + e.height &&
              (i.height = e.y + e.height - i.y);
          var o,
            s = (i.x - e.x) / e.width,
            n = 1 - (i.x + i.width - e.x) / e.width,
            r = 1 - (i.y + i.height - e.y) / e.height,
            a = (i.y - e.y) / e.height;
          return (
            "horizontal" == this.zoomOption.orient
              ? ((o = this._zoom.end - this._zoom.start),
                (this._zoom.start += o * s),
                (this._zoom.end -= o * n),
                (o = this._zoom.end2 - this._zoom.start2),
                (this._zoom.start2 += o * r),
                (this._zoom.end2 -= o * a))
              : ((o = this._zoom.end - this._zoom.start),
                (this._zoom.start += o * r),
                (this._zoom.end -= o * a),
                (o = this._zoom.end2 - this._zoom.start2),
                (this._zoom.start2 += o * s),
                (this._zoom.end2 -= o * n)),
            this._syncShape(),
            this._syncData(!0),
            this._zoom
          );
        },
        syncBackupData: function (t) {
          for (
            var e,
              i,
              o = this._originalData.series,
              s = t.series,
              n = 0,
              r = s.length;
            r > n;
            n++
          ) {
            (i = s[n].data || s[n].eventList),
              (e = o[n]
                ? Math.floor((this._zoom.start / 100) * o[n].length)
                : 0);
            for (var a = 0, h = i.length; h > a; a++)
              o[n] && (o[n][a + e] = i[a]);
          }
        },
        syncOption: function (t) {
          this.silence(!0),
            (this.option = t),
            (this.option.dataZoom = this.reformOption(this.option.dataZoom)),
            (this.zoomOption = this.option.dataZoom),
            this.clear(),
            (this._location = this._getLocation()),
            (this._zoom = this._getZoom()),
            this._backupData(),
            this.option.dataZoom &&
              this.option.dataZoom.show &&
              this._buildShape(),
            this._syncData(),
            this.silence(!1);
        },
        silence: function (t) {
          this._isSilence = t;
        },
        getRealDataIndex: function (t, e) {
          if (
            !this._originalData ||
            (0 === this._zoom.start && 100 == this._zoom.end)
          )
            return e;
          var i = this._originalData.series;
          return i[t]
            ? Math.floor((this._zoom.start / 100) * i[t].length) + e
            : -1;
        },
        resize: function () {
          this.clear(),
            (this._location = this._getLocation()),
            (this._zoom = this._getZoom()),
            this.option.dataZoom.show && this._buildShape();
        },
      }),
      h.inherits(e, i),
      t("../component").define("dataZoom", e),
      e
    );
  }),
  define("echarts/component/categoryAxis", [
    "require",
    "./base",
    "zrender/shape/Text",
    "zrender/shape/Line",
    "zrender/shape/Rectangle",
    "../config",
    "zrender/tool/util",
    "zrender/tool/area",
    "../component",
  ], function (t) {
    function e(t, e, o, s, n, r) {
      if (s.data.length < 1)
        return void console.error("option.data.length < 1.");
      i.call(this, t, e, o, s, n), (this.grid = this.component.grid);
      for (var a in r) this[a] = r[a];
      this.refresh(s);
    }
    var i = t("./base"),
      o = t("zrender/shape/Text"),
      s = t("zrender/shape/Line"),
      n = t("zrender/shape/Rectangle"),
      r = t("../config");
    r.categoryAxis = {
      zlevel: 0,
      z: 0,
      show: !0,
      position: "bottom",
      name: "",
      nameLocation: "end",
      nameTextStyle: {},
      boundaryGap: !0,
      axisLine: {
        show: !0,
        onZero: !0,
        lineStyle: { color: "#48b", width: 2, type: "solid" },
      },
      axisTick: {
        show: !0,
        interval: "auto",
        inside: !1,
        length: 5,
        lineStyle: { color: "#333", width: 1 },
      },
      axisLabel: {
        show: !0,
        interval: "auto",
        rotate: 0,
        margin: 8,
        textStyle: { color: "#333" },
      },
      splitLine: {
        show: !1,
        lineStyle: { color: ["#ccc"], width: 1, type: "solid" },
      },
      splitArea: {
        show: !1,
        areaStyle: {
          color: ["rgba(250,250,250,0.3)", "rgba(200,200,200,0.3)"],
        },
      },
    };
    var a = t("zrender/tool/util"),
      h = t("zrender/tool/area");
    return (
      (e.prototype = {
        type: r.COMPONENT_TYPE_AXIS_CATEGORY,
        _getReformedLabel: function (t) {
          var e = this.getDataFromOption(this.option.data[t]),
            i =
              this.option.data[t].formatter || this.option.axisLabel.formatter;
          return (
            i &&
              ("function" == typeof i
                ? (e = i.call(this.myChart, e))
                : "string" == typeof i && (e = i.replace("{value}", e))),
            e
          );
        },
        _getInterval: function () {
          var t = this.option.axisLabel.interval;
          if ("auto" == t) {
            var e = this.option.axisLabel.textStyle.fontSize,
              i = this.option.data,
              o = this.option.data.length;
            if (this.isHorizontal())
              if (o > 3) {
                var s,
                  n,
                  r = this.getGap(),
                  l = !1,
                  d = Math.floor(0.5 / r);
                for (d = 1 > d ? 1 : d, t = Math.floor(15 / r); !l && o > t; ) {
                  (t += d), (l = !0), (s = Math.floor(r * t));
                  for (var c = Math.floor((o - 1) / t) * t; c >= 0; c -= t) {
                    if (0 !== this.option.axisLabel.rotate) n = e;
                    else if (i[c].textStyle)
                      n = h.getTextWidth(
                        this._getReformedLabel(c),
                        this.getFont(
                          a.merge(
                            i[c].textStyle,
                            this.option.axisLabel.textStyle
                          )
                        )
                      );
                    else {
                      var p = this._getReformedLabel(c) + "",
                        u = (p.match(/\w/g) || "").length,
                        g = p.length - u;
                      n = (u * e * 2) / 3 + g * e;
                    }
                    if (n > s) {
                      l = !1;
                      break;
                    }
                  }
                }
              } else t = 1;
            else if (o > 3) {
              var r = this.getGap();
              for (t = Math.floor(11 / r); e > r * t - 6 && o > t; ) t++;
            } else t = 1;
          } else t = "function" == typeof t ? 1 : t - 0 + 1;
          return t;
        },
        _buildShape: function () {
          if (((this._interval = this._getInterval()), this.option.show)) {
            this.option.splitArea.show && this._buildSplitArea(),
              this.option.splitLine.show && this._buildSplitLine(),
              this.option.axisLine.show && this._buildAxisLine(),
              this.option.axisTick.show && this._buildAxisTick(),
              this.option.axisLabel.show && this._buildAxisLabel();
            for (var t = 0, e = this.shapeList.length; e > t; t++)
              this.zr.addShape(this.shapeList[t]);
          }
        },
        _buildAxisTick: function () {
          var t,
            e = this.option.data,
            i = this.option.data.length,
            o = this.option.axisTick,
            n = o.length,
            r = o.lineStyle.color,
            a = o.lineStyle.width,
            h =
              "function" == typeof o.interval
                ? o.interval
                : "auto" == o.interval &&
                  "function" == typeof this.option.axisLabel.interval
                ? this.option.axisLabel.interval
                : !1,
            l = h
              ? 1
              : "auto" == o.interval
              ? this._interval
              : o.interval - 0 + 1,
            d = o.onGap,
            c = d
              ? this.getGap() / 2
              : "undefined" == typeof d && this.option.boundaryGap
              ? this.getGap() / 2
              : 0,
            p = c > 0 ? -l : 0;
          if (this.isHorizontal())
            for (
              var u,
                g =
                  "bottom" == this.option.position
                    ? o.inside
                      ? this.grid.getYend() - n - 1
                      : this.grid.getYend() + 1
                    : o.inside
                    ? this.grid.getY() + 1
                    : this.grid.getY() - n - 1,
                f = p;
              i > f;
              f += l
            )
              (!h || h(f, e[f])) &&
                ((u = this.subPixelOptimize(
                  this.getCoordByIndex(f) + (f >= 0 ? c : 0),
                  a
                )),
                (t = {
                  _axisShape: "axisTick",
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    xStart: u,
                    yStart: g,
                    xEnd: u,
                    yEnd: g + n,
                    strokeColor: r,
                    lineWidth: a,
                  },
                }),
                this.shapeList.push(new s(t)));
          else
            for (
              var m,
                y =
                  "left" == this.option.position
                    ? o.inside
                      ? this.grid.getX() + 1
                      : this.grid.getX() - n - 1
                    : o.inside
                    ? this.grid.getXend() - n - 1
                    : this.grid.getXend() + 1,
                f = p;
              i > f;
              f += l
            )
              (!h || h(f, e[f])) &&
                ((m = this.subPixelOptimize(
                  this.getCoordByIndex(f) - (f >= 0 ? c : 0),
                  a
                )),
                (t = {
                  _axisShape: "axisTick",
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    xStart: y,
                    yStart: m,
                    xEnd: y + n,
                    yEnd: m,
                    strokeColor: r,
                    lineWidth: a,
                  },
                }),
                this.shapeList.push(new s(t)));
        },
        _buildAxisLabel: function () {
          var t,
            e,
            i = this.option.data,
            s = this.option.data.length,
            n = this.option.axisLabel,
            r = n.rotate,
            h = n.margin,
            l = n.clickable,
            d = n.textStyle,
            c = "function" == typeof n.interval ? n.interval : !1;
          if (this.isHorizontal()) {
            var p, u;
            "bottom" == this.option.position
              ? ((p = this.grid.getYend() + h), (u = "top"))
              : ((p = this.grid.getY() - h), (u = "bottom"));
            for (var g = 0; s > g; g += this._interval)
              (c && !c(g, i[g])) ||
                "" === this._getReformedLabel(g) ||
                ((e = a.merge(i[g].textStyle || {}, d)),
                (t = {
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase() + 3,
                  hoverable: !1,
                  style: {
                    x: this.getCoordByIndex(g),
                    y: p,
                    color: e.color,
                    text: this._getReformedLabel(g),
                    textFont: this.getFont(e),
                    textAlign: e.align || "center",
                    textBaseline: e.baseline || u,
                  },
                }),
                r &&
                  ((t.style.textAlign =
                    r > 0
                      ? "bottom" == this.option.position
                        ? "right"
                        : "left"
                      : "bottom" == this.option.position
                      ? "left"
                      : "right"),
                  (t.rotation = [(r * Math.PI) / 180, t.style.x, t.style.y])),
                this.shapeList.push(new o(this._axisLabelClickable(l, t))));
          } else {
            var f, m;
            "left" == this.option.position
              ? ((f = this.grid.getX() - h), (m = "right"))
              : ((f = this.grid.getXend() + h), (m = "left"));
            for (var g = 0; s > g; g += this._interval)
              (c && !c(g, i[g])) ||
                "" === this._getReformedLabel(g) ||
                ((e = a.merge(i[g].textStyle || {}, d)),
                (t = {
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase() + 3,
                  hoverable: !1,
                  style: {
                    x: f,
                    y: this.getCoordByIndex(g),
                    color: e.color,
                    text: this._getReformedLabel(g),
                    textFont: this.getFont(e),
                    textAlign: e.align || m,
                    textBaseline:
                      e.baseline || (0 === g && "" !== this.option.name)
                        ? "bottom"
                        : g == s - 1 && "" !== this.option.name
                        ? "top"
                        : "middle",
                  },
                }),
                r && (t.rotation = [(r * Math.PI) / 180, t.style.x, t.style.y]),
                this.shapeList.push(new o(this._axisLabelClickable(l, t))));
          }
        },
        _buildSplitLine: function () {
          var t,
            e = this.option.data,
            i = this.option.data.length,
            o = this.option.splitLine,
            n = o.lineStyle.type,
            r = o.lineStyle.width,
            a = o.lineStyle.color;
          a = a instanceof Array ? a : [a];
          var h = a.length,
            l =
              "function" == typeof this.option.axisLabel.interval
                ? this.option.axisLabel.interval
                : !1,
            d = o.onGap,
            c = d
              ? this.getGap() / 2
              : "undefined" == typeof d && this.option.boundaryGap
              ? this.getGap() / 2
              : 0;
          if (
            ((i -=
              d || ("undefined" == typeof d && this.option.boundaryGap)
                ? 1
                : 0),
            this.isHorizontal())
          )
            for (
              var p, u = this.grid.getY(), g = this.grid.getYend(), f = 0;
              i > f;
              f += this._interval
            )
              (!l || l(f, e[f])) &&
                ((p = this.subPixelOptimize(this.getCoordByIndex(f) + c, r)),
                (t = {
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    xStart: p,
                    yStart: u,
                    xEnd: p,
                    yEnd: g,
                    strokeColor: a[(f / this._interval) % h],
                    lineType: n,
                    lineWidth: r,
                  },
                }),
                this.shapeList.push(new s(t)));
          else
            for (
              var m, y = this.grid.getX(), _ = this.grid.getXend(), f = 0;
              i > f;
              f += this._interval
            )
              (!l || l(f, e[f])) &&
                ((m = this.subPixelOptimize(this.getCoordByIndex(f) - c, r)),
                (t = {
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    xStart: y,
                    yStart: m,
                    xEnd: _,
                    yEnd: m,
                    strokeColor: a[(f / this._interval) % h],
                    lineType: n,
                    lineWidth: r,
                  },
                }),
                this.shapeList.push(new s(t)));
        },
        _buildSplitArea: function () {
          var t,
            e = this.option.data,
            i = this.option.splitArea,
            o = i.areaStyle.color;
          if (o instanceof Array) {
            var s = o.length,
              r = this.option.data.length,
              a =
                "function" == typeof this.option.axisLabel.interval
                  ? this.option.axisLabel.interval
                  : !1,
              h = i.onGap,
              l = h
                ? this.getGap() / 2
                : "undefined" == typeof h && this.option.boundaryGap
                ? this.getGap() / 2
                : 0;
            if (this.isHorizontal())
              for (
                var d,
                  c = this.grid.getY(),
                  p = this.grid.getHeight(),
                  u = this.grid.getX(),
                  g = 0;
                r >= g;
                g += this._interval
              )
                (a && !a(g, e[g]) && r > g) ||
                  ((d =
                    r > g ? this.getCoordByIndex(g) + l : this.grid.getXend()),
                  (t = {
                    zlevel: this.getZlevelBase(),
                    z: this.getZBase(),
                    hoverable: !1,
                    style: {
                      x: u,
                      y: c,
                      width: d - u,
                      height: p,
                      color: o[(g / this._interval) % s],
                    },
                  }),
                  this.shapeList.push(new n(t)),
                  (u = d));
            else
              for (
                var f,
                  m = this.grid.getX(),
                  y = this.grid.getWidth(),
                  _ = this.grid.getYend(),
                  g = 0;
                r >= g;
                g += this._interval
              )
                (a && !a(g, e[g]) && r > g) ||
                  ((f = r > g ? this.getCoordByIndex(g) - l : this.grid.getY()),
                  (t = {
                    zlevel: this.getZlevelBase(),
                    z: this.getZBase(),
                    hoverable: !1,
                    style: {
                      x: m,
                      y: f,
                      width: y,
                      height: _ - f,
                      color: o[(g / this._interval) % s],
                    },
                  }),
                  this.shapeList.push(new n(t)),
                  (_ = f));
          } else
            (t = {
              zlevel: this.getZlevelBase(),
              z: this.getZBase(),
              hoverable: !1,
              style: {
                x: this.grid.getX(),
                y: this.grid.getY(),
                width: this.grid.getWidth(),
                height: this.grid.getHeight(),
                color: o,
              },
            }),
              this.shapeList.push(new n(t));
        },
        refresh: function (t) {
          t &&
            ((this.option = this.reformOption(t)),
            (this.option.axisLabel.textStyle = this.getTextStyle(
              this.option.axisLabel.textStyle
            ))),
            this.clear(),
            this._buildShape();
        },
        getGap: function () {
          var t = this.option.data.length,
            e = this.isHorizontal()
              ? this.grid.getWidth()
              : this.grid.getHeight();
          return this.option.boundaryGap ? e / t : e / (t > 1 ? t - 1 : 1);
        },
        getCoord: function (t) {
          for (
            var e = this.option.data,
              i = e.length,
              o = this.getGap(),
              s = this.option.boundaryGap ? o / 2 : 0,
              n = 0;
            i > n;
            n++
          ) {
            if (this.getDataFromOption(e[n]) == t)
              return (s = this.isHorizontal()
                ? this.grid.getX() + s
                : this.grid.getYend() - s);
            s += o;
          }
        },
        getCoordByIndex: function (t) {
          if (0 > t)
            return this.isHorizontal() ? this.grid.getX() : this.grid.getYend();
          if (t > this.option.data.length - 1)
            return this.isHorizontal() ? this.grid.getXend() : this.grid.getY();
          var e = this.getGap(),
            i = this.option.boundaryGap ? e / 2 : 0;
          return (
            (i += t * e),
            (i = this.isHorizontal()
              ? this.grid.getX() + i
              : this.grid.getYend() - i)
          );
        },
        getNameByIndex: function (t) {
          return this.getDataFromOption(this.option.data[t]);
        },
        getIndexByName: function (t) {
          for (var e = this.option.data, i = e.length, o = 0; i > o; o++)
            if (this.getDataFromOption(e[o]) == t) return o;
          return -1;
        },
        getValueFromCoord: function () {
          return "";
        },
        isMainAxis: function (t) {
          return t % this._interval === 0;
        },
      }),
      a.inherits(e, i),
      t("../component").define("categoryAxis", e),
      e
    );
  }),
  define("echarts/component/valueAxis", [
    "require",
    "./base",
    "zrender/shape/Text",
    "zrender/shape/Line",
    "zrender/shape/Rectangle",
    "../config",
    "../util/date",
    "zrender/tool/util",
    "../util/smartSteps",
    "../util/accMath",
    "../component",
  ], function (t) {
    function e(t, e, o, s, n, r, a) {
      if (!a || 0 === a.length)
        return void console.err("option.series.length == 0.");
      i.call(this, t, e, o, s, n),
        (this.series = a),
        (this.grid = this.component.grid);
      for (var h in r) this[h] = r[h];
      this.refresh(s, a);
    }
    var i = t("./base"),
      o = t("zrender/shape/Text"),
      s = t("zrender/shape/Line"),
      n = t("zrender/shape/Rectangle"),
      r = t("../config");
    r.valueAxis = {
      zlevel: 0,
      z: 0,
      show: !0,
      position: "left",
      name: "",
      nameLocation: "end",
      nameTextStyle: {},
      boundaryGap: [0, 0],
      axisLine: {
        show: !1,
        onZero: !0,
        lineStyle: { color: "#48b", width: 2, type: "solid" },
      },
      axisTick: {
        show: !1,
        inside: !1,
        length: 5,
        lineStyle: { color: "#333", width: 1 },
      },
      axisLabel: {
        show: !0,
        rotate: 0,
        margin: -1,
        textStyle: { align: "left", baseline: "bottom", color: "#333" },
      },
      splitLine: {
        show: !0,
        lineStyle: { color: ["#ccc"], width: 1, type: "solid" },
      },
      splitArea: {
        show: !1,
        areaStyle: {
          color: ["rgba(250,250,250,0.3)", "rgba(200,200,200,0.3)"],
        },
      },
    };
    var a = t("../util/date"),
      h = t("zrender/tool/util");
    return (
      (e.prototype = {
        type: r.COMPONENT_TYPE_AXIS_VALUE,
        _buildShape: function () {
          if (
            ((this._hasData = !1),
            this._calculateValue(),
            this._hasData && this.option.show)
          ) {
            this.option.splitArea.show && this._buildSplitArea(),
              this.option.splitLine.show && this._buildSplitLine(),
              this.option.axisLine.show && this._buildAxisLine(),
              this.option.axisTick.show && this._buildAxisTick(),
              this.option.axisLabel.show && this._buildAxisLabel();
            for (var t = 0, e = this.shapeList.length; e > t; t++)
              this.zr.addShape(this.shapeList[t]);
          }
        },
        _buildAxisTick: function () {
          var t,
            e = this._valueList,
            i = this._valueList.length,
            o = this.option.axisTick,
            n = o.length,
            r = o.lineStyle.color,
            a = o.lineStyle.width;
          if (this.isHorizontal())
            for (
              var h,
                l =
                  "bottom" === this.option.position
                    ? o.inside
                      ? this.grid.getYend() - n - 1
                      : this.grid.getYend() + 1
                    : o.inside
                    ? this.grid.getY() + 1
                    : this.grid.getY() - n - 1,
                d = 0;
              i > d;
              d++
            )
              (h = this.subPixelOptimize(this.getCoord(e[d]), a)),
                (t = {
                  _axisShape: "axisTick",
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    xStart: h,
                    yStart: l,
                    xEnd: h,
                    yEnd: l + n,
                    strokeColor: r,
                    lineWidth: a,
                  },
                }),
                this.shapeList.push(new s(t));
          else
            for (
              var c,
                p =
                  "left" === this.option.position
                    ? o.inside
                      ? this.grid.getX() + 1
                      : this.grid.getX() - n - 1
                    : o.inside
                    ? this.grid.getXend() - n - 1
                    : this.grid.getXend() + 1,
                d = 0;
              i > d;
              d++
            )
              (c = this.subPixelOptimize(this.getCoord(e[d]), a)),
                (t = {
                  _axisShape: "axisTick",
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    xStart: p,
                    yStart: c,
                    xEnd: p + n,
                    yEnd: c,
                    strokeColor: r,
                    lineWidth: a,
                  },
                }),
                this.shapeList.push(new s(t));
        },
        _buildAxisLabel: function () {
          var t,
            e = this._valueList,
            i = this._valueList.length,
            s = this.option.axisLabel.rotate,
            n = this.option.axisLabel.margin,
            r = this.option.axisLabel.clickable,
            a = this.option.axisLabel.textStyle;
          if (this.isHorizontal()) {
            var h, l;
            "bottom" === this.option.position
              ? ((h = this.grid.getYend() + n), (l = "top"))
              : ((h = this.grid.getY() - n), (l = "bottom"));
            for (var d = 0; i > d; d++)
              (t = {
                zlevel: this.getZlevelBase(),
                z: this.getZBase() + 3,
                hoverable: !1,
                style: {
                  x: this.getCoord(e[d]),
                  y: h,
                  color: "function" == typeof a.color ? a.color(e[d]) : a.color,
                  text: this._valueLabel[d],
                  textFont: this.getFont(a),
                  textAlign: a.align || "center",
                  textBaseline: a.baseline || l,
                },
              }),
                s &&
                  ((t.style.textAlign =
                    s > 0
                      ? "bottom" === this.option.position
                        ? "right"
                        : "left"
                      : "bottom" === this.option.position
                      ? "left"
                      : "right"),
                  (t.rotation = [(s * Math.PI) / 180, t.style.x, t.style.y])),
                this.shapeList.push(new o(this._axisLabelClickable(r, t)));
          } else {
            var c, p;
            "left" === this.option.position
              ? ((c = this.grid.getX() - n), (p = "right"))
              : ((c = this.grid.getXend() + n), (p = "left"));
            for (var d = 0; i > d; d++)
              (t = {
                zlevel: this.getZlevelBase(),
                z: this.getZBase() + 3,
                hoverable: !1,
                style: {
                  x: c,
                  y: this.getCoord(e[d]),
                  color: "function" == typeof a.color ? a.color(e[d]) : a.color,
                  text: this._valueLabel[d],
                  textFont: this.getFont(a),
                  textAlign: a.align || p,
                  textBaseline:
                    a.baseline ||
                    (0 === d && "" !== this.option.name
                      ? "bottom"
                      : d === i - 1 && "" !== this.option.name
                      ? "top"
                      : "middle"),
                },
              }),
                s && (t.rotation = [(s * Math.PI) / 180, t.style.x, t.style.y]),
                this.shapeList.push(new o(this._axisLabelClickable(r, t)));
          }
        },
        _buildSplitLine: function () {
          var t,
            e = this._valueList,
            i = this._valueList.length,
            o = this.option.splitLine,
            n = o.lineStyle.type,
            r = o.lineStyle.width,
            a = o.lineStyle.color;
          a = a instanceof Array ? a : [a];
          var h = a.length;
          if (this.isHorizontal())
            for (
              var l, d = this.grid.getY(), c = this.grid.getYend(), p = 0;
              i > p;
              p++
            )
              (l = this.subPixelOptimize(this.getCoord(e[p]), r)),
                (t = {
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    xStart: l,
                    yStart: d,
                    xEnd: l,
                    yEnd: c,
                    strokeColor: a[p % h],
                    lineType: n,
                    lineWidth: r,
                  },
                }),
                this.shapeList.push(new s(t));
          else
            for (
              var u, g = this.grid.getX(), f = this.grid.getXend(), p = 0;
              i > p;
              p++
            )
              (u = this.subPixelOptimize(this.getCoord(e[p]), r)),
                (t = {
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    xStart: g,
                    yStart: u,
                    xEnd: f,
                    yEnd: u,
                    strokeColor: a[p % h],
                    lineType: n,
                    lineWidth: r,
                  },
                }),
                this.shapeList.push(new s(t));
        },
        _buildSplitArea: function () {
          var t,
            e = this.option.splitArea.areaStyle.color;
          if (e instanceof Array) {
            var i = e.length,
              o = this._valueList,
              s = this._valueList.length;
            if (this.isHorizontal())
              for (
                var r,
                  a = this.grid.getY(),
                  h = this.grid.getHeight(),
                  l = this.grid.getX(),
                  d = 0;
                s >= d;
                d++
              )
                (r = s > d ? this.getCoord(o[d]) : this.grid.getXend()),
                  (t = {
                    zlevel: this.getZlevelBase(),
                    z: this.getZBase(),
                    hoverable: !1,
                    style: {
                      x: l,
                      y: a,
                      width: r - l,
                      height: h,
                      color: e[d % i],
                    },
                  }),
                  this.shapeList.push(new n(t)),
                  (l = r);
            else
              for (
                var c,
                  p = this.grid.getX(),
                  u = this.grid.getWidth(),
                  g = this.grid.getYend(),
                  d = 0;
                s >= d;
                d++
              )
                (c = s > d ? this.getCoord(o[d]) : this.grid.getY()),
                  (t = {
                    zlevel: this.getZlevelBase(),
                    z: this.getZBase(),
                    hoverable: !1,
                    style: {
                      x: p,
                      y: c,
                      width: u,
                      height: g - c,
                      color: e[d % i],
                    },
                  }),
                  this.shapeList.push(new n(t)),
                  (g = c);
          } else
            (t = {
              zlevel: this.getZlevelBase(),
              z: this.getZBase(),
              hoverable: !1,
              style: {
                x: this.grid.getX(),
                y: this.grid.getY(),
                width: this.grid.getWidth(),
                height: this.grid.getHeight(),
                color: e,
              },
            }),
              this.shapeList.push(new n(t));
        },
        _calculateValue: function () {
          if (isNaN(this.option.min - 0) || isNaN(this.option.max - 0)) {
            for (
              var t,
                e,
                i = {},
                o = this.component.legend,
                s = 0,
                n = this.series.length;
              n > s;
              s++
            )
              !(
                (this.series[s].type != r.CHART_TYPE_LINE &&
                  this.series[s].type != r.CHART_TYPE_BAR &&
                  this.series[s].type != r.CHART_TYPE_SCATTER &&
                  this.series[s].type != r.CHART_TYPE_K &&
                  this.series[s].type != r.CHART_TYPE_EVENTRIVER) ||
                (o && !o.isSelected(this.series[s].name)) ||
                ((t = this.series[s].xAxisIndex || 0),
                (e = this.series[s].yAxisIndex || 0),
                (this.option.xAxisIndex != t && this.option.yAxisIndex != e) ||
                  !this._calculSum(i, s))
              );
            var a;
            for (var s in i) {
              a = i[s];
              for (var h = 0, l = a.length; l > h; h++)
                if (!isNaN(a[h])) {
                  (this._hasData = !0), (this._min = a[h]), (this._max = a[h]);
                  break;
                }
              if (this._hasData) break;
            }
            for (var s in i) {
              a = i[s];
              for (var h = 0, l = a.length; l > h; h++)
                isNaN(a[h]) ||
                  ((this._min = Math.min(this._min, a[h])),
                  (this._max = Math.max(this._max, a[h])));
            }
            var d = Math.abs(this._max - this._min);
            (this._min = isNaN(this.option.min - 0)
              ? this._min - Math.abs(d * this.option.boundaryGap[0])
              : this.option.min - 0),
              (this._max = isNaN(this.option.max - 0)
                ? this._max + Math.abs(d * this.option.boundaryGap[1])
                : this.option.max - 0),
              this._min === this._max &&
                (0 === this._max
                  ? (this._max = 1)
                  : this._max > 0
                  ? (this._min =
                      this._max / this.option.splitNumber != null
                        ? this.option.splitNumber
                        : 5)
                  : (this._max =
                      this._max / this.option.splitNumber != null
                        ? this.option.splitNumber
                        : 5)),
              "time" != this.option.type
                ? this._reformValue(this.option.scale)
                : this._reformTimeValue();
          } else
            (this._hasData = !0),
              (this._min = this.option.min - 0),
              (this._max = this.option.max - 0),
              "time" != this.option.type
                ? this._customerValue()
                : this._reformTimeValue();
        },
        _calculSum: function (t, e) {
          var i,
            o,
            s = this.series[e].name || "kener";
          if (this.series[e].stack) {
            var n = "__Magic_Key_Positive__" + this.series[e].stack,
              h = "__Magic_Key_Negative__" + this.series[e].stack;
            (t[n] = t[n] || []),
              (t[h] = t[h] || []),
              (t[s] = t[s] || []),
              (o = this.series[e].data);
            for (var l = 0, d = o.length; d > l; l++)
              (i = this.getDataFromOption(o[l])),
                "-" !== i &&
                  ((i -= 0),
                  i >= 0
                    ? null != t[n][l]
                      ? (t[n][l] += i)
                      : (t[n][l] = i)
                    : null != t[h][l]
                    ? (t[h][l] += i)
                    : (t[h][l] = i),
                  this.option.scale && t[s].push(i));
          } else if (
            ((t[s] = t[s] || []),
            this.series[e].type != r.CHART_TYPE_EVENTRIVER)
          ) {
            o = this.series[e].data;
            for (var l = 0, d = o.length; d > l; l++)
              (i = this.getDataFromOption(o[l])),
                this.series[e].type === r.CHART_TYPE_K
                  ? (t[s].push(i[0]),
                    t[s].push(i[1]),
                    t[s].push(i[2]),
                    t[s].push(i[3]))
                  : i instanceof Array
                  ? (-1 != this.option.xAxisIndex &&
                      t[s].push(
                        "time" != this.option.type ? i[0] : a.getNewDate(i[0])
                      ),
                    -1 != this.option.yAxisIndex &&
                      t[s].push(
                        "time" != this.option.type ? i[1] : a.getNewDate(i[1])
                      ))
                  : t[s].push(i);
          } else {
            o = this.series[e].eventList;
            for (var l = 0, d = o.length; d > l; l++)
              for (var c = o[l].evolution, p = 0, u = c.length; u > p; p++)
                t[s].push(a.getNewDate(c[p].time));
          }
        },
        _reformValue: function (e) {
          var i = t("../util/smartSteps"),
            o = this.option.splitNumber;
          !e && this._min >= 0 && this._max >= 0 && (this._min = 0),
            !e && this._min <= 0 && this._max <= 0 && (this._max = 0);
          var s = i(this._min, this._max, o);
          (o = null != o ? o : s.secs),
            (this._min = s.min),
            (this._max = s.max),
            (this._valueList = s.pnts),
            this._reformLabelData();
        },
        _reformTimeValue: function () {
          var t = null != this.option.splitNumber ? this.option.splitNumber : 5,
            e = a.getAutoFormatter(this._min, this._max, t),
            i = e.formatter,
            o = e.gapValue;
          this._valueList = [a.getNewDate(this._min)];
          var s;
          switch (i) {
            case "week":
              s = a.nextMonday(this._min);
              break;
            case "month":
              s = a.nextNthOnMonth(this._min, 1);
              break;
            case "quarter":
              s = a.nextNthOnQuarterYear(this._min, 1);
              break;
            case "half-year":
              s = a.nextNthOnHalfYear(this._min, 1);
              break;
            case "year":
              s = a.nextNthOnYear(this._min, 1);
              break;
            default:
              72e5 >= o
                ? (s = (Math.floor(this._min / o) + 1) * o)
                : ((s = a.getNewDate(this._min - -o)),
                  s.setHours(6 * Math.round(s.getHours() / 6)),
                  s.setMinutes(0),
                  s.setSeconds(0));
          }
          for (
            s - this._min < o / 2 && (s -= -o), e = a.getNewDate(s), t *= 1.5;
            t-- >= 0 &&
            (("month" == i ||
              "quarter" == i ||
              "half-year" == i ||
              "year" == i) &&
              e.setDate(1),
            !(this._max - e < o / 2));

          )
            this._valueList.push(e), (e = a.getNewDate(e - -o));
          this._valueList.push(a.getNewDate(this._max)),
            this._reformLabelData(i);
        },
        _customerValue: function () {
          var e = t("../util/accMath"),
            i = null != this.option.splitNumber ? this.option.splitNumber : 5,
            o = (this._max - this._min) / i;
          this._valueList = [];
          for (var s = 0; i >= s; s++)
            this._valueList.push(e.accAdd(this._min, e.accMul(o, s)));
          this._reformLabelData();
        },
        _reformLabelData: function (t) {
          this._valueLabel = [];
          var e = this.option.axisLabel.formatter;
          if (e)
            for (var i = 0, o = this._valueList.length; o > i; i++)
              "function" == typeof e
                ? this._valueLabel.push(
                    t
                      ? e.call(this.myChart, this._valueList[i], t)
                      : e.call(this.myChart, this._valueList[i])
                  )
                : "string" == typeof e &&
                  this._valueLabel.push(
                    t
                      ? a.format(e, this._valueList[i])
                      : e.replace("{value}", this._valueList[i])
                  );
          else if (t)
            for (var i = 0, o = this._valueList.length; o > i; i++)
              this._valueLabel.push(a.format(t, this._valueList[i]));
          else
            for (var i = 0, o = this._valueList.length; o > i; i++)
              this._valueLabel.push(this.numAddCommas(this._valueList[i]));
        },
        getExtremum: function () {
          return this._calculateValue(), { min: this._min, max: this._max };
        },
        refresh: function (t, e) {
          t &&
            ((this.option = this.reformOption(t)),
            (this.option.axisLabel.textStyle = h.merge(
              this.option.axisLabel.textStyle || {},
              this.ecTheme.textStyle
            )),
            (this.series = e)),
            this.zr && (this.clear(), this._buildShape());
        },
        getCoord: function (t) {
          (t = t < this._min ? this._min : t),
            (t = t > this._max ? this._max : t);
          var e;
          return (e = this.isHorizontal()
            ? this.grid.getX() +
              ((t - this._min) / (this._max - this._min)) * this.grid.getWidth()
            : this.grid.getYend() -
              ((t - this._min) / (this._max - this._min)) *
                this.grid.getHeight());
        },
        getCoordSize: function (t) {
          return Math.abs(
            this.isHorizontal()
              ? (t / (this._max - this._min)) * this.grid.getWidth()
              : (t / (this._max - this._min)) * this.grid.getHeight()
          );
        },
        getValueFromCoord: function (t) {
          var e;
          return (
            this.isHorizontal()
              ? ((t = t < this.grid.getX() ? this.grid.getX() : t),
                (t = t > this.grid.getXend() ? this.grid.getXend() : t),
                (e =
                  this._min +
                  ((t - this.grid.getX()) / this.grid.getWidth()) *
                    (this._max - this._min)))
              : ((t = t < this.grid.getY() ? this.grid.getY() : t),
                (t = t > this.grid.getYend() ? this.grid.getYend() : t),
                (e =
                  this._max -
                  ((t - this.grid.getY()) / this.grid.getHeight()) *
                    (this._max - this._min))),
            e.toFixed(2) - 0
          );
        },
        isMaindAxis: function (t) {
          for (var e = 0, i = this._valueList.length; i > e; e++)
            if (this._valueList[e] === t) return !0;
          return !1;
        },
      }),
      h.inherits(e, i),
      t("../component").define("valueAxis", e),
      e
    );
  }),
  define("echarts/util/date", [], function () {
    function t(t, e, i) {
      i = i > 1 ? i : 2;
      for (var o, s, n, r, a = 0, h = d.length; h > a; a++)
        if (
          ((o = d[a].value),
          (s = Math.ceil(e / o) * o - Math.floor(t / o) * o),
          Math.round(s / o) <= 1.2 * i)
        ) {
          (n = d[a].formatter), (r = d[a].value);
          break;
        }
      return (
        null == n &&
          ((n = "year"),
          (o = 317088e5),
          (s = Math.ceil(e / o) * o - Math.floor(t / o) * o),
          (r = Math.round(s / (i - 1) / o) * o)),
        { formatter: n, gapValue: r }
      );
    }
    function e(t) {
      return 10 > t ? "0" + t : t;
    }
    function i(t, i) {
      ("week" == t ||
        "month" == t ||
        "quarter" == t ||
        "half-year" == t ||
        "year" == t) &&
        (t = "MM - dd\nyyyy");
      var o = l(i),
        s = o.getFullYear(),
        n = o.getMonth() + 1,
        r = o.getDate(),
        a = o.getHours(),
        h = o.getMinutes(),
        d = o.getSeconds();
      return (
        (t = t.replace("MM", e(n))),
        (t = t.toLowerCase()),
        (t = t.replace("yyyy", s)),
        (t = t.replace("yy", s % 100)),
        (t = t.replace("dd", e(r))),
        (t = t.replace("d", r)),
        (t = t.replace("hh", e(a))),
        (t = t.replace("h", a)),
        (t = t.replace("mm", e(h))),
        (t = t.replace("m", h)),
        (t = t.replace("ss", e(d))),
        (t = t.replace("s", d))
      );
    }
    function o(t) {
      return (t = l(t)), t.setDate(t.getDate() + 8 - t.getDay()), t;
    }
    function s(t, e, i) {
      return (
        (t = l(t)),
        t.setMonth(Math.ceil((t.getMonth() + 1) / i) * i),
        t.setDate(e),
        t
      );
    }
    function n(t, e) {
      return s(t, e, 1);
    }
    function r(t, e) {
      return s(t, e, 3);
    }
    function a(t, e) {
      return s(t, e, 6);
    }
    function h(t, e) {
      return s(t, e, 12);
    }
    function l(t) {
      return t instanceof Date
        ? t
        : new Date("string" == typeof t ? t.replace(/-/g, "/") : t);
    }
    var d = [
      { formatter: "hh : mm : ss", value: 1e3 },
      { formatter: "hh : mm : ss", value: 5e3 },
      { formatter: "hh : mm : ss", value: 1e4 },
      { formatter: "hh : mm : ss", value: 15e3 },
      { formatter: "hh : mm : ss", value: 3e4 },
      { formatter: "hh : mm\nMM - dd", value: 6e4 },
      { formatter: "hh : mm\nMM - dd", value: 3e5 },
      { formatter: "hh : mm\nMM - dd", value: 6e5 },
      { formatter: "hh : mm\nMM - dd", value: 9e5 },
      { formatter: "hh : mm\nMM - dd", value: 18e5 },
      { formatter: "hh : mm\nMM - dd", value: 36e5 },
      { formatter: "hh : mm\nMM - dd", value: 72e5 },
      { formatter: "hh : mm\nMM - dd", value: 216e5 },
      { formatter: "hh : mm\nMM - dd", value: 432e5 },
      { formatter: "MM - dd\nyyyy", value: 864e5 },
      { formatter: "week", value: 6048e5 },
      { formatter: "month", value: 26784e5 },
      { formatter: "quarter", value: 8208e6 },
      { formatter: "half-year", value: 16416e6 },
      { formatter: "year", value: 32832e6 },
    ];
    return {
      getAutoFormatter: t,
      getNewDate: l,
      format: i,
      nextMonday: o,
      nextNthPerNmonth: s,
      nextNthOnMonth: n,
      nextNthOnQuarterYear: r,
      nextNthOnHalfYear: a,
      nextNthOnYear: h,
    };
  }),
  define("echarts/util/smartSteps", [], function () {
    function t(t) {
      return C.log(E(t)) / C.LN10;
    }
    function e(t) {
      return C.pow(10, t);
    }
    function i(t) {
      return t === M(t);
    }
    function o(t, e, o, s) {
      (v = s || {}),
        (x = v.steps || z),
        (b = v.secs || L),
        (o = w(+o || 0) % 99),
        (t = +t || 0),
        (e = +e || 0),
        (S = T = 0),
        "min" in v && ((t = +v.min || 0), (S = 1)),
        "max" in v && ((e = +v.max || 0), (T = 1)),
        t > e && (e = [t, (t = e)][0]);
      var n = e - t;
      if (S && T) return _(t, e, o);
      if ((o || 5) > n) {
        if (i(t) && i(e)) return u(t, e, o);
        if (0 === n) return g(t, e, o);
      }
      return l(t, e, o);
    }
    function s(t, i, o, s) {
      s = s || 0;
      var a = n((i - t) / o, -1),
        h = n(t, -1, 1),
        l = n(i, -1),
        d = C.min(a.e, h.e, l.e);
      0 === h.c ? (d = C.min(a.e, l.e)) : 0 === l.c && (d = C.min(a.e, h.e)),
        r(a, { c: 0, e: d }),
        r(h, a, 1),
        r(l, a),
        (s += d),
        (t = h.c),
        (i = l.c);
      for (var c = (i - t) / o, p = e(s), u = 0, g = [], f = o + 1; f--; )
        g[f] = (t + c * f) * p;
      if (0 > s) {
        (u = m(p)),
          (c = +(c * p).toFixed(u)),
          (t = +(t * p).toFixed(u)),
          (i = +(i * p).toFixed(u));
        for (var f = g.length; f--; )
          (g[f] = g[f].toFixed(u)), 0 === +g[f] && (g[f] = "0");
      } else (t *= p), (i *= p), (c *= p);
      return (
        (b = 0),
        (x = 0),
        (v = 0),
        { min: t, max: i, secs: o, step: c, fix: u, exp: s, pnts: g }
      );
    }
    function n(o, s, n) {
      (s = w(s % 10) || 2),
        0 > s &&
          (i(o)
            ? (s = ("" + E(o)).replace(/0+$/, "").length || 1)
            : ((o = o.toFixed(15).replace(/0+$/, "")),
              (s = o.replace(".", "").replace(/^[-0]+/, "").length),
              (o = +o)));
      var r = M(t(o)) - s + 1,
        a = +(o * e(-r)).toFixed(15) || 0;
      return (
        (a = n ? M(a) : A(a)),
        !a && (r = 0),
        ("" + E(a)).length > s && ((r += 1), (a /= 10)),
        { c: a, e: r }
      );
    }
    function r(t, i, o) {
      var s = i.e - t.e;
      s && ((t.e += s), (t.c *= e(-s)), (t.c = o ? M(t.c) : A(t.c)));
    }
    function a(t, e, i) {
      t.e < e.e ? r(e, t, i) : r(t, e, i);
    }
    function h(t, e) {
      (e = e || z), (t = n(t));
      for (var i = t.c, o = 0; i > e[o]; ) o++;
      if (!e[o]) for (i /= 10, t.e += 1, o = 0; i > e[o]; ) o++;
      return (t.c = e[o]), t;
    }
    function l(t, e, o) {
      var a,
        l = o || +b.slice(-1),
        g = h((e - t) / l, x),
        m = n(e - t),
        _ = n(t, -1, 1),
        v = n(e, -1);
      if (
        (r(m, g),
        r(_, g, 1),
        r(v, g),
        o ? (a = c(_, v, l)) : (l = d(_, v)),
        i(t) && i(e) && t * e >= 0)
      ) {
        if (l > e - t) return u(t, e, l);
        l = p(t, e, o, _, v, l);
      }
      var z = f(t, e, _.c, v.c);
      return (
        (_.c = z[0]),
        (v.c = z[1]),
        (S || T) && y(t, e, _, v),
        s(_.c, v.c, l, v.e)
      );
    }
    function d(t, i) {
      for (var o, s, n, r, a = [], l = b.length; l--; )
        (o = b[l]),
          (s = h((i.c - t.c) / o, x)),
          (s = s.c * e(s.e)),
          (n = M(t.c / s) * s),
          (r = A(i.c / s) * s),
          (a[l] = { min: n, max: r, step: s, span: r - n });
      return (
        a.sort(function (t, e) {
          var i = t.span - e.span;
          return 0 === i && (i = t.step - e.step), i;
        }),
        (a = a[0]),
        (o = a.span / a.step),
        (t.c = a.min),
        (i.c = a.max),
        3 > o ? 2 * o : o
      );
    }
    function c(t, i, o) {
      for (var s, n, r = i.c, a = (i.c - t.c) / o - 1; r > t.c; )
        (a = h(a + 1, x)),
          (a = a.c * e(a.e)),
          (s = a * o),
          (n = A(i.c / a) * a),
          (r = n - s);
      var l = t.c - r,
        d = n - i.c,
        c = l - d;
      return (
        c > 1.1 * a && ((c = w(c / a / 2) * a), (r += c), (n += c)),
        (t.c = r),
        (i.c = n),
        a
      );
    }
    function p(t, o, s, n, r, a) {
      var h = r.c - n.c,
        l = (h / a) * e(r.e);
      if (
        !i(l) &&
        ((l = M(l)),
        (h = l * a),
        o - t > h &&
          ((l += 1),
          (h = l * a),
          !s && l * (a - 1) >= o - t && ((a -= 1), (h = l * a))),
        h >= o - t)
      ) {
        var d = h - (o - t);
        (n.c = w(t - d / 2)), (r.c = w(o + d / 2)), (n.e = 0), (r.e = 0);
      }
      return a;
    }
    function u(t, e, i) {
      if (((i = i || 5), S)) e = t + i;
      else if (T) t = e - i;
      else {
        var o = i - (e - t),
          n = w(t - o / 2),
          r = w(e + o / 2),
          a = f(t, e, n, r);
        (t = a[0]), (e = a[1]);
      }
      return s(t, e, i);
    }
    function g(t, e, i) {
      i = i || 5;
      var o = C.min(E(e / i), i) / 2.1;
      return (
        S ? (e = t + o) : T ? (t = e - o) : ((t -= o), (e += o)), l(t, e, i)
      );
    }
    function f(t, e, i, o) {
      return (
        t >= 0 && 0 > i
          ? ((o -= i), (i = 0))
          : 0 >= e && o > 0 && ((i -= o), (o = 0)),
        [i, o]
      );
    }
    function m(t) {
      return (
        (t = (+t).toFixed(15).split(".")), t.pop().replace(/0+$/, "").length
      );
    }
    function y(t, e, i, o) {
      if (S) {
        var s = n(t, 4, 1);
        i.e - s.e > 6 && (s = { c: 0, e: i.e }),
          a(i, s),
          a(o, s),
          (o.c += s.c - i.c),
          (i.c = s.c);
      } else if (T) {
        var r = n(e, 4);
        o.e - r.e > 6 && (r = { c: 0, e: o.e }),
          a(i, r),
          a(o, r),
          (i.c += r.c - o.c),
          (o.c = r.c);
      }
    }
    function _(t, e, i) {
      var o = i ? [i] : b,
        a = e - t;
      if (0 === a)
        return (
          (e = n(e, 3)),
          (i = o[0]),
          (e.c = w(e.c + i / 2)),
          s(e.c - i, e.c, i, e.e)
        );
      E(e / a) < 1e-6 && (e = 0), E(t / a) < 1e-6 && (t = 0);
      var h,
        l,
        d,
        c = [
          [5, 10],
          [10, 2],
          [50, 10],
          [100, 2],
        ],
        p = [],
        u = [],
        g = n(e - t, 3),
        f = n(t, -1, 1),
        m = n(e, -1);
      r(f, g, 1), r(m, g), (a = m.c - f.c), (g.c = a);
      for (var y = o.length; y--; ) {
        (i = o[y]),
          (h = A(a / i)),
          (l = h * i - a),
          (d = 3 * (l + 3)),
          (d += 2 * (i - o[0] + 2)),
          i % 5 === 0 && (d -= 10);
        for (var _ = c.length; _--; ) h % c[_][0] === 0 && (d /= c[_][1]);
        (u[y] = [i, h, l, d].join()),
          (p[y] = { secs: i, step: h, delta: l, score: d });
      }
      return (
        p.sort(function (t, e) {
          return t.score - e.score;
        }),
        (p = p[0]),
        (f.c = w(f.c - p.delta / 2)),
        (m.c = w(m.c + p.delta / 2)),
        s(f.c, m.c, p.secs, g.e)
      );
    }
    var v,
      x,
      b,
      S,
      T,
      z = [10, 20, 25, 50],
      L = [4, 5, 6],
      C = Math,
      w = C.round,
      M = C.floor,
      A = C.ceil,
      E = C.abs;
    return o;
  });
