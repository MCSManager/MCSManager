define("echarts/chart/pie", [
  "require",
  "./base",
  "zrender/shape/Text",
  "zrender/shape/Ring",
  "zrender/shape/Circle",
  "zrender/shape/Sector",
  "zrender/shape/Polyline",
  "../config",
  "../util/ecData",
  "zrender/tool/util",
  "zrender/tool/math",
  "zrender/tool/color",
  "../chart",
], function (t) {
  function e(t, e, s, o, n) {
    i.call(this, t, e, s, o, n);
    var a = this;
    (a.shapeHandler.onmouseover = function (t) {
      var e = t.target,
        i = l.get(e, "seriesIndex"),
        s = l.get(e, "dataIndex"),
        o = l.get(e, "special"),
        n = [e.style.x, e.style.y],
        r = e.style.startAngle,
        h = e.style.endAngle,
        d = ((h + r) / 2 + 360) % 360,
        p = e.highlightStyle.color,
        c = a.getLabel(i, s, o, n, d, p, !0);
      c && a.zr.addHoverShape(c);
      var u = a.getLabelLine(i, s, n, e.style.r0, e.style.r, d, p, !0);
      u && a.zr.addHoverShape(u);
    }),
      this.refresh(o);
  }
  var i = t("./base"),
    s = t("zrender/shape/Text"),
    o = t("zrender/shape/Ring"),
    n = t("zrender/shape/Circle"),
    a = t("zrender/shape/Sector"),
    r = t("zrender/shape/Polyline"),
    h = t("../config");
  h.pie = {
    zlevel: 0,
    z: 2,
    clickable: !0,
    legendHoverLink: !0,
    center: ["50%", "50%"],
    radius: [0, "55%"],
    clockWise: !0,
    startAngle: 90,
    minAngle: 0,
    selectedOffset: 10,
    itemStyle: {
      normal: {
        borderColor: "rgba(0,0,0,0)",
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
        label: { show: !1 },
        labelLine: {
          show: !1,
          length: 10,
          lineStyle: { width: 1, type: "solid" },
        },
      },
    },
  };
  var l = t("../util/ecData"),
    d = t("zrender/tool/util"),
    p = t("zrender/tool/math"),
    c = t("zrender/tool/color");
  return (
    (e.prototype = {
      type: h.CHART_TYPE_PIE,
      _buildShape: function () {
        var t = this.series,
          e = this.component.legend;
        (this.selectedMap = {}), (this._selected = {});
        var i, s, a;
        this._selectedMode = !1;
        for (var r, d = 0, p = t.length; p > d; d++)
          if (t[d].type === h.CHART_TYPE_PIE) {
            if (
              ((t[d] = this.reformOption(t[d])),
              (this.legendHoverLink =
                t[d].legendHoverLink || this.legendHoverLink),
              (r = t[d].name || ""),
              (this.selectedMap[r] = e ? e.isSelected(r) : !0),
              !this.selectedMap[r])
            )
              continue;
            (i = this.parseCenter(this.zr, t[d].center)),
              (s = this.parseRadius(this.zr, t[d].radius)),
              (this._selectedMode = this._selectedMode || t[d].selectedMode),
              (this._selected[d] = []),
              this.deepQuery([t[d], this.option], "calculable") &&
                ((a = {
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    x: i[0],
                    y: i[1],
                    r0: s[0] <= 10 ? 0 : s[0] - 10,
                    r: s[1] + 10,
                    brushType: "stroke",
                    lineWidth: 1,
                    strokeColor:
                      t[d].calculableHolderColor ||
                      this.ecTheme.calculableHolderColor ||
                      h.calculableHolderColor,
                  },
                }),
                l.pack(a, t[d], d, void 0, -1),
                this.setCalculable(a),
                (a = s[0] <= 10 ? new n(a) : new o(a)),
                this.shapeList.push(a)),
              this._buildSinglePie(d),
              this.buildMark(d);
          }
        this.addShapeList();
      },
      _buildSinglePie: function (t) {
        for (
          var e,
            i = this.series,
            s = i[t],
            o = s.data,
            n = this.component.legend,
            a = 0,
            r = 0,
            h = 0,
            l = Number.NEGATIVE_INFINITY,
            d = [],
            p = 0,
            c = o.length;
          c > p;
          p++
        )
          (e = o[p].name),
            (this.selectedMap[e] = n ? n.isSelected(e) : !0),
            this.selectedMap[e] &&
              !isNaN(o[p].value) &&
              (0 !== +o[p].value ? a++ : r++,
              (h += +o[p].value),
              (l = Math.max(l, +o[p].value)));
        if (0 !== h) {
          for (
            var u,
              g,
              m,
              f,
              y,
              _,
              x = 100,
              v = s.clockWise,
              b = (s.startAngle.toFixed(2) - 0 + 360) % 360,
              S = s.minAngle || 0.01,
              z = 360 - S * a - 0.01 * r,
              T = s.roseType,
              p = 0,
              c = o.length;
            c > p;
            p++
          )
            if (((e = o[p].name), this.selectedMap[e] && !isNaN(o[p].value))) {
              if (
                ((g = n ? n.getColor(e) : this.zr.getColor(p)),
                (x = o[p].value / h),
                (u =
                  "area" != T
                    ? v
                      ? b - x * z - (0 !== x ? S : 0.01)
                      : x * z + b + (0 !== x ? S : 0.01)
                    : v
                    ? b - 360 / c
                    : 360 / c + b),
                (u = u.toFixed(2) - 0),
                (x = (100 * x).toFixed(2)),
                (m = this.parseCenter(this.zr, s.center)),
                (f = this.parseRadius(this.zr, s.radius)),
                (y = +f[0]),
                (_ = +f[1]),
                "radius" === T
                  ? (_ = (o[p].value / l) * (_ - y) * 0.8 + 0.2 * (_ - y) + y)
                  : "area" === T &&
                    (_ = Math.sqrt(o[p].value / l) * (_ - y) + y),
                v)
              ) {
                var L;
                (L = b), (b = u), (u = L);
              }
              this._buildItem(d, t, p, x, o[p].selected, m, y, _, b, u, g),
                v || (b = u);
            }
          this._autoLabelLayout(d, m, _);
          for (var p = 0, c = d.length; c > p; p++) this.shapeList.push(d[p]);
          d = null;
        }
      },
      _buildItem: function (t, e, i, s, o, n, a, r, h, d, p) {
        var c = this.series,
          u = ((d + h) / 2 + 360) % 360,
          g = this.getSector(e, i, s, o, n, a, r, h, d, p);
        l.pack(g, c[e], e, c[e].data[i], i, c[e].data[i].name, s), t.push(g);
        var m = this.getLabel(e, i, s, n, u, p, !1),
          f = this.getLabelLine(e, i, n, a, r, u, p, !1);
        f &&
          (l.pack(f, c[e], e, c[e].data[i], i, c[e].data[i].name, s),
          t.push(f)),
          m &&
            (l.pack(m, c[e], e, c[e].data[i], i, c[e].data[i].name, s),
            (m._labelLine = f),
            t.push(m));
      },
      getSector: function (t, e, i, s, o, n, r, h, l, d) {
        var u = this.series,
          g = u[t],
          m = g.data[e],
          f = [m, g],
          y = this.deepMerge(f, "itemStyle.normal") || {},
          _ = this.deepMerge(f, "itemStyle.emphasis") || {},
          x = this.getItemStyleColor(y.color, t, e, m) || d,
          v =
            this.getItemStyleColor(_.color, t, e, m) ||
            ("string" == typeof x ? c.lift(x, -0.2) : x),
          b = {
            zlevel: this.getZlevelBase(),
            z: this.getZBase(),
            clickable: this.deepQuery(f, "clickable"),
            style: {
              x: o[0],
              y: o[1],
              r0: n,
              r: r,
              startAngle: h,
              endAngle: l,
              brushType: "both",
              color: x,
              lineWidth: y.borderWidth,
              strokeColor: y.borderColor,
              lineJoin: "round",
            },
            highlightStyle: {
              color: v,
              lineWidth: _.borderWidth,
              strokeColor: _.borderColor,
              lineJoin: "round",
            },
            _seriesIndex: t,
            _dataIndex: e,
          };
        if (s) {
          var S = ((b.style.startAngle + b.style.endAngle) / 2).toFixed(2) - 0;
          (b.style._hasSelected = !0),
            (b.style._x = b.style.x),
            (b.style._y = b.style.y);
          var z = this.query(g, "selectedOffset");
          (b.style.x += p.cos(S, !0) * z),
            (b.style.y -= p.sin(S, !0) * z),
            (this._selected[t][e] = !0);
        } else this._selected[t][e] = !1;
        return (
          this._selectedMode && (b.onclick = this.shapeHandler.onclick),
          this.deepQuery([m, g, this.option], "calculable") &&
            (this.setCalculable(b), (b.draggable = !0)),
          (this._needLabel(g, m, !0) || this._needLabelLine(g, m, !0)) &&
            (b.onmouseover = this.shapeHandler.onmouseover),
          (b = new a(b))
        );
      },
      getLabel: function (t, e, i, o, n, a, r) {
        var h = this.series,
          l = h[t],
          c = l.data[e];
        if (this._needLabel(l, c, r)) {
          var u,
            g,
            m,
            f = r ? "emphasis" : "normal",
            y = d.merge(d.clone(c.itemStyle) || {}, l.itemStyle),
            _ = y[f].label,
            x = _.textStyle || {},
            v = o[0],
            b = o[1],
            S = this.parseRadius(this.zr, l.radius),
            z = "middle";
          (_.position = _.position || y.normal.label.position),
            "center" === _.position
              ? ((u = v), (g = b), (m = "center"))
              : "inner" === _.position || "inside" === _.position
              ? ((S = (S[0] + S[1]) * (_.distance || 0.5)),
                (u = Math.round(v + S * p.cos(n, !0))),
                (g = Math.round(b - S * p.sin(n, !0))),
                (a = "#fff"),
                (m = "center"))
              : ((S = S[1] - -y[f].labelLine.length),
                (u = Math.round(v + S * p.cos(n, !0))),
                (g = Math.round(b - S * p.sin(n, !0))),
                (m = n >= 90 && 270 >= n ? "right" : "left")),
            "center" != _.position &&
              "inner" != _.position &&
              "inside" != _.position &&
              (u += "left" === m ? 20 : -20),
            (c.__labelX = u - ("left" === m ? 5 : -5)),
            (c.__labelY = g);
          var T = new s({
            zlevel: this.getZlevelBase(),
            z: this.getZBase() + 1,
            hoverable: !1,
            style: {
              x: u,
              y: g,
              color: x.color || a,
              text: this.getLabelText(t, e, i, f),
              textAlign: x.align || m,
              textBaseline: x.baseline || z,
              textFont: this.getFont(x),
            },
            highlightStyle: { brushType: "fill" },
          });
          return (
            (T._radius = S),
            (T._labelPosition = _.position || "outer"),
            (T._rect = T.getRect(T.style)),
            (T._seriesIndex = t),
            (T._dataIndex = e),
            T
          );
        }
      },
      getLabelText: function (t, e, i, s) {
        var o = this.series,
          n = o[t],
          a = n.data[e],
          r = this.deepQuery([a, n], "itemStyle." + s + ".label.formatter");
        return r
          ? "function" == typeof r
            ? r.call(this.myChart, {
                seriesIndex: t,
                seriesName: n.name || "",
                series: n,
                dataIndex: e,
                data: a,
                name: a.name,
                value: a.value,
                percent: i,
              })
            : "string" == typeof r
            ? ((r = r
                .replace("{a}", "{a0}")
                .replace("{b}", "{b0}")
                .replace("{c}", "{c0}")
                .replace("{d}", "{d0}")),
              (r = r
                .replace("{a0}", n.name)
                .replace("{b0}", a.name)
                .replace("{c0}", a.value)
                .replace("{d0}", i)))
            : void 0
          : a.name;
      },
      getLabelLine: function (t, e, i, s, o, n, a, h) {
        var l = this.series,
          c = l[t],
          u = c.data[e];
        if (this._needLabelLine(c, u, h)) {
          var g = h ? "emphasis" : "normal",
            m = d.merge(d.clone(u.itemStyle) || {}, c.itemStyle),
            f = m[g].labelLine,
            y = f.lineStyle || {},
            _ = i[0],
            x = i[1],
            v = o,
            b = this.parseRadius(this.zr, c.radius)[1] - -f.length,
            S = p.cos(n, !0),
            z = p.sin(n, !0);
          return new r({
            zlevel: this.getZlevelBase(),
            z: this.getZBase() + 1,
            hoverable: !1,
            style: {
              pointList: [
                [_ + v * S, x - v * z],
                [_ + b * S, x - b * z],
                [u.__labelX, u.__labelY],
              ],
              strokeColor: y.color || a,
              lineType: y.type,
              lineWidth: y.width,
            },
            _seriesIndex: t,
            _dataIndex: e,
          });
        }
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
      _autoLabelLayout: function (t, e, i) {
        for (var s = [], o = [], n = 0, a = t.length; a > n; n++)
          ("outer" === t[n]._labelPosition ||
            "outside" === t[n]._labelPosition) &&
            ((t[n]._rect._y = t[n]._rect.y),
            t[n]._rect.x < e[0] ? s.push(t[n]) : o.push(t[n]));
        this._layoutCalculate(s, e, i, -1), this._layoutCalculate(o, e, i, 1);
      },
      _layoutCalculate: function (t, e, i, s) {
        function o(e, i, s) {
          for (var o = e; i > o; o++)
            if (
              ((t[o]._rect.y += s),
              (t[o].style.y += s),
              t[o]._labelLine &&
                ((t[o]._labelLine.style.pointList[1][1] += s),
                (t[o]._labelLine.style.pointList[2][1] += s)),
              o > e &&
                i > o + 1 &&
                t[o + 1]._rect.y > t[o]._rect.y + t[o]._rect.height)
            )
              return void n(o, s / 2);
          n(i - 1, s / 2);
        }
        function n(e, i) {
          for (
            var s = e;
            s >= 0 &&
            ((t[s]._rect.y -= i),
            (t[s].style.y -= i),
            t[s]._labelLine &&
              ((t[s]._labelLine.style.pointList[1][1] -= i),
              (t[s]._labelLine.style.pointList[2][1] -= i)),
            !(
              s > 0 && t[s]._rect.y > t[s - 1]._rect.y + t[s - 1]._rect.height
            ));
            s--
          );
        }
        function a(t, e, i, s, o) {
          for (
            var n,
              a,
              r,
              h = i[0],
              l = i[1],
              d = o > 0 ? (e ? Number.MAX_VALUE : 0) : e ? Number.MAX_VALUE : 0,
              p = 0,
              c = t.length;
            c > p;
            p++
          )
            (a = Math.abs(t[p]._rect.y - l)),
              (r = t[p]._radius - s),
              (n =
                s + r > a
                  ? Math.sqrt(
                      (s + r + 20) * (s + r + 20) -
                        Math.pow(t[p]._rect.y - l, 2)
                    )
                  : Math.abs(
                      t[p]._rect.x + (o > 0 ? 0 : t[p]._rect.width) - h
                    )),
              e && n >= d && (n = d - 10),
              !e && d >= n && (n = d + 10),
              (t[p]._rect.x = t[p].style.x = h + n * o),
              t[p]._labelLine &&
                ((t[p]._labelLine.style.pointList[2][0] = h + (n - 5) * o),
                (t[p]._labelLine.style.pointList[1][0] = h + (n - 20) * o)),
              (d = n);
        }
        t.sort(function (t, e) {
          return t._rect.y - e._rect.y;
        });
        for (var r, h = 0, l = t.length, d = [], p = [], c = 0; l > c; c++)
          (r = t[c]._rect.y - h),
            0 > r && o(c, l, -r, s),
            (h = t[c]._rect.y + t[c]._rect.height);
        this.zr.getHeight() - h < 0 && n(l - 1, h - this.zr.getHeight());
        for (var c = 0; l > c; c++)
          t[c]._rect.y >= e[1] ? p.push(t[c]) : d.push(t[c]);
        a(p, !0, e, i, s), a(d, !1, e, i, s);
      },
      reformOption: function (t) {
        var e = d.merge;
        return (
          (t = e(e(t || {}, d.clone(this.ecTheme.pie || {})), d.clone(h.pie))),
          (t.itemStyle.normal.label.textStyle = this.getTextStyle(
            t.itemStyle.normal.label.textStyle
          )),
          (t.itemStyle.emphasis.label.textStyle = this.getTextStyle(
            t.itemStyle.emphasis.label.textStyle
          )),
          t
        );
      },
      refresh: function (t) {
        t && ((this.option = t), (this.series = t.series)),
          this.backupShapeList(),
          this._buildShape();
      },
      addDataAnimation: function (t) {
        for (var e = this.series, i = {}, s = 0, o = t.length; o > s; s++)
          i[t[s][0]] = t[s];
        var n = {},
          a = {},
          r = {},
          l = this.shapeList;
        this.shapeList = [];
        for (var d, p, c, u = {}, s = 0, o = t.length; o > s; s++)
          (d = t[s][0]),
            (p = t[s][2]),
            (c = t[s][3]),
            e[d] &&
              e[d].type === h.CHART_TYPE_PIE &&
              (p
                ? (c || (n[d + "_" + e[d].data.length] = "delete"), (u[d] = 1))
                : c
                ? (u[d] = 0)
                : ((n[d + "_-1"] = "delete"), (u[d] = -1)),
              this._buildSinglePie(d));
        for (var g, m, s = 0, o = this.shapeList.length; o > s; s++)
          switch (
            ((d = this.shapeList[s]._seriesIndex),
            (g = this.shapeList[s]._dataIndex),
            (m = d + "_" + g),
            this.shapeList[s].type)
          ) {
            case "sector":
              n[m] = this.shapeList[s];
              break;
            case "text":
              a[m] = this.shapeList[s];
              break;
            case "polyline":
              r[m] = this.shapeList[s];
          }
        this.shapeList = [];
        for (var f, s = 0, o = l.length; o > s; s++)
          if (((d = l[s]._seriesIndex), i[d])) {
            if (
              ((g = l[s]._dataIndex + u[d]), (m = d + "_" + g), (f = n[m]), !f)
            )
              continue;
            if ("sector" === l[s].type)
              "delete" != f
                ? this.zr
                    .animate(l[s].id, "style")
                    .when(400, {
                      startAngle: f.style.startAngle,
                      endAngle: f.style.endAngle,
                    })
                    .start()
                : this.zr
                    .animate(l[s].id, "style")
                    .when(
                      400,
                      u[d] < 0
                        ? { startAngle: l[s].style.startAngle }
                        : { endAngle: l[s].style.endAngle }
                    )
                    .start();
            else if ("text" === l[s].type || "polyline" === l[s].type)
              if ("delete" === f) this.zr.delShape(l[s].id);
              else
                switch (l[s].type) {
                  case "text":
                    (f = a[m]),
                      this.zr
                        .animate(l[s].id, "style")
                        .when(400, { x: f.style.x, y: f.style.y })
                        .start();
                    break;
                  case "polyline":
                    (f = r[m]),
                      this.zr
                        .animate(l[s].id, "style")
                        .when(400, { pointList: f.style.pointList })
                        .start();
                }
          }
        this.shapeList = l;
      },
      onclick: function (t) {
        var e = this.series;
        if (this.isClick && t.target) {
          this.isClick = !1;
          for (
            var i,
              s = t.target,
              o = s.style,
              n = l.get(s, "seriesIndex"),
              a = l.get(s, "dataIndex"),
              r = 0,
              d = this.shapeList.length;
            d > r;
            r++
          )
            if (this.shapeList[r].id === s.id) {
              if (
                ((n = l.get(s, "seriesIndex")),
                (a = l.get(s, "dataIndex")),
                o._hasSelected)
              )
                (s.style.x = s.style._x),
                  (s.style.y = s.style._y),
                  (s.style._hasSelected = !1),
                  (this._selected[n][a] = !1);
              else {
                var c = ((o.startAngle + o.endAngle) / 2).toFixed(2) - 0;
                (s.style._hasSelected = !0),
                  (this._selected[n][a] = !0),
                  (s.style._x = s.style.x),
                  (s.style._y = s.style.y),
                  (i = this.query(e[n], "selectedOffset")),
                  (s.style.x += p.cos(c, !0) * i),
                  (s.style.y -= p.sin(c, !0) * i);
              }
              this.zr.modShape(s.id, s);
            } else
              this.shapeList[r].style._hasSelected &&
                "single" === this._selectedMode &&
                ((n = l.get(this.shapeList[r], "seriesIndex")),
                (a = l.get(this.shapeList[r], "dataIndex")),
                (this.shapeList[r].style.x = this.shapeList[r].style._x),
                (this.shapeList[r].style.y = this.shapeList[r].style._y),
                (this.shapeList[r].style._hasSelected = !1),
                (this._selected[n][a] = !1),
                this.zr.modShape(this.shapeList[r].id, this.shapeList[r]));
          this.messageCenter.dispatch(
            h.EVENT.PIE_SELECTED,
            t.event,
            { selected: this._selected, target: l.get(s, "name") },
            this.myChart
          ),
            this.zr.refreshNextFrame();
        }
      },
    }),
    d.inherits(e, i),
    t("../chart").define("pie", e),
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
  });
