"use strict";

require("tap").mochaGlobals();
const should = require("should");

require("../../../lib/use");

const lazyAttr = require("tools/lazy-attr");

describe("lazyAttr", () => {
  class TestClass {
    constructor(name) {
      this.name = name;
    }
  }

  let called = {};
  const res = { name: "A resource" };

  lazyAttr(TestClass, {
    fruit: function(name) {
      called[name] = (called[name] || 0) + 1;
      return this.name + " Orange";
    },

    fruitLength: function(name) {
      called[name] = (called[name] || 0) + 1;
      return this.fruit.length;
    },

    res: function(name) {
      return res;
    }
  });

  it("should provide lazy attr", () => {
    const o1 = new TestClass("Fred");

    o1.fruit.should.equal("Fred Orange");

    o1.fruitLength.should.equal("Fred Orange".length);

    const o2 = new TestClass("Anne");
    o2.fruitLength.should.equal("Anne Orange".length);
    o2.fruit.should.equal("Anne Orange");

    o1.fruit.should.equal("Fred Orange");
    o2.name = "Sam";
    o2.fruit.should.equal("Anne Orange");

    called.should.deepEqual({
      fruit: 2,
      fruitLength: 2
    });
  });

  it("should throw on a non-function", () => {
    (() => lazyAttr(TestClass, { nf: {} })).should.throw(/function/);
  });

  it("should throw on non-bindable function", () => {
    (() => lazyAttr(TestClass, { nb: () => {} })).should.throw(/bindable/);
  });

  it("should throw on an attempt to set", () => {
    const o1 = new TestClass("Monda");
    (() => (o1.fruit = "Apple")).should.throw();
  });

  describe("settable attributes", () => {
    const TC = lazyAttr(
      lazyAttr(
        class {},
        {
          dyn: function() {
            return "dynamic";
          }
        },
        { rw: true }
      ),
      {
        init: function() {
          return "init";
        }
      },
      { init: true }
    );

    it("should allow rw, init props to be set", () => {
      const o = new TC();
      o.init = "INIT";
      o.dyn = "DYNAMIC";
      o.init.should.equal("INIT");
      o.dyn.should.equal("DYNAMIC");
    });

    it("should allow rw to be set after init", () => {
      const o = new TC();
      o.dyn.should.equal("dynamic");
      o.dyn = "DYNAMIC";
      o.dyn.should.equal("DYNAMIC");
      o.dyn = "STATIC";
      o.dyn.should.equal("STATIC");
    });

    it("should error init set after init", () => {
      const o = new TC();
      o.init.should.equal("init");
      (() => (o.init = "INIT")).should.throw(/already/);
    });
  });
});
