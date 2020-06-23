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

  it("should throw on non-bindable function", () => {
    (() => {
      lazyAttr(TestClass, { nb: () => {} });
    }).should.throw(/bindable/);
  });

  it("should throw on an attempt to set", () => {
    const o1 = new TestClass("Monda");
    (() => (o1.fruit = "Apple")).should.throw();
  });
});
