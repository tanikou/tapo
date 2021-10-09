"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelStorage = exports.Meta = exports.Attr = void 0;
class Attr {
    constructor(name) {
        this.name = '';
        this.rules = {};
        this.name = name;
    }
    setRule(rule) {
        Object.assign(this.rules, rule);
    }
}
exports.Attr = Attr;
class Meta {
    // eslint-disable-next-line @typescript-eslint/ban-types
    constructor(target) {
        this.name = '';
        this.attrs = [];
        this.target = target;
        this.name = target.name;
    }
    attr(name) {
        let attr = this.attrs.find(v => v.name === name);
        if (!attr) {
            attr = new Attr(name);
            this.attrs.push(attr);
        }
        return attr;
    }
    merge(attrs = []) {
        attrs.forEach(attr => {
            if (!this.attrs.find(v => v.name === attr.name)) {
                this.attrs.push(attr);
            }
        });
    }
}
exports.Meta = Meta;
class ModelStorage {
    constructor() {
        this.entities = [];
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    entity(target) {
        let entity = this.entities.find(v => v.target === target);
        if (!entity) {
            entity = new Meta(target);
            this.entities.push(entity);
        }
        return entity;
    }
}
exports.ModelStorage = ModelStorage;
const storage = new ModelStorage();
exports.default = storage;
