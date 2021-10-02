"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelStorage = exports.Meta = exports.Attr = void 0;
var Attr = /** @class */ (function () {
    function Attr(name) {
        this.name = '';
        this.rules = {};
        this.name = name;
    }
    Attr.prototype.setRule = function (rule) {
        Object.assign(this.rules, rule);
    };
    return Attr;
}());
exports.Attr = Attr;
var Meta = /** @class */ (function () {
    // eslint-disable-next-line @typescript-eslint/ban-types
    function Meta(target) {
        this.name = '';
        this.attrs = [];
        this.target = target;
        this.name = target.name;
    }
    Meta.prototype.attr = function (name) {
        var attr = this.attrs.find(function (v) { return v.name === name; });
        if (!attr) {
            attr = new Attr(name);
            this.attrs.push(attr);
        }
        return attr;
    };
    Meta.prototype.merge = function (attrs) {
        var _this = this;
        if (attrs === void 0) { attrs = []; }
        attrs.forEach(function (attr) {
            if (!_this.attrs.find(function (v) { return v.name === attr.name; })) {
                _this.attrs.push(attr);
            }
        });
    };
    return Meta;
}());
exports.Meta = Meta;
var ModelStorage = /** @class */ (function () {
    function ModelStorage() {
        this.entities = [];
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    ModelStorage.prototype.entity = function (target) {
        var entity = this.entities.find(function (v) { return v.target === target; });
        if (!entity) {
            entity = new Meta(target);
            this.entities.push(entity);
        }
        return entity;
    };
    return ModelStorage;
}());
exports.ModelStorage = ModelStorage;
var storage = new ModelStorage();
exports.default = storage;
