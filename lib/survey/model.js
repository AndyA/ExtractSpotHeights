"use strict";

const _ = require("lodash");
const { bumper, mergeCounters } = require("tools/functions");
const lazyAttr = require("tools/lazy-attr");
const MW = require("mixwith");

function cleanText(str) {
  if (str === undefined) return;
  const m = str.match(/^\{\\C\d+;(.+)\}$/);
  if (m) return m[1];
  return str;
}

const HasBounds = MW.Mixin(superclass =>
  lazyAttr(class extends superclass {}, {
    dimensions: function() {
      const { bounds } = this;
      return _.mapValues(bounds.min, (v, k) => bounds.max[k] - v);
    }
  })
);

const Entity = lazyAttr(
  class extends MW.mix(Object).with(HasBounds) {
    constructor(entity) {
      super();
      Object.assign(this, entity);
    }
  },
  {
    id: function() {
      return parseInt(this.handle, 16);
    },
    size: function() {
      return { x: 0, y: 0, z: 0 };
    },
    bounds: function() {
      const { size, position } = this;
      const min = _.mapValues(size, (v, k) => position[k] || 0);
      const max = _.mapValues(size, (v, k) => min[k] + v);
      return { min, max };
    }
  }
);

const TextEntity = lazyAttr(class extends Entity {}, {
  label: function() {
    return cleanText(this.text);
  }
});

const PointEntity = lazyAttr(class extends Entity {}, {});

const Entities = lazyAttr(
  class extends MW.mix(Object).with(HasBounds) {
    constructor(entities) {
      super();
      this.e = _.sortBy(this.constructor.castEntity(entities || []), "handle");
    }

    static castEntity(entity) {
      if (entity instanceof Entity) return entity;
      if (_.isArray(entity)) return entity.map(e => this.castEntity(e));
      const typeMap = { MTEXT: TextEntity, POINT: PointEntity };
      const type = typeMap[entity.type] || Entity;
      return new type(entity);
    }

    filter(pred) {
      return new this.constructor(this.e.filter(pred));
    }
  },
  {
    bounds: function() {
      const bb = this.e.map(e => e.bounds).filter(Boolean);

      if (bb.length)
        return _.fromPairs(
          ["min", "max"].map(ext => [
            ext,
            _.fromPairs(
              Object.keys(bb[0][ext]).map(axis => [
                axis,
                Math[ext](...bb.map(box => box[ext][axis]))
              ])
            )
          ])
        );
    }
  }
);

const Model = lazyAttr(
  class extends MW.mix(Object).with(HasBounds) {
    constructor(dxf, opt, entities) {
      super();
      this.dxf = dxf;
      this.opt = Object.assign({}, opt || {});
      this.entities = entities || new Entities(dxf.entities);
    }

    filter(pred) {
      return new this.constructor(
        this.dxf,
        this.opt,
        this.entities.filter(pred)
      );
    }

    get bounds() {
      return this.entities.bounds;
    }
  },
  {}
);
module.exports = { Entity, Model };
