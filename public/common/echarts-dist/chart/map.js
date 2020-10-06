define("echarts/chart/map", [
  "require",
  "./base",
  "zrender/shape/Text",
  "zrender/shape/Path",
  "zrender/shape/Circle",
  "zrender/shape/Rectangle",
  "zrender/shape/Line",
  "zrender/shape/Polygon",
  "zrender/shape/Ellipse",
  "../component/dataRange",
  "../component/roamController",
  "../config",
  "../util/ecData",
  "zrender/tool/util",
  "zrender/config",
  "zrender/tool/event",
  "../util/mapData/params",
  "../util/mapData/textFixed",
  "../util/mapData/geoCoord",
  "../util/projection/svg",
  "../util/projection/normal",
  "../chart",
], function (t) {
  function e(t, e, s, o, a) {
    i.call(this, t, e, s, o, a);
    var n = this;
    (n._onmousewheel = function (t) {
      return n.__onmousewheel(t);
    }),
      (n._onmousedown = function (t) {
        return n.__onmousedown(t);
      }),
      (n._onmousemove = function (t) {
        return n.__onmousemove(t);
      }),
      (n._onmouseup = function (t) {
        return n.__onmouseup(t);
      }),
      (n._onroamcontroller = function (t) {
        return n.__onroamcontroller(t);
      }),
      (n._ondrhoverlink = function (t) {
        return n.__ondrhoverlink(t);
      }),
      (this._isAlive = !0),
      (this._selectedMode = {}),
      (this._activeMapType = {}),
      (this._clickable = {}),
      (this._hoverable = {}),
      (this._showLegendSymbol = {}),
      (this._selected = {}),
      (this._mapTypeMap = {}),
      (this._mapDataMap = {}),
      (this._nameMap = {}),
      (this._specialArea = {}),
      this._refreshDelayTicket,
      this._mapDataRequireCounter,
      (this._markAnimation = !1),
      (this._hoverLinkMap = {}),
      (this._roamMap = {}),
      (this._scaleLimitMap = {}),
      this._mx,
      this._my,
      this._mousedown,
      this._justMove,
      this._curMapType,
      this.refresh(o),
      this.zr.on(u.EVENT.MOUSEWHEEL, this._onmousewheel),
      this.zr.on(u.EVENT.MOUSEDOWN, this._onmousedown),
      e.bind(d.EVENT.ROAMCONTROLLER, this._onroamcontroller),
      e.bind(d.EVENT.DATA_RANGE_HOVERLINK, this._ondrhoverlink);
  }
  var i = t("./base"),
    s = t("zrender/shape/Text"),
    o = t("zrender/shape/Path"),
    a = t("zrender/shape/Circle"),
    n = t("zrender/shape/Rectangle"),
    r = t("zrender/shape/Line"),
    h = t("zrender/shape/Polygon"),
    l = t("zrender/shape/Ellipse");
  t("../component/dataRange"), t("../component/roamController");
  var d = t("../config");
  d.map = {
    zlevel: 0,
    z: 2,
    mapType: "china",
    mapValuePrecision: 0,
    showLegendSymbol: !0,
    dataRangeHoverLink: !0,
    hoverable: !0,
    clickable: !0,
    itemStyle: {
      normal: {
        borderColor: "rgba(0,0,0,0)",
        borderWidth: 1,
        areaStyle: { color: "#ccc" },
        label: { show: !1, textStyle: { color: "rgb(139,69,19)" } },
      },
      emphasis: {
        borderColor: "rgba(0,0,0,0)",
        borderWidth: 1,
        areaStyle: { color: "rgba(255,215,0,0.8)" },
        label: { show: !1, textStyle: { color: "rgb(100,0,0)" } },
      },
    },
  };
  var p = t("../util/ecData"),
    c = t("zrender/tool/util"),
    u = t("zrender/config"),
    g = t("zrender/tool/event"),
    f = t("../util/mapData/params").params,
    y = t("../util/mapData/textFixed"),
    m = t("../util/mapData/geoCoord");
  return (
    (e.prototype = {
      type: d.CHART_TYPE_MAP,
      _buildShape: function () {
        var t = this.series;
        (this.selectedMap = {}), (this._activeMapType = {});
        for (
          var e,
            i,
            s,
            o,
            a = this.component.legend,
            n = {},
            r = {},
            h = {},
            l = {},
            p = 0,
            u = t.length;
          u > p;
          p++
        )
          if (
            t[p].type == d.CHART_TYPE_MAP &&
            ((t[p] = this.reformOption(t[p])),
            (i = t[p].mapType),
            (r[i] = r[i] || {}),
            (r[i][p] = !0),
            (h[i] = h[i] || t[p].mapValuePrecision),
            (this._scaleLimitMap[i] = this._scaleLimitMap[i] || {}),
            t[p].scaleLimit &&
              c.merge(this._scaleLimitMap[i], t[p].scaleLimit, !0),
            (this._roamMap[i] = t[p].roam || this._roamMap[i]),
            (this._hoverLinkMap[i] =
              t[p].dataRangeHoverLink || this._hoverLinkMap[i]),
            (this._nameMap[i] = this._nameMap[i] || {}),
            t[p].nameMap && c.merge(this._nameMap[i], t[p].nameMap, !0),
            (this._activeMapType[i] = !0),
            t[p].textFixed && c.merge(y, t[p].textFixed, !0),
            t[p].geoCoord && c.merge(m, t[p].geoCoord, !0),
            (this._selectedMode[i] =
              this._selectedMode[i] || t[p].selectedMode),
            (null == this._hoverable[i] || this._hoverable[i]) &&
              (this._hoverable[i] = t[p].hoverable),
            (null == this._clickable[i] || this._clickable[i]) &&
              (this._clickable[i] = t[p].clickable),
            (null == this._showLegendSymbol[i] || this._showLegendSymbol[i]) &&
              (this._showLegendSymbol[i] = t[p].showLegendSymbol),
            (l[i] = l[i] || t[p].mapValueCalculation),
            (e = t[p].name),
            (this.selectedMap[e] = a ? a.isSelected(e) : !0),
            this.selectedMap[e])
          ) {
            (n[i] = n[i] || {}), (s = t[p].data);
            for (var g = 0, _ = s.length; _ > g; g++) {
              (o = this._nameChange(i, s[g].name)),
                (n[i][o] = n[i][o] || { seriesIndex: [] });
              for (var x in s[g])
                "value" != x
                  ? (n[i][o][x] = s[g][x])
                  : isNaN(s[g].value) ||
                    (null == n[i][o].value && (n[i][o].value = 0),
                    (n[i][o].value += s[g].value));
              n[i][o].seriesIndex.push(p);
            }
          }
        this._mapDataRequireCounter = 0;
        for (var v in n) this._mapDataRequireCounter++;
        this._clearSelected(),
          0 === this._mapDataRequireCounter &&
            (this.clear(),
            this.zr && this.zr.delShape(this.lastShapeList),
            (this.lastShapeList = []));
        for (var v in n) {
          if (l[v] && "average" == l[v])
            for (var _ in n[v])
              n[v][_].value =
                (n[v][_].value / n[v][_].seriesIndex.length).toFixed(h[v]) - 0;
          (this._mapDataMap[v] = this._mapDataMap[v] || {}),
            this._mapDataMap[v].mapData
              ? this._mapDataCallback(
                  v,
                  n[v],
                  r[v]
                )(this._mapDataMap[v].mapData)
              : f[v.replace(/\|.*/, "")].getGeoJson &&
                ((this._specialArea[v] =
                  f[v.replace(/\|.*/, "")].specialArea || this._specialArea[v]),
                f[v.replace(/\|.*/, "")].getGeoJson(
                  this._mapDataCallback(v, n[v], r[v])
                ));
        }
      },
      _mapDataCallback: function (e, i, s) {
        var o = this;
        return function (a) {
          o._isAlive &&
            null != o._activeMapType[e] &&
            (-1 != e.indexOf("|") && (a = o._getSubMapData(e, a)),
            (o._mapDataMap[e].mapData = a),
            a.firstChild
              ? ((o._mapDataMap[e].rate = 1),
                (o._mapDataMap[e].projection = t("../util/projection/svg")))
              : ((o._mapDataMap[e].rate = 0.75),
                (o._mapDataMap[e].projection = t("../util/projection/normal"))),
            o._buildMap(e, o._getProjectionData(e, a, s), i, s),
            o._buildMark(e, s),
            --o._mapDataRequireCounter <= 0 &&
              (o.addShapeList(), o.zr.refreshNextFrame()));
        };
      },
      _clearSelected: function () {
        for (var t in this._selected)
          this._activeMapType[this._mapTypeMap[t]] ||
            (delete this._selected[t], delete this._mapTypeMap[t]);
      },
      _getSubMapData: function (t, e) {
        for (
          var i = t.replace(/^.*\|/, ""), s = e.features, o = 0, a = s.length;
          a > o;
          o++
        )
          if (s[o].properties && s[o].properties.name == i) {
            (s = s[o]),
              "United States of America" == i &&
                s.geometry.coordinates.length > 1 &&
                (s = {
                  geometry: {
                    coordinates: s.geometry.coordinates.slice(5, 6),
                    type: s.geometry.type,
                  },
                  id: s.id,
                  properties: s.properties,
                  type: s.type,
                });
            break;
          }
        return { type: "FeatureCollection", features: [s] };
      },
      _getProjectionData: function (t, e, i) {
        var s,
          o = this._mapDataMap[t].projection,
          a = [],
          n = this._mapDataMap[t].bbox || o.getBbox(e, this._specialArea[t]);
        s = this._mapDataMap[t].hasRoam
          ? this._mapDataMap[t].transform
          : this._getTransform(n, i, this._mapDataMap[t].rate);
        var r,
          h = this._mapDataMap[t].lastTransform || { scale: {} };
        s.left != h.left ||
        s.top != h.top ||
        s.scale.x != h.scale.x ||
        s.scale.y != h.scale.y
          ? ((r = o.geoJson2Path(e, s, this._specialArea[t])), (h = c.clone(s)))
          : ((s = this._mapDataMap[t].transform),
            (r = this._mapDataMap[t].pathArray)),
          (this._mapDataMap[t].bbox = n),
          (this._mapDataMap[t].transform = s),
          (this._mapDataMap[t].lastTransform = h),
          (this._mapDataMap[t].pathArray = r);
        for (var l = [s.left, s.top], d = 0, p = r.length; p > d; d++)
          a.push(this._getSingleProvince(t, r[d], l));
        if (this._specialArea[t])
          for (var u in this._specialArea[t])
            a.push(
              this._getSpecialProjectionData(
                t,
                e,
                u,
                this._specialArea[t][u],
                l
              )
            );
        if ("china" == t) {
          var g = this.geo2pos(t, m["南海诸岛"] || f["南海诸岛"].textCoord),
            _ = s.scale.x / 10.5,
            x = [32 * _ + g[0], 83 * _ + g[1]];
          y["南海诸岛"] &&
            ((x[0] += y["南海诸岛"][0]), (x[1] += y["南海诸岛"][1])),
            a.push({
              name: this._nameChange(t, "南海诸岛"),
              path: f["南海诸岛"].getPath(g, _),
              position: l,
              textX: x[0],
              textY: x[1],
            });
        }
        return a;
      },
      _getSpecialProjectionData: function (e, i, s, o, a) {
        i = this._getSubMapData("x|" + s, i);
        var n = t("../util/projection/normal"),
          r = n.getBbox(i),
          h = this.geo2pos(e, [o.left, o.top]),
          l = this.geo2pos(e, [o.left + o.width, o.top + o.height]),
          d = Math.abs(l[0] - h[0]),
          p = Math.abs(l[1] - h[1]),
          c = r.width,
          u = r.height,
          g = d / 0.75 / c,
          f = p / u;
        g > f
          ? ((g = 0.75 * f), (d = c * g))
          : ((f = g), (g = 0.75 * f), (p = u * f));
        var y = { OffsetLeft: h[0], OffsetTop: h[1], scale: { x: g, y: f } },
          m = n.geoJson2Path(i, y);
        return this._getSingleProvince(e, m[0], a);
      },
      _getSingleProvince: function (t, e, i) {
        var s,
          o = e.properties.name,
          a = y[o] || [0, 0];
        if (m[o]) s = this.geo2pos(t, m[o]);
        else if (e.cp) s = [e.cp[0] + a[0], e.cp[1] + a[1]];
        else {
          var n = this._mapDataMap[t].bbox;
          (s = this.geo2pos(t, [n.left + n.width / 2, n.top + n.height / 2])),
            (s[0] += a[0]),
            (s[1] += a[1]);
        }
        return (
          (e.name = this._nameChange(t, o)),
          (e.position = i),
          (e.textX = s[0]),
          (e.textY = s[1]),
          e
        );
      },
      _getTransform: function (t, e, i) {
        var s,
          o,
          a,
          n,
          r,
          h,
          l,
          d = this.series,
          p = this.zr.getWidth(),
          c = this.zr.getHeight(),
          u = Math.round(0.02 * Math.min(p, c));
        for (var g in e)
          (s = d[g].mapLocation || {}),
            (a = s.x || a),
            (r = s.y || r),
            (h = s.width || h),
            (l = s.height || l);
        (o = this.parsePercent(a, p)),
          (o = isNaN(o) ? u : o),
          (n = this.parsePercent(r, c)),
          (n = isNaN(n) ? u : n),
          (h = null == h ? p - o - 2 * u : this.parsePercent(h, p)),
          (l = null == l ? c - n - 2 * u : this.parsePercent(l, c));
        var f = t.width,
          y = t.height,
          m = h / i / f,
          _ = l / y;
        if (
          (m > _
            ? ((m = _ * i), (h = f * m))
            : ((_ = m), (m = _ * i), (l = y * _)),
          isNaN(a))
        )
          switch (((a = a || "center"), a + "")) {
            case "center":
              o = Math.floor((p - h) / 2);
              break;
            case "right":
              o = p - h;
          }
        if (isNaN(r))
          switch (((r = r || "center"), r + "")) {
            case "center":
              n = Math.floor((c - l) / 2);
              break;
            case "bottom":
              n = c - l;
          }
        return {
          left: o,
          top: n,
          width: h,
          height: l,
          baseScale: 1,
          scale: { x: m, y: _ },
        };
      },
      _buildMap: function (t, e, i, u) {
        for (
          var g,
            f,
            y,
            m,
            _,
            x,
            v,
            b,
            S,
            z,
            T,
            L = this.series,
            M = this.component.legend,
            C = this.component.dataRange,
            w = 0,
            A = e.length;
          A > w;
          w++
        ) {
          if (
            ((b = c.clone(e[w])),
            (S = { name: b.name, path: b.path, position: c.clone(b.position) }),
            (f = b.name),
            (y = i[f]))
          ) {
            (_ = [y]), (g = "");
            for (var E = 0, O = y.seriesIndex.length; O > E; E++)
              _.push(L[y.seriesIndex[E]]),
                (g += L[y.seriesIndex[E]].name + " "),
                M &&
                  this._showLegendSymbol[t] &&
                  M.hasColor(L[y.seriesIndex[E]].name) &&
                  this.shapeList.push(
                    new a({
                      zlevel: this.getZlevelBase(),
                      z: this.getZBase() + 1,
                      position: c.clone(b.position),
                      _mapType: t,
                      style: {
                        x: b.textX + 3 + 7 * E,
                        y: b.textY - 10,
                        r: 3,
                        color: M.getColor(L[y.seriesIndex[E]].name),
                      },
                      hoverable: !1,
                    })
                  );
            m = y.value;
          } else {
            (y = "-"), (g = ""), (_ = []);
            for (var k in u) _.push(L[k]);
            m = "-";
          }
          switch (
            (this.ecTheme.map && _.push(this.ecTheme.map),
            _.push(d),
            (x = C && !isNaN(m) ? C.getColor(m) : null),
            (b.color =
              b.color ||
              x ||
              this.getItemStyleColor(
                this.deepQuery(_, "itemStyle.normal.color"),
                y.seriesIndex,
                -1,
                y
              ) ||
              this.deepQuery(_, "itemStyle.normal.areaStyle.color")),
            (b.strokeColor =
              b.strokeColor ||
              this.deepQuery(_, "itemStyle.normal.borderColor")),
            (b.lineWidth =
              b.lineWidth || this.deepQuery(_, "itemStyle.normal.borderWidth")),
            (S.color =
              this.getItemStyleColor(
                this.deepQuery(_, "itemStyle.emphasis.color"),
                y.seriesIndex,
                -1,
                y
              ) ||
              this.deepQuery(_, "itemStyle.emphasis.areaStyle.color") ||
              b.color),
            (S.strokeColor =
              this.deepQuery(_, "itemStyle.emphasis.borderColor") ||
              b.strokeColor),
            (S.lineWidth =
              this.deepQuery(_, "itemStyle.emphasis.borderWidth") ||
              b.lineWidth),
            (b.brushType = S.brushType = b.brushType || "both"),
            (b.lineJoin = S.lineJoin = "round"),
            (b._name = S._name = f),
            (v = this.deepQuery(_, "itemStyle.normal.label.textStyle")),
            (T = {
              zlevel: this.getZlevelBase(),
              z: this.getZBase() + 1,
              position: c.clone(b.position),
              _mapType: t,
              _geo: this.pos2geo(t, [b.textX, b.textY]),
              style: {
                brushType: "fill",
                x: b.textX,
                y: b.textY,
                text: this.getLabelText(f, m, _, "normal"),
                _name: f,
                textAlign: "center",
                color: this.deepQuery(_, "itemStyle.normal.label.show")
                  ? this.deepQuery(_, "itemStyle.normal.label.textStyle.color")
                  : "rgba(0,0,0,0)",
                textFont: this.getFont(v),
              },
            }),
            (T._style = c.clone(T.style)),
            (T.highlightStyle = c.clone(T.style)),
            this.deepQuery(_, "itemStyle.emphasis.label.show")
              ? ((T.highlightStyle.text = this.getLabelText(
                  f,
                  m,
                  _,
                  "emphasis"
                )),
                (T.highlightStyle.color =
                  this.deepQuery(
                    _,
                    "itemStyle.emphasis.label.textStyle.color"
                  ) || T.style.color),
                (v =
                  this.deepQuery(_, "itemStyle.emphasis.label.textStyle") || v),
                (T.highlightStyle.textFont = this.getFont(v)))
              : (T.highlightStyle.color = "rgba(0,0,0,0)"),
            (z = {
              zlevel: this.getZlevelBase(),
              z: this.getZBase(),
              position: c.clone(b.position),
              style: b,
              highlightStyle: S,
              _style: c.clone(b),
              _mapType: t,
            }),
            null != b.scale && (z.scale = c.clone(b.scale)),
            (T = new s(T)),
            z.style.shapeType)
          ) {
            case "rectangle":
              z = new n(z);
              break;
            case "line":
              z = new r(z);
              break;
            case "circle":
              z = new a(z);
              break;
            case "polygon":
              z = new h(z);
              break;
            case "ellipse":
              z = new l(z);
              break;
            default:
              (z = new o(z)),
                z.buildPathArray &&
                  (z.style.pathArray = z.buildPathArray(z.style.path));
          }
          ((this._selectedMode[t] && this._selected[f]) ||
            (y.selected && this._selected[f] !== !1)) &&
            ((T.style = T.highlightStyle), (z.style = z.highlightStyle)),
            (T.clickable = z.clickable =
              this._clickable[t] && (null == y.clickable || y.clickable)),
            this._selectedMode[t] &&
              ((this._selected[f] =
                null != this._selected[f] ? this._selected[f] : y.selected),
              (this._mapTypeMap[f] = t),
              (null == y.selectable || y.selectable) &&
                ((z.clickable = T.clickable = !0),
                (z.onclick = T.onclick = this.shapeHandler.onclick))),
            this._hoverable[t] && (null == y.hoverable || y.hoverable)
              ? ((T.hoverable = z.hoverable = !0),
                (z.hoverConnect = T.id),
                (T.hoverConnect = z.id))
              : (T.hoverable = z.hoverable = !1),
            p.pack(
              T,
              { name: g, tooltip: this.deepQuery(_, "tooltip") },
              0,
              y,
              0,
              f
            ),
            this.shapeList.push(T),
            p.pack(
              z,
              { name: g, tooltip: this.deepQuery(_, "tooltip") },
              0,
              y,
              0,
              f
            ),
            this.shapeList.push(z);
        }
      },
      _buildMark: function (t, e) {
        (this._seriesIndexToMapType = this._seriesIndexToMapType || {}),
          (this.markAttachStyle = this.markAttachStyle || {});
        var i = [
          this._mapDataMap[t].transform.left,
          this._mapDataMap[t].transform.top,
        ];
        "none" == t && (i = [0, 0]);
        for (var s in e)
          (this._seriesIndexToMapType[s] = t),
            (this.markAttachStyle[s] = { position: i, _mapType: t }),
            this.buildMark(s);
      },
      getMarkCoord: function (t, e) {
        return e.geoCoord || m[e.name]
          ? this.geo2pos(this._seriesIndexToMapType[t], e.geoCoord || m[e.name])
          : [0, 0];
      },
      getMarkGeo: function (t) {
        return t.geoCoord || m[t.name];
      },
      _nameChange: function (t, e) {
        return this._nameMap[t][e] || e;
      },
      getLabelText: function (t, e, i, s) {
        var o = this.deepQuery(i, "itemStyle." + s + ".label.formatter");
        return o
          ? "function" == typeof o
            ? o.call(this.myChart, t, e)
            : "string" == typeof o
            ? ((o = o.replace("{a}", "{a0}").replace("{b}", "{b0}")),
              (o = o.replace("{a0}", t).replace("{b0}", e)))
            : void 0
          : t;
      },
      _findMapTypeByPos: function (t, e) {
        var i, s, o, a, n;
        for (var r in this._mapDataMap)
          if (
            ((i = this._mapDataMap[r].transform),
            i &&
              this._roamMap[r] &&
              this._activeMapType[r] &&
              ((s = i.left),
              (o = i.top),
              (a = i.width),
              (n = i.height),
              t >= s && s + a >= t && e >= o && o + n >= e))
          )
            return r;
      },
      __onmousewheel: function (t) {
        if (!(this.shapeList.length <= 0)) {
          var e,
            i,
            s = t.event,
            o = g.getX(s),
            a = g.getY(s),
            n = g.getDelta(s),
            r = t.mapTypeControl;
          r ||
            ((r = {}),
            (i = this._findMapTypeByPos(o, a)),
            i && this._roamMap[i] && "move" != this._roamMap[i] && (r[i] = !0));
          var h = !1;
          for (i in r)
            if (r[i]) {
              h = !0;
              var l = this._mapDataMap[i].transform,
                p = l.left,
                c = l.top,
                u = l.width,
                f = l.height,
                y = this.pos2geo(i, [o - p, a - c]);
              if (n > 0) {
                if (
                  ((e = 1.2),
                  null != this._scaleLimitMap[i].max &&
                    l.baseScale >= this._scaleLimitMap[i].max)
                )
                  continue;
              } else if (
                ((e = 1 / 1.2),
                null != this._scaleLimitMap[i].min &&
                  l.baseScale <= this._scaleLimitMap[i].min)
              )
                continue;
              (l.baseScale *= e),
                (l.scale.x *= e),
                (l.scale.y *= e),
                (l.width = u * e),
                (l.height = f * e),
                (this._mapDataMap[i].hasRoam = !0),
                (this._mapDataMap[i].transform = l),
                (y = this.geo2pos(i, y)),
                (l.left -= y[0] - (o - p)),
                (l.top -= y[1] - (a - c)),
                (this._mapDataMap[i].transform = l),
                this.clearEffectShape(!0);
              for (var m = 0, _ = this.shapeList.length; _ > m; m++)
                this.shapeList[m]._mapType == i &&
                  ((this.shapeList[m].position[0] = l.left),
                  (this.shapeList[m].position[1] = l.top),
                  "path" == this.shapeList[m].type ||
                  "symbol" == this.shapeList[m].type ||
                  "circle" == this.shapeList[m].type ||
                  "rectangle" == this.shapeList[m].type ||
                  "polygon" == this.shapeList[m].type ||
                  "line" == this.shapeList[m].type ||
                  "ellipse" == this.shapeList[m].type
                    ? ((this.shapeList[m].scale[0] *= e),
                      (this.shapeList[m].scale[1] *= e))
                    : "mark-line" == this.shapeList[m].type
                    ? ((this.shapeList[m].style.pointListLength = void 0),
                      (this.shapeList[m].style.pointList = !1),
                      (y = this.geo2pos(i, this.shapeList[m]._geo[0])),
                      (this.shapeList[m].style.xStart = y[0]),
                      (this.shapeList[m].style.yStart = y[1]),
                      (y = this.geo2pos(i, this.shapeList[m]._geo[1])),
                      (this.shapeList[m]._x = this.shapeList[m].style.xEnd =
                        y[0]),
                      (this.shapeList[m]._y = this.shapeList[m].style.yEnd =
                        y[1]))
                    : "icon" == this.shapeList[m].type ||
                      "image" == this.shapeList[m].type
                    ? ((y = this.geo2pos(i, this.shapeList[m]._geo)),
                      (this.shapeList[m].style.x = this.shapeList[m].style._x =
                        y[0] - this.shapeList[m].style.width / 2),
                      (this.shapeList[m].style.y = this.shapeList[m].style._y =
                        y[1] - this.shapeList[m].style.height / 2))
                    : ((y = this.geo2pos(i, this.shapeList[m]._geo)),
                      (this.shapeList[m].style.x = y[0]),
                      (this.shapeList[m].style.y = y[1]),
                      "text" == this.shapeList[m].type &&
                        ((this.shapeList[m]._style.x = this.shapeList[
                          m
                        ].highlightStyle.x = y[0]),
                        (this.shapeList[m]._style.y = this.shapeList[
                          m
                        ].highlightStyle.y = y[1]))),
                  this.zr.modShape(this.shapeList[m].id));
            }
          if (h) {
            g.stop(s), this.zr.refreshNextFrame();
            var x = this;
            clearTimeout(this._refreshDelayTicket),
              (this._refreshDelayTicket = setTimeout(function () {
                x && x.shapeList && x.animationEffect();
              }, 100)),
              this.messageCenter.dispatch(
                d.EVENT.MAP_ROAM,
                t.event,
                { type: "scale" },
                this.myChart
              );
          }
        }
      },
      __onmousedown: function (t) {
        if (!(this.shapeList.length <= 0)) {
          var e = t.target;
          if (!e || !e.draggable) {
            var i = t.event,
              s = g.getX(i),
              o = g.getY(i),
              a = this._findMapTypeByPos(s, o);
            if (a && this._roamMap[a] && "scale" != this._roamMap[a]) {
              (this._mousedown = !0),
                (this._mx = s),
                (this._my = o),
                (this._curMapType = a),
                this.zr.on(u.EVENT.MOUSEUP, this._onmouseup);
              var n = this;
              setTimeout(function () {
                n.zr.on(u.EVENT.MOUSEMOVE, n._onmousemove);
              }, 100);
            }
          }
        }
      },
      __onmousemove: function (t) {
        if (this._mousedown && this._isAlive) {
          var e = t.event,
            i = g.getX(e),
            s = g.getY(e),
            o = this._mapDataMap[this._curMapType].transform;
          (o.hasRoam = !0),
            (o.left -= this._mx - i),
            (o.top -= this._my - s),
            (this._mx = i),
            (this._my = s),
            (this._mapDataMap[this._curMapType].transform = o);
          for (var a = 0, n = this.shapeList.length; n > a; a++)
            this.shapeList[a]._mapType == this._curMapType &&
              ((this.shapeList[a].position[0] = o.left),
              (this.shapeList[a].position[1] = o.top),
              this.zr.modShape(this.shapeList[a].id));
          this.messageCenter.dispatch(
            d.EVENT.MAP_ROAM,
            t.event,
            { type: "move" },
            this.myChart
          ),
            this.clearEffectShape(!0),
            this.zr.refreshNextFrame(),
            (this._justMove = !0),
            g.stop(e);
        }
      },
      __onmouseup: function (t) {
        var e = t.event;
        (this._mx = g.getX(e)), (this._my = g.getY(e)), (this._mousedown = !1);
        var i = this;
        setTimeout(function () {
          i._justMove && i.animationEffect(),
            (i._justMove = !1),
            i.zr.un(u.EVENT.MOUSEMOVE, i._onmousemove),
            i.zr.un(u.EVENT.MOUSEUP, i._onmouseup);
        }, 120);
      },
      __onroamcontroller: function (t) {
        var e = t.event;
        (e.zrenderX = this.zr.getWidth() / 2),
          (e.zrenderY = this.zr.getHeight() / 2);
        var i = t.mapTypeControl,
          s = 0,
          o = 0,
          a = t.step;
        switch (t.roamType) {
          case "scaleUp":
            return (
              (e.zrenderDelta = 1),
              void this.__onmousewheel({ event: e, mapTypeControl: i })
            );
          case "scaleDown":
            return (
              (e.zrenderDelta = -1),
              void this.__onmousewheel({ event: e, mapTypeControl: i })
            );
          case "up":
            s = -a;
            break;
          case "down":
            s = a;
            break;
          case "left":
            o = -a;
            break;
          case "right":
            o = a;
        }
        var n, r;
        for (r in i)
          this._mapDataMap[r] &&
            this._activeMapType[r] &&
            ((n = this._mapDataMap[r].transform),
            (n.hasRoam = !0),
            (n.left -= o),
            (n.top -= s),
            (this._mapDataMap[r].transform = n));
        for (var h = 0, l = this.shapeList.length; l > h; h++)
          (r = this.shapeList[h]._mapType),
            i[r] &&
              this._activeMapType[r] &&
              ((n = this._mapDataMap[r].transform),
              (this.shapeList[h].position[0] = n.left),
              (this.shapeList[h].position[1] = n.top),
              this.zr.modShape(this.shapeList[h].id));
        this.messageCenter.dispatch(
          d.EVENT.MAP_ROAM,
          t.event,
          { type: "move" },
          this.myChart
        ),
          this.clearEffectShape(!0),
          this.zr.refreshNextFrame(),
          clearTimeout(this.dircetionTimer);
        var p = this;
        this.dircetionTimer = setTimeout(function () {
          p.animationEffect();
        }, 150);
      },
      __ondrhoverlink: function (t) {
        for (var e, i, s = 0, o = this.shapeList.length; o > s; s++)
          (e = this.shapeList[s]._mapType),
            this._hoverLinkMap[e] &&
              this._activeMapType[e] &&
              ((i = p.get(this.shapeList[s], "value")),
              null != i &&
                i >= t.valueMin &&
                i <= t.valueMax &&
                this.zr.addHoverShape(this.shapeList[s]));
      },
      onclick: function (t) {
        if (
          this.isClick &&
          t.target &&
          !this._justMove &&
          "icon" != t.target.type
        ) {
          this.isClick = !1;
          var e = t.target,
            i = e.style._name,
            s = this.shapeList.length,
            o = e._mapType || "";
          if ("single" == this._selectedMode[o])
            for (var a in this._selected)
              if (this._selected[a] && this._mapTypeMap[a] == o) {
                for (var n = 0; s > n; n++)
                  this.shapeList[n].style._name == a &&
                    this.shapeList[n]._mapType == o &&
                    ((this.shapeList[n].style = this.shapeList[n]._style),
                    this.zr.modShape(this.shapeList[n].id));
                a != i && (this._selected[a] = !1);
              }
          this._selected[i] = !this._selected[i];
          for (var n = 0; s > n; n++)
            this.shapeList[n].style._name == i &&
              this.shapeList[n]._mapType == o &&
              ((this.shapeList[n].style = this._selected[i]
                ? this.shapeList[n].highlightStyle
                : this.shapeList[n]._style),
              this.zr.modShape(this.shapeList[n].id));
          this.messageCenter.dispatch(
            d.EVENT.MAP_SELECTED,
            t.event,
            { selected: this._selected, target: i },
            this.myChart
          ),
            this.zr.refreshNextFrame();
          var r = this;
          setTimeout(function () {
            r.zr.trigger(u.EVENT.MOUSEMOVE, t.event);
          }, 100);
        }
      },
      refresh: function (t) {
        t && ((this.option = t), (this.series = t.series)),
          this._mapDataRequireCounter > 0
            ? this.clear()
            : this.backupShapeList(),
          this._buildShape(),
          this.zr.refreshHover();
      },
      ondataRange: function (t, e) {
        this.component.dataRange && (this.refresh(), (e.needRefresh = !0));
      },
      pos2geo: function (t, e) {
        return this._mapDataMap[t].transform
          ? this._mapDataMap[t].projection.pos2geo(
              this._mapDataMap[t].transform,
              e
            )
          : null;
      },
      getGeoByPos: function (t, e) {
        if (!this._mapDataMap[t].transform) return null;
        var i = [
          this._mapDataMap[t].transform.left,
          this._mapDataMap[t].transform.top,
        ];
        return (
          e instanceof Array
            ? ((e[0] -= i[0]), (e[1] -= i[1]))
            : ((e.x -= i[0]), (e.y -= i[1])),
          this.pos2geo(t, e)
        );
      },
      geo2pos: function (t, e) {
        return this._mapDataMap[t].transform
          ? this._mapDataMap[t].projection.geo2pos(
              this._mapDataMap[t].transform,
              e
            )
          : null;
      },
      getPosByGeo: function (t, e) {
        if (!this._mapDataMap[t].transform) return null;
        var i = this.geo2pos(t, e);
        return (
          (i[0] += this._mapDataMap[t].transform.left),
          (i[1] += this._mapDataMap[t].transform.top),
          i
        );
      },
      getMapPosition: function (t) {
        return this._mapDataMap[t].transform
          ? [
              this._mapDataMap[t].transform.left,
              this._mapDataMap[t].transform.top,
            ]
          : null;
      },
      onbeforDispose: function () {
        (this._isAlive = !1),
          this.zr.un(u.EVENT.MOUSEWHEEL, this._onmousewheel),
          this.zr.un(u.EVENT.MOUSEDOWN, this._onmousedown),
          this.messageCenter.unbind(
            d.EVENT.ROAMCONTROLLER,
            this._onroamcontroller
          ),
          this.messageCenter.unbind(
            d.EVENT.DATA_RANGE_HOVERLINK,
            this._ondrhoverlink
          );
      },
    }),
    c.inherits(e, i),
    t("../chart").define("map", e),
    e
  );
}),
  define("zrender/shape/Path", [
    "require",
    "./Base",
    "./util/PathProxy",
    "../tool/util",
  ], function (t) {
    var e = t("./Base"),
      i = t("./util/PathProxy"),
      s = i.PathSegment,
      o = function (t) {
        return Math.sqrt(t[0] * t[0] + t[1] * t[1]);
      },
      a = function (t, e) {
        return (t[0] * e[0] + t[1] * e[1]) / (o(t) * o(e));
      },
      n = function (t, e) {
        return (t[0] * e[1] < t[1] * e[0] ? -1 : 1) * Math.acos(a(t, e));
      },
      r = function (t) {
        e.call(this, t);
      };
    return (
      (r.prototype = {
        type: "path",
        buildPathArray: function (t, e, i) {
          if (!t) return [];
          (e = e || 0), (i = i || 0);
          var o = t,
            a = [
              "m",
              "M",
              "l",
              "L",
              "v",
              "V",
              "h",
              "H",
              "z",
              "Z",
              "c",
              "C",
              "q",
              "Q",
              "t",
              "T",
              "s",
              "S",
              "a",
              "A",
            ];
          (o = o.replace(/-/g, " -")),
            (o = o.replace(/  /g, " ")),
            (o = o.replace(/ /g, ",")),
            (o = o.replace(/,,/g, ","));
          var n;
          for (n = 0; n < a.length; n++)
            o = o.replace(new RegExp(a[n], "g"), "|" + a[n]);
          var r = o.split("|"),
            h = [],
            l = 0,
            d = 0;
          for (n = 1; n < r.length; n++) {
            var p = r[n],
              c = p.charAt(0);
            (p = p.slice(1)), (p = p.replace(new RegExp("e,-", "g"), "e-"));
            var u = p.split(",");
            u.length > 0 && "" === u[0] && u.shift();
            for (var g = 0; g < u.length; g++) u[g] = parseFloat(u[g]);
            for (; u.length > 0 && !isNaN(u[0]); ) {
              var f,
                y,
                m,
                _,
                x,
                v,
                b,
                S,
                z = null,
                T = [],
                L = l,
                M = d;
              switch (c) {
                case "l":
                  (l += u.shift()), (d += u.shift()), (z = "L"), T.push(l, d);
                  break;
                case "L":
                  (l = u.shift()), (d = u.shift()), T.push(l, d);
                  break;
                case "m":
                  (l += u.shift()),
                    (d += u.shift()),
                    (z = "M"),
                    T.push(l, d),
                    (c = "l");
                  break;
                case "M":
                  (l = u.shift()),
                    (d = u.shift()),
                    (z = "M"),
                    T.push(l, d),
                    (c = "L");
                  break;
                case "h":
                  (l += u.shift()), (z = "L"), T.push(l, d);
                  break;
                case "H":
                  (l = u.shift()), (z = "L"), T.push(l, d);
                  break;
                case "v":
                  (d += u.shift()), (z = "L"), T.push(l, d);
                  break;
                case "V":
                  (d = u.shift()), (z = "L"), T.push(l, d);
                  break;
                case "C":
                  T.push(u.shift(), u.shift(), u.shift(), u.shift()),
                    (l = u.shift()),
                    (d = u.shift()),
                    T.push(l, d);
                  break;
                case "c":
                  T.push(
                    l + u.shift(),
                    d + u.shift(),
                    l + u.shift(),
                    d + u.shift()
                  ),
                    (l += u.shift()),
                    (d += u.shift()),
                    (z = "C"),
                    T.push(l, d);
                  break;
                case "S":
                  (f = l),
                    (y = d),
                    (m = h[h.length - 1]),
                    "C" === m.command &&
                      ((f = l + (l - m.points[2])),
                      (y = d + (d - m.points[3]))),
                    T.push(f, y, u.shift(), u.shift()),
                    (l = u.shift()),
                    (d = u.shift()),
                    (z = "C"),
                    T.push(l, d);
                  break;
                case "s":
                  (f = l),
                    (y = d),
                    (m = h[h.length - 1]),
                    "C" === m.command &&
                      ((f = l + (l - m.points[2])),
                      (y = d + (d - m.points[3]))),
                    T.push(f, y, l + u.shift(), d + u.shift()),
                    (l += u.shift()),
                    (d += u.shift()),
                    (z = "C"),
                    T.push(l, d);
                  break;
                case "Q":
                  T.push(u.shift(), u.shift()),
                    (l = u.shift()),
                    (d = u.shift()),
                    T.push(l, d);
                  break;
                case "q":
                  T.push(l + u.shift(), d + u.shift()),
                    (l += u.shift()),
                    (d += u.shift()),
                    (z = "Q"),
                    T.push(l, d);
                  break;
                case "T":
                  (f = l),
                    (y = d),
                    (m = h[h.length - 1]),
                    "Q" === m.command &&
                      ((f = l + (l - m.points[0])),
                      (y = d + (d - m.points[1]))),
                    (l = u.shift()),
                    (d = u.shift()),
                    (z = "Q"),
                    T.push(f, y, l, d);
                  break;
                case "t":
                  (f = l),
                    (y = d),
                    (m = h[h.length - 1]),
                    "Q" === m.command &&
                      ((f = l + (l - m.points[0])),
                      (y = d + (d - m.points[1]))),
                    (l += u.shift()),
                    (d += u.shift()),
                    (z = "Q"),
                    T.push(f, y, l, d);
                  break;
                case "A":
                  (_ = u.shift()),
                    (x = u.shift()),
                    (v = u.shift()),
                    (b = u.shift()),
                    (S = u.shift()),
                    (L = l),
                    (M = d),
                    (l = u.shift()),
                    (d = u.shift()),
                    (z = "A"),
                    (T = this._convertPoint(L, M, l, d, b, S, _, x, v));
                  break;
                case "a":
                  (_ = u.shift()),
                    (x = u.shift()),
                    (v = u.shift()),
                    (b = u.shift()),
                    (S = u.shift()),
                    (L = l),
                    (M = d),
                    (l += u.shift()),
                    (d += u.shift()),
                    (z = "A"),
                    (T = this._convertPoint(L, M, l, d, b, S, _, x, v));
              }
              for (var C = 0, w = T.length; w > C; C += 2)
                (T[C] += e), (T[C + 1] += i);
              h.push(new s(z || c, T));
            }
            ("z" === c || "Z" === c) && h.push(new s("z", []));
          }
          return h;
        },
        _convertPoint: function (t, e, i, s, o, r, h, l, d) {
          var p = d * (Math.PI / 180),
            c = (Math.cos(p) * (t - i)) / 2 + (Math.sin(p) * (e - s)) / 2,
            u = (-1 * Math.sin(p) * (t - i)) / 2 + (Math.cos(p) * (e - s)) / 2,
            g = (c * c) / (h * h) + (u * u) / (l * l);
          g > 1 && ((h *= Math.sqrt(g)), (l *= Math.sqrt(g)));
          var f = Math.sqrt(
            (h * h * l * l - h * h * u * u - l * l * c * c) /
              (h * h * u * u + l * l * c * c)
          );
          o === r && (f *= -1), isNaN(f) && (f = 0);
          var y = (f * h * u) / l,
            m = (f * -l * c) / h,
            _ = (t + i) / 2 + Math.cos(p) * y - Math.sin(p) * m,
            x = (e + s) / 2 + Math.sin(p) * y + Math.cos(p) * m,
            v = n([1, 0], [(c - y) / h, (u - m) / l]),
            b = [(c - y) / h, (u - m) / l],
            S = [(-1 * c - y) / h, (-1 * u - m) / l],
            z = n(b, S);
          return (
            a(b, S) <= -1 && (z = Math.PI),
            a(b, S) >= 1 && (z = 0),
            0 === r && z > 0 && (z -= 2 * Math.PI),
            1 === r && 0 > z && (z += 2 * Math.PI),
            [_, x, h, l, v, z, p, r]
          );
        },
        buildPath: function (t, e) {
          var i = e.path,
            s = e.x || 0,
            o = e.y || 0;
          e.pathArray = e.pathArray || this.buildPathArray(i, s, o);
          for (
            var a = e.pathArray,
              n = (e.pointList = []),
              r = [],
              h = 0,
              l = a.length;
            l > h;
            h++
          ) {
            "M" == a[h].command.toUpperCase() &&
              (r.length > 0 && n.push(r), (r = []));
            for (var d = a[h].points, p = 0, c = d.length; c > p; p += 2)
              r.push([d[p], d[p + 1]]);
          }
          r.length > 0 && n.push(r);
          for (var h = 0, l = a.length; l > h; h++) {
            var u = a[h].command,
              d = a[h].points;
            switch (u) {
              case "L":
                t.lineTo(d[0], d[1]);
                break;
              case "M":
                t.moveTo(d[0], d[1]);
                break;
              case "C":
                t.bezierCurveTo(d[0], d[1], d[2], d[3], d[4], d[5]);
                break;
              case "Q":
                t.quadraticCurveTo(d[0], d[1], d[2], d[3]);
                break;
              case "A":
                var g = d[0],
                  f = d[1],
                  y = d[2],
                  m = d[3],
                  _ = d[4],
                  x = d[5],
                  v = d[6],
                  b = d[7],
                  S = y > m ? y : m,
                  z = y > m ? 1 : y / m,
                  T = y > m ? m / y : 1;
                t.translate(g, f),
                  t.rotate(v),
                  t.scale(z, T),
                  t.arc(0, 0, S, _, _ + x, 1 - b),
                  t.scale(1 / z, 1 / T),
                  t.rotate(-v),
                  t.translate(-g, -f);
                break;
              case "z":
                t.closePath();
            }
          }
        },
        getRect: function (t) {
          if (t.__rect) return t.__rect;
          var e;
          e =
            "stroke" == t.brushType || "fill" == t.brushType
              ? t.lineWidth || 1
              : 0;
          for (
            var i = Number.MAX_VALUE,
              s = Number.MIN_VALUE,
              o = Number.MAX_VALUE,
              a = Number.MIN_VALUE,
              n = t.x || 0,
              r = t.y || 0,
              h = t.pathArray || this.buildPathArray(t.path),
              l = 0;
            l < h.length;
            l++
          )
            for (var d = h[l].points, p = 0; p < d.length; p++)
              p % 2 === 0
                ? (d[p] + n < i && (i = d[p]), d[p] + n > s && (s = d[p]))
                : (d[p] + r < o && (o = d[p]), d[p] + r > a && (a = d[p]));
          var c;
          return (
            (c =
              i === Number.MAX_VALUE ||
              s === Number.MIN_VALUE ||
              o === Number.MAX_VALUE ||
              a === Number.MIN_VALUE
                ? { x: 0, y: 0, width: 0, height: 0 }
                : {
                    x: Math.round(i - e / 2),
                    y: Math.round(o - e / 2),
                    width: s - i + e,
                    height: a - o + e,
                  }),
            (t.__rect = c),
            c
          );
        },
      }),
      t("../tool/util").inherits(r, e),
      r
    );
  }),
  define("zrender/shape/Ellipse", [
    "require",
    "./Base",
    "../tool/util",
  ], function (t) {
    var e = t("./Base"),
      i = function (t) {
        e.call(this, t);
      };
    return (
      (i.prototype = {
        type: "ellipse",
        buildPath: function (t, e) {
          var i = 0.5522848,
            s = e.x,
            o = e.y,
            a = e.a,
            n = e.b,
            r = a * i,
            h = n * i;
          t.moveTo(s - a, o),
            t.bezierCurveTo(s - a, o - h, s - r, o - n, s, o - n),
            t.bezierCurveTo(s + r, o - n, s + a, o - h, s + a, o),
            t.bezierCurveTo(s + a, o + h, s + r, o + n, s, o + n),
            t.bezierCurveTo(s - r, o + n, s - a, o + h, s - a, o),
            t.closePath();
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
              x: Math.round(t.x - t.a - e / 2),
              y: Math.round(t.y - t.b - e / 2),
              width: 2 * t.a + e,
              height: 2 * t.b + e,
            }),
            t.__rect
          );
        },
      }),
      t("../tool/util").inherits(i, e),
      i
    );
  }),
  define("echarts/component/dataRange", [
    "require",
    "./base",
    "zrender/shape/Text",
    "zrender/shape/Rectangle",
    "../util/shape/HandlePolygon",
    "../config",
    "zrender/tool/util",
    "zrender/tool/event",
    "zrender/tool/area",
    "zrender/tool/color",
    "../component",
  ], function (t) {
    function e(t, e, s, o, a) {
      if (
        "undefined" == typeof this.query(o, "dataRange.min") ||
        "undefined" == typeof this.query(o, "dataRange.max")
      )
        return void console.error(
          "option.dataRange.min or option.dataRange.max has not been defined."
        );
      i.call(this, t, e, s, o, a);
      var r = this;
      (r._ondrift = function (t, e) {
        return r.__ondrift(this, t, e);
      }),
        (r._ondragend = function () {
          return r.__ondragend();
        }),
        (r._dataRangeSelected = function (t) {
          return r.__dataRangeSelected(t);
        }),
        (r._dispatchHoverLink = function (t) {
          return r.__dispatchHoverLink(t);
        }),
        (r._onhoverlink = function (t) {
          return r.__onhoverlink(t);
        }),
        (this._selectedMap = {}),
        (this._range = {}),
        this.refresh(o),
        e.bind(n.EVENT.HOVER, this._onhoverlink);
    }
    var i = t("./base"),
      s = t("zrender/shape/Text"),
      o = t("zrender/shape/Rectangle"),
      a = t("../util/shape/HandlePolygon"),
      n = t("../config");
    n.dataRange = {
      zlevel: 0,
      z: 4,
      show: !0,
      orient: "vertical",
      x: "left",
      y: "bottom",
      backgroundColor: "rgba(0,0,0,0)",
      borderColor: "#ccc",
      borderWidth: 0,
      padding: 1,
      itemGap: 15,
      itemWidth: 25,
      itemHeight: 25,
      precision: 0,
      splitNumber: 5,
      calculable: !1,
      selectedMode: !0,
      hoverLink: !0,
      realtime: !0,
      color: ["#006edd", "#e0ffff"],
      textStyle: { fontSize: 18, color: "#333" },
    };
    var r = t("zrender/tool/util"),
      h = t("zrender/tool/event"),
      l = t("zrender/tool/area"),
      d = t("zrender/tool/color");
    return (
      (e.prototype = {
        type: n.COMPONENT_TYPE_DATARANGE,
        _textGap: 10,
        _buildShape: function () {
          if (
            ((this._itemGroupLocation = this._getItemGroupLocation()),
            this._buildBackground(),
            this.dataRangeOption.splitNumber <= 0 ||
            this.dataRangeOption.calculable
              ? this._buildGradient()
              : this._buildItem(),
            this.dataRangeOption.show)
          )
            for (var t = 0, e = this.shapeList.length; e > t; t++)
              this.zr.addShape(this.shapeList[t]);
          this._syncShapeFromRange();
        },
        _buildItem: function () {
          var t,
            e,
            i,
            a,
            n = this._valueTextList,
            r = n.length,
            h = this.getFont(this.dataRangeOption.textStyle),
            d = this._itemGroupLocation.x,
            p = this._itemGroupLocation.y,
            c = this.dataRangeOption.itemWidth,
            u = this.dataRangeOption.itemHeight,
            g = this.dataRangeOption.itemGap,
            f = l.getTextHeight("国", h);
          "vertical" == this.dataRangeOption.orient &&
            "right" == this.dataRangeOption.x &&
            (d = this._itemGroupLocation.x + this._itemGroupLocation.width - c);
          var y = !0;
          this.dataRangeOption.text &&
            ((y = !1),
            this.dataRangeOption.text[0] &&
              ((i = this._getTextShape(d, p, this.dataRangeOption.text[0])),
              "horizontal" == this.dataRangeOption.orient
                ? (d +=
                    l.getTextWidth(this.dataRangeOption.text[0], h) +
                    this._textGap)
                : ((p += f + this._textGap),
                  (i.style.y += f / 2 + this._textGap),
                  (i.style.textBaseline = "bottom")),
              this.shapeList.push(new s(i))));
          for (var m = 0; r > m; m++)
            (t = n[m]),
              (a = this.getColorByIndex(m)),
              (e = this._getItemShape(
                d,
                p,
                c,
                u,
                this._selectedMap[m] ? a : "#ccc"
              )),
              (e._idx = m),
              (e.onmousemove = this._dispatchHoverLink),
              this.dataRangeOption.selectedMode &&
                ((e.clickable = !0), (e.onclick = this._dataRangeSelected)),
              this.shapeList.push(new o(e)),
              y &&
                ((i = {
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  style: {
                    x: d + c + 5,
                    y: p,
                    color: this._selectedMap[m]
                      ? this.dataRangeOption.textStyle.color
                      : "#ccc",
                    text: n[m],
                    textFont: h,
                    textBaseline: "top",
                  },
                  highlightStyle: { brushType: "fill" },
                }),
                "vertical" == this.dataRangeOption.orient &&
                  "right" == this.dataRangeOption.x &&
                  ((i.style.x -= c + 10), (i.style.textAlign = "right")),
                (i._idx = m),
                (i.onmousemove = this._dispatchHoverLink),
                this.dataRangeOption.selectedMode &&
                  ((i.clickable = !0), (i.onclick = this._dataRangeSelected)),
                this.shapeList.push(new s(i))),
              "horizontal" == this.dataRangeOption.orient
                ? (d += c + (y ? 5 : 0) + (y ? l.getTextWidth(t, h) : 0) + g)
                : (p += u + g);
          !y &&
            this.dataRangeOption.text[1] &&
            ("horizontal" == this.dataRangeOption.orient
              ? (d = d - g + this._textGap)
              : (p = p - g + this._textGap),
            (i = this._getTextShape(d, p, this.dataRangeOption.text[1])),
            "horizontal" != this.dataRangeOption.orient &&
              ((i.style.y -= 5), (i.style.textBaseline = "top")),
            this.shapeList.push(new s(i)));
        },
        _buildGradient: function () {
          var e,
            i,
            a = this.getFont(this.dataRangeOption.textStyle),
            n = this._itemGroupLocation.x,
            r = this._itemGroupLocation.y,
            h = this.dataRangeOption.itemWidth,
            d = this.dataRangeOption.itemHeight,
            p = l.getTextHeight("国", a),
            c = 6,
            u = !0;
          this.dataRangeOption.text &&
            ((u = !1),
            this.dataRangeOption.text[0] &&
              ((i = this._getTextShape(n, r, this.dataRangeOption.text[0])),
              "horizontal" == this.dataRangeOption.orient
                ? (n +=
                    l.getTextWidth(this.dataRangeOption.text[0], a) +
                    this._textGap)
                : ((r += p + this._textGap),
                  (i.style.y += p / 2 + this._textGap),
                  (i.style.textBaseline = "bottom")),
              this.shapeList.push(new s(i))));
          for (
            var g = t("zrender/tool/color"),
              f = 1 / (this.dataRangeOption.color.length - 1),
              y = [],
              m = 0,
              _ = this.dataRangeOption.color.length;
            _ > m;
            m++
          )
            y.push([m * f, this.dataRangeOption.color[m]]);
          "horizontal" == this.dataRangeOption.orient
            ? ((e = {
                zlevel: this.getZlevelBase(),
                z: this.getZBase(),
                style: {
                  x: n,
                  y: r,
                  width: h * c,
                  height: d,
                  color: g.getLinearGradient(n, r, n + h * c, r, y),
                },
                hoverable: !1,
              }),
              (n += h * c + this._textGap))
            : ((e = {
                zlevel: this.getZlevelBase(),
                z: this.getZBase(),
                style: {
                  x: n,
                  y: r,
                  width: h,
                  height: d * c,
                  color: g.getLinearGradient(n, r, n, r + d * c, y),
                },
                hoverable: !1,
              }),
              (r += d * c + this._textGap)),
            this.shapeList.push(new o(e)),
            (this._calculableLocation = e.style),
            this.dataRangeOption.calculable &&
              (this._buildFiller(), this._bulidMask(), this._bulidHandle()),
            this._buildIndicator(),
            !u &&
              this.dataRangeOption.text[1] &&
              ((i = this._getTextShape(n, r, this.dataRangeOption.text[1])),
              this.shapeList.push(new s(i)));
        },
        _buildIndicator: function () {
          var t,
            e,
            i = this._calculableLocation.x,
            s = this._calculableLocation.y,
            o = this._calculableLocation.width,
            n = this._calculableLocation.height,
            r = 5;
          "horizontal" == this.dataRangeOption.orient
            ? "bottom" != this.dataRangeOption.y
              ? ((t = [
                  [i, s + n],
                  [i - r, s + n + r],
                  [i + r, s + n + r],
                ]),
                (e = "bottom"))
              : ((t = [
                  [i, s],
                  [i - r, s - r],
                  [i + r, s - r],
                ]),
                (e = "top"))
            : "right" != this.dataRangeOption.x
            ? ((t = [
                [i + o, s],
                [i + o + r, s - r],
                [i + o + r, s + r],
              ]),
              (e = "right"))
            : ((t = [
                [i, s],
                [i - r, s - r],
                [i - r, s + r],
              ]),
              (e = "left")),
            (this._indicatorShape = {
              style: {
                pointList: t,
                color: "#fff",
                __rect: {
                  x: Math.min(t[0][0], t[1][0]),
                  y: Math.min(t[0][1], t[1][1]),
                  width:
                    r * ("horizontal" == this.dataRangeOption.orient ? 2 : 1),
                  height:
                    r * ("horizontal" == this.dataRangeOption.orient ? 1 : 2),
                },
              },
              highlightStyle: {
                brushType: "fill",
                textPosition: e,
                textColor: this.dataRangeOption.textStyle.color,
              },
              hoverable: !1,
            }),
            (this._indicatorShape = new a(this._indicatorShape));
        },
        _buildFiller: function () {
          (this._fillerShape = {
            zlevel: this.getZlevelBase(),
            z: this.getZBase() + 1,
            style: {
              x: this._calculableLocation.x,
              y: this._calculableLocation.y,
              width: this._calculableLocation.width,
              height: this._calculableLocation.height,
              color: "rgba(255,255,255,0)",
            },
            highlightStyle: {
              strokeColor: "rgba(255,255,255,0.5)",
              lineWidth: 1,
            },
            draggable: !0,
            ondrift: this._ondrift,
            ondragend: this._ondragend,
            onmousemove: this._dispatchHoverLink,
            _type: "filler",
          }),
            (this._fillerShape = new o(this._fillerShape)),
            this.shapeList.push(this._fillerShape);
        },
        _bulidHandle: function () {
          var t,
            e,
            i,
            s,
            o,
            n,
            r,
            h,
            d = this._calculableLocation.x,
            p = this._calculableLocation.y,
            c = this._calculableLocation.width,
            u = this._calculableLocation.height,
            g = this.getFont(this.dataRangeOption.textStyle),
            f = l.getTextHeight("国", g),
            y =
              Math.max(
                l.getTextWidth(this._textFormat(this.dataRangeOption.max), g),
                l.getTextWidth(this._textFormat(this.dataRangeOption.min), g)
              ) + 2;
          "horizontal" == this.dataRangeOption.orient
            ? "bottom" != this.dataRangeOption.y
              ? ((t = [
                  [d, p],
                  [d, p + u + f],
                  [d - f, p + u + f],
                  [d - 1, p + u],
                  [d - 1, p],
                ]),
                (e = d - y / 2 - f),
                (i = p + u + f / 2 + 2),
                (s = { x: d - y - f, y: p + u, width: y + f, height: f }),
                (o = [
                  [d + c, p],
                  [d + c, p + u + f],
                  [d + c + f, p + u + f],
                  [d + c + 1, p + u],
                  [d + c + 1, p],
                ]),
                (n = d + c + y / 2 + f),
                (r = i),
                (h = { x: d + c, y: p + u, width: y + f, height: f }))
              : ((t = [
                  [d, p + u],
                  [d, p - f],
                  [d - f, p - f],
                  [d - 1, p],
                  [d - 1, p + u],
                ]),
                (e = d - y / 2 - f),
                (i = p - f / 2 - 2),
                (s = { x: d - y - f, y: p - f, width: y + f, height: f }),
                (o = [
                  [d + c, p + u],
                  [d + c, p - f],
                  [d + c + f, p - f],
                  [d + c + 1, p],
                  [d + c + 1, p + u],
                ]),
                (n = d + c + y / 2 + f),
                (r = i),
                (h = { x: d + c, y: p - f, width: y + f, height: f }))
            : ((y += f),
              "right" != this.dataRangeOption.x
                ? ((t = [
                    [d, p],
                    [d + c + f, p],
                    [d + c + f, p - f],
                    [d + c, p - 1],
                    [d, p - 1],
                  ]),
                  (e = d + c + y / 2 + f / 2),
                  (i = p - f / 2),
                  (s = { x: d + c, y: p - f, width: y + f, height: f }),
                  (o = [
                    [d, p + u],
                    [d + c + f, p + u],
                    [d + c + f, p + f + u],
                    [d + c, p + 1 + u],
                    [d, p + u + 1],
                  ]),
                  (n = e),
                  (r = p + u + f / 2),
                  (h = { x: d + c, y: p + u, width: y + f, height: f }))
                : ((t = [
                    [d + c, p],
                    [d - f, p],
                    [d - f, p - f],
                    [d, p - 1],
                    [d + c, p - 1],
                  ]),
                  (e = d - y / 2 - f / 2),
                  (i = p - f / 2),
                  (s = { x: d - y - f, y: p - f, width: y + f, height: f }),
                  (o = [
                    [d + c, p + u],
                    [d - f, p + u],
                    [d - f, p + f + u],
                    [d, p + 1 + u],
                    [d + c, p + u + 1],
                  ]),
                  (n = e),
                  (r = p + u + f / 2),
                  (h = { x: d - y - f, y: p + u, width: y + f, height: f }))),
            (this._startShape = {
              style: {
                pointList: t,
                text: this._textFormat(this.dataRangeOption.max),
                textX: e,
                textY: i,
                textFont: g,
                color: this.getColor(this.dataRangeOption.max),
                rect: s,
                x: t[0][0],
                y: t[0][1],
                _x: t[0][0],
                _y: t[0][1],
              },
            }),
            (this._startShape.highlightStyle = {
              strokeColor: this._startShape.style.color,
              lineWidth: 1,
            }),
            (this._endShape = {
              style: {
                pointList: o,
                text: this._textFormat(this.dataRangeOption.min),
                textX: n,
                textY: r,
                textFont: g,
                color: this.getColor(this.dataRangeOption.min),
                rect: h,
                x: o[0][0],
                y: o[0][1],
                _x: o[0][0],
                _y: o[0][1],
              },
            }),
            (this._endShape.highlightStyle = {
              strokeColor: this._endShape.style.color,
              lineWidth: 1,
            }),
            (this._startShape.zlevel = this._endShape.zlevel = this.getZlevelBase()),
            (this._startShape.z = this._endShape.z = this.getZBase() + 1),
            (this._startShape.draggable = this._endShape.draggable = !0),
            (this._startShape.ondrift = this._endShape.ondrift = this._ondrift),
            (this._startShape.ondragend = this._endShape.ondragend = this._ondragend),
            (this._startShape.style.textColor = this._endShape.style.textColor = this.dataRangeOption.textStyle.color),
            (this._startShape.style.textAlign = this._endShape.style.textAlign =
              "center"),
            (this._startShape.style.textPosition = this._endShape.style.textPosition =
              "specific"),
            (this._startShape.style.textBaseline = this._endShape.style.textBaseline =
              "middle"),
            (this._startShape.style.width = this._endShape.style.width = 0),
            (this._startShape.style.height = this._endShape.style.height = 0),
            (this._startShape.style.textPosition = this._endShape.style.textPosition =
              "specific"),
            (this._startShape = new a(this._startShape)),
            (this._endShape = new a(this._endShape)),
            this.shapeList.push(this._startShape),
            this.shapeList.push(this._endShape);
        },
        _bulidMask: function () {
          var t = this._calculableLocation.x,
            e = this._calculableLocation.y,
            i = this._calculableLocation.width,
            s = this._calculableLocation.height;
          (this._startMask = {
            zlevel: this.getZlevelBase(),
            z: this.getZBase() + 1,
            style: {
              x: t,
              y: e,
              width: "horizontal" == this.dataRangeOption.orient ? 0 : i,
              height: "horizontal" == this.dataRangeOption.orient ? s : 0,
              color: "#ccc",
            },
            hoverable: !1,
          }),
            (this._endMask = {
              zlevel: this.getZlevelBase(),
              z: this.getZBase() + 1,
              style: {
                x: "horizontal" == this.dataRangeOption.orient ? t + i : t,
                y: "horizontal" == this.dataRangeOption.orient ? e : e + s,
                width: "horizontal" == this.dataRangeOption.orient ? 0 : i,
                height: "horizontal" == this.dataRangeOption.orient ? s : 0,
                color: "#ccc",
              },
              hoverable: !1,
            }),
            (this._startMask = new o(this._startMask)),
            (this._endMask = new o(this._endMask)),
            this.shapeList.push(this._startMask),
            this.shapeList.push(this._endMask);
        },
        _buildBackground: function () {
          var t = this.reformCssArray(this.dataRangeOption.padding);
          this.shapeList.push(
            new o({
              zlevel: this.getZlevelBase(),
              z: this.getZBase(),
              hoverable: !1,
              style: {
                x: this._itemGroupLocation.x - t[3],
                y: this._itemGroupLocation.y - t[0],
                width: this._itemGroupLocation.width + t[3] + t[1],
                height: this._itemGroupLocation.height + t[0] + t[2],
                brushType:
                  0 === this.dataRangeOption.borderWidth ? "fill" : "both",
                color: this.dataRangeOption.backgroundColor,
                strokeColor: this.dataRangeOption.borderColor,
                lineWidth: this.dataRangeOption.borderWidth,
              },
            })
          );
        },
        _getItemGroupLocation: function () {
          var t = this._valueTextList,
            e = t.length,
            i = this.dataRangeOption.itemGap,
            s = this.dataRangeOption.itemWidth,
            o = this.dataRangeOption.itemHeight,
            a = 0,
            n = 0,
            r = this.getFont(this.dataRangeOption.textStyle),
            h = l.getTextHeight("国", r),
            d = 6;
          if ("horizontal" == this.dataRangeOption.orient) {
            if (
              this.dataRangeOption.text ||
              this.dataRangeOption.splitNumber <= 0 ||
              this.dataRangeOption.calculable
            )
              a =
                (this.dataRangeOption.splitNumber <= 0 ||
                this.dataRangeOption.calculable
                  ? s * d + i
                  : e * (s + i)) +
                (this.dataRangeOption.text &&
                "undefined" != typeof this.dataRangeOption.text[0]
                  ? l.getTextWidth(this.dataRangeOption.text[0], r) +
                    this._textGap
                  : 0) +
                (this.dataRangeOption.text &&
                "undefined" != typeof this.dataRangeOption.text[1]
                  ? l.getTextWidth(this.dataRangeOption.text[1], r) +
                    this._textGap
                  : 0);
            else {
              s += 5;
              for (var p = 0; e > p; p++) a += s + l.getTextWidth(t[p], r) + i;
            }
            (a -= i), (n = Math.max(h, o));
          } else {
            var c;
            if (
              this.dataRangeOption.text ||
              this.dataRangeOption.splitNumber <= 0 ||
              this.dataRangeOption.calculable
            )
              (n =
                (this.dataRangeOption.splitNumber <= 0 ||
                this.dataRangeOption.calculable
                  ? o * d + i
                  : e * (o + i)) +
                (this.dataRangeOption.text &&
                "undefined" != typeof this.dataRangeOption.text[0]
                  ? this._textGap + h
                  : 0) +
                (this.dataRangeOption.text &&
                "undefined" != typeof this.dataRangeOption.text[1]
                  ? this._textGap + h
                  : 0)),
                (c = Math.max(
                  l.getTextWidth(
                    (this.dataRangeOption.text &&
                      this.dataRangeOption.text[0]) ||
                      "",
                    r
                  ),
                  l.getTextWidth(
                    (this.dataRangeOption.text &&
                      this.dataRangeOption.text[1]) ||
                      "",
                    r
                  )
                )),
                (a = Math.max(s, c));
            else {
              (n = (o + i) * e), (s += 5), (c = 0);
              for (var p = 0; e > p; p++)
                c = Math.max(c, l.getTextWidth(t[p], r));
              a = s + c;
            }
            n -= i;
          }
          var u,
            g = this.reformCssArray(this.dataRangeOption.padding),
            f = this.zr.getWidth();
          switch (this.dataRangeOption.x) {
            case "center":
              u = Math.floor((f - a) / 2);
              break;
            case "left":
              u = g[3] + this.dataRangeOption.borderWidth;
              break;
            case "right":
              u = f - a - g[1] - this.dataRangeOption.borderWidth;
              break;
            default:
              (u = this.parsePercent(this.dataRangeOption.x, f)),
                (u = isNaN(u) ? 0 : u);
          }
          var y,
            m = this.zr.getHeight();
          switch (this.dataRangeOption.y) {
            case "top":
              y = g[0] + this.dataRangeOption.borderWidth;
              break;
            case "bottom":
              y = m - n - g[2] - this.dataRangeOption.borderWidth;
              break;
            case "center":
              y = Math.floor((m - n) / 2);
              break;
            default:
              (y = this.parsePercent(this.dataRangeOption.y, m)),
                (y = isNaN(y) ? 0 : y);
          }
          if (this.dataRangeOption.calculable) {
            var _ =
              Math.max(
                l.getTextWidth(this.dataRangeOption.max, r),
                l.getTextWidth(this.dataRangeOption.min, r)
              ) + h;
            "horizontal" == this.dataRangeOption.orient
              ? (_ > u && (u = _), u + a + _ > f && (u -= _))
              : (h > y && (y = h), y + n + h > m && (y -= h));
          }
          return { x: u, y: y, width: a, height: n };
        },
        _getTextShape: function (t, e, i) {
          return {
            zlevel: this.getZlevelBase(),
            z: this.getZBase(),
            style: {
              x:
                "horizontal" == this.dataRangeOption.orient
                  ? t
                  : this._itemGroupLocation.x +
                    this._itemGroupLocation.width / 2,
              y:
                "horizontal" == this.dataRangeOption.orient
                  ? this._itemGroupLocation.y +
                    this._itemGroupLocation.height / 2
                  : e,
              color: this.dataRangeOption.textStyle.color,
              text: i,
              textFont: this.getFont(this.dataRangeOption.textStyle),
              textBaseline:
                "horizontal" == this.dataRangeOption.orient ? "middle" : "top",
              textAlign:
                "horizontal" == this.dataRangeOption.orient ? "left" : "center",
            },
            hoverable: !1,
          };
        },
        _getItemShape: function (t, e, i, s, o) {
          return {
            zlevel: this.getZlevelBase(),
            z: this.getZBase(),
            style: { x: t, y: e + 1, width: i, height: s - 2, color: o },
            highlightStyle: { strokeColor: o, lineWidth: 1 },
          };
        },
        __ondrift: function (t, e, i) {
          var s = this._calculableLocation.x,
            o = this._calculableLocation.y,
            a = this._calculableLocation.width,
            n = this._calculableLocation.height;
          return (
            "horizontal" == this.dataRangeOption.orient
              ? t.style.x + e <= s
                ? (t.style.x = s)
                : t.style.x + e + t.style.width >= s + a
                ? (t.style.x = s + a - t.style.width)
                : (t.style.x += e)
              : t.style.y + i <= o
              ? (t.style.y = o)
              : t.style.y + i + t.style.height >= o + n
              ? (t.style.y = o + n - t.style.height)
              : (t.style.y += i),
            "filler" == t._type
              ? this._syncHandleShape()
              : this._syncFillerShape(t),
            this.dataRangeOption.realtime && this._dispatchDataRange(),
            !0
          );
        },
        __ondragend: function () {
          this.isDragend = !0;
        },
        ondragend: function (t, e) {
          this.isDragend &&
            t.target &&
            ((e.dragOut = !0),
            (e.dragIn = !0),
            this.dataRangeOption.realtime || this._dispatchDataRange(),
            (e.needRefresh = !1),
            (this.isDragend = !1));
        },
        _syncShapeFromRange: function () {
          var t = this.dataRangeOption.range || {};
          if (
            ((this._range.end =
              "undefined" != typeof this._range.end
                ? this._range.end
                : "undefined" != typeof t.start
                ? t.start
                : 0),
            (this._range.start =
              "undefined" != typeof this._range.start
                ? this._range.start
                : "undefined" != typeof t.end
                ? t.end
                : 100),
            100 != this._range.start || 0 !== this._range.end)
          ) {
            if ("horizontal" == this.dataRangeOption.orient) {
              var e = this._fillerShape.style.width;
              (this._fillerShape.style.x +=
                (e * (100 - this._range.start)) / 100),
                (this._fillerShape.style.width =
                  (e * (this._range.start - this._range.end)) / 100);
            } else {
              var i = this._fillerShape.style.height;
              (this._fillerShape.style.y +=
                (i * (100 - this._range.start)) / 100),
                (this._fillerShape.style.height =
                  (i * (this._range.start - this._range.end)) / 100);
            }
            this.zr.modShape(this._fillerShape.id), this._syncHandleShape();
          }
        },
        _syncHandleShape: function () {
          var t = this._calculableLocation.x,
            e = this._calculableLocation.y,
            i = this._calculableLocation.width,
            s = this._calculableLocation.height;
          "horizontal" == this.dataRangeOption.orient
            ? ((this._startShape.style.x = this._fillerShape.style.x),
              (this._startMask.style.width = this._startShape.style.x - t),
              (this._endShape.style.x =
                this._fillerShape.style.x + this._fillerShape.style.width),
              (this._endMask.style.x = this._endShape.style.x),
              (this._endMask.style.width = t + i - this._endShape.style.x),
              (this._range.start = Math.ceil(
                100 - ((this._startShape.style.x - t) / i) * 100
              )),
              (this._range.end = Math.floor(
                100 - ((this._endShape.style.x - t) / i) * 100
              )))
            : ((this._startShape.style.y = this._fillerShape.style.y),
              (this._startMask.style.height = this._startShape.style.y - e),
              (this._endShape.style.y =
                this._fillerShape.style.y + this._fillerShape.style.height),
              (this._endMask.style.y = this._endShape.style.y),
              (this._endMask.style.height = e + s - this._endShape.style.y),
              (this._range.start = Math.ceil(
                100 - ((this._startShape.style.y - e) / s) * 100
              )),
              (this._range.end = Math.floor(
                100 - ((this._endShape.style.y - e) / s) * 100
              ))),
            this._syncShape();
        },
        _syncFillerShape: function (t) {
          var e,
            i,
            s = this._calculableLocation.x,
            o = this._calculableLocation.y,
            a = this._calculableLocation.width,
            n = this._calculableLocation.height;
          "horizontal" == this.dataRangeOption.orient
            ? ((e = this._startShape.style.x),
              (i = this._endShape.style.x),
              t.id == this._startShape.id && e >= i
                ? ((i = e), (this._endShape.style.x = e))
                : t.id == this._endShape.id &&
                  e >= i &&
                  ((e = i), (this._startShape.style.x = e)),
              (this._fillerShape.style.x = e),
              (this._fillerShape.style.width = i - e),
              (this._startMask.style.width = e - s),
              (this._endMask.style.x = i),
              (this._endMask.style.width = s + a - i),
              (this._range.start = Math.ceil(100 - ((e - s) / a) * 100)),
              (this._range.end = Math.floor(100 - ((i - s) / a) * 100)))
            : ((e = this._startShape.style.y),
              (i = this._endShape.style.y),
              t.id == this._startShape.id && e >= i
                ? ((i = e), (this._endShape.style.y = e))
                : t.id == this._endShape.id &&
                  e >= i &&
                  ((e = i), (this._startShape.style.y = e)),
              (this._fillerShape.style.y = e),
              (this._fillerShape.style.height = i - e),
              (this._startMask.style.height = e - o),
              (this._endMask.style.y = i),
              (this._endMask.style.height = o + n - i),
              (this._range.start = Math.ceil(100 - ((e - o) / n) * 100)),
              (this._range.end = Math.floor(100 - ((i - o) / n) * 100))),
            this._syncShape();
        },
        _syncShape: function () {
          (this._startShape.position = [
            this._startShape.style.x - this._startShape.style._x,
            this._startShape.style.y - this._startShape.style._y,
          ]),
            (this._startShape.style.text = this._textFormat(
              this._gap * this._range.start + this.dataRangeOption.min
            )),
            (this._startShape.style.color = this._startShape.highlightStyle.strokeColor = this.getColor(
              this._gap * this._range.start + this.dataRangeOption.min
            )),
            (this._endShape.position = [
              this._endShape.style.x - this._endShape.style._x,
              this._endShape.style.y - this._endShape.style._y,
            ]),
            (this._endShape.style.text = this._textFormat(
              this._gap * this._range.end + this.dataRangeOption.min
            )),
            (this._endShape.style.color = this._endShape.highlightStyle.strokeColor = this.getColor(
              this._gap * this._range.end + this.dataRangeOption.min
            )),
            this.zr.modShape(this._startShape.id),
            this.zr.modShape(this._endShape.id),
            this.zr.modShape(this._startMask.id),
            this.zr.modShape(this._endMask.id),
            this.zr.modShape(this._fillerShape.id),
            this.zr.refreshNextFrame();
        },
        _dispatchDataRange: function () {
          this.messageCenter.dispatch(
            n.EVENT.DATA_RANGE,
            null,
            { range: { start: this._range.end, end: this._range.start } },
            this.myChart
          );
        },
        __dataRangeSelected: function (t) {
          if ("single" === this.dataRangeOption.selectedMode)
            for (var e in this._selectedMap) this._selectedMap[e] = !1;
          var i = t.target._idx;
          this._selectedMap[i] = !this._selectedMap[i];
          var s =
            (this._colorList.length - i) * this._gap + this.dataRangeOption.min;
          this.messageCenter.dispatch(
            n.EVENT.DATA_RANGE_SELECTED,
            t.event,
            {
              selected: this._selectedMap,
              target: i,
              valueMax: s,
              valueMin: s - this._gap,
            },
            this.myChart
          ),
            this.messageCenter.dispatch(
              n.EVENT.REFRESH,
              null,
              null,
              this.myChart
            );
        },
        __dispatchHoverLink: function (t) {
          var e, i;
          if (this.dataRangeOption.calculable) {
            var s,
              o = this.dataRangeOption.max - this.dataRangeOption.min;
            (s =
              "horizontal" == this.dataRangeOption.orient
                ? (1 -
                    (h.getX(t.event) - this._calculableLocation.x) /
                      this._calculableLocation.width) *
                  o
                : (1 -
                    (h.getY(t.event) - this._calculableLocation.y) /
                      this._calculableLocation.height) *
                  o),
              (e = s - 0.05 * o),
              (i = s + 0.05 * o);
          } else {
            var a = t.target._idx;
            (i =
              (this._colorList.length - a) * this._gap +
              this.dataRangeOption.min),
              (e = i - this._gap);
          }
          this.messageCenter.dispatch(
            n.EVENT.DATA_RANGE_HOVERLINK,
            t.event,
            { valueMin: e, valueMax: i },
            this.myChart
          );
        },
        __onhoverlink: function (t) {
          if (
            this.dataRangeOption.show &&
            this.dataRangeOption.hoverLink &&
            this._indicatorShape &&
            t &&
            null != t.seriesIndex &&
            null != t.dataIndex
          ) {
            var e = t.value;
            if ("" === e || isNaN(e)) return;
            e < this.dataRangeOption.min
              ? (e = this.dataRangeOption.min)
              : e > this.dataRangeOption.max && (e = this.dataRangeOption.max),
              (this._indicatorShape.position =
                "horizontal" == this.dataRangeOption.orient
                  ? [
                      ((this.dataRangeOption.max - e) /
                        (this.dataRangeOption.max - this.dataRangeOption.min)) *
                        this._calculableLocation.width,
                      0,
                    ]
                  : [
                      0,
                      ((this.dataRangeOption.max - e) /
                        (this.dataRangeOption.max - this.dataRangeOption.min)) *
                        this._calculableLocation.height,
                    ]),
              (this._indicatorShape.style.text = this._textFormat(t.value)),
              (this._indicatorShape.style.color = this.getColor(e)),
              this.zr.addHoverShape(this._indicatorShape);
          }
        },
        _textFormat: function (t, e) {
          if (
            ((t = t.toFixed(this.dataRangeOption.precision)),
            (e = null != e ? e.toFixed(this.dataRangeOption.precision) : ""),
            this.dataRangeOption.formatter)
          ) {
            if ("string" == typeof this.dataRangeOption.formatter)
              return this.dataRangeOption.formatter
                .replace("{value}", t)
                .replace("{value2}", e);
            if ("function" == typeof this.dataRangeOption.formatter)
              return this.dataRangeOption.formatter.call(this.myChart, t, e);
          }
          return "" !== e ? t + " - " + e : t;
        },
        refresh: function (t) {
          if (t) {
            (this.option = t),
              (this.option.dataRange = this.reformOption(
                this.option.dataRange
              )),
              (this.dataRangeOption = this.option.dataRange);
            var e =
              this.dataRangeOption.splitNumber <= 0 ||
              this.dataRangeOption.calculable
                ? 100
                : this.dataRangeOption.splitNumber;
            if (
              ((this._colorList = d.getGradientColors(
                this.dataRangeOption.color,
                Math.max(
                  (e - this.dataRangeOption.color.length) /
                    (this.dataRangeOption.color.length - 1),
                  0
                ) + 1
              )),
              this._colorList.length > e)
            ) {
              for (
                var i = this._colorList.length,
                  s = [this._colorList[0]],
                  o = i / (e - 1),
                  a = 1;
                e - 1 > a;
                a++
              )
                s.push(this._colorList[Math.floor(a * o)]);
              s.push(this._colorList[i - 1]), (this._colorList = s);
            }
            var n = this.dataRangeOption.precision;
            for (
              this._gap =
                (this.dataRangeOption.max - this.dataRangeOption.min) / e;
              this._gap.toFixed(n) - 0 != this._gap && 5 > n;

            )
              n++;
            (this.dataRangeOption.precision = n),
              (this._gap =
                (
                  (this.dataRangeOption.max - this.dataRangeOption.min) /
                  e
                ).toFixed(n) - 0),
              (this._valueTextList = []);
            for (var a = 0; e > a; a++)
              (this._selectedMap[a] = !0),
                this._valueTextList.unshift(
                  this._textFormat(
                    a * this._gap + this.dataRangeOption.min,
                    (a + 1) * this._gap + this.dataRangeOption.min
                  )
                );
          }
          this.clear(), this._buildShape();
        },
        getColor: function (t) {
          if (isNaN(t)) return null;
          if (this.dataRangeOption.min == this.dataRangeOption.max)
            return this._colorList[0];
          if (
            (t < this.dataRangeOption.min
              ? (t = this.dataRangeOption.min)
              : t > this.dataRangeOption.max && (t = this.dataRangeOption.max),
            this.dataRangeOption.calculable &&
              (t - (this._gap * this._range.start + this.dataRangeOption.min) >
                5e-5 ||
                t - (this._gap * this._range.end + this.dataRangeOption.min) <
                  -5e-5))
          )
            return null;
          var e =
            this._colorList.length -
            Math.ceil(
              ((t - this.dataRangeOption.min) /
                (this.dataRangeOption.max - this.dataRangeOption.min)) *
                this._colorList.length
            );
          return (
            e == this._colorList.length && e--,
            this._selectedMap[e] ? this._colorList[e] : null
          );
        },
        getColorByIndex: function (t) {
          return (
            t >= this._colorList.length
              ? (t = this._colorList.length - 1)
              : 0 > t && (t = 0),
            this._colorList[t]
          );
        },
        onbeforDispose: function () {
          this.messageCenter.unbind(n.EVENT.HOVER, this._onhoverlink);
        },
      }),
      r.inherits(e, i),
      t("../component").define("dataRange", e),
      e
    );
  }),
  define("echarts/component/roamController", [
    "require",
    "./base",
    "zrender/shape/Rectangle",
    "zrender/shape/Sector",
    "zrender/shape/Circle",
    "../config",
    "zrender/tool/util",
    "zrender/tool/color",
    "zrender/tool/event",
    "../component",
  ], function (t) {
    function e(t, e, s, o, a) {
      if (o.roamController && o.roamController.show) {
        if (!o.roamController.mapTypeControl)
          return void console.error(
            "option.roamController.mapTypeControl has not been defined."
          );
        i.call(this, t, e, s, o, a), (this.rcOption = o.roamController);
        var n = this;
        (this._drictionMouseDown = function (t) {
          return n.__drictionMouseDown(t);
        }),
          (this._drictionMouseUp = function (t) {
            return n.__drictionMouseUp(t);
          }),
          (this._drictionMouseMove = function (t) {
            return n.__drictionMouseMove(t);
          }),
          (this._drictionMouseOut = function (t) {
            return n.__drictionMouseOut(t);
          }),
          (this._scaleHandler = function (t) {
            return n.__scaleHandler(t);
          }),
          this.refresh(o);
      }
    }
    var i = t("./base"),
      s = t("zrender/shape/Rectangle"),
      o = t("zrender/shape/Sector"),
      a = t("zrender/shape/Circle"),
      n = t("../config");
    n.roamController = {
      zlevel: 0,
      z: 4,
      show: !0,
      x: "left",
      y: "top",
      width: 80,
      height: 120,
      backgroundColor: "rgba(0,0,0,0)",
      borderColor: "#ccc",
      borderWidth: 0,
      padding: 1,
      handleColor: "#6495ed",
      fillerColor: "#fff",
      step: 15,
      mapTypeControl: null,
    };
    var r = t("zrender/tool/util"),
      h = t("zrender/tool/color"),
      l = t("zrender/tool/event");
    return (
      (e.prototype = {
        type: n.COMPONENT_TYPE_ROAMCONTROLLER,
        _buildShape: function () {
          if (this.rcOption.show) {
            (this._itemGroupLocation = this._getItemGroupLocation()),
              this._buildBackground(),
              this._buildItem();
            for (var t = 0, e = this.shapeList.length; e > t; t++)
              this.zr.addShape(this.shapeList[t]);
          }
        },
        _buildItem: function () {
          this.shapeList.push(this._getDirectionShape("up")),
            this.shapeList.push(this._getDirectionShape("down")),
            this.shapeList.push(this._getDirectionShape("left")),
            this.shapeList.push(this._getDirectionShape("right")),
            this.shapeList.push(this._getScaleShape("scaleUp")),
            this.shapeList.push(this._getScaleShape("scaleDown"));
        },
        _getDirectionShape: function (t) {
          var e = this._itemGroupLocation.r,
            i = this._itemGroupLocation.x + e,
            s = this._itemGroupLocation.y + e,
            a = {
              zlevel: this.getZlevelBase(),
              z: this.getZBase(),
              style: {
                x: i,
                y: s,
                r: e,
                startAngle: -45,
                endAngle: 45,
                color: this.rcOption.handleColor,
                text: ">",
                textX: i + e / 2 + 4,
                textY: s - 0.5,
                textAlign: "center",
                textBaseline: "middle",
                textPosition: "specific",
                textColor: this.rcOption.fillerColor,
                textFont: Math.floor(e / 2) + "px arial",
              },
              highlightStyle: {
                color: h.lift(this.rcOption.handleColor, -0.2),
                brushType: "fill",
              },
              clickable: !0,
            };
          switch (t) {
            case "up":
              a.rotation = [Math.PI / 2, i, s];
              break;
            case "left":
              a.rotation = [Math.PI, i, s];
              break;
            case "down":
              a.rotation = [-Math.PI / 2, i, s];
          }
          return (
            (a = new o(a)),
            (a._roamType = t),
            (a.onmousedown = this._drictionMouseDown),
            (a.onmouseup = this._drictionMouseUp),
            (a.onmousemove = this._drictionMouseMove),
            (a.onmouseout = this._drictionMouseOut),
            a
          );
        },
        _getScaleShape: function (t) {
          var e = this._itemGroupLocation.width,
            i = this._itemGroupLocation.height - e;
          i = 0 > i ? 20 : i;
          var s = Math.min(e / 2 - 5, i) / 2,
            o = this._itemGroupLocation.x + ("scaleDown" === t ? e - s : s),
            n = this._itemGroupLocation.y + this._itemGroupLocation.height - s,
            r = {
              zlevel: this.getZlevelBase(),
              z: this.getZBase(),
              style: {
                x: o,
                y: n,
                r: s,
                color: this.rcOption.handleColor,
                text: "scaleDown" === t ? "-" : "+",
                textX: o,
                textY: n - 2,
                textAlign: "center",
                textBaseline: "middle",
                textPosition: "specific",
                textColor: this.rcOption.fillerColor,
                textFont: Math.floor(s) + "px verdana",
              },
              highlightStyle: {
                color: h.lift(this.rcOption.handleColor, -0.2),
                brushType: "fill",
              },
              clickable: !0,
            };
          return (
            (r = new a(r)),
            (r._roamType = t),
            (r.onmousedown = this._scaleHandler),
            r
          );
        },
        _buildBackground: function () {
          var t = this.reformCssArray(this.rcOption.padding);
          this.shapeList.push(
            new s({
              zlevel: this.getZlevelBase(),
              z: this.getZBase(),
              hoverable: !1,
              style: {
                x: this._itemGroupLocation.x - t[3],
                y: this._itemGroupLocation.y - t[0],
                width: this._itemGroupLocation.width + t[3] + t[1],
                height: this._itemGroupLocation.height + t[0] + t[2],
                brushType: 0 === this.rcOption.borderWidth ? "fill" : "both",
                color: this.rcOption.backgroundColor,
                strokeColor: this.rcOption.borderColor,
                lineWidth: this.rcOption.borderWidth,
              },
            })
          );
        },
        _getItemGroupLocation: function () {
          var t,
            e = this.reformCssArray(this.rcOption.padding),
            i = this.rcOption.width,
            s = this.rcOption.height,
            o = this.zr.getWidth(),
            a = this.zr.getHeight();
          switch (this.rcOption.x) {
            case "center":
              t = Math.floor((o - i) / 2);
              break;
            case "left":
              t = e[3] + this.rcOption.borderWidth;
              break;
            case "right":
              t = o - i - e[1] - e[3] - 2 * this.rcOption.borderWidth;
              break;
            default:
              t = this.parsePercent(this.rcOption.x, o);
          }
          var n;
          switch (this.rcOption.y) {
            case "top":
              n = e[0] + this.rcOption.borderWidth;
              break;
            case "bottom":
              n = a - s - e[0] - e[2] - 2 * this.rcOption.borderWidth;
              break;
            case "center":
              n = Math.floor((a - s) / 2);
              break;
            default:
              n = this.parsePercent(this.rcOption.y, a);
          }
          return { x: t, y: n, r: i / 2, width: i, height: s };
        },
        __drictionMouseDown: function (t) {
          (this.mousedown = !0), this._drictionHandlerOn(t);
        },
        __drictionMouseUp: function (t) {
          (this.mousedown = !1), this._drictionHandlerOff(t);
        },
        __drictionMouseMove: function (t) {
          this.mousedown && this._drictionHandlerOn(t);
        },
        __drictionMouseOut: function (t) {
          this._drictionHandlerOff(t);
        },
        _drictionHandlerOn: function (t) {
          this._dispatchEvent(t.event, t.target._roamType),
            clearInterval(this.dircetionTimer);
          var e = this;
          (this.dircetionTimer = setInterval(function () {
            e._dispatchEvent(t.event, t.target._roamType);
          }, 100)),
            l.stop(t.event);
        },
        _drictionHandlerOff: function () {
          clearInterval(this.dircetionTimer);
        },
        __scaleHandler: function (t) {
          this._dispatchEvent(t.event, t.target._roamType), l.stop(t.event);
        },
        _dispatchEvent: function (t, e) {
          this.messageCenter.dispatch(
            n.EVENT.ROAMCONTROLLER,
            t,
            {
              roamType: e,
              mapTypeControl: this.rcOption.mapTypeControl,
              step: this.rcOption.step,
            },
            this.myChart
          );
        },
        refresh: function (t) {
          t &&
            ((this.option = t || this.option),
            (this.option.roamController = this.reformOption(
              this.option.roamController
            )),
            (this.rcOption = this.option.roamController)),
            this.clear(),
            this._buildShape();
        },
      }),
      r.inherits(e, i),
      t("../component").define("roamController", e),
      e
    );
  }),
  define("echarts/util/mapData/params", ["require"], function (t) {
    function e(t) {
      if (!t.UTF8Encoding) return t;
      for (var e = t.features, s = 0; s < e.length; s++)
        for (
          var o = e[s],
            a = o.geometry.coordinates,
            n = o.geometry.encodeOffsets,
            r = 0;
          r < a.length;
          r++
        ) {
          var h = a[r];
          if ("Polygon" === o.geometry.type) a[r] = i(h, n[r]);
          else if ("MultiPolygon" === o.geometry.type)
            for (var l = 0; l < h.length; l++) {
              var d = h[l];
              h[l] = i(d, n[r][l]);
            }
        }
      return (t.UTF8Encoding = !1), t;
    }
    function i(t, e) {
      for (var i = [], s = e[0], o = e[1], a = 0; a < t.length; a += 2) {
        var n = t.charCodeAt(a) - 64,
          r = t.charCodeAt(a + 1) - 64;
        (n = (n >> 1) ^ -(1 & n)),
          (r = (r >> 1) ^ -(1 & r)),
          (n += s),
          (r += o),
          (s = n),
          (o = r),
          i.push([n / 1024, r / 1024]);
      }
      return i;
    }
    var s = {
      none: {
        getGeoJson: function (t) {
          t({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  coordinates: [],
                  encodeOffsets: [],
                  type: "Polygon",
                },
                properties: {},
              },
            ],
          });
        },
      },
      world: {
        getGeoJson: function (i) {
          t(["./geoJson/world_geo"], function (t) {
            i(e(t));
          });
        },
      },
      china: {
        getGeoJson: function (i) {
          t(["./geoJson/china_geo"], function (t) {
            i(e(t));
          });
        },
      },
      南海诸岛: {
        textCoord: [126, 25],
        getPath: function (t, e) {
          for (
            var i = [
                [
                  [0, 3.5],
                  [7, 11.2],
                  [15, 11.9],
                  [30, 7],
                  [42, 0.7],
                  [52, 0.7],
                  [56, 7.7],
                  [59, 0.7],
                  [64, 0.7],
                  [64, 0],
                  [5, 0],
                  [0, 3.5],
                ],
                [
                  [13, 16.1],
                  [19, 14.7],
                  [16, 21.7],
                  [11, 23.1],
                  [13, 16.1],
                ],
                [
                  [12, 32.2],
                  [14, 38.5],
                  [15, 38.5],
                  [13, 32.2],
                  [12, 32.2],
                ],
                [
                  [16, 47.6],
                  [12, 53.2],
                  [13, 53.2],
                  [18, 47.6],
                  [16, 47.6],
                ],
                [
                  [6, 64.4],
                  [8, 70],
                  [9, 70],
                  [8, 64.4],
                  [6, 64.4],
                ],
                [
                  [23, 82.6],
                  [29, 79.8],
                  [30, 79.8],
                  [25, 82.6],
                  [23, 82.6],
                ],
                [
                  [37, 70.7],
                  [43, 62.3],
                  [44, 62.3],
                  [39, 70.7],
                  [37, 70.7],
                ],
                [
                  [48, 51.1],
                  [51, 45.5],
                  [53, 45.5],
                  [50, 51.1],
                  [48, 51.1],
                ],
                [
                  [51, 35],
                  [51, 28.7],
                  [53, 28.7],
                  [53, 35],
                  [51, 35],
                ],
                [
                  [52, 22.4],
                  [55, 17.5],
                  [56, 17.5],
                  [53, 22.4],
                  [52, 22.4],
                ],
                [
                  [58, 12.6],
                  [62, 7],
                  [63, 7],
                  [60, 12.6],
                  [58, 12.6],
                ],
                [
                  [0, 3.5],
                  [0, 93.1],
                  [64, 93.1],
                  [64, 0],
                  [63, 0],
                  [63, 92.4],
                  [1, 92.4],
                  [1, 3.5],
                  [0, 3.5],
                ],
              ],
              s = "",
              o = t[0],
              a = t[1],
              n = 0,
              r = i.length;
            r > n;
            n++
          ) {
            s +=
              "M " +
              ((i[n][0][0] * e + o).toFixed(2) - 0) +
              " " +
              ((i[n][0][1] * e + a).toFixed(2) - 0) +
              " ";
            for (var h = 1, l = i[n].length; l > h; h++)
              s +=
                "L " +
                ((i[n][h][0] * e + o).toFixed(2) - 0) +
                " " +
                ((i[n][h][1] * e + a).toFixed(2) - 0) +
                " ";
          }
          return s + " Z";
        },
      },
      新疆: {
        getGeoJson: function (i) {
          t(["./geoJson/xin_jiang_geo"], function (t) {
            i(e(t));
          });
        },
      },
      西藏: {
        getGeoJson: function (i) {
          t(["./geoJson/xi_zang_geo"], function (t) {
            i(e(t));
          });
        },
      },
      内蒙古: {
        getGeoJson: function (i) {
          t(["./geoJson/nei_meng_gu_geo"], function (t) {
            i(e(t));
          });
        },
      },
      青海: {
        getGeoJson: function (i) {
          t(["./geoJson/qing_hai_geo"], function (t) {
            i(e(t));
          });
        },
      },
      四川: {
        getGeoJson: function (i) {
          t(["./geoJson/si_chuan_geo"], function (t) {
            i(e(t));
          });
        },
      },
      黑龙江: {
        getGeoJson: function (i) {
          t(["./geoJson/hei_long_jiang_geo"], function (t) {
            i(e(t));
          });
        },
      },
      甘肃: {
        getGeoJson: function (i) {
          t(["./geoJson/gan_su_geo"], function (t) {
            i(e(t));
          });
        },
      },
      云南: {
        getGeoJson: function (i) {
          t(["./geoJson/yun_nan_geo"], function (t) {
            i(e(t));
          });
        },
      },
      广西: {
        getGeoJson: function (i) {
          t(["./geoJson/guang_xi_geo"], function (t) {
            i(e(t));
          });
        },
      },
      湖南: {
        getGeoJson: function (i) {
          t(["./geoJson/hu_nan_geo"], function (t) {
            i(e(t));
          });
        },
      },
      陕西: {
        getGeoJson: function (i) {
          t(["./geoJson/shan_xi_1_geo"], function (t) {
            i(e(t));
          });
        },
      },
      广东: {
        getGeoJson: function (i) {
          t(["./geoJson/guang_dong_geo"], function (t) {
            i(e(t));
          });
        },
      },
      吉林: {
        getGeoJson: function (i) {
          t(["./geoJson/ji_lin_geo"], function (t) {
            i(e(t));
          });
        },
      },
      河北: {
        getGeoJson: function (i) {
          t(["./geoJson/he_bei_geo"], function (t) {
            i(e(t));
          });
        },
      },
      湖北: {
        getGeoJson: function (i) {
          t(["./geoJson/hu_bei_geo"], function (t) {
            i(e(t));
          });
        },
      },
      贵州: {
        getGeoJson: function (i) {
          t(["./geoJson/gui_zhou_geo"], function (t) {
            i(e(t));
          });
        },
      },
      山东: {
        getGeoJson: function (i) {
          t(["./geoJson/shan_dong_geo"], function (t) {
            i(e(t));
          });
        },
      },
      江西: {
        getGeoJson: function (i) {
          t(["./geoJson/jiang_xi_geo"], function (t) {
            i(e(t));
          });
        },
      },
      河南: {
        getGeoJson: function (i) {
          t(["./geoJson/he_nan_geo"], function (t) {
            i(e(t));
          });
        },
      },
      辽宁: {
        getGeoJson: function (i) {
          t(["./geoJson/liao_ning_geo"], function (t) {
            i(e(t));
          });
        },
      },
      山西: {
        getGeoJson: function (i) {
          t(["./geoJson/shan_xi_2_geo"], function (t) {
            i(e(t));
          });
        },
      },
      安徽: {
        getGeoJson: function (i) {
          t(["./geoJson/an_hui_geo"], function (t) {
            i(e(t));
          });
        },
      },
      福建: {
        getGeoJson: function (i) {
          t(["./geoJson/fu_jian_geo"], function (t) {
            i(e(t));
          });
        },
      },
      浙江: {
        getGeoJson: function (i) {
          t(["./geoJson/zhe_jiang_geo"], function (t) {
            i(e(t));
          });
        },
      },
      江苏: {
        getGeoJson: function (i) {
          t(["./geoJson/jiang_su_geo"], function (t) {
            i(e(t));
          });
        },
      },
      重庆: {
        getGeoJson: function (i) {
          t(["./geoJson/chong_qing_geo"], function (t) {
            i(e(t));
          });
        },
      },
      宁夏: {
        getGeoJson: function (i) {
          t(["./geoJson/ning_xia_geo"], function (t) {
            i(e(t));
          });
        },
      },
      海南: {
        getGeoJson: function (i) {
          t(["./geoJson/hai_nan_geo"], function (t) {
            i(e(t));
          });
        },
      },
      台湾: {
        getGeoJson: function (i) {
          t(["./geoJson/tai_wan_geo"], function (t) {
            i(e(t));
          });
        },
      },
      北京: {
        getGeoJson: function (i) {
          t(["./geoJson/bei_jing_geo"], function (t) {
            i(e(t));
          });
        },
      },
      天津: {
        getGeoJson: function (i) {
          t(["./geoJson/tian_jin_geo"], function (t) {
            i(e(t));
          });
        },
      },
      上海: {
        getGeoJson: function (i) {
          t(["./geoJson/shang_hai_geo"], function (t) {
            i(e(t));
          });
        },
      },
      香港: {
        getGeoJson: function (i) {
          t(["./geoJson/xiang_gang_geo"], function (t) {
            i(e(t));
          });
        },
      },
      澳门: {
        getGeoJson: function (i) {
          t(["./geoJson/ao_men_geo"], function (t) {
            i(e(t));
          });
        },
      },
    };
    return { decode: e, params: s };
  }),
  define("echarts/util/mapData/textFixed", [], function () {
    return {
      广东: [0, -10],
      香港: [10, 10],
      澳门: [-10, 18],
      黑龙江: [0, 20],
      天津: [5, 5],
      深圳市: [-35, 0],
      红河哈尼族彝族自治州: [0, 20],
      楚雄彝族自治州: [-5, 15],
      石河子市: [-5, 5],
      五家渠市: [0, -10],
      昌吉回族自治州: [10, 10],
      昌江黎族自治县: [0, 20],
      陵水黎族自治县: [0, 20],
      东方市: [0, 20],
      渭南市: [0, 20],
    };
  }),
  define("echarts/util/mapData/geoCoord", [], function () {
    return { Russia: [100, 60], "United States of America": [-99, 38] };
  }),
  define("echarts/util/projection/svg", [
    "require",
    "zrender/shape/Path",
  ], function (t) {
    function e(t) {
      return parseFloat(t || 0);
    }
    function i(t) {
      for (
        var i = t.firstChild;
        "svg" != i.nodeName.toLowerCase() || 1 != i.nodeType;

      )
        i = i.nextSibling;
      var s = e(i.getAttribute("x")),
        o = e(i.getAttribute("y")),
        a = e(i.getAttribute("width")),
        n = e(i.getAttribute("height"));
      return { left: s, top: o, width: a, height: n };
    }
    function s(t, e) {
      function i(t) {
        var e = t.tagName;
        if (d[e]) {
          var a = d[e](t, s);
          a &&
            ((a.scale = s),
            (a.properties = { name: t.getAttribute("name") || "" }),
            (a.id = t.id),
            r(a, t),
            o.push(a));
        }
        for (var n = t.childNodes, h = 0, l = n.length; l > h; h++) i(n[h]);
      }
      var s = [e.scale.x, e.scale.y],
        o = [];
      return i(t), o;
    }
    function o(t, e) {
      var i = e instanceof Array ? [1 * e[0], 1 * e[1]] : [1 * e.x, 1 * e.y];
      return [i[0] / t.scale.x, i[1] / t.scale.y];
    }
    function a(t, e) {
      var i = e instanceof Array ? [1 * e[0], 1 * e[1]] : [1 * e.x, 1 * e.y];
      return [i[0] * t.scale.x, i[1] * t.scale.y];
    }
    function n(t) {
      return t.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    }
    function r(t, e) {
      var i = e.getAttribute("fill"),
        s = e.getAttribute("stroke"),
        o = e.getAttribute("stroke-width"),
        a = e.getAttribute("opacity");
      i && "none" != i
        ? ((t.color = i),
          s
            ? ((t.brushType = "both"), (t.strokeColor = s))
            : (t.brushType = "fill"))
        : s && "none" != s && ((t.strokeColor = s), (t.brushType = "stroke")),
        o && "none" != o && (t.lineWidth = parseFloat(o)),
        a && "none" != a && (t.opacity = parseFloat(a));
    }
    function h(t) {
      for (
        var e = n(t).replace(/,/g, " ").split(/\s+/), i = [], s = 0;
        s < e.length;

      ) {
        var o = parseFloat(e[s++]),
          a = parseFloat(e[s++]);
        i.push([o, a]);
      }
      return i;
    }
    var l = t("zrender/shape/Path"),
      d = {
        path: function (t, e) {
          var i = t.getAttribute("d"),
            s = l.prototype.getRect({ path: i });
          return {
            shapeType: "path",
            path: i,
            cp: [(s.x + s.width / 2) * e[0], (s.y + s.height / 2) * e[1]],
          };
        },
        rect: function (t, i) {
          var s = e(t.getAttribute("x")),
            o = e(t.getAttribute("y")),
            a = e(t.getAttribute("width")),
            n = e(t.getAttribute("height"));
          return {
            shapeType: "rectangle",
            x: s,
            y: o,
            width: a,
            height: n,
            cp: [(s + a / 2) * i[0], (o + n / 2) * i[1]],
          };
        },
        line: function (t, i) {
          var s = e(t.getAttribute("x1")),
            o = e(t.getAttribute("y1")),
            a = e(t.getAttribute("x2")),
            n = e(t.getAttribute("y2"));
          return {
            shapeType: "line",
            xStart: s,
            yStart: o,
            xEnd: a,
            yEnd: n,
            cp: [0.5 * (s + a) * i[0], 0.5 * (o + n) * i[1]],
          };
        },
        circle: function (t, i) {
          var s = e(t.getAttribute("cx")),
            o = e(t.getAttribute("cy")),
            a = e(t.getAttribute("r"));
          return {
            shapeType: "circle",
            x: s,
            y: o,
            r: a,
            cp: [s * i[0], o * i[1]],
          };
        },
        ellipse: function (t, e) {
          var i = parseFloat(t.getAttribute("cx") || 0),
            s = parseFloat(t.getAttribute("cy") || 0),
            o = parseFloat(t.getAttribute("rx") || 0),
            a = parseFloat(t.getAttribute("ry") || 0);
          return {
            shapeType: "ellipse",
            x: i,
            y: s,
            a: o,
            b: a,
            cp: [i * e[0], s * e[1]],
          };
        },
        polygon: function (t, e) {
          var i = t.getAttribute("points"),
            s = [1 / 0, 1 / 0],
            o = [-1 / 0, -1 / 0];
          if (i) {
            i = h(i);
            for (var a = 0; a < i.length; a++) {
              var n = i[a];
              (s[0] = Math.min(n[0], s[0])),
                (s[1] = Math.min(n[1], s[1])),
                (o[0] = Math.max(n[0], o[0])),
                (o[1] = Math.max(n[1], o[1]));
            }
            return {
              shapeType: "polygon",
              pointList: i,
              cp: [((s[0] + o[0]) / 2) * e[0], ((s[1] + o[1]) / 2) * e[0]],
            };
          }
        },
        polyline: function (t, e) {
          var i = d.polygon(t, e);
          return i;
        },
      };
    return { getBbox: i, geoJson2Path: s, pos2geo: o, geo2pos: a };
  }),
  define("echarts/util/projection/normal", [], function () {
    function t(t, i) {
      return (i = i || {}), t.srcSize || e(t, i), t.srcSize;
    }
    function e(t, e) {
      (e = e || {}),
        (n.xmin = 360),
        (n.xmax = -360),
        (n.ymin = 180),
        (n.ymax = -180);
      for (var i, s, o = t.features, a = 0, r = o.length; r > a; a++)
        if (((s = o[a]), !s.properties.name || !e[s.properties.name]))
          switch (s.type) {
            case "Feature":
              n[s.geometry.type](s.geometry.coordinates);
              break;
            case "GeometryCollection":
              i = s.geometries;
              for (var h = 0, l = i.length; l > h; h++)
                n[i[h].type](i[h].coordinates);
          }
      return (
        (t.srcSize = {
          left: 1 * n.xmin.toFixed(4),
          top: 1 * n.ymin.toFixed(4),
          width: 1 * (n.xmax - n.xmin).toFixed(4),
          height: 1 * (n.ymax - n.ymin).toFixed(4),
        }),
        t
      );
    }
    function i(t, i, s) {
      function o(t, e) {
        (f = t.type),
          (y = t.coordinates),
          (a._bbox = { xmin: 360, xmax: -360, ymin: 180, ymax: -180 }),
          (m = a[f](y)),
          d.push({
            path: m,
            cp: a.makePoint(
              e.properties.cp
                ? e.properties.cp
                : [
                    (a._bbox.xmin + a._bbox.xmax) / 2,
                    (a._bbox.ymin + a._bbox.ymax) / 2,
                  ]
            ),
            properties: e.properties,
            id: e.id,
          });
      }
      (s = s || {}),
        (a.scale = null),
        (a.offset = null),
        t.srcSize || e(t, s),
        (i.offset = {
          x: t.srcSize.left,
          y: t.srcSize.top,
          left: i.OffsetLeft || 0,
          top: i.OffsetTop || 0,
        }),
        (a.scale = i.scale),
        (a.offset = i.offset);
      for (var n, r, h, l = t.features, d = [], p = 0, c = l.length; c > p; p++)
        if (((h = l[p]), !h.properties.name || !s[h.properties.name]))
          if ("Feature" == h.type) o(h.geometry, h);
          else if ("GeometryCollection" == h.type) {
            n = h.geometries;
            for (var u = 0, g = n.length; g > u; u++) (r = n[u]), o(r, r);
          }
      var f, y, m;
      return d;
    }
    function s(t, e) {
      var i, s;
      return (
        e instanceof Array
          ? ((i = 1 * e[0]), (s = 1 * e[1]))
          : ((i = 1 * e.x), (s = 1 * e.y)),
        (i = i / t.scale.x + t.offset.x - 168.5),
        (i = i > 180 ? i - 360 : i),
        (s = 90 - (s / t.scale.y + t.offset.y)),
        [i, s]
      );
    }
    function o(t, e) {
      return (
        (a.offset = t.offset),
        (a.scale = t.scale),
        a.makePoint(
          e instanceof Array ? [1 * e[0], 1 * e[1]] : [1 * e.x, 1 * e.y]
        )
      );
    }
    var a = {
        formatPoint: function (t) {
          return [
            (t[0] < -168.5 && t[1] > 63.8 ? t[0] + 360 : t[0]) + 168.5,
            90 - t[1],
          ];
        },
        makePoint: function (t) {
          var e = this,
            i = e.formatPoint(t);
          e._bbox.xmin > t[0] && (e._bbox.xmin = t[0]),
            e._bbox.xmax < t[0] && (e._bbox.xmax = t[0]),
            e._bbox.ymin > t[1] && (e._bbox.ymin = t[1]),
            e._bbox.ymax < t[1] && (e._bbox.ymax = t[1]);
          var s = (i[0] - a.offset.x) * a.scale.x + a.offset.left,
            o = (i[1] - a.offset.y) * a.scale.y + a.offset.top;
          return [s, o];
        },
        Point: function (t) {
          return (t = this.makePoint(t)), t.join(",");
        },
        LineString: function (t) {
          for (var e, i = "", s = 0, o = t.length; o > s; s++)
            (e = a.makePoint(t[s])),
              (i = 0 === s ? "M" + e.join(",") : i + "L" + e.join(","));
          return i;
        },
        Polygon: function (t) {
          for (var e = "", i = 0, s = t.length; s > i; i++)
            e = e + a.LineString(t[i]) + "z";
          return e;
        },
        MultiPoint: function (t) {
          for (var e = [], i = 0, s = t.length; s > i; i++)
            e.push(a.Point(t[i]));
          return e;
        },
        MultiLineString: function (t) {
          for (var e = "", i = 0, s = t.length; s > i; i++)
            e += a.LineString(t[i]);
          return e;
        },
        MultiPolygon: function (t) {
          for (var e = "", i = 0, s = t.length; s > i; i++)
            e += a.Polygon(t[i]);
          return e;
        },
      },
      n = {
        formatPoint: a.formatPoint,
        makePoint: function (t) {
          var e = this,
            i = e.formatPoint(t),
            s = i[0],
            o = i[1];
          e.xmin > s && (e.xmin = s),
            e.xmax < s && (e.xmax = s),
            e.ymin > o && (e.ymin = o),
            e.ymax < o && (e.ymax = o);
        },
        Point: function (t) {
          this.makePoint(t);
        },
        LineString: function (t) {
          for (var e = 0, i = t.length; i > e; e++) this.makePoint(t[e]);
        },
        Polygon: function (t) {
          for (var e = 0, i = t.length; i > e; e++) this.LineString(t[e]);
        },
        MultiPoint: function (t) {
          for (var e = 0, i = t.length; i > e; e++) this.Point(t[e]);
        },
        MultiLineString: function (t) {
          for (var e = 0, i = t.length; i > e; e++) this.LineString(t[e]);
        },
        MultiPolygon: function (t) {
          for (var e = 0, i = t.length; i > e; e++) this.Polygon(t[e]);
        },
      };
    return { getBbox: t, geoJson2Path: i, pos2geo: s, geo2pos: o };
  }),
  define("echarts/util/shape/HandlePolygon", [
    "require",
    "zrender/shape/Base",
    "zrender/shape/Polygon",
    "zrender/tool/util",
  ], function (t) {
    function e(t) {
      i.call(this, t);
    }
    var i = t("zrender/shape/Base"),
      s = t("zrender/shape/Polygon"),
      o = t("zrender/tool/util");
    return (
      (e.prototype = {
        type: "handle-polygon",
        buildPath: function (t, e) {
          s.prototype.buildPath(t, e);
        },
        isCover: function (t, e) {
          var i = this.getTansform(t, e);
          (t = i[0]), (e = i[1]);
          var s = this.style.rect;
          return t >= s.x &&
            t <= s.x + s.width &&
            e >= s.y &&
            e <= s.y + s.height
            ? !0
            : !1;
        },
      }),
      o.inherits(e, i),
      e
    );
  });
