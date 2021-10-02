"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMessageFormat = exports.Entity = exports.Model = exports.validator = exports.format = exports.nullable = exports.type = exports.from = exports.field = void 0;
/* eslint-disable */
var storage_1 = __importDefault(require("./storage"));
var errMessageFormat = "{entity}.{attr} defined as {type}, got\uFF1A{value}";
var field = function (config) {
    return function (target, name) {
        storage_1.default.entity(target.constructor).attr(name).setRule(config);
    };
};
exports.field = field;
/**
 * 定义数据来源字段，可多层结构，如member.company.id
 * @param value 来源字段，如果为空则表示属性名一致
 * @returns
 */
var from = function (value) {
    return function (target, name) {
        storage_1.default.entity(target.constructor).attr(name).setRule({ from: value });
    };
};
exports.from = from;
/**
 * 定义数据类型
 * @param value String Number Boolean ...其他基础数据类型或实体类
 * @returns
 */
var type = function (value) {
    return function (target, name) {
        storage_1.default.entity(target.constructor).attr(name).setRule({ type: value });
    };
};
exports.type = type;
/**
 * 标记此属性可以为null或者undefined
 * @param value = true, true = 可以为空，false则不可
 * @returns
 */
var nullable = function (value) {
    if (value === void 0) { value = true; }
    return function (target, name) {
        storage_1.default.entity(target.constructor).attr(name).setRule({ nullable: value });
    };
};
exports.nullable = nullable;
/**
 * 定义数据格式化转换方法
 * @param value 格式化方法
 * @returns
 */
var format = function (value) {
    return function (target, name) {
        storage_1.default.entity(target.constructor).attr(name).setRule({ format: value });
    };
};
exports.format = format;
/**
 * 定义数据校验方法。返回false则表示验证不通过，自定义提示信息可通过throw new Error实现
 * @param value 校验方法数组
 * @returns
 */
var validator = function (value) {
    return function (target, name) {
        storage_1.default.entity(target.constructor).attr(name).setRule({ validator: value });
    };
};
exports.validator = validator;
var pick = function (key, value) {
    if (key.length === 1) {
        return value[key[0]];
    }
    var top = key.shift() || '';
    return pick(key, value[top]);
};
/**
 * Model基类，子类继承后可实现ORM转换
 */
var Model = /** @class */ (function () {
    function Model(source) {
        this.parse(source);
    }
    /**
     * 实体初始化完成后的回调方法。子类可覆盖后实现自己的处理逻辑
     */
    Model.prototype.onReady = function () {
        // 当初始化完成后调用，以便做一些特别处理
    };
    /**
     * 从来源对象中规则解析为实体对象
     * @param source 来源数据
     * @returns
     */
    Model.prototype.parse = function (source) {
        var _this = this;
        if (!source) {
            return this;
        }
        storage_1.default.entity(this.constructor).attrs.forEach(function (attr) {
            var _a, _b;
            var name = attr.name, rules = attr.rules;
            var origin = pick((rules.from || name).split('.'), source);
            var value = rules.format ? rules.format(origin, source) : origin;
            if ((value === null || value === undefined) && rules.nullable === true) {
                return;
            }
            _this[name] = value;
            if (Object.prototype.toString.call(value) !== "[object " + ((_a = rules.type) === null || _a === void 0 ? void 0 : _a.name) + "]") {
                throw new Error(errMessageFormat.replace('{entity}', _this.constructor.name).replace('{attr}', name).replace('{type}', (_b = rules.type) === null || _b === void 0 ? void 0 : _b.name).replace('{value}', value));
            }
        });
        this.onReady();
        return this;
    };
    return Model;
}());
exports.Model = Model;
/**
 * 注解类为一个实体，实现继承的效果。如果不用此注解，那么将丢失父类的字段定义
 * @returns
 */
var Entity = function () {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return function (target) {
        var parent = Object.getPrototypeOf(target.prototype);
        if (parent.constructor.name !== 'Object' && target.name !== parent.constructor.name) {
            var ex = storage_1.default.entity(parent.constructor).attrs;
            storage_1.default.entity(target).merge(ex);
        }
    };
};
exports.Entity = Entity;
var setMessageFormat = function (v) {
    errMessageFormat = v;
};
exports.setMessageFormat = setMessageFormat;
