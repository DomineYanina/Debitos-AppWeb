import {
  AuthService
} from "./chunk-5ICC65UF.js";
import {
  HttpClient,
  environment
} from "./chunk-FKTKYBCK.js";
import {
  BehaviorSubject,
  Injectable,
  Subject,
  __spreadProps,
  __spreadValues,
  inject,
  interval,
  setClassMetadata,
  ɵɵdefineInjectable
} from "./chunk-IXY2MHCK.js";

// node_modules/shepherd.js/dist/js/shepherd.mjs
/*! shepherd.js 15.2.3 */
function t(t2) {
  return t2 instanceof HTMLElement;
}
function e(t2) {
  return "function" == typeof t2;
}
function n(t2) {
  return "string" == typeof t2;
}
function o(t2) {
  return void 0 === t2;
}
var i = class {
  on(t2, e2, n2, i2 = false) {
    var s2;
    return o(this.bindings) && (this.bindings = {}), o(this.bindings[t2]) && (this.bindings[t2] = []), null == (s2 = this.bindings[t2]) || s2.push({ handler: e2, ctx: n2, once: i2 }), this;
  }
  once(t2, e2, n2) {
    return this.on(t2, e2, n2, true);
  }
  off(t2, e2) {
    if (o(this.bindings) || o(this.bindings[t2])) return this;
    var n2;
    o(e2) ? delete this.bindings[t2] : null == (n2 = this.bindings[t2]) || n2.forEach((n3, o2) => {
      var i2;
      n3.handler === e2 && (null == (i2 = this.bindings[t2]) || i2.splice(o2, 1));
    });
    return this;
  }
  trigger(t2, ...e2) {
    var n2;
    !o(this.bindings) && this.bindings[t2] && (null == (n2 = this.bindings[t2]) || n2.forEach((n3, o2) => {
      const { ctx: i2, handler: s2, once: r2 } = n3, l2 = i2 || this;
      var c2;
      (s2.apply(l2, e2), r2) && (null == (c2 = this.bindings[t2]) || c2.splice(o2, 1));
    }));
    return this;
  }
};
function s() {
  return s = Object.assign ? Object.assign.bind() : function(t2) {
    for (var e2 = 1; e2 < arguments.length; e2++) {
      var n2 = arguments[e2];
      for (var o2 in n2) ({}).hasOwnProperty.call(n2, o2) && (t2[o2] = n2[o2]);
    }
    return t2;
  }, s.apply(null, arguments);
}
function r(t2, e2) {
  if (null == t2) return {};
  var n2 = {};
  for (var o2 in t2) if ({}.hasOwnProperty.call(t2, o2)) {
    if (-1 !== e2.indexOf(o2)) continue;
    n2[o2] = t2[o2];
  }
  return n2;
}
var l = { defaultMerge: /* @__PURE__ */ Symbol("deepmerge-ts: default merge"), skip: /* @__PURE__ */ Symbol("deepmerge-ts: skip") };
function c(t2, e2) {
  return e2;
}
function a(t2, e2) {
  return t2.filter((t3) => void 0 !== t3);
}
var u;
function h(t2) {
  return "object" != typeof t2 || null === t2 ? 0 : Array.isArray(t2) ? 2 : (function(t3) {
    if (!p.includes(Object.prototype.toString.call(t3))) return false;
    const { constructor: e2 } = t3;
    if (void 0 === e2) return true;
    const n2 = e2.prototype;
    if (null === n2 || "object" != typeof n2 || !p.includes(Object.prototype.toString.call(n2))) return false;
    if (!n2.hasOwnProperty("isPrototypeOf")) return false;
    return true;
  })(t2) ? 1 : t2 instanceof Set ? 3 : t2 instanceof Map ? 4 : 5;
}
function d(t2, e2) {
  return "object" == typeof t2 && Object.prototype.propertyIsEnumerable.call(t2, e2);
}
function f(t2) {
  var e2;
  let n2 = 0, o2 = null == (e2 = t2[0]) ? void 0 : e2[Symbol.iterator]();
  return { [Symbol.iterator]: () => ({ next() {
    for (; ; ) {
      if (void 0 === o2) return { done: true, value: void 0 };
      const i2 = o2.next();
      if (true !== i2.done) return { done: false, value: i2.value };
      var e3;
      n2 += 1, o2 = null == (e3 = t2[n2]) ? void 0 : e3[Symbol.iterator]();
    }
  } }) };
}
!(function(t2) {
  t2[t2.NOT = 0] = "NOT", t2[t2.RECORD = 1] = "RECORD", t2[t2.ARRAY = 2] = "ARRAY", t2[t2.SET = 3] = "SET", t2[t2.MAP = 4] = "MAP", t2[t2.OTHER = 5] = "OTHER";
})(u || (u = {}));
var p = ["[object Object]", "[object Module]"];
var g = { mergeRecords: function(t2, e2, n2) {
  const o2 = {};
  for (const i2 of (function(t3) {
    const e3 = /* @__PURE__ */ new Set();
    for (const n3 of t3) for (const t4 of [...Object.keys(n3), ...Object.getOwnPropertySymbols(n3)]) e3.add(t4);
    return e3;
  })(t2)) {
    const s2 = [];
    for (const e3 of t2) d(e3, i2) && s2.push(e3[i2]);
    if (0 === s2.length) continue;
    const r2 = e2.metaDataUpdater(n2, { key: i2, parents: t2 }), c2 = v(s2, e2, r2);
    c2 !== l.skip && ("__proto__" === i2 ? Object.defineProperty(o2, i2, { value: c2, configurable: true, enumerable: true, writable: true }) : o2[i2] = c2);
  }
  return o2;
}, mergeArrays: function(t2) {
  return t2.flat();
}, mergeSets: function(t2) {
  return new Set(f(t2));
}, mergeMaps: function(t2) {
  return new Map(f(t2));
}, mergeOthers: function(t2) {
  return t2.at(-1);
} };
function m(...t2) {
  return (function(t3, e2) {
    const n2 = (function(t4, e3) {
      var n3, o3, i2;
      return { defaultMergeFunctions: g, mergeFunctions: s({}, g, Object.fromEntries(Object.entries(t4).filter(([t5, e4]) => Object.hasOwn(g, t5)).map(([t5, e4]) => false === e4 ? [t5, g.mergeOthers] : [t5, e4]))), metaDataUpdater: null != (n3 = t4.metaDataUpdater) ? n3 : c, deepmerge: e3, useImplicitDefaultMerging: null != (o3 = t4.enableImplicitDefaultMerging) && o3, filterValues: false === t4.filterValues ? void 0 : null != (i2 = t4.filterValues) ? i2 : a, actions: l };
    })(t3, o2);
    function o2(...t4) {
      return v(t4, n2, e2);
    }
    return o2;
  })({})(...t2);
}
function v(t2, e2, n2) {
  var o2;
  const i2 = null != (o2 = null == e2.filterValues ? void 0 : e2.filterValues(t2, n2)) ? o2 : t2;
  if (0 === i2.length) return;
  if (1 === i2.length) return y(i2, e2, n2);
  const s2 = h(i2[0]);
  if (0 !== s2 && 5 !== s2) {
    for (let t3 = 1; t3 < i2.length; t3++) if (h(i2[t3]) !== s2) return y(i2, e2, n2);
  }
  switch (s2) {
    case 1:
      return (function(t3, e3, n3) {
        const o3 = e3.mergeFunctions.mergeRecords(t3, e3, n3);
        if (o3 === l.defaultMerge || e3.useImplicitDefaultMerging && void 0 === o3 && e3.mergeFunctions.mergeRecords !== e3.defaultMergeFunctions.mergeRecords) return e3.defaultMergeFunctions.mergeRecords(t3, e3, n3);
        return o3;
      })(i2, e2, n2);
    case 2:
      return (function(t3, e3, n3) {
        const o3 = e3.mergeFunctions.mergeArrays(t3, e3, n3);
        if (o3 === l.defaultMerge || e3.useImplicitDefaultMerging && void 0 === o3 && e3.mergeFunctions.mergeArrays !== e3.defaultMergeFunctions.mergeArrays) return e3.defaultMergeFunctions.mergeArrays(t3);
        return o3;
      })(i2, e2, n2);
    case 3:
      return (function(t3, e3, n3) {
        const o3 = e3.mergeFunctions.mergeSets(t3, e3, n3);
        if (o3 === l.defaultMerge || e3.useImplicitDefaultMerging && void 0 === o3 && e3.mergeFunctions.mergeSets !== e3.defaultMergeFunctions.mergeSets) return e3.defaultMergeFunctions.mergeSets(t3);
        return o3;
      })(i2, e2, n2);
    case 4:
      return (function(t3, e3, n3) {
        const o3 = e3.mergeFunctions.mergeMaps(t3, e3, n3);
        if (o3 === l.defaultMerge || e3.useImplicitDefaultMerging && void 0 === o3 && e3.mergeFunctions.mergeMaps !== e3.defaultMergeFunctions.mergeMaps) return e3.defaultMergeFunctions.mergeMaps(t3);
        return o3;
      })(i2, e2, n2);
    default:
      return y(i2, e2, n2);
  }
}
function y(t2, e2, n2) {
  const o2 = e2.mergeFunctions.mergeOthers(t2, e2, n2);
  return o2 === l.defaultMerge || e2.useImplicitDefaultMerging && void 0 === o2 && e2.mergeFunctions.mergeOthers !== e2.defaultMergeFunctions.mergeOthers ? e2.defaultMergeFunctions.mergeOthers(t2) : o2;
}
function x(t2) {
  const e2 = Object.getOwnPropertyNames(t2.constructor.prototype);
  for (let n2 = 0; n2 < e2.length; n2++) {
    const o2 = e2[n2], i2 = t2[o2];
    "constructor" !== o2 && "function" == typeof i2 && (t2[o2] = i2.bind(t2));
  }
  return t2;
}
function b(t2) {
  const { event: e2, selector: n2 } = t2.options.advanceOn || {};
  if (e2) {
    const i2 = /* @__PURE__ */ (function(t3, e3) {
      return (n3) => {
        if (t3.isOpen()) {
          const i3 = t3.el && n3.currentTarget === t3.el;
          (!o(e3) && n3.currentTarget.matches(e3) || i3) && t3.tour.next();
        }
      };
    })(t2, n2);
    let s2 = null;
    if (!o(n2) && (s2 = document.querySelector(n2), !s2)) return;
    s2 ? (s2.addEventListener(e2, i2), t2.on("destroy", () => s2.removeEventListener(e2, i2))) : (document.body.addEventListener(e2, i2, true), t2.on("destroy", () => document.body.removeEventListener(e2, i2, true)));
  }
}
function w(t2) {
  return n(t2) && "" !== t2 ? "-" !== t2.charAt(t2.length - 1) ? `${t2}-` : t2 : "";
}
function E(t2) {
  return null == t2 || (!t2.element || !t2.on);
}
function O() {
  let t2 = Date.now();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (e2) => {
    const n2 = (t2 + 16 * Math.random()) % 16 | 0;
    return t2 = Math.floor(t2 / 16), ("x" == e2 ? n2 : 3 & n2 | 8).toString(16);
  });
}
var T = ["start", "end"];
var S = ["top", "right", "bottom", "left"].reduce((t2, e2) => t2.concat(e2, e2 + "-" + T[0], e2 + "-" + T[1]), []);
var A = Math.min;
var L = Math.max;
var _ = Math.round;
var R = Math.floor;
var M = (t2) => ({ x: t2, y: t2 });
var C = { left: "right", right: "left", bottom: "top", top: "bottom" };
function P(t2, e2, n2) {
  return L(t2, A(e2, n2));
}
function D(t2, e2) {
  return "function" == typeof t2 ? t2(e2) : t2;
}
function $(t2) {
  return t2.split("-")[0];
}
function k(t2) {
  return t2.split("-")[1];
}
function F(t2) {
  return "x" === t2 ? "y" : "x";
}
function I(t2) {
  return "y" === t2 ? "height" : "width";
}
function H(t2) {
  const e2 = t2[0];
  return "t" === e2 || "b" === e2 ? "y" : "x";
}
function j(t2) {
  return F(H(t2));
}
function B(t2, e2, n2) {
  void 0 === n2 && (n2 = false);
  const o2 = k(t2), i2 = j(t2), s2 = I(i2);
  let r2 = "x" === i2 ? o2 === (n2 ? "end" : "start") ? "right" : "left" : "start" === o2 ? "bottom" : "top";
  return e2.reference[s2] > e2.floating[s2] && (r2 = Y(r2)), [r2, Y(r2)];
}
function V(t2) {
  return t2.includes("start") ? t2.replace("start", "end") : t2.replace("end", "start");
}
var N = ["left", "right"];
var W = ["right", "left"];
var q = ["top", "bottom"];
var z = ["bottom", "top"];
function U(t2, e2, n2, o2) {
  const i2 = k(t2);
  let s2 = (function(t3, e3, n3) {
    switch (t3) {
      case "top":
      case "bottom":
        return n3 ? e3 ? W : N : e3 ? N : W;
      case "left":
      case "right":
        return e3 ? q : z;
      default:
        return [];
    }
  })($(t2), "start" === n2, o2);
  return i2 && (s2 = s2.map((t3) => t3 + "-" + i2), e2 && (s2 = s2.concat(s2.map(V)))), s2;
}
function Y(t2) {
  const e2 = $(t2);
  return C[e2] + t2.slice(e2.length);
}
function X(t2) {
  return "number" != typeof t2 ? (function(t3) {
    var e2, n2, o2, i2;
    return { top: null != (e2 = t3.top) ? e2 : 0, right: null != (n2 = t3.right) ? n2 : 0, bottom: null != (o2 = t3.bottom) ? o2 : 0, left: null != (i2 = t3.left) ? i2 : 0 };
  })(t2) : { top: t2, right: t2, bottom: t2, left: t2 };
}
function Z(t2) {
  const { x: e2, y: n2, width: o2, height: i2 } = t2;
  return { width: o2, height: i2, top: n2, left: e2, right: e2 + o2, bottom: n2 + i2, x: e2, y: n2 };
}
var G = ["crossAxis", "alignment", "allowedPlacements", "autoAlignment"];
var K = ["mainAxis", "crossAxis", "fallbackPlacements", "fallbackStrategy", "fallbackAxisSideDirection", "flipAlignment"];
var J = ["mainAxis", "crossAxis", "limiter"];
function Q(t2, e2, n2) {
  let { reference: o2, floating: i2 } = t2;
  const s2 = H(e2), r2 = j(e2), l2 = I(r2), c2 = $(e2), a2 = "y" === s2, u2 = o2.x + o2.width / 2 - i2.width / 2, h2 = o2.y + o2.height / 2 - i2.height / 2, d2 = o2[l2] / 2 - i2[l2] / 2;
  let f2;
  switch (c2) {
    case "top":
      f2 = { x: u2, y: o2.y - i2.height };
      break;
    case "bottom":
      f2 = { x: u2, y: o2.y + o2.height };
      break;
    case "right":
      f2 = { x: o2.x + o2.width, y: h2 };
      break;
    case "left":
      f2 = { x: o2.x - i2.width, y: h2 };
      break;
    default:
      f2 = { x: o2.x, y: o2.y };
  }
  const p2 = k(e2);
  return p2 && (f2[r2] += d2 * ("end" === p2 ? 1 : -1) * (n2 && a2 ? -1 : 1)), f2;
}
async function tt(t2, e2) {
  var n2;
  void 0 === e2 && (e2 = {});
  const { x: o2, y: i2, platform: s2, rects: r2, elements: l2, strategy: c2 } = t2, { boundary: a2 = "clippingAncestors", rootBoundary: u2 = "viewport", elementContext: h2 = "floating", altBoundary: d2 = false, padding: f2 = 0 } = D(e2, t2), p2 = X(f2), g2 = l2[d2 ? "floating" === h2 ? "reference" : "floating" : h2], m2 = Z(await s2.getClippingRect({ element: null == (n2 = await (null == s2.isElement ? void 0 : s2.isElement(g2))) || n2 ? g2 : g2.contextElement || await (null == s2.getDocumentElement ? void 0 : s2.getDocumentElement(l2.floating)), boundary: a2, rootBoundary: u2, strategy: c2 })), v2 = "floating" === h2 ? { x: o2, y: i2, width: r2.floating.width, height: r2.floating.height } : r2.reference, y2 = await (null == s2.getOffsetParent ? void 0 : s2.getOffsetParent(l2.floating)), x2 = await (null == s2.isElement ? void 0 : s2.isElement(y2)) && await (null == s2.getScale ? void 0 : s2.getScale(y2)) || { x: 1, y: 1 }, b2 = Z(s2.convertOffsetParentRelativeRectToViewportRelativeRect ? await s2.convertOffsetParentRelativeRectToViewportRelativeRect({ elements: l2, rect: v2, offsetParent: y2, strategy: c2 }) : v2);
  return { top: (m2.top - b2.top + p2.top) / x2.y, bottom: (b2.bottom - m2.bottom + p2.bottom) / x2.y, left: (m2.left - b2.left + p2.left) / x2.x, right: (b2.right - m2.right + p2.right) / x2.x };
}
var et = /* @__PURE__ */ new Set(["left", "top"]);
function nt() {
  return "undefined" != typeof window;
}
function ot(t2) {
  return rt(t2) ? (t2.nodeName || "").toLowerCase() : "#document";
}
function it(t2) {
  var e2;
  return (null == t2 || null == (e2 = t2.ownerDocument) ? void 0 : e2.defaultView) || window;
}
function st(t2) {
  var e2;
  return null == (e2 = (rt(t2) ? t2.ownerDocument : t2.document) || window.document) ? void 0 : e2.documentElement;
}
function rt(t2) {
  return !!nt() && (t2 instanceof Node || t2 instanceof it(t2).Node);
}
function lt(t2) {
  return !!nt() && (t2 instanceof Element || t2 instanceof it(t2).Element);
}
function ct(t2) {
  return !!nt() && (t2 instanceof HTMLElement || t2 instanceof it(t2).HTMLElement);
}
function at(t2) {
  return !(!nt() || "undefined" == typeof ShadowRoot) && (t2 instanceof ShadowRoot || t2 instanceof it(t2).ShadowRoot);
}
function ut(t2) {
  const { overflow: e2, overflowX: n2, overflowY: o2, display: i2 } = bt(t2);
  return /auto|scroll|overlay|hidden|clip/.test(e2 + o2 + n2) && "inline" !== i2 && "contents" !== i2;
}
function ht(t2) {
  return /^(table|td|th)$/.test(ot(t2));
}
function dt(t2) {
  try {
    if (t2.matches(":popover-open")) return true;
  } catch (t3) {
  }
  try {
    return t2.matches(":modal");
  } catch (t3) {
    return false;
  }
}
var ft = /transform|translate|scale|rotate|perspective|filter/;
var pt = /paint|layout|strict|content/;
var gt = (t2) => !!t2 && "none" !== t2;
var mt;
function vt(t2) {
  const e2 = lt(t2) ? bt(t2) : t2;
  return gt(e2.transform) || gt(e2.translate) || gt(e2.scale) || gt(e2.rotate) || gt(e2.perspective) || !yt() && (gt(e2.backdropFilter) || gt(e2.filter)) || ft.test(e2.willChange || "") || pt.test(e2.contain || "");
}
function yt() {
  return null == mt && (mt = "undefined" != typeof CSS && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none")), mt;
}
function xt(t2) {
  return /^(html|body|#document)$/.test(ot(t2));
}
function bt(t2) {
  return it(t2).getComputedStyle(t2);
}
function wt(t2) {
  return lt(t2) ? { scrollLeft: t2.scrollLeft, scrollTop: t2.scrollTop } : { scrollLeft: t2.scrollX, scrollTop: t2.scrollY };
}
function Et(t2) {
  if ("html" === ot(t2)) return t2;
  const e2 = t2.assignedSlot || t2.parentNode || at(t2) && t2.host || st(t2);
  return at(e2) ? e2.host : e2;
}
function Ot(t2) {
  const e2 = Et(t2);
  return xt(e2) ? (t2.ownerDocument || t2).body : ct(e2) && ut(e2) ? e2 : Ot(e2);
}
function Tt(t2, e2, n2) {
  var o2;
  void 0 === e2 && (e2 = []), void 0 === n2 && (n2 = true);
  const i2 = Ot(t2), s2 = i2 === (null == (o2 = t2.ownerDocument) ? void 0 : o2.body), r2 = it(i2);
  if (s2) {
    const t3 = St(r2);
    return e2.concat(r2, r2.visualViewport || [], ut(i2) ? i2 : [], t3 && n2 ? Tt(t3) : []);
  }
  return e2.concat(i2, Tt(i2, [], n2));
}
function St(t2) {
  return t2.parent && Object.getPrototypeOf(t2.parent) ? t2.frameElement : null;
}
function At(t2) {
  const e2 = bt(t2);
  let n2 = parseFloat(e2.width) || 0, o2 = parseFloat(e2.height) || 0;
  const i2 = ct(t2), s2 = i2 ? t2.offsetWidth : n2, r2 = i2 ? t2.offsetHeight : o2, l2 = _(n2) !== s2 || _(o2) !== r2;
  return l2 && (n2 = s2, o2 = r2), { width: n2, height: o2, $: l2 };
}
function Lt(t2) {
  return lt(t2) ? t2 : t2.contextElement;
}
function _t(t2) {
  const e2 = Lt(t2);
  if (!ct(e2)) return M(1);
  const n2 = e2.getBoundingClientRect(), { width: o2, height: i2, $: s2 } = At(e2);
  let r2 = (s2 ? _(n2.width) : n2.width) / o2, l2 = (s2 ? _(n2.height) : n2.height) / i2;
  return r2 && Number.isFinite(r2) || (r2 = 1), l2 && Number.isFinite(l2) || (l2 = 1), { x: r2, y: l2 };
}
var Rt = M(0);
function Mt(t2) {
  const e2 = it(t2);
  return yt() && e2.visualViewport ? { x: e2.visualViewport.offsetLeft, y: e2.visualViewport.offsetTop } : Rt;
}
function Ct(t2, e2, n2, o2) {
  void 0 === e2 && (e2 = false), void 0 === n2 && (n2 = false);
  const i2 = t2.getBoundingClientRect(), s2 = Lt(t2);
  let r2 = M(1);
  e2 && (o2 ? lt(o2) && (r2 = _t(o2)) : r2 = _t(t2));
  const l2 = (function(t3, e3, n3) {
    return void 0 === e3 && (e3 = false), !!n3 && e3 && n3 === it(t3);
  })(s2, n2, o2) ? Mt(s2) : M(0);
  let c2 = (i2.left + l2.x) / r2.x, a2 = (i2.top + l2.y) / r2.y, u2 = i2.width / r2.x, h2 = i2.height / r2.y;
  if (s2 && o2) {
    const t3 = it(s2), e3 = lt(o2) ? it(o2) : o2;
    let n3 = t3, i3 = St(n3);
    for (; i3 && e3 !== n3; ) {
      const t4 = _t(i3), e4 = i3.getBoundingClientRect(), o3 = bt(i3), s3 = e4.left + (i3.clientLeft + parseFloat(o3.paddingLeft)) * t4.x, r3 = e4.top + (i3.clientTop + parseFloat(o3.paddingTop)) * t4.y;
      c2 *= t4.x, a2 *= t4.y, u2 *= t4.x, h2 *= t4.y, c2 += s3, a2 += r3, n3 = it(i3), i3 = St(n3);
    }
  }
  return Z({ width: u2, height: h2, x: c2, y: a2 });
}
function Pt(t2, e2) {
  const n2 = wt(t2).scrollLeft;
  return e2 ? e2.left + n2 : Ct(st(t2)).left + n2;
}
function Dt(t2, e2) {
  const n2 = t2.getBoundingClientRect();
  return { x: n2.left + e2.scrollLeft - Pt(t2, n2), y: n2.top + e2.scrollTop };
}
function $t(t2, e2, n2) {
  let o2;
  if ("viewport" === e2 || "layoutViewport" === e2) o2 = (function(t3, e3, n3) {
    void 0 === n3 && (n3 = "viewport");
    const o3 = "layoutViewport" === n3, i2 = it(t3), s2 = st(t3), r2 = i2.visualViewport;
    let l2 = s2.clientWidth, c2 = s2.clientHeight, a2 = 0, u2 = 0;
    if (r2) {
      const t4 = !yt() || "fixed" === e3;
      o3 ? t4 || (a2 = -r2.offsetLeft, u2 = -r2.offsetTop) : (l2 = r2.width, c2 = r2.height, t4 && (a2 = r2.offsetLeft, u2 = r2.offsetTop));
    }
    if (Pt(s2) <= 0) {
      const t4 = s2.ownerDocument, e4 = t4.body, n4 = getComputedStyle(e4), o4 = "CSS1Compat" === t4.compatMode && parseFloat(n4.marginLeft) + parseFloat(n4.marginRight) || 0, i3 = Math.abs(s2.clientWidth - e4.clientWidth - o4), r3 = "stable both-edges" === getComputedStyle(s2).scrollbarGutter ? i3 / 2 : i3;
      r3 <= 25 && (l2 -= r3);
    }
    return { width: l2, height: c2, x: a2, y: u2 };
  })(t2, n2, e2);
  else if ("document" === e2) o2 = (function(t3) {
    const e3 = wt(t3), n3 = t3.ownerDocument.body, o3 = L(t3.scrollWidth, t3.clientWidth, n3.scrollWidth, n3.clientWidth), i2 = L(t3.scrollHeight, t3.clientHeight, n3.scrollHeight, n3.clientHeight);
    let s2 = -e3.scrollLeft + Pt(t3);
    const r2 = -e3.scrollTop;
    return "rtl" === bt(n3).direction && (s2 += L(t3.clientWidth, n3.clientWidth) - o3), { width: o3, height: i2, x: s2, y: r2 };
  })(st(t2));
  else if (lt(e2)) o2 = (function(t3, e3) {
    const n3 = Ct(t3, true, "fixed" === e3), o3 = n3.top + t3.clientTop, i2 = n3.left + t3.clientLeft, s2 = _t(t3);
    return { width: t3.clientWidth * s2.x, height: t3.clientHeight * s2.y, x: i2 * s2.x, y: o3 * s2.y };
  })(e2, n2);
  else {
    const n3 = Mt(t2);
    o2 = { x: e2.x - n3.x, y: e2.y - n3.y, width: e2.width, height: e2.height };
  }
  return Z(o2);
}
function kt(t2, e2, n2) {
  const o2 = ct(e2), i2 = st(e2), s2 = "fixed" === n2, r2 = Ct(t2, true, s2, e2);
  let l2 = { scrollLeft: 0, scrollTop: 0 };
  const c2 = M(0);
  if ((o2 || !s2) && (("body" !== ot(e2) || ut(i2)) && (l2 = wt(e2)), o2)) {
    const t3 = Ct(e2, true, s2, e2);
    c2.x = t3.x + e2.clientLeft, c2.y = t3.y + e2.clientTop;
  }
  !o2 && i2 && (c2.x = Pt(i2));
  const a2 = !i2 || o2 || s2 ? M(0) : Dt(i2, l2);
  return { x: r2.left + l2.scrollLeft - c2.x - a2.x, y: r2.top + l2.scrollTop - c2.y - a2.y, width: r2.width, height: r2.height };
}
function Ft(t2) {
  return "static" === bt(t2).position;
}
function It(t2, e2) {
  if (!ct(t2) || "fixed" === bt(t2).position) return null;
  if (e2) return e2(t2);
  let n2 = t2.offsetParent;
  return st(t2) === n2 && (n2 = n2.ownerDocument.body), n2;
}
function Ht(t2, e2) {
  const n2 = it(t2);
  if (dt(t2)) return n2;
  if (!ct(t2)) {
    let e3 = Et(t2);
    for (; e3 && !xt(e3); ) {
      if (lt(e3) && !Ft(e3)) return e3;
      e3 = Et(e3);
    }
    return n2;
  }
  let o2 = It(t2, e2);
  for (; o2 && ht(o2) && Ft(o2); ) o2 = It(o2, e2);
  return o2 && xt(o2) && Ft(o2) && !vt(o2) ? n2 : o2 || (function(t3) {
    let e3 = Et(t3);
    for (; ct(e3) && !xt(e3); ) {
      if (vt(e3)) return e3;
      if (dt(e3)) return null;
      e3 = Et(e3);
    }
    return null;
  })(t2) || n2;
}
var jt = { convertOffsetParentRelativeRectToViewportRelativeRect: function(t2) {
  let { elements: e2, rect: n2, offsetParent: o2, strategy: i2 } = t2;
  const s2 = "fixed" === i2, r2 = st(o2), l2 = !!e2 && dt(e2.floating);
  if (o2 === r2 || l2 && s2) return n2;
  let c2 = { scrollLeft: 0, scrollTop: 0 }, a2 = M(1);
  const u2 = M(0), h2 = ct(o2);
  if ((h2 || !s2) && (("body" !== ot(o2) || ut(r2)) && (c2 = wt(o2)), h2)) {
    const t3 = Ct(o2);
    a2 = _t(o2), u2.x = t3.x + o2.clientLeft, u2.y = t3.y + o2.clientTop;
  }
  const d2 = !r2 || h2 || s2 ? M(0) : Dt(r2, c2);
  return { width: n2.width * a2.x, height: n2.height * a2.y, x: n2.x * a2.x - c2.scrollLeft * a2.x + u2.x + d2.x, y: n2.y * a2.y - c2.scrollTop * a2.y + u2.y + d2.y };
}, getDocumentElement: st, getClippingRect: function(t2) {
  let { element: e2, boundary: n2, rootBoundary: o2, strategy: i2 } = t2;
  const s2 = [..."clippingAncestors" === n2 ? dt(e2) ? [] : (function(t3, e3) {
    const n3 = e3.get(t3);
    if (n3) return n3;
    let o3 = Tt(t3, [], false).filter((t4) => lt(t4) && "body" !== ot(t4)), i3 = null;
    const s3 = "fixed" === bt(t3).position;
    let r3 = s3 ? Et(t3) : t3;
    for (; lt(r3) && !xt(r3); ) {
      const t4 = bt(r3), e4 = vt(r3), n4 = i3 ? i3.position : s3 ? "fixed" : "";
      e4 || "fixed" !== n4 && ("absolute" !== n4 || "static" !== t4.position) ? i3 = t4 : o3 = o3.filter((t5) => t5 !== r3), r3 = Et(r3);
    }
    return e3.set(t3, o3), o3;
  })(e2, this._c) : [].concat(n2), o2], r2 = $t(e2, s2[0], i2);
  let l2 = r2.top, c2 = r2.right, a2 = r2.bottom, u2 = r2.left;
  for (let t3 = 1; t3 < s2.length; t3++) {
    const n3 = $t(e2, s2[t3], i2);
    l2 = L(n3.top, l2), c2 = A(n3.right, c2), a2 = A(n3.bottom, a2), u2 = L(n3.left, u2);
  }
  return { width: c2 - u2, height: a2 - l2, x: u2, y: l2 };
}, getOffsetParent: Ht, getElementRects: async function(t2) {
  const e2 = this.getOffsetParent || Ht, n2 = this.getDimensions, o2 = await n2(t2.floating);
  return { reference: kt(t2.reference, await e2(t2.floating), t2.strategy), floating: { x: 0, y: 0, width: o2.width, height: o2.height } };
}, getClientRects: function(t2) {
  return t2.getClientRects ? Array.from(t2.getClientRects()) : [];
}, getDimensions: function(t2) {
  const { width: e2, height: n2 } = At(t2);
  return { width: e2, height: n2 };
}, getScale: _t, isElement: lt, isRTL: function(t2) {
  return "rtl" === bt(t2).direction;
} };
function Bt(t2, e2) {
  return t2.x === e2.x && t2.y === e2.y && t2.width === e2.width && t2.height === e2.height;
}
function Vt(t2, e2, n2, o2) {
  void 0 === o2 && (o2 = {});
  const { ancestorScroll: i2 = true, ancestorResize: r2 = true, elementResize: l2 = "function" == typeof ResizeObserver, layoutShift: c2 = "function" == typeof IntersectionObserver, animationFrame: a2 = false } = o2, u2 = Lt(t2), h2 = i2 || r2 ? [...u2 ? Tt(u2) : [], ...e2 ? Tt(e2) : []] : [];
  h2.forEach((t3) => {
    i2 && t3.addEventListener("scroll", n2), r2 && t3.addEventListener("resize", n2);
  });
  const d2 = u2 && c2 ? (function(t3, e3, n3) {
    let o3, i3 = null;
    const r3 = st(t3);
    function l3() {
      var t4;
      clearTimeout(o3), null == (t4 = i3) || t4.disconnect(), i3 = null;
    }
    function c3(n4, a4) {
      void 0 === n4 && (n4 = false), void 0 === a4 && (a4 = 1), l3();
      const u4 = t3.getBoundingClientRect(), { left: h3, top: d3, width: f3, height: p3 } = u4;
      if (n4 || e3(), !f3 || !p3) return;
      const g3 = { rootMargin: -R(d3) + "px " + -R(r3.clientWidth - (h3 + f3)) + "px " + -R(r3.clientHeight - (d3 + p3)) + "px " + -R(h3) + "px", threshold: L(0, A(1, a4)) || 1 };
      let m3 = true;
      function v2(e4) {
        const n5 = e4[0].intersectionRatio;
        if (!Bt(u4, t3.getBoundingClientRect())) return c3();
        if (n5 !== a4) {
          if (!m3) return c3();
          n5 ? c3(false, n5) : o3 = setTimeout(() => {
            c3(false, 1e-7);
          }, 1e3);
        }
        m3 = false;
      }
      try {
        i3 = new IntersectionObserver(v2, s({}, g3, { root: r3.ownerDocument }));
      } catch (t4) {
        i3 = new IntersectionObserver(v2, g3);
      }
      i3.observe(t3);
    }
    const a3 = it(t3), u3 = () => c3(n3);
    return a3.addEventListener("resize", u3), c3(true), () => {
      a3.removeEventListener("resize", u3), l3();
    };
  })(u2, n2, r2) : null;
  let f2, p2 = -1, g2 = null;
  l2 && (g2 = new ResizeObserver((t3) => {
    let [o3] = t3;
    o3 && o3.target === u2 && g2 && e2 && (g2.unobserve(e2), cancelAnimationFrame(p2), p2 = requestAnimationFrame(() => {
      var t4;
      null == (t4 = g2) || t4.observe(e2);
    })), n2();
  }), u2 && !a2 && g2.observe(u2), e2 && g2.observe(e2));
  let m2 = a2 ? Ct(t2) : null;
  return a2 && (function e3() {
    const o3 = Ct(t2);
    m2 && !Bt(m2, o3) && n2();
    m2 = o3, f2 = requestAnimationFrame(e3);
  })(), n2(), () => {
    var t3;
    h2.forEach((t4) => {
      i2 && t4.removeEventListener("scroll", n2), r2 && t4.removeEventListener("resize", n2);
    }), null == d2 || d2(), null == (t3 = g2) || t3.disconnect(), g2 = null, a2 && cancelAnimationFrame(f2);
  };
}
var Nt = function(t2) {
  return void 0 === t2 && (t2 = {}), { name: "autoPlacement", options: t2, async fn(e2) {
    var n2, o2, i2;
    const { rects: s2, middlewareData: l2, placement: c2, platform: a2, elements: u2 } = e2, h2 = D(t2, e2), { crossAxis: d2 = false, alignment: f2, allowedPlacements: p2 = S, autoAlignment: g2 = true } = h2, m2 = r(h2, G), v2 = void 0 !== f2 || p2 === S ? (function(t3, e3, n3) {
      return (t3 ? [...n3.filter((e4) => k(e4) === t3), ...n3.filter((e4) => k(e4) !== t3)] : n3.filter((t4) => $(t4) === t4)).filter((n4) => !t3 || k(n4) === t3 || !!e3 && V(n4) !== n4);
    })(f2 || null, g2, p2) : p2, y2 = (null == (n2 = l2.autoPlacement) ? void 0 : n2.index) || 0, x2 = v2[y2];
    if (null == x2) return {};
    if (c2 !== x2) return { reset: { placement: v2[0] } };
    const b2 = await a2.detectOverflow(e2, m2), w2 = B(x2, s2, await (null == a2.isRTL ? void 0 : a2.isRTL(u2.floating))), E2 = [b2[$(x2)], b2[w2[0]], b2[w2[1]]], O2 = [...(null == (o2 = l2.autoPlacement) ? void 0 : o2.overflows) || [], { placement: x2, overflows: E2 }], T2 = v2[y2 + 1];
    if (T2) return { data: { index: y2 + 1, overflows: O2 }, reset: { placement: T2 } };
    const A2 = O2.map((t3) => {
      const e3 = k(t3.placement);
      return [t3.placement, e3 && d2 ? t3.overflows.slice(0, 2).reduce((t4, e4) => t4 + e4, 0) : t3.overflows[0], t3.overflows];
    }).sort((t3, e3) => t3[1] - e3[1]), L2 = (null == (i2 = A2.filter((t3) => t3[2].slice(0, k(t3[0]) ? 2 : 3).every((t4) => t4 <= 0))[0]) ? void 0 : i2[0]) || A2[0][0];
    return L2 !== c2 ? { data: { index: y2 + 1, overflows: O2 }, reset: { placement: L2 } } : {};
  } };
};
var Wt = function(t2) {
  return void 0 === t2 && (t2 = {}), { name: "shift", options: t2, async fn(e2) {
    const { x: n2, y: o2, placement: i2, platform: l2 } = e2, c2 = D(t2, e2), { mainAxis: a2 = true, crossAxis: u2 = false, limiter: h2 = { fn: (t3) => {
      let { x: e3, y: n3 } = t3;
      return { x: e3, y: n3 };
    } } } = c2, d2 = r(c2, J), f2 = { x: n2, y: o2 }, p2 = await l2.detectOverflow(e2, d2), g2 = H(i2), m2 = F(g2);
    let v2 = f2[m2], y2 = f2[g2];
    const x2 = (t3, e3) => P(e3 + p2["y" === t3 ? "top" : "left"], e3, e3 - p2["y" === t3 ? "bottom" : "right"]);
    a2 && (v2 = x2(m2, v2)), u2 && (y2 = x2(g2, y2));
    const b2 = h2.fn(s({}, e2, { [m2]: v2, [g2]: y2 }));
    return s({}, b2, { data: { x: b2.x - n2, y: b2.y - o2, enabled: { [m2]: a2, [g2]: u2 } } });
  } };
};
var qt = function(t2) {
  return void 0 === t2 && (t2 = {}), { name: "flip", options: t2, async fn(e2) {
    var n2, o2;
    const { placement: i2, middlewareData: s2, rects: l2, initialPlacement: c2, platform: a2, elements: u2 } = e2, h2 = D(t2, e2), { mainAxis: d2 = true, crossAxis: f2 = true, fallbackPlacements: p2, fallbackStrategy: g2 = "bestFit", fallbackAxisSideDirection: m2 = "none", flipAlignment: v2 = true } = h2, y2 = r(h2, K);
    if (null != (n2 = s2.arrow) && n2.alignmentOffset) return {};
    const x2 = $(i2), b2 = H(c2), w2 = $(c2) === c2, E2 = await (null == a2.isRTL ? void 0 : a2.isRTL(u2.floating)), O2 = p2 || (w2 || !v2 ? [Y(c2)] : (function(t3) {
      const e3 = Y(t3);
      return [V(t3), e3, V(e3)];
    })(c2)), T2 = "none" !== m2;
    !p2 && T2 && O2.push(...U(c2, v2, m2, E2));
    const S2 = [c2, ...O2], A2 = await a2.detectOverflow(e2, y2), L2 = [];
    let _2 = (null == (o2 = s2.flip) ? void 0 : o2.overflows) || [];
    if (d2 && L2.push(A2[x2]), f2) {
      const t3 = B(i2, l2, E2);
      L2.push(A2[t3[0]], A2[t3[1]]);
    }
    if (_2 = [..._2, { placement: i2, overflows: L2 }], !L2.every((t3) => t3 <= 0)) {
      var R2, M2;
      const t3 = ((null == (R2 = s2.flip) ? void 0 : R2.index) || 0) + 1, e3 = S2[t3];
      if (e3) {
        if (!("alignment" === f2 && b2 !== H(e3)) || _2.every((t4) => H(t4.placement) !== b2 || t4.overflows[0] > 0)) return { data: { index: t3, overflows: _2 }, reset: { placement: e3 } };
      }
      let n3 = null == (M2 = _2.filter((t4) => t4.overflows[0] <= 0).sort((t4, e4) => t4.overflows[1] - e4.overflows[1])[0]) ? void 0 : M2.placement;
      if (!n3) switch (g2) {
        case "bestFit": {
          var C2;
          const t4 = null == (C2 = _2.filter((t5) => {
            if (T2) {
              const e4 = H(t5.placement);
              return e4 === b2 || "y" === e4;
            }
            return true;
          }).map((t5) => [t5.placement, t5.overflows.filter((t6) => t6 > 0).reduce((t6, e4) => t6 + e4, 0)]).sort((t5, e4) => t5[1] - e4[1])[0]) ? void 0 : C2[0];
          t4 && (n3 = t4);
          break;
        }
        case "initialPlacement":
          n3 = c2;
      }
      if (i2 !== n3) return { reset: { placement: n3 } };
    }
    return {};
  } };
};
var zt = (t2) => ({ name: "arrow", options: t2, async fn(e2) {
  const { x: n2, y: o2, placement: i2, rects: r2, platform: l2, elements: c2, middlewareData: a2 } = e2, { element: u2, padding: h2 = 0 } = D(t2, e2) || {};
  if (null == u2) return {};
  const d2 = X(h2), f2 = { x: n2, y: o2 }, p2 = j(i2), g2 = I(p2), m2 = await l2.getDimensions(u2), v2 = "y" === p2, y2 = v2 ? "top" : "left", x2 = v2 ? "bottom" : "right", b2 = v2 ? "clientHeight" : "clientWidth", w2 = r2.reference[g2] + r2.reference[p2] - f2[p2] - r2.floating[g2], E2 = f2[p2] - r2.reference[p2], O2 = await (null == l2.getOffsetParent ? void 0 : l2.getOffsetParent(u2));
  let T2 = O2 ? O2[b2] : 0;
  T2 && await (null == l2.isElement ? void 0 : l2.isElement(O2)) || (T2 = c2.floating[b2] || r2.floating[g2]);
  const S2 = w2 / 2 - E2 / 2, L2 = T2 / 2 - m2[g2] / 2 - 1, _2 = A(d2[y2], L2), R2 = A(d2[x2], L2), M2 = T2 - m2[g2] - R2, C2 = T2 / 2 - m2[g2] / 2 + S2, $2 = P(_2, C2, M2), F2 = !a2.arrow && null != k(i2) && C2 !== $2 && r2.reference[g2] / 2 - (C2 < _2 ? _2 : R2) - m2[g2] / 2 < 0, H2 = F2 ? C2 < _2 ? C2 - _2 : C2 - M2 : 0;
  return { [p2]: f2[p2] + H2, data: s({ [p2]: $2, centerOffset: C2 - $2 - H2 }, F2 && { alignmentOffset: H2 }), reset: F2 };
} });
var Ut = function(t2) {
  return void 0 === t2 && (t2 = {}), { options: t2, fn(e2) {
    var n2, o2;
    const { x: i2, y: s2, placement: r2, rects: l2, middlewareData: c2 } = e2, { offset: a2 = 0, mainAxis: u2 = true, crossAxis: h2 = true } = D(t2, e2), d2 = { x: i2, y: s2 }, f2 = H(r2), p2 = F(f2);
    let g2 = d2[p2], m2 = d2[f2];
    const v2 = D(a2, e2), y2 = "number" == typeof v2 ? { mainAxis: v2, crossAxis: 0 } : { mainAxis: null != (n2 = v2.mainAxis) ? n2 : 0, crossAxis: null != (o2 = v2.crossAxis) ? o2 : 0 };
    if (u2) {
      const t3 = "y" === p2 ? "height" : "width", e3 = l2.reference[p2] - l2.floating[t3] + y2.mainAxis, n3 = l2.reference[p2] + l2.reference[t3] - y2.mainAxis;
      g2 < e3 ? g2 = e3 : g2 > n3 && (g2 = n3);
    }
    if (h2) {
      var x2, b2;
      const t3 = "y" === p2 ? "width" : "height", e3 = et.has($(r2)), n3 = l2.reference[f2] - l2.floating[t3] + (e3 && (null == (x2 = c2.offset) ? void 0 : x2[f2]) || 0) + (e3 ? 0 : y2.crossAxis), o3 = l2.reference[f2] + l2.reference[t3] + (e3 ? 0 : (null == (b2 = c2.offset) ? void 0 : b2[f2]) || 0) - (e3 ? y2.crossAxis : 0);
      m2 < n3 ? m2 = n3 : m2 > o3 && (m2 = o3);
    }
    return { [p2]: g2, [f2]: m2 };
  } };
};
var Yt = (t2, e2, n2) => {
  const o2 = /* @__PURE__ */ new Map(), i2 = null != n2 ? n2 : {}, r2 = s({}, jt, i2.platform, { _c: o2 });
  return (async (t3, e3, n3) => {
    const { placement: o3 = "bottom", strategy: i3 = "absolute", middleware: r3 = [], platform: l2 } = n3, c2 = l2.detectOverflow ? l2 : s({}, l2, { detectOverflow: tt }), a2 = await (null == l2.isRTL ? void 0 : l2.isRTL(e3));
    let u2 = await l2.getElementRects({ reference: t3, floating: e3, strategy: i3 }), { x: h2, y: d2 } = Q(u2, o3, a2), f2 = o3, p2 = 0;
    const g2 = {};
    for (let n4 = 0; n4 < r3.length; n4++) {
      const m2 = r3[n4];
      if (!m2) continue;
      const { name: v2, fn: y2 } = m2, { x: x2, y: b2, data: w2, reset: E2 } = await y2({ x: h2, y: d2, initialPlacement: o3, placement: f2, strategy: i3, middlewareData: g2, rects: u2, platform: c2, elements: { reference: t3, floating: e3 } });
      h2 = null != x2 ? x2 : h2, d2 = null != b2 ? b2 : d2, g2[v2] = s({}, g2[v2], w2), E2 && p2 < 50 && (p2++, "object" == typeof E2 && (E2.placement && (f2 = E2.placement), E2.rects && (u2 = true === E2.rects ? await l2.getElementRects({ reference: t3, floating: e3, strategy: i3 }) : E2.rects), { x: h2, y: d2 } = Q(u2, f2, a2)), n4 = -1);
    }
    return { x: h2, y: d2, placement: f2, strategy: i3, middlewareData: g2 };
  })(t2, e2, s({}, i2, { platform: r2 }));
};
function Xt(e2) {
  e2.cleanup && e2.cleanup();
  const n2 = e2._getResolvedAttachToOptions();
  let o2 = n2.element;
  const i2 = (function(t2, e3) {
    var n3, o3, i3;
    const s3 = { strategy: "absolute", middleware: [] }, r3 = (function(t3) {
      if (t3.options.arrow && t3.el) return t3.el.querySelector(".shepherd-arrow");
      return false;
    })(e3), l2 = E(t2), c2 = null == (n3 = t2.on) ? void 0 : n3.includes("auto"), a2 = (null == t2 || null == (o3 = t2.on) ? void 0 : o3.includes("-start")) || (null == t2 || null == (i3 = t2.on) ? void 0 : i3.includes("-end"));
    if (!l2) {
      var u2;
      if (c2) s3.middleware.push(Nt({ crossAxis: true, alignment: a2 ? null == t2 || null == (u2 = t2.on) ? void 0 : u2.split("-").pop() : null }));
      else s3.middleware.push(qt());
      if (s3.middleware.push(Wt({ limiter: Ut(), crossAxis: true })), r3) {
        const t3 = "object" == typeof e3.options.arrow ? e3.options.arrow : { padding: 4 };
        s3.middleware.push(zt({ element: r3, padding: a2 ? t3.padding : 0 }));
      }
      c2 || (s3.placement = t2.on);
    }
    return m(s3, e3.options.floatingUIOptions || {});
  })(n2, e2), s2 = E(n2);
  if (s2) {
    var r2;
    o2 = document.body;
    const t2 = null == (r2 = e2.shepherdElementComponent) ? void 0 : r2.element;
    null == t2 || t2.classList.add("shepherd-centered");
  }
  return e2.cleanup = Vt(o2, e2.el, () => {
    e2.el ? (function(e3, n3, o3, i3) {
      Yt(e3, n3.el, o3).then(/* @__PURE__ */ (function(e4, n4) {
        return ({ x: o4, y: i4, placement: s3, middlewareData: r3 }) => e4.el ? (n4 ? Object.assign(e4.el.style, { position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }) : Object.assign(e4.el.style, { position: "absolute", left: `${o4}px`, top: `${i4}px` }), e4.el.dataset.popperPlacement = s3, (function(e5, n5) {
          const o5 = e5.querySelector(".shepherd-arrow");
          if (t(o5) && n5.arrow) {
            const { x: t2, y: e6 } = n5.arrow;
            Object.assign(o5.style, { left: null != t2 ? `${t2}px` : "", top: null != e6 ? `${e6}px` : "" });
          }
        })(e4.el, r3), e4) : e4;
      })(n3, i3)).then((t2) => new Promise((e4) => {
        setTimeout(() => e4(t2), 300);
      })).then((t2) => {
        null != t2 && t2.el && (t2.el.tabIndex = 0, t2.el.focus({ preventScroll: true }));
      });
    })(o2, e2, i2, s2) : null == e2.cleanup || e2.cleanup();
  }), e2.target = n2.element, i2;
}
function Zt(t2, e2, ...n2) {
  const o2 = document.createElement(t2);
  return Kt(o2, e2), Jt(o2, n2), o2;
}
function Gt(t2, e2, ...n2) {
  const o2 = document.createElementNS("http://www.w3.org/2000/svg", t2);
  return Kt(o2, e2), Jt(o2, n2), o2;
}
function Kt(t2, e2) {
  if (e2) for (const [n2, o2] of Object.entries(e2)) null != o2 && false !== o2 && (n2.startsWith("on") && "function" == typeof o2 ? t2.addEventListener(n2.slice(2).toLowerCase(), o2) : "disabled" === n2 && true === o2 ? t2.disabled = true : t2.setAttribute(n2, String(o2)));
}
function Jt(t2, e2) {
  for (const n2 of e2) null != n2 && false !== n2 && t2.append("string" == typeof n2 ? document.createTextNode(n2) : n2);
}
function Qt(t2, n2) {
  return e(t2) ? t2.call(n2) : t2;
}
function te(t2, e2) {
  const n2 = t2.action ? t2.action.bind(e2.tour) : null, o2 = !!t2.disabled && Qt(t2.disabled, e2), i2 = t2.label ? Qt(t2.label, e2) : null, r2 = t2.text ? Qt(t2.text, e2) : null, l2 = Zt("button", s({}, t2.attrs || {}, { "aria-label": i2 || null, class: `${t2.classes || ""} shepherd-button ${t2.secondary ? "shepherd-button-secondary" : ""}`, disabled: o2 || null, onclick: n2, tabindex: "0", type: "button" }));
  return r2 && (l2.innerHTML = r2), l2;
}
function ee(t2, n2) {
  const o2 = Zt("header", { class: "shepherd-header" });
  return n2.options.title && o2.append((function(t3, n3) {
    const o3 = Zt("h3", { id: t3, class: "shepherd-title" }), i2 = e(n3) ? n3() : n3;
    return o3.innerHTML = i2, o3;
  })(t2, n2.options.title)), n2.options.cancelIcon && n2.options.cancelIcon.enabled && o2.append((function(t3, e2) {
    return Zt("button", s({}, t3.attrs || {}, { "aria-label": t3.label ? t3.label : "Close Tour", class: "shepherd-cancel-icon", onclick: (t4) => {
      t4.preventDefault(), e2.cancel();
    }, type: "button" }), Zt("span", { "aria-hidden": "true" }, "\xD7"));
  })(n2.options.cancelIcon, n2)), o2;
}
function ne(n2, i2, s2) {
  const r2 = Zt("div", { class: "shepherd-content" });
  return (!o(s2.options.title) || s2.options.cancelIcon && s2.options.cancelIcon.enabled) && r2.append(ee(i2, s2)), o(s2.options.text) || r2.append((function(n3, o2) {
    const i3 = Zt("div", { class: "shepherd-text", id: n3 });
    let s3 = o2.options.text;
    return e(s3) && (s3 = s3.call(o2)), t(s3) ? i3.appendChild(s3) : i3.innerHTML = s3, i3;
  })(n2, s2)), Array.isArray(s2.options.buttons) && s2.options.buttons.length && r2.append((function(t2) {
    const e2 = Zt("footer", { class: "shepherd-footer" });
    if (t2.options.buttons) for (const n3 of t2.options.buttons) e2.append(te(n3, t2));
    return e2;
  })(s2)), r2;
}
var oe = class extends i {
  constructor(t2, e2 = {}) {
    return super(), this._resolvedAttachTo = void 0, this._resolvedExtraHighlightElements = void 0, this._originalTabIndexes = void 0, this.classPrefix = void 0, this.el = void 0, this.shepherdElementComponent = void 0, this.target = void 0, this.tour = void 0, this.tour = t2, this.classPrefix = this.tour.options ? w(this.tour.options.classPrefix) : "", this.styles = t2.styles, this._resolvedAttachTo = null, this._originalTabIndexes = /* @__PURE__ */ new Map(), x(this), this._setOptions(e2), this;
  }
  cancel() {
    this.tour.cancel(), this.trigger("cancel");
  }
  complete() {
    this.tour.complete(), this.trigger("complete");
  }
  destroy() {
    this._teardownElements(), this.trigger("destroy");
  }
  _teardownElements() {
    var e2;
    (e2 = this).cleanup && e2.cleanup(), e2.cleanup = null, this.shepherdElementComponent && (this.shepherdElementComponent.cleanup(), this.shepherdElementComponent = void 0), t(this.el) && (this.el.remove(), this.el = null), this._updateStepTargetOnHide(), this._originalTabIndexes.clear();
  }
  getTour() {
    return this.tour;
  }
  hide() {
    var t2;
    null == (t2 = this.tour.modal) || t2.hide(), this.trigger("before-hide"), this.el && (this.el.hidden = true), this._updateStepTargetOnHide(), this.trigger("hide");
  }
  _resolveExtraHiglightElements() {
    var t2;
    return this._resolvedExtraHighlightElements = (t2 = this).options.extraHighlights ? t2.options.extraHighlights.flatMap((t3) => Array.from(document.querySelectorAll(t3))) : [], this._resolvedExtraHighlightElements;
  }
  _resolveAttachToOptions() {
    return this._resolvedAttachTo = (function(t2) {
      const o2 = t2.options.attachTo || {}, i2 = Object.assign({}, o2);
      if (e(i2.element) && (i2.element = i2.element.call(t2)), n(i2.element)) {
        try {
          i2.element = document.querySelector(i2.element);
        } catch (t3) {
        }
        i2.element;
      }
      return i2;
    })(this), this._resolvedAttachTo;
  }
  _getResolvedAttachToOptions() {
    return null === this._resolvedAttachTo ? this._resolveAttachToOptions() : this._resolvedAttachTo;
  }
  isOpen() {
    return Boolean(this.el && !this.el.hidden);
  }
  show() {
    return e(this.options.beforeShowPromise) ? Promise.resolve(this.options.beforeShowPromise()).then(() => this._show()) : Promise.resolve(this._show());
  }
  updateStepOptions(t2) {
    Object.assign(this.options, t2), this.shepherdElementComponent && this.el && (this._teardownElements(), this._setupElements());
  }
  getElement() {
    return this.el;
  }
  getTarget() {
    return this.target;
  }
  _storeOriginalTabIndex(t2) {
    const e2 = t2.getAttribute("tabindex");
    null !== e2 && this._originalTabIndexes.set(t2, e2);
  }
  _restoreOriginalTabIndexes() {
    const t2 = this.target;
    t2 && (this._originalTabIndexes.has(t2) ? t2.setAttribute("tabindex", this._originalTabIndexes.get(t2)) : t2.removeAttribute("tabindex"));
  }
  _createTooltipContent() {
    const t2 = `${this.id}-description`, e2 = `${this.id}-label`;
    this.shepherdElementComponent = (function(t3) {
      var e3, i2, s2, r2;
      const { classPrefix: l2, descriptionId: c2, labelId: a2, step: u2 } = t3;
      let h2, d2, f2, p2, g2, m2, v2;
      const y2 = null != (e3 = null == (i2 = u2.options) || null == (i2 = i2.cancelIcon) ? void 0 : i2.enabled) && e3, x2 = null != (s2 = null == (r2 = u2.options) ? void 0 : r2.title) && s2, b2 = (t4) => {
        const { tour: e4 } = u2;
        switch (t4.keyCode) {
          case 9:
            if ((!d2 || 0 === d2.length) && m2 && 0 === m2.length) {
              t4.preventDefault();
              break;
            }
            var n2, o2, i3;
            if (t4.shiftKey) {
              if (document.activeElement === g2 || null != (n2 = document.activeElement) && n2.classList.contains("shepherd-element")) t4.preventDefault(), null == (o2 = null != p2 ? p2 : v2) || o2.focus();
              else if (document.activeElement === f2) {
                var s3;
                t4.preventDefault(), null == (s3 = v2) || s3.focus();
              }
            } else if (document.activeElement === v2) t4.preventDefault(), null == (i3 = null != f2 ? f2 : g2) || i3.focus();
            else if (document.activeElement === p2) {
              var r3;
              t4.preventDefault(), null == (r3 = g2) || r3.focus();
            }
            break;
          case 27:
            e4.options.exitOnEsc && (t4.preventDefault(), t4.stopPropagation(), u2.cancel());
            break;
          case 37:
            e4.options.keyboardNavigation && (t4.preventDefault(), t4.stopPropagation(), e4.back());
            break;
          case 39:
            e4.options.keyboardNavigation && (t4.preventDefault(), t4.stopPropagation(), e4.next());
        }
      }, w2 = Zt("dialog", { "aria-describedby": o(u2.options.text) ? null : c2, "aria-labelledby": u2.options.title ? a2 : null, class: ["shepherd-element", y2 ? "shepherd-has-cancel-icon" : "", x2 ? "shepherd-has-title" : ""].filter(Boolean).join(" "), [`data-${l2}shepherd-step-id`]: u2.id, onkeydown: b2, open: "true" });
      if (u2.options.arrow && u2.options.attachTo && u2.options.attachTo.element && u2.options.attachTo.on && w2.append(Zt("div", { class: "shepherd-arrow", "data-popper-arrow": "" })), w2.append(ne(c2, a2, u2)), n(u2.options.classes)) {
        const t4 = u2.options.classes.split(" ").filter((t5) => !!t5.length);
        t4.length && w2.classList.add(...t4);
      }
      const E2 = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]';
      m2 = [...w2.querySelectorAll(E2)], g2 = m2[0], v2 = m2[m2.length - 1];
      const O2 = u2._getResolvedAttachToOptions();
      return null != O2 && O2.element && (h2 = O2.element, u2._storeOriginalTabIndex(h2), h2.tabIndex = 0, d2 = [h2, ...h2.querySelectorAll(E2)], f2 = d2[0], p2 = d2[d2.length - 1], h2.addEventListener("keydown", b2)), { element: w2, cleanup: () => {
        var t4;
        null == (t4 = h2) || t4.removeEventListener("keydown", b2);
      } };
    })({ classPrefix: this.classPrefix, descriptionId: t2, labelId: e2, step: this });
    return (this.tour.options.stepsContainer || document.body).append(this.shepherdElementComponent.element), this.shepherdElementComponent.element;
  }
  _scrollTo(t2) {
    const { element: n2 } = this._getResolvedAttachToOptions();
    e(this.options.scrollToHandler) ? this.options.scrollToHandler(n2) : n2 instanceof Element && "function" == typeof n2.scrollIntoView && n2.scrollIntoView(t2);
  }
  _getClassOptions(t2) {
    const e2 = this.tour && this.tour.options && this.tour.options.defaultStepOptions, n2 = t2.classes ? t2.classes : "", o2 = e2 && e2.classes ? e2.classes : "", i2 = [...n2.split(" "), ...o2.split(" ")], s2 = new Set(i2);
    return Array.from(s2).join(" ").trim();
  }
  _setOptions(t2 = {}) {
    let e2 = this.tour && this.tour.options && this.tour.options.defaultStepOptions;
    e2 = m({}, e2 || {}), this.options = Object.assign({ arrow: true }, e2, t2, (function(t3, e3) {
      return { floatingUIOptions: m(t3.floatingUIOptions || {}, e3.floatingUIOptions || {}) };
    })(e2, t2));
    const { when: n2 } = this.options;
    this.options.classes = this._getClassOptions(t2), this.destroy(), this.id = this.options.id || `step-${O()}`, n2 && Object.keys(n2).forEach((t3) => {
      this.on(t3, n2[t3], this);
    });
  }
  _setupElements() {
    o(this.el) || this.destroy(), this.el = this._createTooltipContent(), this.options.advanceOn && b(this), Xt(this);
  }
  _show() {
    var t2;
    this.trigger("before-show"), this._resolveAttachToOptions(), this._resolveExtraHiglightElements(), this._setupElements(), this.tour.modal || this.tour.setupModal(), null == (t2 = this.tour.modal) || t2.setupForStep(this), this._styleTargetElementForStep(this), this.el && (this.el.hidden = false), this.options.scrollTo && setTimeout(() => {
      this._scrollTo(this.options.scrollTo);
    }), this.el && (this.el.hidden = false);
    const e2 = this.shepherdElementComponent.element, n2 = this.target || document.body, o2 = this._resolvedExtraHighlightElements;
    n2.classList.add(`${this.classPrefix}shepherd-enabled`), n2.classList.add(`${this.classPrefix}shepherd-target`), e2.classList.add("shepherd-enabled"), null == o2 || o2.forEach((t3) => {
      t3.classList.add(`${this.classPrefix}shepherd-enabled`), t3.classList.add(`${this.classPrefix}shepherd-target`);
    }), this.trigger("show");
  }
  _styleTargetElementForStep(t2) {
    const e2 = t2.target, n2 = t2._resolvedExtraHighlightElements;
    if (!e2) return;
    const o2 = t2.options.highlightClass;
    o2 && (e2.classList.add(o2), null == n2 || n2.forEach((t3) => t3.classList.add(o2))), e2.classList.remove("shepherd-target-click-disabled"), null == n2 || n2.forEach((t3) => t3.classList.remove("shepherd-target-click-disabled")), false === t2.options.canClickTarget && (e2.classList.add("shepherd-target-click-disabled"), null == n2 || n2.forEach((t3) => t3.classList.add("shepherd-target-click-disabled")));
  }
  _updateStepTargetOnHide() {
    const t2 = this.target || document.body, e2 = this._resolvedExtraHighlightElements, n2 = this.options.highlightClass;
    n2 && (t2.classList.remove(n2), null == e2 || e2.forEach((t3) => t3.classList.remove(n2))), t2.classList.remove("shepherd-target-click-disabled", `${this.classPrefix}shepherd-enabled`, `${this.classPrefix}shepherd-target`), null == e2 || e2.forEach((t3) => {
      t3.classList.remove("shepherd-target-click-disabled", `${this.classPrefix}shepherd-enabled`, `${this.classPrefix}shepherd-target`);
    }), this._restoreOriginalTabIndexes();
  }
};
function ie(t2) {
  let e2, n2 = [{ width: 0, height: 0, x: 0, y: 0, r: 0 }];
  const o2 = Gt("path"), i2 = Gt("svg", { class: "shepherd-modal-overlay-container" }, o2);
  function s2() {
    o2.setAttribute("d", (function(t3) {
      let e3 = "";
      const { innerWidth: n3, innerHeight: o3 } = window;
      return t3.forEach((t4) => {
        const { width: n4, height: o4, x: i3 = 0, y: s3 = 0, r: r3 = 0 } = t4, { topLeft: l3 = 0, topRight: c3 = 0, bottomRight: a3 = 0, bottomLeft: u3 = 0 } = "number" == typeof r3 ? { topLeft: r3, topRight: r3, bottomRight: r3, bottomLeft: r3 } : r3;
        e3 += `M${i3 + l3},${s3}a${l3},${l3},0,0,0-${l3},${l3}V` + (o4 + s3 - u3) + `a${u3},${u3},0,0,0,${u3},${u3}H` + (n4 + i3 - a3) + `a${a3},${a3},0,0,0,${a3}-${a3}V${s3 + c3}a${c3},${c3},0,0,0-${c3}-${c3}Z`;
      }), `M${n3},${o3}H0V0H${n3}V${o3}Z${e3}`.replace(/\s/g, "");
    })(n2));
  }
  function r2() {
    n2 = [{ width: 0, height: 0, x: 0, y: 0, r: 0 }], s2();
  }
  function l2() {
    i2.classList.remove("shepherd-modal-is-visible"), d2();
  }
  function c2() {
    i2.classList.add("shepherd-modal-is-visible");
  }
  function a2(t3 = 0, e3 = 0, o3 = 0, i3 = 0, l3, c3, a3) {
    if (c3) {
      {
        const s3 = [c3, ...a3 || []], r3 = [];
        for (const n3 of s3) {
          if (!n3) continue;
          if (s3.indexOf(n3) !== s3.lastIndexOf(n3)) continue;
          const { y: c4, height: a4 } = p2(n3, l3), { x: u3, width: h3, left: d3 } = n3.getBoundingClientRect();
          s3.some((t4) => {
            if (t4 === n3) return false;
            const e4 = t4.getBoundingClientRect(), { y: o4, height: i4 } = p2(t4, l3);
            return u3 >= e4.left && u3 + h3 <= e4.left + e4.width && c4 >= o4 && c4 + a4 <= o4 + i4;
          }) || r3.push({ width: h3 + 2 * t3, height: a4 + 2 * t3, x: (u3 || d3) + o3 - t3, y: c4 + i3 - t3, r: e3 });
        }
        n2 = r3;
      }
      s2();
    } else r2();
  }
  function u2(t3) {
    t3.stopPropagation();
  }
  i2.addEventListener("touchmove", u2), s2(), t2.append(i2);
  const h2 = (t3) => {
    t3.preventDefault();
  };
  function d2() {
    e2 && (cancelAnimationFrame(e2), e2 = void 0), window.removeEventListener("touchmove", h2, { passive: false });
  }
  function f2(t3) {
    if (!t3) return null;
    const e3 = t3 instanceof HTMLElement && window.getComputedStyle(t3).overflowY;
    return "hidden" !== e3 && "visible" !== e3 && t3.scrollHeight >= t3.clientHeight ? t3 : f2(t3.parentElement);
  }
  function p2(t3, e3) {
    const n3 = t3.getBoundingClientRect();
    let o3 = n3.y || n3.top, i3 = n3.bottom || o3 + n3.height;
    if (e3) {
      const t4 = e3.getBoundingClientRect(), n4 = t4.y || t4.top, s3 = t4.bottom || n4 + t4.height;
      o3 = Math.max(o3, n4), i3 = Math.min(i3, s3);
    }
    return { y: o3, height: Math.max(i3 - o3, 0) };
  }
  return { closeModalOpening: r2, destroy: function() {
    d2(), i2.removeEventListener("touchmove", u2), i2.remove();
  }, hide: l2, positionModal: a2, setupForStep: function(t3) {
    d2(), t3.tour.options.useModalOverlay ? (!(function(t4) {
      const { modalOverlayOpeningPadding: n3, modalOverlayOpeningRadius: o3, modalOverlayOpeningXOffset: i3 = 0, modalOverlayOpeningYOffset: s3 = 0 } = t4.options, r3 = (function(t5) {
        const e3 = { top: 0, left: 0 };
        if (!t5) return e3;
        let n4 = t5.ownerDocument.defaultView;
        try {
          for (; n4 && n4 !== window.top; ) {
            var o4;
            const t6 = null == (o4 = n4) ? void 0 : o4.frameElement;
            if (t6) {
              const n5 = t6.getBoundingClientRect();
              e3.top += n5.top + t6.scrollTop, e3.left += n5.left + t6.scrollLeft;
            }
            n4 = n4.parent;
          }
        } catch (t6) {
        }
        return e3;
      })(t4.target), l3 = f2(t4.target), c3 = () => {
        e2 = void 0, a2(n3, o3, i3 + r3.left, s3 + r3.top, l3, t4.target, t4._resolvedExtraHighlightElements), e2 = requestAnimationFrame(c3);
      };
      c3(), window.addEventListener("touchmove", h2, { passive: false });
    })(t3), c2()) : l2();
  }, show: c2, getElement: function() {
    return i2;
  } };
}
var se = class extends i {
  constructor() {
    super(), this.activeTour = void 0, x(this);
  }
};
var re = new se();
var le = "undefined" == typeof window;
re.Step = le ? class {
  constructor(t2) {
  }
} : oe, re.Tour = le ? class {
  constructor(t2, e2) {
  }
} : class extends i {
  constructor(t2 = {}) {
    super(), this.trackedEvents = ["active", "cancel", "complete", "show"], this.classPrefix = void 0, this.currentStep = void 0, this.focusedElBeforeOpen = void 0, this.id = void 0, this.modal = void 0, this.options = void 0, this.steps = void 0, x(this);
    this.options = Object.assign({}, { exitOnEsc: true, keyboardNavigation: true }, t2), this.classPrefix = w(this.options.classPrefix), this.steps = [], this.addSteps(this.options.steps);
    return ["active", "cancel", "complete", "inactive", "show", "start"].map((t3) => {
      ((t4) => {
        this.on(t4, (e2) => {
          (e2 = e2 || {}).tour = this, re.trigger(t4, e2);
        });
      })(t3);
    }), this._setTourID(t2.id), this;
  }
  addStep(t2, e2) {
    let n2 = t2;
    return n2 instanceof oe ? n2.tour = this : n2 = new oe(this, n2), o(e2) ? this.steps.push(n2) : this.steps.splice(e2, 0, n2), n2;
  }
  addSteps(t2) {
    return Array.isArray(t2) && t2.forEach((t3) => {
      this.addStep(t3);
    }), this;
  }
  back() {
    const t2 = this.steps.indexOf(this.currentStep);
    this.show(t2 - 1, false);
  }
  async cancel() {
    if (this.options.confirmCancel) {
      const t2 = this.options.confirmCancelMessage || "Are you sure you want to stop the tour?";
      let n2;
      n2 = e(this.options.confirmCancel) ? await this.options.confirmCancel() : window.confirm(t2), n2 && this._done("cancel");
    } else this._done("cancel");
  }
  complete() {
    this._done("complete");
  }
  getById(t2) {
    return this.steps.find((e2) => e2.id === t2);
  }
  getCurrentStep() {
    return this.currentStep;
  }
  hide() {
    const t2 = this.getCurrentStep();
    if (t2) return t2.hide();
  }
  isActive() {
    return re.activeTour === this;
  }
  next() {
    const t2 = this.steps.indexOf(this.currentStep);
    t2 === this.steps.length - 1 ? this.complete() : this.show(t2 + 1, true);
  }
  removeStep(t2) {
    const e2 = this.getCurrentStep();
    this.steps.some((e3, n2) => {
      if (e3.id === t2) return e3.isOpen() && e3.hide(), e3.destroy(), this.steps.splice(n2, 1), true;
    }), e2 && e2.id === t2 && (this.currentStep = void 0, this.steps.length ? this.show(0) : this.cancel());
  }
  show(t2 = 0, o2 = true) {
    const i2 = n(t2) ? this.getById(t2) : this.steps[t2];
    if (i2) {
      this._updateStateBeforeShow();
      e(i2.options.showOn) && !i2.options.showOn() ? this._skipStep(i2, o2) : (this.currentStep = i2, this.trigger("show", { step: i2, previous: this.currentStep }), i2.show());
    }
  }
  async start() {
    this.trigger("start"), this.focusedElBeforeOpen = document.activeElement, this.currentStep = null, this.setupModal(), this._setupActiveTour(), this.next();
  }
  _done(e2) {
    const n2 = this.steps.indexOf(this.currentStep);
    Array.isArray(this.steps) && this.steps.forEach((t2) => t2.destroy()), (function(e3) {
      if (e3) {
        const { steps: n3 } = e3;
        n3.forEach((e4) => {
          e4.options && false === e4.options.canClickTarget && e4.options.attachTo && (t(e4.target) && e4.target.classList.remove("shepherd-target-click-disabled"), e4._resolvedExtraHighlightElements && e4._resolvedExtraHighlightElements.forEach((e5) => {
            t(e5) && e5.classList.remove("shepherd-target-click-disabled");
          }));
        });
      }
    })(this), this.trigger(e2, { index: n2 }), re.activeTour = null, this.trigger("inactive", { tour: this }), this.modal && this.modal.hide(), "cancel" !== e2 && "complete" !== e2 || this.modal && (this.modal.destroy(), this.modal = null), t(this.focusedElBeforeOpen) && this.focusedElBeforeOpen.focus();
  }
  _setupActiveTour() {
    this.trigger("active", { tour: this }), re.activeTour = this;
  }
  setupModal() {
    const t2 = this.options.modalContainer || document.body;
    this.modal = ie(t2);
  }
  _skipStep(t2, e2) {
    const n2 = this.steps.indexOf(t2), o2 = e2 ? n2 + 1 : n2 - 1;
    o2 < 0 ? this.cancel() : o2 >= this.steps.length ? this.complete() : this.show(o2, e2);
  }
  _updateStateBeforeShow() {
    this.currentStep && this.currentStep.hide(), this.isActive() || this._setupActiveTour();
  }
  _setTourID(t2) {
    const e2 = this.options.tourName || "tour", n2 = t2 || O();
    this.id = `${e2}--${n2}`;
  }
};

// node_modules/angular-shepherd/dist/fesm2022/angular-shepherd.mjs
function elementIsHidden(element) {
  return element.offsetWidth === 0 && element.offsetHeight === 0;
}
function makeButton(button) {
  const {
    classes,
    disabled,
    label,
    secondary,
    type,
    text
  } = button;
  const builtInButtonTypes = ["back", "cancel", "next"];
  if (!type) {
    return button;
  }
  if (builtInButtonTypes.indexOf(type) === -1) {
    throw new Error(`'type' property must be one of 'back', 'cancel', or 'next'`);
  }
  return {
    action: this[type].bind(this),
    classes,
    disabled,
    label,
    secondary,
    text
  };
}
var ShepherdService = class _ShepherdService {
  constructor() {
    this.confirmCancel = false;
    this.defaultStepOptions = {};
    this.exitOnEsc = true;
    this.isActive = false;
    this.keyboardNavigation = true;
    this.messageForUser = null;
    this.modal = false;
    this.requiredElements = [];
    this.tourName = void 0;
    this.tourObject = null;
  }
  /**
   * Get the tour object and call back
   */
  back() {
    this.tourObject?.back();
  }
  /**
   * Cancel the tour
   */
  cancel() {
    this.tourObject?.cancel();
  }
  /**
   * Complete the tour
   */
  complete() {
    this.tourObject?.complete();
  }
  /**
   * Hides the current step
   */
  hide() {
    this.tourObject?.hide();
  }
  /**
   * Advance the tour to the next step
   */
  next() {
    this.tourObject?.next();
  }
  /**
   * Show a specific step, by passing its id
   * @param id The id of the step you want to show
   */
  show(id) {
    this.tourObject?.show(id);
  }
  /**
   * Start the tour
   */
  start() {
    this.isActive = true;
    this.tourObject?.start();
  }
  /**
   * This function is called when a tour is completed or cancelled to initiate cleanup.
   * @param completeOrCancel 'complete' or 'cancel'
   */
  onTourFinish(completeOrCancel) {
    this.isActive = false;
  }
  /**
   * Take a set of steps and create a tour object based on the current configuration
   * @param steps An array of steps
   */
  addSteps(steps) {
    this._initialize();
    const tour = this.tourObject;
    if (!tour || !steps || !Array.isArray(steps) || steps.length === 0) {
      return;
    }
    if (!this.requiredElementsPresent()) {
      tour.addStep({
        buttons: [{
          text: "Exit",
          action: tour.cancel
        }],
        id: "error",
        title: this.errorTitle,
        text: [this.messageForUser]
      });
      return;
    }
    steps.forEach((step) => {
      if (step.buttons) {
        step.buttons = step.buttons.map(makeButton.bind(this), this);
      }
      tour.addStep(step);
    });
  }
  /**
   * Observes the array of requiredElements, which are the elements that must be present at the start of the tour,
   * and determines if they exist, and are visible, if either is false, it will stop the tour from executing.
   */
  requiredElementsPresent() {
    let allElementsPresent = true;
    this.requiredElements.forEach((element) => {
      const selectedElement = document.querySelector(element.selector);
      if (allElementsPresent && (!selectedElement || elementIsHidden(selectedElement))) {
        allElementsPresent = false;
        this.errorTitle = element.title;
        this.messageForUser = element.message;
      }
    });
    return allElementsPresent;
  }
  /**
   * Initializes the tour, creates a new Shepherd.Tour. sets options, and binds events.
   */
  _initialize() {
    const tourObject = new re.Tour({
      confirmCancel: this.confirmCancel,
      confirmCancelMessage: this.confirmCancelMessage,
      defaultStepOptions: this.defaultStepOptions,
      keyboardNavigation: this.keyboardNavigation,
      tourName: this.tourName,
      useModalOverlay: this.modal,
      exitOnEsc: this.exitOnEsc
    });
    tourObject.on("complete", this.onTourFinish.bind(this, "complete"));
    tourObject.on("cancel", this.onTourFinish.bind(this, "cancel"));
    this.tourObject = tourObject;
  }
  static {
    this.\u0275fac = function ShepherdService_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _ShepherdService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({
      token: _ShepherdService,
      factory: _ShepherdService.\u0275fac,
      providedIn: "root"
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ShepherdService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();

// src/app/core/services/tour.service.ts
var KEY_TOUR_BUSQUEDA = "tour_busqueda_completado";
var KEY_TOUR_RESULTADOS = "tour_resultados_completado";
var TourService = class _TourService {
  // ── Inyección de dependencias ─────────────────────────────────────────────
  shepherd = inject(ShepherdService);
  // ── Estado reactivo RxJS ──────────────────────────────────────────────────
  _tourActivo$ = new BehaviorSubject(false);
  tourActivo$ = this._tourActivo$.asObservable();
  // ── FASE 1: Tour del Buscador Inicial ──────────────────────────────────────
  /**
   * Inicia la primera fase del tour guiado (Inputs de búsqueda y Botón Buscar).
   * Se debe llamar en `ngAfterViewInit` cuando la pantalla de inicio está lista.
   */
  startSearchTour() {
    if (localStorage.getItem(KEY_TOUR_BUSQUEDA) === "true") {
      return;
    }
    this.limpiarPasosPrevios();
    this.configurarOpcionesDefault();
    this.shepherd.addSteps([
      {
        id: "paso-inputs-busqueda",
        attachTo: { element: ".busqueda-section", on: "bottom" },
        title: "Par\xE1metros de B\xFAsqueda",
        text: "Ingrese aqu\xED los datos del comprobante (Tipo, Letra, Punto de Venta y N\xFAmero) para realizar la consulta.",
        buttons: [
          {
            text: "Siguiente \u2192",
            classes: "shepherd-button-primary",
            action: () => this.shepherd.next()
          }
        ]
      },
      {
        id: "paso-btn-buscar",
        attachTo: { element: ".btn-buscar", on: "bottom" },
        title: "Ejecutar B\xFAsqueda",
        text: "Una vez completados los par\xE1metros, haga clic aqu\xED para traer la informaci\xF3n desde el servidor.",
        buttons: [
          {
            text: "\u2190 Atr\xE1s",
            classes: "shepherd-button-secondary",
            action: () => this.shepherd.back()
          },
          {
            text: "Finalizar \u2713",
            classes: "shepherd-button-primary",
            action: () => {
              this.shepherd.complete();
              this.finalizarTourBusqueda();
            }
          }
        ]
      }
    ]);
    this.suscribirEventosFin(() => this.finalizarTourBusqueda());
    this._tourActivo$.next(true);
    this.shepherd.start();
  }
  // ── FASE 2: Tour de Resultados (Orden Top-to-Bottom de la UI) ─────────────
  /**
   * Inicia la segunda fase del tour guiado respetando estrictamente el orden visual:
   * Filtros → Contadores → Limpieza → Acciones → Grilla AG Grid → Totales Footer.
   */
  startResultsTour() {
    if (localStorage.getItem(KEY_TOUR_RESULTADOS) === "true") {
      return;
    }
    this.limpiarPasosPrevios();
    this.configurarOpcionesDefault();
    this.shepherd.addSteps([
      // 1. Filtros de Resultados
      {
        id: "paso-filtros-dinamicos",
        attachTo: { element: ".filtros-grid", on: "bottom" },
        title: "Filtros de Resultados",
        text: "Utilice estos desplegables y casillas de verificaci\xF3n para acotar los registros mostrados por paciente, profesional, prestaci\xF3n o fecha.",
        buttons: [
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      },
      // 2. Documentos Aceptados
      {
        id: "paso-contador-aceptados",
        attachTo: { element: ".contador-aceptados", on: "bottom" },
        title: "Documentos Aceptados",
        text: "Muestra la cantidad total de documentos que fueron aprobados sin d\xE9bitos.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      },
      // 3. Total Debitado Acumulado
      {
        id: "paso-contador-debitado",
        attachTo: { element: ".contador-debitado", on: "bottom" },
        title: "Total Debitado Acumulado",
        text: "Muestra la suma del importe neto de los d\xE9bitos aplicados en la auditor\xEDa.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      },
      // 4. Total a Refacturar
      {
        id: "paso-contador-refacturar",
        attachTo: { element: ".contador-refacturar", on: "bottom" },
        title: "Total a Refacturar",
        text: "Indica el monto total acumulado habilitado para ser enviado a refacturaci\xF3n.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      },
      // 5. Limpiar Filas
      {
        id: "paso-btn-limpiar-filas",
        attachTo: { element: ".btn-clear-rows", on: "bottom" },
        title: "Limpiar Filas",
        text: "Borra los datos de d\xE9bitos y refacturas cargados en las filas seleccionadas de la grilla.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      },
      // 6. Exportar a Excel
      {
        id: "paso-exportar-excel",
        attachTo: { element: ".btn-exportar", on: "left" },
        title: "Exportar a Excel",
        text: "Descarga la informaci\xF3n de las prestaciones de la grilla a una planilla de c\xE1lculo Excel.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      },
      // 7. Guardar Parcialmente
      {
        id: "paso-guardar-parcialmente",
        attachTo: { element: ".btn-guardar", on: "left" },
        title: "Guardar Parcialmente",
        text: "Guarda temporalmente el avance realizado en d\xE9bitos y refacturas sin cerrar el documento.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      },
      // 8. Nueva Nota de Crédito / Débito
      {
        id: "paso-nueva-nota",
        attachTo: { element: ".btn-nueva-nota", on: "left" },
        title: "Nueva Nota de Cr\xE9dito / D\xE9bito",
        text: "Abre el formulario para generar el nuevo comprobante definitivo seg\xFAn la auditor\xEDa.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      },
      // 9. Grilla de Resultados (AG Grid)
      {
        id: "paso-grilla-resultados",
        attachTo: { element: ".tabla-grid-container", on: "top" },
        title: "Grilla de Resultados",
        text: "Aqu\xED se visualizan las prestaciones. Puede ordenar columnas y seleccionar m\xFAltiples filas para realizar modificaciones masivas.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      },
      // 10. Total Cantidad
      {
        id: "paso-total-cantidad",
        attachTo: { element: ".total-cantidad-item", on: "top" },
        title: "Total Cantidad",
        text: "Suma de las cantidades de todas las prestaciones visibles en la grilla.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      },
      // 11. Total Neto
      {
        id: "paso-total-neto",
        attachTo: { element: ".total-neto-item", on: "top" },
        title: "Total Neto",
        text: "Sumatoria del importe neto acumulado de todas las prestaciones.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      },
      // 12. Coseguro
      {
        id: "paso-total-coseguro",
        attachTo: { element: ".total-coseguro-item", on: "top" },
        title: "Coseguro",
        text: "Monto total del coseguro acumulado a cargo del paciente en este comprobante.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      },
      // 13. Total Facturado
      {
        id: "paso-total-facturado",
        attachTo: { element: ".total-facturado-item", on: "top" },
        title: "Total Facturado",
        text: "Importe total consolidado del documento (suma de Neto + Coseguro).",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      },
      // 14. Total Debitado
      {
        id: "paso-total-debitado",
        attachTo: { element: ".total-debitado-item", on: "top" },
        title: "Total Debitado",
        text: "Sumatoria total de los importes de d\xE9bitos aplicados a las prestaciones.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      },
      // 15. Total Refacturado (FIN DEL TOUR)
      {
        id: "paso-total-refacturado",
        attachTo: { element: ".total-refacturado-item", on: "top" },
        title: "Total Refacturado",
        text: "Monto total aprobado y disponible para una nueva refacturaci\xF3n.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          {
            text: "Finalizar \u2713",
            classes: "shepherd-button-primary",
            action: () => {
              this.shepherd.complete();
              this.finalizarTourResultados();
            }
          }
        ]
      }
    ]);
    this.suscribirEventosFin(() => this.finalizarTourResultados());
    this._tourActivo$.next(true);
    this.shepherd.start();
  }
  // ── TOUR REPRODUCIBLE A DEMANDA ───────────────────────────────────────────
  /**
   * Ejecuta manualmente el tour completo desde el botón de ayuda de la interfaz.
   * Ignora las banderas de localStorage y encadena todos los pasos disponibles.
   */
  startFullTour(hasResults) {
    this.limpiarPasosPrevios();
    this.configurarOpcionesDefault();
    const pasos = [
      {
        id: "paso-inputs-busqueda",
        attachTo: { element: ".busqueda-section", on: "bottom" },
        title: "Par\xE1metros de B\xFAsqueda",
        text: "Ingrese aqu\xED los datos del comprobante (Tipo, Letra, Punto de Venta y N\xFAmero) para realizar la consulta.",
        buttons: [
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      },
      {
        id: "paso-btn-buscar",
        attachTo: { element: ".btn-buscar", on: "bottom" },
        title: "Ejecutar B\xFAsqueda",
        text: "Una vez completados los par\xE1metros, haga clic aqu\xED para traer la informaci\xF3n desde el servidor.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          {
            text: hasResults ? "Siguiente \u2192" : "Finalizar \u2713",
            classes: "shepherd-button-primary",
            action: () => {
              if (hasResults) {
                this.shepherd.next();
              } else {
                this.shepherd.complete();
              }
            }
          }
        ]
      }
    ];
    if (hasResults) {
      pasos.push({
        id: "paso-filtros-dinamicos",
        attachTo: { element: ".filtros-grid", on: "bottom" },
        title: "Filtros de Resultados",
        text: "Utilice estos desplegables y casillas de verificaci\xF3n para acotar los registros mostrados por paciente, profesional, prestaci\xF3n o fecha.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      }, {
        id: "paso-contador-aceptados",
        attachTo: { element: ".contador-aceptados", on: "bottom" },
        title: "Documentos Aceptados",
        text: "Muestra la cantidad total de documentos que fueron aprobados sin d\xE9bitos.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      }, {
        id: "paso-contador-debitado",
        attachTo: { element: ".contador-debitado", on: "bottom" },
        title: "Total Debitado Acumulado",
        text: "Muestra la suma del importe neto de los d\xE9bitos aplicados en la auditor\xEDa.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      }, {
        id: "paso-contador-refacturar",
        attachTo: { element: ".contador-refacturar", on: "bottom" },
        title: "Total a Refacturar",
        text: "Indica el monto total acumulado habilitado para ser enviado a refacturaci\xF3n.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      }, {
        id: "paso-btn-limpiar-filas",
        attachTo: { element: ".btn-clear-rows", on: "bottom" },
        title: "Limpiar Filas",
        text: "Borra los datos de d\xE9bitos y refacturas cargados en las filas seleccionadas de la grilla.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      }, {
        id: "paso-exportar-excel",
        attachTo: { element: ".btn-exportar", on: "left" },
        title: "Exportar a Excel",
        text: "Descarga la informaci\xF3n de las prestaciones de la grilla a una planilla de c\xE1lculo Excel.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      }, {
        id: "paso-guardar-parcialmente",
        attachTo: { element: ".btn-guardar", on: "left" },
        title: "Guardar Parcialmente",
        text: "Guarda temporalmente el avance realizado en d\xE9bitos y refacturas sin cerrar el documento.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      }, {
        id: "paso-nueva-nota",
        attachTo: { element: ".btn-nueva-nota", on: "left" },
        title: "Nueva Nota de Cr\xE9dito / D\xE9bito",
        text: "Abre el formulario para generar el nuevo comprobante definitivo seg\xFAn la auditor\xEDa.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      }, {
        id: "paso-grilla-resultados",
        attachTo: { element: ".tabla-grid-container", on: "top" },
        title: "Grilla de Resultados",
        text: "Aqu\xED se visualizan las prestaciones. Puede ordenar columnas y seleccionar m\xFAltiples filas para realizar modificaciones masivas.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      }, {
        id: "paso-total-cantidad",
        attachTo: { element: ".total-cantidad-item", on: "top" },
        title: "Total Cantidad",
        text: "Suma de las cantidades de todas las prestaciones visibles en la grilla.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      }, {
        id: "paso-total-neto",
        attachTo: { element: ".total-neto-item", on: "top" },
        title: "Total Neto",
        text: "Sumatoria del importe neto acumulado de todas las prestaciones.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      }, {
        id: "paso-total-coseguro",
        attachTo: { element: ".total-coseguro-item", on: "top" },
        title: "Coseguro",
        text: "Monto total del coseguro acumulado a cargo del paciente en este comprobante.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      }, {
        id: "paso-total-facturado",
        attachTo: { element: ".total-facturado-item", on: "top" },
        title: "Total Facturado",
        text: "Importe total consolidado del documento (suma de Neto + Coseguro).",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      }, {
        id: "paso-total-debitado",
        attachTo: { element: ".total-debitado-item", on: "top" },
        title: "Total Debitado",
        text: "Sumatoria total de los importes de d\xE9bitos aplicados a las prestaciones.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          { text: "Siguiente \u2192", classes: "shepherd-button-primary", action: () => this.shepherd.next() }
        ]
      }, {
        id: "paso-total-refacturado",
        attachTo: { element: ".total-refacturado-item", on: "top" },
        title: "Total Refacturado",
        text: "Monto total aprobado y disponible para una nueva refacturaci\xF3n.",
        buttons: [
          { text: "\u2190 Atr\xE1s", classes: "shepherd-button-secondary", action: () => this.shepherd.back() },
          {
            text: "Finalizar \u2713",
            classes: "shepherd-button-primary",
            action: () => this.shepherd.complete()
          }
        ]
      });
    }
    this.shepherd.addSteps(pasos);
    this._tourActivo$.next(true);
    this.shepherd.start();
  }
  // ── Métodos de Ayuda Privados ──────────────────────────────────────────────
  configurarOpcionesDefault() {
    this.shepherd.defaultStepOptions = {
      cancelIcon: { enabled: true },
      scrollTo: { behavior: "smooth", block: "center" },
      modalOverlayOpeningPadding: 6,
      modalOverlayOpeningRadius: 4
    };
    this.shepherd.modal = true;
    this.shepherd.confirmCancel = false;
  }
  limpiarPasosPrevios() {
    if (this.shepherd.tourObject) {
      this.shepherd.tourObject.steps = [];
    }
  }
  suscribirEventosFin(callbackFinalizar) {
    if (this.shepherd.tourObject) {
      this.shepherd.tourObject.once("complete", callbackFinalizar);
      this.shepherd.tourObject.once("cancel", callbackFinalizar);
    }
  }
  finalizarTourBusqueda() {
    localStorage.setItem(KEY_TOUR_BUSQUEDA, "true");
    this._tourActivo$.next(false);
  }
  finalizarTourResultados() {
    localStorage.setItem(KEY_TOUR_RESULTADOS, "true");
    this._tourActivo$.next(false);
  }
  static \u0275fac = function TourService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _TourService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _TourService, factory: _TourService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(TourService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();

// src/app/core/services/notificacion.service.ts
var NotificacionService = class _NotificacionService {
  http = inject(HttpClient);
  authService = inject(AuthService);
  apiUrl = `${environment.apiUrl}/api/notificaciones`;
  notificacionesSubject = new BehaviorSubject([]);
  notificaciones$ = this.notificacionesSubject.asObservable();
  noLeidasCountSubject = new BehaviorSubject(0);
  noLeidasCount$ = this.noLeidasCountSubject.asObservable();
  // Emite cuando se selecciona una notificación para que la vista de Auditoría abra ese comprobante o muestre el modal de reporte
  notificacionSeleccionadaSubject = new Subject();
  notificacionSeleccionada$ = this.notificacionSeleccionadaSubject.asObservable();
  pollingSub;
  constructor() {
    this.iniciarPolling();
    this.authService.autenticado$.subscribe((isAuth) => {
      if (isAuth && (this.authService.esAdminReal() || this.authService.isAdmin())) {
        this.cargarNotificaciones();
      } else if (!isAuth) {
        this.notificacionesSubject.next([]);
        this.noLeidasCountSubject.next(0);
      }
    });
  }
  iniciarPolling() {
    if (this.authService.isLoggedIn() && (this.authService.esAdminReal() || this.authService.isAdmin())) {
      this.cargarNotificaciones();
    }
    if (!this.pollingSub) {
      this.pollingSub = interval(25e3).subscribe(() => {
        if (this.authService.isLoggedIn() && (this.authService.esAdminReal() || this.authService.isAdmin())) {
          this.cargarNotificaciones();
        }
      });
    }
  }
  cargarNotificaciones() {
    if (!this.authService.isLoggedIn())
      return;
    this.http.get(`${this.apiUrl}/recientes`).subscribe({
      next: (data) => {
        const procesadas = (data || []).map((n2) => __spreadProps(__spreadValues({}, n2), {
          leida: n2.leida === true
        }));
        const ordenadas = this.ordenarNotificaciones(procesadas);
        this.notificacionesSubject.next(ordenadas);
        const countNoLeidas = ordenadas.filter((n2) => !n2.leida).length;
        this.noLeidasCountSubject.next(countNoLeidas);
      },
      error: () => {
      }
    });
  }
  ordenarNotificaciones(lista) {
    return [...lista].sort((a2, b2) => {
      const aLeida = a2.leida === true ? 1 : 0;
      const bLeida = b2.leida === true ? 1 : 0;
      if (aLeida !== bLeida) {
        return aLeida - bLeida;
      }
      const timeA = this.obtenerTimestamp(a2.fechaHora);
      const timeB = this.obtenerTimestamp(b2.fechaHora);
      if (timeA !== timeB) {
        return aLeida === 0 ? timeB - timeA : timeA - timeB;
      }
      return aLeida === 0 ? (b2.id ?? 0) - (a2.id ?? 0) : (a2.id ?? 0) - (b2.id ?? 0);
    });
  }
  obtenerTimestamp(fecha) {
    if (!fecha)
      return 0;
    const time = new Date(fecha).getTime();
    return isNaN(time) ? 0 : time;
  }
  marcarComoLeida(id) {
    const listaActual = this.notificacionesSubject.value.map((n2) => {
      if (n2.id === id) {
        return __spreadProps(__spreadValues({}, n2), { leida: true });
      }
      return n2;
    });
    const ordenadas = this.ordenarNotificaciones(listaActual);
    this.notificacionesSubject.next(ordenadas);
    this.noLeidasCountSubject.next(ordenadas.filter((n2) => !n2.leida).length);
    this.http.put(`${this.apiUrl}/${id}/leer`, {}).subscribe({
      error: (err) => console.warn("No se pudo persistir lectura de notificaci\xF3n en BD:", err)
    });
  }
  marcarTodasComoLeidas() {
    const actualizadas = this.notificacionesSubject.value.map((n2) => __spreadProps(__spreadValues({}, n2), { leida: true }));
    const ordenadas = this.ordenarNotificaciones(actualizadas);
    this.notificacionesSubject.next(ordenadas);
    this.noLeidasCountSubject.next(0);
    this.http.put(`${this.apiUrl}/leer-todas`, {}).subscribe({
      error: (err) => console.warn("No se pudo persistir lectura masiva de notificaciones en BD:", err)
    });
  }
  navegarAComprobante(notif) {
    this.marcarComoLeida(notif.id);
    this.notificacionSeleccionadaSubject.next(notif);
  }
  reportarDocumentoNoEncontrado(documento, detalle) {
    return this.http.post(`${this.apiUrl}/reportar-no-encontrado`, {
      usuario: this.authService.obtenerUsuario(),
      tipoDoc: documento.tipo,
      letraDoc: documento.letra,
      puntoVenta: documento.puntoVenta,
      numero: documento.numero,
      detalle: detalle || ""
    });
  }
  static \u0275fac = function NotificacionService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _NotificacionService)();
  };
  static \u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _NotificacionService, factory: _NotificacionService.\u0275fac, providedIn: "root" });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NotificacionService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();

export {
  TourService,
  NotificacionService
};
//# sourceMappingURL=chunk-ITHAQXHK.js.map
