"use strict";

require("tap").mochaGlobals();
const should = require("should");

require("../../../lib/use");

const F = require("tools/functions");

describe("kv", () => {
  it("should make an object", () => {
    F.kv("foo", "Foo!").should.deepEqual({ foo: "Foo!" });
  });
});

describe("defined", () => {
  it("should test definedness", () => {
    [null, 0, "", true, "Hello", {}, undefined, "Bye!"]
      .filter(F.defined)
      .should.deepEqual([null, 0, "", true, "Hello", {}, "Bye!"]);
  });
});

describe("sumObj", () => {
  it("should sum object values", () => {
    F.sumObj({ a: 1, b: 2, c: 3 }).should.equal(6);
  });
});

describe("cmp", () => {
  it("should sort naturally", () => {
    [3, 1, 2, 4].sort(F.cmp).should.deepEqual([1, 2, 3, 4]);
    ["C", "A", "B", "D"].sort(F.cmp).should.deepEqual(["A", "B", "C", "D"]);
  });
});

describe("bumper", () => {
  it("should bump", () => {
    const o = { a: 12, b: { c: 17 } };
    const b = F.bumper(o);
    b("a");
    b("b", "c");
    b("d", "e");
    b("a");
    b("c");
    b("d", "d", "f");
    o.should.deepEqual({
      a: 14,
      b: { c: 18 },
      d: { e: 1 },
      c: 1,
      d: { e: 1, d: { f: 1 } }
    });
  });
});

describe("sortKeysDeep", () => {
  it("should sort keys", () => {
    const o = {
      z: [
        { c: 1, a: 2, b: 3 },
        { b: 1, c: 2, a: 3 }
      ],
      y: "Why?",
      x: { m: 2, n: 3 }
    };
    const so = F.sortKeysDeep(o);
    so.should.deepEqual(o);

    const wso = {
      x: { m: 2, n: 3 },
      y: "Why?",
      z: [
        { a: 2, b: 3, c: 1 },
        { a: 3, b: 1, c: 2 }
      ]
    };

    JSON.stringify(so).should.equal(JSON.stringify(wso));
  });
});

describe("combo", () => {
  it("should iterate combinations", () => {
    [...F.combo([])].should.deepEqual([[]]);
    [...F.combo(["A"])].should.deepEqual([[], ["A"]]);

    [...F.combo(["A", "B"])].should.deepEqual([[], ["A"], ["B"], ["A", "B"]]);

    [...F.combo(["A", "B", "C"])].should.deepEqual([
      [],
      ["A"],
      ["B"],
      ["A", "B"],
      ["C"],
      ["A", "C"],
      ["B", "C"],
      ["A", "B", "C"]
    ]);
  });
});

describe("pairs", () => {
  it("should iterate pairs", () => {
    [...F.pairs([])].should.deepEqual([]);
    [...F.pairs(["Y"])].should.deepEqual([]);
    [...F.pairs(["Y", "Z"])].should.deepEqual([["Y", "Z"]]);
    [...F.pairs(["X", "B", "C"])].should.deepEqual([
      ["X", "B"],
      ["X", "C"],
      ["B", "C"]
    ]);
  });
});

describe("permute", () => {
  it("should iterate permutations", () => {
    [...F.permute([])].should.deepEqual([[]]);
    [...F.permute(["A"])].should.deepEqual([["A"]]);
    [...F.permute(["A", "B"])].should.deepEqual([
      ["A", "B"],
      ["B", "A"]
    ]);
    [...F.permute(["A", "B", "C"])].should.deepEqual([
      ["A", "B", "C"],
      ["A", "C", "B"],
      ["B", "A", "C"],
      ["B", "C", "A"],
      ["C", "A", "B"],
      ["C", "B", "A"]
    ]);
  });
});

describe("sortKeysDeep", () => {
  it("should sort keys", () => {
    const test = { Z: "Z", A: "A" };
    F.sortKeysDeep(test).should.deepEqual({ A: "A", Z: "Z" });
  });
});

describe("flipKeys", () => {
  it("should flipKeys", () => {
    const test = { A: { a: 1, b: 2 }, B: { a: 3, b: 4 } };
    const want = { a: { A: 1, B: 3 }, b: { A: 2, B: 4 } };
    F.flipKeys(test).should.deepEqual(want);
  });
});

describe("mergeCounters", () => {
  it("should mergeCounters", () => {
    F.mergeCounters({ x: 1 }, { x: 2, y: 1 }).should.deepEqual({
      x: 3,
      y: 1
    });

    F.mergeCounters([{ a: 1, b: { c: 2 } }]).should.deepEqual({
      a: 1,
      b: { c: 2 }
    });

    F.mergeCounters([
      { a: 1, b: { c: 2 } },
      { x: 1 },
      { x: 2, y: 1 }
    ]).should.deepEqual({
      a: 1,
      b: { c: 2 },
      x: 3,
      y: 1
    });
  });
});
