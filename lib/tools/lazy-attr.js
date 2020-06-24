"use strict";

const _ = require("lodash");

const privates = new WeakMap();

function isBindable(func) {
  return func.hasOwnProperty("prototype");
}

function lazyAttr(cl, attr = {}, opt = {}) {
  for (const [name, vf] of Object.entries(attr)) {
    if (!_.isFunction(vf))
      throw new Error(`lazy function for ${name} isn't a function`);

    if (!isBindable(vf))
      throw new Error(`lazy function ${name} is not bindable`);

    const prop = {
      get: function() {
        let me = privates.get(this);
        if (!me) privates.set(this, (me = new Map()));
        if (me.has(name)) return me.get(name);
        const val = vf.call(this, name);
        me.set(name, val);
        return val;
      }
    };

    if (opt.init || opt.rw)
      prop.set = function(val) {
        let me = privates.get(this);
        if (!me) privates.set(this, (me = new Map()));
        if (me.has(name) && !opt.rw)
          throw new Error(`${name} has already been set`);
        me.set(name, val);
      };

    Object.defineProperty(cl.prototype, name, prop);
  }

  return cl;
}

module.exports = lazyAttr;
