define("echarts/chart/eventRiver", [
  "require",
  "./base",
  "../layout/eventRiver",
  "zrender/shape/Polygon",
  "../component/axis",
  "../component/grid",
  "../component/dataZoom",
  "../config",
  "../util/ecData",
  "../util/date",
  "zrender/tool/util",
  "zrender/tool/color",
  "../chart",
], function (t) {
  function e(t, e, s, o, a) {
    i.call(this, t, e, s, o, a);
    var n = this;
    (n._ondragend = function () {
      n.isDragend = !0;
    }),
      this.refresh(o);
  }
  var i = t("./base"),
    s = t("../layout/eventRiver"),
    o = t("zrender/shape/Polygon");
  t("../component/axis"), t("../component/grid"), t("../component/dataZoom");
  var a = t("../config");
  a.eventRiver = {
    zlevel: 0,
    z: 2,
    clickable: !0,
    legendHoverLink: !0,
    itemStyle: {
      normal: {
        borderColor: "rgba(0,0,0,0)",
        borderWidth: 1,
        label: { show: !0, position: "inside", formatter: "{b}" },
      },
      emphasis: {
        borderColor: "rgba(0,0,0,0)",
        borderWidth: 1,
        label: { show: !0 },
      },
    },
  };
  var n = t("../util/ecData"),
    r = t("../util/date"),
    h = t("zrender/tool/util"),
    l = t("zrender/tool/color");
  return (
    (e.prototype = {
      type: a.CHART_TYPE_EVENTRIVER,
      _buildShape: function () {
        var t = this.series;
        (this.selectedMap = {}), this._dataPreprocessing();
        for (var e = this.component.legend, i = [], o = 0; o < t.length; o++)
          if (t[o].type === this.type) {
            (t[o] = this.reformOption(t[o])),
              (this.legendHoverLink =
                t[o].legendHoverLink || this.legendHoverLink);
            var a = t[o].name || "";
            if (
              ((this.selectedMap[a] = e ? e.isSelected(a) : !0),
              !this.selectedMap[a])
            )
              continue;
            this.buildMark(o), i.push(this.series[o]);
          }
        s(i, this._intervalX, this.component.grid.getArea()),
          this._drawEventRiver(),
          this.addShapeList();
      },
      _dataPreprocessing: function () {
        for (var t, e, i = this.series, s = 0, o = i.length; o > s; s++)
          if (i[s].type === this.type) {
            t = this.component.xAxis.getAxis(i[s].xAxisIndex || 0);
            for (var a = 0, n = i[s].eventList.length; n > a; a++) {
              e = i[s].eventList[a].evolution;
              for (var h = 0, l = e.length; l > h; h++)
                (e[h].timeScale = t.getCoord(r.getNewDate(e[h].time) - 0)),
                  (e[h].valueScale = Math.pow(e[h].value, 0.8));
            }
          }
        this._intervalX = Math.round(this.component.grid.getWidth() / 40);
      },
      _drawEventRiver: function () {
        for (var t = this.series, e = 0; e < t.length; e++) {
          var i = t[e].name || "";
          if (t[e].type === this.type && this.selectedMap[i])
            for (var s = 0; s < t[e].eventList.length; s++)
              this._drawEventBubble(t[e].eventList[s], e, s);
        }
      },
      _drawEventBubble: function (t, e, i) {
        var s = this.series,
          a = s[e],
          r = a.name || "",
          h = a.eventList[i],
          d = [h, a],
          p = this.component.legend,
          c = p ? p.getColor(r) : this.zr.getColor(e),
          u = this.deepMerge(d, "itemStyle.normal") || {},
          g = this.deepMerge(d, "itemStyle.emphasis") || {},
          f = this.getItemStyleColor(u.color, e, i, h) || c,
          y =
            this.getItemStyleColor(g.color, e, i, h) ||
            ("string" == typeof f ? l.lift(f, -0.2) : f),
          m = this._calculateControlPoints(t),
          _ = {
            zlevel: this.getZlevelBase(),
            z: this.getZBase(),
            clickable: this.deepQuery(d, "clickable"),
            style: {
              pointList: m,
              smooth: "spline",
              brushType: "both",
              lineJoin: "round",
              color: f,
              lineWidth: u.borderWidth,
              strokeColor: u.borderColor,
            },
            highlightStyle: {
              color: y,
              lineWidth: g.borderWidth,
              strokeColor: g.borderColor,
            },
            draggable: "vertical",
            ondragend: this._ondragend,
          };
        (_ = new o(_)),
          this.addLabel(_, a, h, t.name),
          n.pack(_, s[e], e, s[e].eventList[i], i, s[e].eventList[i].name),
          this.shapeList.push(_);
      },
      _calculateControlPoints: function (t) {
        var e = this._intervalX,
          i = t.y,
          s = t.evolution,
          o = s.length;
        if (!(1 > o)) {
          for (var a = [], n = [], r = 0; o > r; r++)
            a.push(s[r].timeScale), n.push(s[r].valueScale);
          var h = [];
          h.push([a[0], i]);
          var r = 0;
          for (r = 0; o - 1 > r; r++)
            h.push([(a[r] + a[r + 1]) / 2, n[r] / -2 + i]);
          for (
            h.push([(a[r] + (a[r] + e)) / 2, n[r] / -2 + i]),
              h.push([a[r] + e, i]),
              h.push([(a[r] + (a[r] + e)) / 2, n[r] / 2 + i]),
              r = o - 1;
            r > 0;
            r--
          )
            h.push([(a[r] + a[r - 1]) / 2, n[r - 1] / 2 + i]);
          return h;
        }
      },
      ondragend: function (t, e) {
        this.isDragend &&
          t.target &&
          ((e.dragOut = !0),
          (e.dragIn = !0),
          (e.needRefresh = !1),
          (this.isDragend = !1));
      },
      refresh: function (t) {
        t && ((this.option = t), (this.series = t.series)),
          this.backupShapeList(),
          this._buildShape();
      },
    }),
    h.inherits(e, i),
    t("../chart").define("eventRiver", e),
    e
  );
}),
  define("echarts/layout/eventRiver", ["require"], function () {
    function t(t, a, n) {
      function r(t, e) {
        var i = t.importance,
          s = e.importance;
        return i > s ? -1 : s > i ? 1 : 0;
      }
      function h(t, e) {
        if (t.indexOf) return t.indexOf(e);
        for (var i = 0, s = t.length; s > i; i++) if (t[i] === e) return i;
        return -1;
      }
      for (var l = 5, d = a, p = 0; p < t.length; p++) {
        for (var c = 0; c < t[p].eventList.length; c++) {
          null == t[p].eventList[c].weight && (t[p].eventList[c].weight = 1);
          for (var u = 0, g = 0; g < t[p].eventList[c].evolution.length; g++)
            u += t[p].eventList[c].evolution[g].valueScale;
          t[p].eventList[c].importance = u * t[p].eventList[c].weight;
        }
        t[p].eventList.sort(r);
      }
      for (var p = 0; p < t.length; p++) {
        null == t[p].weight && (t[p].weight = 1);
        for (var u = 0, c = 0; c < t[p].eventList.length; c++)
          u += t[p].eventList[c].weight;
        t[p].importance = u * t[p].weight;
      }
      t.sort(r);
      for (var f = Number.MAX_VALUE, y = 0, p = 0; p < t.length; p++)
        for (var c = 0; c < t[p].eventList.length; c++)
          for (var g = 0; g < t[p].eventList[c].evolution.length; g++) {
            var m = t[p].eventList[c].evolution[g].timeScale;
            (f = Math.min(f, m)), (y = Math.max(y, m));
          }
      for (
        var _ = i(Math.floor(f), Math.ceil(y)), x = 0, p = 0;
        p < t.length;
        p++
      )
        for (var c = 0; c < t[p].eventList.length; c++) {
          var v = t[p].eventList[c];
          (v.time = []), (v.value = []);
          for (var g = 0; g < t[p].eventList[c].evolution.length; g++)
            v.time.push(t[p].eventList[c].evolution[g].timeScale),
              v.value.push(t[p].eventList[c].evolution[g].valueScale);
          var b = h(v.value, Math.max.apply(Math, v.value)),
            S = s(_, v.time[b], v.time[b + 1]),
            g = 0;
          for (
            v.y = S + v.value[b] / 2 + l, g = 0;
            g < v.time.length - 1;
            g++
          ) {
            var z = s(_, v.time[g], v.time[g + 1]);
            v.y - v.value[g] / 2 - l < z && (v.y = z + v.value[g] / 2 + l);
          }
          var z = s(_, v.time[g], v.time[g] + d);
          for (
            v.y - v.value[g] / 2 - l < z && (v.y = z + v.value[g] / 2 + l),
              t[p].y = v.y,
              x = Math.max(x, v.y + v.value[b] / 2),
              g = 0;
            g < v.time.length - 1;
            g++
          )
            o(_, v.time[g], v.time[g + 1], v.y + v.value[g] / 2);
          o(_, v.time[g], v.time[g] + d, v.y + v.value[g] / 2);
        }
      e(t, n, x, l);
    }
    function e(t, e, i, s) {
      for (var o = e.y, a = (e.height - s) / i, n = 0; n < t.length; n++) {
        t[n].y = t[n].y * a + o;
        for (var r = t[n].eventList, h = 0; h < r.length; h++) {
          r[h].y = r[h].y * a + o;
          for (var l = r[h].evolution, d = 0; d < l.length; d++)
            l[d].valueScale *= 1 * a;
        }
      }
    }
    function i(t, e) {
      var s = {
        left: t,
        right: e,
        leftChild: null,
        rightChild: null,
        maxValue: 0,
      };
      if (e > t + 1) {
        var o = Math.round((t + e) / 2);
        (s.leftChild = i(t, o)), (s.rightChild = i(o, e));
      }
      return s;
    }
    function s(t, e, i) {
      if (1 > i - e) return 0;
      var o = Math.round((t.left + t.right) / 2),
        a = 0;
      if (e == t.left && i == t.right) a = t.maxValue;
      else if (o >= i && null != t.leftChild) a = s(t.leftChild, e, i);
      else if (e >= o && null != t.rightChild) a = s(t.rightChild, e, i);
      else {
        var n = 0,
          r = 0;
        null != t.leftChild && (n = s(t.leftChild, e, o)),
          null != t.rightChild && (r = s(t.rightChild, o, i)),
          (a = n > r ? n : r);
      }
      return a;
    }
    function o(t, e, i, s) {
      if (null != t) {
        var a = Math.round((t.left + t.right) / 2);
        (t.maxValue = t.maxValue > s ? t.maxValue : s),
          (Math.floor(10 * e) != Math.floor(10 * t.left) ||
            Math.floor(10 * i) != Math.floor(10 * t.right)) &&
            (a >= i
              ? o(t.leftChild, e, i, s)
              : e >= a
              ? o(t.rightChild, e, i, s)
              : (o(t.leftChild, e, a, s), o(t.rightChild, a, i, s)));
      }
    }
    return t;
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
    function e(t, e, s, o, a, n) {
      i.call(this, t, e, s, o, a),
        (this.axisType = n),
        (this._axisList = []),
        this.refresh(o);
    }
    var i = t("./base"),
      s = t("zrender/shape/Line"),
      o = t("../config"),
      a = t("../util/ecData"),
      n = t("zrender/tool/util"),
      r = t("zrender/tool/color");
    return (
      (e.prototype = {
        type: o.COMPONENT_TYPE_AXIS,
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
              o = this.grid;
            switch (this.option.position) {
              case "left":
                i.style = {
                  xStart: o.getX() - e,
                  yStart: o.getYend(),
                  xEnd: o.getX() - e,
                  yEnd: o.getY(),
                  lineCap: "round",
                };
                break;
              case "right":
                i.style = {
                  xStart: o.getXend() + e,
                  yStart: o.getYend(),
                  xEnd: o.getXend() + e,
                  yEnd: o.getY(),
                  lineCap: "round",
                };
                break;
              case "bottom":
                i.style = {
                  xStart: o.getX(),
                  yStart: o.getYend() + e,
                  xEnd: o.getXend(),
                  yEnd: o.getYend() + e,
                  lineCap: "round",
                };
                break;
              case "top":
                i.style = {
                  xStart: o.getX(),
                  yStart: o.getY() - e,
                  xEnd: o.getXend(),
                  yEnd: o.getY() - e,
                  lineCap: "round",
                };
            }
            var a = i.style;
            "" !== this.option.name &&
              ((a.text = this.option.name),
              (a.textPosition = this.option.nameLocation),
              (a.textFont = this.getFont(this.option.nameTextStyle)),
              this.option.nameTextStyle.align &&
                (a.textAlign = this.option.nameTextStyle.align),
              this.option.nameTextStyle.baseline &&
                (a.textBaseline = this.option.nameTextStyle.baseline),
              this.option.nameTextStyle.color &&
                (a.textColor = this.option.nameTextStyle.color)),
              (a.strokeColor = this.option.axisLine.lineStyle.color),
              (a.lineWidth = t),
              this.isHorizontal()
                ? (a.yStart = a.yEnd = this.subPixelOptimize(a.yEnd, t))
                : (a.xStart = a.xEnd = this.subPixelOptimize(a.xEnd, t)),
              (a.lineType = this.option.axisLine.lineStyle.type),
              (i = new s(i)),
              this.shapeList.push(i);
          },
          _axisLabelClickable: function (t, e) {
            return t
              ? (a.pack(e, void 0, -1, void 0, -1, e.style.text),
                (e.hoverable = !0),
                (e.clickable = !0),
                (e.highlightStyle = {
                  color: r.lift(e.style.color, 1),
                  brushType: "fill",
                }),
                e)
              : e;
          },
          refixAxisShape: function (t, e) {
            if (this.option.axisLine.onZero) {
              var i;
              if (this.isHorizontal() && null != e)
                for (var s = 0, o = this.shapeList.length; o > s; s++)
                  "axisLine" === this.shapeList[s]._axisShape
                    ? ((this.shapeList[s].style.yStart = this.shapeList[
                        s
                      ].style.yEnd = this.subPixelOptimize(
                        e,
                        this.shapeList[s].stylelineWidth
                      )),
                      this.zr.modShape(this.shapeList[s].id))
                    : "axisTick" === this.shapeList[s]._axisShape &&
                      ((i =
                        this.shapeList[s].style.yEnd -
                        this.shapeList[s].style.yStart),
                      (this.shapeList[s].style.yStart = e - i),
                      (this.shapeList[s].style.yEnd = e),
                      this.zr.modShape(this.shapeList[s].id));
              if (!this.isHorizontal() && null != t)
                for (var s = 0, o = this.shapeList.length; o > s; s++)
                  "axisLine" === this.shapeList[s]._axisShape
                    ? ((this.shapeList[s].style.xStart = this.shapeList[
                        s
                      ].style.xEnd = this.subPixelOptimize(
                        t,
                        this.shapeList[s].stylelineWidth
                      )),
                      this.zr.modShape(this.shapeList[s].id))
                    : "axisTick" === this.shapeList[s]._axisShape &&
                      ((i =
                        this.shapeList[s].style.xEnd -
                        this.shapeList[s].style.xStart),
                      (this.shapeList[s].style.xStart = t),
                      (this.shapeList[s].style.xEnd = t + i),
                      this.zr.modShape(this.shapeList[s].id));
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
              ? (t = [{ type: o.COMPONENT_TYPE_AXIS_VALUE }])
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
            var s = t("./categoryAxis"),
              o = t("./valueAxis"),
              a = Math.max((i && i.length) || 0, this._axisList.length),
              n = 0;
            a > n;
            n++
          )
            !this._axisList[n] ||
              !e ||
              (i[n] && this._axisList[n].type == i[n].type) ||
              (this._axisList[n].dispose && this._axisList[n].dispose(),
              (this._axisList[n] = !1)),
              this._axisList[n]
                ? this._axisList[n].refresh &&
                  this._axisList[n].refresh(i ? i[n] : !1, this.series)
                : i &&
                  i[n] &&
                  (this._axisList[n] =
                    "category" === i[n].type
                      ? new s(
                          this.ecTheme,
                          this.messageCenter,
                          this.zr,
                          i[n],
                          this.myChart,
                          this.axisBase
                        )
                      : new o(
                          this.ecTheme,
                          this.messageCenter,
                          this.zr,
                          i[n],
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
      n.inherits(e, i),
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
    function e(t, e, s, o, a) {
      i.call(this, t, e, s, o, a), this.refresh(o);
    }
    var i = t("./base"),
      s = t("zrender/shape/Rectangle"),
      o = t("../config");
    o.grid = {
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
    var a = t("zrender/tool/util");
    return (
      (e.prototype = {
        type: o.COMPONENT_TYPE_GRID,
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
              s,
              a = t.xAxis._axisList.concat(t.yAxis ? t.yAxis._axisList : []),
              n = a.length;
            n--;

          )
            (s = a[n]),
              s.type == o.COMPONENT_TYPE_AXIS_VALUE &&
                s._min < 0 &&
                s._max >= 0 &&
                (s.isHorizontal() ? (e = s.getCoord(0)) : (i = s.getCoord(0)));
          if ("undefined" != typeof e || "undefined" != typeof i)
            for (n = a.length; n--; ) a[n].refixAxisShape(e, i);
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
              o = this.parsePercent(e.y2, this._zrHeight);
            (this._width =
              "undefined" == typeof e.width
                ? this._zrWidth - this._x - i
                : this.parsePercent(e.width, this._zrWidth)),
              (this._width = this._width <= 0 ? 10 : this._width),
              (this._height =
                "undefined" == typeof e.height
                  ? this._zrHeight - this._y - o
                  : this.parsePercent(e.height, this._zrHeight)),
              (this._height = this._height <= 0 ? 10 : this._height),
              (this._x = this.subPixelOptimize(this._x, e.borderWidth)),
              (this._y = this.subPixelOptimize(this._y, e.borderWidth)),
              this.shapeList.push(
                new s({
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
      a.inherits(e, i),
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
    function e(t, e, s, o, a) {
      i.call(this, t, e, s, o, a);
      var n = this;
      (n._ondrift = function (t, e) {
        return n.__ondrift(this, t, e);
      }),
        (n._ondragend = function () {
          return n.__ondragend();
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
      s = t("zrender/shape/Rectangle"),
      o = t("zrender/shape/Polygon"),
      a = t("../util/shape/Icon"),
      n = t("../config");
    n.dataZoom = {
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
    var r = t("../util/date"),
      h = t("zrender/tool/util");
    return (
      (e.prototype = {
        type: n.COMPONENT_TYPE_DATAZOOM,
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
            s,
            o = this.component.grid;
          return (
            "horizontal" == this.zoomOption.orient
              ? ((i = this.zoomOption.width || o.getWidth()),
                (s = this.zoomOption.height || this._fillerSize),
                (t = null != this.zoomOption.x ? this.zoomOption.x : o.getX()),
                (e =
                  null != this.zoomOption.y
                    ? this.zoomOption.y
                    : this.zr.getHeight() - s - 2))
              : ((i = this.zoomOption.width || this._fillerSize),
                (s = this.zoomOption.height || o.getHeight()),
                (t = null != this.zoomOption.x ? this.zoomOption.x : 2),
                (e = null != this.zoomOption.y ? this.zoomOption.y : o.getY())),
            { x: t, y: e, width: i, height: s }
          );
        },
        _getZoom: function () {
          var t = this.option.series,
            e = this.option.xAxis;
          !e || e instanceof Array || ((e = [e]), (this.option.xAxis = e));
          var i = this.option.yAxis;
          !i || i instanceof Array || ((i = [i]), (this.option.yAxis = i));
          var s,
            o,
            a = [],
            r = this.zoomOption.xAxisIndex;
          if (e && null == r) {
            s = [];
            for (var h = 0, l = e.length; l > h; h++)
              ("category" == e[h].type || null == e[h].type) && s.push(h);
          } else s = r instanceof Array ? r : null != r ? [r] : [];
          if (((r = this.zoomOption.yAxisIndex), i && null == r)) {
            o = [];
            for (var h = 0, l = i.length; l > h; h++)
              "category" == i[h].type && o.push(h);
          } else o = r instanceof Array ? r : null != r ? [r] : [];
          for (var d, h = 0, l = t.length; l > h; h++)
            if (
              ((d = t[h]),
              d.type == n.CHART_TYPE_LINE ||
                d.type == n.CHART_TYPE_BAR ||
                d.type == n.CHART_TYPE_SCATTER ||
                d.type == n.CHART_TYPE_K)
            ) {
              for (var p = 0, c = s.length; c > p; p++)
                if (s[p] == (d.xAxisIndex || 0)) {
                  a.push(h);
                  break;
                }
              for (var p = 0, c = o.length; c > p; p++)
                if (o[p] == (d.yAxisIndex || 0)) {
                  a.push(h);
                  break;
                }
              null == this.zoomOption.xAxisIndex &&
                null == this.zoomOption.yAxisIndex &&
                d.data &&
                this.getDataFromOption(d.data[0]) instanceof Array &&
                (d.type == n.CHART_TYPE_SCATTER ||
                  d.type == n.CHART_TYPE_LINE ||
                  d.type == n.CHART_TYPE_BAR) &&
                a.push(h);
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
            xAxisIndex: s,
            yAxisIndex: o,
            seriesIndex: a,
            scatterMap: this._zoom.scatterMap || {},
          };
        },
        _backupData: function () {
          this._originalData = { xAxis: {}, yAxis: {}, series: {} };
          for (
            var t = this.option.xAxis,
              e = this._zoom.xAxisIndex,
              i = 0,
              s = e.length;
            s > i;
            i++
          )
            this._originalData.xAxis[e[i]] = t[e[i]].data;
          for (
            var o = this.option.yAxis,
              a = this._zoom.yAxisIndex,
              i = 0,
              s = a.length;
            s > i;
            i++
          )
            this._originalData.yAxis[a[i]] = o[a[i]].data;
          for (
            var r,
              h = this.option.series,
              l = this._zoom.seriesIndex,
              i = 0,
              s = l.length;
            s > i;
            i++
          )
            (r = h[l[i]]),
              (this._originalData.series[l[i]] = r.data),
              r.data &&
                this.getDataFromOption(r.data[0]) instanceof Array &&
                (r.type == n.CHART_TYPE_SCATTER ||
                  r.type == n.CHART_TYPE_LINE ||
                  r.type == n.CHART_TYPE_BAR) &&
                (this._backupScale(), this._calculScatterMap(l[i]));
        },
        _calculScatterMap: function (e) {
          (this._zoom.scatterMap = this._zoom.scatterMap || {}),
            (this._zoom.scatterMap[e] = this._zoom.scatterMap[e] || {});
          var i = t("../component"),
            s = i.get("axis"),
            o = h.clone(this.option.xAxis);
          "category" == o[0].type && (o[0].type = "value"),
            o[1] && "category" == o[1].type && (o[1].type = "value");
          var a = new s(
              this.ecTheme,
              null,
              !1,
              { xAxis: o, series: this.option.series },
              this,
              "xAxis"
            ),
            n = this.option.series[e].xAxisIndex || 0;
          (this._zoom.scatterMap[e].x = a.getAxis(n).getExtremum()),
            a.dispose(),
            (o = h.clone(this.option.yAxis)),
            "category" == o[0].type && (o[0].type = "value"),
            o[1] && "category" == o[1].type && (o[1].type = "value"),
            (a = new s(
              this.ecTheme,
              null,
              !1,
              { yAxis: o, series: this.option.series },
              this,
              "yAxis"
            )),
            (n = this.option.series[e].yAxisIndex || 0),
            (this._zoom.scatterMap[e].y = a.getAxis(n).getExtremum()),
            a.dispose();
        },
        _buildBackground: function () {
          var t = this._location.width,
            e = this._location.height;
          this.shapeList.push(
            new s({
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
              a = this._originalData.xAxis,
              r = this._zoom.xAxisIndex,
              h = 0,
              l = r.length;
            l > h;
            h++
          )
            i = Math.max(i, a[r[h]].length);
          for (
            var d = this._originalData.yAxis,
              p = this._zoom.yAxisIndex,
              h = 0,
              l = p.length;
            l > h;
            h++
          )
            i = Math.max(i, d[p[h]].length);
          for (
            var c,
              u = this._zoom.seriesIndex[0],
              g = this._originalData.series[u],
              f = Number.MIN_VALUE,
              y = Number.MAX_VALUE,
              h = 0,
              l = g.length;
            l > h;
            h++
          )
            (c = this.getDataFromOption(g[h], 0)),
              this.option.series[u].type == n.CHART_TYPE_K && (c = c[1]),
              isNaN(c) && (c = 0),
              (f = Math.max(f, c)),
              (y = Math.min(y, c));
          var m = f - y,
            _ = [],
            x = t / (i - (i > 1 ? 1 : 0)),
            v = e / (i - (i > 1 ? 1 : 0)),
            b = 1;
          "horizontal" == this.zoomOption.orient && 1 > x
            ? (b = Math.floor((3 * i) / t))
            : "vertical" == this.zoomOption.orient &&
              1 > v &&
              (b = Math.floor((3 * i) / e));
          for (var h = 0, l = i; l > h; h += b)
            (c = this.getDataFromOption(g[h], 0)),
              this.option.series[u].type == n.CHART_TYPE_K && (c = c[1]),
              isNaN(c) && (c = 0),
              _.push(
                "horizontal" == this.zoomOption.orient
                  ? [
                      this._location.x + x * h,
                      this._location.y +
                        e -
                        1 -
                        Math.round(((c - y) / m) * (e - 10)),
                    ]
                  : [
                      this._location.x +
                        1 +
                        Math.round(((c - y) / m) * (t - 10)),
                      this._location.y + v * (l - h - 1),
                    ]
              );
          "horizontal" == this.zoomOption.orient
            ? (_.push([this._location.x + t, this._location.y + e]),
              _.push([this._location.x, this._location.y + e]))
            : (_.push([this._location.x, this._location.y]),
              _.push([this._location.x, this._location.y + e])),
            this.shapeList.push(
              new o({
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
            (this._fillerShae = new s(this._fillerShae)),
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
            (this._startShape = new a(this._startShape)),
            (this._endShape = new a(this._endShape)),
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
            (this._startFrameShape = new s(this._startFrameShape)),
            (this._endFrameShape = new s(this._endFrameShape)),
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
          var e, i, s, o, a;
          for (var r in this._originalData) {
            e = this._originalData[r];
            for (var h in e)
              (a = e[h]),
                null != a &&
                  ((o = a.length),
                  (i = Math.floor((this._zoom.start / 100) * o)),
                  (s = Math.ceil((this._zoom.end / 100) * o)),
                  this.getDataFromOption(a[0]) instanceof Array &&
                  this.option[r][h].type != n.CHART_TYPE_K
                    ? (this._setScale(),
                      (this.option[r][h].data = this._synScatterData(h, a)))
                    : (this.option[r][h].data = a.slice(i, s)));
          }
          this._isSilence ||
            (!this.zoomOption.realtime && !t) ||
            this.messageCenter.dispatch(
              n.EVENT.DATA_ZOOM,
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
            s,
            o,
            a,
            n,
            r = [],
            h = this._zoom.scatterMap[t];
          "horizontal" == this.zoomOption.orient
            ? ((i = h.x.max - h.x.min),
              (s = (this._zoom.start / 100) * i + h.x.min),
              (o = (this._zoom.end / 100) * i + h.x.min),
              (i = h.y.max - h.y.min),
              (a = (this._zoom.start2 / 100) * i + h.y.min),
              (n = (this._zoom.end2 / 100) * i + h.y.min))
            : ((i = h.x.max - h.x.min),
              (s = (this._zoom.start2 / 100) * i + h.x.min),
              (o = (this._zoom.end2 / 100) * i + h.x.min),
              (i = h.y.max - h.y.min),
              (a = (this._zoom.start / 100) * i + h.y.min),
              (n = (this._zoom.end / 100) * i + h.y.min));
          for (var l, d = 0, p = e.length; p > d; d++)
            (l = e[d].value || e[d]),
              l[0] >= s && l[0] <= o && l[1] >= a && l[1] <= n && r.push(e[d]);
          return r;
        },
        _setScale: function () {
          var t =
              0 !== this._zoom.start ||
              100 !== this._zoom.end ||
              0 !== this._zoom.start2 ||
              100 !== this._zoom.end2,
            e = { xAxis: this.option.xAxis, yAxis: this.option.yAxis };
          for (var i in e)
            for (var s = 0, o = e[i].length; o > s; s++)
              e[i][s].scale = t || e[i][s]._scale;
        },
        _backupScale: function () {
          var t = { xAxis: this.option.xAxis, yAxis: this.option.yAxis };
          for (var e in t)
            for (var i = 0, s = t[e].length; s > i; i++)
              t[e][i]._scale = t[e][i].scale;
        },
        _getDetail: function () {
          var t = "horizontal" == this.zoomOption.orient ? "xAxis" : "yAxis",
            e = this._originalData[t];
          for (var i in e) {
            var s = e[i];
            if (null != s) {
              var o = s.length,
                a = Math.floor((this._zoom.start / 100) * o),
                n = Math.ceil((this._zoom.end / 100) * o);
              return (
                (n -= n > 0 ? 1 : 0),
                {
                  start: this.getDataFromOption(s[a]),
                  end: this.getDataFromOption(s[n]),
                }
              );
            }
          }
          var h = this._zoom.seriesIndex[0],
            l = this.option.series[h][t + "Index"] || 0,
            d = this.option[t][l].type,
            p = this._zoom.scatterMap[h][t.charAt(0)].min,
            c = this._zoom.scatterMap[h][t.charAt(0)].max,
            u = c - p;
          if ("value" == d)
            return {
              start: p + (u * this._zoom.start) / 100,
              end: p + (u * this._zoom.end) / 100,
            };
          if ("time" == d) {
            (c = p + (u * this._zoom.end) / 100),
              (p += (u * this._zoom.start) / 100);
            var g = r.getAutoFormatter(p, c).formatter;
            return { start: r.format(g, p), end: r.format(g, c) };
          }
          return { start: "", end: "" };
        },
        __ondrift: function (t, e, i) {
          this.zoomOption.zoomLock && (t = this._fillerShae);
          var s = "filler" == t._type ? this._handleSize : 0;
          if (
            ("horizontal" == this.zoomOption.orient
              ? t.style.x + e - s <= this._location.x
                ? (t.style.x = this._location.x + s)
                : t.style.x + e + t.style.width + s >=
                  this._location.x + this._location.width
                ? (t.style.x =
                    this._location.x + this._location.width - t.style.width - s)
                : (t.style.x += e)
              : t.style.y + i - s <= this._location.y
              ? (t.style.y = this._location.y + s)
              : t.style.y + i + t.style.height + s >=
                this._location.y + this._location.height
              ? (t.style.y =
                  this._location.y + this._location.height - t.style.height - s)
              : (t.style.y += i),
            "filler" == t._type
              ? this._syncHandleShape()
              : this._syncFillerShape(),
            this.zoomOption.realtime && this._syncData(),
            this.zoomOption.showDetail)
          ) {
            var o = this._getDetail();
            (this._startShape.style.text = this._startShape.highlightStyle.text =
              o.start),
              (this._endShape.style.text = this._endShape.highlightStyle.text =
                o.end),
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
                n.EVENT.DATA_ZOOM,
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
          var s,
            o = (i.x - e.x) / e.width,
            a = 1 - (i.x + i.width - e.x) / e.width,
            n = 1 - (i.y + i.height - e.y) / e.height,
            r = (i.y - e.y) / e.height;
          return (
            "horizontal" == this.zoomOption.orient
              ? ((s = this._zoom.end - this._zoom.start),
                (this._zoom.start += s * o),
                (this._zoom.end -= s * a),
                (s = this._zoom.end2 - this._zoom.start2),
                (this._zoom.start2 += s * n),
                (this._zoom.end2 -= s * r))
              : ((s = this._zoom.end - this._zoom.start),
                (this._zoom.start += s * n),
                (this._zoom.end -= s * r),
                (s = this._zoom.end2 - this._zoom.start2),
                (this._zoom.start2 += s * o),
                (this._zoom.end2 -= s * a)),
            this._syncShape(),
            this._syncData(!0),
            this._zoom
          );
        },
        syncBackupData: function (t) {
          for (
            var e,
              i,
              s = this._originalData.series,
              o = t.series,
              a = 0,
              n = o.length;
            n > a;
            a++
          ) {
            (i = o[a].data || o[a].eventList),
              (e = s[a]
                ? Math.floor((this._zoom.start / 100) * s[a].length)
                : 0);
            for (var r = 0, h = i.length; h > r; r++)
              s[a] && (s[a][r + e] = i[r]);
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
  define("echarts/util/date", [], function () {
    function t(t, e, i) {
      i = i > 1 ? i : 2;
      for (var s, o, a, n, r = 0, h = d.length; h > r; r++)
        if (
          ((s = d[r].value),
          (o = Math.ceil(e / s) * s - Math.floor(t / s) * s),
          Math.round(o / s) <= 1.2 * i)
        ) {
          (a = d[r].formatter), (n = d[r].value);
          break;
        }
      return (
        null == a &&
          ((a = "year"),
          (s = 317088e5),
          (o = Math.ceil(e / s) * s - Math.floor(t / s) * s),
          (n = Math.round(o / (i - 1) / s) * s)),
        { formatter: a, gapValue: n }
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
      var s = l(i),
        o = s.getFullYear(),
        a = s.getMonth() + 1,
        n = s.getDate(),
        r = s.getHours(),
        h = s.getMinutes(),
        d = s.getSeconds();
      return (
        (t = t.replace("MM", e(a))),
        (t = t.toLowerCase()),
        (t = t.replace("yyyy", o)),
        (t = t.replace("yy", o % 100)),
        (t = t.replace("dd", e(n))),
        (t = t.replace("d", n)),
        (t = t.replace("hh", e(r))),
        (t = t.replace("h", r)),
        (t = t.replace("mm", e(h))),
        (t = t.replace("m", h)),
        (t = t.replace("ss", e(d))),
        (t = t.replace("s", d))
      );
    }
    function s(t) {
      return (t = l(t)), t.setDate(t.getDate() + 8 - t.getDay()), t;
    }
    function o(t, e, i) {
      return (
        (t = l(t)),
        t.setMonth(Math.ceil((t.getMonth() + 1) / i) * i),
        t.setDate(e),
        t
      );
    }
    function a(t, e) {
      return o(t, e, 1);
    }
    function n(t, e) {
      return o(t, e, 3);
    }
    function r(t, e) {
      return o(t, e, 6);
    }
    function h(t, e) {
      return o(t, e, 12);
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
      nextMonday: s,
      nextNthPerNmonth: o,
      nextNthOnMonth: a,
      nextNthOnQuarterYear: n,
      nextNthOnHalfYear: r,
      nextNthOnYear: h,
    };
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
    function e(t, e, s, o, a, n) {
      if (o.data.length < 1)
        return void console.error("option.data.length < 1.");
      i.call(this, t, e, s, o, a), (this.grid = this.component.grid);
      for (var r in n) this[r] = n[r];
      this.refresh(o);
    }
    var i = t("./base"),
      s = t("zrender/shape/Text"),
      o = t("zrender/shape/Line"),
      a = t("zrender/shape/Rectangle"),
      n = t("../config");
    n.categoryAxis = {
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
    var r = t("zrender/tool/util"),
      h = t("zrender/tool/area");
    return (
      (e.prototype = {
        type: n.COMPONENT_TYPE_AXIS_CATEGORY,
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
              s = this.option.data.length;
            if (this.isHorizontal())
              if (s > 3) {
                var o,
                  a,
                  n = this.getGap(),
                  l = !1,
                  d = Math.floor(0.5 / n);
                for (d = 1 > d ? 1 : d, t = Math.floor(15 / n); !l && s > t; ) {
                  (t += d), (l = !0), (o = Math.floor(n * t));
                  for (var p = Math.floor((s - 1) / t) * t; p >= 0; p -= t) {
                    if (0 !== this.option.axisLabel.rotate) a = e;
                    else if (i[p].textStyle)
                      a = h.getTextWidth(
                        this._getReformedLabel(p),
                        this.getFont(
                          r.merge(
                            i[p].textStyle,
                            this.option.axisLabel.textStyle
                          )
                        )
                      );
                    else {
                      var c = this._getReformedLabel(p) + "",
                        u = (c.match(/\w/g) || "").length,
                        g = c.length - u;
                      a = (u * e * 2) / 3 + g * e;
                    }
                    if (a > o) {
                      l = !1;
                      break;
                    }
                  }
                }
              } else t = 1;
            else if (s > 3) {
              var n = this.getGap();
              for (t = Math.floor(11 / n); e > n * t - 6 && s > t; ) t++;
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
            s = this.option.axisTick,
            a = s.length,
            n = s.lineStyle.color,
            r = s.lineStyle.width,
            h =
              "function" == typeof s.interval
                ? s.interval
                : "auto" == s.interval &&
                  "function" == typeof this.option.axisLabel.interval
                ? this.option.axisLabel.interval
                : !1,
            l = h
              ? 1
              : "auto" == s.interval
              ? this._interval
              : s.interval - 0 + 1,
            d = s.onGap,
            p = d
              ? this.getGap() / 2
              : "undefined" == typeof d && this.option.boundaryGap
              ? this.getGap() / 2
              : 0,
            c = p > 0 ? -l : 0;
          if (this.isHorizontal())
            for (
              var u,
                g =
                  "bottom" == this.option.position
                    ? s.inside
                      ? this.grid.getYend() - a - 1
                      : this.grid.getYend() + 1
                    : s.inside
                    ? this.grid.getY() + 1
                    : this.grid.getY() - a - 1,
                f = c;
              i > f;
              f += l
            )
              (!h || h(f, e[f])) &&
                ((u = this.subPixelOptimize(
                  this.getCoordByIndex(f) + (f >= 0 ? p : 0),
                  r
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
                    yEnd: g + a,
                    strokeColor: n,
                    lineWidth: r,
                  },
                }),
                this.shapeList.push(new o(t)));
          else
            for (
              var y,
                m =
                  "left" == this.option.position
                    ? s.inside
                      ? this.grid.getX() + 1
                      : this.grid.getX() - a - 1
                    : s.inside
                    ? this.grid.getXend() - a - 1
                    : this.grid.getXend() + 1,
                f = c;
              i > f;
              f += l
            )
              (!h || h(f, e[f])) &&
                ((y = this.subPixelOptimize(
                  this.getCoordByIndex(f) - (f >= 0 ? p : 0),
                  r
                )),
                (t = {
                  _axisShape: "axisTick",
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    xStart: m,
                    yStart: y,
                    xEnd: m + a,
                    yEnd: y,
                    strokeColor: n,
                    lineWidth: r,
                  },
                }),
                this.shapeList.push(new o(t)));
        },
        _buildAxisLabel: function () {
          var t,
            e,
            i = this.option.data,
            o = this.option.data.length,
            a = this.option.axisLabel,
            n = a.rotate,
            h = a.margin,
            l = a.clickable,
            d = a.textStyle,
            p = "function" == typeof a.interval ? a.interval : !1;
          if (this.isHorizontal()) {
            var c, u;
            "bottom" == this.option.position
              ? ((c = this.grid.getYend() + h), (u = "top"))
              : ((c = this.grid.getY() - h), (u = "bottom"));
            for (var g = 0; o > g; g += this._interval)
              (p && !p(g, i[g])) ||
                "" === this._getReformedLabel(g) ||
                ((e = r.merge(i[g].textStyle || {}, d)),
                (t = {
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase() + 3,
                  hoverable: !1,
                  style: {
                    x: this.getCoordByIndex(g),
                    y: c,
                    color: e.color,
                    text: this._getReformedLabel(g),
                    textFont: this.getFont(e),
                    textAlign: e.align || "center",
                    textBaseline: e.baseline || u,
                  },
                }),
                n &&
                  ((t.style.textAlign =
                    n > 0
                      ? "bottom" == this.option.position
                        ? "right"
                        : "left"
                      : "bottom" == this.option.position
                      ? "left"
                      : "right"),
                  (t.rotation = [(n * Math.PI) / 180, t.style.x, t.style.y])),
                this.shapeList.push(new s(this._axisLabelClickable(l, t))));
          } else {
            var f, y;
            "left" == this.option.position
              ? ((f = this.grid.getX() - h), (y = "right"))
              : ((f = this.grid.getXend() + h), (y = "left"));
            for (var g = 0; o > g; g += this._interval)
              (p && !p(g, i[g])) ||
                "" === this._getReformedLabel(g) ||
                ((e = r.merge(i[g].textStyle || {}, d)),
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
                    textAlign: e.align || y,
                    textBaseline:
                      e.baseline || (0 === g && "" !== this.option.name)
                        ? "bottom"
                        : g == o - 1 && "" !== this.option.name
                        ? "top"
                        : "middle",
                  },
                }),
                n && (t.rotation = [(n * Math.PI) / 180, t.style.x, t.style.y]),
                this.shapeList.push(new s(this._axisLabelClickable(l, t))));
          }
        },
        _buildSplitLine: function () {
          var t,
            e = this.option.data,
            i = this.option.data.length,
            s = this.option.splitLine,
            a = s.lineStyle.type,
            n = s.lineStyle.width,
            r = s.lineStyle.color;
          r = r instanceof Array ? r : [r];
          var h = r.length,
            l =
              "function" == typeof this.option.axisLabel.interval
                ? this.option.axisLabel.interval
                : !1,
            d = s.onGap,
            p = d
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
              var c, u = this.grid.getY(), g = this.grid.getYend(), f = 0;
              i > f;
              f += this._interval
            )
              (!l || l(f, e[f])) &&
                ((c = this.subPixelOptimize(this.getCoordByIndex(f) + p, n)),
                (t = {
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    xStart: c,
                    yStart: u,
                    xEnd: c,
                    yEnd: g,
                    strokeColor: r[(f / this._interval) % h],
                    lineType: a,
                    lineWidth: n,
                  },
                }),
                this.shapeList.push(new o(t)));
          else
            for (
              var y, m = this.grid.getX(), _ = this.grid.getXend(), f = 0;
              i > f;
              f += this._interval
            )
              (!l || l(f, e[f])) &&
                ((y = this.subPixelOptimize(this.getCoordByIndex(f) - p, n)),
                (t = {
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    xStart: m,
                    yStart: y,
                    xEnd: _,
                    yEnd: y,
                    strokeColor: r[(f / this._interval) % h],
                    lineType: a,
                    lineWidth: n,
                  },
                }),
                this.shapeList.push(new o(t)));
        },
        _buildSplitArea: function () {
          var t,
            e = this.option.data,
            i = this.option.splitArea,
            s = i.areaStyle.color;
          if (s instanceof Array) {
            var o = s.length,
              n = this.option.data.length,
              r =
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
                  p = this.grid.getY(),
                  c = this.grid.getHeight(),
                  u = this.grid.getX(),
                  g = 0;
                n >= g;
                g += this._interval
              )
                (r && !r(g, e[g]) && n > g) ||
                  ((d =
                    n > g ? this.getCoordByIndex(g) + l : this.grid.getXend()),
                  (t = {
                    zlevel: this.getZlevelBase(),
                    z: this.getZBase(),
                    hoverable: !1,
                    style: {
                      x: u,
                      y: p,
                      width: d - u,
                      height: c,
                      color: s[(g / this._interval) % o],
                    },
                  }),
                  this.shapeList.push(new a(t)),
                  (u = d));
            else
              for (
                var f,
                  y = this.grid.getX(),
                  m = this.grid.getWidth(),
                  _ = this.grid.getYend(),
                  g = 0;
                n >= g;
                g += this._interval
              )
                (r && !r(g, e[g]) && n > g) ||
                  ((f = n > g ? this.getCoordByIndex(g) - l : this.grid.getY()),
                  (t = {
                    zlevel: this.getZlevelBase(),
                    z: this.getZBase(),
                    hoverable: !1,
                    style: {
                      x: y,
                      y: f,
                      width: m,
                      height: _ - f,
                      color: s[(g / this._interval) % o],
                    },
                  }),
                  this.shapeList.push(new a(t)),
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
                color: s,
              },
            }),
              this.shapeList.push(new a(t));
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
              s = this.getGap(),
              o = this.option.boundaryGap ? s / 2 : 0,
              a = 0;
            i > a;
            a++
          ) {
            if (this.getDataFromOption(e[a]) == t)
              return (o = this.isHorizontal()
                ? this.grid.getX() + o
                : this.grid.getYend() - o);
            o += s;
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
          for (var e = this.option.data, i = e.length, s = 0; i > s; s++)
            if (this.getDataFromOption(e[s]) == t) return s;
          return -1;
        },
        getValueFromCoord: function () {
          return "";
        },
        isMainAxis: function (t) {
          return t % this._interval === 0;
        },
      }),
      r.inherits(e, i),
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
    function e(t, e, s, o, a, n, r) {
      if (!r || 0 === r.length)
        return void console.err("option.series.length == 0.");
      i.call(this, t, e, s, o, a),
        (this.series = r),
        (this.grid = this.component.grid);
      for (var h in n) this[h] = n[h];
      this.refresh(o, r);
    }
    var i = t("./base"),
      s = t("zrender/shape/Text"),
      o = t("zrender/shape/Line"),
      a = t("zrender/shape/Rectangle"),
      n = t("../config");
    n.valueAxis = {
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
    var r = t("../util/date"),
      h = t("zrender/tool/util");
    return (
      (e.prototype = {
        type: n.COMPONENT_TYPE_AXIS_VALUE,
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
            s = this.option.axisTick,
            a = s.length,
            n = s.lineStyle.color,
            r = s.lineStyle.width;
          if (this.isHorizontal())
            for (
              var h,
                l =
                  "bottom" === this.option.position
                    ? s.inside
                      ? this.grid.getYend() - a - 1
                      : this.grid.getYend() + 1
                    : s.inside
                    ? this.grid.getY() + 1
                    : this.grid.getY() - a - 1,
                d = 0;
              i > d;
              d++
            )
              (h = this.subPixelOptimize(this.getCoord(e[d]), r)),
                (t = {
                  _axisShape: "axisTick",
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    xStart: h,
                    yStart: l,
                    xEnd: h,
                    yEnd: l + a,
                    strokeColor: n,
                    lineWidth: r,
                  },
                }),
                this.shapeList.push(new o(t));
          else
            for (
              var p,
                c =
                  "left" === this.option.position
                    ? s.inside
                      ? this.grid.getX() + 1
                      : this.grid.getX() - a - 1
                    : s.inside
                    ? this.grid.getXend() - a - 1
                    : this.grid.getXend() + 1,
                d = 0;
              i > d;
              d++
            )
              (p = this.subPixelOptimize(this.getCoord(e[d]), r)),
                (t = {
                  _axisShape: "axisTick",
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    xStart: c,
                    yStart: p,
                    xEnd: c + a,
                    yEnd: p,
                    strokeColor: n,
                    lineWidth: r,
                  },
                }),
                this.shapeList.push(new o(t));
        },
        _buildAxisLabel: function () {
          var t,
            e = this._valueList,
            i = this._valueList.length,
            o = this.option.axisLabel.rotate,
            a = this.option.axisLabel.margin,
            n = this.option.axisLabel.clickable,
            r = this.option.axisLabel.textStyle;
          if (this.isHorizontal()) {
            var h, l;
            "bottom" === this.option.position
              ? ((h = this.grid.getYend() + a), (l = "top"))
              : ((h = this.grid.getY() - a), (l = "bottom"));
            for (var d = 0; i > d; d++)
              (t = {
                zlevel: this.getZlevelBase(),
                z: this.getZBase() + 3,
                hoverable: !1,
                style: {
                  x: this.getCoord(e[d]),
                  y: h,
                  color: "function" == typeof r.color ? r.color(e[d]) : r.color,
                  text: this._valueLabel[d],
                  textFont: this.getFont(r),
                  textAlign: r.align || "center",
                  textBaseline: r.baseline || l,
                },
              }),
                o &&
                  ((t.style.textAlign =
                    o > 0
                      ? "bottom" === this.option.position
                        ? "right"
                        : "left"
                      : "bottom" === this.option.position
                      ? "left"
                      : "right"),
                  (t.rotation = [(o * Math.PI) / 180, t.style.x, t.style.y])),
                this.shapeList.push(new s(this._axisLabelClickable(n, t)));
          } else {
            var p, c;
            "left" === this.option.position
              ? ((p = this.grid.getX() - a), (c = "right"))
              : ((p = this.grid.getXend() + a), (c = "left"));
            for (var d = 0; i > d; d++)
              (t = {
                zlevel: this.getZlevelBase(),
                z: this.getZBase() + 3,
                hoverable: !1,
                style: {
                  x: p,
                  y: this.getCoord(e[d]),
                  color: "function" == typeof r.color ? r.color(e[d]) : r.color,
                  text: this._valueLabel[d],
                  textFont: this.getFont(r),
                  textAlign: r.align || c,
                  textBaseline:
                    r.baseline ||
                    (0 === d && "" !== this.option.name
                      ? "bottom"
                      : d === i - 1 && "" !== this.option.name
                      ? "top"
                      : "middle"),
                },
              }),
                o && (t.rotation = [(o * Math.PI) / 180, t.style.x, t.style.y]),
                this.shapeList.push(new s(this._axisLabelClickable(n, t)));
          }
        },
        _buildSplitLine: function () {
          var t,
            e = this._valueList,
            i = this._valueList.length,
            s = this.option.splitLine,
            a = s.lineStyle.type,
            n = s.lineStyle.width,
            r = s.lineStyle.color;
          r = r instanceof Array ? r : [r];
          var h = r.length;
          if (this.isHorizontal())
            for (
              var l, d = this.grid.getY(), p = this.grid.getYend(), c = 0;
              i > c;
              c++
            )
              (l = this.subPixelOptimize(this.getCoord(e[c]), n)),
                (t = {
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    xStart: l,
                    yStart: d,
                    xEnd: l,
                    yEnd: p,
                    strokeColor: r[c % h],
                    lineType: a,
                    lineWidth: n,
                  },
                }),
                this.shapeList.push(new o(t));
          else
            for (
              var u, g = this.grid.getX(), f = this.grid.getXend(), c = 0;
              i > c;
              c++
            )
              (u = this.subPixelOptimize(this.getCoord(e[c]), n)),
                (t = {
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  hoverable: !1,
                  style: {
                    xStart: g,
                    yStart: u,
                    xEnd: f,
                    yEnd: u,
                    strokeColor: r[c % h],
                    lineType: a,
                    lineWidth: n,
                  },
                }),
                this.shapeList.push(new o(t));
        },
        _buildSplitArea: function () {
          var t,
            e = this.option.splitArea.areaStyle.color;
          if (e instanceof Array) {
            var i = e.length,
              s = this._valueList,
              o = this._valueList.length;
            if (this.isHorizontal())
              for (
                var n,
                  r = this.grid.getY(),
                  h = this.grid.getHeight(),
                  l = this.grid.getX(),
                  d = 0;
                o >= d;
                d++
              )
                (n = o > d ? this.getCoord(s[d]) : this.grid.getXend()),
                  (t = {
                    zlevel: this.getZlevelBase(),
                    z: this.getZBase(),
                    hoverable: !1,
                    style: {
                      x: l,
                      y: r,
                      width: n - l,
                      height: h,
                      color: e[d % i],
                    },
                  }),
                  this.shapeList.push(new a(t)),
                  (l = n);
            else
              for (
                var p,
                  c = this.grid.getX(),
                  u = this.grid.getWidth(),
                  g = this.grid.getYend(),
                  d = 0;
                o >= d;
                d++
              )
                (p = o > d ? this.getCoord(s[d]) : this.grid.getY()),
                  (t = {
                    zlevel: this.getZlevelBase(),
                    z: this.getZBase(),
                    hoverable: !1,
                    style: {
                      x: c,
                      y: p,
                      width: u,
                      height: g - p,
                      color: e[d % i],
                    },
                  }),
                  this.shapeList.push(new a(t)),
                  (g = p);
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
              this.shapeList.push(new a(t));
        },
        _calculateValue: function () {
          if (isNaN(this.option.min - 0) || isNaN(this.option.max - 0)) {
            for (
              var t,
                e,
                i = {},
                s = this.component.legend,
                o = 0,
                a = this.series.length;
              a > o;
              o++
            )
              !(
                (this.series[o].type != n.CHART_TYPE_LINE &&
                  this.series[o].type != n.CHART_TYPE_BAR &&
                  this.series[o].type != n.CHART_TYPE_SCATTER &&
                  this.series[o].type != n.CHART_TYPE_K &&
                  this.series[o].type != n.CHART_TYPE_EVENTRIVER) ||
                (s && !s.isSelected(this.series[o].name)) ||
                ((t = this.series[o].xAxisIndex || 0),
                (e = this.series[o].yAxisIndex || 0),
                (this.option.xAxisIndex != t && this.option.yAxisIndex != e) ||
                  !this._calculSum(i, o))
              );
            var r;
            for (var o in i) {
              r = i[o];
              for (var h = 0, l = r.length; l > h; h++)
                if (!isNaN(r[h])) {
                  (this._hasData = !0), (this._min = r[h]), (this._max = r[h]);
                  break;
                }
              if (this._hasData) break;
            }
            for (var o in i) {
              r = i[o];
              for (var h = 0, l = r.length; l > h; h++)
                isNaN(r[h]) ||
                  ((this._min = Math.min(this._min, r[h])),
                  (this._max = Math.max(this._max, r[h])));
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
            s,
            o = this.series[e].name || "kener";
          if (this.series[e].stack) {
            var a = "__Magic_Key_Positive__" + this.series[e].stack,
              h = "__Magic_Key_Negative__" + this.series[e].stack;
            (t[a] = t[a] || []),
              (t[h] = t[h] || []),
              (t[o] = t[o] || []),
              (s = this.series[e].data);
            for (var l = 0, d = s.length; d > l; l++)
              (i = this.getDataFromOption(s[l])),
                "-" !== i &&
                  ((i -= 0),
                  i >= 0
                    ? null != t[a][l]
                      ? (t[a][l] += i)
                      : (t[a][l] = i)
                    : null != t[h][l]
                    ? (t[h][l] += i)
                    : (t[h][l] = i),
                  this.option.scale && t[o].push(i));
          } else if (
            ((t[o] = t[o] || []),
            this.series[e].type != n.CHART_TYPE_EVENTRIVER)
          ) {
            s = this.series[e].data;
            for (var l = 0, d = s.length; d > l; l++)
              (i = this.getDataFromOption(s[l])),
                this.series[e].type === n.CHART_TYPE_K
                  ? (t[o].push(i[0]),
                    t[o].push(i[1]),
                    t[o].push(i[2]),
                    t[o].push(i[3]))
                  : i instanceof Array
                  ? (-1 != this.option.xAxisIndex &&
                      t[o].push(
                        "time" != this.option.type ? i[0] : r.getNewDate(i[0])
                      ),
                    -1 != this.option.yAxisIndex &&
                      t[o].push(
                        "time" != this.option.type ? i[1] : r.getNewDate(i[1])
                      ))
                  : t[o].push(i);
          } else {
            s = this.series[e].eventList;
            for (var l = 0, d = s.length; d > l; l++)
              for (var p = s[l].evolution, c = 0, u = p.length; u > c; c++)
                t[o].push(r.getNewDate(p[c].time));
          }
        },
        _reformValue: function (e) {
          var i = t("../util/smartSteps"),
            s = this.option.splitNumber;
          !e && this._min >= 0 && this._max >= 0 && (this._min = 0),
            !e && this._min <= 0 && this._max <= 0 && (this._max = 0);
          var o = i(this._min, this._max, s);
          (s = null != s ? s : o.secs),
            (this._min = o.min),
            (this._max = o.max),
            (this._valueList = o.pnts),
            this._reformLabelData();
        },
        _reformTimeValue: function () {
          var t = null != this.option.splitNumber ? this.option.splitNumber : 5,
            e = r.getAutoFormatter(this._min, this._max, t),
            i = e.formatter,
            s = e.gapValue;
          this._valueList = [r.getNewDate(this._min)];
          var o;
          switch (i) {
            case "week":
              o = r.nextMonday(this._min);
              break;
            case "month":
              o = r.nextNthOnMonth(this._min, 1);
              break;
            case "quarter":
              o = r.nextNthOnQuarterYear(this._min, 1);
              break;
            case "half-year":
              o = r.nextNthOnHalfYear(this._min, 1);
              break;
            case "year":
              o = r.nextNthOnYear(this._min, 1);
              break;
            default:
              72e5 >= s
                ? (o = (Math.floor(this._min / s) + 1) * s)
                : ((o = r.getNewDate(this._min - -s)),
                  o.setHours(6 * Math.round(o.getHours() / 6)),
                  o.setMinutes(0),
                  o.setSeconds(0));
          }
          for (
            o - this._min < s / 2 && (o -= -s), e = r.getNewDate(o), t *= 1.5;
            t-- >= 0 &&
            (("month" == i ||
              "quarter" == i ||
              "half-year" == i ||
              "year" == i) &&
              e.setDate(1),
            !(this._max - e < s / 2));

          )
            this._valueList.push(e), (e = r.getNewDate(e - -s));
          this._valueList.push(r.getNewDate(this._max)),
            this._reformLabelData(i);
        },
        _customerValue: function () {
          var e = t("../util/accMath"),
            i = null != this.option.splitNumber ? this.option.splitNumber : 5,
            s = (this._max - this._min) / i;
          this._valueList = [];
          for (var o = 0; i >= o; o++)
            this._valueList.push(e.accAdd(this._min, e.accMul(s, o)));
          this._reformLabelData();
        },
        _reformLabelData: function (t) {
          this._valueLabel = [];
          var e = this.option.axisLabel.formatter;
          if (e)
            for (var i = 0, s = this._valueList.length; s > i; i++)
              "function" == typeof e
                ? this._valueLabel.push(
                    t
                      ? e.call(this.myChart, this._valueList[i], t)
                      : e.call(this.myChart, this._valueList[i])
                  )
                : "string" == typeof e &&
                  this._valueLabel.push(
                    t
                      ? r.format(e, this._valueList[i])
                      : e.replace("{value}", this._valueList[i])
                  );
          else if (t)
            for (var i = 0, s = this._valueList.length; s > i; i++)
              this._valueLabel.push(r.format(t, this._valueList[i]));
          else
            for (var i = 0, s = this._valueList.length; s > i; i++)
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
  define("echarts/util/smartSteps", [], function () {
    function t(t) {
      return w.log(O(t)) / w.LN10;
    }
    function e(t) {
      return w.pow(10, t);
    }
    function i(t) {
      return t === C(t);
    }
    function s(t, e, s, o) {
      (x = o || {}),
        (v = x.steps || T),
        (b = x.secs || L),
        (s = M(+s || 0) % 99),
        (t = +t || 0),
        (e = +e || 0),
        (S = z = 0),
        "min" in x && ((t = +x.min || 0), (S = 1)),
        "max" in x && ((e = +x.max || 0), (z = 1)),
        t > e && (e = [t, (t = e)][0]);
      var a = e - t;
      if (S && z) return _(t, e, s);
      if ((s || 5) > a) {
        if (i(t) && i(e)) return u(t, e, s);
        if (0 === a) return g(t, e, s);
      }
      return l(t, e, s);
    }
    function o(t, i, s, o) {
      o = o || 0;
      var r = a((i - t) / s, -1),
        h = a(t, -1, 1),
        l = a(i, -1),
        d = w.min(r.e, h.e, l.e);
      0 === h.c ? (d = w.min(r.e, l.e)) : 0 === l.c && (d = w.min(r.e, h.e)),
        n(r, { c: 0, e: d }),
        n(h, r, 1),
        n(l, r),
        (o += d),
        (t = h.c),
        (i = l.c);
      for (var p = (i - t) / s, c = e(o), u = 0, g = [], f = s + 1; f--; )
        g[f] = (t + p * f) * c;
      if (0 > o) {
        (u = y(c)),
          (p = +(p * c).toFixed(u)),
          (t = +(t * c).toFixed(u)),
          (i = +(i * c).toFixed(u));
        for (var f = g.length; f--; )
          (g[f] = g[f].toFixed(u)), 0 === +g[f] && (g[f] = "0");
      } else (t *= c), (i *= c), (p *= c);
      return (
        (b = 0),
        (v = 0),
        (x = 0),
        { min: t, max: i, secs: s, step: p, fix: u, exp: o, pnts: g }
      );
    }
    function a(s, o, a) {
      (o = M(o % 10) || 2),
        0 > o &&
          (i(s)
            ? (o = ("" + O(s)).replace(/0+$/, "").length || 1)
            : ((s = s.toFixed(15).replace(/0+$/, "")),
              (o = s.replace(".", "").replace(/^[-0]+/, "").length),
              (s = +s)));
      var n = C(t(s)) - o + 1,
        r = +(s * e(-n)).toFixed(15) || 0;
      return (
        (r = a ? C(r) : A(r)),
        !r && (n = 0),
        ("" + O(r)).length > o && ((n += 1), (r /= 10)),
        { c: r, e: n }
      );
    }
    function n(t, i, s) {
      var o = i.e - t.e;
      o && ((t.e += o), (t.c *= e(-o)), (t.c = s ? C(t.c) : A(t.c)));
    }
    function r(t, e, i) {
      t.e < e.e ? n(e, t, i) : n(t, e, i);
    }
    function h(t, e) {
      (e = e || T), (t = a(t));
      for (var i = t.c, s = 0; i > e[s]; ) s++;
      if (!e[s]) for (i /= 10, t.e += 1, s = 0; i > e[s]; ) s++;
      return (t.c = e[s]), t;
    }
    function l(t, e, s) {
      var r,
        l = s || +b.slice(-1),
        g = h((e - t) / l, v),
        y = a(e - t),
        _ = a(t, -1, 1),
        x = a(e, -1);
      if (
        (n(y, g),
        n(_, g, 1),
        n(x, g),
        s ? (r = p(_, x, l)) : (l = d(_, x)),
        i(t) && i(e) && t * e >= 0)
      ) {
        if (l > e - t) return u(t, e, l);
        l = c(t, e, s, _, x, l);
      }
      var T = f(t, e, _.c, x.c);
      return (
        (_.c = T[0]),
        (x.c = T[1]),
        (S || z) && m(t, e, _, x),
        o(_.c, x.c, l, x.e)
      );
    }
    function d(t, i) {
      for (var s, o, a, n, r = [], l = b.length; l--; )
        (s = b[l]),
          (o = h((i.c - t.c) / s, v)),
          (o = o.c * e(o.e)),
          (a = C(t.c / o) * o),
          (n = A(i.c / o) * o),
          (r[l] = { min: a, max: n, step: o, span: n - a });
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
    function p(t, i, s) {
      for (var o, a, n = i.c, r = (i.c - t.c) / s - 1; n > t.c; )
        (r = h(r + 1, v)),
          (r = r.c * e(r.e)),
          (o = r * s),
          (a = A(i.c / r) * r),
          (n = a - o);
      var l = t.c - n,
        d = a - i.c,
        p = l - d;
      return (
        p > 1.1 * r && ((p = M(p / r / 2) * r), (n += p), (a += p)),
        (t.c = n),
        (i.c = a),
        r
      );
    }
    function c(t, s, o, a, n, r) {
      var h = n.c - a.c,
        l = (h / r) * e(n.e);
      if (
        !i(l) &&
        ((l = C(l)),
        (h = l * r),
        s - t > h &&
          ((l += 1),
          (h = l * r),
          !o && l * (r - 1) >= s - t && ((r -= 1), (h = l * r))),
        h >= s - t)
      ) {
        var d = h - (s - t);
        (a.c = M(t - d / 2)), (n.c = M(s + d / 2)), (a.e = 0), (n.e = 0);
      }
      return r;
    }
    function u(t, e, i) {
      if (((i = i || 5), S)) e = t + i;
      else if (z) t = e - i;
      else {
        var s = i - (e - t),
          a = M(t - s / 2),
          n = M(e + s / 2),
          r = f(t, e, a, n);
        (t = r[0]), (e = r[1]);
      }
      return o(t, e, i);
    }
    function g(t, e, i) {
      i = i || 5;
      var s = w.min(O(e / i), i) / 2.1;
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
    function y(t) {
      return (
        (t = (+t).toFixed(15).split(".")), t.pop().replace(/0+$/, "").length
      );
    }
    function m(t, e, i, s) {
      if (S) {
        var o = a(t, 4, 1);
        i.e - o.e > 6 && (o = { c: 0, e: i.e }),
          r(i, o),
          r(s, o),
          (s.c += o.c - i.c),
          (i.c = o.c);
      } else if (z) {
        var n = a(e, 4);
        s.e - n.e > 6 && (n = { c: 0, e: s.e }),
          r(i, n),
          r(s, n),
          (i.c += n.c - s.c),
          (s.c = n.c);
      }
    }
    function _(t, e, i) {
      var s = i ? [i] : b,
        r = e - t;
      if (0 === r)
        return (
          (e = a(e, 3)),
          (i = s[0]),
          (e.c = M(e.c + i / 2)),
          o(e.c - i, e.c, i, e.e)
        );
      O(e / r) < 1e-6 && (e = 0), O(t / r) < 1e-6 && (t = 0);
      var h,
        l,
        d,
        p = [
          [5, 10],
          [10, 2],
          [50, 10],
          [100, 2],
        ],
        c = [],
        u = [],
        g = a(e - t, 3),
        f = a(t, -1, 1),
        y = a(e, -1);
      n(f, g, 1), n(y, g), (r = y.c - f.c), (g.c = r);
      for (var m = s.length; m--; ) {
        (i = s[m]),
          (h = A(r / i)),
          (l = h * i - r),
          (d = 3 * (l + 3)),
          (d += 2 * (i - s[0] + 2)),
          i % 5 === 0 && (d -= 10);
        for (var _ = p.length; _--; ) h % p[_][0] === 0 && (d /= p[_][1]);
        (u[m] = [i, h, l, d].join()),
          (c[m] = { secs: i, step: h, delta: l, score: d });
      }
      return (
        c.sort(function (t, e) {
          return t.score - e.score;
        }),
        (c = c[0]),
        (f.c = M(f.c - c.delta / 2)),
        (y.c = M(y.c + c.delta / 2)),
        o(f.c, y.c, c.secs, g.e)
      );
    }
    var x,
      v,
      b,
      S,
      z,
      T = [10, 20, 25, 50],
      L = [4, 5, 6],
      w = Math,
      M = w.round,
      C = w.floor,
      A = w.ceil,
      O = w.abs;
    return s;
  });
