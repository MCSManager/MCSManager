define("echarts/chart/radar", [
  "require",
  "./base",
  "zrender/shape/Polygon",
  "../component/polar",
  "../config",
  "../util/ecData",
  "zrender/tool/util",
  "zrender/tool/color",
  "../util/accMath",
  "../chart",
], function (t) {
  function e(t, e, s, o, n) {
    i.call(this, t, e, s, o, n), this.refresh(o);
  }
  var i = t("./base"),
    s = t("zrender/shape/Polygon");
  t("../component/polar");
  var o = t("../config");
  o.radar = {
    zlevel: 0,
    z: 2,
    clickable: !0,
    legendHoverLink: !0,
    polarIndex: 0,
    itemStyle: {
      normal: { label: { show: !1 }, lineStyle: { width: 2, type: "solid" } },
      emphasis: { label: { show: !1 } },
    },
    symbolSize: 2,
  };
  var n = t("../util/ecData"),
    a = t("zrender/tool/util"),
    r = t("zrender/tool/color");
  return (
    (e.prototype = {
      type: o.CHART_TYPE_RADAR,
      _buildShape: function () {
        (this.selectedMap = {}),
          (this._symbol = this.option.symbolList),
          this._queryTarget,
          (this._dropBoxList = []),
          (this._radarDataCounter = 0);
        for (
          var t,
            e = this.series,
            i = this.component.legend,
            s = 0,
            n = e.length;
          n > s;
          s++
        )
          e[s].type === o.CHART_TYPE_RADAR &&
            ((this.serie = this.reformOption(e[s])),
            (this.legendHoverLink =
              e[s].legendHoverLink || this.legendHoverLink),
            (t = this.serie.name || ""),
            (this.selectedMap[t] = i ? i.isSelected(t) : !0),
            this.selectedMap[t] &&
              ((this._queryTarget = [this.serie, this.option]),
              this.deepQuery(this._queryTarget, "calculable") &&
                this._addDropBox(s),
              this._buildSingleRadar(s),
              this.buildMark(s)));
        this.addShapeList();
      },
      _buildSingleRadar: function (t) {
        for (
          var e,
            i,
            s,
            o,
            n = this.component.legend,
            a = this.serie.data,
            r = this.deepQuery(this._queryTarget, "calculable"),
            h = 0;
          h < a.length;
          h++
        )
          (s = a[h].name || ""),
            (this.selectedMap[s] = n ? n.isSelected(s) : !0),
            this.selectedMap[s] &&
              (n
                ? ((i = n.getColor(s)),
                  (e = n.getItemShape(s)),
                  e &&
                    ((e.style.brushType = this.deepQuery(
                      [a[h], this.serie],
                      "itemStyle.normal.areaStyle"
                    )
                      ? "both"
                      : "stroke"),
                    n.setItemShape(s, e)))
                : (i = this.zr.getColor(h)),
              (o = this._getPointList(this.serie.polarIndex, a[h])),
              this._addSymbol(o, i, h, t, this.serie.polarIndex),
              this._addDataShape(o, i, a[h], t, h, r),
              this._radarDataCounter++);
      },
      _getPointList: function (t, e) {
        for (
          var i, s, o = [], n = this.component.polar, a = 0, r = e.value.length;
          r > a;
          a++
        )
          (s = this.getDataFromOption(e.value[a])),
            (i = "-" != s ? n.getVector(t, a, s) : !1),
            i && o.push(i);
        return o;
      },
      _addSymbol: function (t, e, i, s, o) {
        for (
          var a, r = this.series, h = this.component.polar, l = 0, d = t.length;
          d > l;
          l++
        )
          (a = this.getSymbolShape(
            this.deepMerge([r[s].data[i], r[s]]),
            s,
            r[s].data[i].value[l],
            l,
            h.getIndicatorText(o, l),
            t[l][0],
            t[l][1],
            this._symbol[this._radarDataCounter % this._symbol.length],
            e,
            "#fff",
            "vertical"
          )),
            (a.zlevel = this.getZlevelBase()),
            (a.z = this.getZBase() + 1),
            n.set(a, "data", r[s].data[i]),
            n.set(a, "value", r[s].data[i].value),
            n.set(a, "dataIndex", i),
            n.set(a, "special", l),
            this.shapeList.push(a);
      },
      _addDataShape: function (t, e, i, o, a, h) {
        var l = this.series,
          d = [i, this.serie],
          c = this.getItemStyleColor(
            this.deepQuery(d, "itemStyle.normal.color"),
            o,
            a,
            i
          ),
          p = this.deepQuery(d, "itemStyle.normal.lineStyle.width"),
          u = this.deepQuery(d, "itemStyle.normal.lineStyle.type"),
          g = this.deepQuery(d, "itemStyle.normal.areaStyle.color"),
          f = this.deepQuery(d, "itemStyle.normal.areaStyle"),
          m = {
            zlevel: this.getZlevelBase(),
            z: this.getZBase(),
            style: {
              pointList: t,
              brushType: f ? "both" : "stroke",
              color: g || c || ("string" == typeof e ? r.alpha(e, 0.5) : e),
              strokeColor: c || e,
              lineWidth: p,
              lineType: u,
            },
            highlightStyle: {
              brushType:
                this.deepQuery(d, "itemStyle.emphasis.areaStyle") || f
                  ? "both"
                  : "stroke",
              color:
                this.deepQuery(d, "itemStyle.emphasis.areaStyle.color") ||
                g ||
                c ||
                ("string" == typeof e ? r.alpha(e, 0.5) : e),
              strokeColor:
                this.getItemStyleColor(
                  this.deepQuery(d, "itemStyle.emphasis.color"),
                  o,
                  a,
                  i
                ) ||
                c ||
                e,
              lineWidth:
                this.deepQuery(d, "itemStyle.emphasis.lineStyle.width") || p,
              lineType:
                this.deepQuery(d, "itemStyle.emphasis.lineStyle.type") || u,
            },
          };
        n.pack(
          m,
          l[o],
          o,
          i,
          a,
          i.name,
          this.component.polar.getIndicator(l[o].polarIndex)
        ),
          h && ((m.draggable = !0), this.setCalculable(m)),
          (m = new s(m)),
          this.shapeList.push(m);
      },
      _addDropBox: function (t) {
        var e = this.series,
          i = this.deepQuery(this._queryTarget, "polarIndex");
        if (!this._dropBoxList[i]) {
          var s = this.component.polar.getDropBox(i);
          (s.zlevel = this.getZlevelBase()),
            (s.z = this.getZBase()),
            this.setCalculable(s),
            n.pack(s, e, t, void 0, -1),
            this.shapeList.push(s),
            (this._dropBoxList[i] = !0);
        }
      },
      ondragend: function (t, e) {
        var i = this.series;
        if (this.isDragend && t.target) {
          var s = t.target,
            o = n.get(s, "seriesIndex"),
            a = n.get(s, "dataIndex");
          this.component.legend && this.component.legend.del(i[o].data[a].name),
            i[o].data.splice(a, 1),
            (e.dragOut = !0),
            (e.needRefresh = !0),
            (this.isDragend = !1);
        }
      },
      ondrop: function (e, i) {
        var s = this.series;
        if (this.isDrop && e.target) {
          var o,
            a,
            r = e.target,
            h = e.dragged,
            l = n.get(r, "seriesIndex"),
            d = n.get(r, "dataIndex"),
            c = this.component.legend;
          if (-1 === d)
            (o = { value: n.get(h, "value"), name: n.get(h, "name") }),
              s[l].data.push(o),
              c && c.add(o.name, h.style.color || h.style.strokeColor);
          else {
            var p = t("../util/accMath");
            (o = s[l].data[d]),
              c && c.del(o.name),
              (o.name += this.option.nameConnector + n.get(h, "name")),
              (a = n.get(h, "value"));
            for (var u = 0; u < a.length; u++)
              o.value[u] = p.accAdd(o.value[u], a[u]);
            c && c.add(o.name, h.style.color || h.style.strokeColor);
          }
          (i.dragIn = i.dragIn || !0), (this.isDrop = !1);
        }
      },
      refresh: function (t) {
        t && ((this.option = t), (this.series = t.series)),
          this.backupShapeList(),
          this._buildShape();
      },
    }),
    a.inherits(e, i),
    t("../chart").define("radar", e),
    e
  );
}),
  define("echarts/component/polar", [
    "require",
    "./base",
    "zrender/shape/Text",
    "zrender/shape/Line",
    "zrender/shape/Polygon",
    "zrender/shape/Circle",
    "zrender/shape/Ring",
    "../config",
    "zrender/tool/util",
    "../util/coordinates",
    "../util/accMath",
    "../util/smartSteps",
    "../component",
  ], function (t) {
    function e(t, e, s, o, n) {
      i.call(this, t, e, s, o, n), this.refresh(o);
    }
    var i = t("./base"),
      s = t("zrender/shape/Text"),
      o = t("zrender/shape/Line"),
      n = t("zrender/shape/Polygon"),
      a = t("zrender/shape/Circle"),
      r = t("zrender/shape/Ring"),
      h = t("../config");
    h.polar = {
      zlevel: 0,
      z: 0,
      center: ["50%", "50%"],
      radius: "75%",
      startAngle: 90,
      boundaryGap: [0, 0],
      splitNumber: 5,
      name: { show: !0, textStyle: { color: "#333" } },
      axisLine: {
        show: !0,
        lineStyle: { color: "#ccc", width: 1, type: "solid" },
      },
      axisLabel: { show: !1, textStyle: { color: "#333" } },
      splitArea: {
        show: !0,
        areaStyle: {
          color: ["rgba(250,250,250,0.3)", "rgba(200,200,200,0.3)"],
        },
      },
      splitLine: { show: !0, lineStyle: { width: 1, color: "#ccc" } },
      type: "polygon",
    };
    var l = t("zrender/tool/util"),
      d = t("../util/coordinates");
    return (
      (e.prototype = {
        type: h.COMPONENT_TYPE_POLAR,
        _buildShape: function () {
          for (var t = 0; t < this.polar.length; t++)
            (this._index = t),
              this.reformOption(this.polar[t]),
              (this._queryTarget = [this.polar[t], this.option]),
              this._createVector(t),
              this._buildSpiderWeb(t),
              this._buildText(t),
              this._adjustIndicatorValue(t),
              this._addAxisLabel(t);
          for (var t = 0; t < this.shapeList.length; t++)
            this.zr.addShape(this.shapeList[t]);
        },
        _createVector: function (t) {
          for (
            var e,
              i = this.polar[t],
              s = this.deepQuery(this._queryTarget, "indicator"),
              o = s.length,
              n = i.startAngle,
              a = (2 * Math.PI) / o,
              r = this._getRadius(),
              h = (i.__ecIndicator = []),
              l = 0;
            o > l;
            l++
          )
            (e = d.polar2cartesian(r, (n * Math.PI) / 180 + a * l)),
              h.push({ vector: [e[1], -e[0]] });
        },
        _getRadius: function () {
          var t = this.polar[this._index];
          return this.parsePercent(
            t.radius,
            Math.min(this.zr.getWidth(), this.zr.getHeight()) / 2
          );
        },
        _buildSpiderWeb: function (t) {
          var e = this.polar[t],
            i = e.__ecIndicator,
            s = e.splitArea,
            o = e.splitLine,
            n = this.getCenter(t),
            a = e.splitNumber,
            r = o.lineStyle.color,
            h = o.lineStyle.width,
            l = o.show,
            d = this.deepQuery(this._queryTarget, "axisLine");
          this._addArea(i, a, n, s, r, h, l), d.show && this._addLine(i, n, d);
        },
        _addAxisLabel: function (e) {
          for (
            var i,
              o,
              n,
              a,
              o,
              r,
              h,
              d,
              c,
              p,
              u = t("../util/accMath"),
              g = this.polar[e],
              f = this.deepQuery(this._queryTarget, "indicator"),
              m = g.__ecIndicator,
              y = this.deepQuery(this._queryTarget, "splitNumber"),
              _ = this.getCenter(e),
              x = 0;
            x < f.length;
            x++
          )
            if (
              ((i = this.deepQuery([f[x], g, this.option], "axisLabel")),
              i.show)
            ) {
              var v = this.deepQuery([i, g, this.option], "textStyle");
              if (
                ((n = {}),
                (n.textFont = this.getFont(v)),
                (n.color = v.color),
                (n = l.merge(n, i)),
                (n.lineWidth = n.width),
                (o = m[x].vector),
                (r = m[x].value),
                (d = (x / f.length) * 2 * Math.PI),
                (c = i.offset || 10),
                (p = i.interval || 0),
                !r)
              )
                return;
              for (var b = 1; y >= b; b += p + 1)
                (a = l.merge({}, n)),
                  (h = u.accAdd(r.min, u.accMul(r.step, b))),
                  (a.text = this.numAddCommas(h)),
                  (a.x = (b * o[0]) / y + Math.cos(d) * c + _[0]),
                  (a.y = (b * o[1]) / y + Math.sin(d) * c + _[1]),
                  this.shapeList.push(
                    new s({
                      zlevel: this.getZlevelBase(),
                      z: this.getZBase(),
                      style: a,
                      draggable: !1,
                      hoverable: !1,
                    })
                  );
            }
        },
        _buildText: function (t) {
          for (
            var e,
              i,
              o,
              n,
              a,
              r,
              h,
              l = this.polar[t],
              d = l.__ecIndicator,
              c = this.deepQuery(this._queryTarget, "indicator"),
              p = this.getCenter(t),
              u = 0,
              g = 0,
              f = 0;
            f < c.length;
            f++
          )
            (n = this.deepQuery([c[f], l, this.option], "name")),
              n.show &&
                ((h = this.deepQuery([n, l, this.option], "textStyle")),
                (i = {}),
                (i.textFont = this.getFont(h)),
                (i.color = h.color),
                (i.text =
                  "function" == typeof n.formatter
                    ? n.formatter.call(this.myChart, c[f].text, f)
                    : "string" == typeof n.formatter
                    ? n.formatter.replace("{value}", c[f].text)
                    : c[f].text),
                (d[f].text = i.text),
                (e = d[f].vector),
                (o =
                  Math.round(e[0]) > 0
                    ? "left"
                    : Math.round(e[0]) < 0
                    ? "right"
                    : "center"),
                null == n.margin
                  ? (e = this._mapVector(e, p, 1.1))
                  : ((r = n.margin),
                    (u = e[0] > 0 ? r : -r),
                    (g = e[1] > 0 ? r : -r),
                    (u = 0 === e[0] ? 0 : u),
                    (g = 0 === e[1] ? 0 : g),
                    (e = this._mapVector(e, p, 1))),
                (i.textAlign = o),
                (i.x = e[0] + u),
                (i.y = e[1] + g),
                (a = n.rotate
                  ? [(n.rotate / 180) * Math.PI, e[0], e[1]]
                  : [0, 0, 0]),
                this.shapeList.push(
                  new s({
                    zlevel: this.getZlevelBase(),
                    z: this.getZBase(),
                    style: i,
                    draggable: !1,
                    hoverable: !1,
                    rotation: a,
                  })
                ));
        },
        getIndicatorText: function (t, e) {
          return (
            this.polar[t] &&
            this.polar[t].__ecIndicator[e] &&
            this.polar[t].__ecIndicator[e].text
          );
        },
        getDropBox: function (t) {
          var e,
            i,
            t = t || 0,
            s = this.polar[t],
            o = this.getCenter(t),
            n = s.__ecIndicator,
            a = n.length,
            r = [],
            h = s.type;
          if ("polygon" == h) {
            for (var l = 0; a > l; l++)
              (e = n[l].vector), r.push(this._mapVector(e, o, 1.2));
            i = this._getShape(r, "fill", "rgba(0,0,0,0)", "", 1);
          } else
            "circle" == h &&
              (i = this._getCircle("", 1, 1.2, o, "fill", "rgba(0,0,0,0)"));
          return i;
        },
        _addArea: function (t, e, i, s, o, n, a) {
          for (
            var r,
              h,
              l,
              d,
              c = this.deepQuery(this._queryTarget, "type"),
              p = 0;
            e > p;
            p++
          )
            (h = (e - p) / e),
              a &&
                ("polygon" == c
                  ? ((d = this._getPointList(t, h, i)),
                    (r = this._getShape(d, "stroke", "", o, n)))
                  : "circle" == c &&
                    (r = this._getCircle(o, n, h, i, "stroke")),
                this.shapeList.push(r)),
              s.show &&
                ((l = (e - p - 1) / e), this._addSplitArea(t, s, h, l, i, p));
        },
        _getCircle: function (t, e, i, s, o, n) {
          var r = this._getRadius();
          return new a({
            zlevel: this.getZlevelBase(),
            z: this.getZBase(),
            style: {
              x: s[0],
              y: s[1],
              r: r * i,
              brushType: o,
              strokeColor: t,
              lineWidth: e,
              color: n,
            },
            hoverable: !1,
            draggable: !1,
          });
        },
        _getRing: function (t, e, i, s) {
          var o = this._getRadius();
          return new r({
            zlevel: this.getZlevelBase(),
            z: this.getZBase(),
            style: {
              x: s[0],
              y: s[1],
              r: e * o,
              r0: i * o,
              color: t,
              brushType: "fill",
            },
            hoverable: !1,
            draggable: !1,
          });
        },
        _getPointList: function (t, e, i) {
          for (var s, o = [], n = t.length, a = 0; n > a; a++)
            (s = t[a].vector), o.push(this._mapVector(s, i, e));
          return o;
        },
        _getShape: function (t, e, i, s, o) {
          return new n({
            zlevel: this.getZlevelBase(),
            z: this.getZBase(),
            style: {
              pointList: t,
              brushType: e,
              color: i,
              strokeColor: s,
              lineWidth: o,
            },
            hoverable: !1,
            draggable: !1,
          });
        },
        _addSplitArea: function (t, e, i, s, o, n) {
          var a,
            r,
            h,
            l,
            d,
            c = t.length,
            p = e.areaStyle.color,
            u = [],
            c = t.length,
            g = this.deepQuery(this._queryTarget, "type");
          if (
            ("string" == typeof p && (p = [p]),
            (r = p.length),
            (a = p[n % r]),
            "polygon" == g)
          )
            for (var f = 0; c > f; f++)
              (u = []),
                (h = t[f].vector),
                (l = t[(f + 1) % c].vector),
                u.push(this._mapVector(h, o, i)),
                u.push(this._mapVector(h, o, s)),
                u.push(this._mapVector(l, o, s)),
                u.push(this._mapVector(l, o, i)),
                (d = this._getShape(u, "fill", a, "", 1)),
                this.shapeList.push(d);
          else
            "circle" == g &&
              ((d = this._getRing(a, i, s, o)), this.shapeList.push(d));
        },
        _mapVector: function (t, e, i) {
          return [t[0] * i + e[0], t[1] * i + e[1]];
        },
        getCenter: function (t) {
          var t = t || 0;
          return this.parseCenter(this.zr, this.polar[t].center);
        },
        _addLine: function (t, e, i) {
          for (
            var s,
              o,
              n = t.length,
              a = i.lineStyle,
              r = a.color,
              h = a.width,
              l = a.type,
              d = 0;
            n > d;
            d++
          )
            (o = t[d].vector),
              (s = this._getLine(
                e[0],
                e[1],
                o[0] + e[0],
                o[1] + e[1],
                r,
                h,
                l
              )),
              this.shapeList.push(s);
        },
        _getLine: function (t, e, i, s, n, a, r) {
          return new o({
            zlevel: this.getZlevelBase(),
            z: this.getZBase(),
            style: {
              xStart: t,
              yStart: e,
              xEnd: i,
              yEnd: s,
              strokeColor: n,
              lineWidth: a,
              lineType: r,
            },
            hoverable: !1,
          });
        },
        _adjustIndicatorValue: function (e) {
          for (
            var i,
              s,
              o = this.polar[e],
              n = this.deepQuery(this._queryTarget, "indicator"),
              a = n.length,
              r = o.__ecIndicator,
              h = this._getSeriesData(e),
              l = o.boundaryGap,
              d = o.splitNumber,
              c = o.scale,
              p = t("../util/smartSteps"),
              u = 0;
            a > u;
            u++
          ) {
            if ("number" == typeof n[u].max)
              (i = n[u].max), (s = n[u].min || 0);
            else {
              var g = this._findValue(h, u, d, l);
              (s = g.min), (i = g.max);
            }
            !c && s >= 0 && i >= 0 && (s = 0),
              !c && 0 >= s && 0 >= i && (i = 0);
            var f = p(s, i, d);
            r[u].value = { min: f.min, max: f.max, step: f.step };
          }
        },
        _getSeriesData: function (t) {
          for (
            var e, i, s, o = [], n = this.component.legend, a = 0;
            a < this.series.length;
            a++
          )
            if (((e = this.series[a]), e.type == h.CHART_TYPE_RADAR)) {
              i = e.data || [];
              for (var r = 0; r < i.length; r++)
                (s = this.deepQuery([i[r], e, this.option], "polarIndex") || 0),
                  s != t || (n && !n.isSelected(i[r].name)) || o.push(i[r]);
            }
          return o;
        },
        _findValue: function (t, e, i, s) {
          function o(t) {
            (t > n || void 0 === n) && (n = t),
              (a > t || void 0 === a) && (a = t);
          }
          var n, a, r;
          if (t && 0 !== t.length) {
            if ((1 == t.length && (a = 0), 1 != t.length))
              for (var h = 0; h < t.length; h++)
                o(this.getDataFromOption(t[h].value[e]));
            else {
              r = t[0];
              for (var h = 0; h < r.value.length; h++)
                o(this.getDataFromOption(r.value[h]));
            }
            var l = Math.abs(n - a);
            return (
              (a -= Math.abs(l * s[0])),
              (n += Math.abs(l * s[1])),
              a === n && (0 === n ? (n = 1) : n > 0 ? (a = n / i) : (n /= i)),
              { max: n, min: a }
            );
          }
        },
        getVector: function (t, e, i) {
          (t = t || 0), (e = e || 0);
          var s = this.polar[t].__ecIndicator;
          if (!(e >= s.length)) {
            var o,
              n = this.polar[t].__ecIndicator[e],
              a = this.getCenter(t),
              r = n.vector,
              h = n.value.max,
              l = n.value.min;
            if ("undefined" == typeof i) return a;
            switch (i) {
              case "min":
                i = l;
                break;
              case "max":
                i = h;
                break;
              case "center":
                i = (h + l) / 2;
            }
            return (
              (o = h != l ? (i - l) / (h - l) : 0.5), this._mapVector(r, a, o)
            );
          }
        },
        isInside: function (t) {
          var e = this.getNearestIndex(t);
          return e ? e.polarIndex : -1;
        },
        getNearestIndex: function (t) {
          for (
            var e, i, s, o, n, a, r, h, l, c = 0;
            c < this.polar.length;
            c++
          ) {
            if (
              ((e = this.polar[c]),
              (i = this.getCenter(c)),
              t[0] == i[0] && t[1] == i[1])
            )
              return { polarIndex: c, valueIndex: 0 };
            if (
              ((s = this._getRadius()),
              (n = e.startAngle),
              (a = e.indicator),
              (r = a.length),
              (h = (2 * Math.PI) / r),
              (o = d.cartesian2polar(t[0] - i[0], i[1] - t[1])),
              t[0] - i[0] < 0 && (o[1] += Math.PI),
              o[1] < 0 && (o[1] += 2 * Math.PI),
              (l = o[1] - (n / 180) * Math.PI + 2 * Math.PI),
              Math.abs(Math.cos(l % (h / 2))) * s > o[0])
            )
              return {
                polarIndex: c,
                valueIndex: Math.floor((l + h / 2) / h) % r,
              };
          }
        },
        getIndicator: function (t) {
          var t = t || 0;
          return this.polar[t].indicator;
        },
        refresh: function (t) {
          t &&
            ((this.option = t),
            (this.polar = this.option.polar),
            (this.series = this.option.series)),
            this.clear(),
            this._buildShape();
        },
      }),
      l.inherits(e, i),
      t("../component").define("polar", e),
      e
    );
  }),
  define("zrender/shape/Ring", ["require", "./Base", "../tool/util"], function (
    t
  ) {
    var e = t("./Base"),
      i = function (t) {
        e.call(this, t);
      };
    return (
      (i.prototype = {
        type: "ring",
        buildPath: function (t, e) {
          t.arc(e.x, e.y, e.r, 0, 2 * Math.PI, !1),
            t.moveTo(e.x + e.r0, e.y),
            t.arc(e.x, e.y, e.r0, 0, 2 * Math.PI, !0);
        },
        getRect: function (t) {
          if (t.__rect) return t.__rect;
          var e;
          return (
            (e =
              "stroke" == t.brushType || "fill" == t.brushType
                ? t.lineWidth || 1
                : 0),
            (t.__rect = {
              x: Math.round(t.x - t.r - e / 2),
              y: Math.round(t.y - t.r - e / 2),
              width: 2 * t.r + e,
              height: 2 * t.r + e,
            }),
            t.__rect
          );
        },
      }),
      t("../tool/util").inherits(i, e),
      i
    );
  }),
  define("echarts/util/coordinates", [
    "require",
    "zrender/tool/math",
  ], function (t) {
    function e(t, e) {
      return [t * s.sin(e), t * s.cos(e)];
    }
    function i(t, e) {
      return [Math.sqrt(t * t + e * e), Math.atan(e / t)];
    }
    var s = t("zrender/tool/math");
    return { polar2cartesian: e, cartesian2polar: i };
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
    function s(t, e, s, o) {
      (x = o || {}),
        (v = x.steps || T),
        (b = x.secs || L),
        (s = w(+s || 0) % 99),
        (t = +t || 0),
        (e = +e || 0),
        (S = z = 0),
        "min" in x && ((t = +x.min || 0), (S = 1)),
        "max" in x && ((e = +x.max || 0), (z = 1)),
        t > e && (e = [t, (t = e)][0]);
      var n = e - t;
      if (S && z) return _(t, e, s);
      if ((s || 5) > n) {
        if (i(t) && i(e)) return u(t, e, s);
        if (0 === n) return g(t, e, s);
      }
      return l(t, e, s);
    }
    function o(t, i, s, o) {
      o = o || 0;
      var r = n((i - t) / s, -1),
        h = n(t, -1, 1),
        l = n(i, -1),
        d = C.min(r.e, h.e, l.e);
      0 === h.c ? (d = C.min(r.e, l.e)) : 0 === l.c && (d = C.min(r.e, h.e)),
        a(r, { c: 0, e: d }),
        a(h, r, 1),
        a(l, r),
        (o += d),
        (t = h.c),
        (i = l.c);
      for (var c = (i - t) / s, p = e(o), u = 0, g = [], f = s + 1; f--; )
        g[f] = (t + c * f) * p;
      if (0 > o) {
        (u = m(p)),
          (c = +(c * p).toFixed(u)),
          (t = +(t * p).toFixed(u)),
          (i = +(i * p).toFixed(u));
        for (var f = g.length; f--; )
          (g[f] = g[f].toFixed(u)), 0 === +g[f] && (g[f] = "0");
      } else (t *= p), (i *= p), (c *= p);
      return (
        (b = 0),
        (v = 0),
        (x = 0),
        { min: t, max: i, secs: s, step: c, fix: u, exp: o, pnts: g }
      );
    }
    function n(s, o, n) {
      (o = w(o % 10) || 2),
        0 > o &&
          (i(s)
            ? (o = ("" + E(s)).replace(/0+$/, "").length || 1)
            : ((s = s.toFixed(15).replace(/0+$/, "")),
              (o = s.replace(".", "").replace(/^[-0]+/, "").length),
              (s = +s)));
      var a = M(t(s)) - o + 1,
        r = +(s * e(-a)).toFixed(15) || 0;
      return (
        (r = n ? M(r) : A(r)),
        !r && (a = 0),
        ("" + E(r)).length > o && ((a += 1), (r /= 10)),
        { c: r, e: a }
      );
    }
    function a(t, i, s) {
      var o = i.e - t.e;
      o && ((t.e += o), (t.c *= e(-o)), (t.c = s ? M(t.c) : A(t.c)));
    }
    function r(t, e, i) {
      t.e < e.e ? a(e, t, i) : a(t, e, i);
    }
    function h(t, e) {
      (e = e || T), (t = n(t));
      for (var i = t.c, s = 0; i > e[s]; ) s++;
      if (!e[s]) for (i /= 10, t.e += 1, s = 0; i > e[s]; ) s++;
      return (t.c = e[s]), t;
    }
    function l(t, e, s) {
      var r,
        l = s || +b.slice(-1),
        g = h((e - t) / l, v),
        m = n(e - t),
        _ = n(t, -1, 1),
        x = n(e, -1);
      if (
        (a(m, g),
        a(_, g, 1),
        a(x, g),
        s ? (r = c(_, x, l)) : (l = d(_, x)),
        i(t) && i(e) && t * e >= 0)
      ) {
        if (l > e - t) return u(t, e, l);
        l = p(t, e, s, _, x, l);
      }
      var T = f(t, e, _.c, x.c);
      return (
        (_.c = T[0]),
        (x.c = T[1]),
        (S || z) && y(t, e, _, x),
        o(_.c, x.c, l, x.e)
      );
    }
    function d(t, i) {
      for (var s, o, n, a, r = [], l = b.length; l--; )
        (s = b[l]),
          (o = h((i.c - t.c) / s, v)),
          (o = o.c * e(o.e)),
          (n = M(t.c / o) * o),
          (a = A(i.c / o) * o),
          (r[l] = { min: n, max: a, step: o, span: a - n });
      return (
        r.sort(function (t, e) {
          var i = t.span - e.span;
          return 0 === i && (i = t.step - e.step), i;
        }),
        (r = r[0]),
        (s = r.span / r.step),
        (t.c = r.min),
        (i.c = r.max),
        3 > s ? 2 * s : s
      );
    }
    function c(t, i, s) {
      for (var o, n, a = i.c, r = (i.c - t.c) / s - 1; a > t.c; )
        (r = h(r + 1, v)),
          (r = r.c * e(r.e)),
          (o = r * s),
          (n = A(i.c / r) * r),
          (a = n - o);
      var l = t.c - a,
        d = n - i.c,
        c = l - d;
      return (
        c > 1.1 * r && ((c = w(c / r / 2) * r), (a += c), (n += c)),
        (t.c = a),
        (i.c = n),
        r
      );
    }
    function p(t, s, o, n, a, r) {
      var h = a.c - n.c,
        l = (h / r) * e(a.e);
      if (
        !i(l) &&
        ((l = M(l)),
        (h = l * r),
        s - t > h &&
          ((l += 1),
          (h = l * r),
          !o && l * (r - 1) >= s - t && ((r -= 1), (h = l * r))),
        h >= s - t)
      ) {
        var d = h - (s - t);
        (n.c = w(t - d / 2)), (a.c = w(s + d / 2)), (n.e = 0), (a.e = 0);
      }
      return r;
    }
    function u(t, e, i) {
      if (((i = i || 5), S)) e = t + i;
      else if (z) t = e - i;
      else {
        var s = i - (e - t),
          n = w(t - s / 2),
          a = w(e + s / 2),
          r = f(t, e, n, a);
        (t = r[0]), (e = r[1]);
      }
      return o(t, e, i);
    }
    function g(t, e, i) {
      i = i || 5;
      var s = C.min(E(e / i), i) / 2.1;
      return (
        S ? (e = t + s) : z ? (t = e - s) : ((t -= s), (e += s)), l(t, e, i)
      );
    }
    function f(t, e, i, s) {
      return (
        t >= 0 && 0 > i
          ? ((s -= i), (i = 0))
          : 0 >= e && s > 0 && ((i -= s), (s = 0)),
        [i, s]
      );
    }
    function m(t) {
      return (
        (t = (+t).toFixed(15).split(".")), t.pop().replace(/0+$/, "").length
      );
    }
    function y(t, e, i, s) {
      if (S) {
        var o = n(t, 4, 1);
        i.e - o.e > 6 && (o = { c: 0, e: i.e }),
          r(i, o),
          r(s, o),
          (s.c += o.c - i.c),
          (i.c = o.c);
      } else if (z) {
        var a = n(e, 4);
        s.e - a.e > 6 && (a = { c: 0, e: s.e }),
          r(i, a),
          r(s, a),
          (i.c += a.c - s.c),
          (s.c = a.c);
      }
    }
    function _(t, e, i) {
      var s = i ? [i] : b,
        r = e - t;
      if (0 === r)
        return (
          (e = n(e, 3)),
          (i = s[0]),
          (e.c = w(e.c + i / 2)),
          o(e.c - i, e.c, i, e.e)
        );
      E(e / r) < 1e-6 && (e = 0), E(t / r) < 1e-6 && (t = 0);
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
      a(f, g, 1), a(m, g), (r = m.c - f.c), (g.c = r);
      for (var y = s.length; y--; ) {
        (i = s[y]),
          (h = A(r / i)),
          (l = h * i - r),
          (d = 3 * (l + 3)),
          (d += 2 * (i - s[0] + 2)),
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
        o(f.c, m.c, p.secs, g.e)
      );
    }
    var x,
      v,
      b,
      S,
      z,
      T = [10, 20, 25, 50],
      L = [4, 5, 6],
      C = Math,
      w = C.round,
      M = C.floor,
      A = C.ceil,
      E = C.abs;
    return s;
  });
