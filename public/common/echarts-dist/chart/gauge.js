define("echarts/chart/gauge", [
  "require",
  "./base",
  "../util/shape/GaugePointer",
  "zrender/shape/Text",
  "zrender/shape/Line",
  "zrender/shape/Rectangle",
  "zrender/shape/Circle",
  "zrender/shape/Sector",
  "../config",
  "../util/ecData",
  "../util/accMath",
  "zrender/tool/util",
  "../chart",
], function (t) {
  function e(t, e, s, o, a) {
    i.call(this, t, e, s, o, a), this.refresh(o);
  }
  var i = t("./base"),
    s = t("../util/shape/GaugePointer"),
    o = t("zrender/shape/Text"),
    a = t("zrender/shape/Line"),
    n = t("zrender/shape/Rectangle"),
    r = t("zrender/shape/Circle"),
    h = t("zrender/shape/Sector"),
    l = t("../config");
  l.gauge = {
    zlevel: 0,
    z: 2,
    center: ["50%", "50%"],
    clickable: !0,
    legendHoverLink: !0,
    radius: "80%",
    startAngle: 225,
    endAngle: -45,
    min: 0,
    max: 100,
    precision: 0,
    splitNumber: 10,
    axisLine: {
      show: !0,
      lineStyle: {
        color: [
          [0.2, "#228b22"],
          [0.8, "#48b"],
          [1, "#ff4500"],
        ],
        width: 20,
      },
    },
    axisTick: {
      show: !0,
      splitNumber: 5,
      length: 8,
      lineStyle: { color: "#eee", width: 1, type: "solid" },
    },
    axisLabel: { show: !0, textStyle: { color: "auto" } },
    splitLine: {
      show: !0,
      length: 20,
      lineStyle: { color: "#eee", width: 2, type: "solid" },
    },
    pointer: { show: !0, length: "80%", width: 8, color: "auto" },
    title: {
      show: !0,
      offsetCenter: [0, "-35%"],
      textStyle: { color: "#333", fontSize: 15 },
    },
    detail: {
      show: !0,
      backgroundColor: "rgba(0,0,0,0)",
      borderWidth: 0,
      borderColor: "#ccc",
      width: 100,
      height: 40,
      offsetCenter: [0, "50%"],
      textStyle: { color: "auto", fontSize: 30 },
    },
  };
  var d = t("../util/ecData"),
    p = t("../util/accMath"),
    c = t("zrender/tool/util");
  return (
    (e.prototype = {
      type: l.CHART_TYPE_GAUGE,
      _buildShape: function () {
        var t = this.series;
        this._paramsMap = {};
        for (var e = 0, i = t.length; i > e; e++)
          t[e].type === l.CHART_TYPE_GAUGE &&
            ((t[e] = this.reformOption(t[e])),
            (this.legendHoverLink =
              t[e].legendHoverLink || this.legendHoverLink),
            this._buildSingleGauge(e),
            this.buildMark(e));
        this.addShapeList();
      },
      _buildSingleGauge: function (t) {
        var e = this.series[t];
        (this._paramsMap[t] = {
          center: this.parseCenter(this.zr, e.center),
          radius: this.parseRadius(this.zr, e.radius),
          startAngle: e.startAngle.toFixed(2) - 0,
          endAngle: e.endAngle.toFixed(2) - 0,
        }),
          (this._paramsMap[t].totalAngle =
            this._paramsMap[t].startAngle - this._paramsMap[t].endAngle),
          this._colorMap(t),
          this._buildAxisLine(t),
          this._buildSplitLine(t),
          this._buildAxisTick(t),
          this._buildAxisLabel(t),
          this._buildPointer(t),
          this._buildTitle(t),
          this._buildDetail(t);
      },
      _buildAxisLine: function (t) {
        var e = this.series[t];
        if (e.axisLine.show)
          for (
            var i,
              s,
              o = e.min,
              a = e.max - o,
              n = this._paramsMap[t],
              r = n.center,
              h = n.startAngle,
              l = n.totalAngle,
              p = n.colorArray,
              c = e.axisLine.lineStyle,
              u = this.parsePercent(c.width, n.radius[1]),
              g = n.radius[1],
              f = g - u,
              y = h,
              m = 0,
              _ = p.length;
            _ > m;
            m++
          )
            (s = h - (l * (p[m][0] - o)) / a),
              (i = this._getSector(r, f, g, s, y, p[m][1], c)),
              (y = s),
              (i._animationAdd = "r"),
              d.set(i, "seriesIndex", t),
              d.set(i, "dataIndex", m),
              this.shapeList.push(i);
      },
      _buildSplitLine: function (t) {
        var e = this.series[t];
        if (e.splitLine.show)
          for (
            var i,
              s,
              o,
              n = this._paramsMap[t],
              r = e.splitNumber,
              h = e.min,
              l = e.max - h,
              d = e.splitLine,
              p = this.parsePercent(d.length, n.radius[1]),
              c = d.lineStyle,
              u = c.color,
              g = n.center,
              f = (n.startAngle * Math.PI) / 180,
              y = (n.totalAngle * Math.PI) / 180,
              m = n.radius[1],
              _ = m - p,
              x = 0;
            r >= x;
            x++
          )
            (i = f - (y / r) * x),
              (s = Math.sin(i)),
              (o = Math.cos(i)),
              this.shapeList.push(
                new a({
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase() + 1,
                  hoverable: !1,
                  style: {
                    xStart: g[0] + o * m,
                    yStart: g[1] - s * m,
                    xEnd: g[0] + o * _,
                    yEnd: g[1] - s * _,
                    strokeColor:
                      "auto" === u ? this._getColor(t, h + (l / r) * x) : u,
                    lineType: c.type,
                    lineWidth: c.width,
                    shadowColor: c.shadowColor,
                    shadowBlur: c.shadowBlur,
                    shadowOffsetX: c.shadowOffsetX,
                    shadowOffsetY: c.shadowOffsetY,
                  },
                })
              );
      },
      _buildAxisTick: function (t) {
        var e = this.series[t];
        if (e.axisTick.show)
          for (
            var i,
              s,
              o,
              n = this._paramsMap[t],
              r = e.splitNumber,
              h = e.min,
              l = e.max - h,
              d = e.axisTick,
              p = d.splitNumber,
              c = this.parsePercent(d.length, n.radius[1]),
              u = d.lineStyle,
              g = u.color,
              f = n.center,
              y = (n.startAngle * Math.PI) / 180,
              m = (n.totalAngle * Math.PI) / 180,
              _ = n.radius[1],
              x = _ - c,
              v = 0,
              b = r * p;
            b >= v;
            v++
          )
            v % p !== 0 &&
              ((i = y - (m / b) * v),
              (s = Math.sin(i)),
              (o = Math.cos(i)),
              this.shapeList.push(
                new a({
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase() + 1,
                  hoverable: !1,
                  style: {
                    xStart: f[0] + o * _,
                    yStart: f[1] - s * _,
                    xEnd: f[0] + o * x,
                    yEnd: f[1] - s * x,
                    strokeColor:
                      "auto" === g ? this._getColor(t, h + (l / b) * v) : g,
                    lineType: u.type,
                    lineWidth: u.width,
                    shadowColor: u.shadowColor,
                    shadowBlur: u.shadowBlur,
                    shadowOffsetX: u.shadowOffsetX,
                    shadowOffsetY: u.shadowOffsetY,
                  },
                })
              ));
      },
      _buildAxisLabel: function (t) {
        var e = this.series[t];
        if (e.axisLabel.show)
          for (
            var i,
              s,
              a,
              n,
              r = e.splitNumber,
              h = e.min,
              l = e.max - h,
              d = e.axisLabel.textStyle,
              c = this.getFont(d),
              u = d.color,
              g = this._paramsMap[t],
              f = g.center,
              y = g.startAngle,
              m = g.totalAngle,
              _ =
                g.radius[1] -
                this.parsePercent(e.splitLine.length, g.radius[1]) -
                5,
              x = 0;
            r >= x;
            x++
          )
            (n = p.accAdd(h, p.accMul(p.accDiv(l, r), x))),
              (i = y - (m / r) * x),
              (s = Math.sin((i * Math.PI) / 180)),
              (a = Math.cos((i * Math.PI) / 180)),
              (i = (i + 360) % 360),
              this.shapeList.push(
                new o({
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase() + 1,
                  hoverable: !1,
                  style: {
                    x: f[0] + a * _,
                    y: f[1] - s * _,
                    color: "auto" === u ? this._getColor(t, n) : u,
                    text: this._getLabelText(e.axisLabel.formatter, n),
                    textAlign:
                      i >= 110 && 250 >= i
                        ? "left"
                        : 70 >= i || i >= 290
                        ? "right"
                        : "center",
                    textBaseline:
                      i >= 10 && 170 >= i
                        ? "top"
                        : i >= 190 && 350 >= i
                        ? "bottom"
                        : "middle",
                    textFont: c,
                    shadowColor: d.shadowColor,
                    shadowBlur: d.shadowBlur,
                    shadowOffsetX: d.shadowOffsetX,
                    shadowOffsetY: d.shadowOffsetY,
                  },
                })
              );
      },
      _buildPointer: function (t) {
        var e = this.series[t];
        if (e.pointer.show) {
          var i = e.max - e.min,
            o = e.pointer,
            a = this._paramsMap[t],
            n = this.parsePercent(o.length, a.radius[1]),
            h = this.parsePercent(o.width, a.radius[1]),
            l = a.center,
            p = this._getValue(t);
          p = p < e.max ? p : e.max;
          var c =
              ((a.startAngle - (a.totalAngle / i) * (p - e.min)) * Math.PI) /
              180,
            u = "auto" === o.color ? this._getColor(t, p) : o.color,
            g = new s({
              zlevel: this.getZlevelBase(),
              z: this.getZBase() + 1,
              clickable: this.query(e, "clickable"),
              style: {
                x: l[0],
                y: l[1],
                r: n,
                startAngle: (a.startAngle * Math.PI) / 180,
                angle: c,
                color: u,
                width: h,
                shadowColor: o.shadowColor,
                shadowBlur: o.shadowBlur,
                shadowOffsetX: o.shadowOffsetX,
                shadowOffsetY: o.shadowOffsetY,
              },
              highlightStyle: {
                brushType: "fill",
                width: h > 2 ? 2 : h / 2,
                color: "#fff",
              },
            });
          d.pack(
            g,
            this.series[t],
            t,
            this.series[t].data[0],
            0,
            this.series[t].data[0].name,
            p
          ),
            this.shapeList.push(g),
            this.shapeList.push(
              new r({
                zlevel: this.getZlevelBase(),
                z: this.getZBase() + 2,
                hoverable: !1,
                style: { x: l[0], y: l[1], r: o.width / 2.5, color: "#fff" },
              })
            );
        }
      },
      _buildTitle: function (t) {
        var e = this.series[t];
        if (e.title.show) {
          var i = e.data[0],
            s = null != i.name ? i.name : "";
          if ("" !== s) {
            var a = e.title,
              n = a.offsetCenter,
              r = a.textStyle,
              h = r.color,
              l = this._paramsMap[t],
              d = l.center[0] + this.parsePercent(n[0], l.radius[1]),
              p = l.center[1] + this.parsePercent(n[1], l.radius[1]);
            this.shapeList.push(
              new o({
                zlevel: this.getZlevelBase(),
                z:
                  this.getZBase() +
                  (Math.abs(d - l.center[0]) + Math.abs(p - l.center[1]) <
                  2 * r.fontSize
                    ? 2
                    : 1),
                hoverable: !1,
                style: {
                  x: d,
                  y: p,
                  color: "auto" === h ? this._getColor(t) : h,
                  text: s,
                  textAlign: "center",
                  textFont: this.getFont(r),
                  shadowColor: r.shadowColor,
                  shadowBlur: r.shadowBlur,
                  shadowOffsetX: r.shadowOffsetX,
                  shadowOffsetY: r.shadowOffsetY,
                },
              })
            );
          }
        }
      },
      _buildDetail: function (t) {
        var e = this.series[t];
        if (e.detail.show) {
          var i = e.detail,
            s = i.offsetCenter,
            o = i.backgroundColor,
            a = i.textStyle,
            r = a.color,
            h = this._paramsMap[t],
            l = this._getValue(t),
            d =
              h.center[0] - i.width / 2 + this.parsePercent(s[0], h.radius[1]),
            p = h.center[1] + this.parsePercent(s[1], h.radius[1]);
          this.shapeList.push(
            new n({
              zlevel: this.getZlevelBase(),
              z:
                this.getZBase() +
                (Math.abs(d + i.width / 2 - h.center[0]) +
                  Math.abs(p + i.height / 2 - h.center[1]) <
                a.fontSize
                  ? 2
                  : 1),
              hoverable: !1,
              style: {
                x: d,
                y: p,
                width: i.width,
                height: i.height,
                brushType: "both",
                color: "auto" === o ? this._getColor(t, l) : o,
                lineWidth: i.borderWidth,
                strokeColor: i.borderColor,
                shadowColor: i.shadowColor,
                shadowBlur: i.shadowBlur,
                shadowOffsetX: i.shadowOffsetX,
                shadowOffsetY: i.shadowOffsetY,
                text: this._getLabelText(i.formatter, l),
                textFont: this.getFont(a),
                textPosition: "inside",
                textColor: "auto" === r ? this._getColor(t, l) : r,
              },
            })
          );
        }
      },
      _getValue: function (t) {
        return this.getDataFromOption(this.series[t].data[0]);
      },
      _colorMap: function (t) {
        var e = this.series[t],
          i = e.min,
          s = e.max - i,
          o = e.axisLine.lineStyle.color;
        o instanceof Array || (o = [[1, o]]);
        for (var a = [], n = 0, r = o.length; r > n; n++)
          a.push([o[n][0] * s + i, o[n][1]]);
        this._paramsMap[t].colorArray = a;
      },
      _getColor: function (t, e) {
        null == e && (e = this._getValue(t));
        for (
          var i = this._paramsMap[t].colorArray, s = 0, o = i.length;
          o > s;
          s++
        )
          if (i[s][0] >= e) return i[s][1];
        return i[i.length - 1][1];
      },
      _getSector: function (t, e, i, s, o, a, n) {
        return new h({
          zlevel: this.getZlevelBase(),
          z: this.getZBase(),
          hoverable: !1,
          style: {
            x: t[0],
            y: t[1],
            r0: e,
            r: i,
            startAngle: s,
            endAngle: o,
            brushType: "fill",
            color: a,
            shadowColor: n.shadowColor,
            shadowBlur: n.shadowBlur,
            shadowOffsetX: n.shadowOffsetX,
            shadowOffsetY: n.shadowOffsetY,
          },
        });
      },
      _getLabelText: function (t, e) {
        if (t) {
          if ("function" == typeof t) return t.call(this.myChart, e);
          if ("string" == typeof t) return t.replace("{value}", e);
        }
        return e;
      },
      refresh: function (t) {
        t && ((this.option = t), (this.series = t.series)),
          this.backupShapeList(),
          this._buildShape();
      },
    }),
    c.inherits(e, i),
    t("../chart").define("gauge", e),
    e
  );
}),
  define("echarts/util/shape/GaugePointer", [
    "require",
    "zrender/shape/Base",
    "zrender/tool/util",
    "./normalIsCover",
  ], function (t) {
    function e(t) {
      i.call(this, t);
    }
    var i = t("zrender/shape/Base"),
      s = t("zrender/tool/util");
    return (
      (e.prototype = {
        type: "gauge-pointer",
        buildPath: function (t, e) {
          var i = e.r,
            s = e.width,
            o = e.angle,
            a = e.x - Math.cos(o) * s * (s >= i / 3 ? 1 : 2),
            n = e.y + Math.sin(o) * s * (s >= i / 3 ? 1 : 2);
          (o = e.angle - Math.PI / 2),
            t.moveTo(a, n),
            t.lineTo(e.x + Math.cos(o) * s, e.y - Math.sin(o) * s),
            t.lineTo(e.x + Math.cos(e.angle) * i, e.y - Math.sin(e.angle) * i),
            t.lineTo(e.x - Math.cos(o) * s, e.y + Math.sin(o) * s),
            t.lineTo(a, n);
        },
        getRect: function (t) {
          if (t.__rect) return t.__rect;
          var e = 2 * t.width,
            i = t.x,
            s = t.y,
            o = i + Math.cos(t.angle) * t.r,
            a = s - Math.sin(t.angle) * t.r;
          return (
            (t.__rect = {
              x: Math.min(i, o) - e,
              y: Math.min(s, a) - e,
              width: Math.abs(i - o) + e,
              height: Math.abs(s - a) + e,
            }),
            t.__rect
          );
        },
        isCover: t("./normalIsCover"),
      }),
      s.inherits(e, i),
      e
    );
  });
