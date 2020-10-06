var define, require, esl;
!(function (t) {
  function e(t) {
    p(t, N) || (W[t] = 1);
  }
  function i(t, e) {
    function i(t) {
      0 === t.indexOf(".") && s.push(t);
    }
    var s = [];
    if (
      ("string" == typeof t
        ? i(t)
        : O(t, function (t) {
            i(t);
          }),
      s.length > 0)
    )
      throw new Error(
        "[REQUIRE_FATAL]Relative ID is not allowed in global require: " +
          s.join(", ")
      );
    var r = G.waitSeconds;
    return (
      r &&
        t instanceof Array &&
        (P && clearTimeout(P), (P = setTimeout(o, 1e3 * r))),
      Y(t, e)
    );
  }
  function o() {
    function t(n, a) {
      if (!r[n] && !p(n, N)) {
        (r[n] = 1), p(n, B) || o[n] || ((o[n] = 1), e.push(n));
        var h = R[n];
        h
          ? a &&
            (o[n] || ((o[n] = 1), e.push(n)),
            O(h.depMs, function (e) {
              t(e.absId, e.hard);
            }))
          : s[n] || ((s[n] = 1), i.push(n));
      }
    }
    var e = [],
      i = [],
      o = {},
      s = {},
      r = {};
    for (var n in W) t(n, 1);
    if (e.length || i.length)
      throw new Error(
        "[MODULE_TIMEOUT]Hang( " +
          (e.join(", ") || "none") +
          " ) Miss( " +
          (i.join(", ") || "none") +
          " )"
      );
  }
  function s(t) {
    O(Z, function (e) {
      a(t, e.deps, e.factory);
    }),
      (Z.length = 0);
  }
  function r(t, e, i) {
    if (
      (null == i &&
        (null == e
          ? ((i = t), (t = null))
          : ((i = e), (e = null), t instanceof Array && ((e = t), (t = null)))),
      null != i)
    ) {
      var o = window.opera;
      if (
        !t &&
        document.attachEvent &&
        (!o || "[object Opera]" !== o.toString())
      ) {
        var s = E();
        t = s && s.getAttribute("data-require-id");
      }
      t ? a(t, e, i) : (Z[0] = { deps: e, factory: i });
    }
  }
  function n() {
    var t = G.config[this.id];
    return t && "object" == typeof t ? t : {};
  }
  function a(t, e, i) {
    R[t] ||
      (R[t] = {
        id: t,
        depsDec: e,
        deps: e || ["require", "exports", "module"],
        factoryDeps: [],
        factory: i,
        exports: {},
        config: n,
        state: D,
        require: C(t),
        depMs: [],
        depMkv: {},
        depRs: [],
      });
  }
  function h(t) {
    var e = R[t];
    if (e && !p(t, H)) {
      var i = e.deps,
        o = e.factory,
        s = 0;
      "function" == typeof o &&
        ((s = Math.min(o.length, i.length)),
        !e.depsDec &&
          o
            .toString()
            .replace(/(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/gm, "")
            .replace(/require\(\s*(['"'])([^'"]+)\1\s*\)/g, function (t, e, o) {
              i.push(o);
            }));
      var r = [],
        n = [];
      O(i, function (i, o) {
        var a,
          h,
          l = w(i),
          d = z(l.mod, t);
        d && !F[d]
          ? (l.res &&
              ((h = { id: i, mod: d, res: l.res }), n.push(i), e.depRs.push(h)),
            (a = e.depMkv[d]),
            a ||
              ((a = { id: l.mod, absId: d, hard: s > o }),
              e.depMs.push(a),
              (e.depMkv[d] = a),
              r.push(d)))
          : (a = { absId: d }),
          s > o && e.factoryDeps.push(h || a);
      }),
        (e.state = H),
        c(t),
        y(r),
        n.length &&
          e.require(n, function () {
            O(e.depRs, function (e) {
              e.absId || (e.absId = z(e.id, t));
            }),
              l();
          });
    }
  }
  function l() {
    for (var t in W) h(t), d(t), u(t);
  }
  function d(t) {
    function e(t) {
      if ((h(t), !p(t, H))) return !1;
      if (p(t, B) || i[t]) return !0;
      i[t] = 1;
      var o = R[t],
        s = !0;
      return (
        O(o.depMs, function (t) {
          return (s = e(t.absId));
        }),
        s &&
          O(o.depRs, function (t) {
            return (s = !!t.absId);
          }),
        s && (o.state = B),
        s
      );
    }
    var i = {};
    e(t);
  }
  function c(e) {
    function i() {
      if (!o && s.state === B) {
        o = 1;
        var i = 1;
        if (
          (O(s.factoryDeps, function (t) {
            var e = t.absId;
            return F[e] ? void 0 : (u(e), (i = p(e, N)));
          }),
          i)
        ) {
          try {
            var r = s.factory,
              n =
                "function" == typeof r
                  ? r.apply(
                      t,
                      g(s.factoryDeps, {
                        require: s.require,
                        exports: s.exports,
                        module: s,
                      })
                    )
                  : r;
            null != n && (s.exports = n), (s.invokeFactory = null);
          } catch (a) {
            if (/^\[MODULE_MISS\]"([^"]+)/.test(a.message)) {
              var h = s.depMkv[RegExp.$1];
              return h && (h.hard = 1), void (o = 0);
            }
            throw a;
          }
          m(e);
        }
      }
    }
    var o,
      s = R[e];
    s.invokeFactory = i;
  }
  function p(t, e) {
    return R[t] && R[t].state >= e;
  }
  function u(t) {
    var e = R[t];
    e && e.invokeFactory && e.invokeFactory();
  }
  function g(t, e) {
    var i = [];
    return (
      O(t, function (t, o) {
        "object" == typeof t && (t = t.absId), (i[o] = e[t] || R[t].exports);
      }),
      i
    );
  }
  function f(t, e) {
    if (p(t, N)) return void e();
    var i = q[t];
    i || (i = q[t] = []), i.push(e);
  }
  function m(t) {
    var e = R[t];
    (e.state = N), delete W[t];
    for (var i = q[t] || [], o = i.length; o--; ) i[o]();
    (i.length = 0), (q[t] = null);
  }
  function y(e, i, o) {
    function s() {
      if ("function" == typeof i && !r) {
        var o = 1;
        O(e, function (t) {
          return F[t] ? void 0 : (o = !!p(t, N));
        }),
          o && ((r = 1), i.apply(t, g(e, F)));
      }
    }
    var r = 0;
    O(e, function (t) {
      F[t] || p(t, N) || (f(t, s), (t.indexOf("!") > 0 ? v : _)(t, o));
    }),
      s();
  }
  function _(e) {
    function i() {
      var t = j[e];
      A(t || e, o);
    }
    function o() {
      if (n) {
        var i;
        "function" == typeof n.init && (i = n.init.apply(t, g(a, F))),
          null == i &&
            n.exports &&
            ((i = t),
            O(n.exports.split("."), function (t) {
              return (i = i[t]), !!i;
            })),
          r(e, a, i || {});
      } else s(e);
      l();
    }
    if (!X[e] && !R[e]) {
      X[e] = 1;
      var n = G.shim[e];
      n instanceof Array && (G.shim[e] = n = { deps: n });
      var a = n && (n.deps || []);
      a
        ? (O(a, function (t) {
            G.shim[t] || (G.shim[t] = {});
          }),
          Y(a, i))
        : i();
    }
  }
  function v(t, e) {
    function i(e) {
      (h.exports = e || !0), m(t);
    }
    function o(o) {
      var s = e ? R[e].require : Y;
      o.load(a.res, s, i, n.call({ id: t }));
    }
    if (!R[t]) {
      var r = j[t];
      if (r) return void _(r);
      var a = w(t),
        h = { id: t, state: H };
      (R[t] = h),
        (i.fromText = function (t, e) {
          new Function(e)(), s(t);
        }),
        o(Y(a.mod));
    }
  }
  function x(t, e) {
    var i = M(t, 1, e);
    return i.sort(I), i;
  }
  function b() {
    function t(t) {
      j[t] = e;
    }
    (G.baseUrl = G.baseUrl.replace(/\/$/, "") + "/"),
      (V = x(G.paths)),
      (U = x(G.map, 1)),
      O(U, function (t) {
        t.v = x(t.v);
      }),
      (Q = []),
      O(G.packages, function (t) {
        var e = t;
        "string" == typeof t &&
          (e = { name: t.split("/")[0], location: t, main: "main" }),
          (e.location = e.location || e.name),
          (e.main = (e.main || "main").replace(/\.js$/i, "")),
          (e.reg = k(e.name)),
          Q.push(e);
      }),
      Q.sort(I),
      (J = x(G.urlArgs, 1)),
      (j = {});
    for (var e in G.bundles) O(G.bundles[e], t);
  }
  function T(t, e, i) {
    O(e, function (e) {
      return e.reg.test(t) ? (i(e.v, e.k, e), !1) : void 0;
    });
  }
  function S(t) {
    var e = /(\.[a-z0-9]+)$/i,
      i = /(\?[^#]*)$/,
      o = "",
      s = t,
      r = "";
    i.test(t) && ((r = RegExp.$1), (t = t.replace(i, ""))),
      e.test(t) && ((o = RegExp.$1), (s = t.replace(e, "")));
    var n,
      a = s;
    return (
      T(s, V, function (t, e) {
        (a = a.replace(e, t)), (n = 1);
      }),
      n ||
        T(s, Q, function (t, e, i) {
          a = a.replace(i.name, i.location);
        }),
      /^([a-z]{2,10}:\/)?\//i.test(a) || (a = G.baseUrl + a),
      (a += o + r),
      T(s, J, function (t) {
        a += (a.indexOf("?") > 0 ? "&" : "?") + t;
      }),
      a
    );
  }
  function C(t) {
    function i(i, s) {
      if ("string" == typeof i) {
        if (!o[i]) {
          var r = z(i, t);
          if ((u(r), !p(r, N)))
            throw new Error('[MODULE_MISS]"' + r + '" is not exists!');
          o[i] = R[r].exports;
        }
        return o[i];
      }
      if (i instanceof Array) {
        var n = [],
          a = [];
        O(i, function (i, o) {
          var s = w(i),
            r = z(s.mod, t),
            h = s.res,
            l = r;
          if (h) {
            var d = r + "!" + h;
            0 !== h.indexOf(".") && j[d] ? (r = l = d) : (l = null);
          }
          (a[o] = l), e(r), n.push(r);
        }),
          y(
            n,
            function () {
              O(a, function (o, s) {
                null == o && ((o = a[s] = z(i[s], t)), e(o));
              }),
                y(a, s, t),
                l();
            },
            t
          ),
          l();
      }
    }
    var o = {};
    return (
      (i.toUrl = function (e) {
        return S(z(e, t));
      }),
      i
    );
  }
  function z(t, e) {
    if (!t) return "";
    e = e || "";
    var i = w(t);
    if (!i) return t;
    var o = i.res,
      s = L(i.mod, e);
    if (
      (O(Q, function (t) {
        var e = t.name;
        return e === s ? ((s = e + "/" + t.main), !1) : void 0;
      }),
      T(e, U, function (t) {
        T(s, t, function (t, e) {
          s = s.replace(e, t);
        });
      }),
      o)
    ) {
      var r = p(s, N) && Y(s);
      (o =
        r && r.normalize
          ? r.normalize(o, function (t) {
              return z(t, e);
            })
          : z(o, e)),
        (s += "!" + o);
    }
    return s;
  }
  function L(t, e) {
    if (0 === t.indexOf(".")) {
      var i = e.split("/"),
        o = t.split("/"),
        s = i.length - 1,
        r = o.length,
        n = 0,
        a = 0;
      t: for (var h = 0; r > h; h++)
        switch (o[h]) {
          case "..":
            if (!(s > n)) break t;
            n++, a++;
            break;
          case ".":
            a++;
            break;
          default:
            break t;
        }
      return (i.length = s - n), (o = o.slice(a)), i.concat(o).join("/");
    }
    return t;
  }
  function w(t) {
    var e = t.split("!");
    return e[0] ? { mod: e[0], res: e[1] } : void 0;
  }
  function M(t, e, i) {
    var o = [];
    for (var s in t)
      if (t.hasOwnProperty(s)) {
        var r = { k: s, v: t[s] };
        o.push(r), e && (r.reg = "*" === s && i ? /^/ : k(s));
      }
    return o;
  }
  function E() {
    if (K) return K;
    if ($ && "interactive" === $.readyState) return $;
    for (var t = document.getElementsByTagName("script"), e = t.length; e--; ) {
      var i = t[e];
      if ("interactive" === i.readyState) return ($ = i), i;
    }
  }
  function A(t, e) {
    function i() {
      var t = o.readyState;
      ("undefined" == typeof t || /^(loaded|complete)$/.test(t)) &&
        ((o.onload = o.onreadystatechange = null), (o = null), e());
    }
    var o = document.createElement("script");
    o.setAttribute("data-require-id", t),
      (o.src = S(t + ".js")),
      (o.async = !0),
      o.readyState ? (o.onreadystatechange = i) : (o.onload = i),
      (K = o),
      ee ? te.insertBefore(o, ee) : te.appendChild(o),
      (K = null);
  }
  function k(t) {
    return new RegExp("^" + t + "(/|$)");
  }
  function O(t, e) {
    if (t instanceof Array)
      for (var i = 0, o = t.length; o > i && e(t[i], i) !== !1; i++);
  }
  function I(t, e) {
    var i = t.k || t.name,
      o = e.k || e.name;
    return "*" === o ? -1 : "*" === i ? 1 : o.length - i.length;
  }
  var P,
    R = {},
    D = 1,
    H = 2,
    B = 3,
    N = 4,
    W = {},
    F = { require: i, exports: 1, module: 1 },
    Y = C(),
    G = {
      baseUrl: "./",
      paths: {},
      config: {},
      map: {},
      packages: [],
      shim: {},
      waitSeconds: 0,
      bundles: {},
      urlArgs: {},
    };
  (i.version = "2.0.2"), (i.loader = "esl"), (i.toUrl = Y.toUrl);
  var Z = [];
  r.amd = {};
  var q = {},
    X = {};
  (i.config = function (t) {
    if (t) {
      for (var e in G) {
        var i = t[e],
          o = G[e];
        if (i)
          if ("urlArgs" === e && "string" == typeof i) G.urlArgs["*"] = i;
          else if (o instanceof Array) o.push.apply(o, i);
          else if ("object" == typeof o) for (var s in i) o[s] = i[s];
          else G[e] = i;
      }
      b();
    }
  }),
    b();
  var V,
    Q,
    U,
    j,
    J,
    K,
    $,
    te = document.getElementsByTagName("head")[0],
    ee = document.getElementsByTagName("base")[0];
  ee && (te = ee.parentNode),
    define || ((define = r), require || (require = i), (esl = i));
})(this),
  define("echarts", ["echarts/echarts"], function (t) {
    return t;
  }),
  define("echarts/echarts", [
    "require",
    "./config",
    "zrender/tool/util",
    "zrender/tool/event",
    "zrender",
    "zrender/config",
    "./chart/island",
    "./component/toolbox",
    "./component",
    "./component/title",
    "./component/tooltip",
    "./component/legend",
    "./util/ecData",
    "./chart",
    "zrender/tool/color",
    "./component/timeline",
    "zrender/shape/Image",
    "zrender/loadingEffect/Bubble",
    "zrender/loadingEffect/Spin",
    "./theme/macarons",
    "./theme/infographic",
  ], function (t) {
    function e() {
      n.Dispatcher.call(this);
    }
    function i(t) {
      (t.innerHTML = ""),
        (this._themeConfig = {}),
        (this.dom = t),
        (this._connected = !1),
        (this._status = { dragIn: !1, dragOut: !1, needRefresh: !1 }),
        (this._curEventType = !1),
        (this._chartList = []),
        (this._messageCenter = new e()),
        (this._messageCenterOutSide = new e()),
        (this.resize = this.resize()),
        this._init();
    }
    function o(t, e, i, o, s) {
      for (var r = t._chartList, n = r.length; n--; ) {
        var a = r[n];
        "function" == typeof a[e] && a[e](i, o, s);
      }
    }
    var s = t("./config"),
      r = t("zrender/tool/util"),
      n = t("zrender/tool/event"),
      a = {},
      h = new Date() - 0,
      l = {},
      d = "_echarts_instance_";
    (a.version = "1.0.0"),
      (a.mobile = !0),
      (a.dependencies = { zrender: "1.0.0" }),
      (a.init = function (e, o) {
        var s = t("zrender");
        s.version.replace(".", "") - 0 <
          a.dependencies.zrender.replace(".", "") - 0 &&
          console.error(
            "ZRender " +
              s.version +
              " is too old for ECharts " +
              a.version +
              ". Current version need ZRender " +
              a.dependencies.zrender +
              "+"
          ),
          (e = e instanceof Array ? e[0] : e);
        var r = e.getAttribute(d);
        return (
          r || ((r = h++), e.setAttribute(d, r)),
          l[r] && l[r].dispose(),
          (l[r] = new i(e)),
          (l[r].id = r),
          l[r].setTheme(o),
          l[r]
        );
      }),
      (a.getInstanceById = function (t) {
        return l[t];
      }),
      r.merge(e.prototype, n.Dispatcher.prototype, !0);
    var c = t("zrender/config").EVENT,
      p = [
        "CLICK",
        "DBLCLICK",
        "MOUSEOVER",
        "MOUSEOUT",
        "DRAGSTART",
        "DRAGEND",
        "DRAGENTER",
        "DRAGOVER",
        "DRAGLEAVE",
        "DROP",
      ];
    return (
      (i.prototype = {
        _init: function () {
          var e = this,
            i = t("zrender").init(this.dom);
          (this._zr = i),
            (this._messageCenter.dispatch = function (t, i, o, s) {
              (o = o || {}),
                (o.type = t),
                (o.event = i),
                e._messageCenter.dispatchWithContext(t, o, s),
                "HOVER" != t && "MOUSEOUT" != t
                  ? setTimeout(function () {
                      e._messageCenterOutSide.dispatchWithContext(t, o, s);
                    }, 50)
                  : e._messageCenterOutSide.dispatchWithContext(t, o, s);
            }),
            (this._onevent = function (t) {
              return e.__onevent(t);
            });
          for (var o in s.EVENT)
            "CLICK" != o &&
              "DBLCLICK" != o &&
              "HOVER" != o &&
              "MOUSEOUT" != o &&
              "MAP_ROAM" != o &&
              this._messageCenter.bind(s.EVENT[o], this._onevent, this);
          var r = {};
          this._onzrevent = function (t) {
            return e[r[t.type]](t);
          };
          for (var n = 0, a = p.length; a > n; n++) {
            var h = p[n],
              l = c[h];
            (r[l] = "_on" + h.toLowerCase()), i.on(l, this._onzrevent);
          }
          (this.chart = {}), (this.component = {});
          var d = t("./chart/island");
          (this._island = new d(
            this._themeConfig,
            this._messageCenter,
            i,
            {},
            this
          )),
            (this.chart.island = this._island);
          var u = t("./component/toolbox");
          (this._toolbox = new u(
            this._themeConfig,
            this._messageCenter,
            i,
            {},
            this
          )),
            (this.component.toolbox = this._toolbox);
          var g = t("./component");
          g.define("title", t("./component/title")),
            g.define("tooltip", t("./component/tooltip")),
            g.define("legend", t("./component/legend")),
            (0 === i.getWidth() || 0 === i.getHeight()) &&
              console.error(
                "Dom’s width & height should be ready before init."
              );
        },
        __onevent: function (t) {
          t.__echartsId = t.__echartsId || this.id;
          var e = t.__echartsId === this.id;
          switch (
            (this._curEventType || (this._curEventType = t.type), t.type)
          ) {
            case s.EVENT.LEGEND_SELECTED:
              this._onlegendSelected(t);
              break;
            case s.EVENT.DATA_ZOOM:
              if (!e) {
                var i = this.component.dataZoom;
                i && (i.silence(!0), i.absoluteZoom(t.zoom), i.silence(!1));
              }
              this._ondataZoom(t);
              break;
            case s.EVENT.DATA_RANGE:
              e && this._ondataRange(t);
              break;
            case s.EVENT.MAGIC_TYPE_CHANGED:
              if (!e) {
                var o = this.component.toolbox;
                o &&
                  (o.silence(!0), o.setMagicType(t.magicType), o.silence(!1));
              }
              this._onmagicTypeChanged(t);
              break;
            case s.EVENT.DATA_VIEW_CHANGED:
              e && this._ondataViewChanged(t);
              break;
            case s.EVENT.TOOLTIP_HOVER:
              e && this._tooltipHover(t);
              break;
            case s.EVENT.RESTORE:
              this._onrestore();
              break;
            case s.EVENT.REFRESH:
              e && this._onrefresh(t);
              break;
            case s.EVENT.TOOLTIP_IN_GRID:
            case s.EVENT.TOOLTIP_OUT_GRID:
              if (e) {
                if (this._connected) {
                  var r = this.component.grid;
                  r &&
                    ((t.x = (t.event.zrenderX - r.getX()) / r.getWidth()),
                    (t.y = (t.event.zrenderY - r.getY()) / r.getHeight()));
                }
              } else {
                var r = this.component.grid;
                r &&
                  this._zr.trigger("mousemove", {
                    connectTrigger: !0,
                    zrenderX: r.getX() + t.x * r.getWidth(),
                    zrenderY: r.getY() + t.y * r.getHeight(),
                  });
              }
          }
          if (this._connected && e && this._curEventType === t.type) {
            for (var n in this._connected)
              this._connected[n].connectedEventHandler(t);
            this._curEventType = null;
          }
          (!e || (!this._connected && e)) && (this._curEventType = null);
        },
        _onclick: function (t) {
          if ((o(this, "onclick", t), t.target)) {
            var e = this._eventPackage(t.target);
            e &&
              null != e.seriesIndex &&
              this._messageCenter.dispatch(s.EVENT.CLICK, t.event, e, this);
          }
        },
        _ondblclick: function (t) {
          if ((o(this, "ondblclick", t), t.target)) {
            var e = this._eventPackage(t.target);
            e &&
              null != e.seriesIndex &&
              this._messageCenter.dispatch(s.EVENT.DBLCLICK, t.event, e, this);
          }
        },
        _onmouseover: function (t) {
          if (t.target) {
            var e = this._eventPackage(t.target);
            e &&
              null != e.seriesIndex &&
              this._messageCenter.dispatch(s.EVENT.HOVER, t.event, e, this);
          }
        },
        _onmouseout: function (t) {
          if (t.target) {
            var e = this._eventPackage(t.target);
            e &&
              null != e.seriesIndex &&
              this._messageCenter.dispatch(s.EVENT.MOUSEOUT, t.event, e, this);
          }
        },
        _ondragstart: function (t) {
          (this._status = { dragIn: !1, dragOut: !1, needRefresh: !1 }),
            o(this, "ondragstart", t);
        },
        _ondragenter: function (t) {
          o(this, "ondragenter", t);
        },
        _ondragover: function (t) {
          o(this, "ondragover", t);
        },
        _ondragleave: function (t) {
          o(this, "ondragleave", t);
        },
        _ondrop: function (t) {
          o(this, "ondrop", t, this._status),
            this._island.ondrop(t, this._status);
        },
        _ondragend: function (t) {
          if (
            (o(this, "ondragend", t, this._status),
            this._timeline && this._timeline.ondragend(t, this._status),
            this._island.ondragend(t, this._status),
            this._status.needRefresh)
          ) {
            this._syncBackupData(this._option);
            var e = this._messageCenter;
            e.dispatch(
              s.EVENT.DATA_CHANGED,
              t.event,
              this._eventPackage(t.target),
              this
            ),
              e.dispatch(s.EVENT.REFRESH, null, null, this);
          }
        },
        _onlegendSelected: function (t) {
          (this._status.needRefresh = !1),
            o(this, "onlegendSelected", t, this._status),
            this._status.needRefresh &&
              this._messageCenter.dispatch(s.EVENT.REFRESH, null, null, this);
        },
        _ondataZoom: function (t) {
          (this._status.needRefresh = !1),
            o(this, "ondataZoom", t, this._status),
            this._status.needRefresh &&
              this._messageCenter.dispatch(s.EVENT.REFRESH, null, null, this);
        },
        _ondataRange: function (t) {
          this._clearEffect(),
            (this._status.needRefresh = !1),
            o(this, "ondataRange", t, this._status),
            this._status.needRefresh && this._zr.refreshNextFrame();
        },
        _onmagicTypeChanged: function () {
          this._clearEffect(), this._render(this._toolbox.getMagicOption());
        },
        _ondataViewChanged: function (t) {
          this._syncBackupData(t.option),
            this._messageCenter.dispatch(s.EVENT.DATA_CHANGED, null, t, this),
            this._messageCenter.dispatch(s.EVENT.REFRESH, null, null, this);
        },
        _tooltipHover: function (t) {
          var e = [];
          o(this, "ontooltipHover", t, e);
        },
        _onrestore: function () {
          this.restore();
        },
        _onrefresh: function (t) {
          (this._refreshInside = !0),
            this.refresh(t),
            (this._refreshInside = !1);
        },
        _syncBackupData: function (t) {
          this.component.dataZoom && this.component.dataZoom.syncBackupData(t);
        },
        _eventPackage: function (e) {
          if (e) {
            var i = t("./util/ecData"),
              o = i.get(e, "seriesIndex"),
              s = i.get(e, "dataIndex");
            return (
              (s =
                -1 != o && this.component.dataZoom
                  ? this.component.dataZoom.getRealDataIndex(o, s)
                  : s),
              {
                seriesIndex: o,
                seriesName: (i.get(e, "series") || {}).name,
                dataIndex: s,
                data: i.get(e, "data"),
                name: i.get(e, "name"),
                value: i.get(e, "value"),
                special: i.get(e, "special"),
              }
            );
          }
        },
        _noDataCheck: function (t) {
          for (var e = t.series, i = 0, o = e.length; o > i; i++)
            if (
              e[i].type == s.CHART_TYPE_MAP ||
              (e[i].data && e[i].data.length > 0) ||
              (e[i].markPoint &&
                e[i].markPoint.data &&
                e[i].markPoint.data.length > 0) ||
              (e[i].markLine &&
                e[i].markLine.data &&
                e[i].markLine.data.length > 0) ||
              (e[i].nodes && e[i].nodes.length > 0) ||
              (e[i].links && e[i].links.length > 0) ||
              (e[i].matrix && e[i].matrix.length > 0) ||
              (e[i].eventList && e[i].eventList.length > 0)
            )
              return !1;
          this.clear();
          var r = (this._option && this._option.noDataLoadingOption) ||
            this._themeConfig.noDataLoadingOption ||
            s.noDataLoadingOption || {
              text:
                (this._option && this._option.noDataText) ||
                this._themeConfig.noDataText ||
                s.noDataText,
              effect:
                (this._option && this._option.noDataEffect) ||
                this._themeConfig.noDataEffect ||
                s.noDataEffect,
            };
          return this.showLoading(r), !0;
        },
        _render: function (e) {
          if ((this._mergeGlobalConifg(e), !this._noDataCheck(e))) {
            var i = e.backgroundColor;
            i && (this.dom.style.backgroundColor = i),
              this._zr.clearAnimation(),
              (this._chartList = []);
            var o = t("./chart"),
              r = t("./component");
            (e.xAxis || e.yAxis) &&
              ((e.grid = e.grid || {}), (e.dataZoom = e.dataZoom || {}));
            for (
              var n,
                a,
                h,
                l = [
                  "title",
                  "legend",
                  "tooltip",
                  "dataRange",
                  "roamController",
                  "grid",
                  "dataZoom",
                  "xAxis",
                  "yAxis",
                  "polar",
                ],
                d = 0,
                c = l.length;
              c > d;
              d++
            )
              (a = l[d]),
                (h = this.component[a]),
                e[a]
                  ? (h
                      ? h.refresh && h.refresh(e)
                      : ((n = r.get(/^[xy]Axis$/.test(a) ? "axis" : a)),
                        (h = new n(
                          this._themeConfig,
                          this._messageCenter,
                          this._zr,
                          e,
                          this,
                          a
                        )),
                        (this.component[a] = h)),
                    this._chartList.push(h))
                  : h &&
                    (h.dispose(),
                    (this.component[a] = null),
                    delete this.component[a]);
            for (var p, u, g, f = {}, d = 0, c = e.series.length; c > d; d++)
              (u = e.series[d].type),
                u
                  ? f[u] ||
                    ((f[u] = !0),
                    (p = o.get(u)),
                    p
                      ? (this.chart[u]
                          ? ((g = this.chart[u]), g.refresh(e))
                          : (g = new p(
                              this._themeConfig,
                              this._messageCenter,
                              this._zr,
                              e,
                              this
                            )),
                        this._chartList.push(g),
                        (this.chart[u] = g))
                      : console.error(u + " has not been required."))
                  : console.error(
                      "series[" + d + "] chart type has not been defined."
                    );
            for (u in this.chart)
              u == s.CHART_TYPE_ISLAND ||
                f[u] ||
                (this.chart[u].dispose(),
                (this.chart[u] = null),
                delete this.chart[u]);
            this.component.grid &&
              this.component.grid.refixAxisShape(this.component),
              this._island.refresh(e),
              this._toolbox.refresh(e),
              e.animation && !e.renderAsImage
                ? this._zr.refresh()
                : this._zr.render();
            var m = "IMG" + this.id,
              y = document.getElementById(m);
            e.renderAsImage
              ? (y
                  ? (y.src = this.getDataURL(e.renderAsImage))
                  : ((y = this.getImage(e.renderAsImage)),
                    (y.id = m),
                    (y.style.position = "absolute"),
                    (y.style.left = 0),
                    (y.style.top = 0),
                    this.dom.firstChild.appendChild(y)),
                this.un(),
                this._zr.un(),
                this._disposeChartList(),
                this._zr.clear())
              : y && y.parentNode.removeChild(y),
              (y = null),
              (this._option = e);
          }
        },
        restore: function () {
          this._clearEffect(),
            (this._option = r.clone(this._optionRestore)),
            this._disposeChartList(),
            this._island.clear(),
            this._toolbox.reset(this._option, !0),
            this._render(this._option);
        },
        refresh: function (t) {
          this._clearEffect(), (t = t || {});
          var e = t.option;
          !this._refreshInside &&
            e &&
            ((e = this.getOption()),
            r.merge(e, t.option, !0),
            r.merge(this._optionRestore, t.option, !0),
            this._toolbox.reset(e)),
            this._island.refresh(e),
            this._toolbox.refresh(e),
            this._zr.clearAnimation();
          for (var i = 0, o = this._chartList.length; o > i; i++)
            this._chartList[i].refresh && this._chartList[i].refresh(e);
          this.component.grid &&
            this.component.grid.refixAxisShape(this.component),
            this._zr.refresh();
        },
        _disposeChartList: function () {
          this._clearEffect(), this._zr.clearAnimation();
          for (var t = this._chartList.length; t--; ) {
            var e = this._chartList[t];
            if (e) {
              var i = e.type;
              this.chart[i] && delete this.chart[i],
                this.component[i] && delete this.component[i],
                e.dispose && e.dispose();
            }
          }
          this._chartList = [];
        },
        _mergeGlobalConifg: function (e) {
          for (
            var i = [
                "backgroundColor",
                "calculable",
                "calculableColor",
                "calculableHolderColor",
                "nameConnector",
                "valueConnector",
                "animation",
                "animationThreshold",
                "animationDuration",
                "animationDurationUpdate",
                "animationEasing",
                "addDataAnimation",
                "symbolList",
                "DRAG_ENABLE_TIME",
              ],
              o = i.length;
            o--;

          ) {
            var r = i[o];
            null == e[r] &&
              (e[r] =
                null != this._themeConfig[r] ? this._themeConfig[r] : s[r]);
          }
          var n = e.color;
          (n && n.length) || (n = this._themeConfig.color || s.color),
            (this._zr.getColor = function (e) {
              var i = t("zrender/tool/color");
              return i.getColor(e, n);
            });
        },
        setOption: function (t, e) {
          return t.timeline
            ? this._setTimelineOption(t)
            : this._setOption(t, e);
        },
        _setOption: function (t, e) {
          return (
            (this._option =
              !e && this._option
                ? r.merge(this.getOption(), r.clone(t), !0)
                : r.clone(t)),
            (this._optionRestore = r.clone(this._option)),
            this._option.series && 0 !== this._option.series.length
              ? (this.component.dataZoom &&
                  (this._option.dataZoom ||
                    (this._option.toolbox &&
                      this._option.toolbox.feature &&
                      this._option.toolbox.feature.dataZoom &&
                      this._option.toolbox.feature.dataZoom.show)) &&
                  this.component.dataZoom.syncOption(this._option),
                this._toolbox.reset(this._option),
                this._render(this._option),
                this)
              : void this._zr.clear()
          );
        },
        getOption: function () {
          function t(t) {
            var o = i._optionRestore[t];
            if (o)
              if (o instanceof Array)
                for (var s = o.length; s--; ) e[t][s].data = r.clone(o[s].data);
              else e[t].data = r.clone(o.data);
          }
          var e = r.clone(this._option),
            i = this;
          return t("xAxis"), t("yAxis"), t("series"), e;
        },
        setSeries: function (t, e) {
          return (
            e
              ? ((this._option.series = t), this.setOption(this._option, e))
              : this.setOption({ series: t }),
            this
          );
        },
        getSeries: function () {
          return this.getOption().series;
        },
        _setTimelineOption: function (e) {
          this._timeline && this._timeline.dispose();
          var i = t("./component/timeline"),
            o = new i(
              this._themeConfig,
              this._messageCenter,
              this._zr,
              e,
              this
            );
          return (
            (this._timeline = o),
            (this.component.timeline = this._timeline),
            this
          );
        },
        addData: function (t, e, i, o, n) {
          for (
            var a = t instanceof Array ? t : [[t, e, i, o, n]],
              h = this.getOption(),
              l = this._optionRestore,
              d = 0,
              c = a.length;
            c > d;
            d++
          ) {
            (t = a[d][0]),
              (e = a[d][1]),
              (i = a[d][2]),
              (o = a[d][3]),
              (n = a[d][4]);
            var p = l.series[t],
              u = i ? "unshift" : "push",
              g = i ? "pop" : "shift";
            if (p) {
              var f = p.data,
                m = h.series[t].data;
              if ((f[u](e), m[u](e), o || (f[g](), (e = m[g]())), null != n)) {
                var y, _;
                if (
                  p.type === s.CHART_TYPE_PIE &&
                  (y = l.legend) &&
                  (_ = y.data)
                ) {
                  var v = h.legend.data;
                  if ((_[u](n), v[u](n), !o)) {
                    var x = r.indexOf(_, e.name);
                    -1 != x && _.splice(x, 1),
                      (x = r.indexOf(v, e.name)),
                      -1 != x && v.splice(x, 1);
                  }
                } else if (null != l.xAxis && null != l.yAxis) {
                  var b,
                    T,
                    S = p.xAxisIndex || 0;
                  (null == l.xAxis[S].type || "category" === l.xAxis[S].type) &&
                    ((b = l.xAxis[S].data),
                    (T = h.xAxis[S].data),
                    b[u](n),
                    T[u](n),
                    o || (b[g](), T[g]())),
                    (S = p.yAxisIndex || 0),
                    "category" === l.yAxis[S].type &&
                      ((b = l.yAxis[S].data),
                      (T = h.yAxis[S].data),
                      b[u](n),
                      T[u](n),
                      o || (b[g](), T[g]()));
                }
              }
              this._option.series[t].data = h.series[t].data;
            }
          }
          this._zr.clearAnimation();
          for (var C = this._chartList, d = 0, c = C.length; c > d; d++)
            h.addDataAnimation &&
              C[d].addDataAnimation &&
              C[d].addDataAnimation(a);
          this.component.dataZoom && this.component.dataZoom.syncOption(h),
            (this._option = h);
          var z = this;
          return (
            setTimeout(
              function () {
                if (z._zr) {
                  z._zr.clearAnimation();
                  for (var t = 0, e = C.length; e > t; t++)
                    C[t].motionlessOnce =
                      h.addDataAnimation && C[t].addDataAnimation;
                  z._messageCenter.dispatch(
                    s.EVENT.REFRESH,
                    null,
                    { option: h },
                    z
                  );
                }
              },
              h.addDataAnimation ? h.animationDurationUpdate : 0
            ),
            this
          );
        },
        addMarkPoint: function (t, e) {
          return this._addMark(t, e, "markPoint");
        },
        addMarkLine: function (t, e) {
          return this._addMark(t, e, "markLine");
        },
        _addMark: function (t, e, i) {
          var o,
            s = this._option.series;
          if (s && (o = s[t])) {
            var n = this._optionRestore.series,
              a = n[t],
              h = o[i],
              l = a[i];
            (h = o[i] = h || { data: [] }), (l = a[i] = l || { data: [] });
            for (var d in e)
              "data" === d
                ? ((h.data = h.data.concat(e.data)),
                  (l.data = l.data.concat(e.data)))
                : "object" != typeof e[d] || null == h[d]
                ? (h[d] = l[d] = e[d])
                : (r.merge(h[d], e[d], !0), r.merge(l[d], e[d], !0));
            var c = this.chart[o.type];
            c && c.addMark(t, e, i);
          }
          return this;
        },
        delMarkPoint: function (t, e) {
          return this._delMark(t, e, "markPoint");
        },
        delMarkLine: function (t, e) {
          return this._delMark(t, e, "markLine");
        },
        _delMark: function (t, e, i) {
          var o,
            s,
            r,
            n = this._option.series;
          if (!(n && (o = n[t]) && (s = o[i]) && (r = s.data))) return this;
          e = e.split(" > ");
          for (var a = -1, h = 0, l = r.length; l > h; h++) {
            var d = r[h];
            if (d instanceof Array) {
              if (d[0].name === e[0] && d[1].name === e[1]) {
                a = h;
                break;
              }
            } else if (d.name === e[0]) {
              a = h;
              break;
            }
          }
          if (a > -1) {
            r.splice(a, 1), this._optionRestore.series[t][i].data.splice(a, 1);
            var c = this.chart[o.type];
            c && c.delMark(t, e.join(" > "), i);
          }
          return this;
        },
        getDom: function () {
          return this.dom;
        },
        getZrender: function () {
          return this._zr;
        },
        getDataURL: function (t) {
          if (0 === this._chartList.length) {
            var e = "IMG" + this.id,
              i = document.getElementById(e);
            if (i) return i.src;
          }
          var o = this.component.tooltip;
          switch ((o && o.hideTip(), t)) {
            case "jpeg":
              break;
            default:
              t = "png";
          }
          var s = this._option.backgroundColor;
          return (
            s && "rgba(0,0,0,0)" === s.replace(" ", "") && (s = "#fff"),
            this._zr.toDataURL("image/" + t, s)
          );
        },
        getImage: function (t) {
          var e = this._optionRestore.title,
            i = document.createElement("img");
          return (
            (i.src = this.getDataURL(t)),
            (i.title = (e && e.text) || "ECharts"),
            i
          );
        },
        getConnectedDataURL: function (e) {
          if (!this.isConnected()) return this.getDataURL(e);
          var i = this.dom,
            o = {
              self: {
                img: this.getDataURL(e),
                left: i.offsetLeft,
                top: i.offsetTop,
                right: i.offsetLeft + i.offsetWidth,
                bottom: i.offsetTop + i.offsetHeight,
              },
            },
            s = o.self.left,
            r = o.self.top,
            n = o.self.right,
            a = o.self.bottom;
          for (var h in this._connected)
            (i = this._connected[h].getDom()),
              (o[h] = {
                img: this._connected[h].getDataURL(e),
                left: i.offsetLeft,
                top: i.offsetTop,
                right: i.offsetLeft + i.offsetWidth,
                bottom: i.offsetTop + i.offsetHeight,
              }),
              (s = Math.min(s, o[h].left)),
              (r = Math.min(r, o[h].top)),
              (n = Math.max(n, o[h].right)),
              (a = Math.max(a, o[h].bottom));
          var l = document.createElement("div");
          (l.style.position = "absolute"),
            (l.style.left = "-4000px"),
            (l.style.width = n - s + "px"),
            (l.style.height = a - r + "px"),
            document.body.appendChild(l);
          var d = t("zrender").init(l),
            c = t("zrender/shape/Image");
          for (var h in o)
            d.addShape(
              new c({
                style: { x: o[h].left - s, y: o[h].top - r, image: o[h].img },
              })
            );
          d.render();
          var p = this._option.backgroundColor;
          p && "rgba(0,0,0,0)" === p.replace(/ /g, "") && (p = "#fff");
          var u = d.toDataURL("image/png", p);
          return (
            setTimeout(function () {
              d.dispose(), l.parentNode.removeChild(l), (l = null);
            }, 100),
            u
          );
        },
        getConnectedImage: function (t) {
          var e = this._optionRestore.title,
            i = document.createElement("img");
          return (
            (i.src = this.getConnectedDataURL(t)),
            (i.title = (e && e.text) || "ECharts"),
            i
          );
        },
        on: function (t, e) {
          return this._messageCenterOutSide.bind(t, e, this), this;
        },
        un: function (t, e) {
          return this._messageCenterOutSide.unbind(t, e), this;
        },
        connect: function (t) {
          if (!t) return this;
          if ((this._connected || (this._connected = {}), t instanceof Array))
            for (var e = 0, i = t.length; i > e; e++)
              this._connected[t[e].id] = t[e];
          else this._connected[t.id] = t;
          return this;
        },
        disConnect: function (t) {
          if (!t || !this._connected) return this;
          if (t instanceof Array)
            for (var e = 0, i = t.length; i > e; e++)
              delete this._connected[t[e].id];
          else delete this._connected[t.id];
          for (var o in this._connected) return this;
          return (this._connected = !1), this;
        },
        connectedEventHandler: function (t) {
          t.__echartsId != this.id && this._onevent(t);
        },
        isConnected: function () {
          return !!this._connected;
        },
        showLoading: function (e) {
          var i = {
            bubble: t("zrender/loadingEffect/Bubble"),
            spin: t("zrender/loadingEffect/Spin"),
          };
          e = e || {};
          var o = e.textStyle || {};
          e.textStyle = o;
          var n = r.merge(
            r.merge(r.clone(o), this._themeConfig.textStyle),
            s.textStyle
          );
          (o.textFont =
            n.fontStyle +
            " " +
            n.fontWeight +
            " " +
            n.fontSize +
            "px " +
            n.fontFamily),
            (o.text =
              e.text ||
              (this._option && this._option.loadingText) ||
              this._themeConfig.loadingText ||
              s.loadingText),
            null != e.x && (o.x = e.x),
            null != e.y && (o.y = e.y),
            (e.effectOption = e.effectOption || {}),
            (e.effectOption.textStyle = o);
          var a = e.effect;
          return (
            ("string" == typeof a || null == a) &&
              (a =
                i[
                  e.effect ||
                    (this._option && this._option.loadingEffect) ||
                    this._themeConfig.loadingEffect ||
                    s.loadingEffect
                ] || i.spin),
            this._zr.showLoading(new a(e.effectOption)),
            this
          );
        },
        hideLoading: function () {
          return this._zr.hideLoading(), this;
        },
        setTheme: function (e) {
          if (e) {
            if ("string" == typeof e)
              switch (e) {
                case "macarons":
                  e = t("./theme/macarons");
                  break;
                case "infographic":
                  e = t("./theme/infographic");
                  break;
                default:
                  e = {};
              }
            else e = e || {};
            this._themeConfig = e;
          }
          this._timeline && this._timeline.setTheme(!0),
            this._optionRestore && this.restore();
        },
        resize: function () {
          var t = this;
          return function () {
            if (
              (t._clearEffect(),
              t._zr.resize(),
              t._option && t._option.renderAsImage)
            )
              return t._render(t._option), t;
            t._zr.clearAnimation(),
              t._island.resize(),
              t._toolbox.resize(),
              t._timeline && t._timeline.resize();
            for (var e = 0, i = t._chartList.length; i > e; e++)
              t._chartList[e].resize && t._chartList[e].resize();
            return (
              t.component.grid && t.component.grid.refixAxisShape(t.component),
              t._zr.refresh(),
              t._messageCenter.dispatch(s.EVENT.RESIZE, null, null, t),
              t
            );
          };
        },
        _clearEffect: function () {
          this._zr.modLayer(s.EFFECT_ZLEVEL, { motionBlur: !1 }),
            this._zr.painter.clearLayer(s.EFFECT_ZLEVEL);
        },
        clear: function () {
          return (
            this._disposeChartList(),
            this._zr.clear(),
            (this._option = {}),
            (this._optionRestore = {}),
            (this.dom.style.backgroundColor = null),
            this
          );
        },
        dispose: function () {
          var t = this.dom.getAttribute(d);
          t && delete l[t],
            this._island.dispose(),
            this._toolbox.dispose(),
            this._timeline && this._timeline.dispose(),
            this._messageCenter.unbind(),
            this.clear(),
            this._zr.dispose(),
            (this._zr = null);
        },
      }),
      a
    );
  }),
  define("echarts/config", [], function () {
    var t = {
      CHART_TYPE_LINE: "line",
      CHART_TYPE_BAR: "bar",
      CHART_TYPE_SCATTER: "scatter",
      CHART_TYPE_PIE: "pie",
      CHART_TYPE_RADAR: "radar",
      CHART_TYPE_MAP: "map",
      CHART_TYPE_K: "k",
      CHART_TYPE_ISLAND: "island",
      CHART_TYPE_FORCE: "force",
      CHART_TYPE_CHORD: "chord",
      CHART_TYPE_GAUGE: "gauge",
      CHART_TYPE_FUNNEL: "funnel",
      CHART_TYPE_EVENTRIVER: "eventRiver",
      COMPONENT_TYPE_TITLE: "title",
      COMPONENT_TYPE_LEGEND: "legend",
      COMPONENT_TYPE_DATARANGE: "dataRange",
      COMPONENT_TYPE_DATAVIEW: "dataView",
      COMPONENT_TYPE_DATAZOOM: "dataZoom",
      COMPONENT_TYPE_TOOLBOX: "toolbox",
      COMPONENT_TYPE_TOOLTIP: "tooltip",
      COMPONENT_TYPE_GRID: "grid",
      COMPONENT_TYPE_AXIS: "axis",
      COMPONENT_TYPE_POLAR: "polar",
      COMPONENT_TYPE_X_AXIS: "xAxis",
      COMPONENT_TYPE_Y_AXIS: "yAxis",
      COMPONENT_TYPE_AXIS_CATEGORY: "categoryAxis",
      COMPONENT_TYPE_AXIS_VALUE: "valueAxis",
      COMPONENT_TYPE_TIMELINE: "timeline",
      COMPONENT_TYPE_ROAMCONTROLLER: "roamController",
      backgroundColor: "rgba(0,0,0,0)",
      color: [
        "#ff7f50",
        "#87cefa",
        "#da70d6",
        "#32cd32",
        "#6495ed",
        "#ff69b4",
        "#ba55d3",
        "#cd5c5c",
        "#ffa500",
        "#40e0d0",
      ],
      markPoint: {
        clickable: !0,
        symbol: "pin",
        symbolSize: 10,
        large: !1,
        effect: {
          show: !1,
          loop: !0,
          period: 15,
          type: "scale",
          scaleSize: 2,
          bounceDistance: 10,
        },
        itemStyle: {
          normal: { borderWidth: 2, label: { show: !0, position: "inside" } },
          emphasis: { label: { show: !0 } },
        },
      },
      markLine: {
        clickable: !0,
        symbol: ["circle", "arrow"],
        symbolSize: [2, 2],
        smoothRadian: 0.2,
        precision: 2,
        effect: { show: !1, loop: !0, period: 15, scaleSize: 2 },
        itemStyle: {
          normal: {
            borderWidth: 1.5,
            label: {
              show: !0,
              position: "end",
              textStyle: { align: "right", baseline: "bottom" },
            },
            lineStyle: { type: "dashed" },
          },
          emphasis: {
            label: {
              show: !1,
              textStyle: { align: "right", baseline: "bottom" },
            },
            lineStyle: {},
          },
        },
      },
      textStyle: {
        decoration: "none",
        fontFamily: "Arial, Verdana, sans-serif",
        fontSize: 12,
        fontStyle: "normal",
        fontWeight: "normal",
      },
      EVENT: {
        REFRESH: "refresh",
        RESTORE: "restore",
        RESIZE: "resize",
        CLICK: "click",
        DBLCLICK: "dblclick",
        HOVER: "hover",
        MOUSEOUT: "mouseout",
        DATA_CHANGED: "dataChanged",
        DATA_ZOOM: "dataZoom",
        DATA_RANGE: "dataRange",
        DATA_RANGE_SELECTED: "dataRangeSelected",
        DATA_RANGE_HOVERLINK: "dataRangeHoverLink",
        LEGEND_SELECTED: "legendSelected",
        LEGEND_HOVERLINK: "legendHoverLink",
        MAP_SELECTED: "mapSelected",
        PIE_SELECTED: "pieSelected",
        MAGIC_TYPE_CHANGED: "magicTypeChanged",
        DATA_VIEW_CHANGED: "dataViewChanged",
        TIMELINE_CHANGED: "timelineChanged",
        MAP_ROAM: "mapRoam",
        FORCE_LAYOUT_END: "forceLayoutEnd",
        TOOLTIP_HOVER: "tooltipHover",
        TOOLTIP_IN_GRID: "tooltipInGrid",
        TOOLTIP_OUT_GRID: "tooltipOutGrid",
        ROAMCONTROLLER: "roamController",
      },
      DRAG_ENABLE_TIME: 120,
      EFFECT_ZLEVEL: 10,
      symbolList: [
        "emptyCircle",
        "emptyRectangle",
        "emptyTriangle",
        "emptyDiamond",
        "circle",
        "rectangle",
        "triangle",
        "diamond",
      ],
      loadingEffect: "spin",
      loadingText: "数据读取中...",
      noDataEffect: "bubble",
      noDataText: "暂无数据",
      calculable: !1,
      calculableColor: "rgba(255,165,0,0.6)",
      calculableHolderColor: "#ccc",
      nameConnector: " & ",
      valueConnector: ": ",
      animation: !0,
      addDataAnimation: !0,
      animationThreshold: 2e3,
      animationDuration: 2e3,
      animationDurationUpdate: 500,
      animationEasing: "ExponentialOut",
    };
    return t;
  }),
  define("zrender/tool/util", ["require"], function () {
    function t(t) {
      return t && 1 === t.nodeType && "string" == typeof t.nodeName;
    }
    function e(i) {
      if ("object" == typeof i && null !== i) {
        var o = i;
        if (i instanceof Array) {
          o = [];
          for (var s = 0, r = i.length; r > s; s++) o[s] = e(i[s]);
        } else if (!f[m.call(i)] && !t(i)) {
          o = {};
          for (var n in i) i.hasOwnProperty(n) && (o[n] = e(i[n]));
        }
        return o;
      }
      return i;
    }
    function i(e, i, s, r) {
      if (i.hasOwnProperty(s)) {
        var n = e[s];
        "object" != typeof n || f[m.call(n)] || t(n)
          ? (!r && s in e) || (e[s] = i[s])
          : o(e[s], i[s], r);
      }
    }
    function o(t, e, o) {
      for (var s in e) i(t, e, s, o);
      return t;
    }
    function s() {
      return d || (d = document.createElement("canvas").getContext("2d")), d;
    }
    function r() {
      return (
        p ||
          ((c = document.createElement("canvas")),
          (u = c.width),
          (g = c.height),
          (p = c.getContext("2d"))),
        p
      );
    }
    function n(t, e) {
      var i,
        o = 100;
      t + y > u && ((u = t + y + o), (c.width = u), (i = !0)),
        e + _ > g && ((g = e + _ + o), (c.height = g), (i = !0)),
        -y > t &&
          ((y = Math.ceil(-t / o) * o), (u += y), (c.width = u), (i = !0)),
        -_ > e &&
          ((_ = Math.ceil(-e / o) * o), (g += _), (c.height = g), (i = !0)),
        i && p.translate(y, _);
    }
    function a() {
      return { x: y, y: _ };
    }
    function h(t, e) {
      if (t.indexOf) return t.indexOf(e);
      for (var i = 0, o = t.length; o > i; i++) if (t[i] === e) return i;
      return -1;
    }
    function l(t, e) {
      function i() {}
      var o = t.prototype;
      (i.prototype = e.prototype), (t.prototype = new i());
      for (var s in o) t.prototype[s] = o[s];
      t.constructor = t;
    }
    var d,
      c,
      p,
      u,
      g,
      f = {
        "[object Function]": 1,
        "[object RegExp]": 1,
        "[object Date]": 1,
        "[object Error]": 1,
        "[object CanvasGradient]": 1,
      },
      m = Object.prototype.toString,
      y = 0,
      _ = 0;
    return {
      inherits: l,
      clone: e,
      merge: o,
      getContext: s,
      getPixelContext: r,
      getPixelOffset: a,
      adjustCanvasSize: n,
      indexOf: h,
    };
  }),
  define("zrender/tool/event", ["require", "../mixin/Eventful"], function (t) {
    "use strict";
    function e(t) {
      return (
        ("undefined" != typeof t.zrenderX && t.zrenderX) ||
        ("undefined" != typeof t.offsetX && t.offsetX) ||
        ("undefined" != typeof t.layerX && t.layerX) ||
        ("undefined" != typeof t.clientX && t.clientX)
      );
    }
    function i(t) {
      return (
        ("undefined" != typeof t.zrenderY && t.zrenderY) ||
        ("undefined" != typeof t.offsetY && t.offsetY) ||
        ("undefined" != typeof t.layerY && t.layerY) ||
        ("undefined" != typeof t.clientY && t.clientY)
      );
    }
    function o(t) {
      return (
        ("undefined" != typeof t.zrenderDelta && t.zrenderDelta) ||
        ("undefined" != typeof t.wheelDelta && t.wheelDelta) ||
        ("undefined" != typeof t.detail && -t.detail)
      );
    }
    var s = t("../mixin/Eventful"),
      r =
        "function" == typeof window.addEventListener
          ? function (t) {
              t.preventDefault(), t.stopPropagation(), (t.cancelBubble = !0);
            }
          : function (t) {
              (t.returnValue = !1), (t.cancelBubble = !0);
            };
    return { getX: e, getY: i, getDelta: o, stop: r, Dispatcher: s };
  }),
  define("zrender", ["zrender/zrender"], function (t) {
    return t;
  }),
  define("zrender/zrender", [
    "require",
    "./tool/util",
    "./tool/log",
    "./tool/guid",
    "./Handler",
    "./Painter",
    "./Storage",
    "./animation/Animation",
    "./tool/env",
  ], function (t) {
    function e(t) {
      return function () {
        for (var e = t.animatingElements, i = 0, o = e.length; o > i; i++)
          t.storage.mod(e[i].id);
        (e.length || t._needsRefreshNextFrame) && t.refresh();
      };
    }
    var i = t("./tool/util"),
      o = t("./tool/log"),
      s = t("./tool/guid"),
      r = t("./Handler"),
      n = t("./Painter"),
      a = t("./Storage"),
      h = t("./animation/Animation"),
      l = {},
      d = {};
    (d.version = "1.0.0"),
      (d.init = function (t) {
        var e = new c(s(), t);
        return (l[e.id] = e), e;
      }),
      (d.dispose = function (t) {
        if (t) t.dispose();
        else {
          for (var e in l) l[e].dispose();
          l = {};
        }
        return d;
      }),
      (d.getInstance = function (t) {
        return l[t];
      }),
      (d.delInstance = function (t) {
        return delete l[t], d;
      });
    var c = function (i, o) {
      (this.id = i),
        (this.env = t("./tool/env")),
        (this.storage = new a()),
        (this.painter = new n(o, this.storage)),
        (this.handler = new r(o, this.storage, this.painter)),
        (this.animatingElements = []),
        (this.animation = new h({ stage: { update: e(this) } })),
        this.animation.start();
      var s = this;
      (this.painter.refreshNextFrame = function () {
        s.refreshNextFrame();
      }),
        (this._needsRefreshNextFrame = !1);
    };
    return (
      (c.prototype.getId = function () {
        return this.id;
      }),
      (c.prototype.addShape = function (t) {
        return this.storage.addRoot(t), this;
      }),
      (c.prototype.addGroup = function (t) {
        return this.storage.addRoot(t), this;
      }),
      (c.prototype.delShape = function (t) {
        return this.storage.delRoot(t), this;
      }),
      (c.prototype.delGroup = function (t) {
        return this.storage.delRoot(t), this;
      }),
      (c.prototype.modShape = function (t, e) {
        return this.storage.mod(t, e), this;
      }),
      (c.prototype.modGroup = function (t, e) {
        return this.storage.mod(t, e), this;
      }),
      (c.prototype.modLayer = function (t, e) {
        return this.painter.modLayer(t, e), this;
      }),
      (c.prototype.addHoverShape = function (t) {
        return this.storage.addHover(t), this;
      }),
      (c.prototype.render = function (t) {
        return this.painter.render(t), (this._needsRefreshNextFrame = !1), this;
      }),
      (c.prototype.refresh = function (t) {
        return (
          this.painter.refresh(t), (this._needsRefreshNextFrame = !1), this
        );
      }),
      (c.prototype.refreshNextFrame = function () {
        return (this._needsRefreshNextFrame = !0), this;
      }),
      (c.prototype.refreshHover = function (t) {
        return this.painter.refreshHover(t), this;
      }),
      (c.prototype.refreshShapes = function (t, e) {
        return this.painter.refreshShapes(t, e), this;
      }),
      (c.prototype.resize = function () {
        return this.painter.resize(), this;
      }),
      (c.prototype.animate = function (t, e, s) {
        if (("string" == typeof t && (t = this.storage.get(t)), t)) {
          var r;
          if (e) {
            for (var n = e.split("."), a = t, h = 0, l = n.length; l > h; h++)
              a && (a = a[n[h]]);
            a && (r = a);
          } else r = t;
          if (!r)
            return void o(
              'Property "' + e + '" is not existed in element ' + t.id
            );
          var d = this.animatingElements;
          return (
            "undefined" == typeof t.__aniCount && (t.__aniCount = 0),
            0 === t.__aniCount && d.push(t),
            t.__aniCount++,
            this.animation.animate(r, { loop: s }).done(function () {
              if ((t.__aniCount--, 0 === t.__aniCount)) {
                var e = i.indexOf(d, t);
                d.splice(e, 1);
              }
            })
          );
        }
        o("Element not existed");
      }),
      (c.prototype.clearAnimation = function () {
        this.animation.clear();
      }),
      (c.prototype.showLoading = function (t) {
        return this.painter.showLoading(t), this;
      }),
      (c.prototype.hideLoading = function () {
        return this.painter.hideLoading(), this;
      }),
      (c.prototype.getWidth = function () {
        return this.painter.getWidth();
      }),
      (c.prototype.getHeight = function () {
        return this.painter.getHeight();
      }),
      (c.prototype.toDataURL = function (t, e, i) {
        return this.painter.toDataURL(t, e, i);
      }),
      (c.prototype.shapeToImage = function (t, e, i) {
        var o = s();
        return this.painter.shapeToImage(o, t, e, i);
      }),
      (c.prototype.on = function (t, e, i) {
        return this.handler.on(t, e, i), this;
      }),
      (c.prototype.un = function (t, e) {
        return this.handler.un(t, e), this;
      }),
      (c.prototype.trigger = function (t, e) {
        return this.handler.trigger(t, e), this;
      }),
      (c.prototype.clear = function () {
        return this.storage.delRoot(), this.painter.clear(), this;
      }),
      (c.prototype.dispose = function () {
        this.animation.stop(),
          this.clear(),
          this.storage.dispose(),
          this.painter.dispose(),
          this.handler.dispose(),
          (this.animation = this.animatingElements = this.storage = this.painter = this.handler = null),
          d.delInstance(this.id);
      }),
      d
    );
  }),
  define("zrender/config", [], function () {
    var t = {
      EVENT: {
        RESIZE: "resize",
        CLICK: "click",
        DBLCLICK: "dblclick",
        MOUSEWHEEL: "mousewheel",
        MOUSEMOVE: "mousemove",
        MOUSEOVER: "mouseover",
        MOUSEOUT: "mouseout",
        MOUSEDOWN: "mousedown",
        MOUSEUP: "mouseup",
        GLOBALOUT: "globalout",
        DRAGSTART: "dragstart",
        DRAGEND: "dragend",
        DRAGENTER: "dragenter",
        DRAGOVER: "dragover",
        DRAGLEAVE: "dragleave",
        DROP: "drop",
        touchClickDelay: 300,
      },
      catchBrushException: !1,
      debugMode: 0,
      devicePixelRatio: Math.max(window.devicePixelRatio || 1, 1),
    };
    return t;
  }),
  define("echarts/chart/island", [
    "require",
    "./base",
    "zrender/shape/Circle",
    "../config",
    "../util/ecData",
    "zrender/tool/util",
    "zrender/tool/event",
    "zrender/tool/color",
    "../util/accMath",
    "../chart",
  ], function (t) {
    function e(t, e, o, s, n) {
      i.call(this, t, e, o, s, n),
        this._nameConnector,
        this._valueConnector,
        (this._zrHeight = this.zr.getHeight()),
        (this._zrWidth = this.zr.getWidth());
      var h = this;
      h.shapeHandler.onmousewheel = function (t) {
        var e = t.target,
          i = t.event,
          o = a.getDelta(i);
        (o = o > 0 ? -1 : 1),
          (e.style.r -= o),
          (e.style.r = e.style.r < 5 ? 5 : e.style.r);
        var s = r.get(e, "value"),
          n = s * h.option.island.calculateStep;
        s = n > 1 ? Math.round(s - n * o) : +(s - n * o).toFixed(2);
        var l = r.get(e, "name");
        (e.style.text = l + ":" + s),
          r.set(e, "value", s),
          r.set(e, "name", l),
          h.zr.modShape(e.id),
          h.zr.refreshNextFrame(),
          a.stop(i);
      };
    }
    var i = t("./base"),
      o = t("zrender/shape/Circle"),
      s = t("../config");
    s.island = { zlevel: 0, z: 5, r: 15, calculateStep: 0.1 };
    var r = t("../util/ecData"),
      n = t("zrender/tool/util"),
      a = t("zrender/tool/event");
    return (
      (e.prototype = {
        type: s.CHART_TYPE_ISLAND,
        _combine: function (e, i) {
          var o = t("zrender/tool/color"),
            s = t("../util/accMath"),
            n = s.accAdd(r.get(e, "value"), r.get(i, "value")),
            a = r.get(e, "name") + this._nameConnector + r.get(i, "name");
          (e.style.text = a + this._valueConnector + n),
            r.set(e, "value", n),
            r.set(e, "name", a),
            (e.style.r = this.option.island.r),
            (e.style.color = o.mix(e.style.color, i.style.color));
        },
        refresh: function (t) {
          t &&
            ((t.island = this.reformOption(t.island)),
            (this.option = t),
            (this._nameConnector = this.option.nameConnector),
            (this._valueConnector = this.option.valueConnector));
        },
        getOption: function () {
          return this.option;
        },
        resize: function () {
          var t = this.zr.getWidth(),
            e = this.zr.getHeight(),
            i = t / (this._zrWidth || t),
            o = e / (this._zrHeight || e);
          if (1 !== i || 1 !== o) {
            (this._zrWidth = t), (this._zrHeight = e);
            for (var s = 0, r = this.shapeList.length; r > s; s++)
              this.zr.modShape(this.shapeList[s].id, {
                style: {
                  x: Math.round(this.shapeList[s].style.x * i),
                  y: Math.round(this.shapeList[s].style.y * o),
                },
              });
          }
        },
        add: function (t) {
          var e = r.get(t, "name"),
            i = r.get(t, "value"),
            s = null != r.get(t, "series") ? r.get(t, "series").name : "",
            n = this.getFont(this.option.island.textStyle),
            a = {
              zlevel: this.getZlevelBase(),
              z: this.getZBase(),
              style: {
                x: t.style.x,
                y: t.style.y,
                r: this.option.island.r,
                color: t.style.color || t.style.strokeColor,
                text: e + this._valueConnector + i,
                textFont: n,
              },
              draggable: !0,
              hoverable: !0,
              onmousewheel: this.shapeHandler.onmousewheel,
              _type: "island",
            };
          "#fff" === a.style.color && (a.style.color = t.style.strokeColor),
            this.setCalculable(a),
            (a.dragEnableTime = 0),
            r.pack(a, { name: s }, -1, i, -1, e),
            (a = new o(a)),
            this.shapeList.push(a),
            this.zr.addShape(a);
        },
        del: function (t) {
          this.zr.delShape(t.id);
          for (var e = [], i = 0, o = this.shapeList.length; o > i; i++)
            this.shapeList[i].id != t.id && e.push(this.shapeList[i]);
          this.shapeList = e;
        },
        ondrop: function (t, e) {
          if (this.isDrop && t.target) {
            var i = t.target,
              o = t.dragged;
            this._combine(i, o),
              this.zr.modShape(i.id),
              (e.dragIn = !0),
              (this.isDrop = !1);
          }
        },
        ondragend: function (t, e) {
          var i = t.target;
          this.isDragend
            ? e.dragIn && (this.del(i), (e.needRefresh = !0))
            : e.dragIn ||
              ((i.style.x = a.getX(t.event)),
              (i.style.y = a.getY(t.event)),
              this.add(i),
              (e.needRefresh = !0)),
            (this.isDragend = !1);
        },
      }),
      n.inherits(e, i),
      t("../chart").define("island", e),
      e
    );
  }),
  define("echarts/component/toolbox", [
    "require",
    "./base",
    "zrender/shape/Image",
    "zrender/shape/Rectangle",
    "../util/shape/Icon",
    "../config",
    "zrender/tool/util",
    "zrender/config",
    "zrender/tool/event",
    "../component",
  ], function (t) {
    function e(t, e, o, s, r) {
      i.call(this, t, e, o, s, r),
        (this.dom = r.dom),
        (this._magicType = {}),
        (this._magicMap = {}),
        (this._isSilence = !1),
        this._iconList,
        (this._iconShapeMap = {}),
        (this._featureTitle = {}),
        (this._featureIcon = {}),
        (this._featureColor = {}),
        (this._featureOption = {}),
        (this._enableColor = "red"),
        (this._disableColor = "#ccc"),
        (this._markShapeList = []);
      var n = this;
      (n._onDataZoom = function (t) {
        n.__onDataZoom(t);
      }),
        (n._onDataZoomReset = function (t) {
          n.__onDataZoomReset(t);
        }),
        (n._onRestore = function (t) {
          n.__onRestore(t);
        }),
        (n._onMagicType = function (t) {
          n.__onMagicType(t);
        }),
        (n._onCustomHandler = function (t) {
          n.__onCustomHandler(t);
        }),
        (n._onmousemove = function (t) {
          return n.__onmousemove(t);
        }),
        (n._onmousedown = function (t) {
          return n.__onmousedown(t);
        }),
        (n._onmouseup = function (t) {
          return n.__onmouseup(t);
        });
    }
    var i = t("./base"),
      o = t("zrender/shape/Image"),
      s = t("zrender/shape/Rectangle"),
      r = t("../util/shape/Icon"),
      n = t("../config");
    n.toolbox = {
      zlevel: 0,
      z: 6,
      show: !1,
      orient: "horizontal",
      x: "right",
      y: "bottom",
      color: ["#1e90ff", "#22bb22", "#4b0082", "#d2691e"],
      disableColor: "#ddd",
      effectiveColor: "red",
      backgroundColor: "rgba(0,0,0,0)",
      borderColor: "#ccc",
      borderWidth: 0,
      padding: 1,
      itemGap: 18,
      itemSize: 24,
      showTitle: !0,
      feature: {
        dataZoom: {
          show: !1,
          title: { dataZoom: "区域缩放", dataZoomReset: "区域缩放后退" },
        },
        magicType: {
          show: !1,
          title: {
            line: "折线图切换",
            bar: "柱形图切换",
            stack: "堆积",
            tiled: "平铺",
            force: "力导向布局图切换",
            chord: "和弦图切换",
            pie: "饼图切换",
            funnel: "漏斗图切换",
          },
          type: [],
        },
        restore: { show: !1, title: "还原" },
      },
    };
    var a = t("zrender/tool/util"),
      h = t("zrender/config"),
      l = t("zrender/tool/event"),
      d = "stack",
      c = "tiled";
    return (
      (e.prototype = {
        type: n.COMPONENT_TYPE_TOOLBOX,
        _buildShape: function () {
          this._iconList = [];
          var t = this.option.toolbox;
          (this._enableColor = t.effectiveColor),
            (this._disableColor = t.disableColor);
          var e = t.feature,
            i = [];
          for (var o in e)
            if (e[o].show)
              switch (o) {
                case "mark":
                  break;
                case "magicType":
                  for (var s = 0, r = e[o].type.length; r > s; s++)
                    (e[o].title[e[o].type[s] + "Chart"] =
                      e[o].title[e[o].type[s]]),
                      e[o].option &&
                        (e[o].option[e[o].type[s] + "Chart"] =
                          e[o].option[e[o].type[s]]),
                      i.push({ key: o, name: e[o].type[s] + "Chart" });
                  break;
                case "dataZoom":
                  i.push({ key: o, name: "dataZoom" }),
                    i.push({ key: o, name: "dataZoomReset" });
                  break;
                case "saveAsImage":
                case "dataView":
                  break;
                default:
                  i.push({ key: o, name: o });
              }
          if (i.length > 0) {
            for (var n, o, s = 0, r = i.length; r > s; s++)
              (n = i[s].name),
                (o = i[s].key),
                this._iconList.push(n),
                (this._featureTitle[n] = e[o].title[n] || e[o].title),
                e[o].icon && (this._featureIcon[n] = e[o].icon[n] || e[o].icon),
                e[o].color &&
                  (this._featureColor[n] = e[o].color[n] || e[o].color),
                e[o].option &&
                  (this._featureOption[n] = e[o].option[n] || e[o].option);
            (this._itemGroupLocation = this._getItemGroupLocation()),
              this._buildBackground(),
              this._buildItem();
            for (var s = 0, r = this.shapeList.length; r > s; s++)
              this.zr.addShape(this.shapeList[s]);
            this._iconShapeMap.dataZoomReset &&
              0 === this._zoomQueue.length &&
              this._iconDisable(this._iconShapeMap.dataZoomReset);
          }
        },
        _buildItem: function () {
          var t,
            e,
            i,
            s,
            n = this.option.toolbox,
            a = this._iconList.length,
            h = this._itemGroupLocation.x,
            l = this._itemGroupLocation.y,
            d = n.itemSize,
            c = n.itemGap,
            p = n.color instanceof Array ? n.color : [n.color],
            u = this.getFont(n.textStyle);
          "horizontal" === n.orient
            ? ((e =
                this._itemGroupLocation.y / this.zr.getHeight() < 0.5
                  ? "bottom"
                  : "top"),
              (i =
                this._itemGroupLocation.x / this.zr.getWidth() < 0.5
                  ? "left"
                  : "right"),
              (s =
                this._itemGroupLocation.y / this.zr.getHeight() < 0.5
                  ? "top"
                  : "bottom"))
            : (e =
                this._itemGroupLocation.x / this.zr.getWidth() < 0.5
                  ? "right"
                  : "left"),
            (this._iconShapeMap = {});
          for (var g = this, f = 0; a > f; f++) {
            switch (
              ((t = {
                type: "icon",
                zlevel: this.getZlevelBase(),
                z: this.getZBase(),
                style: {
                  x: h,
                  y: l,
                  width: d,
                  height: d,
                  iconType: this._iconList[f],
                  lineWidth: 1,
                  strokeColor:
                    this._featureColor[this._iconList[f]] || p[f % p.length],
                  brushType: "stroke",
                },
                highlightStyle: {
                  lineWidth: 1,
                  text: n.showTitle
                    ? this._featureTitle[this._iconList[f]]
                    : void 0,
                  textFont: u,
                  textPosition: e,
                  strokeColor:
                    this._featureColor[this._iconList[f]] || p[f % p.length],
                },
                hoverable: !0,
                clickable: !0,
              }),
              this._featureIcon[this._iconList[f]] &&
                ((t.style.image = this._featureIcon[this._iconList[f]].replace(
                  new RegExp("^image:\\/\\/"),
                  ""
                )),
                (t.style.opacity = 0.8),
                (t.highlightStyle.opacity = 1),
                (t.type = "image")),
              "horizontal" === n.orient &&
                (0 === f &&
                  "left" === i &&
                  ((t.highlightStyle.textPosition = "specific"),
                  (t.highlightStyle.textAlign = i),
                  (t.highlightStyle.textBaseline = s),
                  (t.highlightStyle.textX = h),
                  (t.highlightStyle.textY = "top" === s ? l + d + 10 : l - 10)),
                f === a - 1 &&
                  "right" === i &&
                  ((t.highlightStyle.textPosition = "specific"),
                  (t.highlightStyle.textAlign = i),
                  (t.highlightStyle.textBaseline = s),
                  (t.highlightStyle.textX = h + d),
                  (t.highlightStyle.textY =
                    "top" === s ? l + d + 10 : l - 10))),
              this._iconList[f])
            ) {
              case "dataZoom":
                t.onclick = g._onDataZoom;
                break;
              case "dataZoomReset":
                t.onclick = g._onDataZoomReset;
                break;
              case "restore":
                t.onclick = g._onRestore;
                break;
              default:
                this._iconList[f].match("Chart")
                  ? ((t._name = this._iconList[f].replace("Chart", "")),
                    (t.onclick = g._onMagicType))
                  : (t.onclick = g._onCustomHandler);
            }
            "icon" === t.type
              ? (t = new r(t))
              : "image" === t.type && (t = new o(t)),
              this.shapeList.push(t),
              (this._iconShapeMap[this._iconList[f]] = t),
              "horizontal" === n.orient ? (h += d + c) : (l += d + c);
          }
        },
        _buildBackground: function () {
          var t = this.option.toolbox,
            e = this.reformCssArray(this.option.toolbox.padding);
          this.shapeList.push(
            new s({
              zlevel: this.getZlevelBase(),
              z: this.getZBase(),
              hoverable: !1,
              style: {
                x: this._itemGroupLocation.x - e[3],
                y: this._itemGroupLocation.y - e[0],
                width: this._itemGroupLocation.width + e[3] + e[1],
                height: this._itemGroupLocation.height + e[0] + e[2],
                brushType: 0 === t.borderWidth ? "fill" : "both",
                color: t.backgroundColor,
                strokeColor: t.borderColor,
                lineWidth: t.borderWidth,
              },
            })
          );
        },
        _getItemGroupLocation: function () {
          var t = this.option.toolbox,
            e = this.reformCssArray(this.option.toolbox.padding),
            i = this._iconList.length,
            o = t.itemGap,
            s = t.itemSize,
            r = 0,
            n = 0;
          "horizontal" === t.orient
            ? ((r = (s + o) * i - o), (n = s))
            : ((n = (s + o) * i - o), (r = s));
          var a,
            h = this.zr.getWidth();
          switch (t.x) {
            case "center":
              a = Math.floor((h - r) / 2);
              break;
            case "left":
              a = e[3] + t.borderWidth;
              break;
            case "right":
              a = h - r - e[1] - t.borderWidth;
              break;
            default:
              (a = t.x - 0), (a = isNaN(a) ? 0 : a);
          }
          var l,
            d = this.zr.getHeight();
          switch (t.y) {
            case "top":
              l = e[0] + t.borderWidth;
              break;
            case "bottom":
              l = d - n - e[2] - t.borderWidth;
              break;
            case "center":
              l = Math.floor((d - n) / 2);
              break;
            default:
              (l = t.y - 0), (l = isNaN(l) ? 0 : l);
          }
          return { x: a, y: l, width: r, height: n };
        },
        __onmousemove: function (t) {
          this._zooming &&
            ((this._zoomShape.style.width =
              l.getX(t.event) - this._zoomShape.style.x),
            (this._zoomShape.style.height =
              l.getY(t.event) - this._zoomShape.style.y),
            this.zr.addHoverShape(this._zoomShape),
            (this.dom.style.cursor = "crosshair"),
            l.stop(t.event)),
            this._zoomStart &&
              "pointer" != this.dom.style.cursor &&
              "move" != this.dom.style.cursor &&
              (this.dom.style.cursor = "crosshair");
        },
        __onmousedown: function (t) {
          if (!t.target) {
            this._zooming = !0;
            var e = l.getX(t.event),
              i = l.getY(t.event),
              o = this.option.dataZoom || {};
            return (
              (this._zoomShape = new s({
                zlevel: this.getZlevelBase(),
                z: this.getZBase(),
                style: { x: e, y: i, width: 1, height: 1, brushType: "both" },
                highlightStyle: {
                  lineWidth: 2,
                  color: o.fillerColor || n.dataZoom.fillerColor,
                  strokeColor: o.handleColor || n.dataZoom.handleColor,
                  brushType: "both",
                },
              })),
              this.zr.addHoverShape(this._zoomShape),
              !0
            );
          }
        },
        __onmouseup: function () {
          if (
            !this._zoomShape ||
            Math.abs(this._zoomShape.style.width) < 10 ||
            Math.abs(this._zoomShape.style.height) < 10
          )
            return (this._zooming = !1), !0;
          if (this._zooming && this.component.dataZoom) {
            this._zooming = !1;
            var t = this.component.dataZoom.rectZoom(this._zoomShape.style);
            t &&
              (this._zoomQueue.push({
                start: t.start,
                end: t.end,
                start2: t.start2,
                end2: t.end2,
              }),
              this._iconEnable(this._iconShapeMap.dataZoomReset),
              this.zr.refreshNextFrame());
          }
          return !0;
        },
        __onDataZoom: function (t) {
          var e = t.target;
          if (this._zooming || this._zoomStart)
            this._resetZoom(),
              this.zr.refreshNextFrame(),
              (this.dom.style.cursor = "default");
          else {
            this.zr.modShape(e.id, {
              style: { strokeColor: this._enableColor },
            }),
              this.zr.refreshNextFrame(),
              (this._zoomStart = !0);
            var i = this;
            setTimeout(function () {
              i.zr &&
                i.zr.on(h.EVENT.MOUSEDOWN, i._onmousedown) &&
                i.zr.on(h.EVENT.MOUSEUP, i._onmouseup) &&
                i.zr.on(h.EVENT.MOUSEMOVE, i._onmousemove);
            }, 10),
              (this.dom.style.cursor = "crosshair");
          }
          return !0;
        },
        __onDataZoomReset: function () {
          return (
            this._zooming && (this._zooming = !1),
            this._zoomQueue.pop(),
            this._zoomQueue.length > 0
              ? this.component.dataZoom.absoluteZoom(
                  this._zoomQueue[this._zoomQueue.length - 1]
                )
              : (this.component.dataZoom.rectZoom(),
                this._iconDisable(this._iconShapeMap.dataZoomReset),
                this.zr.refreshNextFrame()),
            !0
          );
        },
        _resetZoom: function () {
          (this._zooming = !1),
            this._zoomStart &&
              ((this._zoomStart = !1),
              this._iconShapeMap.dataZoom &&
                this.zr.modShape(this._iconShapeMap.dataZoom.id, {
                  style: {
                    strokeColor: this._iconShapeMap.dataZoom.highlightStyle
                      .strokeColor,
                  },
                }),
              this.zr.un(h.EVENT.MOUSEDOWN, this._onmousedown),
              this.zr.un(h.EVENT.MOUSEUP, this._onmouseup),
              this.zr.un(h.EVENT.MOUSEMOVE, this._onmousemove));
        },
        _iconDisable: function (t) {
          "image" != t.type
            ? this.zr.modShape(t.id, {
                hoverable: !1,
                clickable: !1,
                style: { strokeColor: this._disableColor },
              })
            : this.zr.modShape(t.id, {
                hoverable: !1,
                clickable: !1,
                style: { opacity: 0.3 },
              });
        },
        _iconEnable: function (t) {
          "image" != t.type
            ? this.zr.modShape(t.id, {
                hoverable: !0,
                clickable: !0,
                style: { strokeColor: t.highlightStyle.strokeColor },
              })
            : this.zr.modShape(t.id, {
                hoverable: !0,
                clickable: !0,
                style: { opacity: 0.8 },
              });
        },
        __onRestore: function () {
          return (
            this._resetZoom(),
            this.messageCenter.dispatch(
              n.EVENT.RESTORE,
              null,
              null,
              this.myChart
            ),
            !0
          );
        },
        __onMagicType: function (t) {
          var e = t.target._name;
          return (
            this._magicType[e] ||
              ((this._magicType[e] = !0),
              e === n.CHART_TYPE_LINE
                ? (this._magicType[n.CHART_TYPE_BAR] = !1)
                : e === n.CHART_TYPE_BAR &&
                  (this._magicType[n.CHART_TYPE_LINE] = !1),
              e === n.CHART_TYPE_PIE
                ? (this._magicType[n.CHART_TYPE_FUNNEL] = !1)
                : e === n.CHART_TYPE_FUNNEL &&
                  (this._magicType[n.CHART_TYPE_PIE] = !1),
              e === n.CHART_TYPE_FORCE
                ? (this._magicType[n.CHART_TYPE_CHORD] = !1)
                : e === n.CHART_TYPE_CHORD &&
                  (this._magicType[n.CHART_TYPE_FORCE] = !1),
              e === d
                ? (this._magicType[c] = !1)
                : e === c && (this._magicType[d] = !1),
              this.messageCenter.dispatch(
                n.EVENT.MAGIC_TYPE_CHANGED,
                t.event,
                { magicType: this._magicType },
                this.myChart
              )),
            !0
          );
        },
        setMagicType: function (t) {
          (this._magicType = t),
            !this._isSilence &&
              this.messageCenter.dispatch(
                n.EVENT.MAGIC_TYPE_CHANGED,
                null,
                { magicType: this._magicType },
                this.myChart
              );
        },
        __onCustomHandler: function (t) {
          var e = t.target.style.iconType,
            i = this.option.toolbox.feature[e].onclick;
          "function" == typeof i && i.call(this, this.option);
        },
        reset: function (t, e) {
          if (
            (e && this.clear(),
            this.query(t, "toolbox.show") &&
              this.query(t, "toolbox.feature.magicType.show"))
          ) {
            var i = t.toolbox.feature.magicType.type,
              o = i.length;
            for (this._magicMap = {}; o--; ) this._magicMap[i[o]] = !0;
            o = t.series.length;
            for (var s, r; o--; )
              (s = t.series[o].type),
                this._magicMap[s] &&
                  ((r =
                    t.xAxis instanceof Array
                      ? t.xAxis[t.series[o].xAxisIndex || 0]
                      : t.xAxis),
                  r &&
                    "category" === (r.type || "category") &&
                    (r.__boundaryGap =
                      null != r.boundaryGap ? r.boundaryGap : !0),
                  (r =
                    t.yAxis instanceof Array
                      ? t.yAxis[t.series[o].yAxisIndex || 0]
                      : t.yAxis),
                  r &&
                    "category" === r.type &&
                    (r.__boundaryGap =
                      null != r.boundaryGap ? r.boundaryGap : !0),
                  (t.series[o].__type = s),
                  (t.series[o].__itemStyle = a.clone(
                    t.series[o].itemStyle || {}
                  ))),
                (this._magicMap[d] || this._magicMap[c]) &&
                  (t.series[o].__stack = t.series[o].stack);
          }
          this._magicType = e ? {} : this._magicType || {};
          for (var n in this._magicType)
            if (this._magicType[n]) {
              (this.option = t), this.getMagicOption();
              break;
            }
          var h = t.dataZoom;
          if (h && h.show) {
            var l =
                null != h.start && h.start >= 0 && h.start <= 100 ? h.start : 0,
              p = null != h.end && h.end >= 0 && h.end <= 100 ? h.end : 100;
            l > p && ((l += p), (p = l - p), (l -= p)),
              (this._zoomQueue = [{ start: l, end: p, start2: 0, end2: 100 }]);
          } else this._zoomQueue = [];
        },
        getMagicOption: function () {
          var t, e;
          if (
            this._magicType[n.CHART_TYPE_LINE] ||
            this._magicType[n.CHART_TYPE_BAR]
          ) {
            for (
              var i = this._magicType[n.CHART_TYPE_LINE] ? !1 : !0,
                o = 0,
                s = this.option.series.length;
              s > o;
              o++
            )
              (e = this.option.series[o].type),
                (e == n.CHART_TYPE_LINE || e == n.CHART_TYPE_BAR) &&
                  ((t =
                    this.option.xAxis instanceof Array
                      ? this.option.xAxis[this.option.series[o].xAxisIndex || 0]
                      : this.option.xAxis),
                  t &&
                    "category" === (t.type || "category") &&
                    (t.boundaryGap = i ? !0 : t.__boundaryGap),
                  (t =
                    this.option.yAxis instanceof Array
                      ? this.option.yAxis[this.option.series[o].yAxisIndex || 0]
                      : this.option.yAxis),
                  t &&
                    "category" === t.type &&
                    (t.boundaryGap = i ? !0 : t.__boundaryGap));
            this._defaultMagic(n.CHART_TYPE_LINE, n.CHART_TYPE_BAR);
          }
          if (
            (this._defaultMagic(n.CHART_TYPE_CHORD, n.CHART_TYPE_FORCE),
            this._defaultMagic(n.CHART_TYPE_PIE, n.CHART_TYPE_FUNNEL),
            this._magicType[d] || this._magicType[c])
          )
            for (var o = 0, s = this.option.series.length; s > o; o++)
              this._magicType[d]
                ? ((this.option.series[o].stack = "_ECHARTS_STACK_KENER_2014_"),
                  (e = d))
                : this._magicType[c] &&
                  ((this.option.series[o].stack = null), (e = c)),
                this._featureOption[e + "Chart"] &&
                  a.merge(
                    this.option.series[o],
                    this._featureOption[e + "Chart"] || {},
                    !0
                  );
          return this.option;
        },
        _defaultMagic: function (t, e) {
          if (this._magicType[t] || this._magicType[e])
            for (var i = 0, o = this.option.series.length; o > i; i++) {
              var s = this.option.series[i].type;
              (s == t || s == e) &&
                ((this.option.series[i].type = this._magicType[t] ? t : e),
                (this.option.series[i].itemStyle = a.clone(
                  this.option.series[i].__itemStyle
                )),
                (s = this.option.series[i].type),
                this._featureOption[s + "Chart"] &&
                  a.merge(
                    this.option.series[i],
                    this._featureOption[s + "Chart"] || {},
                    !0
                  ));
            }
        },
        silence: function (t) {
          this._isSilence = t;
        },
        resize: function () {
          this.clear(),
            this.option &&
              this.option.toolbox &&
              this.option.toolbox.show &&
              this._buildShape();
        },
        clear: function (t) {
          this.zr &&
            (this.zr.delShape(this.shapeList),
            (this.shapeList = []),
            t ||
              (this.zr.delShape(this._markShapeList),
              (this._markShapeList = [])));
        },
        onbeforDispose: function () {
          this._markShapeList = null;
        },
        refresh: function (t) {
          t &&
            (this._resetZoom(),
            (t.toolbox = this.reformOption(t.toolbox)),
            (this.option = t),
            this.clear(!0),
            t.toolbox.show && this._buildShape());
        },
      }),
      a.inherits(e, i),
      t("../component").define("toolbox", e),
      e
    );
  }),
  define("echarts/component", [], function () {
    var t = {},
      e = {};
    return (
      (t.define = function (i, o) {
        return (e[i] = o), t;
      }),
      (t.get = function (t) {
        return e[t];
      }),
      t
    );
  }),
  define("echarts/component/title", [
    "require",
    "./base",
    "zrender/shape/Text",
    "zrender/shape/Rectangle",
    "../config",
    "zrender/tool/util",
    "zrender/tool/area",
    "zrender/tool/color",
    "../component",
  ], function (t) {
    function e(t, e, o, s, r) {
      i.call(this, t, e, o, s, r), this.refresh(s);
    }
    var i = t("./base"),
      o = t("zrender/shape/Text"),
      s = t("zrender/shape/Rectangle"),
      r = t("../config");
    r.title = {
      zlevel: 0,
      z: 6,
      show: !0,
      text: "",
      subtext: "",
      x: "center",
      y: "top",
      backgroundColor: "rgba(0,0,0,0)",
      borderColor: "#ccc",
      borderWidth: 0,
      padding: 1,
      itemGap: 5,
      textStyle: { fontSize: 20, fontWeight: "bolder", color: "#333" },
      subtextStyle: { color: "#aaa" },
    };
    var n = t("zrender/tool/util"),
      a = t("zrender/tool/area"),
      h = t("zrender/tool/color");
    return (
      (e.prototype = {
        type: r.COMPONENT_TYPE_TITLE,
        _buildShape: function () {
          if (this.titleOption.show) {
            (this._itemGroupLocation = this._getItemGroupLocation()),
              this._buildBackground(),
              this._buildItem();
            for (var t = 0, e = this.shapeList.length; e > t; t++)
              this.zr.addShape(this.shapeList[t]);
          }
        },
        _buildItem: function () {
          var t = this.titleOption.text,
            e = this.titleOption.link,
            i = this.titleOption.target,
            s = this.titleOption.subtext,
            r = this.titleOption.sublink,
            n = this.titleOption.subtarget,
            a = this.getFont(this.titleOption.textStyle),
            l = this.getFont(this.titleOption.subtextStyle),
            d = this._itemGroupLocation.x,
            c = this._itemGroupLocation.y,
            p = this._itemGroupLocation.width,
            u = this._itemGroupLocation.height,
            g = {
              zlevel: this.getZlevelBase(),
              z: this.getZBase(),
              style: {
                y: c,
                color: this.titleOption.textStyle.color,
                text: t,
                textFont: a,
                textBaseline: "top",
              },
              highlightStyle: {
                color: h.lift(this.titleOption.textStyle.color, 1),
                brushType: "fill",
              },
              hoverable: !1,
            };
          e &&
            ((g.hoverable = !0),
            (g.clickable = !0),
            (g.onclick = function () {
              i && "self" == i ? (window.location = e) : window.open(e);
            }));
          var f = {
            zlevel: this.getZlevelBase(),
            z: this.getZBase(),
            style: {
              y: c + u,
              color: this.titleOption.subtextStyle.color,
              text: s,
              textFont: l,
              textBaseline: "bottom",
            },
            highlightStyle: {
              color: h.lift(this.titleOption.subtextStyle.color, 1),
              brushType: "fill",
            },
            hoverable: !1,
          };
          switch (
            (r &&
              ((f.hoverable = !0),
              (f.clickable = !0),
              (f.onclick = function () {
                n && "self" == n ? (window.location = r) : window.open(r);
              })),
            this.titleOption.x)
          ) {
            case "center":
              (g.style.x = f.style.x = d + p / 2),
                (g.style.textAlign = f.style.textAlign = "center");
              break;
            case "left":
              (g.style.x = f.style.x = d),
                (g.style.textAlign = f.style.textAlign = "left");
              break;
            case "right":
              (g.style.x = f.style.x = d + p),
                (g.style.textAlign = f.style.textAlign = "right");
              break;
            default:
              (d = this.titleOption.x - 0),
                (d = isNaN(d) ? 0 : d),
                (g.style.x = f.style.x = d);
          }
          this.titleOption.textAlign &&
            (g.style.textAlign = f.style.textAlign = this.titleOption.textAlign),
            this.shapeList.push(new o(g)),
            "" !== s && this.shapeList.push(new o(f));
        },
        _buildBackground: function () {
          var t = this.reformCssArray(this.titleOption.padding);
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
                brushType: 0 === this.titleOption.borderWidth ? "fill" : "both",
                color: this.titleOption.backgroundColor,
                strokeColor: this.titleOption.borderColor,
                lineWidth: this.titleOption.borderWidth,
              },
            })
          );
        },
        _getItemGroupLocation: function () {
          var t,
            e = this.reformCssArray(this.titleOption.padding),
            i = this.titleOption.text,
            o = this.titleOption.subtext,
            s = this.getFont(this.titleOption.textStyle),
            r = this.getFont(this.titleOption.subtextStyle),
            n = Math.max(a.getTextWidth(i, s), a.getTextWidth(o, r)),
            h =
              a.getTextHeight(i, s) +
              ("" === o ? 0 : this.titleOption.itemGap + a.getTextHeight(o, r)),
            l = this.zr.getWidth();
          switch (this.titleOption.x) {
            case "center":
              t = Math.floor((l - n) / 2);
              break;
            case "left":
              t = e[3] + this.titleOption.borderWidth;
              break;
            case "right":
              t = l - n - e[1] - this.titleOption.borderWidth;
              break;
            default:
              (t = this.titleOption.x - 0), (t = isNaN(t) ? 0 : t);
          }
          var d,
            c = this.zr.getHeight();
          switch (this.titleOption.y) {
            case "top":
              d = e[0] + this.titleOption.borderWidth;
              break;
            case "bottom":
              d = c - h - e[2] - this.titleOption.borderWidth;
              break;
            case "center":
              d = Math.floor((c - h) / 2);
              break;
            default:
              (d = this.titleOption.y - 0), (d = isNaN(d) ? 0 : d);
          }
          return { x: t, y: d, width: n, height: h };
        },
        refresh: function (t) {
          t &&
            ((this.option = t),
            (this.option.title = this.reformOption(this.option.title)),
            (this.titleOption = this.option.title),
            (this.titleOption.textStyle = this.getTextStyle(
              this.titleOption.textStyle
            )),
            (this.titleOption.subtextStyle = this.getTextStyle(
              this.titleOption.subtextStyle
            ))),
            this.clear(),
            this._buildShape();
        },
      }),
      n.inherits(e, i),
      t("../component").define("title", e),
      e
    );
  }),
  define("echarts/component/tooltip", [
    "require",
    "./base",
    "../util/shape/Cross",
    "zrender/shape/Line",
    "zrender/shape/Rectangle",
    "../config",
    "../util/ecData",
    "zrender/config",
    "zrender/tool/event",
    "zrender/tool/area",
    "zrender/tool/color",
    "zrender/tool/util",
    "zrender/shape/Base",
    "../component",
  ], function (t) {
    function e(t, e, r, n, a) {
      i.call(this, t, e, r, n, a), (this.dom = a.dom);
      var h = this;
      (h._onmousemove = function (t) {
        return h.__onmousemove(t);
      }),
        (h._onglobalout = function (t) {
          return h.__onglobalout(t);
        }),
        this.zr.on(l.EVENT.CLICK, h._onmousemove),
        this.zr.on(l.EVENT.MOUSEMOVE, h._onmousemove),
        this.zr.on(l.EVENT.GLOBALOUT, h._onglobalout),
        (h._hide = function (t) {
          return h.__hide(t);
        }),
        (h._tryShow = function (t) {
          return h.__tryShow(t);
        }),
        (h._refixed = function (t) {
          return h.__refixed(t);
        }),
        (h._setContent = function (t, e) {
          return h.__setContent(t, e);
        }),
        (this._tDom = this._tDom || document.createElement("div")),
        (this._tDom.onselectstart = function () {
          return !1;
        }),
        (this._tDom.onmouseover = function () {
          h._mousein = !0;
        }),
        (this._tDom.onmouseout = function () {
          h._mousein = !1;
        }),
        (this._tDom.className = "echarts-tooltip"),
        (this._tDom.style.position = "absolute"),
        (this.hasAppend = !1),
        this._axisLineShape && this.zr.delShape(this._axisLineShape.id),
        (this._axisLineShape = new s({
          zlevel: this.getZlevelBase(),
          z: this.getZBase(),
          invisible: !0,
          hoverable: !1,
        })),
        this.shapeList.push(this._axisLineShape),
        this.zr.addShape(this._axisLineShape),
        this._axisShadowShape && this.zr.delShape(this._axisShadowShape.id),
        (this._axisShadowShape = new s({
          zlevel: this.getZlevelBase(),
          z: 1,
          invisible: !0,
          hoverable: !1,
        })),
        this.shapeList.push(this._axisShadowShape),
        this.zr.addShape(this._axisShadowShape),
        this._axisCrossShape && this.zr.delShape(this._axisCrossShape.id),
        (this._axisCrossShape = new o({
          zlevel: this.getZlevelBase(),
          z: this.getZBase(),
          invisible: !0,
          hoverable: !1,
        })),
        this.shapeList.push(this._axisCrossShape),
        this.zr.addShape(this._axisCrossShape),
        (this.showing = !1),
        this.refresh(n);
    }
    var i = t("./base"),
      o = t("../util/shape/Cross"),
      s = t("zrender/shape/Line"),
      r = t("zrender/shape/Rectangle"),
      n = new r({}),
      a = t("../config");
    a.tooltip = {
      zlevel: 0,
      z: 8,
      show: !0,
      showContent: !0,
      trigger: "item",
      islandFormatter: "{a} <br/>{b} : {c}",
      showDelay: 0,
      hideDelay: 200,
      transitionDuration: 0.4,
      enterable: !1,
      backgroundColor: "rgba(0,0,0,0.7)",
      borderColor: "#333",
      borderRadius: 4,
      borderWidth: 0,
      padding: 5,
      axisPointer: {
        type: "line",
        lineStyle: { color: "#48b", width: 2, type: "solid" },
        crossStyle: { color: "#1e90ff", width: 1, type: "dashed" },
        shadowStyle: {
          color: "rgba(150,150,150,0.3)",
          width: "auto",
          type: "default",
        },
      },
      textStyle: { color: "#fff" },
    };
    var h = t("../util/ecData"),
      l = t("zrender/config"),
      d = t("zrender/tool/event"),
      c = t("zrender/tool/area"),
      p = t("zrender/tool/color"),
      u = t("zrender/tool/util"),
      g = t("zrender/shape/Base");
    return (
      (e.prototype = {
        type: a.COMPONENT_TYPE_TOOLTIP,
        _gCssText:
          "position:absolute;display:block;border-style:solid;white-space:nowrap;",
        _style: function (t) {
          if (!t) return "";
          var e = [];
          if (t.transitionDuration) {
            var i =
              "left " +
              t.transitionDuration +
              "s,top " +
              t.transitionDuration +
              "s";
            e.push("transition:" + i),
              e.push("-moz-transition:" + i),
              e.push("-webkit-transition:" + i),
              e.push("-o-transition:" + i);
          }
          t.backgroundColor &&
            (e.push("background-Color:" + p.toHex(t.backgroundColor)),
            e.push("filter:alpha(opacity=70)"),
            e.push("background-Color:" + t.backgroundColor)),
            null != t.borderWidth &&
              e.push("border-width:" + t.borderWidth + "px"),
            null != t.borderColor && e.push("border-color:" + t.borderColor),
            null != t.borderRadius &&
              (e.push("border-radius:" + t.borderRadius + "px"),
              e.push("-moz-border-radius:" + t.borderRadius + "px"),
              e.push("-webkit-border-radius:" + t.borderRadius + "px"),
              e.push("-o-border-radius:" + t.borderRadius + "px"));
          var o = t.textStyle;
          o &&
            (o.color && e.push("color:" + o.color),
            o.decoration && e.push("text-decoration:" + o.decoration),
            o.align && e.push("text-align:" + o.align),
            o.fontFamily && e.push("font-family:" + o.fontFamily),
            o.fontSize && e.push("font-size:" + o.fontSize + "px"),
            o.fontSize &&
              e.push("line-height:" + Math.round((3 * o.fontSize) / 2) + "px"),
            o.fontStyle && e.push("font-style:" + o.fontStyle),
            o.fontWeight && e.push("font-weight:" + o.fontWeight));
          var s = t.padding;
          return (
            null != s &&
              ((s = this.reformCssArray(s)),
              e.push(
                "padding:" +
                  s[0] +
                  "px " +
                  s[1] +
                  "px " +
                  s[2] +
                  "px " +
                  s[3] +
                  "px"
              )),
            (e = e.join(";") + ";")
          );
        },
        __hide: function () {
          (this._lastDataIndex = -1),
            (this._lastSeriesIndex = -1),
            (this._lastItemTriggerId = -1),
            this._tDom && (this._tDom.style.display = "none");
          var t = !1;
          this._axisLineShape.invisible ||
            ((this._axisLineShape.invisible = !0),
            this.zr.modShape(this._axisLineShape.id),
            (t = !0)),
            this._axisShadowShape.invisible ||
              ((this._axisShadowShape.invisible = !0),
              this.zr.modShape(this._axisShadowShape.id),
              (t = !0)),
            this._axisCrossShape.invisible ||
              ((this._axisCrossShape.invisible = !0),
              this.zr.modShape(this._axisCrossShape.id),
              (t = !0)),
            this._lastTipShape &&
              this._lastTipShape.tipShape.length > 0 &&
              (this.zr.delShape(this._lastTipShape.tipShape),
              (this._lastTipShape = !1),
              (this.shapeList.length = 2)),
            t && this.zr.refreshNextFrame(),
            (this.showing = !1);
        },
        _show: function (t, e, i, o) {
          var s = this._tDom.offsetHeight,
            r = this._tDom.offsetWidth;
          t &&
            ("function" == typeof t && (t = t([e, i])),
            t instanceof Array && ((e = t[0]), (i = t[1]))),
            e + r > this._zrWidth && (e -= r + 40),
            i + s > this._zrHeight && (i -= s - 20),
            20 > i && (i = 0),
            (this._tDom.style.cssText =
              this._gCssText +
              this._defaultCssText +
              (o ? o : "") +
              "left:" +
              e +
              "px;top:" +
              i +
              "px;"),
            (10 > s || 10 > r) && setTimeout(this._refixed, 20),
            (this.showing = !0);
        },
        __refixed: function () {
          if (this._tDom) {
            var t = "",
              e = this._tDom.offsetHeight,
              i = this._tDom.offsetWidth;
            this._tDom.offsetLeft + i > this._zrWidth &&
              (t += "left:" + (this._zrWidth - i - 20) + "px;"),
              this._tDom.offsetTop + e > this._zrHeight &&
                (t += "top:" + (this._zrHeight - e - 10) + "px;"),
              "" !== t && (this._tDom.style.cssText += t);
          }
        },
        __tryShow: function () {
          var t, e;
          if (this._curTarget) {
            if ("island" === this._curTarget._type && this.option.tooltip.show)
              return void this._showItemTrigger();
            var i = h.get(this._curTarget, "series"),
              o = h.get(this._curTarget, "data");
            (t = this.deepQuery([o, i, this.option], "tooltip.show")),
              null != i && null != o && t
                ? ((e = this.deepQuery([o, i, this.option], "tooltip.trigger")),
                  "axis" === e
                    ? this._showAxisTrigger(
                        i.xAxisIndex,
                        i.yAxisIndex,
                        h.get(this._curTarget, "dataIndex")
                      )
                    : this._showItemTrigger())
                : (clearTimeout(this._hidingTicket),
                  clearTimeout(this._showingTicket),
                  (this._hidingTicket = setTimeout(
                    this._hide,
                    this._hideDelay
                  )));
          } else this._findPolarTrigger() || this._findAxisTrigger();
        },
        _findAxisTrigger: function () {
          if (!this.component.xAxis || !this.component.yAxis)
            return void (this._hidingTicket = setTimeout(
              this._hide,
              this._hideDelay
            ));
          for (
            var t, e, i = this.option.series, o = 0, s = i.length;
            s > o;
            o++
          )
            if (
              "axis" === this.deepQuery([i[o], this.option], "tooltip.trigger")
            )
              return (
                (t = i[o].xAxisIndex || 0),
                (e = i[o].yAxisIndex || 0),
                this.component.xAxis.getAxis(t) &&
                this.component.xAxis.getAxis(t).type ===
                  a.COMPONENT_TYPE_AXIS_CATEGORY
                  ? void this._showAxisTrigger(
                      t,
                      e,
                      this._getNearestDataIndex(
                        "x",
                        this.component.xAxis.getAxis(t)
                      )
                    )
                  : this.component.yAxis.getAxis(e) &&
                    this.component.yAxis.getAxis(e).type ===
                      a.COMPONENT_TYPE_AXIS_CATEGORY
                  ? void this._showAxisTrigger(
                      t,
                      e,
                      this._getNearestDataIndex(
                        "y",
                        this.component.yAxis.getAxis(e)
                      )
                    )
                  : void this._showAxisTrigger(t, e, -1)
              );
          "cross" === this.option.tooltip.axisPointer.type &&
            this._showAxisTrigger(-1, -1, -1);
        },
        _findPolarTrigger: function () {
          if (!this.component.polar) return !1;
          var t,
            e = d.getX(this._event),
            i = d.getY(this._event),
            o = this.component.polar.getNearestIndex([e, i]);
          return (
            o ? ((t = o.valueIndex), (o = o.polarIndex)) : (o = -1),
            -1 != o ? this._showPolarTrigger(o, t) : !1
          );
        },
        _getNearestDataIndex: function (t, e) {
          var i = -1,
            o = d.getX(this._event),
            s = d.getY(this._event);
          if ("x" === t) {
            for (
              var r,
                n,
                a = this.component.grid.getXend(),
                h = e.getCoordByIndex(i);
              a > h && ((n = h), o >= h);

            )
              (r = h), (h = e.getCoordByIndex(++i));
            return (
              0 >= i
                ? (i = 0)
                : n - o >= o - r
                ? (i -= 1)
                : null == e.getNameByIndex(i) && (i -= 1),
              i
            );
          }
          for (
            var l, c, p = this.component.grid.getY(), h = e.getCoordByIndex(i);
            h > p && ((l = h), h >= s);

          )
            (c = h), (h = e.getCoordByIndex(++i));
          return (
            0 >= i
              ? (i = 0)
              : s - l >= c - s
              ? (i -= 1)
              : null == e.getNameByIndex(i) && (i -= 1),
            i
          );
        },
        _showAxisTrigger: function (t, e, i) {
          if (
            (!this._event.connectTrigger &&
              this.messageCenter.dispatch(
                a.EVENT.TOOLTIP_IN_GRID,
                this._event,
                null,
                this.myChart
              ),
            null == this.component.xAxis ||
              null == this.component.yAxis ||
              null == t ||
              null == e)
          )
            return (
              clearTimeout(this._hidingTicket),
              clearTimeout(this._showingTicket),
              void (this._hidingTicket = setTimeout(
                this._hide,
                this._hideDelay
              ))
            );
          var o,
            s,
            r,
            n,
            h = this.option.series,
            l = [],
            c = [],
            p = "";
          if ("axis" === this.option.tooltip.trigger) {
            if (!this.option.tooltip.show) return;
            (s = this.option.tooltip.formatter),
              (r = this.option.tooltip.position);
          }
          var u,
            g,
            f =
              -1 != t &&
              this.component.xAxis.getAxis(t).type ===
                a.COMPONENT_TYPE_AXIS_CATEGORY
                ? "xAxis"
                : -1 != e &&
                  this.component.yAxis.getAxis(e).type ===
                    a.COMPONENT_TYPE_AXIS_CATEGORY
                ? "yAxis"
                : !1;
          if (f) {
            var m = "xAxis" == f ? t : e;
            o = this.component[f].getAxis(m);
            for (var y = 0, _ = h.length; _ > y; y++)
              this._isSelected(h[y].name) &&
                h[y][f + "Index"] === m &&
                "axis" ===
                  this.deepQuery([h[y], this.option], "tooltip.trigger") &&
                ((n = this.query(h[y], "tooltip.showContent") || n),
                (s = this.query(h[y], "tooltip.formatter") || s),
                (r = this.query(h[y], "tooltip.position") || r),
                (p += this._style(this.query(h[y], "tooltip"))),
                null != h[y].stack && "xAxis" == f
                  ? (l.unshift(h[y]), c.unshift(y))
                  : (l.push(h[y]), c.push(y)));
            this.messageCenter.dispatch(
              a.EVENT.TOOLTIP_HOVER,
              this._event,
              { seriesIndex: c, dataIndex: i },
              this.myChart
            );
            var v;
            "xAxis" == f
              ? ((u = this.subPixelOptimize(
                  o.getCoordByIndex(i),
                  this._axisLineWidth
                )),
                (g = d.getY(this._event)),
                (v = [
                  u,
                  this.component.grid.getY(),
                  u,
                  this.component.grid.getYend(),
                ]))
              : ((u = d.getX(this._event)),
                (g = this.subPixelOptimize(
                  o.getCoordByIndex(i),
                  this._axisLineWidth
                )),
                (v = [
                  this.component.grid.getX(),
                  g,
                  this.component.grid.getXend(),
                  g,
                ])),
              this._styleAxisPointer(
                l,
                v[0],
                v[1],
                v[2],
                v[3],
                o.getGap(),
                u,
                g
              );
          } else
            (u = d.getX(this._event)),
              (g = d.getY(this._event)),
              this._styleAxisPointer(
                h,
                this.component.grid.getX(),
                g,
                this.component.grid.getXend(),
                g,
                0,
                u,
                g
              ),
              i >= 0
                ? this._showItemTrigger(!0)
                : (clearTimeout(this._hidingTicket),
                  clearTimeout(this._showingTicket),
                  (this._tDom.style.display = "none"));
          if (l.length > 0) {
            if (
              ((this._lastItemTriggerId = -1),
              this._lastDataIndex != i || this._lastSeriesIndex != c[0])
            ) {
              (this._lastDataIndex = i), (this._lastSeriesIndex = c[0]);
              var x, b;
              if ("function" == typeof s) {
                for (var T = [], y = 0, _ = l.length; _ > y; y++)
                  (x = l[y].data[i]),
                    (b = this.getDataFromOption(x, "-")),
                    T.push({
                      seriesIndex: c[y],
                      seriesName: l[y].name || "",
                      series: l[y],
                      dataIndex: i,
                      data: x,
                      name: o.getNameByIndex(i),
                      value: b,
                      0: l[y].name || "",
                      1: o.getNameByIndex(i),
                      2: b,
                      3: x,
                    });
                (this._curTicket = "axis:" + i),
                  (this._tDom.innerHTML = s.call(
                    this.myChart,
                    T,
                    this._curTicket,
                    this._setContent
                  ));
              } else if ("string" == typeof s) {
                (this._curTicket = 0 / 0),
                  (s = s
                    .replace("{a}", "{a0}")
                    .replace("{b}", "{b0}")
                    .replace("{c}", "{c0}"));
                for (var y = 0, _ = l.length; _ > y; y++)
                  (s = s.replace(
                    "{a" + y + "}",
                    this._encodeHTML(l[y].name || "")
                  )),
                    (s = s.replace(
                      "{b" + y + "}",
                      this._encodeHTML(o.getNameByIndex(i))
                    )),
                    (x = l[y].data[i]),
                    (x = this.getDataFromOption(x, "-")),
                    (s = s.replace(
                      "{c" + y + "}",
                      x instanceof Array ? x : this.numAddCommas(x)
                    ));
                this._tDom.innerHTML = s;
              } else {
                (this._curTicket = 0 / 0),
                  (s = this._encodeHTML(o.getNameByIndex(i)));
                for (var y = 0, _ = l.length; _ > y; y++)
                  (s += "<br/>" + this._encodeHTML(l[y].name || "") + " : "),
                    (x = l[y].data[i]),
                    (x = this.getDataFromOption(x, "-")),
                    (s += x instanceof Array ? x : this.numAddCommas(x));
                this._tDom.innerHTML = s;
              }
            }
            if (n === !1 || !this.option.tooltip.showContent) return;
            this.hasAppend ||
              ((this._tDom.style.left = this._zrWidth / 2 + "px"),
              (this._tDom.style.top = this._zrHeight / 2 + "px"),
              this.dom.firstChild.appendChild(this._tDom),
              (this.hasAppend = !0)),
              this._show(r, u + 10, g + 10, p);
          }
        },
        _showPolarTrigger: function (t, e) {
          if (null == this.component.polar || null == t || null == e || 0 > e)
            return !1;
          var i,
            o,
            s,
            r = this.option.series,
            n = [],
            a = [],
            h = "";
          if ("axis" === this.option.tooltip.trigger) {
            if (!this.option.tooltip.show) return !1;
            (i = this.option.tooltip.formatter),
              (o = this.option.tooltip.position);
          }
          for (
            var l = this.option.polar[t].indicator[e].text, c = 0, p = r.length;
            p > c;
            c++
          )
            this._isSelected(r[c].name) &&
              r[c].polarIndex === t &&
              "axis" ===
                this.deepQuery([r[c], this.option], "tooltip.trigger") &&
              ((s = this.query(r[c], "tooltip.showContent") || s),
              (i = this.query(r[c], "tooltip.formatter") || i),
              (o = this.query(r[c], "tooltip.position") || o),
              (h += this._style(this.query(r[c], "tooltip"))),
              n.push(r[c]),
              a.push(c));
          if (n.length > 0) {
            for (var u, g, f, m = [], c = 0, p = n.length; p > c; c++) {
              u = n[c].data;
              for (var y = 0, _ = u.length; _ > y; y++)
                (g = u[y]),
                  this._isSelected(g.name) &&
                    ((g =
                      null != g ? g : { name: "", value: { dataIndex: "-" } }),
                    (f = this.getDataFromOption(g.value[e])),
                    m.push({
                      seriesIndex: a[c],
                      seriesName: n[c].name || "",
                      series: n[c],
                      dataIndex: e,
                      data: g,
                      name: g.name,
                      indicator: l,
                      value: f,
                      0: n[c].name || "",
                      1: g.name,
                      2: f,
                      3: l,
                    }));
            }
            if (m.length <= 0) return;
            if (
              ((this._lastItemTriggerId = -1),
              this._lastDataIndex != e || this._lastSeriesIndex != a[0])
            )
              if (
                ((this._lastDataIndex = e),
                (this._lastSeriesIndex = a[0]),
                "function" == typeof i)
              )
                (this._curTicket = "axis:" + e),
                  (this._tDom.innerHTML = i.call(
                    this.myChart,
                    m,
                    this._curTicket,
                    this._setContent
                  ));
              else if ("string" == typeof i) {
                i = i
                  .replace("{a}", "{a0}")
                  .replace("{b}", "{b0}")
                  .replace("{c}", "{c0}")
                  .replace("{d}", "{d0}");
                for (var c = 0, p = m.length; p > c; c++)
                  (i = i.replace(
                    "{a" + c + "}",
                    this._encodeHTML(m[c].seriesName)
                  )),
                    (i = i.replace(
                      "{b" + c + "}",
                      this._encodeHTML(m[c].name)
                    )),
                    (i = i.replace(
                      "{c" + c + "}",
                      this.numAddCommas(m[c].value)
                    )),
                    (i = i.replace(
                      "{d" + c + "}",
                      this._encodeHTML(m[c].indicator)
                    ));
                this._tDom.innerHTML = i;
              } else {
                i =
                  this._encodeHTML(m[0].name) +
                  "<br/>" +
                  this._encodeHTML(m[0].indicator) +
                  " : " +
                  this.numAddCommas(m[0].value);
                for (var c = 1, p = m.length; p > c; c++)
                  (i += "<br/>" + this._encodeHTML(m[c].name) + "<br/>"),
                    (i +=
                      this._encodeHTML(m[c].indicator) +
                      " : " +
                      this.numAddCommas(m[c].value));
                this._tDom.innerHTML = i;
              }
            if (s === !1 || !this.option.tooltip.showContent) return;
            return (
              this.hasAppend ||
                ((this._tDom.style.left = this._zrWidth / 2 + "px"),
                (this._tDom.style.top = this._zrHeight / 2 + "px"),
                this.dom.firstChild.appendChild(this._tDom),
                (this.hasAppend = !0)),
              this._show(o, d.getX(this._event), d.getY(this._event), h),
              !0
            );
          }
        },
        _showItemTrigger: function (t) {
          if (this._curTarget) {
            var e,
              i,
              o,
              s = h.get(this._curTarget, "series"),
              r = h.get(this._curTarget, "seriesIndex"),
              n = h.get(this._curTarget, "data"),
              l = h.get(this._curTarget, "dataIndex"),
              c = h.get(this._curTarget, "name"),
              p = h.get(this._curTarget, "value"),
              u = h.get(this._curTarget, "special"),
              g = h.get(this._curTarget, "special2"),
              f = [n, s, this.option],
              m = "";
            if ("island" != this._curTarget._type) {
              var y = t ? "axis" : "item";
              this.option.tooltip.trigger === y &&
                ((e = this.option.tooltip.formatter),
                (i = this.option.tooltip.position)),
                this.query(s, "tooltip.trigger") === y &&
                  ((o = this.query(s, "tooltip.showContent") || o),
                  (e = this.query(s, "tooltip.formatter") || e),
                  (i = this.query(s, "tooltip.position") || i),
                  (m += this._style(this.query(s, "tooltip")))),
                (o = this.query(n, "tooltip.showContent") || o),
                (e = this.query(n, "tooltip.formatter") || e),
                (i = this.query(n, "tooltip.position") || i),
                (m += this._style(this.query(n, "tooltip")));
            } else
              (this._lastItemTriggerId = 0 / 0),
                (o = this.deepQuery(f, "tooltip.showContent")),
                (e = this.deepQuery(f, "tooltip.islandFormatter")),
                (i = this.deepQuery(f, "tooltip.islandPosition"));
            (this._lastDataIndex = -1),
              (this._lastSeriesIndex = -1),
              this._lastItemTriggerId !== this._curTarget.id &&
                ((this._lastItemTriggerId = this._curTarget.id),
                "function" == typeof e
                  ? ((this._curTicket = (s.name || "") + ":" + l),
                    (this._tDom.innerHTML = e.call(
                      this.myChart,
                      {
                        seriesIndex: r,
                        seriesName: s.name || "",
                        series: s,
                        dataIndex: l,
                        data: n,
                        name: c,
                        value: p,
                        percent: u,
                        indicator: u,
                        value2: g,
                        indicator2: g,
                        0: s.name || "",
                        1: c,
                        2: p,
                        3: u,
                        4: g,
                        5: n,
                        6: r,
                        7: l,
                      },
                      this._curTicket,
                      this._setContent
                    )))
                  : "string" == typeof e
                  ? ((this._curTicket = 0 / 0),
                    (e = e
                      .replace("{a}", "{a0}")
                      .replace("{b}", "{b0}")
                      .replace("{c}", "{c0}")),
                    (e = e
                      .replace("{a0}", this._encodeHTML(s.name || ""))
                      .replace("{b0}", this._encodeHTML(c))
                      .replace(
                        "{c0}",
                        p instanceof Array ? p : this.numAddCommas(p)
                      )),
                    (e = e.replace("{d}", "{d0}").replace("{d0}", u || "")),
                    (e = e
                      .replace("{e}", "{e0}")
                      .replace(
                        "{e0}",
                        h.get(this._curTarget, "special2") || ""
                      )),
                    (this._tDom.innerHTML = e))
                  : ((this._curTicket = 0 / 0),
                    (this._tDom.innerHTML =
                      s.type === a.CHART_TYPE_RADAR && u
                        ? this._itemFormatter.radar.call(this, s, c, p, u)
                        : s.type === a.CHART_TYPE_EVENTRIVER
                        ? this._itemFormatter.eventRiver.call(this, s, c, p, n)
                        : "" +
                          (null != s.name
                            ? this._encodeHTML(s.name) + "<br/>"
                            : "") +
                          ("" === c ? "" : this._encodeHTML(c) + " : ") +
                          (p instanceof Array ? p : this.numAddCommas(p)))));
            var _ = d.getX(this._event),
              v = d.getY(this._event);
            this.deepQuery(f, "tooltip.axisPointer.show") &&
              this.component.grid &&
              this._styleAxisPointer(
                [s],
                this.component.grid.getX(),
                v,
                this.component.grid.getXend(),
                v,
                0,
                _,
                v
              ),
              o !== !1 &&
                this.option.tooltip.showContent &&
                (this.hasAppend ||
                  ((this._tDom.style.left = this._zrWidth / 2 + "px"),
                  (this._tDom.style.top = this._zrHeight / 2 + "px"),
                  this.dom.firstChild.appendChild(this._tDom),
                  (this.hasAppend = !0)),
                this._show(i, _ + 20, v - 20, m));
          }
        },
        _itemFormatter: {
          radar: function (t, e, i, o) {
            var s = "";
            (s += this._encodeHTML("" === e ? t.name || "" : e)),
              (s += "" === s ? "" : "<br />");
            for (var r = 0; r < o.length; r++)
              s +=
                this._encodeHTML(o[r].text) +
                " : " +
                this.numAddCommas(i[r]) +
                "<br />";
            return s;
          },
          chord: function (t, e, i, o, s) {
            if (null == s)
              return this._encodeHTML(e) + " (" + this.numAddCommas(i) + ")";
            var r = this._encodeHTML(e),
              n = this._encodeHTML(o);
            return (
              "" +
              (null != t.name ? this._encodeHTML(t.name) + "<br/>" : "") +
              r +
              " -> " +
              n +
              " (" +
              this.numAddCommas(i) +
              ")<br />" +
              n +
              " -> " +
              r +
              " (" +
              this.numAddCommas(s) +
              ")"
            );
          },
          eventRiver: function (t, e, i, o) {
            var s = "";
            (s += this._encodeHTML("" === t.name ? "" : t.name + " : ")),
              (s += this._encodeHTML(e)),
              (s += "" === s ? "" : "<br />"),
              (o = o.evolution);
            for (var r = 0, n = o.length; n > r; r++)
              (s += '<div style="padding-top:5px;">'),
                o[r].detail &&
                  (o[r].detail.img &&
                    (s +=
                      '<img src="' +
                      o[r].detail.img +
                      '" style="float:left;width:40px;height:40px;">'),
                  (s +=
                    '<div style="margin-left:45px;">' + o[r].time + "<br/>"),
                  (s += '<a href="' + o[r].detail.link + '" target="_blank">'),
                  (s += o[r].detail.text + "</a></div>"),
                  (s += "</div>"));
            return s;
          },
        },
        _styleAxisPointer: function (t, e, i, o, s, r, n, a) {
          if (t.length > 0) {
            var h,
              l,
              d = this.option.tooltip.axisPointer,
              c = d.type,
              p = { line: {}, cross: {}, shadow: {} };
            for (var u in p)
              (p[u].color = d[u + "Style"].color),
                (p[u].width = d[u + "Style"].width),
                (p[u].type = d[u + "Style"].type);
            for (var g = 0, f = t.length; f > g; g++)
              (h = t[g]),
                (l = this.query(h, "tooltip.axisPointer.type")),
                (c = l || c),
                l &&
                  ((p[l].color =
                    this.query(h, "tooltip.axisPointer." + l + "Style.color") ||
                    p[l].color),
                  (p[l].width =
                    this.query(h, "tooltip.axisPointer." + l + "Style.width") ||
                    p[l].width),
                  (p[l].type =
                    this.query(h, "tooltip.axisPointer." + l + "Style.type") ||
                    p[l].type));
            if ("line" === c) {
              var m = p.line.width,
                y = e == o;
              (this._axisLineShape.style = {
                xStart: y ? this.subPixelOptimize(e, m) : e,
                yStart: y ? i : this.subPixelOptimize(i, m),
                xEnd: y ? this.subPixelOptimize(o, m) : o,
                yEnd: y ? s : this.subPixelOptimize(s, m),
                strokeColor: p.line.color,
                lineWidth: m,
                lineType: p.line.type,
              }),
                (this._axisLineShape.invisible = !1),
                this.zr.modShape(this._axisLineShape.id);
            } else if ("cross" === c) {
              var _ = p.cross.width;
              (this._axisCrossShape.style = {
                brushType: "stroke",
                rect: this.component.grid.getArea(),
                x: this.subPixelOptimize(n, _),
                y: this.subPixelOptimize(a, _),
                text: (
                  "( " +
                  this.component.xAxis.getAxis(0).getValueFromCoord(n) +
                  " , " +
                  this.component.yAxis.getAxis(0).getValueFromCoord(a) +
                  " )"
                )
                  .replace("  , ", " ")
                  .replace(" ,  ", " "),
                textPosition: "specific",
                strokeColor: p.cross.color,
                lineWidth: _,
                lineType: p.cross.type,
              }),
                this.component.grid.getXend() - n > 100
                  ? ((this._axisCrossShape.style.textAlign = "left"),
                    (this._axisCrossShape.style.textX = n + 10))
                  : ((this._axisCrossShape.style.textAlign = "right"),
                    (this._axisCrossShape.style.textX = n - 10)),
                a - this.component.grid.getY() > 50
                  ? ((this._axisCrossShape.style.textBaseline = "bottom"),
                    (this._axisCrossShape.style.textY = a - 10))
                  : ((this._axisCrossShape.style.textBaseline = "top"),
                    (this._axisCrossShape.style.textY = a + 10)),
                (this._axisCrossShape.invisible = !1),
                this.zr.modShape(this._axisCrossShape.id);
            } else
              "shadow" === c &&
                ((null == p.shadow.width ||
                  "auto" === p.shadow.width ||
                  isNaN(p.shadow.width)) &&
                  (p.shadow.width = r),
                e === o
                  ? Math.abs(this.component.grid.getX() - e) < 2
                    ? ((p.shadow.width /= 2), (e = o += p.shadow.width / 2))
                    : Math.abs(this.component.grid.getXend() - e) < 2 &&
                      ((p.shadow.width /= 2), (e = o -= p.shadow.width / 2))
                  : i === s &&
                    (Math.abs(this.component.grid.getY() - i) < 2
                      ? ((p.shadow.width /= 2), (i = s += p.shadow.width / 2))
                      : Math.abs(this.component.grid.getYend() - i) < 2 &&
                        ((p.shadow.width /= 2), (i = s -= p.shadow.width / 2))),
                (this._axisShadowShape.style = {
                  xStart: e,
                  yStart: i,
                  xEnd: o,
                  yEnd: s,
                  strokeColor: p.shadow.color,
                  lineWidth: p.shadow.width,
                }),
                (this._axisShadowShape.invisible = !1),
                this.zr.modShape(this._axisShadowShape.id));
            this.zr.refreshNextFrame();
          }
        },
        __onmousemove: function (t) {
          if (
            (clearTimeout(this._hidingTicket),
            clearTimeout(this._showingTicket),
            !this._mousein || !this._enterable)
          ) {
            var e = t.target,
              i = d.getX(t.event),
              o = d.getY(t.event);
            if (e) {
              (this._curTarget = e),
                (this._event = t.event),
                (this._event.zrenderX = i),
                (this._event.zrenderY = o);
              var s;
              if (
                this._needAxisTrigger &&
                this.component.polar &&
                -1 != (s = this.component.polar.isInside([i, o]))
              )
                for (
                  var r = this.option.series, h = 0, l = r.length;
                  l > h;
                  h++
                )
                  if (
                    r[h].polarIndex === s &&
                    "axis" ===
                      this.deepQuery([r[h], this.option], "tooltip.trigger")
                  ) {
                    this._curTarget = null;
                    break;
                  }
              this._showingTicket = setTimeout(this._tryShow, this._showDelay);
            } else
              (this._curTarget = !1),
                (this._event = t.event),
                (this._event.zrenderX = i),
                (this._event.zrenderY = o),
                this._needAxisTrigger &&
                this.component.grid &&
                c.isInside(n, this.component.grid.getArea(), i, o)
                  ? (this._showingTicket = setTimeout(
                      this._tryShow,
                      this._showDelay
                    ))
                  : this._needAxisTrigger &&
                    this.component.polar &&
                    -1 != this.component.polar.isInside([i, o])
                  ? (this._showingTicket = setTimeout(
                      this._tryShow,
                      this._showDelay
                    ))
                  : (!this._event.connectTrigger &&
                      this.messageCenter.dispatch(
                        a.EVENT.TOOLTIP_OUT_GRID,
                        this._event,
                        null,
                        this.myChart
                      ),
                    (this._hidingTicket = setTimeout(
                      this._hide,
                      this._hideDelay
                    )));
          }
        },
        __onglobalout: function () {
          clearTimeout(this._hidingTicket),
            clearTimeout(this._showingTicket),
            (this._hidingTicket = setTimeout(this._hide, this._hideDelay));
        },
        __setContent: function (t, e) {
          this._tDom &&
            (t === this._curTicket && (this._tDom.innerHTML = e),
            setTimeout(this._refixed, 20));
        },
        ontooltipHover: function (t, e) {
          if (
            !this._lastTipShape ||
            (this._lastTipShape && this._lastTipShape.dataIndex != t.dataIndex)
          ) {
            this._lastTipShape &&
              this._lastTipShape.tipShape.length > 0 &&
              (this.zr.delShape(this._lastTipShape.tipShape),
              (this.shapeList.length = 2));
            for (var i = 0, o = e.length; o > i; i++)
              (e[i].zlevel = this.getZlevelBase()),
                (e[i].z = this.getZBase()),
                (e[i].style = g.prototype.getHighlightStyle(
                  e[i].style,
                  e[i].highlightStyle
                )),
                (e[i].draggable = !1),
                (e[i].hoverable = !1),
                (e[i].clickable = !1),
                (e[i].ondragend = null),
                (e[i].ondragover = null),
                (e[i].ondrop = null),
                this.shapeList.push(e[i]),
                this.zr.addShape(e[i]);
            this._lastTipShape = { dataIndex: t.dataIndex, tipShape: e };
          }
        },
        ondragend: function () {
          this._hide();
        },
        onlegendSelected: function (t) {
          this._selectedMap = t.selected;
        },
        _setSelectedMap: function () {
          this._selectedMap = this.component.legend
            ? u.clone(this.component.legend.getSelectedMap())
            : {};
        },
        _isSelected: function (t) {
          return null != this._selectedMap[t] ? this._selectedMap[t] : !0;
        },
        showTip: function (t) {
          if (t) {
            var e,
              i = this.option.series;
            if (null != t.seriesIndex) e = t.seriesIndex;
            else
              for (var o = t.seriesName, s = 0, r = i.length; r > s; s++)
                if (i[s].name === o) {
                  e = s;
                  break;
                }
            var n = i[e];
            if (null != n) {
              var d = this.myChart.chart[n.type],
                c =
                  "axis" ===
                  this.deepQuery([n, this.option], "tooltip.trigger");
              if (d)
                if (c) {
                  var p = t.dataIndex;
                  switch (d.type) {
                    case a.CHART_TYPE_LINE:
                    case a.CHART_TYPE_BAR:
                    case a.CHART_TYPE_K:
                      if (
                        null == this.component.xAxis ||
                        null == this.component.yAxis ||
                        n.data.length <= p
                      )
                        return;
                      var u = n.xAxisIndex || 0,
                        g = n.yAxisIndex || 0;
                      (this._event =
                        this.component.xAxis.getAxis(u).type ===
                        a.COMPONENT_TYPE_AXIS_CATEGORY
                          ? {
                              zrenderX: this.component.xAxis
                                .getAxis(u)
                                .getCoordByIndex(p),
                              zrenderY:
                                this.component.grid.getY() +
                                (this.component.grid.getYend() -
                                  this.component.grid.getY()) /
                                  4,
                            }
                          : {
                              zrenderX:
                                this.component.grid.getX() +
                                (this.component.grid.getXend() -
                                  this.component.grid.getX()) /
                                  4,
                              zrenderY: this.component.yAxis
                                .getAxis(g)
                                .getCoordByIndex(p),
                            }),
                        this._showAxisTrigger(u, g, p);
                      break;
                    case a.CHART_TYPE_RADAR:
                      if (
                        null == this.component.polar ||
                        n.data[0].value.length <= p
                      )
                        return;
                      var f = n.polarIndex || 0,
                        m = this.component.polar.getVector(f, p, "max");
                      (this._event = { zrenderX: m[0], zrenderY: m[1] }),
                        this._showPolarTrigger(f, p);
                  }
                } else {
                  var y,
                    _,
                    v = d.shapeList;
                  switch (d.type) {
                    case a.CHART_TYPE_LINE:
                    case a.CHART_TYPE_BAR:
                    case a.CHART_TYPE_K:
                    case a.CHART_TYPE_SCATTER:
                      for (var p = t.dataIndex, s = 0, r = v.length; r > s; s++)
                        if (
                          null == v[s]._mark &&
                          h.get(v[s], "seriesIndex") == e &&
                          h.get(v[s], "dataIndex") == p
                        ) {
                          (this._curTarget = v[s]),
                            (y = v[s].style.x),
                            (_ =
                              d.type != a.CHART_TYPE_K
                                ? v[s].style.y
                                : v[s].style.y[0]);
                          break;
                        }
                      break;
                    case a.CHART_TYPE_RADAR:
                      for (var p = t.dataIndex, s = 0, r = v.length; r > s; s++)
                        if (
                          "polygon" === v[s].type &&
                          h.get(v[s], "seriesIndex") == e &&
                          h.get(v[s], "dataIndex") == p
                        ) {
                          this._curTarget = v[s];
                          var m = this.component.polar.getCenter(
                            n.polarIndex || 0
                          );
                          (y = m[0]), (_ = m[1]);
                          break;
                        }
                      break;
                    case a.CHART_TYPE_PIE:
                      for (var x = t.name, s = 0, r = v.length; r > s; s++)
                        if (
                          "sector" === v[s].type &&
                          h.get(v[s], "seriesIndex") == e &&
                          h.get(v[s], "name") == x
                        ) {
                          this._curTarget = v[s];
                          var b = this._curTarget.style,
                            T =
                              (((b.startAngle + b.endAngle) / 2) * Math.PI) /
                              180;
                          (y =
                            this._curTarget.style.x +
                            (Math.cos(T) * b.r) / 1.5),
                            (_ =
                              this._curTarget.style.y -
                              (Math.sin(T) * b.r) / 1.5);
                          break;
                        }
                      break;
                    case a.CHART_TYPE_MAP:
                      for (
                        var x = t.name, S = n.mapType, s = 0, r = v.length;
                        r > s;
                        s++
                      )
                        if (
                          "text" === v[s].type &&
                          v[s]._mapType === S &&
                          v[s].style._name === x
                        ) {
                          (this._curTarget = v[s]),
                            (y =
                              this._curTarget.style.x +
                              this._curTarget.position[0]),
                            (_ =
                              this._curTarget.style.y +
                              this._curTarget.position[1]);
                          break;
                        }
                      break;
                    case a.CHART_TYPE_CHORD:
                      for (var x = t.name, s = 0, r = v.length; r > s; s++)
                        if (
                          "sector" === v[s].type &&
                          h.get(v[s], "name") == x
                        ) {
                          this._curTarget = v[s];
                          var b = this._curTarget.style,
                            T =
                              (((b.startAngle + b.endAngle) / 2) * Math.PI) /
                              180;
                          return (
                            (y =
                              this._curTarget.style.x +
                              Math.cos(T) * (b.r - 2)),
                            (_ =
                              this._curTarget.style.y -
                              Math.sin(T) * (b.r - 2)),
                            void this.zr.trigger(l.EVENT.MOUSEMOVE, {
                              zrenderX: y,
                              zrenderY: _,
                            })
                          );
                        }
                      break;
                    case a.CHART_TYPE_FORCE:
                      for (var x = t.name, s = 0, r = v.length; r > s; s++)
                        if (
                          "circle" === v[s].type &&
                          h.get(v[s], "name") == x
                        ) {
                          (this._curTarget = v[s]),
                            (y = this._curTarget.position[0]),
                            (_ = this._curTarget.position[1]);
                          break;
                        }
                  }
                  null != y &&
                    null != _ &&
                    ((this._event = { zrenderX: y, zrenderY: _ }),
                    this.zr.addHoverShape(this._curTarget),
                    this.zr.refreshHover(),
                    this._showItemTrigger());
                }
            }
          }
        },
        hideTip: function () {
          this._hide();
        },
        refresh: function (t) {
          if (
            ((this._zrHeight = this.zr.getHeight()),
            (this._zrWidth = this.zr.getWidth()),
            this._lastTipShape &&
              this._lastTipShape.tipShape.length > 0 &&
              this.zr.delShape(this._lastTipShape.tipShape),
            (this._lastTipShape = !1),
            (this.shapeList.length = 2),
            (this._lastDataIndex = -1),
            (this._lastSeriesIndex = -1),
            (this._lastItemTriggerId = -1),
            t)
          ) {
            (this.option = t),
              (this.option.tooltip = this.reformOption(this.option.tooltip)),
              (this.option.tooltip.textStyle = u.merge(
                this.option.tooltip.textStyle,
                this.ecTheme.textStyle
              )),
              (this._needAxisTrigger = !1),
              "axis" === this.option.tooltip.trigger &&
                (this._needAxisTrigger = !0);
            for (var e = this.option.series, i = 0, o = e.length; o > i; i++)
              if ("axis" === this.query(e[i], "tooltip.trigger")) {
                this._needAxisTrigger = !0;
                break;
              }
            (this._showDelay = this.option.tooltip.showDelay),
              (this._hideDelay = this.option.tooltip.hideDelay),
              (this._defaultCssText = this._style(this.option.tooltip)),
              this._setSelectedMap(),
              (this._axisLineWidth = this.option.tooltip.axisPointer.lineStyle.width),
              (this._enterable = this.option.tooltip.enterable);
          }
          if (this.showing) {
            var s = this;
            setTimeout(function () {
              s.zr.trigger(l.EVENT.MOUSEMOVE, s.zr.handler._event);
            }, 50);
          }
        },
        onbeforDispose: function () {
          this._lastTipShape &&
            this._lastTipShape.tipShape.length > 0 &&
            this.zr.delShape(this._lastTipShape.tipShape),
            clearTimeout(this._hidingTicket),
            clearTimeout(this._showingTicket),
            this.zr.un(l.EVENT.CLICK, this._onmousemove),
            this.zr.un(l.EVENT.MOUSEMOVE, this._onmousemove),
            this.zr.un(l.EVENT.GLOBALOUT, this._onglobalout),
            this.hasAppend &&
              this.dom.firstChild &&
              this.dom.firstChild.removeChild(this._tDom),
            (this._tDom = null);
        },
        _encodeHTML: function (t) {
          return String(t)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        },
      }),
      u.inherits(e, i),
      t("../component").define("tooltip", e),
      e
    );
  }),
  define("echarts/component/legend", [
    "require",
    "./base",
    "zrender/shape/Text",
    "zrender/shape/Rectangle",
    "zrender/shape/Sector",
    "../util/shape/Icon",
    "../util/shape/Candle",
    "../config",
    "zrender/tool/util",
    "zrender/tool/area",
    "../component",
  ], function (t) {
    function e(t, e, o, s, r) {
      if (!this.query(s, "legend.data"))
        return void console.error("option.legend.data has not been defined.");
      i.call(this, t, e, o, s, r);
      var n = this;
      (n._legendSelected = function (t) {
        n.__legendSelected(t);
      }),
        (this._colorIndex = 0),
        (this._colorMap = {}),
        (this._selectedMap = {}),
        (this._hasDataMap = {}),
        this.refresh(s);
    }
    var i = t("./base"),
      o = t("zrender/shape/Text"),
      s = t("zrender/shape/Rectangle"),
      r = t("zrender/shape/Sector"),
      n = t("../util/shape/Icon"),
      a = t("../util/shape/Candle"),
      h = t("../config");
    h.legend = {
      zlevel: 0,
      z: 4,
      show: !0,
      orient: "horizontal",
      x: "center",
      y: "top",
      backgroundColor: "rgba(0,0,0,0)",
      borderColor: "#ccc",
      borderWidth: 0,
      padding: 1,
      itemGap: 10,
      itemWidth: 18,
      itemHeight: 18,
      textStyle: { fontSize: 18, color: "#333" },
      selectedMode: !0,
    };
    var l = t("zrender/tool/util"),
      d = t("zrender/tool/area");
    e.prototype = {
      type: h.COMPONENT_TYPE_LEGEND,
      _buildShape: function () {
        if (this.legendOption.show) {
          (this._itemGroupLocation = this._getItemGroupLocation()),
            this._buildBackground(),
            this._buildItem();
          for (var t = 0, e = this.shapeList.length; e > t; t++)
            this.zr.addShape(this.shapeList[t]);
        }
      },
      _buildItem: function () {
        var t,
          e,
          i,
          s,
          r,
          a,
          h,
          c,
          p = this.legendOption.data,
          u = p.length,
          g = this.legendOption.textStyle,
          f = this.zr.getWidth(),
          m = this.zr.getHeight(),
          y = this._itemGroupLocation.x,
          _ = this._itemGroupLocation.y,
          v = this.legendOption.itemWidth,
          x = this.legendOption.itemHeight,
          b = this.legendOption.itemGap;
        "vertical" === this.legendOption.orient &&
          "right" === this.legendOption.x &&
          (y = this._itemGroupLocation.x + this._itemGroupLocation.width - v);
        for (var T = 0; u > T; T++)
          (r = l.merge(p[T].textStyle || {}, g)),
            (a = this.getFont(r)),
            (t = this._getName(p[T])),
            (h = this._getFormatterName(t)),
            "" !== t
              ? ((e = p[T].icon || this._getSomethingByName(t).type),
                (c = this.getColor(t)),
                "horizontal" === this.legendOption.orient
                  ? 200 > f - y &&
                    v +
                      5 +
                      d.getTextWidth(h, a) +
                      (T === u - 1 || "" === p[T + 1] ? 0 : b) >=
                      f - y &&
                    ((y = this._itemGroupLocation.x), (_ += x + b))
                  : 200 > m - _ &&
                    x + (T === u - 1 || "" === p[T + 1] ? 0 : b) >= m - _ &&
                    ("right" === this.legendOption.x
                      ? (y -= this._itemGroupLocation.maxWidth + b)
                      : (y += this._itemGroupLocation.maxWidth + b),
                    (_ = this._itemGroupLocation.y)),
                (i = this._getItemShapeByType(
                  y,
                  _,
                  v,
                  x,
                  this._selectedMap[t] && this._hasDataMap[t] ? c : "#ccc",
                  e,
                  c
                )),
                (i._name = t),
                (i = new n(i)),
                (s = {
                  zlevel: this.getZlevelBase(),
                  z: this.getZBase(),
                  style: {
                    x: y + v + 5,
                    y: _ + x / 2,
                    color: this._selectedMap[t]
                      ? "auto" === r.color
                        ? c
                        : r.color
                      : "#ccc",
                    text: h,
                    textFont: a,
                    textBaseline: "middle",
                  },
                  highlightStyle: { color: c, brushType: "fill" },
                  hoverable: !!this.legendOption.selectedMode,
                  clickable: !!this.legendOption.selectedMode,
                }),
                "vertical" === this.legendOption.orient &&
                  "right" === this.legendOption.x &&
                  ((s.style.x -= v + 10), (s.style.textAlign = "right")),
                (s._name = t),
                (s = new o(s)),
                this.legendOption.selectedMode &&
                  ((i.onclick = s.onclick = this._legendSelected),
                  (i.onmouseover = s.onmouseover = this._dispatchHoverLink),
                  (i.hoverConnect = s.id),
                  (s.hoverConnect = i.id)),
                this.shapeList.push(i),
                this.shapeList.push(s),
                "horizontal" === this.legendOption.orient
                  ? (y += v + 5 + d.getTextWidth(h, a) + b)
                  : (_ += x + b))
              : "horizontal" === this.legendOption.orient
              ? ((y = this._itemGroupLocation.x), (_ += x + b))
              : ("right" === this.legendOption.x
                  ? (y -= this._itemGroupLocation.maxWidth + b)
                  : (y += this._itemGroupLocation.maxWidth + b),
                (_ = this._itemGroupLocation.y));
        "horizontal" === this.legendOption.orient &&
          "center" === this.legendOption.x &&
          _ != this._itemGroupLocation.y &&
          this._mLineOptimize();
      },
      _getName: function (t) {
        return "undefined" != typeof t.name ? t.name : t;
      },
      _getFormatterName: function (t) {
        var e,
          i = this.legendOption.formatter;
        return (e =
          "function" == typeof i
            ? i.call(this.myChart, t)
            : "string" == typeof i
            ? i.replace("{name}", t)
            : t);
      },
      _getFormatterNameFromData: function (t) {
        var e = this._getName(t);
        return this._getFormatterName(e);
      },
      _mLineOptimize: function () {
        for (
          var t = [],
            e = this._itemGroupLocation.x,
            i = 2,
            o = this.shapeList.length;
          o > i;
          i++
        )
          this.shapeList[i].style.x === e
            ? t.push(
                (this._itemGroupLocation.width -
                  (this.shapeList[i - 1].style.x +
                    d.getTextWidth(
                      this.shapeList[i - 1].style.text,
                      this.shapeList[i - 1].style.textFont
                    ) -
                    e)) /
                  2
              )
            : i === o - 1 &&
              t.push(
                (this._itemGroupLocation.width -
                  (this.shapeList[i].style.x +
                    d.getTextWidth(
                      this.shapeList[i].style.text,
                      this.shapeList[i].style.textFont
                    ) -
                    e)) /
                  2
              );
        for (var s = -1, i = 1, o = this.shapeList.length; o > i; i++)
          this.shapeList[i].style.x === e && s++,
            0 !== t[s] && (this.shapeList[i].style.x += t[s]);
      },
      _buildBackground: function () {
        var t = this.reformCssArray(this.legendOption.padding);
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
              brushType: 0 === this.legendOption.borderWidth ? "fill" : "both",
              color: this.legendOption.backgroundColor,
              strokeColor: this.legendOption.borderColor,
              lineWidth: this.legendOption.borderWidth,
            },
          })
        );
      },
      _getItemGroupLocation: function () {
        var t = this.legendOption.data,
          e = t.length,
          i = this.legendOption.itemGap,
          o = this.legendOption.itemWidth + 5,
          s = this.legendOption.itemHeight,
          r = this.legendOption.textStyle,
          n = this.getFont(r),
          a = 0,
          h = 0,
          c = this.reformCssArray(this.legendOption.padding),
          p = this.zr.getWidth() - c[1] - c[3],
          u = this.zr.getHeight() - c[0] - c[2],
          g = 0,
          f = 0;
        if ("horizontal" === this.legendOption.orient) {
          h = s;
          for (var m = 0; e > m; m++)
            if ("" !== this._getName(t[m])) {
              var y = d.getTextWidth(
                this._getFormatterNameFromData(t[m]),
                t[m].textStyle
                  ? this.getFont(l.merge(t[m].textStyle || {}, r))
                  : n
              );
              g + o + y + i > p
                ? ((g -= i), (a = Math.max(a, g)), (h += s + i), (g = 0))
                : ((g += o + y + i), (a = Math.max(a, g - i)));
            } else (g -= i), (a = Math.max(a, g)), (h += s + i), (g = 0);
        } else {
          for (var m = 0; e > m; m++)
            f = Math.max(
              f,
              d.getTextWidth(
                this._getFormatterNameFromData(t[m]),
                t[m].textStyle
                  ? this.getFont(l.merge(t[m].textStyle || {}, r))
                  : n
              )
            );
          (f += o), (a = f);
          for (var m = 0; e > m; m++)
            "" !== this._getName(t[m])
              ? g + s + i > u
                ? ((a += f + i), (g -= i), (h = Math.max(h, g)), (g = 0))
                : ((g += s + i), (h = Math.max(h, g - i)))
              : ((a += f + i), (g -= i), (h = Math.max(h, g)), (g = 0));
        }
        (p = this.zr.getWidth()), (u = this.zr.getHeight());
        var _;
        switch (this.legendOption.x) {
          case "center":
            _ = Math.floor((p - a) / 2);
            break;
          case "left":
            _ = c[3] + this.legendOption.borderWidth;
            break;
          case "right":
            _ = p - a - c[1] - c[3] - 2 * this.legendOption.borderWidth;
            break;
          default:
            _ = this.parsePercent(this.legendOption.x, p);
        }
        var v;
        switch (this.legendOption.y) {
          case "top":
            v = c[0] + this.legendOption.borderWidth;
            break;
          case "bottom":
            v = u - h - c[0] - c[2] - 2 * this.legendOption.borderWidth;
            break;
          case "center":
            v = Math.floor((u - h) / 2);
            break;
          default:
            v = this.parsePercent(this.legendOption.y, u);
        }
        return { x: _, y: v, width: a, height: h, maxWidth: f };
      },
      _getSomethingByName: function (t) {
        for (var e, i = this.option.series, o = 0, s = i.length; s > o; o++) {
          if (i[o].name === t)
            return {
              type: i[o].type,
              series: i[o],
              seriesIndex: o,
              data: null,
              dataIndex: -1,
            };
          if (
            i[o].type === h.CHART_TYPE_PIE ||
            i[o].type === h.CHART_TYPE_RADAR ||
            i[o].type === h.CHART_TYPE_CHORD ||
            i[o].type === h.CHART_TYPE_FORCE ||
            i[o].type === h.CHART_TYPE_FUNNEL
          ) {
            e = i[o].categories || i[o].data || i[o].nodes;
            for (var r = 0, n = e.length; n > r; r++)
              if (e[r].name === t)
                return {
                  type: i[o].type,
                  series: i[o],
                  seriesIndex: o,
                  data: e[r],
                  dataIndex: r,
                };
          }
        }
        return {
          type: "bar",
          series: null,
          seriesIndex: -1,
          data: null,
          dataIndex: -1,
        };
      },
      _getItemShapeByType: function (t, e, i, o, s, r, n) {
        var a,
          l = "#ccc" === s ? n : s,
          d = {
            zlevel: this.getZlevelBase(),
            z: this.getZBase(),
            style: {
              iconType: "legendicon" + r,
              x: t,
              y: e,
              width: i,
              height: o,
              color: s,
              strokeColor: s,
              lineWidth: 2,
            },
            highlightStyle: { color: l, strokeColor: l, lineWidth: 1 },
            hoverable: this.legendOption.selectedMode,
            clickable: this.legendOption.selectedMode,
          };
        if (r.match("image")) {
          var a = r.replace(new RegExp("^image:\\/\\/"), "");
          r = "image";
        }
        switch (r) {
          case "line":
            (d.style.brushType = "stroke"), (d.highlightStyle.lineWidth = 3);
            break;
          case "radar":
          case "scatter":
            d.highlightStyle.lineWidth = 3;
            break;
          case "k":
            (d.style.brushType = "both"),
              (d.highlightStyle.lineWidth = 3),
              (d.highlightStyle.color = d.style.color =
                this.deepQuery([this.ecTheme, h], "k.itemStyle.normal.color") ||
                "#fff"),
              (d.style.strokeColor =
                "#ccc" != s
                  ? this.deepQuery(
                      [this.ecTheme, h],
                      "k.itemStyle.normal.lineStyle.color"
                    ) || "#ff3200"
                  : s);
            break;
          case "image":
            (d.style.iconType = "image"),
              (d.style.image = a),
              "#ccc" === s && (d.style.opacity = 0.5);
        }
        return d;
      },
      __legendSelected: function (t) {
        var e = t.target._name;
        if ("single" === this.legendOption.selectedMode)
          for (var i in this._selectedMap) this._selectedMap[i] = !1;
        (this._selectedMap[e] = !this._selectedMap[e]),
          this.messageCenter.dispatch(
            h.EVENT.LEGEND_SELECTED,
            t.event,
            { selected: this._selectedMap, target: e },
            this.myChart
          );
      },
      refresh: function (t) {
        if (t) {
          (this.option = t || this.option),
            (this.option.legend = this.reformOption(this.option.legend)),
            (this.legendOption = this.option.legend);
          var e,
            i,
            o,
            s,
            r = this.legendOption.data || [];
          if (this.legendOption.selected)
            for (var n in this.legendOption.selected)
              this._selectedMap[n] =
                "undefined" != typeof this._selectedMap[n]
                  ? this._selectedMap[n]
                  : this.legendOption.selected[n];
          for (var a = 0, l = r.length; l > a; a++)
            (e = this._getName(r[a])),
              "" !== e &&
                ((i = this._getSomethingByName(e)),
                i.series
                  ? ((this._hasDataMap[e] = !0),
                    (s =
                      !i.data ||
                      (i.type !== h.CHART_TYPE_PIE &&
                        i.type !== h.CHART_TYPE_FORCE &&
                        i.type !== h.CHART_TYPE_FUNNEL)
                        ? [i.series]
                        : [i.data, i.series]),
                    (o = this.getItemStyleColor(
                      this.deepQuery(s, "itemStyle.normal.color"),
                      i.seriesIndex,
                      i.dataIndex,
                      i.data
                    )),
                    o && i.type != h.CHART_TYPE_K && this.setColor(e, o),
                    (this._selectedMap[e] =
                      null != this._selectedMap[e] ? this._selectedMap[e] : !0))
                  : (this._hasDataMap[e] = !1));
        }
        this.clear(), this._buildShape();
      },
      getRelatedAmount: function (t) {
        for (
          var e, i = 0, o = this.option.series, s = 0, r = o.length;
          r > s;
          s++
        )
          if (
            (o[s].name === t && i++,
            o[s].type === h.CHART_TYPE_PIE ||
              o[s].type === h.CHART_TYPE_RADAR ||
              o[s].type === h.CHART_TYPE_CHORD ||
              o[s].type === h.CHART_TYPE_FORCE ||
              o[s].type === h.CHART_TYPE_FUNNEL)
          ) {
            e = o[s].type != h.CHART_TYPE_FORCE ? o[s].data : o[s].categories;
            for (var n = 0, a = e.length; a > n; n++)
              e[n].name === t && "-" != e[n].value && i++;
          }
        return i;
      },
      setColor: function (t, e) {
        this._colorMap[t] = e;
      },
      getColor: function (t) {
        return (
          this._colorMap[t] ||
            (this._colorMap[t] = this.zr.getColor(this._colorIndex++)),
          this._colorMap[t]
        );
      },
      hasColor: function (t) {
        return this._colorMap[t] ? this._colorMap[t] : !1;
      },
      add: function (t, e) {
        for (var i = this.legendOption.data, o = 0, s = i.length; s > o; o++)
          if (this._getName(i[o]) === t) return;
        this.legendOption.data.push(t),
          this.setColor(t, e),
          (this._selectedMap[t] = !0),
          (this._hasDataMap[t] = !0);
      },
      del: function (t) {
        for (var e = this.legendOption.data, i = 0, o = e.length; o > i; i++)
          if (this._getName(e[i]) === t)
            return this.legendOption.data.splice(i, 1);
      },
      getItemShape: function (t) {
        if (null != t)
          for (var e, i = 0, o = this.shapeList.length; o > i; i++)
            if (((e = this.shapeList[i]), e._name === t && "text" != e.type))
              return e;
      },
      setItemShape: function (t, e) {
        for (var i, o = 0, s = this.shapeList.length; s > o; o++)
          (i = this.shapeList[o]),
            i._name === t &&
              "text" != i.type &&
              (this._selectedMap[t] ||
                ((e.style.color = "#ccc"), (e.style.strokeColor = "#ccc")),
              this.zr.modShape(i.id, e));
      },
      isSelected: function (t) {
        return "undefined" != typeof this._selectedMap[t]
          ? this._selectedMap[t]
          : !0;
      },
      getSelectedMap: function () {
        return this._selectedMap;
      },
      setSelected: function (t, e) {
        if ("single" === this.legendOption.selectedMode)
          for (var i in this._selectedMap) this._selectedMap[i] = !1;
        (this._selectedMap[t] = e),
          this.messageCenter.dispatch(
            h.EVENT.LEGEND_SELECTED,
            null,
            { selected: this._selectedMap, target: t },
            this.myChart
          );
      },
      onlegendSelected: function (t, e) {
        var i = t.selected;
        for (var o in i)
          this._selectedMap[o] != i[o] && (e.needRefresh = !0),
            (this._selectedMap[o] = i[o]);
      },
    };
    var c = {
      line: function (t, e) {
        var i = e.height / 2;
        t.moveTo(e.x, e.y + i), t.lineTo(e.x + e.width, e.y + i);
      },
      pie: function (t, e) {
        var i = e.x,
          o = e.y,
          s = e.width,
          n = e.height;
        r.prototype.buildPath(t, {
          x: i + s,
          y: o + n,
          r: n,
          r0: 6,
          startAngle: 90,
          endAngle: 180,
        });
      },
      eventRiver: function (t, e) {
        var i = e.x,
          o = e.y,
          s = e.width,
          r = e.height;
        t.moveTo(i, o + r),
          t.bezierCurveTo(i + s, o + r, i, o + 4, i + s, o + 4),
          t.lineTo(i + s, o),
          t.bezierCurveTo(i, o, i + s, o + r - 4, i, o + r - 4),
          t.lineTo(i, o + r);
      },
      k: function (t, e) {
        var i = e.x,
          o = e.y,
          s = e.width,
          r = e.height;
        a.prototype.buildPath(t, {
          x: i + s / 2,
          y: [o + 1, o + 1, o + r - 6, o + r],
          width: s - 6,
        });
      },
      bar: function (t, e) {
        var i = e.x,
          o = e.y + 1,
          s = e.width,
          r = e.height - 2,
          n = 3;
        t.moveTo(i + n, o),
          t.lineTo(i + s - n, o),
          t.quadraticCurveTo(i + s, o, i + s, o + n),
          t.lineTo(i + s, o + r - n),
          t.quadraticCurveTo(i + s, o + r, i + s - n, o + r),
          t.lineTo(i + n, o + r),
          t.quadraticCurveTo(i, o + r, i, o + r - n),
          t.lineTo(i, o + n),
          t.quadraticCurveTo(i, o, i + n, o);
      },
      force: function (t, e) {
        n.prototype.iconLibrary.circle(t, e);
      },
      radar: function (t, e) {
        var i = 6,
          o = e.x + e.width / 2,
          s = e.y + e.height / 2,
          r = e.height / 2,
          n = (2 * Math.PI) / i,
          a = -Math.PI / 2,
          h = o + r * Math.cos(a),
          l = s + r * Math.sin(a);
        t.moveTo(h, l), (a += n);
        for (var d = 0, c = i - 1; c > d; d++)
          t.lineTo(o + r * Math.cos(a), s + r * Math.sin(a)), (a += n);
        t.lineTo(h, l);
      },
    };
    (c.chord = c.pie), (c.map = c.bar);
    for (var p in c) n.prototype.iconLibrary["legendicon" + p] = c[p];
    return l.inherits(e, i), t("../component").define("legend", e), e;
  }),
  define("echarts/util/ecData", [], function () {
    function t(t, e, i, o, s, r, n, a) {
      var h;
      return (
        "undefined" != typeof o && (h = null == o.value ? o : o.value),
        (t._echartsData = {
          _series: e,
          _seriesIndex: i,
          _data: o,
          _dataIndex: s,
          _name: r,
          _value: h,
          _special: n,
          _special2: a,
        }),
        t._echartsData
      );
    }
    function e(t, e) {
      var i = t._echartsData;
      if (!e) return i;
      switch (e) {
        case "series":
        case "seriesIndex":
        case "data":
        case "dataIndex":
        case "name":
        case "value":
        case "special":
        case "special2":
          return i && i["_" + e];
      }
      return null;
    }
    function i(t, e, i) {
      switch (((t._echartsData = t._echartsData || {}), e)) {
        case "series":
        case "seriesIndex":
        case "data":
        case "dataIndex":
        case "name":
        case "value":
        case "special":
        case "special2":
          t._echartsData["_" + e] = i;
      }
    }
    function o(t, e) {
      e._echartsData = {
        _series: t._echartsData._series,
        _seriesIndex: t._echartsData._seriesIndex,
        _data: t._echartsData._data,
        _dataIndex: t._echartsData._dataIndex,
        _name: t._echartsData._name,
        _value: t._echartsData._value,
        _special: t._echartsData._special,
        _special2: t._echartsData._special2,
      };
    }
    return { pack: t, set: i, get: e, clone: o };
  }),
  define("echarts/chart", [], function () {
    var t = {},
      e = {};
    return (
      (t.define = function (i, o) {
        return (e[i] = o), t;
      }),
      (t.get = function (t) {
        return e[t];
      }),
      t
    );
  }),
  define("zrender/tool/color", ["require", "../tool/util"], function (t) {
    function e(t) {
      if (t instanceof Array || -1 != t.indexOf("rgb") || -1 != t.indexOf("hs"))
        return t;
      if (!Q[t]) {
        var e = Y.getPixelContext();
        (e.fillStyle = t), e.rect(0, 0, 10, 10), e.fill();
        var i = e.getImageData(5, 5, 1, 1).data;
        Q[t] = p([i[0], i[1], i[2], i[3]], "rgba");
      }
      return Q[t];
    }
    function i(t) {
      G = t;
    }
    function o() {
      G = Z;
    }
    function s(t, e) {
      return (t = 0 | t), (e = e || G), e[t % e.length];
    }
    function r(t) {
      q = t;
    }
    function n() {
      X = q;
    }
    function a() {
      return q;
    }
    function h(t, e, i, o, s, r, n) {
      F = F || Y.getContext();
      for (
        var a = F.createRadialGradient(t, e, i, o, s, r), h = 0, l = n.length;
        l > h;
        h++
      )
        a.addColorStop(n[h][0], n[h][1]);
      return (a.__nonRecursion = !0), a;
    }
    function l(t, e, i, o, s) {
      F = F || Y.getContext();
      for (
        var r = F.createLinearGradient(t, e, i, o), n = 0, a = s.length;
        a > n;
        n++
      )
        r.addColorStop(s[n][0], s[n][1]);
      return (r.__nonRecursion = !0), r;
    }
    function d(t, e, i) {
      (t = f(t)), (e = f(e)), (t = k(t)), (e = k(e));
      for (
        var o = [],
          s = (e[0] - t[0]) / i,
          r = (e[1] - t[1]) / i,
          n = (e[2] - t[2]) / i,
          a = (e[3] - t[3]) / i,
          h = 0,
          l = t[0],
          d = t[1],
          c = t[2],
          u = t[3];
        i > h;
        h++
      )
        (o[h] = p(
          [
            P(Math.floor(l), [0, 255]),
            P(Math.floor(d), [0, 255]),
            P(Math.floor(c), [0, 255]),
            u.toFixed(4) - 0,
          ],
          "rgba"
        )),
          (l += s),
          (d += r),
          (c += n),
          (u += a);
      return (
        (l = e[0]),
        (d = e[1]),
        (c = e[2]),
        (u = e[3]),
        (o[h] = p([l, d, c, u], "rgba")),
        o
      );
    }
    function c(t, e) {
      var i = [],
        o = t.length;
      if ((void 0 === e && (e = 20), 1 === o)) i = d(t[0], t[0], e);
      else if (o > 1)
        for (var s = 0, r = o - 1; r > s; s++) {
          var n = d(t[s], t[s + 1], e);
          r - 1 > s && n.pop(), (i = i.concat(n));
        }
      return i;
    }
    function p(t, e) {
      if (((e = e || "rgb"), t && (3 === t.length || 4 === t.length))) {
        if (
          ((t = I(t, function (t) {
            return t > 1 ? Math.ceil(t) : t;
          })),
          e.indexOf("hex") > -1)
        )
          return (
            "#" +
            ((1 << 24) + (t[0] << 16) + (t[1] << 8) + +t[2])
              .toString(16)
              .slice(1)
          );
        if (e.indexOf("hs") > -1) {
          var i = I(t.slice(1, 3), function (t) {
            return t + "%";
          });
          (t[1] = i[0]), (t[2] = i[1]);
        }
        return e.indexOf("a") > -1
          ? (3 === t.length && t.push(1),
            (t[3] = P(t[3], [0, 1])),
            e + "(" + t.slice(0, 4).join(",") + ")")
          : e + "(" + t.slice(0, 3).join(",") + ")";
      }
    }
    function u(t) {
      (t = z(t)), t.indexOf("rgba") < 0 && (t = f(t));
      var e = [],
        i = 0;
      return (
        t.replace(/[\d.]+/g, function (t) {
          (t = 3 > i ? 0 | t : +t), (e[i++] = t);
        }),
        e
      );
    }
    function g(t, e) {
      if (!R(t)) return t;
      var i = k(t),
        o = i[3];
      return (
        "undefined" == typeof o && (o = 1),
        t.indexOf("hsb") > -1
          ? (i = D(i))
          : t.indexOf("hsl") > -1 && (i = H(i)),
        e.indexOf("hsb") > -1 || e.indexOf("hsv") > -1
          ? (i = N(i))
          : e.indexOf("hsl") > -1 && (i = W(i)),
        (i[3] = o),
        p(i, e)
      );
    }
    function f(t) {
      return g(t, "rgba");
    }
    function m(t) {
      return g(t, "rgb");
    }
    function y(t) {
      return g(t, "hex");
    }
    function _(t) {
      return g(t, "hsva");
    }
    function v(t) {
      return g(t, "hsv");
    }
    function x(t) {
      return g(t, "hsba");
    }
    function b(t) {
      return g(t, "hsb");
    }
    function T(t) {
      return g(t, "hsla");
    }
    function S(t) {
      return g(t, "hsl");
    }
    function C(t) {
      for (var e in Q) if (y(Q[e]) === y(t)) return e;
      return null;
    }
    function z(t) {
      return String(t).replace(/\s+/g, "");
    }
    function L(t) {
      if (
        ((t = e(t)),
        (t = z(t)),
        (t = t.replace(/hsv/i, "hsb")),
        /^#[\da-f]{3}$/i.test(t))
      ) {
        t = parseInt(t.slice(1), 16);
        var i = (3840 & t) << 8,
          o = (240 & t) << 4,
          s = 15 & t;
        t =
          "#" +
          ((1 << 24) + (i << 4) + i + (o << 4) + o + (s << 4) + s)
            .toString(16)
            .slice(1);
      }
      return t;
    }
    function w(t, e) {
      if (!R(t)) return t;
      var i = e > 0 ? 1 : -1;
      "undefined" == typeof e && (e = 0),
        (e = Math.abs(e) > 1 ? 1 : Math.abs(e)),
        (t = m(t));
      for (var o = k(t), s = 0; 3 > s; s++)
        o[s] = 1 === i ? (o[s] * (1 - e)) | 0 : ((255 - o[s]) * e + o[s]) | 0;
      return "rgb(" + o.join(",") + ")";
    }
    function M(t) {
      if (!R(t)) return t;
      var e = k(f(t));
      return (
        (e = I(e, function (t) {
          return 255 - t;
        })),
        p(e, "rgb")
      );
    }
    function E(t, e, i) {
      if (!R(t) || !R(e)) return t;
      "undefined" == typeof i && (i = 0.5), (i = 1 - P(i, [0, 1]));
      for (
        var o = 2 * i - 1,
          s = k(f(t)),
          r = k(f(e)),
          n = s[3] - r[3],
          a = ((o * n === -1 ? o : (o + n) / (1 + o * n)) + 1) / 2,
          h = 1 - a,
          l = [],
          d = 0;
        3 > d;
        d++
      )
        l[d] = s[d] * a + r[d] * h;
      var c = s[3] * i + r[3] * (1 - i);
      return (
        (c = Math.max(0, Math.min(1, c))),
        1 === s[3] && 1 === r[3] ? p(l, "rgb") : ((l[3] = c), p(l, "rgba"))
      );
    }
    function A() {
      return "#" + (Math.random().toString(16) + "0000").slice(2, 8);
    }
    function k(t) {
      t = L(t);
      var e = t.match(V);
      if (null === e) throw new Error("The color format error");
      var i,
        o,
        s,
        r = [];
      if (e[2])
        (i = e[2].replace("#", "").split("")),
          (s = [i[0] + i[1], i[2] + i[3], i[4] + i[5]]),
          (r = I(s, function (t) {
            return P(parseInt(t, 16), [0, 255]);
          }));
      else if (e[4]) {
        var n = e[4].split(",");
        (o = n[3]),
          (s = n.slice(0, 3)),
          (r = I(s, function (t) {
            return (
              (t = Math.floor(t.indexOf("%") > 0 ? 2.55 * parseInt(t, 0) : t)),
              P(t, [0, 255])
            );
          })),
          "undefined" != typeof o && r.push(P(parseFloat(o), [0, 1]));
      } else if (e[5] || e[6]) {
        var a = (e[5] || e[6]).split(","),
          h = parseInt(a[0], 0) / 360,
          l = a[1],
          d = a[2];
        (o = a[3]),
          (r = I([l, d], function (t) {
            return P(parseFloat(t) / 100, [0, 1]);
          })),
          r.unshift(h),
          "undefined" != typeof o && r.push(P(parseFloat(o), [0, 1]));
      }
      return r;
    }
    function O(t, e) {
      if (!R(t)) return t;
      null === e && (e = 1);
      var i = k(f(t));
      return (i[3] = P(Number(e).toFixed(4), [0, 1])), p(i, "rgba");
    }
    function I(t, e) {
      if ("function" != typeof e) throw new TypeError();
      for (var i = t ? t.length : 0, o = 0; i > o; o++) t[o] = e(t[o]);
      return t;
    }
    function P(t, e) {
      return t <= e[0] ? (t = e[0]) : t >= e[1] && (t = e[1]), t;
    }
    function R(t) {
      return t instanceof Array || "string" == typeof t;
    }
    function D(t) {
      var e,
        i,
        o,
        s = t[0],
        r = t[1],
        n = t[2];
      if (0 === r) (e = 255 * n), (i = 255 * n), (o = 255 * n);
      else {
        var a = 6 * s;
        6 === a && (a = 0);
        var h = 0 | a,
          l = n * (1 - r),
          d = n * (1 - r * (a - h)),
          c = n * (1 - r * (1 - (a - h))),
          p = 0,
          u = 0,
          g = 0;
        0 === h
          ? ((p = n), (u = c), (g = l))
          : 1 === h
          ? ((p = d), (u = n), (g = l))
          : 2 === h
          ? ((p = l), (u = n), (g = c))
          : 3 === h
          ? ((p = l), (u = d), (g = n))
          : 4 === h
          ? ((p = c), (u = l), (g = n))
          : ((p = n), (u = l), (g = d)),
          (e = 255 * p),
          (i = 255 * u),
          (o = 255 * g);
      }
      return [e, i, o];
    }
    function H(t) {
      var e,
        i,
        o,
        s = t[0],
        r = t[1],
        n = t[2];
      if (0 === r) (e = 255 * n), (i = 255 * n), (o = 255 * n);
      else {
        var a;
        a = 0.5 > n ? n * (1 + r) : n + r - r * n;
        var h = 2 * n - a;
        (e = 255 * B(h, a, s + 1 / 3)),
          (i = 255 * B(h, a, s)),
          (o = 255 * B(h, a, s - 1 / 3));
      }
      return [e, i, o];
    }
    function B(t, e, i) {
      return (
        0 > i && (i += 1),
        i > 1 && (i -= 1),
        1 > 6 * i
          ? t + 6 * (e - t) * i
          : 1 > 2 * i
          ? e
          : 2 > 3 * i
          ? t + (e - t) * (2 / 3 - i) * 6
          : t
      );
    }
    function N(t) {
      var e,
        i,
        o = t[0] / 255,
        s = t[1] / 255,
        r = t[2] / 255,
        n = Math.min(o, s, r),
        a = Math.max(o, s, r),
        h = a - n,
        l = a;
      if (0 === h) (e = 0), (i = 0);
      else {
        i = h / a;
        var d = ((a - o) / 6 + h / 2) / h,
          c = ((a - s) / 6 + h / 2) / h,
          p = ((a - r) / 6 + h / 2) / h;
        o === a
          ? (e = p - c)
          : s === a
          ? (e = 1 / 3 + d - p)
          : r === a && (e = 2 / 3 + c - d),
          0 > e && (e += 1),
          e > 1 && (e -= 1);
      }
      return (e = 360 * e), (i = 100 * i), (l = 100 * l), [e, i, l];
    }
    function W(t) {
      var e,
        i,
        o = t[0] / 255,
        s = t[1] / 255,
        r = t[2] / 255,
        n = Math.min(o, s, r),
        a = Math.max(o, s, r),
        h = a - n,
        l = (a + n) / 2;
      if (0 === h) (e = 0), (i = 0);
      else {
        i = 0.5 > l ? h / (a + n) : h / (2 - a - n);
        var d = ((a - o) / 6 + h / 2) / h,
          c = ((a - s) / 6 + h / 2) / h,
          p = ((a - r) / 6 + h / 2) / h;
        o === a
          ? (e = p - c)
          : s === a
          ? (e = 1 / 3 + d - p)
          : r === a && (e = 2 / 3 + c - d),
          0 > e && (e += 1),
          e > 1 && (e -= 1);
      }
      return (e = 360 * e), (i = 100 * i), (l = 100 * l), [e, i, l];
    }
    var F,
      Y = t("../tool/util"),
      G = ["#ff9277", " #dddd00", " #ffc877", " #bbe3ff", " #d5ffbb"],
      Z = G,
      q = "rgba(255,255,0,0.5)",
      X = q,
      V = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+)?)%?\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+)?)%?\s*\))\s*$/i,
      Q = {};
    return {
      customPalette: i,
      resetPalette: o,
      getColor: s,
      getNameColor: e,
      getHighlightColor: a,
      customHighlight: r,
      resetHighlight: n,
      getRadialGradient: h,
      getLinearGradient: l,
      getGradientColors: c,
      getStepColors: d,
      reverse: M,
      mix: E,
      lift: w,
      trim: z,
      random: A,
      toRGB: m,
      toRGBA: f,
      toHex: y,
      toHSL: S,
      toHSLA: T,
      toHSB: b,
      toHSBA: x,
      toHSV: v,
      toHSVA: _,
      toName: C,
      toColor: p,
      toArray: u,
      alpha: O,
      getData: k,
    };
  }),
  define("echarts/component/timeline", [
    "require",
    "./base",
    "zrender/shape/Rectangle",
    "../util/shape/Icon",
    "../util/shape/Chain",
    "../config",
    "zrender/tool/util",
    "zrender/tool/area",
    "zrender/tool/event",
    "../component",
  ], function (t) {
    function e(t, e, i, s, r) {
      o.call(this, t, e, i, s, r);
      var n = this;
      if (
        ((n._onclick = function (t) {
          return n.__onclick(t);
        }),
        (n._ondrift = function (t, e) {
          return n.__ondrift(this, t, e);
        }),
        (n._ondragend = function () {
          return n.__ondragend();
        }),
        (n._setCurrentOption = function () {
          var t = n.timelineOption;
          n.currentIndex %= t.data.length;
          var e = n.options[n.currentIndex] || {};
          n.myChart.setOption(e, t.notMerge),
            n.messageCenter.dispatch(
              a.EVENT.TIMELINE_CHANGED,
              null,
              {
                currentIndex: n.currentIndex,
                data:
                  null != t.data[n.currentIndex].name
                    ? t.data[n.currentIndex].name
                    : t.data[n.currentIndex],
              },
              n.myChart
            );
        }),
        (n._onFrame = function () {
          n._setCurrentOption(),
            n._syncHandleShape(),
            n.timelineOption.autoPlay &&
              (n.playTicket = setTimeout(function () {
                return (
                  (n.currentIndex += 1),
                  !n.timelineOption.loop &&
                  n.currentIndex >= n.timelineOption.data.length
                    ? ((n.currentIndex = n.timelineOption.data.length - 1),
                      void n.stop())
                    : void n._onFrame()
                );
              }, n.timelineOption.playInterval));
        }),
        this.setTheme(!1),
        (this.options = this.option.options),
        (this.currentIndex =
          this.timelineOption.currentIndex % this.timelineOption.data.length),
        this.timelineOption.notMerge ||
          0 === this.currentIndex ||
          (this.options[this.currentIndex] = h.merge(
            this.options[this.currentIndex],
            this.options[0]
          )),
        this.timelineOption.show &&
          (this._buildShape(), this._syncHandleShape()),
        this._setCurrentOption(),
        this.timelineOption.autoPlay)
      ) {
        var n = this;
        this.playTicket = setTimeout(
          function () {
            n.play();
          },
          null != this.ecTheme.animationDuration
            ? this.ecTheme.animationDuration
            : a.animationDuration
        );
      }
    }
    function i(t, e) {
      var i = 2,
        o = e.x + i,
        s = e.y + i + 2,
        n = e.width - i,
        a = e.height - i,
        h = e.symbol;
      if ("last" === h)
        t.moveTo(o + n - 2, s + a / 3),
          t.lineTo(o + n - 2, s),
          t.lineTo(o + 2, s + a / 2),
          t.lineTo(o + n - 2, s + a),
          t.lineTo(o + n - 2, s + (a / 3) * 2),
          t.moveTo(o, s),
          t.lineTo(o, s);
      else if ("next" === h)
        t.moveTo(o + 2, s + a / 3),
          t.lineTo(o + 2, s),
          t.lineTo(o + n - 2, s + a / 2),
          t.lineTo(o + 2, s + a),
          t.lineTo(o + 2, s + (a / 3) * 2),
          t.moveTo(o, s),
          t.lineTo(o, s);
      else if ("play" === h)
        if ("stop" === e.status)
          t.moveTo(o + 2, s),
            t.lineTo(o + n - 2, s + a / 2),
            t.lineTo(o + 2, s + a),
            t.lineTo(o + 2, s);
        else {
          var l = "both" === e.brushType ? 2 : 3;
          t.rect(o + 2, s, l, a), t.rect(o + n - l - 2, s, l, a);
        }
      else if (h.match("image")) {
        var d = "";
        (d = h.replace(new RegExp("^image:\\/\\/"), "")),
          (h = r.prototype.iconLibrary.image),
          h(t, { x: o, y: s, width: n, height: a, image: d });
      }
    }
    var o = t("./base"),
      s = t("zrender/shape/Rectangle"),
      r = t("../util/shape/Icon"),
      n = t("../util/shape/Chain"),
      a = t("../config");
    a.timeline = {
      zlevel: 0,
      z: 4,
      show: !0,
      type: "time",
      notMerge: !1,
      realtime: !1,
      x: 1,
      x2: 2,
      y2: 0,
      height: 50,
      backgroundColor: "rgba(0,0,0,0)",
      borderColor: "#ccc",
      borderWidth: 0,
      padding: 1,
      controlPosition: "left",
      autoPlay: !1,
      loop: !0,
      playInterval: 2e3,
      lineStyle: { width: 1, color: "#666", type: "dashed" },
      label: {
        show: !0,
        interval: "auto",
        rotate: 0,
        textStyle: { color: "#333" },
      },
      checkpointStyle: {
        symbol: "auto",
        symbolSize: "auto",
        color: "auto",
        borderColor: "auto",
        borderWidth: "auto",
        label: { show: !0, textStyle: { color: "auto" } },
      },
      controlStyle: {
        itemSize: 22,
        itemGap: 8,
        normal: { color: "#333" },
        emphasis: { color: "#1e90ff" },
      },
      symbol: "emptyDiamond",
      symbolSize: 4,
      currentIndex: 0,
    };
    var h = t("zrender/tool/util"),
      l = t("zrender/tool/area"),
      d = t("zrender/tool/event");
    return (
      (e.prototype = {
        type: a.COMPONENT_TYPE_TIMELINE,
        _buildShape: function () {
          if (
            ((this._location = this._getLocation()),
            this._buildBackground(),
            this._buildControl(),
            (this._chainPoint = this._getChainPoint()),
            this.timelineOption.label.show)
          )
            for (
              var t = this._getInterval(), e = 0, i = this._chainPoint.length;
              i > e;
              e += t
            )
              this._chainPoint[e].showLabel = !0;
          this._buildChain(), this._buildHandle();
          for (var e = 0, o = this.shapeList.length; o > e; e++)
            this.zr.addShape(this.shapeList[e]);
        },
        _getLocation: function () {
          var t,
            e = this.timelineOption,
            i = this.reformCssArray(this.timelineOption.padding),
            o = this.zr.getWidth(),
            s = this.parsePercent(e.x, o),
            r = this.parsePercent(e.x2, o);
          null == e.width
            ? ((t = o - s - r), (r = o - r))
            : ((t = this.parsePercent(e.width, o)), (r = s + t));
          var n,
            a,
            h = this.zr.getHeight(),
            l = this.parsePercent(e.height, h);
          return (
            null != e.y
              ? ((n = this.parsePercent(e.y, h)), (a = n + l))
              : ((a = h - this.parsePercent(e.y2, h)), (n = a - l)),
            {
              x: s + i[3],
              y: n + i[0],
              x2: r - i[1],
              y2: a - i[2],
              width: t - i[1] - i[3],
              height: l - i[0] - i[2],
            }
          );
        },
        _getReformedLabel: function (t) {
          var e = this.timelineOption,
            i = null != e.data[t].name ? e.data[t].name : e.data[t],
            o = e.data[t].formatter || e.label.formatter;
          return (
            o &&
              ("function" == typeof o
                ? (i = o.call(this.myChart, i))
                : "string" == typeof o && (i = o.replace("{value}", i))),
            i
          );
        },
        _getInterval: function () {
          var t = this._chainPoint,
            e = this.timelineOption,
            i = e.label.interval;
          if ("auto" === i) {
            var o = e.label.textStyle.fontSize,
              s = e.data,
              r = e.data.length;
            if (r > 3) {
              var n,
                a,
                h = !1;
              for (i = 0; !h && r > i; ) {
                i++, (h = !0);
                for (var d = i; r > d; d += i) {
                  if (((n = t[d].x - t[d - i].x), 0 !== e.label.rotate)) a = o;
                  else if (s[d].textStyle)
                    a = l.getTextWidth(t[d].name, t[d].textFont);
                  else {
                    var c = t[d].name + "",
                      p = (c.match(/\w/g) || "").length,
                      u = c.length - p;
                    a = (p * o * 2) / 3 + u * o;
                  }
                  if (a > n) {
                    h = !1;
                    break;
                  }
                }
              }
            } else i = 1;
          } else i = i - 0 + 1;
          return i;
        },
        _getChainPoint: function () {
          function t(t) {
            return null != l[t].name ? l[t].name : l[t] + "";
          }
          var e,
            i = this.timelineOption,
            o = i.symbol.toLowerCase(),
            s = i.symbolSize,
            r = i.label.rotate,
            n = i.label.textStyle,
            a = this.getFont(n),
            l = i.data,
            d = this._location.x,
            c = this._location.y + (this._location.height / 4) * 3,
            p = this._location.x2 - this._location.x,
            u = l.length,
            g = [];
          if (u > 1) {
            var f = p / u;
            if (
              ((f = f > 50 ? 50 : 20 > f ? 5 : f),
              (p -= 2 * f),
              "number" === i.type)
            )
              for (var m = 0; u > m; m++) g.push(d + f + (p / (u - 1)) * m);
            else {
              (g[0] = new Date(t(0).replace(/-/g, "/"))),
                (g[u - 1] = new Date(t(u - 1).replace(/-/g, "/")) - g[0]);
              for (var m = 1; u > m; m++)
                g[m] =
                  d +
                  f +
                  (p * (new Date(t(m).replace(/-/g, "/")) - g[0])) / g[u - 1];
              g[0] = d + f;
            }
          } else g.push(d + p / 2);
          for (var y, _, v, x, b, T = [], m = 0; u > m; m++)
            (d = g[m]),
              (y = (l[m].symbol && l[m].symbol.toLowerCase()) || o),
              y.match("empty")
                ? ((y = y.replace("empty", "")), (v = !0))
                : (v = !1),
              y.match("star") &&
                ((_ = y.replace("star", "") - 0 || 5), (y = "star")),
              (e = l[m].textStyle ? h.merge(l[m].textStyle || {}, n) : n),
              (x = e.align || "center"),
              r
                ? ((x = r > 0 ? "right" : "left"),
                  (b = [(r * Math.PI) / 180, d, c - 5]))
                : (b = !1),
              T.push({
                x: d,
                n: _,
                isEmpty: v,
                symbol: y,
                symbolSize: l[m].symbolSize || s,
                color: l[m].color,
                borderColor: l[m].borderColor,
                borderWidth: l[m].borderWidth,
                name: this._getReformedLabel(m),
                textColor: e.color,
                textAlign: x,
                textBaseline: e.baseline || "middle",
                textX: d,
                textY: c - (r ? 5 : 0),
                textFont: l[m].textStyle ? this.getFont(e) : a,
                rotation: b,
                showLabel: !1,
              });
          return T;
        },
        _buildBackground: function () {
          var t = this.timelineOption,
            e = this.reformCssArray(this.timelineOption.padding),
            i = this._location.width,
            o = this._location.height;
          (0 !== t.borderWidth ||
            "rgba(0,0,0,0)" != t.backgroundColor.replace(/\s/g, "")) &&
            this.shapeList.push(
              new s({
                zlevel: this.getZlevelBase(),
                z: this.getZBase(),
                hoverable: !1,
                style: {
                  x: this._location.x - e[3],
                  y: this._location.y - e[0],
                  width: i + e[1] + e[3],
                  height: o + e[0] + e[2],
                  brushType: 0 === t.borderWidth ? "fill" : "both",
                  color: t.backgroundColor,
                  strokeColor: t.borderColor,
                  lineWidth: t.borderWidth,
                },
              })
            );
        },
        _buildControl: function () {
          var t = this,
            e = this.timelineOption,
            i = e.lineStyle,
            o = e.controlStyle;
          if ("none" !== e.controlPosition) {
            var s,
              n = o.itemSize,
              a = o.itemGap;
            "left" === e.controlPosition
              ? ((s = this._location.x), (this._location.x += 3 * (n + a)))
              : ((s = this._location.x2 - (3 * (n + a) - a)),
                (this._location.x2 -= 3 * (n + a)));
            var l = this._location.y,
              d = {
                zlevel: this.getZlevelBase(),
                z: this.getZBase() + 1,
                style: {
                  iconType: "timelineControl",
                  symbol: "last",
                  x: s,
                  y: l,
                  width: n,
                  height: n,
                  brushType: "stroke",
                  color: o.normal.color,
                  strokeColor: o.normal.color,
                  lineWidth: i.width,
                },
                highlightStyle: {
                  color: o.emphasis.color,
                  strokeColor: o.emphasis.color,
                  lineWidth: i.width + 1,
                },
                clickable: !0,
              };
            (this._ctrLastShape = new r(d)),
              (this._ctrLastShape.onclick = function () {
                t.last();
              }),
              this.shapeList.push(this._ctrLastShape),
              (s += n + a),
              (this._ctrPlayShape = new r(h.clone(d))),
              (this._ctrPlayShape.style.brushType = "fill"),
              (this._ctrPlayShape.style.symbol = "play"),
              (this._ctrPlayShape.style.status = this.timelineOption.autoPlay
                ? "playing"
                : "stop"),
              (this._ctrPlayShape.style.x = s),
              (this._ctrPlayShape.onclick = function () {
                "stop" === t._ctrPlayShape.style.status ? t.play() : t.stop();
              }),
              this.shapeList.push(this._ctrPlayShape),
              (s += n + a),
              (this._ctrNextShape = new r(h.clone(d))),
              (this._ctrNextShape.style.symbol = "next"),
              (this._ctrNextShape.style.x = s),
              (this._ctrNextShape.onclick = function () {
                t.next();
              }),
              this.shapeList.push(this._ctrNextShape);
          }
        },
        _buildChain: function () {
          var t = this.timelineOption,
            e = t.lineStyle;
          (this._timelineShae = {
            zlevel: this.getZlevelBase(),
            z: this.getZBase(),
            style: {
              x: this._location.x,
              y: this.subPixelOptimize(this._location.y, e.width),
              width: this._location.x2 - this._location.x,
              height: this._location.height,
              chainPoint: this._chainPoint,
              brushType: "both",
              strokeColor: e.color,
              lineWidth: e.width,
              lineType: e.type,
            },
            hoverable: !1,
            clickable: !0,
            onclick: this._onclick,
          }),
            (this._timelineShae = new n(this._timelineShae)),
            this.shapeList.push(this._timelineShae);
        },
        _buildHandle: function () {
          var t = this._chainPoint[this.currentIndex],
            e = t.symbolSize + 1;
          (e = 5 > e ? 5 : e),
            (this._handleShape = {
              zlevel: this.getZlevelBase(),
              z: this.getZBase() + 1,
              hoverable: !1,
              draggable: !0,
              style: {
                iconType: "diamond",
                n: t.n,
                x: t.x - e,
                y: this._location.y + this._location.height / 4 - e,
                width: 2 * e,
                height: 2 * e,
                brushType: "both",
                textPosition: "specific",
                textX: t.x,
                textY: this._location.y - this._location.height / 4,
                textAlign: "center",
                textBaseline: "middle",
              },
              highlightStyle: {},
              ondrift: this._ondrift,
              ondragend: this._ondragend,
            }),
            (this._handleShape = new r(this._handleShape)),
            this.shapeList.push(this._handleShape);
        },
        _syncHandleShape: function () {
          if (this.timelineOption.show) {
            var t = this.timelineOption,
              e = t.checkpointStyle,
              i = this._chainPoint[this.currentIndex];
            (this._handleShape.style.text = e.label.show ? i.name : ""),
              (this._handleShape.style.textFont = i.textFont),
              (this._handleShape.style.n = i.n),
              "auto" === e.symbol
                ? (this._handleShape.style.iconType =
                    "none" != i.symbol ? i.symbol : "diamond")
                : ((this._handleShape.style.iconType = e.symbol),
                  e.symbol.match("star") &&
                    ((this._handleShape.style.n =
                      e.symbol.replace("star", "") - 0 || 5),
                    (this._handleShape.style.iconType = "star")));
            var o;
            "auto" === e.symbolSize
              ? ((o = i.symbolSize + 2), (o = 5 > o ? 5 : o))
              : (o = e.symbolSize - 0),
              (this._handleShape.style.color =
                "auto" === e.color
                  ? i.color
                    ? i.color
                    : t.controlStyle.emphasis.color
                  : e.color),
              (this._handleShape.style.textColor =
                "auto" === e.label.textStyle.color
                  ? this._handleShape.style.color
                  : e.label.textStyle.color),
              (this._handleShape.highlightStyle.strokeColor = this._handleShape.style.strokeColor =
                "auto" === e.borderColor
                  ? i.borderColor
                    ? i.borderColor
                    : "#fff"
                  : e.borderColor),
              (this._handleShape.style.lineWidth =
                "auto" === e.borderWidth
                  ? i.borderWidth
                    ? i.borderWidth
                    : 0
                  : e.borderWidth - 0),
              (this._handleShape.highlightStyle.lineWidth =
                this._handleShape.style.lineWidth + 1),
              this.zr
                .animate(this._handleShape.id, "style")
                .when(500, {
                  x: i.x - o,
                  textX: i.x,
                  y: this._location.y + this._location.height / 4 - o,
                  width: 2 * o,
                  height: 2 * o,
                })
                .start("ExponentialOut");
          }
        },
        _findChainIndex: function (t) {
          var e = this._chainPoint,
            i = e.length;
          if (t <= e[0].x) return 0;
          if (t >= e[i - 1].x) return i - 1;
          for (var o = 0; i - 1 > o; o++)
            if (t >= e[o].x && t <= e[o + 1].x)
              return Math.abs(t - e[o].x) < Math.abs(t - e[o + 1].x)
                ? o
                : o + 1;
        },
        __onclick: function (t) {
          var e = d.getX(t.event),
            i = this._findChainIndex(e);
          return i === this.currentIndex
            ? !0
            : ((this.currentIndex = i),
              this.timelineOption.autoPlay && this.stop(),
              clearTimeout(this.playTicket),
              void this._onFrame());
        },
        __ondrift: function (t, e) {
          this.timelineOption.autoPlay && this.stop();
          var i,
            o = this._chainPoint,
            s = o.length;
          t.style.x + e <= o[0].x - o[0].symbolSize
            ? ((t.style.x = o[0].x - o[0].symbolSize), (i = 0))
            : t.style.x + e >= o[s - 1].x - o[s - 1].symbolSize
            ? ((t.style.x = o[s - 1].x - o[s - 1].symbolSize), (i = s - 1))
            : ((t.style.x += e), (i = this._findChainIndex(t.style.x)));
          var r = o[i],
            n = r.symbolSize + 2;
          if (
            ((t.style.iconType = r.symbol),
            (t.style.n = r.n),
            (t.style.textX = t.style.x + n / 2),
            (t.style.y = this._location.y + this._location.height / 4 - n),
            (t.style.width = 2 * n),
            (t.style.height = 2 * n),
            (t.style.text = r.name),
            i === this.currentIndex)
          )
            return !0;
          if (((this.currentIndex = i), this.timelineOption.realtime)) {
            clearTimeout(this.playTicket);
            var a = this;
            this.playTicket = setTimeout(function () {
              a._setCurrentOption();
            }, 200);
          }
          return !0;
        },
        __ondragend: function () {
          this.isDragend = !0;
        },
        ondragend: function (t, e) {
          this.isDragend &&
            t.target &&
            (!this.timelineOption.realtime && this._setCurrentOption(),
            (e.dragOut = !0),
            (e.dragIn = !0),
            (e.needRefresh = !1),
            (this.isDragend = !1),
            this._syncHandleShape());
        },
        last: function () {
          return (
            this.timelineOption.autoPlay && this.stop(),
            (this.currentIndex -= 1),
            this.currentIndex < 0 &&
              (this.currentIndex = this.timelineOption.data.length - 1),
            this._onFrame(),
            this.currentIndex
          );
        },
        next: function () {
          return (
            this.timelineOption.autoPlay && this.stop(),
            (this.currentIndex += 1),
            this.currentIndex >= this.timelineOption.data.length &&
              (this.currentIndex = 0),
            this._onFrame(),
            this.currentIndex
          );
        },
        play: function (t, e) {
          return (
            this._ctrPlayShape &&
              "playing" != this._ctrPlayShape.style.status &&
              ((this._ctrPlayShape.style.status = "playing"),
              this.zr.modShape(this._ctrPlayShape.id),
              this.zr.refreshNextFrame()),
            (this.timelineOption.autoPlay = null != e ? e : !0),
            this.timelineOption.autoPlay || clearTimeout(this.playTicket),
            (this.currentIndex = null != t ? t : this.currentIndex + 1),
            this.currentIndex >= this.timelineOption.data.length &&
              (this.currentIndex = 0),
            this._onFrame(),
            this.currentIndex
          );
        },
        stop: function () {
          return (
            this._ctrPlayShape &&
              "stop" != this._ctrPlayShape.style.status &&
              ((this._ctrPlayShape.style.status = "stop"),
              this.zr.modShape(this._ctrPlayShape.id),
              this.zr.refreshNextFrame()),
            (this.timelineOption.autoPlay = !1),
            clearTimeout(this.playTicket),
            this.currentIndex
          );
        },
        resize: function () {
          this.timelineOption.show &&
            (this.clear(), this._buildShape(), this._syncHandleShape());
        },
        setTheme: function (t) {
          (this.timelineOption = this.reformOption(
            h.clone(this.option.timeline)
          )),
            (this.timelineOption.label.textStyle = this.getTextStyle(
              this.timelineOption.label.textStyle
            )),
            (this.timelineOption.checkpointStyle.label.textStyle = this.getTextStyle(
              this.timelineOption.checkpointStyle.label.textStyle
            )),
            this.timelineOption.show &&
              t &&
              (this.clear(), this._buildShape(), this._syncHandleShape());
        },
        onbeforDispose: function () {
          clearTimeout(this.playTicket);
        },
      }),
      (r.prototype.iconLibrary.timelineControl = i),
      h.inherits(e, o),
      t("../component").define("timeline", e),
      e
    );
  }),
  define("zrender/shape/Image", [
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
        type: "image",
        brush: function (t, e, i) {
          var o = this.style || {};
          e && (o = this.getHighlightStyle(o, this.highlightStyle || {}));
          var s = o.image,
            r = this;
          if (
            (this._imageCache || (this._imageCache = {}), "string" == typeof s)
          ) {
            var n = s;
            this._imageCache[n]
              ? (s = this._imageCache[n])
              : ((s = new Image()),
                (s.onload = function () {
                  (s.onload = null), r.modSelf(), i();
                }),
                (s.src = n),
                (this._imageCache[n] = s));
          }
          if (s) {
            if ("IMG" == s.nodeName.toUpperCase())
              if (window.ActiveXObject) {
                if ("complete" != s.readyState) return;
              } else if (!s.complete) return;
            var a = o.width || s.width,
              h = o.height || s.height,
              l = o.x,
              d = o.y;
            if (!s.width || !s.height) return;
            if (
              (t.save(),
              this.doClip(t),
              this.setContext(t, o),
              this.setTransform(t),
              o.sWidth && o.sHeight)
            ) {
              var c = o.sx || 0,
                p = o.sy || 0;
              t.drawImage(s, c, p, o.sWidth, o.sHeight, l, d, a, h);
            } else if (o.sx && o.sy) {
              var c = o.sx,
                p = o.sy,
                u = a - c,
                g = h - p;
              t.drawImage(s, c, p, u, g, l, d, a, h);
            } else t.drawImage(s, l, d, a, h);
            o.width || (o.width = a),
              o.height || (o.height = h),
              this.style.width || (this.style.width = a),
              this.style.height || (this.style.height = h),
              this.drawText(t, o, this.style),
              t.restore();
          }
        },
        getRect: function (t) {
          return { x: t.x, y: t.y, width: t.width, height: t.height };
        },
        clearCache: function () {
          this._imageCache = {};
        },
      }),
      t("../tool/util").inherits(i, e),
      i
    );
  }),
  define("zrender/loadingEffect/Bubble", [
    "require",
    "./Base",
    "../tool/util",
    "../tool/color",
    "../shape/Circle",
  ], function (t) {
    function e(t) {
      i.call(this, t);
    }
    var i = t("./Base"),
      o = t("../tool/util"),
      s = t("../tool/color"),
      r = t("../shape/Circle");
    return (
      o.inherits(e, i),
      (e.prototype._start = function (t, e) {
        for (
          var i = o.merge(this.options, {
              textStyle: { color: "#888" },
              backgroundColor: "rgba(250, 250, 250, 0.8)",
              effect: {
                n: 50,
                lineWidth: 2,
                brushType: "stroke",
                color: "random",
                timeInterval: 100,
              },
            }),
            n = this.createTextShape(i.textStyle),
            a = this.createBackgroundShape(i.backgroundColor),
            h = i.effect,
            l = h.n,
            d = h.brushType,
            c = h.lineWidth,
            p = [],
            u = this.canvasWidth,
            g = this.canvasHeight,
            f = 0;
          l > f;
          f++
        ) {
          var m = "random" == h.color ? s.alpha(s.random(), 0.3) : h.color;
          p[f] = new r({
            highlightStyle: {
              x: Math.ceil(Math.random() * u),
              y: Math.ceil(Math.random() * g),
              r: Math.ceil(40 * Math.random()),
              brushType: d,
              color: m,
              strokeColor: m,
              lineWidth: c,
            },
            animationY: Math.ceil(20 * Math.random()),
          });
        }
        return setInterval(function () {
          t(a);
          for (var i = 0; l > i; i++) {
            var o = p[i].highlightStyle;
            o.y - p[i].animationY + o.r <= 0 &&
              ((p[i].highlightStyle.y = g + o.r),
              (p[i].highlightStyle.x = Math.ceil(Math.random() * u))),
              (p[i].highlightStyle.y -= p[i].animationY),
              t(p[i]);
          }
          t(n), e();
        }, h.timeInterval);
      }),
      e
    );
  }),
  define("zrender/loadingEffect/Spin", [
    "require",
    "./Base",
    "../tool/util",
    "../tool/color",
    "../tool/area",
    "../shape/Sector",
  ], function (t) {
    function e(t) {
      i.call(this, t);
    }
    var i = t("./Base"),
      o = t("../tool/util"),
      s = t("../tool/color"),
      r = t("../tool/area"),
      n = t("../shape/Sector");
    return (
      o.inherits(e, i),
      (e.prototype._start = function (t, e) {
        var i = o.merge(this.options, {
            textStyle: { color: "#fff", textAlign: "start" },
            backgroundColor: "rgba(0, 0, 0, 0.8)",
          }),
          a = this.createTextShape(i.textStyle),
          h = 10,
          l = r.getTextWidth(a.highlightStyle.text, a.highlightStyle.textFont),
          d = r.getTextHeight(a.highlightStyle.text, a.highlightStyle.textFont),
          c = o.merge(this.options.effect || {}, {
            r0: 9,
            r: 15,
            n: 18,
            color: "#fff",
            timeInterval: 100,
          }),
          p = this.getLocation(
            this.options.textStyle,
            l + h + 2 * c.r,
            Math.max(2 * c.r, d)
          );
        (c.x = p.x + c.r),
          (c.y = a.highlightStyle.y = p.y + p.height / 2),
          (a.highlightStyle.x = c.x + c.r + h);
        for (
          var u = this.createBackgroundShape(i.backgroundColor),
            g = c.n,
            f = c.x,
            m = c.y,
            y = c.r0,
            _ = c.r,
            v = c.color,
            x = [],
            b = Math.round(180 / g),
            T = 0;
          g > T;
          T++
        )
          x[T] = new n({
            highlightStyle: {
              x: f,
              y: m,
              r0: y,
              r: _,
              startAngle: b * T * 2,
              endAngle: b * T * 2 + b,
              color: s.alpha(v, (T + 1) / g),
              brushType: "fill",
            },
          });
        var S = [0, f, m];
        return setInterval(function () {
          t(u), (S[0] -= 0.3);
          for (var i = 0; g > i; i++) (x[i].rotation = S), t(x[i]);
          t(a), e();
        }, c.timeInterval);
      }),
      e
    );
  }),
  define("echarts/theme/macarons", [], function () {
    var t = {
      color: [
        "#2ec7c9",
        "#b6a2de",
        "#5ab1ef",
        "#ffb980",
        "#d87a80",
        "#8d98b3",
        "#e5cf0d",
        "#97b552",
        "#95706d",
        "#dc69aa",
        "#07a2a4",
        "#9a7fd1",
        "#588dd5",
        "#f5994e",
        "#c05050",
        "#59678c",
        "#c9ab00",
        "#7eb00a",
        "#6f5553",
        "#c14089",
      ],
      title: { textStyle: { fontWeight: "normal", color: "#008acd" } },
      dataRange: { itemWidth: 15, color: ["#5ab1ef", "#e0ffff"] },
      toolbox: {
        color: ["#1e90ff", "#1e90ff", "#1e90ff", "#1e90ff"],
        effectiveColor: "#ff4500",
      },
      tooltip: {
        backgroundColor: "rgba(50,50,50,0.5)",
        axisPointer: {
          type: "line",
          lineStyle: { color: "#008acd" },
          crossStyle: { color: "#008acd" },
          shadowStyle: { color: "rgba(200,200,200,0.2)" },
        },
      },
      dataZoom: {
        dataBackgroundColor: "#efefff",
        fillerColor: "rgba(182,162,222,0.2)",
        handleColor: "#008acd",
      },
      grid: { borderColor: "#eee" },
      categoryAxis: {
        axisLine: { lineStyle: { color: "#008acd" } },
        splitLine: { lineStyle: { color: ["#eee"] } },
      },
      valueAxis: {
        axisLine: { lineStyle: { color: "#008acd" } },
        splitArea: {
          show: !0,
          areaStyle: {
            color: ["rgba(250,250,250,0.1)", "rgba(200,200,200,0.1)"],
          },
        },
        splitLine: { lineStyle: { color: ["#eee"] } },
      },
      polar: {
        axisLine: { lineStyle: { color: "#ddd" } },
        splitArea: {
          show: !0,
          areaStyle: {
            color: ["rgba(250,250,250,0.2)", "rgba(200,200,200,0.2)"],
          },
        },
        splitLine: { lineStyle: { color: "#ddd" } },
      },
      timeline: {
        lineStyle: { color: "#008acd" },
        controlStyle: {
          normal: { color: "#008acd" },
          emphasis: { color: "#008acd" },
        },
        symbol: "emptyCircle",
        symbolSize: 3,
      },
      bar: {
        itemStyle: {
          normal: { barBorderRadius: 5 },
          emphasis: { barBorderRadius: 5 },
        },
      },
      line: { smooth: !0, symbol: "emptyCircle", symbolSize: 3 },
      k: {
        itemStyle: {
          normal: {
            color: "#d87a80",
            color0: "#2ec7c9",
            lineStyle: { color: "#d87a80", color0: "#2ec7c9" },
          },
        },
      },
      scatter: { symbol: "circle", symbolSize: 4 },
      radar: { symbol: "emptyCircle", symbolSize: 3 },
      map: {
        itemStyle: {
          normal: {
            areaStyle: { color: "#ddd" },
            label: { textStyle: { color: "#d87a80" } },
          },
          emphasis: { areaStyle: { color: "#fe994e" } },
        },
      },
      force: { itemStyle: { normal: { linkStyle: { color: "#1e90ff" } } } },
      chord: {
        itemStyle: {
          normal: {
            borderWidth: 1,
            borderColor: "rgba(128, 128, 128, 0.5)",
            chordStyle: { lineStyle: { color: "rgba(128, 128, 128, 0.5)" } },
          },
          emphasis: {
            borderWidth: 1,
            borderColor: "rgba(128, 128, 128, 0.5)",
            chordStyle: { lineStyle: { color: "rgba(128, 128, 128, 0.5)" } },
          },
        },
      },
      gauge: {
        axisLine: {
          lineStyle: {
            color: [
              [0.2, "#2ec7c9"],
              [0.8, "#5ab1ef"],
              [1, "#d87a80"],
            ],
            width: 10,
          },
        },
        axisTick: { splitNumber: 10, length: 15, lineStyle: { color: "auto" } },
        splitLine: { length: 22, lineStyle: { color: "auto" } },
        pointer: { width: 5 },
      },
      textStyle: { fontFamily: "微软雅黑, Arial, Verdana, sans-serif" },
    };
    return t;
  }),
  define("echarts/theme/infographic", [], function () {
    var t = {
      color: [
        "#C1232B",
        "#B5C334",
        "#FCCE10",
        "#E87C25",
        "#27727B",
        "#FE8463",
        "#9BCA63",
        "#FAD860",
        "#F3A43B",
        "#60C0DD",
        "#D7504B",
        "#C6E579",
        "#F4E001",
        "#F0805A",
        "#26C0C0",
      ],
      title: { textStyle: { fontWeight: "normal", color: "#27727B" } },
      dataRange: {
        x: "right",
        y: "center",
        itemWidth: 5,
        itemHeight: 25,
        color: ["#C1232B", "#FCCE10"],
      },
      toolbox: {
        color: [
          "#C1232B",
          "#B5C334",
          "#FCCE10",
          "#E87C25",
          "#27727B",
          "#FE8463",
          "#9BCA63",
          "#FAD860",
          "#F3A43B",
          "#60C0DD",
        ],
        effectiveColor: "#ff4500",
      },
      tooltip: {
        backgroundColor: "rgba(50,50,50,0.5)",
        axisPointer: {
          type: "line",
          lineStyle: { color: "#27727B", type: "dashed" },
          crossStyle: { color: "#27727B" },
          shadowStyle: { color: "rgba(200,200,200,0.3)" },
        },
      },
      dataZoom: {
        dataBackgroundColor: "rgba(181,195,52,0.3)",
        fillerColor: "rgba(181,195,52,0.2)",
        handleColor: "#27727B",
      },
      grid: { borderWidth: 0 },
      categoryAxis: {
        axisLine: { lineStyle: { color: "#27727B" } },
        splitLine: { show: !1 },
      },
      valueAxis: {
        axisLine: { show: !1 },
        splitArea: { show: !1 },
        splitLine: { lineStyle: { color: ["#ccc"], type: "dashed" } },
      },
      polar: {
        axisLine: { lineStyle: { color: "#ddd" } },
        splitArea: {
          show: !0,
          areaStyle: {
            color: ["rgba(250,250,250,0.2)", "rgba(200,200,200,0.2)"],
          },
        },
        splitLine: { lineStyle: { color: "#ddd" } },
      },
      timeline: {
        lineStyle: { color: "#27727B" },
        controlStyle: {
          normal: { color: "#27727B" },
          emphasis: { color: "#27727B" },
        },
        symbol: "emptyCircle",
        symbolSize: 3,
      },
      line: {
        itemStyle: {
          normal: {
            borderWidth: 2,
            borderColor: "#fff",
            lineStyle: { width: 3 },
          },
          emphasis: { borderWidth: 0 },
        },
        symbol: "circle",
        symbolSize: 3.5,
      },
      k: {
        itemStyle: {
          normal: {
            color: "#C1232B",
            color0: "#B5C334",
            lineStyle: { width: 1, color: "#C1232B", color0: "#B5C334" },
          },
        },
      },
      scatter: {
        itemdStyle: {
          normal: { borderWidth: 1, borderColor: "rgba(200,200,200,0.5)" },
          emphasis: { borderWidth: 0 },
        },
        symbol: "star4",
        symbolSize: 4,
      },
      radar: { symbol: "emptyCircle", symbolSize: 3 },
      map: {
        itemStyle: {
          normal: {
            areaStyle: { color: "#ddd" },
            label: { textStyle: { color: "#C1232B" } },
          },
          emphasis: {
            areaStyle: { color: "#fe994e" },
            label: { textStyle: { color: "rgb(100,0,0)" } },
          },
        },
      },
      force: { itemStyle: { normal: { linkStyle: { color: "#27727B" } } } },
      chord: {
        itemStyle: {
          normal: {
            borderWidth: 1,
            borderColor: "rgba(128, 128, 128, 0.5)",
            chordStyle: { lineStyle: { color: "rgba(128, 128, 128, 0.5)" } },
          },
          emphasis: {
            borderWidth: 1,
            borderColor: "rgba(128, 128, 128, 0.5)",
            chordStyle: { lineStyle: { color: "rgba(128, 128, 128, 0.5)" } },
          },
        },
      },
      gauge: {
        center: ["50%", "80%"],
        radius: "100%",
        startAngle: 180,
        endAngle: 0,
        axisLine: {
          show: !0,
          lineStyle: {
            color: [
              [0.2, "#B5C334"],
              [0.8, "#27727B"],
              [1, "#C1232B"],
            ],
            width: "40%",
          },
        },
        axisTick: { splitNumber: 2, length: 5, lineStyle: { color: "#fff" } },
        axisLabel: { textStyle: { color: "#fff", fontWeight: "bolder" } },
        splitLine: { length: "5%", lineStyle: { color: "#fff" } },
        pointer: { width: "40%", length: "80%", color: "#fff" },
        title: {
          offsetCenter: [0, -20],
          textStyle: { color: "auto", fontSize: 20 },
        },
        detail: {
          offsetCenter: [0, 0],
          textStyle: { color: "auto", fontSize: 40 },
        },
      },
      textStyle: { fontFamily: "微软雅黑, Arial, Verdana, sans-serif" },
    };
    return t;
  }),
  define("zrender/mixin/Eventful", ["require"], function () {
    var t = function () {
      this._handlers = {};
    };
    return (
      (t.prototype.one = function (t, e, i) {
        var o = this._handlers;
        return e && t
          ? (o[t] || (o[t] = []),
            o[t].push({ h: e, one: !0, ctx: i || this }),
            this)
          : this;
      }),
      (t.prototype.bind = function (t, e, i) {
        var o = this._handlers;
        return e && t
          ? (o[t] || (o[t] = []),
            o[t].push({ h: e, one: !1, ctx: i || this }),
            this)
          : this;
      }),
      (t.prototype.unbind = function (t, e) {
        var i = this._handlers;
        if (!t) return (this._handlers = {}), this;
        if (e) {
          if (i[t]) {
            for (var o = [], s = 0, r = i[t].length; r > s; s++)
              i[t][s].h != e && o.push(i[t][s]);
            i[t] = o;
          }
          i[t] && 0 === i[t].length && delete i[t];
        } else delete i[t];
        return this;
      }),
      (t.prototype.dispatch = function (t) {
        if (this._handlers[t]) {
          var e = arguments,
            i = e.length;
          i > 3 && (e = Array.prototype.slice.call(e, 1));
          for (var o = this._handlers[t], s = o.length, r = 0; s > r; ) {
            switch (i) {
              case 1:
                o[r].h.call(o[r].ctx);
                break;
              case 2:
                o[r].h.call(o[r].ctx, e[1]);
                break;
              case 3:
                o[r].h.call(o[r].ctx, e[1], e[2]);
                break;
              default:
                o[r].h.apply(o[r].ctx, e);
            }
            o[r].one ? (o.splice(r, 1), s--) : r++;
          }
        }
        return this;
      }),
      (t.prototype.dispatchWithContext = function (t) {
        if (this._handlers[t]) {
          var e = arguments,
            i = e.length;
          i > 4 && (e = Array.prototype.slice.call(e, 1, e.length - 1));
          for (
            var o = e[e.length - 1], s = this._handlers[t], r = s.length, n = 0;
            r > n;

          ) {
            switch (i) {
              case 1:
                s[n].h.call(o);
                break;
              case 2:
                s[n].h.call(o, e[1]);
                break;
              case 3:
                s[n].h.call(o, e[1], e[2]);
                break;
              default:
                s[n].h.apply(o, e);
            }
            s[n].one ? (s.splice(n, 1), r--) : n++;
          }
        }
        return this;
      }),
      t
    );
  }),
  define("zrender/tool/log", ["require", "../config"], function (t) {
    var e = t("../config");
    return function () {
      if (0 !== e.debugMode)
        if (1 == e.debugMode)
          for (var t in arguments) throw new Error(arguments[t]);
        else if (e.debugMode > 1)
          for (var t in arguments) console.log(arguments[t]);
    };
  }),
  define("zrender/tool/guid", [], function () {
    var t = 2311;
    return function () {
      return "zrender__" + t++;
    };
  }),
  define("zrender/Handler", [
    "require",
    "./config",
    "./tool/env",
    "./tool/event",
    "./tool/util",
    "./tool/vector",
    "./tool/matrix",
    "./mixin/Eventful",
  ], function (t) {
    "use strict";
    function e(t, e) {
      return function (i) {
        return t.call(e, i);
      };
    }
    function i(t, e) {
      return function (i, o, s) {
        return t.call(e, i, o, s);
      };
    }
    function o(t) {
      for (var i = u.length; i--; ) {
        var o = u[i];
        t["_" + o + "Handler"] = e(g[o], t);
      }
    }
    function s(t, e, i) {
      if (
        (this._draggingTarget && this._draggingTarget.id == t.id) ||
        t.isSilent()
      )
        return !1;
      var o = this._event;
      if (t.isCover(e, i)) {
        t.hoverable && this.storage.addHover(t);
        for (var s = t.parent; s; ) {
          if (s.clipShape && !s.clipShape.isCover(this._mouseX, this._mouseY))
            return !1;
          s = s.parent;
        }
        return (
          this._lastHover != t &&
            (this._processOutShape(o),
            this._processDragLeave(o),
            (this._lastHover = t),
            this._processDragEnter(o)),
          this._processOverShape(o),
          this._processDragOver(o),
          (this._hasfound = 1),
          !0
        );
      }
      return !1;
    }
    var r = t("./config"),
      n = t("./tool/env"),
      a = t("./tool/event"),
      h = t("./tool/util"),
      l = t("./tool/vector"),
      d = t("./tool/matrix"),
      c = r.EVENT,
      p = t("./mixin/Eventful"),
      u = [
        "resize",
        "click",
        "dblclick",
        "mousewheel",
        "mousemove",
        "mouseout",
        "mouseup",
        "mousedown",
        "touchstart",
        "touchend",
        "touchmove",
      ],
      g = {
        resize: function (t) {
          (t = t || window.event),
            (this._lastHover = null),
            (this._isMouseDown = 0),
            this.dispatch(c.RESIZE, t);
        },
        click: function (t) {
          t = this._zrenderEventFixed(t);
          var e = this._lastHover;
          ((e && e.clickable) || !e) &&
            this._clickThreshold < 5 &&
            this._dispatchAgency(e, c.CLICK, t),
            this._mousemoveHandler(t);
        },
        dblclick: function (t) {
          (t = t || window.event), (t = this._zrenderEventFixed(t));
          var e = this._lastHover;
          ((e && e.clickable) || !e) &&
            this._clickThreshold < 5 &&
            this._dispatchAgency(e, c.DBLCLICK, t),
            this._mousemoveHandler(t);
        },
        mousewheel: function (t) {
          t = this._zrenderEventFixed(t);
          var e = t.wheelDelta || -t.detail,
            i = e > 0 ? 1.1 : 1 / 1.1,
            o = !1,
            s = this._mouseX,
            r = this._mouseY;
          this.painter.eachBuildinLayer(function (e) {
            var n = e.position;
            if (e.zoomable) {
              e.__zoom = e.__zoom || 1;
              var h = e.__zoom;
              (h *= i),
                (h = Math.max(Math.min(e.maxZoom, h), e.minZoom)),
                (i = h / e.__zoom),
                (e.__zoom = h),
                (n[0] -= (s - n[0]) * (i - 1)),
                (n[1] -= (r - n[1]) * (i - 1)),
                (e.scale[0] *= i),
                (e.scale[1] *= i),
                (e.dirty = !0),
                (o = !0),
                a.stop(t);
            }
          }),
            o && this.painter.refresh(),
            this._dispatchAgency(this._lastHover, c.MOUSEWHEEL, t),
            this._mousemoveHandler(t);
        },
        mousemove: function (t) {
          if (!this.painter.isLoading()) {
            (t = this._zrenderEventFixed(t)),
              (this._lastX = this._mouseX),
              (this._lastY = this._mouseY),
              (this._mouseX = a.getX(t)),
              (this._mouseY = a.getY(t));
            var e = this._mouseX - this._lastX,
              i = this._mouseY - this._lastY;
            this._processDragStart(t),
              (this._hasfound = 0),
              (this._event = t),
              this._iterateAndFindHover(),
              this._hasfound ||
                ((!this._draggingTarget ||
                  (this._lastHover &&
                    this._lastHover != this._draggingTarget)) &&
                  (this._processOutShape(t), this._processDragLeave(t)),
                (this._lastHover = null),
                this.storage.delHover(),
                this.painter.clearHover());
            var o = "default";
            if (this._draggingTarget)
              this.storage.drift(this._draggingTarget.id, e, i),
                this._draggingTarget.modSelf(),
                this.storage.addHover(this._draggingTarget),
                this._clickThreshold++;
            else if (this._isMouseDown) {
              var s = !1;
              this.painter.eachBuildinLayer(function (t) {
                t.panable &&
                  ((o = "move"),
                  (t.position[0] += e),
                  (t.position[1] += i),
                  (s = !0),
                  (t.dirty = !0));
              }),
                s && this.painter.refresh();
            }
            this._draggingTarget ||
            (this._hasfound && this._lastHover.draggable)
              ? (o = "move")
              : this._hasfound && this._lastHover.clickable && (o = "pointer"),
              (this.root.style.cursor = o),
              this._dispatchAgency(this._lastHover, c.MOUSEMOVE, t),
              (this._draggingTarget ||
                this._hasfound ||
                this.storage.hasHoverShape()) &&
                this.painter.refreshHover();
          }
        },
        mouseout: function (t) {
          t = this._zrenderEventFixed(t);
          var e = t.toElement || t.relatedTarget;
          if (e != this.root)
            for (; e && 9 != e.nodeType; ) {
              if (e == this.root) return void this._mousemoveHandler(t);
              e = e.parentNode;
            }
          (t.zrenderX = this._lastX),
            (t.zrenderY = this._lastY),
            (this.root.style.cursor = "default"),
            (this._isMouseDown = 0),
            this._processOutShape(t),
            this._processDrop(t),
            this._processDragEnd(t),
            this.painter.isLoading() || this.painter.refreshHover(),
            this.dispatch(c.GLOBALOUT, t);
        },
        mousedown: function (t) {
          return (
            (this._clickThreshold = 0),
            2 == this._lastDownButton
              ? ((this._lastDownButton = t.button),
                void (this._mouseDownTarget = null))
              : ((this._lastMouseDownMoment = new Date()),
                (t = this._zrenderEventFixed(t)),
                (this._isMouseDown = 1),
                (this._mouseDownTarget = this._lastHover),
                this._dispatchAgency(this._lastHover, c.MOUSEDOWN, t),
                void (this._lastDownButton = t.button))
          );
        },
        mouseup: function (t) {
          (t = this._zrenderEventFixed(t)),
            (this.root.style.cursor = "default"),
            (this._isMouseDown = 0),
            (this._mouseDownTarget = null),
            this._dispatchAgency(this._lastHover, c.MOUSEUP, t),
            this._processDrop(t),
            this._processDragEnd(t);
        },
        touchstart: function (t) {
          (t = this._zrenderEventFixed(t, !0)),
            (this._lastTouchMoment = new Date()),
            this._mobileFindFixed(t),
            this._mousedownHandler(t);
        },
        touchmove: function (t) {
          (t = this._zrenderEventFixed(t, !0)),
            this._mousemoveHandler(t),
            this._isDragging && a.stop(t);
        },
        touchend: function (t) {
          (t = this._zrenderEventFixed(t, !0)), this._mouseupHandler(t);
          var e = new Date();
          e - this._lastTouchMoment < c.touchClickDelay &&
            (this._mobileFindFixed(t),
            this._clickHandler(t),
            e - this._lastClickMoment < c.touchClickDelay / 2 &&
              (this._dblclickHandler(t),
              this._lastHover && this._lastHover.clickable && a.stop(t)),
            (this._lastClickMoment = e)),
            this.painter.clearHover();
        },
      },
      f = function (t, e, r) {
        p.call(this),
          (this.root = t),
          (this.storage = e),
          (this.painter = r),
          (this._lastX = this._lastY = this._mouseX = this._mouseY = 0),
          (this._findHover = i(s, this)),
          (this._domHover = r.getDomHover()),
          o(this),
          window.addEventListener
            ? (window.addEventListener("resize", this._resizeHandler),
              n.os.tablet || n.os.phone
                ? (t.addEventListener("touchstart", this._touchstartHandler),
                  t.addEventListener("touchmove", this._touchmoveHandler),
                  t.addEventListener("touchend", this._touchendHandler))
                : (t.addEventListener("click", this._clickHandler),
                  t.addEventListener("dblclick", this._dblclickHandler),
                  t.addEventListener("mousewheel", this._mousewheelHandler),
                  t.addEventListener("mousemove", this._mousemoveHandler),
                  t.addEventListener("mousedown", this._mousedownHandler),
                  t.addEventListener("mouseup", this._mouseupHandler)),
              t.addEventListener("DOMMouseScroll", this._mousewheelHandler),
              t.addEventListener("mouseout", this._mouseoutHandler))
            : (window.attachEvent("onresize", this._resizeHandler),
              t.attachEvent("onclick", this._clickHandler),
              (t.ondblclick = this._dblclickHandler),
              t.attachEvent("onmousewheel", this._mousewheelHandler),
              t.attachEvent("onmousemove", this._mousemoveHandler),
              t.attachEvent("onmouseout", this._mouseoutHandler),
              t.attachEvent("onmousedown", this._mousedownHandler),
              t.attachEvent("onmouseup", this._mouseupHandler));
      };
    (f.prototype.on = function (t, e, i) {
      return this.bind(t, e, i), this;
    }),
      (f.prototype.un = function (t, e) {
        return this.unbind(t, e), this;
      }),
      (f.prototype.trigger = function (t, e) {
        switch (t) {
          case c.RESIZE:
          case c.CLICK:
          case c.DBLCLICK:
          case c.MOUSEWHEEL:
          case c.MOUSEMOVE:
          case c.MOUSEDOWN:
          case c.MOUSEUP:
          case c.MOUSEOUT:
            this["_" + t + "Handler"](e);
        }
      }),
      (f.prototype.dispose = function () {
        var t = this.root;
        window.removeEventListener
          ? (window.removeEventListener("resize", this._resizeHandler),
            n.os.tablet || n.os.phone
              ? (t.removeEventListener("touchstart", this._touchstartHandler),
                t.removeEventListener("touchmove", this._touchmoveHandler),
                t.removeEventListener("touchend", this._touchendHandler))
              : (t.removeEventListener("click", this._clickHandler),
                t.removeEventListener("dblclick", this._dblclickHandler),
                t.removeEventListener("mousewheel", this._mousewheelHandler),
                t.removeEventListener("mousemove", this._mousemoveHandler),
                t.removeEventListener("mousedown", this._mousedownHandler),
                t.removeEventListener("mouseup", this._mouseupHandler)),
            t.removeEventListener("DOMMouseScroll", this._mousewheelHandler),
            t.removeEventListener("mouseout", this._mouseoutHandler))
          : (window.detachEvent("onresize", this._resizeHandler),
            t.detachEvent("onclick", this._clickHandler),
            t.detachEvent("dblclick", this._dblclickHandler),
            t.detachEvent("onmousewheel", this._mousewheelHandler),
            t.detachEvent("onmousemove", this._mousemoveHandler),
            t.detachEvent("onmouseout", this._mouseoutHandler),
            t.detachEvent("onmousedown", this._mousedownHandler),
            t.detachEvent("onmouseup", this._mouseupHandler)),
          (this.root = this._domHover = this.storage = this.painter = null),
          this.un();
      }),
      (f.prototype._processDragStart = function (t) {
        var e = this._lastHover;
        if (
          this._isMouseDown &&
          e &&
          e.draggable &&
          !this._draggingTarget &&
          this._mouseDownTarget == e
        ) {
          if (
            e.dragEnableTime &&
            new Date() - this._lastMouseDownMoment < e.dragEnableTime
          )
            return;
          var i = e;
          (this._draggingTarget = i),
            (this._isDragging = 1),
            (i.invisible = !0),
            this.storage.mod(i.id),
            this._dispatchAgency(i, c.DRAGSTART, t),
            this.painter.refresh();
        }
      }),
      (f.prototype._processDragEnter = function (t) {
        this._draggingTarget &&
          this._dispatchAgency(
            this._lastHover,
            c.DRAGENTER,
            t,
            this._draggingTarget
          );
      }),
      (f.prototype._processDragOver = function (t) {
        this._draggingTarget &&
          this._dispatchAgency(
            this._lastHover,
            c.DRAGOVER,
            t,
            this._draggingTarget
          );
      }),
      (f.prototype._processDragLeave = function (t) {
        this._draggingTarget &&
          this._dispatchAgency(
            this._lastHover,
            c.DRAGLEAVE,
            t,
            this._draggingTarget
          );
      }),
      (f.prototype._processDrop = function (t) {
        this._draggingTarget &&
          ((this._draggingTarget.invisible = !1),
          this.storage.mod(this._draggingTarget.id),
          this.painter.refresh(),
          this._dispatchAgency(
            this._lastHover,
            c.DROP,
            t,
            this._draggingTarget
          ));
      }),
      (f.prototype._processDragEnd = function (t) {
        this._draggingTarget &&
          (this._dispatchAgency(this._draggingTarget, c.DRAGEND, t),
          (this._lastHover = null)),
          (this._isDragging = 0),
          (this._draggingTarget = null);
      }),
      (f.prototype._processOverShape = function (t) {
        this._dispatchAgency(this._lastHover, c.MOUSEOVER, t);
      }),
      (f.prototype._processOutShape = function (t) {
        this._dispatchAgency(this._lastHover, c.MOUSEOUT, t);
      }),
      (f.prototype._dispatchAgency = function (t, e, i, o) {
        var s = "on" + e,
          r = { type: e, event: i, target: t, cancelBubble: !1 },
          n = t;
        for (
          o && (r.dragged = o);
          n &&
          (n[s] && (r.cancelBubble = n[s](r)),
          n.dispatch(e, r),
          (n = n.parent),
          !r.cancelBubble);

        );
        if (t) r.cancelBubble || this.dispatch(e, r);
        else if (!o) {
          var a = { type: e, event: i };
          this.dispatch(e, a),
            this.painter.eachOtherLayer(function (t) {
              "function" == typeof t[s] && t[s](a),
                t.dispatch && t.dispatch(e, a);
            });
        }
      }),
      (f.prototype._iterateAndFindHover = (function () {
        var t = d.create();
        return function () {
          for (
            var e,
              i,
              o = this.storage.getShapeList(),
              s = [0, 0],
              r = o.length - 1;
            r >= 0;
            r--
          ) {
            var n = o[r];
            if (
              (e !== n.zlevel &&
                ((i = this.painter.getLayer(n.zlevel, i)),
                (s[0] = this._mouseX),
                (s[1] = this._mouseY),
                i.needTransform &&
                  (d.invert(t, i.transform), l.applyTransform(s, s, t))),
              this._findHover(n, s[0], s[1]))
            )
              break;
          }
        };
      })());
    var m = [{ x: 10 }, { x: -20 }, { x: 10, y: 10 }, { y: -20 }];
    return (
      (f.prototype._mobileFindFixed = function (t) {
        (this._lastHover = null),
          (this._mouseX = t.zrenderX),
          (this._mouseY = t.zrenderY),
          (this._event = t),
          this._iterateAndFindHover();
        for (var e = 0; !this._lastHover && e < m.length; e++) {
          var i = m[e];
          i.x && (this._mouseX += i.x),
            i.y && (this._mouseY += i.y),
            this._iterateAndFindHover();
        }
        this._lastHover &&
          ((t.zrenderX = this._mouseX), (t.zrenderY = this._mouseY));
      }),
      (f.prototype._zrenderEventFixed = function (t, e) {
        if (t.zrenderFixed) return t;
        if (e) {
          var i =
            "touchend" != t.type ? t.targetTouches[0] : t.changedTouches[0];
          if (i) {
            var o = this.painter._domRoot.getBoundingClientRect();
            (t.zrenderX = i.clientX - o.left), (t.zrenderY = i.clientY - o.top);
          }
        } else {
          t = t || window.event;
          var s = t.toElement || t.relatedTarget || t.srcElement || t.target;
          s &&
            s != this._domHover &&
            ((t.zrenderX =
              ("undefined" != typeof t.offsetX ? t.offsetX : t.layerX) +
              s.offsetLeft),
            (t.zrenderY =
              ("undefined" != typeof t.offsetY ? t.offsetY : t.layerY) +
              s.offsetTop));
        }
        return (t.zrenderFixed = 1), t;
      }),
      h.merge(f.prototype, p.prototype, !0),
      f
    );
  }),
  define("zrender/Painter", [
    "require",
    "./config",
    "./tool/util",
    "./tool/log",
    "./loadingEffect/Base",
    "./Layer",
    "./shape/Image",
  ], function (t) {
    "use strict";
    function e() {
      return !1;
    }
    function i() {}
    function o(t) {
      return t
        ? t.isBuildin
          ? !0
          : "function" != typeof t.resize || "function" != typeof t.refresh
          ? !1
          : !0
        : !1;
    }
    var s = t("./config"),
      r = t("./tool/util"),
      n = t("./tool/log"),
      a = t("./loadingEffect/Base"),
      h = t("./Layer"),
      l = function (t, i) {
        (this.root = t),
          (t.style["-webkit-tap-highlight-color"] = "transparent"),
          (t.style["-webkit-user-select"] = "none"),
          (t.style["user-select"] = "none"),
          (t.style["-webkit-touch-callout"] = "none"),
          (this.storage = i),
          (t.innerHTML = ""),
          (this._width = this._getWidth()),
          (this._height = this._getHeight());
        var o = document.createElement("div");
        (this._domRoot = o),
          (o.style.position = "relative"),
          (o.style.overflow = "hidden"),
          (o.style.width = this._width + "px"),
          (o.style.height = this._height + "px"),
          t.appendChild(o),
          (this._layers = {}),
          (this._zlevelList = []),
          (this._layerConfig = {}),
          (this._loadingEffect = new a({})),
          (this.shapeToImage = this._createShapeToImageProcessor()),
          (this._bgDom = document.createElement("div")),
          (this._bgDom.style.cssText = [
            "position:absolute;left:0px;top:0px;width:",
            this._width,
            "px;height:",
            this._height + "px;",
            "-webkit-user-select:none;user-select;none;",
            "-webkit-touch-callout:none;",
          ].join("")),
          this._bgDom.setAttribute("data-zr-dom-id", "bg"),
          o.appendChild(this._bgDom),
          (this._bgDom.onselectstart = e);
        var s = new h("_zrender_hover_", this);
        (this._layers.hover = s),
          o.appendChild(s.dom),
          s.initContext(),
          (s.dom.onselectstart = e),
          (s.dom.style["-webkit-user-select"] = "none"),
          (s.dom.style["user-select"] = "none"),
          (s.dom.style["-webkit-touch-callout"] = "none"),
          (this.refreshNextFrame = null);
      };
    return (
      (l.prototype.render = function (t) {
        return (
          this.isLoading() && this.hideLoading(), this.refresh(t, !0), this
        );
      }),
      (l.prototype.refresh = function (t, e) {
        var i = this.storage.getShapeList(!0);
        this._paintList(i, e);
        for (var o = 0; o < this._zlevelList.length; o++) {
          var s = this._zlevelList[o],
            r = this._layers[s];
          !r.isBuildin && r.refresh && r.refresh();
        }
        return "function" == typeof t && t(), this;
      }),
      (l.prototype._preProcessLayer = function (t) {
        t.unusedCount++, t.updateTransform();
      }),
      (l.prototype._postProcessLayer = function (t) {
        (t.dirty = !1), 1 == t.unusedCount && t.clear();
      }),
      (l.prototype._paintList = function (t, e) {
        "undefined" == typeof e && (e = !1), this._updateLayerStatus(t);
        var i, o, r;
        this.eachBuildinLayer(this._preProcessLayer);
        for (var a = 0, h = t.length; h > a; a++) {
          var l = t[a];
          if (
            (o !== l.zlevel &&
              (i && (i.needTransform && r.restore(), r.flush && r.flush()),
              (o = l.zlevel),
              (i = this.getLayer(o)),
              i.isBuildin ||
                n("ZLevel " + o + " has been used by unkown layer " + i.id),
              (r = i.ctx),
              (i.unusedCount = 0),
              (i.dirty || e) && i.clear(),
              i.needTransform && (r.save(), i.setTransform(r))),
            (i.dirty || e) &&
              !l.invisible &&
              (!l.onbrush || (l.onbrush && !l.onbrush(r, !1))))
          )
            if (s.catchBrushException)
              try {
                l.brush(r, !1, this.refreshNextFrame);
              } catch (d) {
                n(d, "brush error of " + l.type, l);
              }
            else l.brush(r, !1, this.refreshNextFrame);
          l.__dirty = !1;
        }
        i && (i.needTransform && r.restore(), r.flush && r.flush()),
          this.eachBuildinLayer(this._postProcessLayer);
      }),
      (l.prototype.getLayer = function (t) {
        var e = this._layers[t];
        return (
          e ||
            ((e = new h(t, this)),
            (e.isBuildin = !0),
            this._layerConfig[t] && r.merge(e, this._layerConfig[t], !0),
            e.updateTransform(),
            this.insertLayer(t, e),
            e.initContext()),
          e
        );
      }),
      (l.prototype.insertLayer = function (t, e) {
        if (this._layers[t])
          return void n("ZLevel " + t + " has been used already");
        if (!o(e)) return void n("Layer of zlevel " + t + " is not valid");
        var i = this._zlevelList.length,
          s = null,
          r = -1;
        if (i > 0 && t > this._zlevelList[0]) {
          for (
            r = 0;
            i - 1 > r &&
            !(this._zlevelList[r] < t && this._zlevelList[r + 1] > t);
            r++
          );
          s = this._layers[this._zlevelList[r]];
        }
        this._zlevelList.splice(r + 1, 0, t);
        var a = s ? s.dom : this._bgDom;
        a.nextSibling
          ? a.parentNode.insertBefore(e.dom, a.nextSibling)
          : a.parentNode.appendChild(e.dom),
          (this._layers[t] = e);
      }),
      (l.prototype.eachLayer = function (t, e) {
        for (var i = 0; i < this._zlevelList.length; i++) {
          var o = this._zlevelList[i];
          t.call(e, this._layers[o], o);
        }
      }),
      (l.prototype.eachBuildinLayer = function (t, e) {
        for (var i = 0; i < this._zlevelList.length; i++) {
          var o = this._zlevelList[i],
            s = this._layers[o];
          s.isBuildin && t.call(e, s, o);
        }
      }),
      (l.prototype.eachOtherLayer = function (t, e) {
        for (var i = 0; i < this._zlevelList.length; i++) {
          var o = this._zlevelList[i],
            s = this._layers[o];
          s.isBuildin || t.call(e, s, o);
        }
      }),
      (l.prototype.getLayers = function () {
        return this._layers;
      }),
      (l.prototype._updateLayerStatus = function (t) {
        var e = this._layers,
          i = {};
        this.eachBuildinLayer(function (t, e) {
          (i[e] = t.elCount), (t.elCount = 0);
        });
        for (var o = 0, s = t.length; s > o; o++) {
          var r = t[o],
            n = r.zlevel,
            a = e[n];
          if (a) {
            if ((a.elCount++, a.dirty)) continue;
            a.dirty = r.__dirty;
          }
        }
        this.eachBuildinLayer(function (t, e) {
          i[e] !== t.elCount && (t.dirty = !0);
        });
      }),
      (l.prototype.refreshShapes = function (t, e) {
        for (var i = 0, o = t.length; o > i; i++) {
          var s = t[i];
          s.modSelf();
        }
        return this.refresh(e), this;
      }),
      (l.prototype.setLoadingEffect = function (t) {
        return (this._loadingEffect = t), this;
      }),
      (l.prototype.clear = function () {
        return this.eachBuildinLayer(this._clearLayer), this;
      }),
      (l.prototype._clearLayer = function (t) {
        t.clear();
      }),
      (l.prototype.modLayer = function (t, e) {
        if (e) {
          this._layerConfig[t]
            ? r.merge(this._layerConfig[t], e, !0)
            : (this._layerConfig[t] = e);
          var i = this._layers[t];
          i && r.merge(i, this._layerConfig[t], !0);
        }
      }),
      (l.prototype.delLayer = function (t) {
        var e = this._layers[t];
        e &&
          (this.modLayer(t, {
            position: e.position,
            rotation: e.rotation,
            scale: e.scale,
          }),
          e.dom.parentNode.removeChild(e.dom),
          delete this._layers[t],
          this._zlevelList.splice(r.indexOf(this._zlevelList, t), 1));
      }),
      (l.prototype.refreshHover = function () {
        this.clearHover();
        for (
          var t = this.storage.getHoverShapes(!0), e = 0, i = t.length;
          i > e;
          e++
        )
          this._brushHover(t[e]);
        var o = this._layers.hover.ctx;
        return o.flush && o.flush(), this.storage.delHover(), this;
      }),
      (l.prototype.clearHover = function () {
        var t = this._layers.hover;
        return t && t.clear(), this;
      }),
      (l.prototype.showLoading = function (t) {
        return (
          this._loadingEffect && this._loadingEffect.stop(),
          t && this.setLoadingEffect(t),
          this._loadingEffect.start(this),
          (this.loading = !0),
          this
        );
      }),
      (l.prototype.hideLoading = function () {
        return (
          this._loadingEffect.stop(),
          this.clearHover(),
          (this.loading = !1),
          this
        );
      }),
      (l.prototype.isLoading = function () {
        return this.loading;
      }),
      (l.prototype.resize = function () {
        var t = this._domRoot;
        t.style.display = "none";
        var e = this._getWidth(),
          i = this._getHeight();
        if (((t.style.display = ""), this._width != e || i != this._height)) {
          (this._width = e),
            (this._height = i),
            (t.style.width = e + "px"),
            (t.style.height = i + "px");
          for (var o in this._layers) this._layers[o].resize(e, i);
          this.refresh(null, !0);
        }
        return this;
      }),
      (l.prototype.clearLayer = function (t) {
        var e = this._layers[t];
        e && e.clear();
      }),
      (l.prototype.dispose = function () {
        this.isLoading() && this.hideLoading(),
          (this.root.innerHTML = ""),
          (this.root = this.storage = this._domRoot = this._layers = null);
      }),
      (l.prototype.getDomHover = function () {
        return this._layers.hover.dom;
      }),
      (l.prototype.toDataURL = function (t, e, i) {
        if (window.G_vmlCanvasManager) return null;
        var o = new h("image", this);
        this._bgDom.appendChild(o.dom), o.initContext();
        var r = o.ctx;
        (o.clearColor = e || "#fff"), o.clear();
        var a = this;
        this.storage.iterShape(
          function (t) {
            if (
              !t.invisible &&
              (!t.onbrush || (t.onbrush && !t.onbrush(r, !1)))
            )
              if (s.catchBrushException)
                try {
                  t.brush(r, !1, a.refreshNextFrame);
                } catch (e) {
                  n(e, "brush error of " + t.type, t);
                }
              else t.brush(r, !1, a.refreshNextFrame);
          },
          { normal: "up", update: !0 }
        );
        var l = o.dom.toDataURL(t, i);
        return (r = null), this._bgDom.removeChild(o.dom), l;
      }),
      (l.prototype.getWidth = function () {
        return this._width;
      }),
      (l.prototype.getHeight = function () {
        return this._height;
      }),
      (l.prototype._getWidth = function () {
        var t = this.root,
          e = t.currentStyle || document.defaultView.getComputedStyle(t);
        return (
          (
            (t.clientWidth || parseInt(e.width, 10)) -
            parseInt(e.paddingLeft, 10) -
            parseInt(e.paddingRight, 10)
          ).toFixed(0) - 0
        );
      }),
      (l.prototype._getHeight = function () {
        var t = this.root,
          e = t.currentStyle || document.defaultView.getComputedStyle(t);
        return (
          (
            (t.clientHeight || parseInt(e.height, 10)) -
            parseInt(e.paddingTop, 10) -
            parseInt(e.paddingBottom, 10)
          ).toFixed(0) - 0
        );
      }),
      (l.prototype._brushHover = function (t) {
        var e = this._layers.hover.ctx;
        if (!t.onbrush || (t.onbrush && !t.onbrush(e, !0))) {
          var i = this.getLayer(t.zlevel);
          if (
            (i.needTransform && (e.save(), i.setTransform(e)),
            s.catchBrushException)
          )
            try {
              t.brush(e, !0, this.refreshNextFrame);
            } catch (o) {
              n(o, "hoverBrush error of " + t.type, t);
            }
          else t.brush(e, !0, this.refreshNextFrame);
          i.needTransform && e.restore();
        }
      }),
      (l.prototype._shapeToImage = function (e, i, o, s, r) {
        var n = document.createElement("canvas"),
          a = n.getContext("2d");
        (n.style.width = o + "px"),
          (n.style.height = s + "px"),
          n.setAttribute("width", o * r),
          n.setAttribute("height", s * r),
          a.clearRect(0, 0, o * r, s * r);
        var h = { position: i.position, rotation: i.rotation, scale: i.scale };
        (i.position = [0, 0, 0]),
          (i.rotation = 0),
          (i.scale = [1, 1]),
          i && i.brush(a, !1);
        var l = t("./shape/Image"),
          d = new l({ id: e, style: { x: 0, y: 0, image: n } });
        return (
          null != h.position && (d.position = i.position = h.position),
          null != h.rotation && (d.rotation = i.rotation = h.rotation),
          null != h.scale && (d.scale = i.scale = h.scale),
          d
        );
      }),
      (l.prototype._createShapeToImageProcessor = function () {
        if (window.G_vmlCanvasManager) return i;
        var t = this;
        return function (e, i, o, r) {
          return t._shapeToImage(e, i, o, r, s.devicePixelRatio);
        };
      }),
      l
    );
  }),
  define("zrender/Storage", ["require", "./tool/util", "./Group"], function (
    t
  ) {
    "use strict";
    function e(t, e) {
      return t.zlevel == e.zlevel
        ? t.z == e.z
          ? t.__renderidx - e.__renderidx
          : t.z - e.z
        : t.zlevel - e.zlevel;
    }
    var i = t("./tool/util"),
      o = t("./Group"),
      s = { hover: !1, normal: "down", update: !1 },
      r = function () {
        (this._elements = {}),
          (this._hoverElements = []),
          (this._roots = []),
          (this._shapeList = []),
          (this._shapeListOffset = 0);
      };
    return (
      (r.prototype.iterShape = function (t, e) {
        if ((e || (e = s), e.hover))
          for (var i = 0, o = this._hoverElements.length; o > i; i++) {
            var r = this._hoverElements[i];
            if ((r.updateTransform(), t(r))) return this;
          }
        switch ((e.update && this.updateShapeList(), e.normal)) {
          case "down":
            for (var o = this._shapeList.length; o--; )
              if (t(this._shapeList[o])) return this;
            break;
          default:
            for (var i = 0, o = this._shapeList.length; o > i; i++)
              if (t(this._shapeList[i])) return this;
        }
        return this;
      }),
      (r.prototype.getHoverShapes = function (t) {
        for (var i = [], o = 0, s = this._hoverElements.length; s > o; o++) {
          i.push(this._hoverElements[o]);
          var r = this._hoverElements[o].hoverConnect;
          if (r) {
            var n;
            r = r instanceof Array ? r : [r];
            for (var a = 0, h = r.length; h > a; a++)
              (n = r[a].id ? r[a] : this.get(r[a])), n && i.push(n);
          }
        }
        if ((i.sort(e), t))
          for (var o = 0, s = i.length; s > o; o++) i[o].updateTransform();
        return i;
      }),
      (r.prototype.getShapeList = function (t) {
        return t && this.updateShapeList(), this._shapeList;
      }),
      (r.prototype.updateShapeList = function () {
        this._shapeListOffset = 0;
        for (var t = 0, i = this._roots.length; i > t; t++) {
          var o = this._roots[t];
          this._updateAndAddShape(o);
        }
        this._shapeList.length = this._shapeListOffset;
        for (var t = 0, i = this._shapeList.length; i > t; t++)
          this._shapeList[t].__renderidx = t;
        this._shapeList.sort(e);
      }),
      (r.prototype._updateAndAddShape = function (t, e) {
        if (!t.ignore)
          if ((t.updateTransform(), "group" == t.type)) {
            t.clipShape &&
              ((t.clipShape.parent = t),
              t.clipShape.updateTransform(),
              e ? ((e = e.slice()), e.push(t.clipShape)) : (e = [t.clipShape]));
            for (var i = 0; i < t._children.length; i++) {
              var o = t._children[i];
              (o.__dirty = t.__dirty || o.__dirty),
                this._updateAndAddShape(o, e);
            }
            t.__dirty = !1;
          } else
            (t.__clipShapes = e),
              (this._shapeList[this._shapeListOffset++] = t);
      }),
      (r.prototype.mod = function (t, e) {
        var o = this._elements[t];
        if (o && (o.modSelf(), e))
          if (e.parent || e._storage || e.__clipShapes) {
            var s = {};
            for (var r in e)
              "parent" !== r &&
                "_storage" !== r &&
                "__clipShapes" !== r &&
                e.hasOwnProperty(r) &&
                (s[r] = e[r]);
            i.merge(o, s, !0);
          } else i.merge(o, e, !0);
        return this;
      }),
      (r.prototype.drift = function (t, e, i) {
        var o = this._elements[t];
        return (
          o &&
            ((o.needTransform = !0),
            "horizontal" === o.draggable
              ? (i = 0)
              : "vertical" === o.draggable && (e = 0),
            (!o.ondrift || (o.ondrift && !o.ondrift(e, i))) && o.drift(e, i)),
          this
        );
      }),
      (r.prototype.addHover = function (t) {
        return t.updateNeedTransform(), this._hoverElements.push(t), this;
      }),
      (r.prototype.delHover = function () {
        return (this._hoverElements = []), this;
      }),
      (r.prototype.hasHoverShape = function () {
        return this._hoverElements.length > 0;
      }),
      (r.prototype.addRoot = function (t) {
        t instanceof o && t.addChildrenToStorage(this),
          this.addToMap(t),
          this._roots.push(t);
      }),
      (r.prototype.delRoot = function (t) {
        if ("undefined" == typeof t) {
          for (var e = 0; e < this._roots.length; e++) {
            var s = this._roots[e];
            s instanceof o && s.delChildrenFromStorage(this);
          }
          return (
            (this._elements = {}),
            (this._hoverElements = []),
            (this._roots = []),
            (this._shapeList = []),
            void (this._shapeListOffset = 0)
          );
        }
        if (t instanceof Array)
          for (var e = 0, r = t.length; r > e; e++) this.delRoot(t[e]);
        else {
          var n;
          n = "string" == typeof t ? this._elements[t] : t;
          var a = i.indexOf(this._roots, n);
          a >= 0 &&
            (this.delFromMap(n.id),
            this._roots.splice(a, 1),
            n instanceof o && n.delChildrenFromStorage(this));
        }
      }),
      (r.prototype.addToMap = function (t) {
        return (
          t instanceof o && (t._storage = this),
          t.modSelf(),
          (this._elements[t.id] = t),
          this
        );
      }),
      (r.prototype.get = function (t) {
        return this._elements[t];
      }),
      (r.prototype.delFromMap = function (t) {
        var e = this._elements[t];
        return (
          e &&
            (delete this._elements[t], e instanceof o && (e._storage = null)),
          this
        );
      }),
      (r.prototype.dispose = function () {
        this._elements = this._renderList = this._roots = this._hoverElements = null;
      }),
      r
    );
  }),
  define("zrender/animation/Animation", [
    "require",
    "./Clip",
    "../tool/color",
    "../tool/util",
    "../tool/event",
  ], function (t) {
    "use strict";
    function e(t, e) {
      return t[e];
    }
    function i(t, e, i) {
      t[e] = i;
    }
    function o(t, e, i) {
      return (e - t) * i + t;
    }
    function s(t, e, i, s, r) {
      var n = t.length;
      if (1 == r) for (var a = 0; n > a; a++) s[a] = o(t[a], e[a], i);
      else
        for (var h = t[0].length, a = 0; n > a; a++)
          for (var l = 0; h > l; l++) s[a][l] = o(t[a][l], e[a][l], i);
    }
    function r(t) {
      switch (typeof t) {
        case "undefined":
        case "string":
          return !1;
      }
      return "undefined" != typeof t.length;
    }
    function n(t, e, i, o, s, r, n, h, l) {
      var d = t.length;
      if (1 == l)
        for (var c = 0; d > c; c++) h[c] = a(t[c], e[c], i[c], o[c], s, r, n);
      else
        for (var p = t[0].length, c = 0; d > c; c++)
          for (var u = 0; p > u; u++)
            h[c][u] = a(t[c][u], e[c][u], i[c][u], o[c][u], s, r, n);
    }
    function a(t, e, i, o, s, r, n) {
      var a = 0.5 * (i - t),
        h = 0.5 * (o - e);
      return (
        (2 * (e - i) + a + h) * n + (-3 * (e - i) - 2 * a - h) * r + a * s + e
      );
    }
    function h(t) {
      if (r(t)) {
        var e = t.length;
        if (r(t[0])) {
          for (var i = [], o = 0; e > o; o++) i.push(f.call(t[o]));
          return i;
        }
        return f.call(t);
      }
      return t;
    }
    function l(t) {
      return (
        (t[0] = Math.floor(t[0])),
        (t[1] = Math.floor(t[1])),
        (t[2] = Math.floor(t[2])),
        "rgba(" + t.join(",") + ")"
      );
    }
    var d = t("./Clip"),
      c = t("../tool/color"),
      p = t("../tool/util"),
      u = t("../tool/event").Dispatcher,
      g =
        window.requestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        function (t) {
          setTimeout(t, 16);
        },
      f = Array.prototype.slice,
      m = function (t) {
        (t = t || {}),
          (this.stage = t.stage || {}),
          (this.onframe = t.onframe || function () {}),
          (this._clips = []),
          (this._running = !1),
          (this._time = 0),
          u.call(this);
      };
    (m.prototype = {
      add: function (t) {
        this._clips.push(t);
      },
      remove: function (t) {
        var e = p.indexOf(this._clips, t);
        e >= 0 && this._clips.splice(e, 1);
      },
      _update: function () {
        for (
          var t = new Date().getTime(),
            e = t - this._time,
            i = this._clips,
            o = i.length,
            s = [],
            r = [],
            n = 0;
          o > n;
          n++
        ) {
          var a = i[n],
            h = a.step(t);
          h && (s.push(h), r.push(a));
        }
        for (var n = 0; o > n; )
          i[n]._needsRemove ? ((i[n] = i[o - 1]), i.pop(), o--) : n++;
        o = s.length;
        for (var n = 0; o > n; n++) r[n].fire(s[n]);
        (this._time = t),
          this.onframe(e),
          this.dispatch("frame", e),
          this.stage.update && this.stage.update();
      },
      start: function () {
        function t() {
          e._running && (e._update(), g(t));
        }
        var e = this;
        (this._running = !0), (this._time = new Date().getTime()), g(t);
      },
      stop: function () {
        this._running = !1;
      },
      clear: function () {
        this._clips = [];
      },
      animate: function (t, e) {
        e = e || {};
        var i = new y(t, e.loop, e.getter, e.setter);
        return (i.animation = this), i;
      },
      constructor: m,
    }),
      p.merge(m.prototype, u.prototype, !0);
    var y = function (t, o, s, r) {
      (this._tracks = {}),
        (this._target = t),
        (this._loop = o || !1),
        (this._getter = s || e),
        (this._setter = r || i),
        (this._clipCount = 0),
        (this._delay = 0),
        (this._doneList = []),
        (this._onframeList = []),
        (this._clipList = []);
    };
    return (
      (y.prototype = {
        when: function (t, e) {
          for (var i in e)
            this._tracks[i] ||
              ((this._tracks[i] = []),
              0 !== t &&
                this._tracks[i].push({
                  time: 0,
                  value: h(this._getter(this._target, i)),
                })),
              this._tracks[i].push({ time: parseInt(t, 10), value: e[i] });
          return this;
        },
        during: function (t) {
          return this._onframeList.push(t), this;
        },
        start: function (t) {
          var e = this,
            i = this._setter,
            h = this._getter,
            p = "spline" === t,
            u = function () {
              if ((e._clipCount--, 0 === e._clipCount)) {
                e._tracks = {};
                for (var t = e._doneList.length, i = 0; t > i; i++)
                  e._doneList[i].call(e);
              }
            },
            g = function (g, f) {
              var m = g.length;
              if (m) {
                var y = g[0].value,
                  _ = r(y),
                  v = !1,
                  x = _ && r(y[0]) ? 2 : 1;
                g.sort(function (t, e) {
                  return t.time - e.time;
                });
                var b;
                if (m) {
                  b = g[m - 1].time;
                  for (var T = [], S = [], C = 0; m > C; C++) {
                    T.push(g[C].time / b);
                    var z = g[C].value;
                    "string" == typeof z &&
                      ((z = c.toArray(z)),
                      0 === z.length && ((z[0] = z[1] = z[2] = 0), (z[3] = 1)),
                      (v = !0)),
                      S.push(z);
                  }
                  var L,
                    C,
                    w,
                    M,
                    E,
                    A,
                    k,
                    O = 0,
                    I = 0;
                  if (v) var P = [0, 0, 0, 0];
                  var R = function (t, r) {
                      if (I > r) {
                        for (
                          L = Math.min(O + 1, m - 1), C = L;
                          C >= 0 && !(T[C] <= r);
                          C--
                        );
                        C = Math.min(C, m - 2);
                      } else {
                        for (C = O; m > C && !(T[C] > r); C++);
                        C = Math.min(C - 1, m - 2);
                      }
                      (O = C), (I = r);
                      var d = T[C + 1] - T[C];
                      if (0 !== d) {
                        if (((w = (r - T[C]) / d), p))
                          if (
                            ((E = S[C]),
                            (M = S[0 === C ? C : C - 1]),
                            (A = S[C > m - 2 ? m - 1 : C + 1]),
                            (k = S[C > m - 3 ? m - 1 : C + 2]),
                            _)
                          )
                            n(M, E, A, k, w, w * w, w * w * w, h(t, f), x);
                          else {
                            var c;
                            v
                              ? ((c = n(M, E, A, k, w, w * w, w * w * w, P, 1)),
                                (c = l(P)))
                              : (c = a(M, E, A, k, w, w * w, w * w * w)),
                              i(t, f, c);
                          }
                        else if (_) s(S[C], S[C + 1], w, h(t, f), x);
                        else {
                          var c;
                          v
                            ? (s(S[C], S[C + 1], w, P, 1), (c = l(P)))
                            : (c = o(S[C], S[C + 1], w)),
                            i(t, f, c);
                        }
                        for (C = 0; C < e._onframeList.length; C++)
                          e._onframeList[C](t, r);
                      }
                    },
                    D = new d({
                      target: e._target,
                      life: b,
                      loop: e._loop,
                      delay: e._delay,
                      onframe: R,
                      ondestroy: u,
                    });
                  t && "spline" !== t && (D.easing = t),
                    e._clipList.push(D),
                    e._clipCount++,
                    e.animation.add(D);
                }
              }
            };
          for (var f in this._tracks) g(this._tracks[f], f);
          return this;
        },
        stop: function () {
          for (var t = 0; t < this._clipList.length; t++) {
            var e = this._clipList[t];
            this.animation.remove(e);
          }
          this._clipList = [];
        },
        delay: function (t) {
          return (this._delay = t), this;
        },
        done: function (t) {
          return t && this._doneList.push(t), this;
        },
      }),
      m
    );
  }),
  define("zrender/tool/env", [], function () {
    function t(t) {
      var e = (this.os = {}),
        i = (this.browser = {}),
        o = t.match(/Web[kK]it[\/]{0,1}([\d.]+)/),
        s = t.match(/(Android);?[\s\/]+([\d.]+)?/),
        r = t.match(/(iPad).*OS\s([\d_]+)/),
        n = t.match(/(iPod)(.*OS\s([\d_]+))?/),
        a = !r && t.match(/(iPhone\sOS)\s([\d_]+)/),
        h = t.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
        l = h && t.match(/TouchPad/),
        d = t.match(/Kindle\/([\d.]+)/),
        c = t.match(/Silk\/([\d._]+)/),
        p = t.match(/(BlackBerry).*Version\/([\d.]+)/),
        u = t.match(/(BB10).*Version\/([\d.]+)/),
        g = t.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
        f = t.match(/PlayBook/),
        m = t.match(/Chrome\/([\d.]+)/) || t.match(/CriOS\/([\d.]+)/),
        y = t.match(/Firefox\/([\d.]+)/),
        _ = t.match(/MSIE ([\d.]+)/),
        v = o && t.match(/Mobile\//) && !m,
        x = t.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/) && !m,
        _ = t.match(/MSIE\s([\d.]+)/);
      return (
        (i.webkit = !!o) && (i.version = o[1]),
        s && ((e.android = !0), (e.version = s[2])),
        a &&
          !n &&
          ((e.ios = e.iphone = !0), (e.version = a[2].replace(/_/g, "."))),
        r && ((e.ios = e.ipad = !0), (e.version = r[2].replace(/_/g, "."))),
        n &&
          ((e.ios = e.ipod = !0),
          (e.version = n[3] ? n[3].replace(/_/g, ".") : null)),
        h && ((e.webos = !0), (e.version = h[2])),
        l && (e.touchpad = !0),
        p && ((e.blackberry = !0), (e.version = p[2])),
        u && ((e.bb10 = !0), (e.version = u[2])),
        g && ((e.rimtabletos = !0), (e.version = g[2])),
        f && (i.playbook = !0),
        d && ((e.kindle = !0), (e.version = d[1])),
        c && ((i.silk = !0), (i.version = c[1])),
        !c && e.android && t.match(/Kindle Fire/) && (i.silk = !0),
        m && ((i.chrome = !0), (i.version = m[1])),
        y && ((i.firefox = !0), (i.version = y[1])),
        _ && ((i.ie = !0), (i.version = _[1])),
        v && (t.match(/Safari/) || e.ios) && (i.safari = !0),
        x && (i.webview = !0),
        _ && ((i.ie = !0), (i.version = _[1])),
        (e.tablet = !!(
          r ||
          f ||
          (s && !t.match(/Mobile/)) ||
          (y && t.match(/Tablet/)) ||
          (_ && !t.match(/Phone/) && t.match(/Touch/))
        )),
        (e.phone = !(
          e.tablet ||
          e.ipod ||
          !(
            s ||
            a ||
            h ||
            p ||
            u ||
            (m && t.match(/Android/)) ||
            (m && t.match(/CriOS\/([\d.]+)/)) ||
            (y && t.match(/Mobile/)) ||
            (_ && t.match(/Touch/))
          )
        )),
        {
          browser: i,
          os: e,
          canvasSupported: document.createElement("canvas").getContext
            ? !0
            : !1,
        }
      );
    }
    return t(navigator.userAgent);
  }),
  define("zrender/tool/vector", [], function () {
    var t = "undefined" == typeof Float32Array ? Array : Float32Array,
      e = {
        create: function (e, i) {
          var o = new t(2);
          return (o[0] = e || 0), (o[1] = i || 0), o;
        },
        copy: function (t, e) {
          return (t[0] = e[0]), (t[1] = e[1]), t;
        },
        set: function (t, e, i) {
          return (t[0] = e), (t[1] = i), t;
        },
        add: function (t, e, i) {
          return (t[0] = e[0] + i[0]), (t[1] = e[1] + i[1]), t;
        },
        scaleAndAdd: function (t, e, i, o) {
          return (t[0] = e[0] + i[0] * o), (t[1] = e[1] + i[1] * o), t;
        },
        sub: function (t, e, i) {
          return (t[0] = e[0] - i[0]), (t[1] = e[1] - i[1]), t;
        },
        len: function (t) {
          return Math.sqrt(this.lenSquare(t));
        },
        lenSquare: function (t) {
          return t[0] * t[0] + t[1] * t[1];
        },
        mul: function (t, e, i) {
          return (t[0] = e[0] * i[0]), (t[1] = e[1] * i[1]), t;
        },
        div: function (t, e, i) {
          return (t[0] = e[0] / i[0]), (t[1] = e[1] / i[1]), t;
        },
        dot: function (t, e) {
          return t[0] * e[0] + t[1] * e[1];
        },
        scale: function (t, e, i) {
          return (t[0] = e[0] * i), (t[1] = e[1] * i), t;
        },
        normalize: function (t, i) {
          var o = e.len(i);
          return (
            0 === o
              ? ((t[0] = 0), (t[1] = 0))
              : ((t[0] = i[0] / o), (t[1] = i[1] / o)),
            t
          );
        },
        distance: function (t, e) {
          return Math.sqrt(
            (t[0] - e[0]) * (t[0] - e[0]) + (t[1] - e[1]) * (t[1] - e[1])
          );
        },
        distanceSquare: function (t, e) {
          return (t[0] - e[0]) * (t[0] - e[0]) + (t[1] - e[1]) * (t[1] - e[1]);
        },
        negate: function (t, e) {
          return (t[0] = -e[0]), (t[1] = -e[1]), t;
        },
        lerp: function (t, e, i, o) {
          return (
            (t[0] = e[0] + o * (i[0] - e[0])),
            (t[1] = e[1] + o * (i[1] - e[1])),
            t
          );
        },
        applyTransform: function (t, e, i) {
          var o = e[0],
            s = e[1];
          return (
            (t[0] = i[0] * o + i[2] * s + i[4]),
            (t[1] = i[1] * o + i[3] * s + i[5]),
            t
          );
        },
        min: function (t, e, i) {
          return (
            (t[0] = Math.min(e[0], i[0])), (t[1] = Math.min(e[1], i[1])), t
          );
        },
        max: function (t, e, i) {
          return (
            (t[0] = Math.max(e[0], i[0])), (t[1] = Math.max(e[1], i[1])), t
          );
        },
      };
    return (
      (e.length = e.len),
      (e.lengthSquare = e.lenSquare),
      (e.dist = e.distance),
      (e.distSquare = e.distanceSquare),
      e
    );
  }),
  define("zrender/tool/matrix", [], function () {
    var t = "undefined" == typeof Float32Array ? Array : Float32Array,
      e = {
        create: function () {
          var i = new t(6);
          return e.identity(i), i;
        },
        identity: function (t) {
          return (
            (t[0] = 1),
            (t[1] = 0),
            (t[2] = 0),
            (t[3] = 1),
            (t[4] = 0),
            (t[5] = 0),
            t
          );
        },
        copy: function (t, e) {
          return (
            (t[0] = e[0]),
            (t[1] = e[1]),
            (t[2] = e[2]),
            (t[3] = e[3]),
            (t[4] = e[4]),
            (t[5] = e[5]),
            t
          );
        },
        mul: function (t, e, i) {
          return (
            (t[0] = e[0] * i[0] + e[2] * i[1]),
            (t[1] = e[1] * i[0] + e[3] * i[1]),
            (t[2] = e[0] * i[2] + e[2] * i[3]),
            (t[3] = e[1] * i[2] + e[3] * i[3]),
            (t[4] = e[0] * i[4] + e[2] * i[5] + e[4]),
            (t[5] = e[1] * i[4] + e[3] * i[5] + e[5]),
            t
          );
        },
        translate: function (t, e, i) {
          return (
            (t[0] = e[0]),
            (t[1] = e[1]),
            (t[2] = e[2]),
            (t[3] = e[3]),
            (t[4] = e[4] + i[0]),
            (t[5] = e[5] + i[1]),
            t
          );
        },
        rotate: function (t, e, i) {
          var o = e[0],
            s = e[2],
            r = e[4],
            n = e[1],
            a = e[3],
            h = e[5],
            l = Math.sin(i),
            d = Math.cos(i);
          return (
            (t[0] = o * d + n * l),
            (t[1] = -o * l + n * d),
            (t[2] = s * d + a * l),
            (t[3] = -s * l + d * a),
            (t[4] = d * r + l * h),
            (t[5] = d * h - l * r),
            t
          );
        },
        scale: function (t, e, i) {
          var o = i[0],
            s = i[1];
          return (
            (t[0] = e[0] * o),
            (t[1] = e[1] * s),
            (t[2] = e[2] * o),
            (t[3] = e[3] * s),
            (t[4] = e[4] * o),
            (t[5] = e[5] * s),
            t
          );
        },
        invert: function (t, e) {
          var i = e[0],
            o = e[2],
            s = e[4],
            r = e[1],
            n = e[3],
            a = e[5],
            h = i * n - r * o;
          return h
            ? ((h = 1 / h),
              (t[0] = n * h),
              (t[1] = -r * h),
              (t[2] = -o * h),
              (t[3] = i * h),
              (t[4] = (o * a - n * s) * h),
              (t[5] = (r * s - i * a) * h),
              t)
            : null;
        },
        mulVector: function (t, e, i) {
          var o = e[0],
            s = e[2],
            r = e[4],
            n = e[1],
            a = e[3],
            h = e[5];
          return (
            (t[0] = i[0] * o + i[1] * s + r),
            (t[1] = i[0] * n + i[1] * a + h),
            t
          );
        },
      };
    return e;
  }),
  define("zrender/loadingEffect/Base", [
    "require",
    "../tool/util",
    "../shape/Text",
    "../shape/Rectangle",
  ], function (t) {
    function e(t) {
      this.setOptions(t);
    }
    var i = t("../tool/util"),
      o = t("../shape/Text"),
      s = t("../shape/Rectangle"),
      r = "Loading...",
      n = "normal 16px Arial";
    return (
      (e.prototype.createTextShape = function (t) {
        return new o({
          highlightStyle: i.merge(
            {
              x: this.canvasWidth / 2,
              y: this.canvasHeight / 2,
              text: r,
              textAlign: "center",
              textBaseline: "middle",
              textFont: n,
              color: "#333",
              brushType: "fill",
            },
            t,
            !0
          ),
        });
      }),
      (e.prototype.createBackgroundShape = function (t) {
        return new s({
          highlightStyle: {
            x: 0,
            y: 0,
            width: this.canvasWidth,
            height: this.canvasHeight,
            brushType: "fill",
            color: t,
          },
        });
      }),
      (e.prototype.start = function (t) {
        function e(e) {
          t.storage.addHover(e);
        }
        function i() {
          t.refreshHover();
        }
        (this.canvasWidth = t._width),
          (this.canvasHeight = t._height),
          (this.loadingTimer = this._start(e, i));
      }),
      (e.prototype._start = function () {
        return setInterval(function () {}, 1e4);
      }),
      (e.prototype.stop = function () {
        clearInterval(this.loadingTimer);
      }),
      (e.prototype.setOptions = function (t) {
        this.options = t || {};
      }),
      (e.prototype.adjust = function (t, e) {
        return t <= e[0] ? (t = e[0]) : t >= e[1] && (t = e[1]), t;
      }),
      (e.prototype.getLocation = function (t, e, i) {
        var o = null != t.x ? t.x : "center";
        switch (o) {
          case "center":
            o = Math.floor((this.canvasWidth - e) / 2);
            break;
          case "left":
            o = 0;
            break;
          case "right":
            o = this.canvasWidth - e;
        }
        var s = null != t.y ? t.y : "center";
        switch (s) {
          case "center":
            s = Math.floor((this.canvasHeight - i) / 2);
            break;
          case "top":
            s = 0;
            break;
          case "bottom":
            s = this.canvasHeight - i;
        }
        return { x: o, y: s, width: e, height: i };
      }),
      e
    );
  }),
  define("zrender/Layer", [
    "require",
    "./mixin/Transformable",
    "./tool/util",
    "./config",
  ], function (t) {
    function e() {
      return !1;
    }
    function i(t, e, i) {
      var o = document.createElement(e),
        s = i.getWidth(),
        r = i.getHeight();
      return (
        (o.style.position = "absolute"),
        (o.style.left = 0),
        (o.style.top = 0),
        (o.style.width = s + "px"),
        (o.style.height = r + "px"),
        (o.width = s * n.devicePixelRatio),
        (o.height = r * n.devicePixelRatio),
        o.setAttribute("data-zr-dom-id", t),
        o
      );
    }
    var o = t("./mixin/Transformable"),
      s = t("./tool/util"),
      r = window.G_vmlCanvasManager,
      n = t("./config"),
      a = function (t, s) {
        (this.id = t),
          (this.dom = i(t, "canvas", s)),
          (this.dom.onselectstart = e),
          (this.dom.style["-webkit-user-select"] = "none"),
          (this.dom.style["user-select"] = "none"),
          (this.dom.style["-webkit-touch-callout"] = "none"),
          (this.dom.style["-webkit-tap-highlight-color"] = "rgba(0,0,0,0)"),
          r && r.initElement(this.dom),
          (this.domBack = null),
          (this.ctxBack = null),
          (this.painter = s),
          (this.unusedCount = 0),
          (this.config = null),
          (this.dirty = !0),
          (this.elCount = 0),
          (this.clearColor = 0),
          (this.motionBlur = !1),
          (this.lastFrameAlpha = 0.7),
          (this.zoomable = !1),
          (this.panable = !1),
          (this.maxZoom = 1 / 0),
          (this.minZoom = 0),
          o.call(this);
      };
    return (
      (a.prototype.initContext = function () {
        this.ctx = this.dom.getContext("2d");
        var t = n.devicePixelRatio;
        1 != t && this.ctx.scale(t, t);
      }),
      (a.prototype.createBackBuffer = function () {
        if (!r) {
          (this.domBack = i("back-" + this.id, "canvas", this.painter)),
            (this.ctxBack = this.domBack.getContext("2d"));
          var t = n.devicePixelRatio;
          1 != t && this.ctxBack.scale(t, t);
        }
      }),
      (a.prototype.resize = function (t, e) {
        var i = n.devicePixelRatio;
        (this.dom.style.width = t + "px"),
          (this.dom.style.height = e + "px"),
          this.dom.setAttribute("width", t * i),
          this.dom.setAttribute("height", e * i),
          1 != i && this.ctx.scale(i, i),
          this.domBack &&
            (this.domBack.setAttribute("width", t * i),
            this.domBack.setAttribute("height", e * i),
            1 != i && this.ctxBack.scale(i, i));
      }),
      (a.prototype.clear = function () {
        var t = this.dom,
          e = this.ctx,
          i = t.width,
          o = t.height,
          s = this.clearColor && !r,
          a = this.motionBlur && !r,
          h = this.lastFrameAlpha,
          l = n.devicePixelRatio;
        if (
          (a &&
            (this.domBack || this.createBackBuffer(),
            (this.ctxBack.globalCompositeOperation = "copy"),
            this.ctxBack.drawImage(t, 0, 0, i / l, o / l)),
          e.clearRect(0, 0, i / l, o / l),
          s &&
            (e.save(),
            (e.fillStyle = this.clearColor),
            e.fillRect(0, 0, i / l, o / l),
            e.restore()),
          a)
        ) {
          var d = this.domBack;
          e.save(),
            (e.globalAlpha = h),
            e.drawImage(d, 0, 0, i / l, o / l),
            e.restore();
        }
      }),
      s.merge(a.prototype, o.prototype),
      a
    );
  }),
  define("zrender/shape/Text", [
    "require",
    "../tool/area",
    "./Base",
    "../tool/util",
  ], function (t) {
    var e = t("../tool/area"),
      i = t("./Base"),
      o = function (t) {
        i.call(this, t);
      };
    return (
      (o.prototype = {
        type: "text",
        brush: function (t, i) {
          var o = this.style;
          if (
            (i && (o = this.getHighlightStyle(o, this.highlightStyle || {})),
            "undefined" != typeof o.text && o.text !== !1)
          ) {
            t.save(),
              this.doClip(t),
              this.setContext(t, o),
              this.setTransform(t),
              o.textFont && (t.font = o.textFont),
              (t.textAlign = o.textAlign || "start"),
              (t.textBaseline = o.textBaseline || "middle");
            var s,
              r = (o.text + "").split("\n"),
              n = e.getTextHeight("国", o.textFont),
              a = this.getRect(o),
              h = o.x;
            s =
              "top" == o.textBaseline
                ? a.y
                : "bottom" == o.textBaseline
                ? a.y + n
                : a.y + n / 2;
            for (var l = 0, d = r.length; d > l; l++) {
              if (o.maxWidth)
                switch (o.brushType) {
                  case "fill":
                    t.fillText(r[l], h, s, o.maxWidth);
                    break;
                  case "stroke":
                    t.strokeText(r[l], h, s, o.maxWidth);
                    break;
                  case "both":
                    t.fillText(r[l], h, s, o.maxWidth),
                      t.strokeText(r[l], h, s, o.maxWidth);
                    break;
                  default:
                    t.fillText(r[l], h, s, o.maxWidth);
                }
              else
                switch (o.brushType) {
                  case "fill":
                    t.fillText(r[l], h, s);
                    break;
                  case "stroke":
                    t.strokeText(r[l], h, s);
                    break;
                  case "both":
                    t.fillText(r[l], h, s), t.strokeText(r[l], h, s);
                    break;
                  default:
                    t.fillText(r[l], h, s);
                }
              s += n;
            }
            t.restore();
          }
        },
        getRect: function (t) {
          if (t.__rect) return t.__rect;
          var i = e.getTextWidth(t.text, t.textFont),
            o = e.getTextHeight(t.text, t.textFont),
            s = t.x;
          "end" == t.textAlign || "right" == t.textAlign
            ? (s -= i)
            : "center" == t.textAlign && (s -= i / 2);
          var r;
          return (
            (r =
              "top" == t.textBaseline
                ? t.y
                : "bottom" == t.textBaseline
                ? t.y - o
                : t.y - o / 2),
            (t.__rect = { x: s, y: r, width: i, height: o }),
            t.__rect
          );
        },
      }),
      t("../tool/util").inherits(o, i),
      o
    );
  }),
  define("zrender/shape/Rectangle", [
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
        type: "rectangle",
        _buildRadiusPath: function (t, e) {
          var i,
            o,
            s,
            r,
            n = e.x,
            a = e.y,
            h = e.width,
            l = e.height,
            d = e.radius;
          "number" == typeof d
            ? (i = o = s = r = d)
            : d instanceof Array
            ? 1 === d.length
              ? (i = o = s = r = d[0])
              : 2 === d.length
              ? ((i = s = d[0]), (o = r = d[1]))
              : 3 === d.length
              ? ((i = d[0]), (o = r = d[1]), (s = d[2]))
              : ((i = d[0]), (o = d[1]), (s = d[2]), (r = d[3]))
            : (i = o = s = r = 0);
          var c;
          i + o > h && ((c = i + o), (i *= h / c), (o *= h / c)),
            s + r > h && ((c = s + r), (s *= h / c), (r *= h / c)),
            o + s > l && ((c = o + s), (o *= l / c), (s *= l / c)),
            i + r > l && ((c = i + r), (i *= l / c), (r *= l / c)),
            t.moveTo(n + i, a),
            t.lineTo(n + h - o, a),
            0 !== o && t.quadraticCurveTo(n + h, a, n + h, a + o),
            t.lineTo(n + h, a + l - s),
            0 !== s && t.quadraticCurveTo(n + h, a + l, n + h - s, a + l),
            t.lineTo(n + r, a + l),
            0 !== r && t.quadraticCurveTo(n, a + l, n, a + l - r),
            t.lineTo(n, a + i),
            0 !== i && t.quadraticCurveTo(n, a, n + i, a);
        },
        buildPath: function (t, e) {
          e.radius
            ? this._buildRadiusPath(t, e)
            : (t.moveTo(e.x, e.y),
              t.lineTo(e.x + e.width, e.y),
              t.lineTo(e.x + e.width, e.y + e.height),
              t.lineTo(e.x, e.y + e.height),
              t.lineTo(e.x, e.y)),
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
              x: Math.round(t.x - e / 2),
              y: Math.round(t.y - e / 2),
              width: t.width + e,
              height: t.height + e,
            }),
            t.__rect
          );
        },
      }),
      t("../tool/util").inherits(i, e),
      i
    );
  }),
  define("zrender/tool/area", ["require", "./util"], function (t) {
    "use strict";
    function e(t, e, s, r) {
      if (!e || !t) return !1;
      l = l || d.getContext();
      var n = i(t, e, s, r);
      return "undefined" != typeof n ? n : o(t, l, e, s, r);
    }
    function i(t, e, i, o) {
      var s = t.type;
      switch (s) {
        case "line":
          return r(e.xStart, e.yStart, e.xEnd, e.yEnd, e.lineWidth, i, o);
        case "text":
          var a = e.__rect || t.getRect(e);
          return n(a.x, a.y, a.width, a.height, i, o);
        case "rectangle":
        case "image":
          return n(e.x, e.y, e.width, e.height, i, o);
      }
    }
    function o(t, e, i, o, s) {
      return (
        e.beginPath(), t.buildPath(e, i), e.closePath(), e.isPointInPath(o, s)
      );
    }
    function s(t, i, o, s) {
      return !e(t, i, o, s);
    }
    function r(t, e, i, o, s, r, n) {
      if (0 === s) return !1;
      var a = Math.max(s, 5),
        h = 0,
        l = t;
      if (
        (n > e + a && n > o + a) ||
        (e - a > n && o - a > n) ||
        (r > t + a && r > i + a) ||
        (t - a > r && i - a > r)
      )
        return !1;
      if (t === i) return Math.abs(r - t) <= a / 2;
      (h = (e - o) / (t - i)), (l = (t * o - i * e) / (t - i));
      var d = h * r - n + l,
        c = (d * d) / (h * h + 1);
      return ((a / 2) * a) / 2 >= c;
    }
    function n(t, e, i, o, s, r) {
      return s >= t && t + i >= s && r >= e && e + o >= r;
    }
    function a(t, e) {
      var i = t + ":" + e;
      if (c[i]) return c[i];
      (l = l || d.getContext()),
        l.save(),
        e && (l.font = e),
        (t = (t + "").split("\n"));
      for (var o = 0, s = 0, r = t.length; r > s; s++)
        o = Math.max(l.measureText(t[s]).width, o);
      return l.restore(), (c[i] = o), ++u > f && ((u = 0), (c = {})), o;
    }
    function h(t, e) {
      var i = t + ":" + e;
      if (p[i]) return p[i];
      (l = l || d.getContext()),
        l.save(),
        e && (l.font = e),
        (t = (t + "").split("\n"));
      var o = (l.measureText("国").width + 2) * t.length;
      return l.restore(), (p[i] = o), ++g > f && ((g = 0), (p = {})), o;
    }
    var l,
      d = t("./util"),
      c = {},
      p = {},
      u = 0,
      g = 0,
      f = 5e3;
    return {
      isInside: e,
      isOutside: s,
      getTextWidth: a,
      getTextHeight: h,
      isInsideRect: n,
    };
  }),
  define("zrender/shape/Base", [
    "require",
    "../tool/matrix",
    "../tool/guid",
    "../tool/util",
    "../tool/log",
    "../mixin/Transformable",
    "../mixin/Eventful",
    "../tool/area",
    "../tool/color",
  ], function (t) {
    function e(e, o, s, r, n, a, h) {
      n && (e.font = n), (e.textAlign = a), (e.textBaseline = h);
      var l = i(o, s, r, n, a, h);
      o = (o + "").split("\n");
      var d = t("../tool/area").getTextHeight("国", n);
      switch (h) {
        case "top":
          r = l.y;
          break;
        case "bottom":
          r = l.y + d;
          break;
        default:
          r = l.y + d / 2;
      }
      for (var c = 0, p = o.length; p > c; c++)
        e.fillText(o[c], s, r), (r += d);
    }
    function i(e, i, o, s, r, n) {
      var a = t("../tool/area"),
        h = a.getTextWidth(e, s),
        l = a.getTextHeight("国", s);
      switch (((e = (e + "").split("\n")), r)) {
        case "end":
        case "right":
          i -= h;
          break;
        case "center":
          i -= h / 2;
      }
      switch (n) {
        case "top":
          break;
        case "bottom":
          o -= l * e.length;
          break;
        default:
          o -= (l * e.length) / 2;
      }
      return { x: i, y: o, width: h, height: l * e.length };
    }
    var o = window.G_vmlCanvasManager,
      s = t("../tool/matrix"),
      r = t("../tool/guid"),
      n = t("../tool/util"),
      a = t("../tool/log"),
      h = t("../mixin/Transformable"),
      l = t("../mixin/Eventful"),
      d = function (t) {
        (t = t || {}), (this.id = t.id || r());
        for (var e in t) this[e] = t[e];
        (this.style = this.style || {}),
          (this.highlightStyle = this.highlightStyle || null),
          (this.parent = null),
          (this.__dirty = !0),
          (this.__clipShapes = []),
          h.call(this),
          l.call(this);
      };
    (d.prototype.invisible = !1),
      (d.prototype.ignore = !1),
      (d.prototype.zlevel = 0),
      (d.prototype.draggable = !1),
      (d.prototype.clickable = !1),
      (d.prototype.hoverable = !0),
      (d.prototype.z = 0),
      (d.prototype.brush = function (t, e) {
        var i = this.beforeBrush(t, e);
        switch ((t.beginPath(), this.buildPath(t, i), i.brushType)) {
          case "both":
            t.fill();
          case "stroke":
            i.lineWidth > 0 && t.stroke();
            break;
          default:
            t.fill();
        }
        this.drawText(t, i, this.style), this.afterBrush(t);
      }),
      (d.prototype.beforeBrush = function (t, e) {
        var i = this.style;
        return (
          this.brushTypeOnly && (i.brushType = this.brushTypeOnly),
          e &&
            (i = this.getHighlightStyle(
              i,
              this.highlightStyle || {},
              this.brushTypeOnly
            )),
          "stroke" == this.brushTypeOnly &&
            (i.strokeColor = i.strokeColor || i.color),
          t.save(),
          this.doClip(t),
          this.setContext(t, i),
          this.setTransform(t),
          i
        );
      }),
      (d.prototype.afterBrush = function (t) {
        t.restore();
      });
    var c = [
      ["color", "fillStyle"],
      ["strokeColor", "strokeStyle"],
      ["opacity", "globalAlpha"],
      ["lineCap", "lineCap"],
      ["lineJoin", "lineJoin"],
      ["miterLimit", "miterLimit"],
      ["lineWidth", "lineWidth"],
      ["shadowBlur", "shadowBlur"],
      ["shadowColor", "shadowColor"],
      ["shadowOffsetX", "shadowOffsetX"],
      ["shadowOffsetY", "shadowOffsetY"],
    ];
    d.prototype.setContext = function (t, e) {
      for (var i = 0, o = c.length; o > i; i++) {
        var s = c[i][0],
          r = e[s],
          n = c[i][1];
        "undefined" != typeof r && (t[n] = r);
      }
    };
    var p = s.create();
    return (
      (d.prototype.doClip = function (t) {
        if (this.__clipShapes && !o)
          for (var e = 0; e < this.__clipShapes.length; e++) {
            var i = this.__clipShapes[e];
            if (i.needTransform) {
              var r = i.transform;
              s.invert(p, r), t.transform(r[0], r[1], r[2], r[3], r[4], r[5]);
            }
            if (
              (t.beginPath(),
              i.buildPath(t, i.style),
              t.clip(),
              i.needTransform)
            ) {
              var r = p;
              t.transform(r[0], r[1], r[2], r[3], r[4], r[5]);
            }
          }
      }),
      (d.prototype.getHighlightStyle = function (e, i, o) {
        var s = {};
        for (var r in e) s[r] = e[r];
        var n = t("../tool/color"),
          a = n.getHighlightColor();
        "stroke" != e.brushType
          ? ((s.strokeColor = a),
            (s.lineWidth = (e.lineWidth || 1) + this.getHighlightZoom()),
            (s.brushType = "both"))
          : "stroke" != o
          ? ((s.strokeColor = a),
            (s.lineWidth = (e.lineWidth || 1) + this.getHighlightZoom()))
          : (s.strokeColor = i.strokeColor || n.mix(e.strokeColor, n.toRGB(a)));
        for (var r in i) "undefined" != typeof i[r] && (s[r] = i[r]);
        return s;
      }),
      (d.prototype.getHighlightZoom = function () {
        return "text" != this.type ? 6 : 2;
      }),
      (d.prototype.drift = function (t, e) {
        (this.position[0] += t), (this.position[1] += e);
      }),
      (d.prototype.getTansform = (function () {
        var t = [];
        return function (e, i) {
          var o = [e, i];
          return (
            this.needTransform &&
              this.transform &&
              (s.invert(t, this.transform),
              s.mulVector(o, t, [e, i, 1]),
              e == o[0] && i == o[1] && this.updateNeedTransform()),
            o
          );
        };
      })()),
      (d.prototype.buildPath = function () {
        a("buildPath not implemented in " + this.type);
      }),
      (d.prototype.getRect = function () {
        a("getRect not implemented in " + this.type);
      }),
      (d.prototype.isCover = function (e, i) {
        var o = this.getTansform(e, i);
        (e = o[0]), (i = o[1]);
        var s = this.style.__rect;
        return (
          s || (s = this.style.__rect = this.getRect(this.style)),
          e >= s.x && e <= s.x + s.width && i >= s.y && i <= s.y + s.height
            ? t("../tool/area").isInside(this, this.style, e, i)
            : !1
        );
      }),
      (d.prototype.drawText = function (t, i, o) {
        if ("undefined" != typeof i.text && i.text !== !1) {
          var s = i.textColor || i.color || i.strokeColor;
          t.fillStyle = s;
          var r,
            n,
            a,
            h,
            l = 10,
            d = i.textPosition || this.textPosition || "top";
          switch (d) {
            case "inside":
            case "top":
            case "bottom":
            case "left":
            case "right":
              if (this.getRect) {
                var c = (o || i).__rect || this.getRect(o || i);
                switch (d) {
                  case "inside":
                    (a = c.x + c.width / 2),
                      (h = c.y + c.height / 2),
                      (r = "center"),
                      (n = "middle"),
                      "stroke" != i.brushType &&
                        s == i.color &&
                        (t.fillStyle = "#fff");
                    break;
                  case "left":
                    (a = c.x - l),
                      (h = c.y + c.height / 2),
                      (r = "end"),
                      (n = "middle");
                    break;
                  case "right":
                    (a = c.x + c.width + l),
                      (h = c.y + c.height / 2),
                      (r = "start"),
                      (n = "middle");
                    break;
                  case "top":
                    (a = c.x + c.width / 2),
                      (h = c.y - l),
                      (r = "center"),
                      (n = "bottom");
                    break;
                  case "bottom":
                    (a = c.x + c.width / 2),
                      (h = c.y + c.height + l),
                      (r = "center"),
                      (n = "top");
                }
              }
              break;
            case "start":
            case "end":
              var p = i.pointList || [
                  [i.xStart || 0, i.yStart || 0],
                  [i.xEnd || 0, i.yEnd || 0],
                ],
                u = p.length;
              if (2 > u) return;
              var g, f, m, y;
              switch (d) {
                case "start":
                  (g = p[1][0]), (f = p[0][0]), (m = p[1][1]), (y = p[0][1]);
                  break;
                case "end":
                  (g = p[u - 2][0]),
                    (f = p[u - 1][0]),
                    (m = p[u - 2][1]),
                    (y = p[u - 1][1]);
              }
              (a = f), (h = y);
              var _ = (Math.atan((m - y) / (f - g)) / Math.PI) * 180;
              0 > f - g ? (_ += 180) : 0 > m - y && (_ += 360),
                (l = 5),
                _ >= 30 && 150 >= _
                  ? ((r = "center"), (n = "bottom"), (h -= l))
                  : _ > 150 && 210 > _
                  ? ((r = "right"), (n = "middle"), (a -= l))
                  : _ >= 210 && 330 >= _
                  ? ((r = "center"), (n = "top"), (h += l))
                  : ((r = "left"), (n = "middle"), (a += l));
              break;
            case "specific":
              (a = i.textX || 0),
                (h = i.textY || 0),
                (r = "start"),
                (n = "middle");
          }
          null != a &&
            null != h &&
            e(
              t,
              i.text,
              a,
              h,
              i.textFont,
              i.textAlign || r,
              i.textBaseline || n
            );
        }
      }),
      (d.prototype.modSelf = function () {
        (this.__dirty = !0),
          this.style && (this.style.__rect = null),
          this.highlightStyle && (this.highlightStyle.__rect = null);
      }),
      (d.prototype.isSilent = function () {
        return !(
          this.hoverable ||
          this.draggable ||
          this.clickable ||
          this.onmousemove ||
          this.onmouseover ||
          this.onmouseout ||
          this.onmousedown ||
          this.onmouseup ||
          this.onclick ||
          this.ondragenter ||
          this.ondragover ||
          this.ondragleave ||
          this.ondrop
        );
      }),
      n.merge(d.prototype, h.prototype, !0),
      n.merge(d.prototype, l.prototype, !0),
      d
    );
  }),
  define("zrender/mixin/Transformable", [
    "require",
    "../tool/matrix",
    "../tool/vector",
  ], function (t) {
    "use strict";
    function e(t) {
      return t > -n && n > t;
    }
    function i(t) {
      return t > n || -n > t;
    }
    var o = t("../tool/matrix"),
      s = t("../tool/vector"),
      r = [0, 0],
      n = 5e-5,
      a = function () {
        this.position || (this.position = [0, 0]),
          "undefined" == typeof this.rotation && (this.rotation = [0, 0, 0]),
          this.scale || (this.scale = [1, 1, 0, 0]),
          (this.needLocalTransform = !1),
          (this.needTransform = !1);
      };
    return (
      (a.prototype = {
        constructor: a,
        updateNeedTransform: function () {
          this.needLocalTransform =
            i(this.rotation[0]) ||
            i(this.position[0]) ||
            i(this.position[1]) ||
            i(this.scale[0] - 1) ||
            i(this.scale[1] - 1);
        },
        updateTransform: function () {
          if (
            (this.updateNeedTransform(),
            (this.needTransform = this.parent
              ? this.needLocalTransform || this.parent.needTransform
              : this.needLocalTransform),
            this.needTransform)
          ) {
            var t = this.transform || o.create();
            if ((o.identity(t), this.needLocalTransform)) {
              if (i(this.scale[0]) || i(this.scale[1])) {
                (r[0] = -this.scale[2] || 0), (r[1] = -this.scale[3] || 0);
                var e = i(r[0]) || i(r[1]);
                e && o.translate(t, t, r),
                  o.scale(t, t, this.scale),
                  e && ((r[0] = -r[0]), (r[1] = -r[1]), o.translate(t, t, r));
              }
              if (this.rotation instanceof Array) {
                if (0 !== this.rotation[0]) {
                  (r[0] = -this.rotation[1] || 0),
                    (r[1] = -this.rotation[2] || 0);
                  var e = i(r[0]) || i(r[1]);
                  e && o.translate(t, t, r),
                    o.rotate(t, t, this.rotation[0]),
                    e && ((r[0] = -r[0]), (r[1] = -r[1]), o.translate(t, t, r));
                }
              } else 0 !== this.rotation && o.rotate(t, t, this.rotation);
              (i(this.position[0]) || i(this.position[1])) &&
                o.translate(t, t, this.position);
            }
            (this.transform = t),
              this.parent &&
                this.parent.needTransform &&
                (this.needLocalTransform
                  ? o.mul(this.transform, this.parent.transform, this.transform)
                  : o.copy(this.transform, this.parent.transform));
          }
        },
        setTransform: function (t) {
          if (this.needTransform) {
            var e = this.transform;
            t.transform(e[0], e[1], e[2], e[3], e[4], e[5]);
          }
        },
        lookAt: (function () {
          var t = s.create();
          return function (i) {
            this.transform || (this.transform = o.create());
            var r = this.transform;
            s.sub(t, i, this.position),
              (e(t[0]) && e(t[1])) ||
                (s.normalize(t, t),
                (r[2] = t[0] * this.scale[1]),
                (r[3] = t[1] * this.scale[1]),
                (r[0] = t[1] * this.scale[0]),
                (r[1] = -t[0] * this.scale[0]),
                (r[4] = this.position[0]),
                (r[5] = this.position[1]),
                this.decomposeTransform());
          };
        })(),
        decomposeTransform: function () {
          if (this.transform) {
            var t = this.transform,
              e = t[0] * t[0] + t[1] * t[1],
              o = this.position,
              s = this.scale,
              r = this.rotation;
            i(e - 1) && (e = Math.sqrt(e));
            var n = t[2] * t[2] + t[3] * t[3];
            i(n - 1) && (n = Math.sqrt(n)),
              (o[0] = t[4]),
              (o[1] = t[5]),
              (s[0] = e),
              (s[1] = n),
              (s[2] = s[3] = 0),
              (r[0] = Math.atan2(-t[1] / n, t[0] / e)),
              (r[1] = r[2] = 0);
          }
        },
      }),
      a
    );
  }),
  define("zrender/Group", [
    "require",
    "./tool/guid",
    "./tool/util",
    "./mixin/Transformable",
    "./mixin/Eventful",
  ], function (t) {
    var e = t("./tool/guid"),
      i = t("./tool/util"),
      o = t("./mixin/Transformable"),
      s = t("./mixin/Eventful"),
      r = function (t) {
        (t = t || {}), (this.id = t.id || e());
        for (var i in t) this[i] = t[i];
        (this.type = "group"),
          (this.clipShape = null),
          (this._children = []),
          (this._storage = null),
          (this.__dirty = !0),
          o.call(this),
          s.call(this);
      };
    return (
      (r.prototype.ignore = !1),
      (r.prototype.children = function () {
        return this._children.slice();
      }),
      (r.prototype.childAt = function (t) {
        return this._children[t];
      }),
      (r.prototype.addChild = function (t) {
        t != this &&
          t.parent != this &&
          (t.parent && t.parent.removeChild(t),
          this._children.push(t),
          (t.parent = this),
          this._storage &&
            this._storage !== t._storage &&
            (this._storage.addToMap(t),
            t instanceof r && t.addChildrenToStorage(this._storage)));
      }),
      (r.prototype.removeChild = function (t) {
        var e = i.indexOf(this._children, t);
        this._children.splice(e, 1),
          (t.parent = null),
          this._storage &&
            (this._storage.delFromMap(t.id),
            t instanceof r && t.delChildrenFromStorage(this._storage));
      }),
      (r.prototype.clearChildren = function () {
        for (var t = 0; t < this._children.length; t++) {
          var e = this._children[t];
          this._storage &&
            (this._storage.delFromMap(e.id),
            e instanceof r && e.delChildrenFromStorage(this._storage));
        }
        this._children.length = 0;
      }),
      (r.prototype.eachChild = function (t, e) {
        for (var i = !!e, o = 0; o < this._children.length; o++) {
          var s = this._children[o];
          i ? t.call(e, s) : t(s);
        }
      }),
      (r.prototype.traverse = function (t, e) {
        for (var i = !!e, o = 0; o < this._children.length; o++) {
          var s = this._children[o];
          i ? t.call(e, s) : t(s), "group" === s.type && s.traverse(t, e);
        }
      }),
      (r.prototype.addChildrenToStorage = function (t) {
        for (var e = 0; e < this._children.length; e++) {
          var i = this._children[e];
          t.addToMap(i), i instanceof r && i.addChildrenToStorage(t);
        }
      }),
      (r.prototype.delChildrenFromStorage = function (t) {
        for (var e = 0; e < this._children.length; e++) {
          var i = this._children[e];
          t.delFromMap(i.id), i instanceof r && i.delChildrenFromStorage(t);
        }
      }),
      (r.prototype.modSelf = function () {
        this.__dirty = !0;
      }),
      i.merge(r.prototype, o.prototype, !0),
      i.merge(r.prototype, s.prototype, !0),
      r
    );
  }),
  define("zrender/animation/Clip", ["require", "./easing"], function (t) {
    function e(t) {
      (this._targetPool = t.target || {}),
        this._targetPool instanceof Array ||
          (this._targetPool = [this._targetPool]),
        (this._life = t.life || 1e3),
        (this._delay = t.delay || 0),
        (this._startTime = new Date().getTime() + this._delay),
        (this._endTime = this._startTime + 1e3 * this._life),
        (this.loop = "undefined" == typeof t.loop ? !1 : t.loop),
        (this.gap = t.gap || 0),
        (this.easing = t.easing || "Linear"),
        (this.onframe = t.onframe),
        (this.ondestroy = t.ondestroy),
        (this.onrestart = t.onrestart);
    }
    var i = t("./easing");
    return (
      (e.prototype = {
        step: function (t) {
          var e = (t - this._startTime) / this._life;
          if (!(0 > e)) {
            e = Math.min(e, 1);
            var o =
                "string" == typeof this.easing ? i[this.easing] : this.easing,
              s = "function" == typeof o ? o(e) : e;
            return (
              this.fire("frame", s),
              1 == e
                ? this.loop
                  ? (this.restart(), "restart")
                  : ((this._needsRemove = !0), "destroy")
                : null
            );
          }
        },
        restart: function () {
          var t = new Date().getTime(),
            e = (t - this._startTime) % this._life;
          (this._startTime = new Date().getTime() - e + this.gap),
            (this._needsRemove = !1);
        },
        fire: function (t, e) {
          for (var i = 0, o = this._targetPool.length; o > i; i++)
            this["on" + t] && this["on" + t](this._targetPool[i], e);
        },
        constructor: e,
      }),
      e
    );
  }),
  define("zrender/animation/easing", [], function () {
    var t = {
      Linear: function (t) {
        return t;
      },
      QuadraticIn: function (t) {
        return t * t;
      },
      QuadraticOut: function (t) {
        return t * (2 - t);
      },
      QuadraticInOut: function (t) {
        return (t *= 2) < 1 ? 0.5 * t * t : -0.5 * (--t * (t - 2) - 1);
      },
      CubicIn: function (t) {
        return t * t * t;
      },
      CubicOut: function (t) {
        return --t * t * t + 1;
      },
      CubicInOut: function (t) {
        return (t *= 2) < 1 ? 0.5 * t * t * t : 0.5 * ((t -= 2) * t * t + 2);
      },
      QuarticIn: function (t) {
        return t * t * t * t;
      },
      QuarticOut: function (t) {
        return 1 - --t * t * t * t;
      },
      QuarticInOut: function (t) {
        return (t *= 2) < 1
          ? 0.5 * t * t * t * t
          : -0.5 * ((t -= 2) * t * t * t - 2);
      },
      QuinticIn: function (t) {
        return t * t * t * t * t;
      },
      QuinticOut: function (t) {
        return --t * t * t * t * t + 1;
      },
      QuinticInOut: function (t) {
        return (t *= 2) < 1
          ? 0.5 * t * t * t * t * t
          : 0.5 * ((t -= 2) * t * t * t * t + 2);
      },
      SinusoidalIn: function (t) {
        return 1 - Math.cos((t * Math.PI) / 2);
      },
      SinusoidalOut: function (t) {
        return Math.sin((t * Math.PI) / 2);
      },
      SinusoidalInOut: function (t) {
        return 0.5 * (1 - Math.cos(Math.PI * t));
      },
      ExponentialIn: function (t) {
        return 0 === t ? 0 : Math.pow(1024, t - 1);
      },
      ExponentialOut: function (t) {
        return 1 === t ? 1 : 1 - Math.pow(2, -10 * t);
      },
      ExponentialInOut: function (t) {
        return 0 === t
          ? 0
          : 1 === t
          ? 1
          : (t *= 2) < 1
          ? 0.5 * Math.pow(1024, t - 1)
          : 0.5 * (-Math.pow(2, -10 * (t - 1)) + 2);
      },
      CircularIn: function (t) {
        return 1 - Math.sqrt(1 - t * t);
      },
      CircularOut: function (t) {
        return Math.sqrt(1 - --t * t);
      },
      CircularInOut: function (t) {
        return (t *= 2) < 1
          ? -0.5 * (Math.sqrt(1 - t * t) - 1)
          : 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
      },
      ElasticIn: function (t) {
        var e,
          i = 0.1,
          o = 0.4;
        return 0 === t
          ? 0
          : 1 === t
          ? 1
          : (!i || 1 > i
              ? ((i = 1), (e = o / 4))
              : (e = (o * Math.asin(1 / i)) / (2 * Math.PI)),
            -(
              i *
              Math.pow(2, 10 * (t -= 1)) *
              Math.sin((2 * (t - e) * Math.PI) / o)
            ));
      },
      ElasticOut: function (t) {
        var e,
          i = 0.1,
          o = 0.4;
        return 0 === t
          ? 0
          : 1 === t
          ? 1
          : (!i || 1 > i
              ? ((i = 1), (e = o / 4))
              : (e = (o * Math.asin(1 / i)) / (2 * Math.PI)),
            i * Math.pow(2, -10 * t) * Math.sin((2 * (t - e) * Math.PI) / o) +
              1);
      },
      ElasticInOut: function (t) {
        var e,
          i = 0.1,
          o = 0.4;
        return 0 === t
          ? 0
          : 1 === t
          ? 1
          : (!i || 1 > i
              ? ((i = 1), (e = o / 4))
              : (e = (o * Math.asin(1 / i)) / (2 * Math.PI)),
            (t *= 2) < 1
              ? -0.5 *
                i *
                Math.pow(2, 10 * (t -= 1)) *
                Math.sin((2 * (t - e) * Math.PI) / o)
              : i *
                  Math.pow(2, -10 * (t -= 1)) *
                  Math.sin((2 * (t - e) * Math.PI) / o) *
                  0.5 +
                1);
      },
      BackIn: function (t) {
        var e = 1.70158;
        return t * t * ((e + 1) * t - e);
      },
      BackOut: function (t) {
        var e = 1.70158;
        return --t * t * ((e + 1) * t + e) + 1;
      },
      BackInOut: function (t) {
        var e = 2.5949095;
        return (t *= 2) < 1
          ? 0.5 * t * t * ((e + 1) * t - e)
          : 0.5 * ((t -= 2) * t * ((e + 1) * t + e) + 2);
      },
      BounceIn: function (e) {
        return 1 - t.BounceOut(1 - e);
      },
      BounceOut: function (t) {
        return 1 / 2.75 > t
          ? 7.5625 * t * t
          : 2 / 2.75 > t
          ? 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
          : 2.5 / 2.75 > t
          ? 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
          : 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      },
      BounceInOut: function (e) {
        return 0.5 > e
          ? 0.5 * t.BounceIn(2 * e)
          : 0.5 * t.BounceOut(2 * e - 1) + 0.5;
      },
    };
    return t;
  }),
  define("echarts/chart/base", [
    "require",
    "zrender/shape/Image",
    "../util/shape/Icon",
    "../util/shape/MarkLine",
    "../util/shape/Symbol",
    "../config",
    "../util/ecData",
    "../util/ecAnimation",
    "../util/ecEffect",
    "../util/accMath",
    "../component/base",
    "zrender/tool/util",
    "zrender/tool/area",
  ], function (t) {
    function e(t, e, i, o, s) {
      c.call(this, t, e, i, o, s);
      var r = this;
      (this.selectedMap = {}),
        (this.lastShapeList = []),
        (this.shapeHandler = {
          onclick: function () {
            r.isClick = !0;
          },
          ondragover: function (t) {
            var e = t.target;
            e.highlightStyle = e.highlightStyle || {};
            var i = e.highlightStyle,
              o = i.brushTyep,
              s = i.strokeColor,
              a = i.lineWidth;
            (i.brushType = "stroke"),
              (i.strokeColor = r.ecTheme.calculableColor || n.calculableColor),
              (i.lineWidth = "icon" === e.type ? 30 : 10),
              r.zr.addHoverShape(e),
              setTimeout(function () {
                i &&
                  ((i.brushType = o), (i.strokeColor = s), (i.lineWidth = a));
              }, 20);
          },
          ondrop: function (t) {
            null != a.get(t.dragged, "data") && (r.isDrop = !0);
          },
          ondragend: function () {
            r.isDragend = !0;
          },
        });
    }
    var i = t("zrender/shape/Image"),
      o = t("../util/shape/Icon"),
      s = t("../util/shape/MarkLine"),
      r = t("../util/shape/Symbol"),
      n = t("../config"),
      a = t("../util/ecData"),
      h = t("../util/ecAnimation"),
      l = t("../util/ecEffect"),
      d = t("../util/accMath"),
      c = t("../component/base"),
      p = t("zrender/tool/util"),
      u = t("zrender/tool/area");
    return (
      (e.prototype = {
        setCalculable: function (t) {
          return (
            (t.dragEnableTime =
              this.ecTheme.DRAG_ENABLE_TIME || n.DRAG_ENABLE_TIME),
            (t.ondragover = this.shapeHandler.ondragover),
            (t.ondragend = this.shapeHandler.ondragend),
            (t.ondrop = this.shapeHandler.ondrop),
            t
          );
        },
        ondrop: function (t, e) {
          if (this.isDrop && t.target && !e.dragIn) {
            var i,
              o = t.target,
              s = t.dragged,
              r = a.get(o, "seriesIndex"),
              h = a.get(o, "dataIndex"),
              l = this.series,
              c = this.component.legend;
            if (-1 === h) {
              if (a.get(s, "seriesIndex") == r)
                return (
                  (e.dragOut = e.dragIn = e.needRefresh = !0),
                  void (this.isDrop = !1)
                );
              (i = { value: a.get(s, "value"), name: a.get(s, "name") }),
                this.type === n.CHART_TYPE_PIE && i.value < 0 && (i.value = 0);
              for (var p = !1, u = l[r].data, g = 0, f = u.length; f > g; g++)
                u[g].name === i.name &&
                  "-" === u[g].value &&
                  ((l[r].data[g].value = i.value), (p = !0));
              !p && l[r].data.push(i),
                c && c.add(i.name, s.style.color || s.style.strokeColor);
            } else
              (i = l[r].data[h] || "-"),
                null != i.value
                  ? ((l[r].data[h].value =
                      "-" != i.value
                        ? d.accAdd(l[r].data[h].value, a.get(s, "value"))
                        : a.get(s, "value")),
                    (this.type === n.CHART_TYPE_FUNNEL ||
                      this.type === n.CHART_TYPE_PIE) &&
                      (c &&
                        1 === c.getRelatedAmount(i.name) &&
                        this.component.legend.del(i.name),
                      (i.name += this.option.nameConnector + a.get(s, "name")),
                      c && c.add(i.name, s.style.color || s.style.strokeColor)))
                  : (l[r].data[h] =
                      "-" != i
                        ? d.accAdd(l[r].data[h], a.get(s, "value"))
                        : a.get(s, "value"));
            (e.dragIn = e.dragIn || !0), (this.isDrop = !1);
            var m = this;
            setTimeout(function () {
              m.zr.trigger("mousemove", t.event);
            }, 300);
          }
        },
        ondragend: function (t, e) {
          if (this.isDragend && t.target && !e.dragOut) {
            var i = t.target,
              o = a.get(i, "seriesIndex"),
              s = a.get(i, "dataIndex"),
              r = this.series;
            if (null != r[o].data[s].value) {
              r[o].data[s].value = "-";
              var n = r[o].data[s].name,
                h = this.component.legend;
              h && 0 === h.getRelatedAmount(n) && h.del(n);
            } else r[o].data[s] = "-";
            (e.dragOut = !0), (e.needRefresh = !0), (this.isDragend = !1);
          }
        },
        onlegendSelected: function (t, e) {
          var i = t.selected;
          for (var o in this.selectedMap)
            this.selectedMap[o] != i[o] && (e.needRefresh = !0),
              (this.selectedMap[o] = i[o]);
        },
        _buildPosition: function () {
          (this._symbol = this.option.symbolList),
            (this._sIndex2ShapeMap = {}),
            (this._sIndex2ColorMap = {}),
            (this.selectedMap = {}),
            (this.xMarkMap = {});
          for (
            var t,
              e,
              i,
              o,
              s = this.series,
              r = { top: [], bottom: [], left: [], right: [], other: [] },
              a = 0,
              h = s.length;
            h > a;
            a++
          )
            s[a].type === this.type &&
              ((s[a] = this.reformOption(s[a])),
              (this.legendHoverLink =
                s[a].legendHoverLink || this.legendHoverLink),
              (t = s[a].xAxisIndex),
              (e = s[a].yAxisIndex),
              (i = this.component.xAxis.getAxis(t)),
              (o = this.component.yAxis.getAxis(e)),
              i.type === n.COMPONENT_TYPE_AXIS_CATEGORY
                ? r[i.getPosition()].push(a)
                : o.type === n.COMPONENT_TYPE_AXIS_CATEGORY
                ? r[o.getPosition()].push(a)
                : r.other.push(a));
          for (var l in r)
            r[l].length > 0 && this._buildSinglePosition(l, r[l]);
          this.addShapeList();
        },
        _buildSinglePosition: function (t, e) {
          var i = this._mapData(e),
            o = i.locationMap,
            s = i.maxDataLength;
          if (0 !== s && 0 !== o.length) {
            switch (t) {
              case "bottom":
              case "top":
                this._buildHorizontal(e, s, o, this.xMarkMap);
                break;
              case "left":
              case "right":
                this._buildVertical(e, s, o, this.xMarkMap);
                break;
              case "other":
                this._buildOther(e, s, o, this.xMarkMap);
            }
            for (var r = 0, n = e.length; n > r; r++) this.buildMark(e[r]);
          }
        },
        _mapData: function (t) {
          for (
            var e,
              i,
              o,
              s,
              r = this.series,
              a = 0,
              h = {},
              l = "__kener__stack__",
              d = this.component.legend,
              c = [],
              p = 0,
              u = 0,
              g = t.length;
            g > u;
            u++
          ) {
            if (
              ((e = r[t[u]]),
              (o = e.name),
              (this._sIndex2ShapeMap[t[u]] =
                this._sIndex2ShapeMap[t[u]] ||
                this.query(e, "symbol") ||
                this._symbol[u % this._symbol.length]),
              d)
            ) {
              if (
                ((this.selectedMap[o] = d.isSelected(o)),
                (this._sIndex2ColorMap[t[u]] = d.getColor(o)),
                (s = d.getItemShape(o)))
              ) {
                var f = s.style;
                if (this.type == n.CHART_TYPE_LINE)
                  (f.iconType = "legendLineIcon"),
                    (f.symbol = this._sIndex2ShapeMap[t[u]]);
                else if (e.itemStyle.normal.barBorderWidth > 0) {
                  var m = s.highlightStyle;
                  (f.brushType = "both"),
                    (f.x += 1),
                    (f.y += 1),
                    (f.width -= 2),
                    (f.height -= 2),
                    (f.strokeColor = m.strokeColor =
                      e.itemStyle.normal.barBorderColor),
                    (m.lineWidth = 3);
                }
                d.setItemShape(o, s);
              }
            } else
              (this.selectedMap[o] = !0),
                (this._sIndex2ColorMap[t[u]] = this.zr.getColor(t[u]));
            this.selectedMap[o] &&
              ((i = e.stack || l + t[u]),
              null == h[i]
                ? ((h[i] = a), (c[a] = [t[u]]), a++)
                : c[h[i]].push(t[u])),
              (p = Math.max(p, e.data.length));
          }
          return { locationMap: c, maxDataLength: p };
        },
        _calculMarkMapXY: function (t, e, i) {
          for (var o = this.series, s = 0, r = e.length; r > s; s++)
            for (var n = 0, a = e[s].length; a > n; n++) {
              var h = e[s][n],
                l = "xy" == i ? 0 : "",
                d = this.component.grid,
                c = t[h];
              if ("-1" != i.indexOf("x")) {
                c["counter" + l] > 0 &&
                  (c["average" + l] = c["sum" + l] / c["counter" + l]);
                var p = this.component.xAxis
                  .getAxis(o[h].xAxisIndex || 0)
                  .getCoord(c["average" + l]);
                (c["averageLine" + l] = [
                  [p, d.getYend()],
                  [p, d.getY()],
                ]),
                  (c["minLine" + l] = [
                    [c["minX" + l], d.getYend()],
                    [c["minX" + l], d.getY()],
                  ]),
                  (c["maxLine" + l] = [
                    [c["maxX" + l], d.getYend()],
                    [c["maxX" + l], d.getY()],
                  ]),
                  (c.isHorizontal = !1);
              }
              if (((l = "xy" == i ? 1 : ""), "-1" != i.indexOf("y"))) {
                c["counter" + l] > 0 &&
                  (c["average" + l] = c["sum" + l] / c["counter" + l]);
                var u = this.component.yAxis
                  .getAxis(o[h].yAxisIndex || 0)
                  .getCoord(c["average" + l]);
                (c["averageLine" + l] = [
                  [d.getX(), u],
                  [d.getXend(), u],
                ]),
                  (c["minLine" + l] = [
                    [d.getX(), c["minY" + l]],
                    [d.getXend(), c["minY" + l]],
                  ]),
                  (c["maxLine" + l] = [
                    [d.getX(), c["maxY" + l]],
                    [d.getXend(), c["maxY" + l]],
                  ]),
                  (c.isHorizontal = !0);
              }
            }
        },
        addLabel: function (t, e, i, o, s) {
          var r = [i, e],
            n = this.deepMerge(r, "itemStyle.normal.label"),
            a = this.deepMerge(r, "itemStyle.emphasis.label"),
            h = n.textStyle || {},
            l = a.textStyle || {};
          if (n.show) {
            var d = t.style;
            (d.text = this._getLabelText(e, i, o, "normal")),
              (d.textPosition =
                null == n.position
                  ? "horizontal" === s
                    ? "right"
                    : "top"
                  : n.position),
              (d.textColor = h.color),
              (d.textFont = this.getFont(h)),
              (d.textAlign = h.align),
              (d.textBaseline = h.baseline);
          }
          if (a.show) {
            var c = t.highlightStyle;
            (c.text = this._getLabelText(e, i, o, "emphasis")),
              (c.textPosition = n.show
                ? t.style.textPosition
                : null == a.position
                ? "horizontal" === s
                  ? "right"
                  : "top"
                : a.position),
              (c.textColor = l.color),
              (c.textFont = this.getFont(l)),
              (c.textAlign = l.align),
              (c.textBaseline = l.baseline);
          }
          return t;
        },
        _getLabelText: function (t, e, i, o) {
          var s = this.deepQuery([e, t], "itemStyle." + o + ".label.formatter");
          s ||
            "emphasis" !== o ||
            (s = this.deepQuery([e, t], "itemStyle.normal.label.formatter"));
          var r = this.getDataFromOption(e, "-");
          return s
            ? "function" == typeof s
              ? s.call(this.myChart, {
                  seriesName: t.name,
                  series: t,
                  name: i,
                  value: r,
                  data: e,
                  status: o,
                })
              : "string" == typeof s
              ? (s = s
                  .replace("{a}", "{a0}")
                  .replace("{b}", "{b0}")
                  .replace("{c}", "{c0}")
                  .replace("{a0}", t.name)
                  .replace("{b0}", i)
                  .replace("{c0}", this.numAddCommas(r)))
              : void 0
            : r instanceof Array
            ? null != r[2]
              ? this.numAddCommas(r[2])
              : r[0] + " , " + r[1]
            : this.numAddCommas(r);
        },
        buildMark: function (t) {
          var e = this.series[t];
          this.selectedMap[e.name] &&
            (e.markLine && this._buildMarkLine(t),
            e.markPoint && this._buildMarkPoint(t));
        },
        _buildMarkPoint: function (t) {
          for (
            var e,
              i,
              o = (this.markAttachStyle || {})[t],
              s = this.series[t],
              r = p.clone(s.markPoint),
              a = 0,
              h = r.data.length;
            h > a;
            a++
          )
            (e = r.data[a]),
              (i = this.getMarkCoord(t, e)),
              (e.x = null != e.x ? e.x : i[0]),
              (e.y = null != e.y ? e.y : i[1]),
              !e.type ||
                ("max" !== e.type && "min" !== e.type) ||
                ((e.value = i[3]),
                (e.name = e.name || e.type),
                (e.symbolSize =
                  e.symbolSize ||
                  u.getTextWidth(i[3], this.getFont()) / 2 + 5));
          for (var l = this._markPoint(t, r), a = 0, h = l.length; h > a; a++) {
            var d = l[a];
            (d.zlevel = this.getZlevelBase()), (d.z = this.getZBase() + 1);
            for (var c in o) d[c] = p.clone(o[c]);
            this.shapeList.push(d);
          }
          if (
            this.type === n.CHART_TYPE_FORCE ||
            this.type === n.CHART_TYPE_CHORD
          )
            for (var a = 0, h = l.length; h > a; a++) this.zr.addShape(l[a]);
        },
        _buildMarkLine: function (t) {
          for (
            var e,
              i = (this.markAttachStyle || {})[t],
              o = this.series[t],
              s = p.clone(o.markLine),
              r = 0,
              a = s.data.length;
            a > r;
            r++
          ) {
            var h = s.data[r];
            !h.type ||
            ("max" !== h.type && "min" !== h.type && "average" !== h.type)
              ? (e = [this.getMarkCoord(t, h[0]), this.getMarkCoord(t, h[1])])
              : ((e = this.getMarkCoord(t, h)),
                (s.data[r] = [p.clone(h), {}]),
                (s.data[r][0].name = h.name || h.type),
                (s.data[r][0].value =
                  "average" !== h.type
                    ? e[3]
                    : +e[3].toFixed(
                        null != s.precision
                          ? s.precision
                          : this.deepQuery(
                              [this.ecTheme, n],
                              "markLine.precision"
                            )
                      )),
                (e = e[2]),
                (h = [{}, {}])),
              null != e &&
                null != e[0] &&
                null != e[1] &&
                ((s.data[r][0].x = null != h[0].x ? h[0].x : e[0][0]),
                (s.data[r][0].y = null != h[0].y ? h[0].y : e[0][1]),
                (s.data[r][1].x = null != h[1].x ? h[1].x : e[1][0]),
                (s.data[r][1].y = null != h[1].y ? h[1].y : e[1][1]));
          }
          for (var l = this._markLine(t, s), r = 0, a = l.length; a > r; r++) {
            var d = l[r];
            (d.zlevel = this.getZlevelBase()), (d.z = this.getZBase() + 1);
            for (var c in i) d[c] = p.clone(i[c]);
            this.shapeList.push(d);
          }
          if (
            this.type === n.CHART_TYPE_FORCE ||
            this.type === n.CHART_TYPE_CHORD
          )
            for (var r = 0, a = l.length; a > r; r++) this.zr.addShape(l[r]);
        },
        _markPoint: function (t, e) {
          var i = this.series[t],
            o = this.component;
          p.merge(
            p.merge(e, p.clone(this.ecTheme.markPoint || {})),
            p.clone(n.markPoint)
          ),
            (e.name = i.name);
          var s,
            r,
            h,
            l,
            d,
            c,
            u,
            g = [],
            f = e.data,
            m = o.dataRange,
            y = o.legend,
            _ = this.zr.getWidth(),
            v = this.zr.getHeight();
          if (e.large)
            (s = this.getLargeMarkPoingShape(t, e)),
              (s._mark = "largePoint"),
              s && g.push(s);
          else
            for (var x = 0, b = f.length; b > x; x++)
              null != f[x].x &&
                null != f[x].y &&
                ((h = null != f[x].value ? f[x].value : ""),
                y && (r = y.getColor(i.name)),
                (m &&
                  ((r = isNaN(h) ? r : m.getColor(h)),
                  (l = [f[x], e]),
                  (d = this.deepQuery(l, "itemStyle.normal.color") || r),
                  (c = this.deepQuery(l, "itemStyle.emphasis.color") || d),
                  null == d && null == c)) ||
                  ((r = null == r ? this.zr.getColor(t) : r),
                  (f[x].tooltip = f[x].tooltip ||
                    e.tooltip || { trigger: "item" }),
                  (f[x].name = null != f[x].name ? f[x].name : ""),
                  (f[x].value = h),
                  (s = this.getSymbolShape(
                    e,
                    t,
                    f[x],
                    x,
                    f[x].name,
                    this.parsePercent(f[x].x, _),
                    this.parsePercent(f[x].y, v),
                    "pin",
                    r,
                    "rgba(0,0,0,0)",
                    "horizontal"
                  )),
                  (s._mark = "point"),
                  (u = this.deepMerge([f[x], e], "effect")),
                  u.show && (s.effect = u),
                  i.type === n.CHART_TYPE_MAP &&
                    (s._geo = this.getMarkGeo(f[x])),
                  a.pack(s, i, t, f[x], x, f[x].name, h),
                  g.push(s)));
          return g;
        },
        _markLine: function (t, e) {
          var i = this.series[t],
            o = this.component;
          p.merge(
            p.merge(e, p.clone(this.ecTheme.markLine || {})),
            p.clone(n.markLine)
          ),
            (e.symbol =
              e.symbol instanceof Array
                ? e.symbol.length > 1
                  ? e.symbol
                  : [e.symbol[0], e.symbol[0]]
                : [e.symbol, e.symbol]),
            (e.symbolSize =
              e.symbolSize instanceof Array
                ? e.symbolSize.length > 1
                  ? e.symbolSize
                  : [e.symbolSize[0], e.symbolSize[0]]
                : [e.symbolSize, e.symbolSize]),
            (e.symbolRotate =
              e.symbolRotate instanceof Array
                ? e.symbolRotate.length > 1
                  ? e.symbolRotate
                  : [e.symbolRotate[0], e.symbolRotate[0]]
                : [e.symbolRotate, e.symbolRotate]),
            (e.name = i.name);
          for (
            var s,
              r,
              h,
              l,
              d,
              c,
              u,
              g,
              f = [],
              m = e.data,
              y = o.dataRange,
              _ = o.legend,
              v = this.zr.getWidth(),
              x = this.zr.getHeight(),
              b = 0,
              T = m.length;
            T > b;
            b++
          ) {
            var S = m[b];
            null != S[0].x &&
              null != S[0].y &&
              null != S[1].x &&
              null != S[1].y &&
              ((r = _ ? _.getColor(i.name) : this.zr.getColor(t)),
              (g = this.deepMerge(S)),
              (h = null != g.value ? g.value : ""),
              (y &&
                ((r = isNaN(h) ? r : y.getColor(h)),
                (l = [g, e]),
                (d = this.deepQuery(l, "itemStyle.normal.color") || r),
                (c = this.deepQuery(l, "itemStyle.emphasis.color") || d),
                null == d && null == c)) ||
                ((S[0].tooltip = g.tooltip || e.tooltip || { trigger: "item" }),
                (S[0].name = null != S[0].name ? S[0].name : ""),
                (S[1].name = null != S[1].name ? S[1].name : ""),
                (S[0].value = h),
                (s = this.getLineMarkShape(
                  e,
                  t,
                  S,
                  b,
                  this.parsePercent(S[0].x, v),
                  this.parsePercent(S[0].y, x),
                  this.parsePercent(S[1].x, v),
                  this.parsePercent(S[1].y, x),
                  r
                )),
                (s._mark = "line"),
                (u = this.deepMerge([g, e], "effect")),
                u.show && (s.effect = u),
                i.type === n.CHART_TYPE_MAP &&
                  (s._geo = [this.getMarkGeo(S[0]), this.getMarkGeo(S[1])]),
                a.pack(
                  s,
                  i,
                  t,
                  S[0],
                  b,
                  S[0].name + ("" !== S[1].name ? " > " + S[1].name : ""),
                  h
                ),
                f.push(s)));
          }
          return f;
        },
        getMarkCoord: function () {
          return [0, 0];
        },
        getSymbolShape: function (t, e, s, r, n, h, l, d, c, p, u) {
          var g = [s, t],
            f = this.getDataFromOption(s, "-");
          d = this.deepQuery(g, "symbol") || d;
          var m = this.deepQuery(g, "symbolSize");
          m = "function" == typeof m ? m(f) : m;
          var y = this.deepQuery(g, "symbolRotate"),
            _ = this.deepMerge(g, "itemStyle.normal"),
            v = this.deepMerge(g, "itemStyle.emphasis"),
            x =
              null != _.borderWidth
                ? _.borderWidth
                : _.lineStyle && _.lineStyle.width;
          null == x && (x = d.match("empty") ? 2 : 0);
          var b =
            null != v.borderWidth
              ? v.borderWidth
              : v.lineStyle && v.lineStyle.width;
          null == b && (b = x + 2);
          var T = new o({
            style: {
              iconType: d.replace("empty", "").toLowerCase(),
              x: h - m,
              y: l - m,
              width: 2 * m,
              height: 2 * m,
              brushType: "both",
              color: d.match("empty")
                ? p
                : this.getItemStyleColor(_.color, e, r, s) || c,
              strokeColor:
                _.borderColor || this.getItemStyleColor(_.color, e, r, s) || c,
              lineWidth: x,
            },
            highlightStyle: {
              color: d.match("empty")
                ? p
                : this.getItemStyleColor(v.color, e, r, s),
              strokeColor:
                v.borderColor ||
                _.borderColor ||
                this.getItemStyleColor(_.color, e, r, s) ||
                c,
              lineWidth: b,
            },
            clickable: this.deepQuery(g, "clickable"),
          });
          return (
            d.match("image") &&
              ((T.style.image = d.replace(new RegExp("^image:\\/\\/"), "")),
              (T = new i({
                style: T.style,
                highlightStyle: T.highlightStyle,
                clickable: this.deepQuery(g, "clickable"),
              }))),
            null != y && (T.rotation = [(y * Math.PI) / 180, h, l]),
            d.match("star") &&
              ((T.style.iconType = "star"),
              (T.style.n =
                d.replace("empty", "").replace("star", "") - 0 || 5)),
            "none" === d && ((T.invisible = !0), (T.hoverable = !1)),
            (T = this.addLabel(T, t, s, n, u)),
            d.match("empty") &&
              (null == T.style.textColor &&
                (T.style.textColor = T.style.strokeColor),
              null == T.highlightStyle.textColor &&
                (T.highlightStyle.textColor = T.highlightStyle.strokeColor)),
            a.pack(T, t, e, s, r, n),
            (T._x = h),
            (T._y = l),
            (T._dataIndex = r),
            (T._seriesIndex = e),
            T
          );
        },
        getLineMarkShape: function (t, e, i, o, r, n, a, h, l) {
          var d = null != i[0].value ? i[0].value : "-",
            c = null != i[1].value ? i[1].value : "-",
            p = [
              this.query(i[0], "symbol") || t.symbol[0],
              this.query(i[1], "symbol") || t.symbol[1],
            ],
            u = [
              this.query(i[0], "symbolSize") || t.symbolSize[0],
              this.query(i[1], "symbolSize") || t.symbolSize[1],
            ];
          (u[0] = "function" == typeof u[0] ? u[0](d) : u[0]),
            (u[1] = "function" == typeof u[1] ? u[1](c) : u[1]);
          var g = [
              this.query(i[0], "symbolRotate") || t.symbolRotate[0],
              this.query(i[1], "symbolRotate") || t.symbolRotate[1],
            ],
            f = [i[0], i[1], t],
            m = this.deepMerge(f, "itemStyle.normal");
          m.color = this.getItemStyleColor(m.color, e, o, i);
          var y = this.deepMerge(f, "itemStyle.emphasis");
          y.color = this.getItemStyleColor(y.color, e, o, i);
          var _ = m.lineStyle,
            v = y.lineStyle,
            x = _.width;
          null == x && (x = m.borderWidth);
          var b = v.width;
          null == b && (b = null != y.borderWidth ? y.borderWidth : x + 2);
          var T = new s({
            style: {
              smooth: this.deepQuery([i[0], i[1], t], "smooth") ? "spline" : !1,
              smoothRadian: this.deepQuery([i[0], i[1], t], "smoothRadian"),
              symbol: p,
              symbolSize: u,
              symbolRotate: g,
              xStart: r,
              yStart: n,
              xEnd: a,
              yEnd: h,
              brushType: "both",
              lineType: _.type,
              shadowColor:
                _.shadowColor || _.color || m.borderColor || m.color || l,
              shadowBlur: _.shadowBlur,
              shadowOffsetX: _.shadowOffsetX,
              shadowOffsetY: _.shadowOffsetY,
              color: m.color || l,
              strokeColor: _.color || m.borderColor || m.color || l,
              lineWidth: x,
              symbolBorderColor: m.borderColor || m.color || l,
              symbolBorder: m.borderWidth,
            },
            highlightStyle: {
              shadowColor: v.shadowColor,
              shadowBlur: v.shadowBlur,
              shadowOffsetX: v.shadowOffsetX,
              shadowOffsetY: v.shadowOffsetY,
              color: y.color || m.color || l,
              strokeColor:
                v.color ||
                _.color ||
                y.borderColor ||
                m.borderColor ||
                y.color ||
                m.color ||
                l,
              lineWidth: b,
              symbolBorderColor:
                y.borderColor || m.borderColor || y.color || m.color || l,
              symbolBorder:
                null == y.borderWidth ? m.borderWidth + 2 : y.borderWidth,
            },
            clickable: this.deepQuery(f, "clickable"),
          });
          return (
            (T = this.addLabel(T, t, i[0], i[0].name + " : " + i[1].name)),
            (T._x = a),
            (T._y = h),
            T
          );
        },
        getLargeMarkPoingShape: function (t, e) {
          var i,
            o,
            s,
            n,
            a,
            h,
            l = this.series[t],
            d = this.component,
            c = e.data,
            p = d.dataRange,
            u = d.legend,
            g = [c[0], e];
          if (
            (u && (o = u.getColor(l.name)),
            !p ||
              ((s = null != c[0].value ? c[0].value : ""),
              (o = isNaN(s) ? o : p.getColor(s)),
              (n = this.deepQuery(g, "itemStyle.normal.color") || o),
              (a = this.deepQuery(g, "itemStyle.emphasis.color") || n),
              null != n || null != a))
          ) {
            o = this.deepMerge(g, "itemStyle.normal").color || o;
            var f = this.deepQuery(g, "symbol") || "circle";
            (f = f.replace("empty", "").replace(/\d/g, "")),
              (h = this.deepMerge([c[0], e], "effect"));
            var m = window.devicePixelRatio || 1;
            return (
              (i = new r({
                style: {
                  pointList: c,
                  color: o,
                  strokeColor: o,
                  shadowColor: h.shadowColor || o,
                  shadowBlur: (null != h.shadowBlur ? h.shadowBlur : 8) * m,
                  size: this.deepQuery(g, "symbolSize"),
                  iconType: f,
                  brushType: "fill",
                  lineWidth: 1,
                },
                draggable: !1,
                hoverable: !1,
              })),
              h.show && (i.effect = h),
              i
            );
          }
        },
        backupShapeList: function () {
          this.shapeList && this.shapeList.length > 0
            ? ((this.lastShapeList = this.shapeList), (this.shapeList = []))
            : (this.lastShapeList = []);
        },
        addShapeList: function () {
          var t,
            e,
            i = this.option.animationThreshold / 2,
            o = this.lastShapeList,
            s = this.shapeList,
            r = o.length > 0,
            a = r
              ? this.query(this.option, "animationDurationUpdate")
              : this.query(this.option, "animationDuration"),
            h = this.query(this.option, "animationEasing"),
            l = {},
            d = {};
          if (
            this.option.animation &&
            !this.option.renderAsImage &&
            s.length < i &&
            !this.motionlessOnce
          ) {
            for (var c = 0, p = o.length; p > c; c++)
              (e = this._getAnimationKey(o[c])),
                e.match("undefined")
                  ? this.zr.delShape(o[c].id)
                  : ((e += o[c].type),
                    l[e] ? this.zr.delShape(o[c].id) : (l[e] = o[c]));
            for (var c = 0, p = s.length; p > c; c++)
              (e = this._getAnimationKey(s[c])),
                e.match("undefined")
                  ? this.zr.addShape(s[c])
                  : ((e += s[c].type), (d[e] = s[c]));
            for (e in l) d[e] || this.zr.delShape(l[e].id);
            for (e in d)
              l[e]
                ? (this.zr.delShape(l[e].id),
                  this._animateMod(l[e], d[e], a, h, 0, r))
                : ((t =
                    (this.type != n.CHART_TYPE_LINE &&
                      this.type != n.CHART_TYPE_RADAR) ||
                    0 === e.indexOf("icon")
                      ? 0
                      : a / 2),
                  this._animateMod(!1, d[e], a, h, t, r));
            this.zr.refresh(), this.animationEffect();
          } else {
            (this.motionlessOnce = !1), this.zr.delShape(o);
            for (var c = 0, p = s.length; p > c; c++) this.zr.addShape(s[c]);
          }
        },
        _getAnimationKey: function (t) {
          return this.type != n.CHART_TYPE_MAP
            ? a.get(t, "seriesIndex") +
                "_" +
                a.get(t, "dataIndex") +
                (t._mark ? t._mark : "") +
                (this.type === n.CHART_TYPE_RADAR ? a.get(t, "special") : "")
            : a.get(t, "seriesIndex") +
                "_" +
                a.get(t, "dataIndex") +
                (t._mark ? t._mark : "undefined");
        },
        _animateMod: function (t, e, i, o, s, r) {
          switch (e.type) {
            case "polyline":
            case "half-smooth-polygon":
              h.pointList(this.zr, t, e, i, o);
              break;
            case "rectangle":
              h.rectangle(this.zr, t, e, i, o);
              break;
            case "image":
            case "icon":
              h.icon(this.zr, t, e, i, o, s);
              break;
            case "candle":
              r ? this.zr.addShape(e) : h.candle(this.zr, t, e, i, o);
              break;
            case "ring":
            case "sector":
            case "circle":
              r
                ? "sector" === e.type
                  ? h.sector(this.zr, t, e, i, o)
                  : this.zr.addShape(e)
                : h.ring(
                    this.zr,
                    t,
                    e,
                    i + ((a.get(e, "dataIndex") || 0) % 20) * 100,
                    o
                  );
              break;
            case "text":
              h.text(this.zr, t, e, i, o);
              break;
            case "polygon":
              r
                ? h.pointList(this.zr, t, e, i, o)
                : h.polygon(this.zr, t, e, i, o);
              break;
            case "ribbon":
              h.ribbon(this.zr, t, e, i, o);
              break;
            case "gauge-pointer":
              h.gaugePointer(this.zr, t, e, i, o);
              break;
            case "mark-line":
              h.markline(this.zr, t, e, i, o);
              break;
            case "bezier-curve":
            case "line":
              h.line(this.zr, t, e, i, o);
              break;
            default:
              this.zr.addShape(e);
          }
        },
        animationMark: function (t, e, i) {
          for (var o = i || this.shapeList, s = 0, r = o.length; r > s; s++)
            o[s]._mark && this._animateMod(!1, o[s], t, e, 0, !0);
          this.animationEffect(i);
        },
        animationEffect: function (t) {
          !t && this.clearEffectShape();
          var e = t || this.shapeList;
          if (null != e) {
            var i = n.EFFECT_ZLEVEL;
            this.zr.modLayer(i, { motionBlur: !0, lastFrameAlpha: 0.95 });
            for (var o, s = 0, r = e.length; r > s; s++)
              (o = e[s]),
                o._mark &&
                  o.effect &&
                  o.effect.show &&
                  l[o._mark] &&
                  (l[o._mark](this.zr, this.effectList, o, i),
                  (this.effectList[this.effectList.length - 1]._mark =
                    o._mark));
          }
        },
        clearEffectShape: function (t) {
          this.zr &&
            this.effectList &&
            this.effectList.length > 0 &&
            (t && this.zr.modLayer(n.EFFECT_ZLEVEL, { motionBlur: !1 }),
            this.zr.delShape(this.effectList)),
            (this.effectList = []);
        },
        addMark: function (t, e, i) {
          var o = this.series[t];
          if (this.selectedMap[o.name]) {
            var s = this.query(this.option, "animationDurationUpdate"),
              r = this.query(this.option, "animationEasing"),
              n = o[i].data,
              a = this.shapeList.length;
            if (
              ((o[i].data = e.data),
              this["_build" + i.replace("m", "M")](t),
              this.option.animation && !this.option.renderAsImage)
            )
              this.animationMark(s, r, this.shapeList.slice(a));
            else {
              for (var h = a, l = this.shapeList.length; l > h; h++)
                this.zr.addShape(this.shapeList[h]);
              this.zr.refreshNextFrame();
            }
            o[i].data = n;
          }
        },
        delMark: function (t, e, i) {
          i = i.replace("mark", "").replace("large", "").toLowerCase();
          var o = this.series[t];
          if (this.selectedMap[o.name]) {
            for (
              var s = !1, r = [this.shapeList, this.effectList], n = 2;
              n--;

            )
              for (var h = 0, l = r[n].length; l > h; h++)
                if (
                  r[n][h]._mark == i &&
                  a.get(r[n][h], "seriesIndex") == t &&
                  a.get(r[n][h], "name") == e
                ) {
                  this.zr.delShape(r[n][h].id), r[n].splice(h, 1), (s = !0);
                  break;
                }
            s && this.zr.refreshNextFrame();
          }
        },
      }),
      p.inherits(e, c),
      e
    );
  }),
  define("zrender/shape/Circle", [
    "require",
    "./Base",
    "../tool/util",
  ], function (t) {
    "use strict";
    var e = t("./Base"),
      i = function (t) {
        e.call(this, t);
      };
    return (
      (i.prototype = {
        type: "circle",
        buildPath: function (t, e) {
          t.arc(e.x, e.y, e.r, 0, 2 * Math.PI, !0);
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
  define("echarts/util/accMath", [], function () {
    function t(t, e) {
      var i = t.toString(),
        o = e.toString(),
        s = 0;
      try {
        s = o.split(".")[1].length;
      } catch (r) {}
      try {
        s -= i.split(".")[1].length;
      } catch (r) {}
      return (
        ((i.replace(".", "") - 0) / (o.replace(".", "") - 0)) * Math.pow(10, s)
      );
    }
    function e(t, e) {
      var i = t.toString(),
        o = e.toString(),
        s = 0;
      try {
        s += i.split(".")[1].length;
      } catch (r) {}
      try {
        s += o.split(".")[1].length;
      } catch (r) {}
      return (
        ((i.replace(".", "") - 0) * (o.replace(".", "") - 0)) / Math.pow(10, s)
      );
    }
    function i(t, e) {
      var i = 0,
        o = 0;
      try {
        i = t.toString().split(".")[1].length;
      } catch (s) {}
      try {
        o = e.toString().split(".")[1].length;
      } catch (s) {}
      var r = Math.pow(10, Math.max(i, o));
      return (Math.round(t * r) + Math.round(e * r)) / r;
    }
    function o(t, e) {
      return i(t, -e);
    }
    return { accDiv: t, accMul: e, accAdd: i, accSub: o };
  }),
  define("echarts/util/shape/Icon", [
    "require",
    "zrender/tool/util",
    "zrender/shape/Star",
    "zrender/shape/Heart",
    "zrender/shape/Droplet",
    "zrender/shape/Image",
    "zrender/shape/Base",
  ], function (t) {
    function e(t, e) {
      var i = e.x,
        o = e.y,
        s = e.width / 16,
        r = e.height / 16;
      t.moveTo(i, o + e.height),
        t.lineTo(i + 5 * s, o + 14 * r),
        t.lineTo(i + e.width, o + 3 * r),
        t.lineTo(i + 13 * s, o),
        t.lineTo(i + 2 * s, o + 11 * r),
        t.lineTo(i, o + e.height),
        t.moveTo(i + 6 * s, o + 10 * r),
        t.lineTo(i + 14 * s, o + 2 * r),
        t.moveTo(i + 10 * s, o + 13 * r),
        t.lineTo(i + e.width, o + 13 * r),
        t.moveTo(i + 13 * s, o + 10 * r),
        t.lineTo(i + 13 * s, o + e.height);
    }
    function i(t, e) {
      var i = e.x,
        o = e.y,
        s = e.width / 16,
        r = e.height / 16;
      t.moveTo(i, o + e.height),
        t.lineTo(i + 5 * s, o + 14 * r),
        t.lineTo(i + e.width, o + 3 * r),
        t.lineTo(i + 13 * s, o),
        t.lineTo(i + 2 * s, o + 11 * r),
        t.lineTo(i, o + e.height),
        t.moveTo(i + 6 * s, o + 10 * r),
        t.lineTo(i + 14 * s, o + 2 * r),
        t.moveTo(i + 10 * s, o + 13 * r),
        t.lineTo(i + e.width, o + 13 * r);
    }
    function o(t, e) {
      var i = e.x,
        o = e.y,
        s = e.width / 16,
        r = e.height / 16;
      t.moveTo(i + 4 * s, o + 15 * r),
        t.lineTo(i + 9 * s, o + 13 * r),
        t.lineTo(i + 14 * s, o + 8 * r),
        t.lineTo(i + 11 * s, o + 5 * r),
        t.lineTo(i + 6 * s, o + 10 * r),
        t.lineTo(i + 4 * s, o + 15 * r),
        t.moveTo(i + 5 * s, o),
        t.lineTo(i + 11 * s, o),
        t.moveTo(i + 5 * s, o + r),
        t.lineTo(i + 11 * s, o + r),
        t.moveTo(i, o + 2 * r),
        t.lineTo(i + e.width, o + 2 * r),
        t.moveTo(i, o + 5 * r),
        t.lineTo(i + 3 * s, o + e.height),
        t.lineTo(i + 13 * s, o + e.height),
        t.lineTo(i + e.width, o + 5 * r);
    }
    function s(t, e) {
      var i = e.x,
        o = e.y,
        s = e.width / 16,
        r = e.height / 16;
      t.moveTo(i, o + 3 * r),
        t.lineTo(i + 6 * s, o + 3 * r),
        t.moveTo(i + 3 * s, o),
        t.lineTo(i + 3 * s, o + 6 * r),
        t.moveTo(i + 3 * s, o + 8 * r),
        t.lineTo(i + 3 * s, o + e.height),
        t.lineTo(i + e.width, o + e.height),
        t.lineTo(i + e.width, o + 3 * r),
        t.lineTo(i + 8 * s, o + 3 * r);
    }
    function r(t, e) {
      var i = e.x,
        o = e.y,
        s = e.width / 16,
        r = e.height / 16;
      t.moveTo(i + 6 * s, o),
        t.lineTo(i + 2 * s, o + 3 * r),
        t.lineTo(i + 6 * s, o + 6 * r),
        t.moveTo(i + 2 * s, o + 3 * r),
        t.lineTo(i + 14 * s, o + 3 * r),
        t.lineTo(i + 14 * s, o + 11 * r),
        t.moveTo(i + 2 * s, o + 5 * r),
        t.lineTo(i + 2 * s, o + 13 * r),
        t.lineTo(i + 14 * s, o + 13 * r),
        t.moveTo(i + 10 * s, o + 10 * r),
        t.lineTo(i + 14 * s, o + 13 * r),
        t.lineTo(i + 10 * s, o + e.height);
    }
    function n(t, e) {
      var i = e.x,
        o = e.y,
        s = e.width / 16,
        r = e.height / 16,
        n = e.width / 2;
      (t.lineWidth = 1.5),
        t.arc(i + n, o + n, n - s, 0, (2 * Math.PI) / 3),
        t.moveTo(i + 3 * s, o + e.height),
        t.lineTo(i + 0 * s, o + 12 * r),
        t.lineTo(i + 5 * s, o + 11 * r),
        t.moveTo(i, o + 8 * r),
        t.arc(i + n, o + n, n - s, Math.PI, (5 * Math.PI) / 3),
        t.moveTo(i + 13 * s, o),
        t.lineTo(i + e.width, o + 4 * r),
        t.lineTo(i + 11 * s, o + 5 * r);
    }
    function a(t, e) {
      var i = e.x,
        o = e.y,
        s = e.width / 16,
        r = e.height / 16;
      t.moveTo(i, o),
        t.lineTo(i, o + e.height),
        t.lineTo(i + e.width, o + e.height),
        t.moveTo(i + 2 * s, o + 14 * r),
        t.lineTo(i + 7 * s, o + 6 * r),
        t.lineTo(i + 11 * s, o + 11 * r),
        t.lineTo(i + 15 * s, o + 2 * r);
    }
    function h(t, e) {
      var i = e.x,
        o = e.y,
        s = e.width / 16,
        r = e.height / 16;
      t.moveTo(i, o),
        t.lineTo(i, o + e.height),
        t.lineTo(i + e.width, o + e.height),
        t.moveTo(i + 3 * s, o + 14 * r),
        t.lineTo(i + 3 * s, o + 6 * r),
        t.lineTo(i + 4 * s, o + 6 * r),
        t.lineTo(i + 4 * s, o + 14 * r),
        t.moveTo(i + 7 * s, o + 14 * r),
        t.lineTo(i + 7 * s, o + 2 * r),
        t.lineTo(i + 8 * s, o + 2 * r),
        t.lineTo(i + 8 * s, o + 14 * r),
        t.moveTo(i + 11 * s, o + 14 * r),
        t.lineTo(i + 11 * s, o + 9 * r),
        t.lineTo(i + 12 * s, o + 9 * r),
        t.lineTo(i + 12 * s, o + 14 * r);
    }
    function l(t, e) {
      var i = e.x,
        o = e.y,
        s = e.width - 2,
        r = e.height - 2,
        n = Math.min(s, r) / 2;
      (o += 2),
        t.moveTo(i + n + 3, o + n - 3),
        t.arc(i + n + 3, o + n - 3, n - 1, 0, -Math.PI / 2, !0),
        t.lineTo(i + n + 3, o + n - 3),
        t.moveTo(i + n, o),
        t.lineTo(i + n, o + n),
        t.arc(i + n, o + n, n, -Math.PI / 2, 2 * Math.PI, !0),
        t.lineTo(i + n, o + n),
        (t.lineWidth = 1.5);
    }
    function d(t, e) {
      var i = e.x,
        o = e.y,
        s = e.width / 16,
        r = e.height / 16;
      (o -= r),
        t.moveTo(i + 1 * s, o + 2 * r),
        t.lineTo(i + 15 * s, o + 2 * r),
        t.lineTo(i + 14 * s, o + 3 * r),
        t.lineTo(i + 2 * s, o + 3 * r),
        t.moveTo(i + 3 * s, o + 6 * r),
        t.lineTo(i + 13 * s, o + 6 * r),
        t.lineTo(i + 12 * s, o + 7 * r),
        t.lineTo(i + 4 * s, o + 7 * r),
        t.moveTo(i + 5 * s, o + 10 * r),
        t.lineTo(i + 11 * s, o + 10 * r),
        t.lineTo(i + 10 * s, o + 11 * r),
        t.lineTo(i + 6 * s, o + 11 * r),
        t.moveTo(i + 7 * s, o + 14 * r),
        t.lineTo(i + 9 * s, o + 14 * r),
        t.lineTo(i + 8 * s, o + 15 * r),
        t.lineTo(i + 7 * s, o + 15 * r);
    }
    function c(t, e) {
      var i = e.x,
        o = e.y,
        s = e.width,
        r = e.height,
        n = s / 16,
        a = r / 16,
        h = 2 * Math.min(n, a);
      t.moveTo(i + n + h, o + a + h),
        t.arc(i + n, o + a, h, Math.PI / 4, 3 * Math.PI),
        t.lineTo(i + 7 * n - h, o + 6 * a - h),
        t.arc(i + 7 * n, o + 6 * a, h, (Math.PI / 4) * 5, 4 * Math.PI),
        t.arc(i + 7 * n, o + 6 * a, h / 2, (Math.PI / 4) * 5, 4 * Math.PI),
        t.moveTo(i + 7 * n - h / 2, o + 6 * a + h),
        t.lineTo(i + n + h, o + 14 * a - h),
        t.arc(i + n, o + 14 * a, h, -Math.PI / 4, 2 * Math.PI),
        t.moveTo(i + 7 * n + h / 2, o + 6 * a),
        t.lineTo(i + 14 * n - h, o + 10 * a - h / 2),
        t.moveTo(i + 16 * n, o + 10 * a),
        t.arc(i + 14 * n, o + 10 * a, h, 0, 3 * Math.PI),
        (t.lineWidth = 1.5);
    }
    function p(t, e) {
      var i = e.x,
        o = e.y,
        s = e.width,
        r = e.height,
        n = Math.min(s, r) / 2;
      t.moveTo(i + s, o + r / 2),
        t.arc(i + n, o + n, n, 0, 2 * Math.PI),
        t.arc(i + n, o, n, Math.PI / 4, (Math.PI / 5) * 4),
        t.arc(i, o + n, n, -Math.PI / 3, Math.PI / 3),
        t.arc(i + s, o + r, n, Math.PI, (Math.PI / 2) * 3),
        (t.lineWidth = 1.5);
    }
    function u(t, e) {
      for (
        var i = e.x,
          o = e.y,
          s = e.width,
          r = e.height,
          n = Math.round(r / 3),
          a = Math.round((n - 2) / 2),
          h = 3;
        h--;

      )
        t.rect(i, o + n * h + a, s, 2);
    }
    function g(t, e) {
      for (
        var i = e.x,
          o = e.y,
          s = e.width,
          r = e.height,
          n = Math.round(s / 3),
          a = Math.round((n - 2) / 2),
          h = 3;
        h--;

      )
        t.rect(i + n * h + a, o, 2, r);
    }
    function f(t, e) {
      var i = e.x,
        o = e.y,
        s = e.width / 16;
      t.moveTo(i + s, o),
        t.lineTo(i + s, o + e.height),
        t.lineTo(i + 15 * s, o + e.height),
        t.lineTo(i + 15 * s, o),
        t.lineTo(i + s, o),
        t.moveTo(i + 3 * s, o + 3 * s),
        t.lineTo(i + 13 * s, o + 3 * s),
        t.moveTo(i + 3 * s, o + 6 * s),
        t.lineTo(i + 13 * s, o + 6 * s),
        t.moveTo(i + 3 * s, o + 9 * s),
        t.lineTo(i + 13 * s, o + 9 * s),
        t.moveTo(i + 3 * s, o + 12 * s),
        t.lineTo(i + 9 * s, o + 12 * s);
    }
    function m(t, e) {
      var i = e.x,
        o = e.y,
        s = e.width / 16,
        r = e.height / 16;
      t.moveTo(i, o),
        t.lineTo(i, o + e.height),
        t.lineTo(i + e.width, o + e.height),
        t.lineTo(i + e.width, o),
        t.lineTo(i, o),
        t.moveTo(i + 4 * s, o),
        t.lineTo(i + 4 * s, o + 8 * r),
        t.lineTo(i + 12 * s, o + 8 * r),
        t.lineTo(i + 12 * s, o),
        t.moveTo(i + 6 * s, o + 11 * r),
        t.lineTo(i + 6 * s, o + 13 * r),
        t.lineTo(i + 10 * s, o + 13 * r),
        t.lineTo(i + 10 * s, o + 11 * r),
        t.lineTo(i + 6 * s, o + 11 * r);
    }
    function y(t, e) {
      var i = e.x,
        o = e.y,
        s = e.width,
        r = e.height;
      t.moveTo(i, o + r / 2),
        t.lineTo(i + s, o + r / 2),
        t.moveTo(i + s / 2, o),
        t.lineTo(i + s / 2, o + r);
    }
    function _(t, e) {
      var i = e.width / 2,
        o = e.height / 2,
        s = Math.min(i, o);
      t.moveTo(e.x + i + s, e.y + o),
        t.arc(e.x + i, e.y + o, s, 0, 2 * Math.PI),
        t.closePath();
    }
    function v(t, e) {
      t.rect(e.x, e.y, e.width, e.height), t.closePath();
    }
    function x(t, e) {
      var i = e.width / 2,
        o = e.height / 2,
        s = e.x + i,
        r = e.y + o,
        n = Math.min(i, o);
      t.moveTo(s, r - n),
        t.lineTo(s + n, r + n),
        t.lineTo(s - n, r + n),
        t.lineTo(s, r - n),
        t.closePath();
    }
    function b(t, e) {
      var i = e.width / 2,
        o = e.height / 2,
        s = e.x + i,
        r = e.y + o,
        n = Math.min(i, o);
      t.moveTo(s, r - n),
        t.lineTo(s + n, r),
        t.lineTo(s, r + n),
        t.lineTo(s - n, r),
        t.lineTo(s, r - n),
        t.closePath();
    }
    function T(t, e) {
      var i = e.x,
        o = e.y,
        s = e.width / 16;
      t.moveTo(i + 8 * s, o),
        t.lineTo(i + s, o + e.height),
        t.lineTo(i + 8 * s, o + (e.height / 4) * 3),
        t.lineTo(i + 15 * s, o + e.height),
        t.lineTo(i + 8 * s, o),
        t.closePath();
    }
    function S(e, i) {
      var o = t("zrender/shape/Star"),
        s = i.width / 2,
        r = i.height / 2;
      o.prototype.buildPath(e, {
        x: i.x + s,
        y: i.y + r,
        r: Math.min(s, r),
        n: i.n || 5,
      });
    }
    function C(e, i) {
      var o = t("zrender/shape/Heart");
      o.prototype.buildPath(e, {
        x: i.x + i.width / 2,
        y: i.y + 0.2 * i.height,
        a: i.width / 2,
        b: 0.8 * i.height,
      });
    }
    function z(e, i) {
      var o = t("zrender/shape/Droplet");
      o.prototype.buildPath(e, {
        x: i.x + 0.5 * i.width,
        y: i.y + 0.5 * i.height,
        a: 0.5 * i.width,
        b: 0.8 * i.height,
      });
    }
    function L(t, e) {
      var i = e.x,
        o = e.y - (e.height / 2) * 1.5,
        s = e.width / 2,
        r = e.height / 2,
        n = Math.min(s, r);
      t.arc(i + s, o + r, n, (Math.PI / 5) * 4, Math.PI / 5),
        t.lineTo(i + s, o + r + 1.5 * n),
        t.closePath();
    }
    function w(e, i, o) {
      var s = t("zrender/shape/Image");
      this._imageShape = this._imageShape || new s({ style: {} });
      for (var r in i) this._imageShape.style[r] = i[r];
      this._imageShape.brush(e, !1, o);
    }
    function M(t) {
      A.call(this, t);
    }
    var E = t("zrender/tool/util"),
      A = t("zrender/shape/Base");
    return (
      (M.prototype = {
        type: "icon",
        iconLibrary: {
          mark: e,
          markUndo: i,
          markClear: o,
          dataZoom: s,
          dataZoomReset: r,
          restore: n,
          lineChart: a,
          barChart: h,
          pieChart: l,
          funnelChart: d,
          forceChart: c,
          chordChart: p,
          stackChart: u,
          tiledChart: g,
          dataView: f,
          saveAsImage: m,
          cross: y,
          circle: _,
          rectangle: v,
          triangle: x,
          diamond: b,
          arrow: T,
          star: S,
          heart: C,
          droplet: z,
          pin: L,
          image: w,
        },
        brush: function (e, i, o) {
          var s = i ? this.highlightStyle : this.style;
          s = s || {};
          var r = s.iconType || this.style.iconType;
          if ("image" === r) {
            var n = t("zrender/shape/Image");
            n.prototype.brush.call(this, e, i, o);
          } else {
            var s = this.beforeBrush(e, i);
            switch ((e.beginPath(), this.buildPath(e, s, o), s.brushType)) {
              case "both":
                e.fill();
              case "stroke":
                s.lineWidth > 0 && e.stroke();
                break;
              default:
                e.fill();
            }
            this.drawText(e, s, this.style), this.afterBrush(e);
          }
        },
        buildPath: function (t, e, i) {
          this.iconLibrary[e.iconType]
            ? this.iconLibrary[e.iconType].call(this, t, e, i)
            : (t.moveTo(e.x, e.y),
              t.lineTo(e.x + e.width, e.y),
              t.lineTo(e.x + e.width, e.y + e.height),
              t.lineTo(e.x, e.y + e.height),
              t.lineTo(e.x, e.y),
              t.closePath());
        },
        getRect: function (t) {
          return t.__rect
            ? t.__rect
            : ((t.__rect = {
                x: Math.round(t.x),
                y: Math.round(
                  t.y - ("pin" == t.iconType ? (t.height / 2) * 1.5 : 0)
                ),
                width: t.width,
                height: t.height * ("pin" === t.iconType ? 1.25 : 1),
              }),
              t.__rect);
        },
        isCover: function (t, e) {
          var i = this.getTansform(t, e);
          (t = i[0]), (e = i[1]);
          var o = this.style.__rect;
          o || (o = this.style.__rect = this.getRect(this.style));
          var s = o.height < 8 || o.width < 8 ? 4 : 0;
          return t >= o.x - s &&
            t <= o.x + o.width + s &&
            e >= o.y - s &&
            e <= o.y + o.height + s
            ? !0
            : !1;
        },
      }),
      E.inherits(M, A),
      M
    );
  }),
  define("echarts/util/shape/MarkLine", [
    "require",
    "zrender/shape/Base",
    "./Icon",
    "zrender/shape/Line",
    "zrender/shape/Polyline",
    "zrender/tool/matrix",
    "zrender/tool/area",
    "zrender/shape/util/dashedLineTo",
    "zrender/shape/util/smoothSpline",
    "zrender/tool/util",
  ], function (t) {
    function e(t) {
      i.call(this, t);
    }
    var i = t("zrender/shape/Base"),
      o = t("./Icon"),
      s = t("zrender/shape/Line"),
      r = new s({}),
      n = t("zrender/shape/Polyline"),
      a = new n({}),
      h = t("zrender/tool/matrix"),
      l = t("zrender/tool/area"),
      d = t("zrender/shape/util/dashedLineTo"),
      c = t("zrender/shape/util/smoothSpline"),
      p = t("zrender/tool/util");
    return (
      (e.prototype = {
        type: "mark-line",
        brush: function (t, e) {
          var i = this.style;
          e && (i = this.getHighlightStyle(i, this.highlightStyle || {})),
            t.save(),
            this.setContext(t, i),
            this.setTransform(t),
            t.save(),
            t.beginPath(),
            this.buildLinePath(t, i, this.style.lineWidth || 1),
            t.stroke(),
            t.restore(),
            this.brushSymbol(t, i, 0),
            this.brushSymbol(t, i, 1),
            this.drawText(t, i, this.style),
            t.restore();
        },
        buildLinePath: function (t, e, i) {
          var o = e.pointList || this.getPointList(e);
          e.pointList = o;
          var s = Math.min(
            e.pointList.length,
            Math.round(e.pointListLength || e.pointList.length)
          );
          if (e.lineType && "solid" != e.lineType) {
            if ("dashed" == e.lineType || "dotted" == e.lineType)
              if ("spline" !== e.smooth) {
                var r = i * ("dashed" == e.lineType ? 5 : 1);
                t.moveTo(o[0][0], o[0][1]);
                for (var n = 1; s > n; n++)
                  d(t, o[n - 1][0], o[n - 1][1], o[n][0], o[n][1], r);
              } else
                for (var n = 1; s > n; n += 2)
                  t.moveTo(o[n - 1][0], o[n - 1][1]),
                    t.lineTo(o[n][0], o[n][1]);
          } else {
            t.moveTo(o[0][0], o[0][1]);
            for (var n = 1; s > n; n++) t.lineTo(o[n][0], o[n][1]);
          }
        },
        brushSymbol: function (t, e, i) {
          if ("none" != e.symbol[i]) {
            t.save(),
              t.beginPath(),
              (t.lineWidth = e.symbolBorder),
              (t.strokeStyle = e.symbolBorderColor),
              (e.iconType = e.symbol[i].replace("empty", "").toLowerCase()),
              e.symbol[i].match("empty") && (t.fillStyle = "#fff");
            var s,
              r = Math.min(
                e.pointList.length,
                Math.round(e.pointListLength || e.pointList.length)
              ),
              n = 0 === i ? e.pointList[0][0] : e.pointList[r - 1][0],
              a = 0 === i ? e.pointList[0][1] : e.pointList[r - 1][1],
              l =
                "undefined" != typeof e.symbolRotate[i]
                  ? e.symbolRotate[i] - 0
                  : 0;
            if (
              (0 !== l &&
                ((s = h.create()),
                h.identity(s),
                (n || a) && h.translate(s, s, [-n, -a]),
                h.rotate(s, s, (l * Math.PI) / 180),
                (n || a) && h.translate(s, s, [n, a]),
                t.transform.apply(t, s)),
              "arrow" == e.iconType && 0 === l)
            )
              this.buildArrawPath(t, e, i);
            else {
              var d = e.symbolSize[i];
              (e.x = n - d),
                (e.y = a - d),
                (e.width = 2 * d),
                (e.height = 2 * d),
                o.prototype.buildPath(t, e);
            }
            t.closePath(), t.fill(), t.stroke(), t.restore();
          }
        },
        buildArrawPath: function (t, e, i) {
          var o = Math.min(
              e.pointList.length,
              Math.round(e.pointListLength || e.pointList.length)
            ),
            s = 2 * e.symbolSize[i],
            r = e.pointList[0][0],
            n = e.pointList[o - 1][0],
            a = e.pointList[0][1],
            h = e.pointList[o - 1][1],
            l = 0;
          "spline" === e.smooth && (l = e.smoothRadian * (n >= r ? 1 : -1));
          var d = Math.atan(Math.abs((h - a) / (r - n)));
          0 === i
            ? n > r
              ? h > a
                ? (d = 2 * Math.PI - d + l)
                : (d += l)
              : h > a
              ? (d += Math.PI - l)
              : (d = Math.PI - d - l)
            : r > n
            ? a > h
              ? (d = 2 * Math.PI - d + l)
              : (d += l)
            : a > h
            ? (d += Math.PI - l)
            : (d = Math.PI - d - l);
          var c = Math.PI / 8,
            p = 0 === i ? r : n,
            u = 0 === i ? a : h,
            g = [
              [p + s * Math.cos(d - c), u - s * Math.sin(d - c)],
              [p + 0.6 * s * Math.cos(d), u - 0.6 * s * Math.sin(d)],
              [p + s * Math.cos(d + c), u - s * Math.sin(d + c)],
            ];
          t.moveTo(p, u);
          for (var f = 0, m = g.length; m > f; f++) t.lineTo(g[f][0], g[f][1]);
          t.lineTo(p, u);
        },
        getPointList: function (t) {
          var e = [
            [t.xStart, t.yStart],
            [t.xEnd, t.yEnd],
          ];
          if ("spline" === t.smooth) {
            var i = e[1][0],
              o = e[1][1];
            if (t.smoothRadian <= 0.8) {
              e[3] = [i, o];
              var s = e[0][0] <= e[3][0];
              (e[1] = this.getOffetPoint(e[0], e[3], s, t.smoothRadian)),
                (e[2] = this.getOffetPoint(e[3], e[0], s, t.smoothRadian));
            } else
              (e[2] = [i, o]),
                (e[1] = this.getOffetPoint(
                  e[0],
                  e[2],
                  e[0][0] <= e[2][0],
                  t.smoothRadian
                ));
            (e = c(e, !1)), (e[e.length - 1] = [i, o]);
          }
          return e;
        },
        getOffetPoint: function (t, e, i, o) {
          var s,
            r = (2 - Math.abs(o)) / 0.6,
            n =
              Math.sqrt(
                Math.round(
                  (t[0] - e[0]) * (t[0] - e[0]) + (t[1] - e[1]) * (t[1] - e[1])
                )
              ) / r,
            a = [t[0], t[1]];
          if (t[0] != e[0] && t[1] != e[1]) {
            var h = (e[1] - t[1]) / (e[0] - t[0]);
            s = Math.atan(h);
          } else s = t[0] == e[0] ? ((t[1] <= e[1] ? 1 : -1) * Math.PI) / 2 : 0;
          var l, d;
          return (
            t[0] <= e[0]
              ? ((s -= o * (i ? 1 : -1)),
                (l = Math.round(Math.cos(s) * n)),
                (d = Math.round(Math.sin(s) * n)),
                (a[0] += l),
                (a[1] += d))
              : ((s += o * (i ? 1 : -1)),
                (l = Math.round(Math.cos(s) * n)),
                (d = Math.round(Math.sin(s) * n)),
                (a[0] -= l),
                (a[1] -= d)),
            a
          );
        },
        getRect: function (t) {
          if (t.__rect) return t.__rect;
          var e = t.lineWidth || 1;
          return (
            (t.__rect = {
              x: Math.min(t.xStart, t.xEnd) - e,
              y: Math.min(t.yStart, t.yEnd) - e,
              width: Math.abs(t.xStart - t.xEnd) + e,
              height: Math.abs(t.yStart - t.yEnd) + e,
            }),
            t.__rect
          );
        },
        isCover: function (t, e) {
          var i = this.getTansform(t, e);
          (t = i[0]), (e = i[1]);
          var o = this.style.__rect;
          return (
            o || (o = this.style.__rect = this.getRect(this.style)),
            t >= o.x && t <= o.x + o.width && e >= o.y && e <= o.y + o.height
              ? "spline" !== this.style.smooth
                ? l.isInside(r, this.style, t, e)
                : l.isInside(a, this.style, t, e)
              : !1
          );
        },
      }),
      p.inherits(e, i),
      e
    );
  }),
  define("echarts/util/shape/Symbol", [
    "require",
    "zrender/shape/Base",
    "zrender/shape/Polygon",
    "zrender/tool/util",
    "./normalIsCover",
  ], function (t) {
    function e(t) {
      i.call(this, t);
    }
    var i = t("zrender/shape/Base"),
      o = t("zrender/shape/Polygon"),
      s = new o({}),
      r = t("zrender/tool/util");
    return (
      (e.prototype = {
        type: "symbol",
        buildPath: function (t, e) {
          var i = e.pointList,
            o = i.length;
          if (0 !== o)
            for (
              var s,
                r,
                n,
                a,
                h,
                l = 1e4,
                d = Math.ceil(o / l),
                c = i[0] instanceof Array,
                p = e.size ? e.size : 2,
                u = p,
                g = p / 2,
                f = 2 * Math.PI,
                m = 0;
              d > m;
              m++
            ) {
              t.beginPath(), (s = m * l), (r = s + l), (r = r > o ? o : r);
              for (var y = s; r > y; y++)
                if (
                  (e.random &&
                    ((n = e["randomMap" + (y % 20)] / 100),
                    (u = p * n * n),
                    (g = u / 2)),
                  c
                    ? ((a = i[y][0]), (h = i[y][1]))
                    : ((a = i[y].x), (h = i[y].y)),
                  3 > u)
                )
                  t.rect(a - g, h - g, u, u);
                else
                  switch (e.iconType) {
                    case "circle":
                      t.moveTo(a, h), t.arc(a, h, g, 0, f, !0);
                      break;
                    case "diamond":
                      t.moveTo(a, h - g),
                        t.lineTo(a + g / 3, h - g / 3),
                        t.lineTo(a + g, h),
                        t.lineTo(a + g / 3, h + g / 3),
                        t.lineTo(a, h + g),
                        t.lineTo(a - g / 3, h + g / 3),
                        t.lineTo(a - g, h),
                        t.lineTo(a - g / 3, h - g / 3),
                        t.lineTo(a, h - g);
                      break;
                    default:
                      t.rect(a - g, h - g, u, u);
                  }
              if ((t.closePath(), d - 1 > m))
                switch (e.brushType) {
                  case "both":
                    t.fill(), e.lineWidth > 0 && t.stroke();
                    break;
                  case "stroke":
                    e.lineWidth > 0 && t.stroke();
                    break;
                  default:
                    t.fill();
                }
            }
        },
        getRect: function (t) {
          return t.__rect || s.getRect(t);
        },
        isCover: t("./normalIsCover"),
      }),
      r.inherits(e, i),
      e
    );
  }),
  define("echarts/util/ecAnimation", [
    "require",
    "zrender/tool/util",
    "zrender/shape/Polygon",
  ], function (t) {
    function e(t, e, i, o, s) {
      var r,
        n = i.style.pointList,
        a = n.length;
      if (!e) {
        if (((r = []), "vertical" != i._orient))
          for (var h = n[0][1], l = 0; a > l; l++) r[l] = [n[l][0], h];
        else for (var d = n[0][0], l = 0; a > l; l++) r[l] = [d, n[l][1]];
        "half-smooth-polygon" == i.type &&
          ((r[a - 1] = g.clone(n[a - 1])), (r[a - 2] = g.clone(n[a - 2]))),
          (e = { style: { pointList: r } });
      }
      r = e.style.pointList;
      var c = r.length;
      (i.style.pointList =
        c == a ? r : a > c ? r.concat(n.slice(c)) : r.slice(0, a)),
        t.addShape(i),
        t.animate(i.id, "style").when(o, { pointList: n }).start(s);
    }
    function i(t, e) {
      for (var i = arguments.length, o = 2; i > o; o++) {
        var s = arguments[o];
        t.style[s] = e.style[s];
      }
    }
    function o(t, e, o, s, r) {
      var n = o.style;
      e ||
        (e = {
          position: o.position,
          style: {
            x: n.x,
            y: "vertical" == o._orient ? n.y + n.height : n.y,
            width: "vertical" == o._orient ? n.width : 0,
            height: "vertical" != o._orient ? n.height : 0,
          },
        });
      var a = n.x,
        h = n.y,
        l = n.width,
        d = n.height,
        c = [o.position[0], o.position[1]];
      i(o, e, "x", "y", "width", "height"),
        (o.position = e.position),
        t.addShape(o),
        (c[0] != e.position[0] || c[1] != e.position[1]) &&
          t.animate(o.id, "").when(s, { position: c }).start(r),
        t
          .animate(o.id, "style")
          .when(s, { x: a, y: h, width: l, height: d })
          .start(r);
    }
    function s(t, e, i, o, s) {
      if (!e) {
        var r = i.style.y;
        e = { style: { y: [r[0], r[0], r[0], r[0]] } };
      }
      var n = i.style.y;
      (i.style.y = e.style.y),
        t.addShape(i),
        t.animate(i.id, "style").when(o, { y: n }).start(s);
    }
    function r(t, e, i, o, s) {
      var r = i.style.x,
        n = i.style.y,
        a = i.style.r0,
        h = i.style.r;
      "r" != i._animationAdd
        ? ((i.style.r0 = 0),
          (i.style.r = 0),
          (i.rotation = [2 * Math.PI, r, n]),
          t.addShape(i),
          t.animate(i.id, "style").when(o, { r0: a, r: h }).start(s),
          t
            .animate(i.id, "")
            .when(Math.round((o / 3) * 2), { rotation: [0, r, n] })
            .start(s))
        : ((i.style.r0 = i.style.r),
          t.addShape(i),
          t.animate(i.id, "style").when(o, { r0: a }).start(s));
    }
    function n(t, e, o, s, r) {
      e ||
        (e =
          "r" != o._animationAdd
            ? {
                style: {
                  startAngle: o.style.startAngle,
                  endAngle: o.style.startAngle,
                },
              }
            : { style: { r0: o.style.r } });
      var n = o.style.startAngle,
        a = o.style.endAngle;
      i(o, e, "startAngle", "endAngle"),
        t.addShape(o),
        t
          .animate(o.id, "style")
          .when(s, { startAngle: n, endAngle: a })
          .start(r);
    }
    function a(t, e, o, s, r) {
      e ||
        (e = {
          style: {
            x: "left" == o.style.textAlign ? o.style.x + 100 : o.style.x - 100,
            y: o.style.y,
          },
        });
      var n = o.style.x,
        a = o.style.y;
      i(o, e, "x", "y"),
        t.addShape(o),
        t.animate(o.id, "style").when(s, { x: n, y: a }).start(r);
    }
    function h(e, i, o, s, r) {
      var n = t("zrender/shape/Polygon").prototype.getRect(o.style),
        a = n.x + n.width / 2,
        h = n.y + n.height / 2;
      (o.scale = [0.1, 0.1, a, h]),
        e.addShape(o),
        e
          .animate(o.id, "")
          .when(s, { scale: [1, 1, a, h] })
          .start(r);
    }
    function l(t, e, o, s, r) {
      e ||
        (e = {
          style: {
            source0: 0,
            source1: o.style.source1 > 0 ? 360 : -360,
            target0: 0,
            target1: o.style.target1 > 0 ? 360 : -360,
          },
        });
      var n = o.style.source0,
        a = o.style.source1,
        h = o.style.target0,
        l = o.style.target1;
      e.style && i(o, e, "source0", "source1", "target0", "target1"),
        t.addShape(o),
        t
          .animate(o.id, "style")
          .when(s, { source0: n, source1: a, target0: h, target1: l })
          .start(r);
    }
    function d(t, e, i, o, s) {
      e || (e = { style: { angle: i.style.startAngle } });
      var r = i.style.angle;
      (i.style.angle = e.style.angle),
        t.addShape(i),
        t.animate(i.id, "style").when(o, { angle: r }).start(s);
    }
    function c(t, e, i, s, r, n) {
      if (
        ((i.style._x = i.style.x),
        (i.style._y = i.style.y),
        (i.style._width = i.style.width),
        (i.style._height = i.style.height),
        e)
      )
        o(t, e, i, s, r);
      else {
        var a = i._x || 0,
          h = i._y || 0;
        (i.scale = [0.01, 0.01, a, h]),
          t.addShape(i),
          t
            .animate(i.id, "")
            .delay(n)
            .when(s, { scale: [1, 1, a, h] })
            .start(r || "QuinticOut");
      }
    }
    function p(t, e, o, s, r) {
      e ||
        (e = {
          style: {
            xStart: o.style.xStart,
            yStart: o.style.yStart,
            xEnd: o.style.xStart,
            yEnd: o.style.yStart,
          },
        });
      var n = o.style.xStart,
        a = o.style.xEnd,
        h = o.style.yStart,
        l = o.style.yEnd;
      i(o, e, "xStart", "xEnd", "yStart", "yEnd"),
        t.addShape(o),
        t
          .animate(o.id, "style")
          .when(s, { xStart: n, xEnd: a, yStart: h, yEnd: l })
          .start(r);
    }
    function u(t, e, i, o, s) {
      i.style.smooth
        ? e
          ? t.addShape(i)
          : ((i.style.pointListLength = 1),
            t.addShape(i),
            (i.style.pointList = i.style.pointList || i.getPointList(i.style)),
            t
              .animate(i.id, "style")
              .when(o, { pointListLength: i.style.pointList.length })
              .start(s || "QuinticOut"))
        : ((i.style.pointList = e
            ? e.style.pointList
            : [
                [i.style.xStart, i.style.yStart],
                [i.style.xStart, i.style.yStart],
              ]),
          t.addShape(i),
          t
            .animate(i.id, "style")
            .when(o, {
              pointList: [
                [i.style.xStart, i.style.yStart],
                [i._x || 0, i._y || 0],
              ],
            })
            .start(s || "QuinticOut"));
    }
    var g = t("zrender/tool/util");
    return {
      pointList: e,
      rectangle: o,
      candle: s,
      ring: r,
      sector: n,
      text: a,
      polygon: h,
      ribbon: l,
      gaugePointer: d,
      icon: c,
      line: p,
      markline: u,
    };
  }),
  define("echarts/util/ecEffect", [
    "require",
    "../util/ecData",
    "zrender/shape/Circle",
    "zrender/shape/Image",
    "../util/shape/Icon",
    "../util/shape/Symbol",
  ], function (t) {
    function e(t, e, i, o) {
      var r,
        h = i.effect,
        l = h.color || i.style.strokeColor || i.style.color,
        d = h.shadowColor || l,
        c = h.scaleSize,
        p = h.bounceDistance,
        u = "undefined" != typeof h.shadowBlur ? h.shadowBlur : c;
      "image" !== i.type
        ? ((r = new a({
            zlevel: o,
            style: {
              brushType: "stroke",
              iconType:
                "droplet" != i.style.iconType ? i.style.iconType : "circle",
              x: u + 1,
              y: u + 1,
              n: i.style.n,
              width: i.style._width * c,
              height: i.style._height * c,
              lineWidth: 1,
              strokeColor: l,
              shadowColor: d,
              shadowBlur: u,
            },
            draggable: !1,
            hoverable: !1,
          })),
          "pin" == i.style.iconType &&
            (r.style.y += (r.style.height / 2) * 1.5),
          (r.style.image = t.shapeToImage(
            r,
            r.style.width + 2 * u + 2,
            r.style.height + 2 * u + 2
          ).style.image),
          (r = new n({
            zlevel: r.zlevel,
            style: r.style,
            draggable: !1,
            hoverable: !1,
          })))
        : (r = new n({
            zlevel: o,
            style: i.style,
            draggable: !1,
            hoverable: !1,
          })),
        s.clone(i, r),
        (r.position = i.position),
        e.push(r),
        t.addShape(r);
      var g = "image" !== i.type ? window.devicePixelRatio || 1 : 1,
        f = (r.style.width / g - i.style._width) / 2;
      (r.style.x = i.style._x - f),
        (r.style.y = i.style._y - f),
        "pin" == i.style.iconType && (r.style.y -= (i.style.height / 2) * 1.5);
      var m = 100 * (h.period + 10 * Math.random());
      t.modShape(i.id, { invisible: !0 });
      var y = r.style.x + r.style.width / 2 / g,
        _ = r.style.y + r.style.height / 2 / g;
      "scale" === h.type
        ? (t.modShape(r.id, { scale: [0.1, 0.1, y, _] }),
          t
            .animate(r.id, "", h.loop)
            .when(m, { scale: [1, 1, y, _] })
            .done(function () {
              (i.effect.show = !1), t.delShape(r.id);
            })
            .start())
        : t
            .animate(r.id, "style", h.loop)
            .when(m, { y: r.style.y - p })
            .when(2 * m, { y: r.style.y })
            .done(function () {
              (i.effect.show = !1), t.delShape(r.id);
            })
            .start();
    }
    function i(t, e, i, o) {
      var s = i.effect,
        r = s.color || i.style.strokeColor || i.style.color,
        n = s.scaleSize,
        a = s.shadowColor || r,
        l = "undefined" != typeof s.shadowBlur ? s.shadowBlur : 2 * n,
        d = window.devicePixelRatio || 1,
        c = new h({
          zlevel: o,
          position: i.position,
          scale: i.scale,
          style: {
            pointList: i.style.pointList,
            iconType: i.style.iconType,
            color: r,
            strokeColor: r,
            shadowColor: a,
            shadowBlur: l * d,
            random: !0,
            brushType: "fill",
            lineWidth: 1,
            size: i.style.size,
          },
          draggable: !1,
          hoverable: !1,
        });
      e.push(c), t.addShape(c), t.modShape(i.id, { invisible: !0 });
      for (
        var p = Math.round(100 * s.period), u = {}, g = {}, f = 0;
        20 > f;
        f++
      )
        (c.style["randomMap" + f] = 0),
          (u = {}),
          (u["randomMap" + f] = 100),
          (g = {}),
          (g["randomMap" + f] = 0),
          (c.style["randomMap" + f] = 100 * Math.random()),
          t
            .animate(c.id, "style", !0)
            .when(p, u)
            .when(2 * p, g)
            .when(3 * p, u)
            .when(4 * p, u)
            .delay(Math.random() * p * f)
            .start();
    }
    function o(t, e, i, o) {
      var a,
        h = i.effect,
        l = h.color || i.style.strokeColor || i.style.color,
        d = h.shadowColor || i.style.strokeColor || l,
        c = i.style.lineWidth * h.scaleSize,
        p = "undefined" != typeof h.shadowBlur ? h.shadowBlur : c,
        u = new r({
          zlevel: o,
          style: { x: p, y: p, r: c, color: l, shadowColor: d, shadowBlur: p },
          draggable: !1,
          hoverable: !1,
        });
      (u.style.image = t.shapeToImage(u, 2 * (c + p), 2 * (c + p)).style.image),
        (u = new n({
          zlevel: u.zlevel,
          style: u.style,
          draggable: !1,
          hoverable: !1,
        })),
        (a = p),
        s.clone(i, u),
        (u.position = i.position),
        e.push(u),
        t.addShape(u),
        (u.style.x = i.style.xStart - a),
        (u.style.y = i.style.yStart - a);
      var g =
          (i.style.xStart - i.style.xEnd) * (i.style.xStart - i.style.xEnd) +
          (i.style.yStart - i.style.yEnd) * (i.style.yStart - i.style.yEnd),
        f = Math.round(Math.sqrt(Math.round(g * h.period * h.period)));
      if (i.style.smooth) {
        var m = i.style.pointList || i.getPointList(i.style),
          y = m.length;
        f = Math.round(f / y);
        for (
          var _ = t.animate(u.id, "style", h.loop), v = Math.ceil(y / 8), x = 0;
          y - v > x;
          x += v
        )
          _.when(f * (x + 1), { x: m[x][0] - a, y: m[x][1] - a });
        _.when(f * y, { x: m[y - 1][0] - a, y: m[y - 1][1] - a }),
          _.done(function () {
            (i.effect.show = !1), t.delShape(u.id);
          }),
          _.start("spline");
      } else
        t.animate(u.id, "style", h.loop)
          .when(f, { x: i._x - a, y: i._y - a })
          .done(function () {
            (i.effect.show = !1), t.delShape(u.id);
          })
          .start();
    }
    var s = t("../util/ecData"),
      r = t("zrender/shape/Circle"),
      n = t("zrender/shape/Image"),
      a = t("../util/shape/Icon"),
      h = t("../util/shape/Symbol");
    return { point: e, largePoint: i, line: o };
  }),
  define("echarts/component/base", [
    "require",
    "../config",
    "../util/ecQuery",
    "../util/number",
    "zrender/tool/util",
  ], function (t) {
    function e(t, e, i, o, s) {
      (this.ecTheme = t),
        (this.messageCenter = e),
        (this.zr = i),
        (this.option = o),
        (this.series = o.series),
        (this.myChart = s),
        (this.component = s.component),
        (this.shapeList = []),
        (this.effectList = []);
    }
    var i = t("../config"),
      o = t("../util/ecQuery"),
      s = t("../util/number"),
      r = t("zrender/tool/util");
    return (
      (e.prototype = {
        canvasSupported: !0,
        _getZ: function (t) {
          var e = this.ecTheme[this.type];
          return e && null != e[t]
            ? e[t]
            : ((e = i[this.type]), e && null != e[t] ? e[t] : 0);
        },
        getZlevelBase: function () {
          return this._getZ("zlevel");
        },
        getZBase: function () {
          return this._getZ("z");
        },
        reformOption: function (t) {
          return r.merge(
            r.merge(t || {}, r.clone(this.ecTheme[this.type] || {})),
            r.clone(i[this.type] || {})
          );
        },
        reformCssArray: function (t) {
          if (!(t instanceof Array)) return [t, t, t, t];
          switch (t.length + "") {
            case "4":
              return t;
            case "3":
              return [t[0], t[1], t[2], t[1]];
            case "2":
              return [t[0], t[1], t[0], t[1]];
            case "1":
              return [t[0], t[0], t[0], t[0]];
            case "0":
              return [0, 0, 0, 0];
          }
        },
        getShapeById: function (t) {
          for (var e = 0, i = this.shapeList.length; i > e; e++)
            if (this.shapeList[e].id === t) return this.shapeList[e];
          return null;
        },
        getFont: function (t) {
          var e = this.getTextStyle(r.clone(t));
          return (
            e.fontStyle +
            " " +
            e.fontWeight +
            " " +
            e.fontSize +
            "px " +
            e.fontFamily
          );
        },
        getTextStyle: function (t) {
          return r.merge(r.merge(t || {}, this.ecTheme.textStyle), i.textStyle);
        },
        getItemStyleColor: function (t, e, i, o) {
          return "function" == typeof t
            ? t.call(this.myChart, {
                seriesIndex: e,
                series: this.series[e],
                dataIndex: i,
                data: o,
              })
            : t;
        },
        getDataFromOption: function (t, e) {
          return null != t ? (null != t.value ? t.value : t) : e;
        },
        subPixelOptimize: function (t, e) {
          return (t = e % 2 === 1 ? Math.floor(t) + 0.5 : Math.round(t));
        },
        resize: function () {
          this.refresh && this.refresh(),
            this.clearEffectShape && this.clearEffectShape(!0);
          var t = this;
          setTimeout(function () {
            t.animationEffect && t.animationEffect();
          }, 200);
        },
        clear: function () {
          this.clearEffectShape && this.clearEffectShape(),
            this.zr && this.zr.delShape(this.shapeList),
            (this.shapeList = []);
        },
        dispose: function () {
          this.onbeforDispose && this.onbeforDispose(),
            this.clear(),
            (this.shapeList = null),
            (this.effectList = null),
            this.onafterDispose && this.onafterDispose();
        },
        query: o.query,
        deepQuery: o.deepQuery,
        deepMerge: o.deepMerge,
        parsePercent: s.parsePercent,
        parseCenter: s.parseCenter,
        parseRadius: s.parseRadius,
        numAddCommas: s.addCommas,
      }),
      e
    );
  }),
  define("zrender/shape/Star", [
    "require",
    "../tool/math",
    "./Base",
    "../tool/util",
  ], function (t) {
    var e = t("../tool/math"),
      i = e.sin,
      o = e.cos,
      s = Math.PI,
      r = t("./Base"),
      n = function (t) {
        r.call(this, t);
      };
    return (
      (n.prototype = {
        type: "star",
        buildPath: function (t, e) {
          var r = e.n;
          if (r && !(2 > r)) {
            var n = e.x,
              a = e.y,
              h = e.r,
              l = e.r0;
            null == l && (l = r > 4 ? (h * o((2 * s) / r)) / o(s / r) : h / 3);
            var d = s / r,
              c = -s / 2,
              p = n + h * o(c),
              u = a + h * i(c);
            c += d;
            var g = (e.pointList = []);
            g.push([p, u]);
            for (var f, m = 0, y = 2 * r - 1; y > m; m++)
              (f = m % 2 === 0 ? l : h),
                g.push([n + f * o(c), a + f * i(c)]),
                (c += d);
            g.push([p, u]), t.moveTo(g[0][0], g[0][1]);
            for (var m = 0; m < g.length; m++) t.lineTo(g[m][0], g[m][1]);
            t.closePath();
          }
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
      t("../tool/util").inherits(n, r),
      n
    );
  }),
  define("zrender/shape/Heart", [
    "require",
    "./Base",
    "./util/PathProxy",
    "../tool/util",
  ], function (t) {
    "use strict";
    var e = t("./Base"),
      i = t("./util/PathProxy"),
      o = function (t) {
        e.call(this, t), (this._pathProxy = new i());
      };
    return (
      (o.prototype = {
        type: "heart",
        buildPath: function (t, e) {
          var o = this._pathProxy || new i();
          o.begin(t),
            o.moveTo(e.x, e.y),
            o.bezierCurveTo(
              e.x + e.a / 2,
              e.y - (2 * e.b) / 3,
              e.x + 2 * e.a,
              e.y + e.b / 3,
              e.x,
              e.y + e.b
            ),
            o.bezierCurveTo(
              e.x - 2 * e.a,
              e.y + e.b / 3,
              e.x - e.a / 2,
              e.y - (2 * e.b) / 3,
              e.x,
              e.y
            ),
            o.closePath();
        },
        getRect: function (t) {
          return t.__rect
            ? t.__rect
            : (this._pathProxy.isEmpty() || this.buildPath(null, t),
              this._pathProxy.fastBoundingRect());
        },
      }),
      t("../tool/util").inherits(o, e),
      o
    );
  }),
  define("zrender/shape/Droplet", [
    "require",
    "./Base",
    "./util/PathProxy",
    "../tool/util",
  ], function (t) {
    "use strict";
    var e = t("./Base"),
      i = t("./util/PathProxy"),
      o = function (t) {
        e.call(this, t), (this._pathProxy = new i());
      };
    return (
      (o.prototype = {
        type: "droplet",
        buildPath: function (t, e) {
          var o = this._pathProxy || new i();
          o.begin(t),
            o.moveTo(e.x, e.y + e.a),
            o.bezierCurveTo(
              e.x + e.a,
              e.y + e.a,
              e.x + (3 * e.a) / 2,
              e.y - e.a / 3,
              e.x,
              e.y - e.b
            ),
            o.bezierCurveTo(
              e.x - (3 * e.a) / 2,
              e.y - e.a / 3,
              e.x - e.a,
              e.y + e.a,
              e.x,
              e.y + e.a
            ),
            o.closePath();
        },
        getRect: function (t) {
          return t.__rect
            ? t.__rect
            : (this._pathProxy.isEmpty() || this.buildPath(null, t),
              this._pathProxy.fastBoundingRect());
        },
      }),
      t("../tool/util").inherits(o, e),
      o
    );
  }),
  define("zrender/tool/math", [], function () {
    function t(t, e) {
      return Math.sin(e ? t * s : t);
    }
    function e(t, e) {
      return Math.cos(e ? t * s : t);
    }
    function i(t) {
      return t * s;
    }
    function o(t) {
      return t / s;
    }
    var s = Math.PI / 180;
    return { sin: t, cos: e, degreeToRadian: i, radianToDegree: o };
  }),
  define("zrender/shape/util/PathProxy", [
    "require",
    "../../tool/vector",
  ], function (t) {
    var e = t("../../tool/vector"),
      i = function (t, e) {
        (this.command = t), (this.points = e || null);
      },
      o = function () {
        (this.pathCommands = []),
          (this._ctx = null),
          (this._min = []),
          (this._max = []);
      };
    return (
      (o.prototype.fastBoundingRect = function () {
        var t = this._min,
          i = this._max;
        (t[0] = t[1] = 1 / 0), (i[0] = i[1] = -1 / 0);
        for (var o = 0; o < this.pathCommands.length; o++) {
          var s = this.pathCommands[o],
            r = s.points;
          switch (s.command) {
            case "M":
              e.min(t, t, r), e.max(i, i, r);
              break;
            case "L":
              e.min(t, t, r), e.max(i, i, r);
              break;
            case "C":
              for (var n = 0; 6 > n; n += 2)
                (t[0] = Math.min(t[0], t[0], r[n])),
                  (t[1] = Math.min(t[1], t[1], r[n + 1])),
                  (i[0] = Math.max(i[0], i[0], r[n])),
                  (i[1] = Math.max(i[1], i[1], r[n + 1]));
              break;
            case "Q":
              for (var n = 0; 4 > n; n += 2)
                (t[0] = Math.min(t[0], t[0], r[n])),
                  (t[1] = Math.min(t[1], t[1], r[n + 1])),
                  (i[0] = Math.max(i[0], i[0], r[n])),
                  (i[1] = Math.max(i[1], i[1], r[n + 1]));
              break;
            case "A":
              var a = r[0],
                h = r[1],
                l = r[2],
                d = r[3];
              (t[0] = Math.min(t[0], t[0], a - l)),
                (t[1] = Math.min(t[1], t[1], h - d)),
                (i[0] = Math.max(i[0], i[0], a + l)),
                (i[1] = Math.max(i[1], i[1], h + d));
          }
        }
        return { x: t[0], y: t[1], width: i[0] - t[0], height: i[1] - t[1] };
      }),
      (o.prototype.begin = function (t) {
        return (this._ctx = t || null), (this.pathCommands.length = 0), this;
      }),
      (o.prototype.moveTo = function (t, e) {
        return (
          this.pathCommands.push(new i("M", [t, e])),
          this._ctx && this._ctx.moveTo(t, e),
          this
        );
      }),
      (o.prototype.lineTo = function (t, e) {
        return (
          this.pathCommands.push(new i("L", [t, e])),
          this._ctx && this._ctx.lineTo(t, e),
          this
        );
      }),
      (o.prototype.bezierCurveTo = function (t, e, o, s, r, n) {
        return (
          this.pathCommands.push(new i("C", [t, e, o, s, r, n])),
          this._ctx && this._ctx.bezierCurveTo(t, e, o, s, r, n),
          this
        );
      }),
      (o.prototype.quadraticCurveTo = function (t, e, o, s) {
        return (
          this.pathCommands.push(new i("Q", [t, e, o, s])),
          this._ctx && this._ctx.quadraticCurveTo(t, e, o, s),
          this
        );
      }),
      (o.prototype.arc = function (t, e, o, s, r, n) {
        return (
          this.pathCommands.push(
            new i("A", [t, e, o, o, s, r - s, 0, n ? 0 : 1])
          ),
          this._ctx && this._ctx.arc(t, e, o, s, r, n),
          this
        );
      }),
      (o.prototype.arcTo = function (t, e, i, o, s) {
        return this._ctx && this._ctx.arcTo(t, e, i, o, s), this;
      }),
      (o.prototype.rect = function (t, e, i, o) {
        return this._ctx && this._ctx.rect(t, e, i, o), this;
      }),
      (o.prototype.closePath = function () {
        return (
          this.pathCommands.push(new i("z")),
          this._ctx && this._ctx.closePath(),
          this
        );
      }),
      (o.prototype.isEmpty = function () {
        return 0 === this.pathCommands.length;
      }),
      (o.PathSegment = i),
      o
    );
  }),
  define("zrender/shape/Line", [
    "require",
    "./Base",
    "./util/dashedLineTo",
    "../tool/util",
  ], function (t) {
    var e = t("./Base"),
      i = t("./util/dashedLineTo"),
      o = function (t) {
        (this.brushTypeOnly = "stroke"),
          (this.textPosition = "end"),
          e.call(this, t);
      };
    return (
      (o.prototype = {
        type: "line",
        buildPath: function (t, e) {
          if (e.lineType && "solid" != e.lineType) {
            if ("dashed" == e.lineType || "dotted" == e.lineType) {
              var o = (e.lineWidth || 1) * ("dashed" == e.lineType ? 5 : 1);
              i(t, e.xStart, e.yStart, e.xEnd, e.yEnd, o);
            }
          } else t.moveTo(e.xStart, e.yStart), t.lineTo(e.xEnd, e.yEnd);
        },
        getRect: function (t) {
          if (t.__rect) return t.__rect;
          var e = t.lineWidth || 1;
          return (
            (t.__rect = {
              x: Math.min(t.xStart, t.xEnd) - e,
              y: Math.min(t.yStart, t.yEnd) - e,
              width: Math.abs(t.xStart - t.xEnd) + e,
              height: Math.abs(t.yStart - t.yEnd) + e,
            }),
            t.__rect
          );
        },
      }),
      t("../tool/util").inherits(o, e),
      o
    );
  }),
  define("zrender/shape/Polyline", [
    "require",
    "./Base",
    "./util/smoothSpline",
    "./util/smoothBezier",
    "./util/dashedLineTo",
    "./Polygon",
    "../tool/util",
  ], function (t) {
    var e = t("./Base"),
      i = t("./util/smoothSpline"),
      o = t("./util/smoothBezier"),
      s = t("./util/dashedLineTo"),
      r = function (t) {
        (this.brushTypeOnly = "stroke"),
          (this.textPosition = "end"),
          e.call(this, t);
      };
    return (
      (r.prototype = {
        type: "polyline",
        buildPath: function (t, e) {
          var r = e.pointList;
          if (!(r.length < 2)) {
            var n = Math.min(
              e.pointList.length,
              Math.round(e.pointListLength || e.pointList.length)
            );
            if (e.smooth && "spline" !== e.smooth) {
              var a = o(r, e.smooth, !1, e.smoothConstraint);
              t.moveTo(r[0][0], r[0][1]);
              for (var h, l, d, c = 0; n - 1 > c; c++)
                (h = a[2 * c]),
                  (l = a[2 * c + 1]),
                  (d = r[c + 1]),
                  t.bezierCurveTo(h[0], h[1], l[0], l[1], d[0], d[1]);
            } else if (
              ("spline" === e.smooth && ((r = i(r)), (n = r.length)),
              e.lineType && "solid" != e.lineType)
            ) {
              if ("dashed" == e.lineType || "dotted" == e.lineType) {
                var p = (e.lineWidth || 1) * ("dashed" == e.lineType ? 5 : 1);
                t.moveTo(r[0][0], r[0][1]);
                for (var c = 1; n > c; c++)
                  s(t, r[c - 1][0], r[c - 1][1], r[c][0], r[c][1], p);
              }
            } else {
              t.moveTo(r[0][0], r[0][1]);
              for (var c = 1; n > c; c++) t.lineTo(r[c][0], r[c][1]);
            }
          }
        },
        getRect: function (e) {
          return t("./Polygon").prototype.getRect(e);
        },
      }),
      t("../tool/util").inherits(r, e),
      r
    );
  }),
  define("zrender/shape/util/dashedLineTo", [], function () {
    var t = [5, 5];
    return function (e, i, o, s, r, n) {
      if (e.setLineDash)
        return (
          (t[0] = t[1] = n),
          e.setLineDash(t),
          e.moveTo(i, o),
          void e.lineTo(s, r)
        );
      n = "number" != typeof n ? 5 : n;
      var a = s - i,
        h = r - o,
        l = Math.floor(Math.sqrt(a * a + h * h) / n);
      (a /= l), (h /= l);
      for (var d = !0, c = 0; l > c; ++c)
        d ? e.moveTo(i, o) : e.lineTo(i, o), (d = !d), (i += a), (o += h);
      e.lineTo(s, r);
    };
  }),
  define("zrender/shape/util/smoothSpline", [
    "require",
    "../../tool/vector",
  ], function (t) {
    function e(t, e, i, o, s, r, n) {
      var a = 0.5 * (i - t),
        h = 0.5 * (o - e);
      return (
        (2 * (e - i) + a + h) * n + (-3 * (e - i) - 2 * a - h) * r + a * s + e
      );
    }
    var i = t("../../tool/vector");
    return function (t, o) {
      for (var s = t.length, r = [], n = 0, a = 1; s > a; a++)
        n += i.distance(t[a - 1], t[a]);
      var h = n / 5;
      h = s > h ? s : h;
      for (var a = 0; h > a; a++) {
        var l,
          d,
          c,
          p = (a / (h - 1)) * (o ? s : s - 1),
          u = Math.floor(p),
          g = p - u,
          f = t[u % s];
        o
          ? ((l = t[(u - 1 + s) % s]),
            (d = t[(u + 1) % s]),
            (c = t[(u + 2) % s]))
          : ((l = t[0 === u ? u : u - 1]),
            (d = t[u > s - 2 ? s - 1 : u + 1]),
            (c = t[u > s - 3 ? s - 1 : u + 2]));
        var m = g * g,
          y = g * m;
        r.push([
          e(l[0], f[0], d[0], c[0], g, m, y),
          e(l[1], f[1], d[1], c[1], g, m, y),
        ]);
      }
      return r;
    };
  }),
  define("zrender/shape/util/smoothBezier", [
    "require",
    "../../tool/vector",
  ], function (t) {
    var e = t("../../tool/vector");
    return function (t, i, o, s) {
      var r,
        n,
        a,
        h,
        l = [],
        d = [],
        c = [],
        p = [],
        u = !!s;
      if (u) {
        (a = [1 / 0, 1 / 0]), (h = [-1 / 0, -1 / 0]);
        for (var g = 0, f = t.length; f > g; g++)
          e.min(a, a, t[g]), e.max(h, h, t[g]);
        e.min(a, a, s[0]), e.max(h, h, s[1]);
      }
      for (var g = 0, f = t.length; f > g; g++) {
        var r,
          n,
          m = t[g];
        if (o) (r = t[g ? g - 1 : f - 1]), (n = t[(g + 1) % f]);
        else {
          if (0 === g || g === f - 1) {
            l.push(t[g]);
            continue;
          }
          (r = t[g - 1]), (n = t[g + 1]);
        }
        e.sub(d, n, r), e.scale(d, d, i);
        var y = e.distance(m, r),
          _ = e.distance(m, n),
          v = y + _;
        0 !== v && ((y /= v), (_ /= v)), e.scale(c, d, -y), e.scale(p, d, _);
        var x = e.add([], m, c),
          b = e.add([], m, p);
        u && (e.max(x, x, a), e.min(x, x, h), e.max(b, b, a), e.min(b, b, h)),
          l.push(x),
          l.push(b);
      }
      return o && l.push(l.shift()), l;
    };
  }),
  define("zrender/shape/Polygon", [
    "require",
    "./Base",
    "./util/smoothSpline",
    "./util/smoothBezier",
    "./util/dashedLineTo",
    "../tool/util",
  ], function (t) {
    var e = t("./Base"),
      i = t("./util/smoothSpline"),
      o = t("./util/smoothBezier"),
      s = t("./util/dashedLineTo"),
      r = function (t) {
        e.call(this, t);
      };
    return (
      (r.prototype = {
        type: "polygon",
        buildPath: function (t, e) {
          var r = e.pointList;
          if (!(r.length < 2)) {
            if (e.smooth && "spline" !== e.smooth) {
              var n = o(r, e.smooth, !0, e.smoothConstraint);
              t.moveTo(r[0][0], r[0][1]);
              for (var a, h, l, d = r.length, c = 0; d > c; c++)
                (a = n[2 * c]),
                  (h = n[2 * c + 1]),
                  (l = r[(c + 1) % d]),
                  t.bezierCurveTo(a[0], a[1], h[0], h[1], l[0], l[1]);
            } else if (
              ("spline" === e.smooth && (r = i(r, !0)),
              e.lineType && "solid" != e.lineType)
            ) {
              if ("dashed" == e.lineType || "dotted" == e.lineType) {
                var p =
                  e._dashLength ||
                  (e.lineWidth || 1) * ("dashed" == e.lineType ? 5 : 1);
                (e._dashLength = p), t.moveTo(r[0][0], r[0][1]);
                for (var c = 1, u = r.length; u > c; c++)
                  s(t, r[c - 1][0], r[c - 1][1], r[c][0], r[c][1], p);
                s(
                  t,
                  r[r.length - 1][0],
                  r[r.length - 1][1],
                  r[0][0],
                  r[0][1],
                  p
                );
              }
            } else {
              t.moveTo(r[0][0], r[0][1]);
              for (var c = 1, u = r.length; u > c; c++)
                t.lineTo(r[c][0], r[c][1]);
              t.lineTo(r[0][0], r[0][1]);
            }
            t.closePath();
          }
        },
        getRect: function (t) {
          if (t.__rect) return t.__rect;
          for (
            var e = Number.MAX_VALUE,
              i = Number.MIN_VALUE,
              o = Number.MAX_VALUE,
              s = Number.MIN_VALUE,
              r = t.pointList,
              n = 0,
              a = r.length;
            a > n;
            n++
          )
            r[n][0] < e && (e = r[n][0]),
              r[n][0] > i && (i = r[n][0]),
              r[n][1] < o && (o = r[n][1]),
              r[n][1] > s && (s = r[n][1]);
          var h;
          return (
            (h =
              "stroke" == t.brushType || "fill" == t.brushType
                ? t.lineWidth || 1
                : 0),
            (t.__rect = {
              x: Math.round(e - h / 2),
              y: Math.round(o - h / 2),
              width: i - e + h,
              height: s - o + h,
            }),
            t.__rect
          );
        },
      }),
      t("../tool/util").inherits(r, e),
      r
    );
  }),
  define("echarts/util/shape/normalIsCover", [], function () {
    return function (t, e) {
      var i = this.getTansform(t, e);
      (t = i[0]), (e = i[1]);
      var o = this.style.__rect;
      return (
        o || (o = this.style.__rect = this.getRect(this.style)),
        t >= o.x && t <= o.x + o.width && e >= o.y && e <= o.y + o.height
      );
    };
  }),
  define("echarts/util/ecQuery", ["require", "zrender/tool/util"], function (
    t
  ) {
    function e(t, e) {
      if ("undefined" != typeof t) {
        if (!e) return t;
        e = e.split(".");
        for (var i = e.length, o = 0; i > o; ) {
          if (((t = t[e[o]]), "undefined" == typeof t)) return;
          o++;
        }
        return t;
      }
    }
    function i(t, i) {
      for (var o, s = 0, r = t.length; r > s; s++)
        if (((o = e(t[s], i)), "undefined" != typeof o)) return o;
    }
    function o(t, i) {
      for (var o, r = t.length; r--; ) {
        var n = e(t[r], i);
        "undefined" != typeof n &&
          ("undefined" == typeof o ? (o = s.clone(n)) : s.merge(o, n, !0));
      }
      return o;
    }
    var s = t("zrender/tool/util");
    return { query: e, deepQuery: i, deepMerge: o };
  }),
  define("echarts/util/number", [], function () {
    function t(t) {
      return t.replace(/^\s+/, "").replace(/\s+$/, "");
    }
    function e(e, i) {
      return "string" == typeof e
        ? t(e).match(/%$/)
          ? (parseFloat(e) / 100) * i
          : parseFloat(e)
        : e;
    }
    function i(t, i) {
      return [e(i[0], t.getWidth()), e(i[1], t.getHeight())];
    }
    function o(t, i) {
      i instanceof Array || (i = [0, i]);
      var o = Math.min(t.getWidth(), t.getHeight()) / 2;
      return [e(i[0], o), e(i[1], o)];
    }
    function s(t) {
      return isNaN(t)
        ? "-"
        : ((t = (t + "").split(".")),
          t[0].replace(/(\d{1,3})(?=(?:\d{3})+(?!\d))/g, "$1,") +
            (t.length > 1 ? "." + t[1] : ""));
    }
    return { parsePercent: e, parseCenter: i, parseRadius: o, addCommas: s };
  }),
  define("echarts/util/shape/Cross", [
    "require",
    "zrender/shape/Base",
    "zrender/shape/Line",
    "zrender/tool/util",
    "./normalIsCover",
  ], function (t) {
    function e(t) {
      i.call(this, t);
    }
    var i = t("zrender/shape/Base"),
      o = t("zrender/shape/Line"),
      s = t("zrender/tool/util");
    return (
      (e.prototype = {
        type: "cross",
        buildPath: function (t, e) {
          var i = e.rect;
          (e.xStart = i.x),
            (e.xEnd = i.x + i.width),
            (e.yStart = e.yEnd = e.y),
            o.prototype.buildPath(t, e),
            (e.xStart = e.xEnd = e.x),
            (e.yStart = i.y),
            (e.yEnd = i.y + i.height),
            o.prototype.buildPath(t, e);
        },
        getRect: function (t) {
          return t.rect;
        },
        isCover: t("./normalIsCover"),
      }),
      s.inherits(e, i),
      e
    );
  }),
  define("zrender/shape/Sector", [
    "require",
    "../tool/math",
    "../tool/computeBoundingBox",
    "../tool/vector",
    "./Base",
    "../tool/util",
  ], function (t) {
    var e = t("../tool/math"),
      i = t("../tool/computeBoundingBox"),
      o = t("../tool/vector"),
      s = t("./Base"),
      r = o.create(),
      n = o.create(),
      a = o.create(),
      h = o.create(),
      l = function (t) {
        s.call(this, t);
      };
    return (
      (l.prototype = {
        type: "sector",
        buildPath: function (t, i) {
          var o = i.x,
            s = i.y,
            r = i.r0 || 0,
            n = i.r,
            a = i.startAngle,
            h = i.endAngle,
            l = i.clockWise || !1;
          (a = e.degreeToRadian(a)),
            (h = e.degreeToRadian(h)),
            l || ((a = -a), (h = -h));
          var d = e.cos(a),
            c = e.sin(a);
          t.moveTo(d * r + o, c * r + s),
            t.lineTo(d * n + o, c * n + s),
            t.arc(o, s, n, a, h, !l),
            t.lineTo(e.cos(h) * r + o, e.sin(h) * r + s),
            0 !== r && t.arc(o, s, r, h, a, l),
            t.closePath();
        },
        getRect: function (t) {
          if (t.__rect) return t.__rect;
          var s = t.x,
            l = t.y,
            d = t.r0 || 0,
            c = t.r,
            p = e.degreeToRadian(t.startAngle),
            u = e.degreeToRadian(t.endAngle),
            g = t.clockWise;
          return (
            g || ((p = -p), (u = -u)),
            d > 1
              ? i.arc(s, l, d, p, u, !g, r, a)
              : ((r[0] = a[0] = s), (r[1] = a[1] = l)),
            i.arc(s, l, c, p, u, !g, n, h),
            o.min(r, r, n),
            o.max(a, a, h),
            (t.__rect = {
              x: r[0],
              y: r[1],
              width: a[0] - r[0],
              height: a[1] - r[1],
            }),
            t.__rect
          );
        },
      }),
      t("../tool/util").inherits(l, s),
      l
    );
  }),
  define("echarts/util/shape/Candle", [
    "require",
    "zrender/shape/Base",
    "zrender/tool/util",
    "./normalIsCover",
  ], function (t) {
    function e(t) {
      i.call(this, t);
    }
    var i = t("zrender/shape/Base"),
      o = t("zrender/tool/util");
    return (
      (e.prototype = {
        type: "candle",
        _numberOrder: function (t, e) {
          return e - t;
        },
        buildPath: function (t, e) {
          var i = o.clone(e.y).sort(this._numberOrder);
          t.moveTo(e.x, i[3]),
            t.lineTo(e.x, i[2]),
            t.moveTo(e.x - e.width / 2, i[2]),
            t.rect(e.x - e.width / 2, i[2], e.width, i[1] - i[2]),
            t.moveTo(e.x, i[1]),
            t.lineTo(e.x, i[0]);
        },
        getRect: function (t) {
          if (!t.__rect) {
            var e = 0;
            ("stroke" == t.brushType || "fill" == t.brushType) &&
              (e = t.lineWidth || 1);
            var i = o.clone(t.y).sort(this._numberOrder);
            t.__rect = {
              x: Math.round(t.x - t.width / 2 - e / 2),
              y: Math.round(i[3] - e / 2),
              width: t.width + e,
              height: i[0] - i[3] + e,
            };
          }
          return t.__rect;
        },
        isCover: t("./normalIsCover"),
      }),
      o.inherits(e, i),
      e
    );
  }),
  define("zrender/tool/computeBoundingBox", [
    "require",
    "./vector",
    "./curve",
  ], function (t) {
    function e(t, e, i) {
      if (0 !== t.length) {
        for (
          var o = t[0][0], s = t[0][0], r = t[0][1], n = t[0][1], a = 1;
          a < t.length;
          a++
        ) {
          var h = t[a];
          h[0] < o && (o = h[0]),
            h[0] > s && (s = h[0]),
            h[1] < r && (r = h[1]),
            h[1] > n && (n = h[1]);
        }
        (e[0] = o), (e[1] = r), (i[0] = s), (i[1] = n);
      }
    }
    function i(t, e, i, o, s, n) {
      var a = [];
      r.cubicExtrema(t[0], e[0], i[0], o[0], a);
      for (var h = 0; h < a.length; h++)
        a[h] = r.cubicAt(t[0], e[0], i[0], o[0], a[h]);
      var l = [];
      r.cubicExtrema(t[1], e[1], i[1], o[1], l);
      for (var h = 0; h < l.length; h++)
        l[h] = r.cubicAt(t[1], e[1], i[1], o[1], l[h]);
      a.push(t[0], o[0]), l.push(t[1], o[1]);
      var d = Math.min.apply(null, a),
        c = Math.max.apply(null, a),
        p = Math.min.apply(null, l),
        u = Math.max.apply(null, l);
      (s[0] = d), (s[1] = p), (n[0] = c), (n[1] = u);
    }
    function o(t, e, i, o, s) {
      var n = r.quadraticExtremum(t[0], e[0], i[0]),
        a = r.quadraticExtremum(t[1], e[1], i[1]);
      (n = Math.max(Math.min(n, 1), 0)), (a = Math.max(Math.min(a, 1), 0));
      var h = 1 - n,
        l = 1 - a,
        d = h * h * t[0] + 2 * h * n * e[0] + n * n * i[0],
        c = h * h * t[1] + 2 * h * n * e[1] + n * n * i[1],
        p = l * l * t[0] + 2 * l * a * e[0] + a * a * i[0],
        u = l * l * t[1] + 2 * l * a * e[1] + a * a * i[1];
      (o[0] = Math.min(t[0], i[0], d, p)),
        (o[1] = Math.min(t[1], i[1], c, u)),
        (s[0] = Math.max(t[0], i[0], d, p)),
        (s[1] = Math.max(t[1], i[1], c, u));
    }
    var s = t("./vector"),
      r = t("./curve"),
      n = s.create(),
      a = s.create(),
      h = s.create(),
      l = function (t, e, i, o, r, l, d, c) {
        if (Math.abs(o - r) >= 2 * Math.PI)
          return (
            (d[0] = t - i), (d[1] = e - i), (c[0] = t + i), void (c[1] = e + i)
          );
        if (
          ((n[0] = Math.cos(o) * i + t),
          (n[1] = Math.sin(o) * i + e),
          (a[0] = Math.cos(r) * i + t),
          (a[1] = Math.sin(r) * i + e),
          s.min(d, n, a),
          s.max(c, n, a),
          (o %= 2 * Math.PI),
          0 > o && (o += 2 * Math.PI),
          (r %= 2 * Math.PI),
          0 > r && (r += 2 * Math.PI),
          o > r && !l ? (r += 2 * Math.PI) : r > o && l && (o += 2 * Math.PI),
          l)
        ) {
          var p = r;
          (r = o), (o = p);
        }
        for (var u = 0; r > u; u += Math.PI / 2)
          u > o &&
            ((h[0] = Math.cos(u) * i + t),
            (h[1] = Math.sin(u) * i + e),
            s.min(d, h, d),
            s.max(c, h, c));
      };
    return (e.cubeBezier = i), (e.quadraticBezier = o), (e.arc = l), e;
  }),
  define("zrender/tool/curve", ["require", "./vector"], function (t) {
    function e(t) {
      return t > -f && f > t;
    }
    function i(t) {
      return t > f || -f > t;
    }
    function o(t, e, i, o, s) {
      var r = 1 - s;
      return r * r * (r * t + 3 * s * e) + s * s * (s * o + 3 * r * i);
    }
    function s(t, e, i, o, s) {
      var r = 1 - s;
      return 3 * (((e - t) * r + 2 * (i - e) * s) * r + (o - i) * s * s);
    }
    function r(t, i, o, s, r, n) {
      var a = s + 3 * (i - o) - t,
        h = 3 * (o - 2 * i + t),
        l = 3 * (i - t),
        d = t - r,
        c = h * h - 3 * a * l,
        p = h * l - 9 * a * d,
        u = l * l - 3 * h * d,
        g = 0;
      if (e(c) && e(p))
        if (e(h)) n[0] = 0;
        else {
          var f = -l / h;
          f >= 0 && 1 >= f && (n[g++] = f);
        }
      else {
        var _ = p * p - 4 * c * u;
        if (e(_)) {
          var v = p / c,
            f = -h / a + v,
            x = -v / 2;
          f >= 0 && 1 >= f && (n[g++] = f), x >= 0 && 1 >= x && (n[g++] = x);
        } else if (_ > 0) {
          var b = Math.sqrt(_),
            T = c * h + 1.5 * a * (-p + b),
            S = c * h + 1.5 * a * (-p - b);
          (T = 0 > T ? -Math.pow(-T, y) : Math.pow(T, y)),
            (S = 0 > S ? -Math.pow(-S, y) : Math.pow(S, y));
          var f = (-h - (T + S)) / (3 * a);
          f >= 0 && 1 >= f && (n[g++] = f);
        } else {
          var C = (2 * c * h - 3 * a * p) / (2 * Math.sqrt(c * c * c)),
            z = Math.acos(C) / 3,
            L = Math.sqrt(c),
            w = Math.cos(z),
            f = (-h - 2 * L * w) / (3 * a),
            x = (-h + L * (w + m * Math.sin(z))) / (3 * a),
            M = (-h + L * (w - m * Math.sin(z))) / (3 * a);
          f >= 0 && 1 >= f && (n[g++] = f),
            x >= 0 && 1 >= x && (n[g++] = x),
            M >= 0 && 1 >= M && (n[g++] = M);
        }
      }
      return g;
    }
    function n(t, o, s, r, n) {
      var a = 6 * s - 12 * o + 6 * t,
        h = 9 * o + 3 * r - 3 * t - 9 * s,
        l = 3 * o - 3 * t,
        d = 0;
      if (e(h)) {
        if (i(a)) {
          var c = -l / a;
          c >= 0 && 1 >= c && (n[d++] = c);
        }
      } else {
        var p = a * a - 4 * h * l;
        if (e(p)) n[0] = -a / (2 * h);
        else if (p > 0) {
          var u = Math.sqrt(p),
            c = (-a + u) / (2 * h),
            g = (-a - u) / (2 * h);
          c >= 0 && 1 >= c && (n[d++] = c), g >= 0 && 1 >= g && (n[d++] = g);
        }
      }
      return d;
    }
    function a(t, e, i, o, s, r) {
      var n = (e - t) * s + t,
        a = (i - e) * s + e,
        h = (o - i) * s + i,
        l = (a - n) * s + n,
        d = (h - a) * s + a,
        c = (d - l) * s + l;
      (r[0] = t),
        (r[1] = n),
        (r[2] = l),
        (r[3] = c),
        (r[4] = c),
        (r[5] = d),
        (r[6] = h),
        (r[7] = o);
    }
    function h(t, e, i, s, r, n, a, h, l, d, c) {
      var p,
        u = 0.005,
        m = 1 / 0;
      (_[0] = l), (_[1] = d);
      for (var y = 0; 1 > y; y += 0.05) {
        (v[0] = o(t, i, r, a, y)), (v[1] = o(e, s, n, h, y));
        var b = g.distSquare(_, v);
        m > b && ((p = y), (m = b));
      }
      m = 1 / 0;
      for (var T = 0; 32 > T && !(f > u); T++) {
        var S = p - u,
          C = p + u;
        (v[0] = o(t, i, r, a, S)), (v[1] = o(e, s, n, h, S));
        var b = g.distSquare(v, _);
        if (S >= 0 && m > b) (p = S), (m = b);
        else {
          (x[0] = o(t, i, r, a, C)), (x[1] = o(e, s, n, h, C));
          var z = g.distSquare(x, _);
          1 >= C && m > z ? ((p = C), (m = z)) : (u *= 0.5);
        }
      }
      return (
        c && ((c[0] = o(t, i, r, a, p)), (c[1] = o(e, s, n, h, p))),
        Math.sqrt(m)
      );
    }
    function l(t, e, i, o) {
      var s = 1 - o;
      return s * (s * t + 2 * o * e) + o * o * i;
    }
    function d(t, e, i, o) {
      return 2 * ((1 - o) * (e - t) + o * (i - e));
    }
    function c(t, o, s, r, n) {
      var a = t - 2 * o + s,
        h = 2 * (o - t),
        l = t - r,
        d = 0;
      if (e(a)) {
        if (i(h)) {
          var c = -l / h;
          c >= 0 && 1 >= c && (n[d++] = c);
        }
      } else {
        var p = h * h - 4 * a * l;
        if (e(p)) {
          var c = -h / (2 * a);
          c >= 0 && 1 >= c && (n[d++] = c);
        } else if (p > 0) {
          var u = Math.sqrt(p),
            c = (-h + u) / (2 * a),
            g = (-h - u) / (2 * a);
          c >= 0 && 1 >= c && (n[d++] = c), g >= 0 && 1 >= g && (n[d++] = g);
        }
      }
      return d;
    }
    function p(t, e, i) {
      var o = t + i - 2 * e;
      return 0 === o ? 0.5 : (t - e) / o;
    }
    function u(t, e, i, o, s, r, n, a, h) {
      var d,
        c = 0.005,
        p = 1 / 0;
      (_[0] = n), (_[1] = a);
      for (var u = 0; 1 > u; u += 0.05) {
        (v[0] = l(t, i, s, u)), (v[1] = l(e, o, r, u));
        var m = g.distSquare(_, v);
        p > m && ((d = u), (p = m));
      }
      p = 1 / 0;
      for (var y = 0; 32 > y && !(f > c); y++) {
        var b = d - c,
          T = d + c;
        (v[0] = l(t, i, s, b)), (v[1] = l(e, o, r, b));
        var m = g.distSquare(v, _);
        if (b >= 0 && p > m) (d = b), (p = m);
        else {
          (x[0] = l(t, i, s, T)), (x[1] = l(e, o, r, T));
          var S = g.distSquare(x, _);
          1 >= T && p > S ? ((d = T), (p = S)) : (c *= 0.5);
        }
      }
      return (
        h && ((h[0] = l(t, i, s, d)), (h[1] = l(e, o, r, d))), Math.sqrt(p)
      );
    }
    var g = t("./vector"),
      f = 1e-4,
      m = Math.sqrt(3),
      y = 1 / 3,
      _ = g.create(),
      v = g.create(),
      x = g.create();
    return {
      cubicAt: o,
      cubicDerivativeAt: s,
      cubicRootAt: r,
      cubicExtrema: n,
      cubicSubdivide: a,
      cubicProjectPoint: h,
      quadraticAt: l,
      quadraticDerivativeAt: d,
      quadraticRootAt: c,
      quadraticExtremum: p,
      quadraticProjectPoint: u,
    };
  }),
  define("echarts/util/shape/Chain", [
    "require",
    "zrender/shape/Base",
    "./Icon",
    "zrender/shape/util/dashedLineTo",
    "zrender/tool/util",
    "zrender/tool/matrix",
  ], function (t) {
    function e(t) {
      i.call(this, t);
    }
    var i = t("zrender/shape/Base"),
      o = t("./Icon"),
      s = t("zrender/shape/util/dashedLineTo"),
      r = t("zrender/tool/util"),
      n = t("zrender/tool/matrix");
    return (
      (e.prototype = {
        type: "chain",
        brush: function (t, e) {
          var i = this.style;
          e && (i = this.getHighlightStyle(i, this.highlightStyle || {})),
            t.save(),
            this.setContext(t, i),
            this.setTransform(t),
            t.save(),
            t.beginPath(),
            this.buildLinePath(t, i),
            t.stroke(),
            t.restore(),
            this.brushSymbol(t, i),
            t.restore();
        },
        buildLinePath: function (t, e) {
          var i = e.x,
            o = e.y + 5,
            r = e.width,
            n = e.height / 2 - 10;
          if (
            (t.moveTo(i, o),
            t.lineTo(i, o + n),
            t.moveTo(i + r, o),
            t.lineTo(i + r, o + n),
            t.moveTo(i, o + n / 2),
            e.lineType && "solid" != e.lineType)
          ) {
            if ("dashed" == e.lineType || "dotted" == e.lineType) {
              var a = (e.lineWidth || 1) * ("dashed" == e.lineType ? 5 : 1);
              s(t, i, o + n / 2, i + r, o + n / 2, a);
            }
          } else t.lineTo(i + r, o + n / 2);
        },
        brushSymbol: function (t, e) {
          var i = e.y + e.height / 4;
          t.save();
          for (var s, r = e.chainPoint, n = 0, a = r.length; a > n; n++) {
            if (((s = r[n]), "none" != s.symbol)) {
              t.beginPath();
              var h = s.symbolSize;
              o.prototype.buildPath(t, {
                iconType: s.symbol,
                x: s.x - h,
                y: i - h,
                width: 2 * h,
                height: 2 * h,
                n: s.n,
              }),
                (t.fillStyle = s.isEmpty ? "#fff" : e.strokeColor),
                t.closePath(),
                t.fill(),
                t.stroke();
            }
            s.showLabel &&
              ((t.font = s.textFont),
              (t.fillStyle = s.textColor),
              (t.textAlign = s.textAlign),
              (t.textBaseline = s.textBaseline),
              s.rotation
                ? (t.save(),
                  this._updateTextTransform(t, s.rotation),
                  t.fillText(s.name, s.textX, s.textY),
                  t.restore())
                : t.fillText(s.name, s.textX, s.textY));
          }
          t.restore();
        },
        _updateTextTransform: function (t, e) {
          var i = n.create();
          if ((n.identity(i), 0 !== e[0])) {
            var o = e[1] || 0,
              s = e[2] || 0;
            (o || s) && n.translate(i, i, [-o, -s]),
              n.rotate(i, i, e[0]),
              (o || s) && n.translate(i, i, [o, s]);
          }
          t.transform.apply(t, i);
        },
        isCover: function (t, e) {
          var i = this.style;
          return t >= i.x &&
            t <= i.x + i.width &&
            e >= i.y &&
            e <= i.y + i.height
            ? !0
            : !1;
        },
      }),
      r.inherits(e, i),
      e
    );
  });
