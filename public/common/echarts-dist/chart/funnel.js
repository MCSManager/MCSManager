define("echarts/chart/funnel", [
  "require",
  "./base",
  "zrender/shape/Text",
  "zrender/shape/Line",
  "zrender/shape/Polygon",
  "../config",
  "../util/ecData",
  "../util/number",
  "zrender/tool/util",
  "zrender/tool/color",
  "zrender/tool/area",
  "../chart",
], function (t) {
  function e(t, e, s, o, a) {
    i.call(this, t, e, s, o, a), this.refresh(o);
  }
  var i = t("./base"),
    s = t("zrender/shape/Text"),
    o = t("zrender/shape/Line"),
    a = t("zrender/shape/Polygon"),
    n = t("../config");
  n.funnel = {
    zlevel: 0,
    z: 2,
    clickable: !0,
    legendHoverLink: !0,
    x: 10,
    y: 80,
    x2: 10,
    y2: 60,
    min: 0,
    max: 100,
    minSize: "0%",
    maxSize: "100%",
    sort: "descending",
    gap: 0,
    funnelAlign: "center",
    itemStyle: {
      normal: {
        borderColor: "#fff",
        borderWidth: 1,
        label: { show: !0, position: "outer" },
        labelLine: {
          show: !0,
          length: 10,
          lineStyle: { width: 1, type: "solid" },
        },
      },
      emphasis: {
        borderColor: "rgba(0,0,0,0)",
        borderWidth: 1,
        label: { show: !0 },
        labelLine: { show: !0 },
      },
    },
  };
  var r = t("../util/ecData"),
    h = t("../util/number"),
    l = t("zrender/tool/util"),
    d = t("zrender/tool/color"),
    p = t("zrender/tool/area");
  return (
    (e.prototype = {
      type: n.CHART_TYPE_FUNNEL,
      _buildShape: function () {
        var t = this.series,
          e = this.component.legend;
        (this._paramsMap = {}), (this._selected = {}), (this.selectedMap = {});
        for (var i, s = 0, o = t.length; o > s; s++)
          if (t[s].type === n.CHART_TYPE_FUNNEL) {
            if (
              ((t[s] = this.reformOption(t[s])),
              (this.legendHoverLink =
                t[s].legendHoverLink || this.legendHoverLink),
              (i = t[s].name || ""),
              (this.selectedMap[i] = e ? e.isSelected(i) : !0),
              !this.selectedMap[i])
            )
              continue;
            this._buildSingleFunnel(s), this.buildMark(s);
          }
        this.addShapeList();
      },
      _buildSingleFunnel: function (t) {
        var e = this.component.legend,
          i = this.series[t],
          s = this._mapData(t),
          o = this._getLocation(t);
        this._paramsMap[t] = { location: o, data: s };
        for (var a, n = 0, r = [], l = 0, d = s.length; d > l; l++)
          (a = s[l].name),
            (this.selectedMap[a] = e ? e.isSelected(a) : !0),
            this.selectedMap[a] && !isNaN(s[l].value) && (r.push(s[l]), n++);
        if (0 !== n) {
          for (
            var p,
              c,
              u,
              g,
              f = this._buildFunnelCase(t),
              y = i.funnelAlign,
              m = i.gap,
              _ = n > 1 ? (o.height - (n - 1) * m) / n : o.height,
              x = o.y,
              v =
                "descending" === i.sort
                  ? this._getItemWidth(t, r[0].value)
                  : h.parsePercent(i.minSize, o.width),
              b = "descending" === i.sort ? 1 : 0,
              S = o.centerX,
              z = [],
              l = 0,
              d = r.length;
            d > l;
            l++
          )
            if (((a = r[l].name), this.selectedMap[a] && !isNaN(r[l].value))) {
              switch (
                ((p =
                  d - 2 >= l
                    ? this._getItemWidth(t, r[l + b].value)
                    : "descending" === i.sort
                    ? h.parsePercent(i.minSize, o.width)
                    : h.parsePercent(i.maxSize, o.width)),
                y)
              ) {
                case "left":
                  c = o.x;
                  break;
                case "right":
                  c = o.x + o.width - v;
                  break;
                default:
                  c = S - v / 2;
              }
              (u = this._buildItem(
                t,
                r[l]._index,
                e ? e.getColor(a) : this.zr.getColor(r[l]._index),
                c,
                x,
                v,
                p,
                _,
                y
              )),
                (x += _ + m),
                (g = u.style.pointList),
                z.unshift([g[0][0] - 10, g[0][1]]),
                z.push([g[1][0] + 10, g[1][1]]),
                0 === l &&
                  (0 === v
                    ? ((g = z.pop()),
                      "center" == y && (z[0][0] += 10),
                      "right" == y && (z[0][0] = g[0]),
                      (z[0][1] -= "center" == y ? 10 : 15),
                      1 == d && (g = u.style.pointList))
                    : ((z[z.length - 1][1] -= 5), (z[0][1] -= 5))),
                (v = p);
            }
          f &&
            (z.unshift([g[3][0] - 10, g[3][1]]),
            z.push([g[2][0] + 10, g[2][1]]),
            0 === v
              ? ((g = z.pop()),
                "center" == y && (z[0][0] += 10),
                "right" == y && (z[0][0] = g[0]),
                (z[0][1] += "center" == y ? 10 : 15))
              : ((z[z.length - 1][1] += 5), (z[0][1] += 5)),
            (f.style.pointList = z));
        }
      },
      _buildFunnelCase: function (t) {
        var e = this.series[t];
        if (this.deepQuery([e, this.option], "calculable")) {
          var i = this._paramsMap[t].location,
            s = 10,
            o = {
              hoverable: !1,
              style: {
                pointListd: [
                  [i.x - s, i.y - s],
                  [i.x + i.width + s, i.y - s],
                  [i.x + i.width + s, i.y + i.height + s],
                  [i.x - s, i.y + i.height + s],
                ],
                brushType: "stroke",
                lineWidth: 1,
                strokeColor:
                  e.calculableHolderColor ||
                  this.ecTheme.calculableHolderColor ||
                  n.calculableHolderColor,
              },
            };
          return (
            r.pack(o, e, t, void 0, -1),
            this.setCalculable(o),
            (o = new a(o)),
            this.shapeList.push(o),
            o
          );
        }
      },
      _getLocation: function (t) {
        var e = this.series[t],
          i = this.zr.getWidth(),
          s = this.zr.getHeight(),
          o = this.parsePercent(e.x, i),
          a = this.parsePercent(e.y, s),
          n =
            null == e.width
              ? i - o - this.parsePercent(e.x2, i)
              : this.parsePercent(e.width, i);
        return {
          x: o,
          y: a,
          width: n,
          height:
            null == e.height
              ? s - a - this.parsePercent(e.y2, s)
              : this.parsePercent(e.height, s),
          centerX: o + n / 2,
        };
      },
      _mapData: function (t) {
        function e(t, e) {
          return "-" === t.value ? 1 : "-" === e.value ? -1 : e.value - t.value;
        }
        function i(t, i) {
          return -e(t, i);
        }
        for (
          var s = this.series[t], o = l.clone(s.data), a = 0, n = o.length;
          n > a;
          a++
        )
          o[a]._index = a;
        return "none" != s.sort && o.sort("descending" === s.sort ? e : i), o;
      },
      _buildItem: function (t, e, i, s, o, a, n, h, l) {
        var d = this.series,
          p = d[t],
          c = p.data[e],
          u = this.getPolygon(t, e, i, s, o, a, n, h, l);
        r.pack(u, d[t], t, d[t].data[e], e, d[t].data[e].name),
          this.shapeList.push(u);
        var g = this.getLabel(t, e, i, s, o, a, n, h, l);
        r.pack(g, d[t], t, d[t].data[e], e, d[t].data[e].name),
          this.shapeList.push(g),
          this._needLabel(p, c, !1) || (g.invisible = !0);
        var f = this.getLabelLine(t, e, i, s, o, a, n, h, l);
        this.shapeList.push(f),
          this._needLabelLine(p, c, !1) || (f.invisible = !0);
        var y = [],
          m = [];
        return (
          this._needLabelLine(p, c, !0) && (y.push(f.id), m.push(f.id)),
          this._needLabel(p, c, !0) && (y.push(g.id), m.push(u.id)),
          (u.hoverConnect = y),
          (g.hoverConnect = m),
          u
        );
      },
      _getItemWidth: function (t, e) {
        var i = this.series[t],
          s = this._paramsMap[t].location,
          o = i.min,
          a = i.max,
          n = h.parsePercent(i.minSize, s.width),
          r = h.parsePercent(i.maxSize, s.width);
        return (e * (r - n)) / (a - o);
      },
      getPolygon: function (t, e, i, s, o, n, r, h, l) {
        var p,
          c = this.series[t],
          u = c.data[e],
          g = [u, c],
          f = this.deepMerge(g, "itemStyle.normal") || {},
          y = this.deepMerge(g, "itemStyle.emphasis") || {},
          m = this.getItemStyleColor(f.color, t, e, u) || i,
          _ =
            this.getItemStyleColor(y.color, t, e, u) ||
            ("string" == typeof m ? d.lift(m, -0.2) : m);
        switch (l) {
          case "left":
            p = s;
            break;
          case "right":
            p = s + (n - r);
            break;
          default:
            p = s + (n - r) / 2;
        }
        var x = {
          zlevel: this.getZlevelBase(),
          z: this.getZBase(),
          clickable: this.deepQuery(g, "clickable"),
          style: {
            pointList: [
              [s, o],
              [s + n, o],
              [p + r, o + h],
              [p, o + h],
            ],
            brushType: "both",
            color: m,
            lineWidth: f.borderWidth,
            strokeColor: f.borderColor,
          },
          highlightStyle: {
            color: _,
            lineWidth: y.borderWidth,
            strokeColor: y.borderColor,
          },
        };
        return (
          this.deepQuery([u, c, this.option], "calculable") &&
            (this.setCalculable(x), (x.draggable = !0)),
          new a(x)
        );
      },
      getLabel: function (t, e, i, o, a, n, r, h, c) {
        var u,
          g = this.series[t],
          f = g.data[e],
          y = this._paramsMap[t].location,
          m = l.merge(l.clone(f.itemStyle) || {}, g.itemStyle),
          _ = "normal",
          x = m[_].label,
          v = x.textStyle || {},
          b = m[_].labelLine.length,
          S = this.getLabelText(t, e, _),
          z = this.getFont(v),
          T = i;
        (x.position = x.position || m.normal.label.position),
          "inner" === x.position ||
          "inside" === x.position ||
          "center" === x.position
            ? ((u = c),
              (T =
                Math.max(n, r) / 2 > p.getTextWidth(S, z)
                  ? "#fff"
                  : d.reverse(i)))
            : (u = "left" === x.position ? "right" : "left");
        var L = {
          zlevel: this.getZlevelBase(),
          z: this.getZBase() + 1,
          style: {
            x: this._getLabelPoint(x.position, o, y, n, r, b, c),
            y: a + h / 2,
            color: v.color || T,
            text: S,
            textAlign: v.align || u,
            textBaseline: v.baseline || "middle",
            textFont: z,
          },
        };
        return (
          (_ = "emphasis"),
          (x = m[_].label || x),
          (v = x.textStyle || v),
          (b = m[_].labelLine.length || b),
          (x.position = x.position || m.normal.label.position),
          (S = this.getLabelText(t, e, _)),
          (z = this.getFont(v)),
          (T = i),
          "inner" === x.position ||
          "inside" === x.position ||
          "center" === x.position
            ? ((u = c),
              (T =
                Math.max(n, r) / 2 > p.getTextWidth(S, z)
                  ? "#fff"
                  : d.reverse(i)))
            : (u = "left" === x.position ? "right" : "left"),
          (L.highlightStyle = {
            x: this._getLabelPoint(x.position, o, y, n, r, b, c),
            color: v.color || T,
            text: S,
            textAlign: v.align || u,
            textFont: z,
            brushType: "fill",
          }),
          new s(L)
        );
      },
      getLabelText: function (t, e, i) {
        var s = this.series,
          o = s[t],
          a = o.data[e],
          n = this.deepQuery([a, o], "itemStyle." + i + ".label.formatter");
        return n
          ? "function" == typeof n
            ? n.call(this.myChart, {
                seriesIndex: t,
                seriesName: o.name || "",
                series: o,
                dataIndex: e,
                data: a,
                name: a.name,
                value: a.value,
              })
            : "string" == typeof n
            ? (n = n
                .replace("{a}", "{a0}")
                .replace("{b}", "{b0}")
                .replace("{c}", "{c0}")
                .replace("{a0}", o.name)
                .replace("{b0}", a.name)
                .replace("{c0}", a.value))
            : void 0
          : a.name;
      },
      getLabelLine: function (t, e, i, s, a, n, r, h, d) {
        var p = this.series[t],
          c = p.data[e],
          u = this._paramsMap[t].location,
          g = l.merge(l.clone(c.itemStyle) || {}, p.itemStyle),
          f = "normal",
          y = g[f].labelLine,
          m = g[f].labelLine.length,
          _ = y.lineStyle || {},
          x = g[f].label;
        x.position = x.position || g.normal.label.position;
        var v = {
          zlevel: this.getZlevelBase(),
          z: this.getZBase() + 1,
          hoverable: !1,
          style: {
            xStart: this._getLabelLineStartPoint(s, u, n, r, d),
            yStart: a + h / 2,
            xEnd: this._getLabelPoint(x.position, s, u, n, r, m, d),
            yEnd: a + h / 2,
            strokeColor: _.color || i,
            lineType: _.type,
            lineWidth: _.width,
          },
        };
        return (
          (f = "emphasis"),
          (y = g[f].labelLine || y),
          (m = g[f].labelLine.length || m),
          (_ = y.lineStyle || _),
          (x = g[f].label || x),
          (x.position = x.position),
          (v.highlightStyle = {
            xEnd: this._getLabelPoint(x.position, s, u, n, r, m, d),
            strokeColor: _.color || i,
            lineType: _.type,
            lineWidth: _.width,
          }),
          new o(v)
        );
      },
      _getLabelPoint: function (t, e, i, s, o, a, n) {
        switch ((t = "inner" === t || "inside" === t ? "center" : t)) {
          case "center":
            return "center" == n
              ? e + s / 2
              : "left" == n
              ? e + 10
              : e + s - 10;
          case "left":
            return "auto" === a
              ? i.x - 10
              : "center" == n
              ? i.centerX - Math.max(s, o) / 2 - a
              : "right" == n
              ? e - (o > s ? o - s : 0) - a
              : i.x - a;
          default:
            return "auto" === a
              ? i.x + i.width + 10
              : "center" == n
              ? i.centerX + Math.max(s, o) / 2 + a
              : "right" == n
              ? i.x + i.width + a
              : e + Math.max(s, o) + a;
        }
      },
      _getLabelLineStartPoint: function (t, e, i, s, o) {
        return "center" == o
          ? e.centerX
          : s > i
          ? t + Math.min(i, s) / 2
          : t + Math.max(i, s) / 2;
      },
      _needLabel: function (t, e, i) {
        return this.deepQuery(
          [e, t],
          "itemStyle." + (i ? "emphasis" : "normal") + ".label.show"
        );
      },
      _needLabelLine: function (t, e, i) {
        return this.deepQuery(
          [e, t],
          "itemStyle." + (i ? "emphasis" : "normal") + ".labelLine.show"
        );
      },
      refresh: function (t) {
        t && ((this.option = t), (this.series = t.series)),
          this.backupShapeList(),
          this._buildShape();
      },
    }),
    l.inherits(e, i),
    t("../chart").define("funnel", e),
    e
  );
});
