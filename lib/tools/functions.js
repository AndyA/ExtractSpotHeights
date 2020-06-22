"use strict";

const assert = require("assert");
const _ = require("lodash");

// Handy functions

const kv = (k, v) => _.fromPairs([[k, v]]);
const defined = x => x !== undefined;
const sumObj = obj => _.sum(Object.values(obj));
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const bumper = obj => (...path) => {
  let slot = obj;
  const leaf = path.pop();
  for (const prop of path) slot = slot[prop] = slot[prop] || {};
  slot[leaf] = (slot[leaf] || 0) + 1;
};

const everyNth = (array, stride = 1, offset = 0) => {
  assert(offset < stride);
  if (stride === 1) return array.slice(0);
  const out = [];
  for (var i = offset; i < array.length; i += stride) out.push(array[i]);
  return out;
};

const twoDeep = (obj, cb) => {
  for (const [ka, va] of Object.entries(obj))
    for (const [kb, vb] of Object.entries(va)) cb(ka, kb, va, vb);
};

const flipKeys = obj => {
  const o = {};
  twoDeep(obj, (ka, kb, va, vb) => ((o[kb] = o[kb] || {})[ka] = vb));
  return o;
};

const sortKeysDeep = obj => {
  if (_.isArray(obj)) return obj.map(sortKeysDeep);
  if (_.isObject(obj))
    return _.fromPairs(
      Object.entries(obj)
        .sort((a, b) => cmp(a[0], b[0]))
        .map(([k, v]) => [k, sortKeysDeep(v)])
    );
  return obj;
};

const filterTail = (list, pred) => {
  if (!list.length) return [];
  const [head, ...tail] = list;
  return [
    head,
    ...filterTail(
      tail.filter(x => pred(head, x)),
      pred
    )
  ];
};

function* combo(list) {
  if (!list.length) {
    yield [];
    return;
  }

  const [head, ...tail] = list;
  for (const rest of combo(tail)) {
    yield rest;
    yield [head, ...rest];
  }
}

function* pairs(list) {
  if (list.length < 2) return;

  const [head, ...tail] = list;
  for (const other of tail) yield [head, other];
  yield* pairs(tail);
}

function* permute(list) {
  if (list.length < 2) {
    yield list;
    return;
  }

  for (let i = 0; i < list.length; i++)
    for (const rest of permute([...list.slice(0, i), ...list.slice(i + 1)]))
      yield [list[i], ...rest];
}

const mergeCounters = (...counter) =>
  _.mergeWith({}, ..._.flatten(counter), (a, b) => {
    if (_.isNumber(a) && _.isNumber(b)) return a + b;
  });

const dedupper = set => {
  const seen = new Set(set || []);
  return id => !(seen.has(id) || (seen.add(id), false));
};

const atPath = (obj, path, cb) => {
  const [head, ...tail] = path;
  if (tail.length) return atPath((obj[head] = obj[head] || {}), tail, cb);
  return cb(obj, head);
};

const pushAtPath = (obj, path, val) =>
  atPath(obj, path, (o, k) => (o[k] = o[k] || []).push(val));

module.exports = {
  kv,
  defined,
  sumObj,
  cmp,
  bumper,
  everyNth,
  filterTail,
  twoDeep,
  flipKeys,
  sortKeysDeep,
  combo,
  pairs,
  permute,
  mergeCounters,
  dedupper,
  atPath,
  pushAtPath
};
