"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLogger = exports.setMessageFormat = exports.Entity = exports.Model = exports.param = exports.converty = exports.reverse = exports.omit = exports.to = exports.validator = exports.nullable = exports.format = exports.enumeration = exports.from = exports.type = exports.field = exports.ModelError = void 0;
/* eslint-disable */
const storage_1 = __importDefault(require("./storage"));
let message = `{entity}.{attr} defined as {type}, got: {value}`;
let errorLogger = {
    error(v) {
        throw new ModelError(v);
    },
};
let notify = ({ entity = '', attr = '', type = '', value = '' }) => {
    errorLogger.error(message
        .replace('{entity}', entity)
        .replace('{attr}', attr)
        .replace('{type}', type)
        .replace('{value}', value));
};
class ModelError extends Error {
    constructor(message) {
        super(message);
        this.name = new.target.name;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, new.target);
        }
        if (typeof Object.setPrototypeOf === 'function') {
            Object.setPrototypeOf(this, new.target.prototype);
        }
        else {
            this.__proto__ = new.target.prototype;
        }
    }
}
exports.ModelError = ModelError;
const field = (config) => {
    return function (target, name) {
        storage_1.default.entity(target.constructor).attr(name).setRule(config);
    };
};
exports.field = field;
/**
 * 定义数据类型
 * @param value String Number Boolean ...其他基础数据类型或实体类
 * @returns
 */
const type = (value) => {
    return function (target, name) {
        storage_1.default.entity(target.constructor).attr(name).setRule({ type: value });
    };
};
exports.type = type;
/**
 * 定义数据来源字段，可多层结构，如member.company.id
 * @param value 来源字段，如果为空则表示属性名一致
 * @returns
 */
const from = (value) => {
    return function (target, name) {
        storage_1.default.entity(target.constructor).attr(name).setRule({ from: value });
    };
};
exports.from = from;
const enumeration = (value) => {
    return function (target, name) {
        storage_1.default
            .entity(target.constructor)
            .attr(name)
            .setRule({ enumeration: value });
    };
};
exports.enumeration = enumeration;
/**
 * 定义数据格式化转换方法
 * @param value 格式化方法
 * @returns
 */
const format = (value) => {
    return function (target, name) {
        storage_1.default.entity(target.constructor).attr(name).setRule({ format: value });
    };
};
exports.format = format;
/**
 * 标记此属性可以为null或者undefined
 * @param value = true, true可以为空，false则不可
 * @returns
 */
const nullable = (value = true) => {
    return function (target, name) {
        storage_1.default.entity(target.constructor).attr(name).setRule({ nullable: value });
    };
};
exports.nullable = nullable;
/**
 * 定义数据校验方法。返回false则表示验证不通过，自定义提示信息可通过throw new Error实现
 * @param value 校验方法数组
 * @returns
 */
const validator = (value) => {
    return function (target, name) {
        storage_1.default.entity(target.constructor).attr(name).setRule({ validator: value });
    };
};
exports.validator = validator;
/**
 * 定义数据逆向字段名，如果不定义在做逆向转换时将被忽略
 * @param value 逆向字段属性名，如果为空则表示属性名一致
 * @returns
 */
const to = (value) => {
    return function (target, name) {
        storage_1.default.entity(target.constructor).attr(name).setRule({ to: value });
    };
};
exports.to = to;
/**
 * 忽略属性，用于reverse时忽略特定字段
 * @returns
 */
const omit = (value = true) => {
    return function (target, name) {
        storage_1.default.entity(target.constructor).attr(name).setRule({ omit: value });
    };
};
exports.omit = omit;
/**
 * 自定义数据格式化转换方法
 * @param value 格式化方法
 * @returns
 */
const reverse = (value) => {
    return function (target, name) {
        storage_1.default.entity(target.constructor).attr(name).setRule({ reverse: value });
    };
};
exports.reverse = reverse;
/**
 * 根据key路径从源数据中提取值
 * @param key key路径，如id或company.id
 * @param source 源数据
 * @returns
 */
const pick = (key, source) => {
    if (!source) {
        return undefined;
    }
    if (key.length === 1) {
        return source[key[0]];
    }
    const top = key.shift() || '';
    return pick(key, source[top]);
};
/**
 * 将query中的字符串的值转为属性定义的类型的值
 * @param value query中字符串的值
 * @param clazz 类型，如String, Number, Boolean, Array等
 * @returns
 */
function converty(value, clazz) {
    if (clazz === Boolean) {
        return value === 'false' ? false : clazz(value);
    }
    else if (clazz === Array) {
        return value.split ? value.split(',') : Array.isArray(value) ? value : [];
    }
    else {
        return clazz(value);
    }
}
exports.converty = converty;
function param(...ctor) {
    return function (target, key, descriptor) {
        var oldValue = descriptor.value;
        descriptor.value = function () {
            if (!ctor) {
                return oldValue.apply(this, arguments);
            }
            if (arguments.length === 0) {
                errorLogger.error(`${target.name}.${key}(${ctor.name}) got undefined`);
                return oldValue.apply(this, arguments);
            }
            if (ctor.find((v, i) => arguments[i] && v !== arguments[i].constructor)) {
                const real = [...arguments]
                    .map((v) => v.constructor.name)
                    .join(', ');
                const need = ctor.map((v) => v.name).join(', ');
                errorLogger.error(`${target.name}.${key}(${real} <> ${need})`);
            }
            return oldValue.apply(this, arguments);
        };
        return descriptor;
    };
}
exports.param = param;
/**
 * Model基类，子类继承后可实现ORM转换
 */
class Model {
    constructor(source) {
        this.parse(source);
    }
    /**
     * 从来源对象中规则解析为实体对象
     * @param source 来源数据
     * @returns
     */
    doPrivateParse(attr, source) {
        const { name, rules } = attr;
        if (rules.hasOwnProperty('omit')) {
            return;
        }
        const origin = pick((rules.from || name).split('.'), source);
        const value = rules.format ? rules.format(origin, source) : origin;
        if ((value === null || value === undefined) && rules.nullable === true) {
            return;
        }
        this[name] = value;
        if (rules.enumeration) {
            // 判断枚举类型是否匹配
            if (!rules.enumeration.includes(value)) {
                notify({
                    entity: this.constructor.name,
                    attr: name,
                    type: rules.enumeration.join(', '),
                    value,
                });
            }
        }
        else if (Array.isArray(rules.type)) {
            // 判断数据类型是否精准匹配
            if (value === undefined || value === null) {
                notify({
                    entity: this.constructor.name,
                    attr: name,
                    type: rules.type.map((v) => v.name).join(', '),
                    value,
                });
            }
            // 判断数据类型是否为多类型的其中之一
            const typo = Object.getPrototypeOf(value).constructor;
            if (!rules.type.includes(typo)) {
                notify({
                    entity: this.constructor.name,
                    attr: name,
                    type: rules.type.map((v) => v.name).join(', '),
                    value,
                });
            }
        }
        else if (rules.type) {
            // 判断数据类型是否精准匹配
            if (value === undefined || value === null) {
                notify({
                    entity: this.constructor.name,
                    attr: name,
                    type: rules.type.name,
                    value,
                });
            }
            const typo = Object.getPrototypeOf(value).constructor;
            if (rules.type !== typo) {
                notify({
                    entity: this.constructor.name,
                    attr: name,
                    type: rules.type.name,
                    value,
                });
            }
        }
        if (rules.validator) {
            ;
            (Array.isArray(rules.validator)
                ? rules.validator
                : [rules.validator]).forEach((func) => {
                func(value);
            });
        }
    }
    /**
     * 从来源对象中复制属性到实休
     * @param source 来源数据
     * @returns
     */
    doPrivateCopy(source) {
        storage_1.default.entity(this.constructor).attrs.forEach((attr) => {
            const { name, rules } = attr;
            if (Object.prototype.hasOwnProperty.call(source, name) &&
                !rules.hasOwnProperty('omit')) {
                this[name] = source[name];
            }
        });
        return this;
    }
    /**
     * 将数据源根据定义转换将值赋值给实体。数据源是同类型实体对象将根据属性直接赋值
     * @param source 数据源
     * @returns
     */
    parse(source) {
        if (!source) {
            return this;
        }
        const isen = Object.getPrototypeOf(source).constructor ===
            Object.getPrototypeOf(this).constructor;
        if (isen) {
            this.doPrivateCopy(source);
        }
        else {
            storage_1.default.entity(this.constructor).attrs.forEach((attr) => {
                this.doPrivateParse(attr, source);
            });
        }
        return this;
    }
    /**
     * 将数据合并到entity中（只合并entity定义过的key）
     * @param source 需要做合并的数据
     * @returns
     */
    merge(source) {
        if (!source) {
            return this;
        }
        this.doPrivateCopy(source);
        return this;
    }
    /**
     * 将数据恢复到entity中（只合并entity定义过的key，数据类型如果不匹配将尝试自动转换，一般用于query还原）
     * @param source 需要做合并的数据
     * @returns
     */
    recover(source) {
        if (!source) {
            return this;
        }
        const isen = Object.getPrototypeOf(source).constructor ===
            Object.getPrototypeOf(this).constructor;
        if (isen) {
            this.doPrivateCopy(source);
        }
        else {
            const attrs = storage_1.default.entity(this.constructor).attrs;
            Object.keys(this).forEach((prop) => {
                var _a;
                if (!Object.prototype.hasOwnProperty.call(source, prop)) {
                    return;
                }
                const rules = (_a = attrs.find((attr) => attr.name === prop)) === null || _a === void 0 ? void 0 : _a.rules;
                if (!(rules === null || rules === void 0 ? void 0 : rules.type)) {
                    const tp = Object.getPrototypeOf(this[prop]).constructor;
                    this[prop] = converty(source[prop], tp);
                    return;
                }
                const tp = Array.isArray(rules === null || rules === void 0 ? void 0 : rules.type) ? rules.type[0] : rules.type;
                this[prop] = converty(source[prop], tp);
            });
        }
        return this;
    }
    /**
     * 将实体转换为后端接口需要的JSON对象
     */
    reverse(option = { lightly: true, exclusion: [] }) {
        const json = {};
        storage_1.default.entity(this.constructor).attrs.forEach((attr) => {
            var _a;
            const { name, rules } = attr;
            if (rules.hasOwnProperty('to') &&
                !rules.hasOwnProperty('omit') &&
                !((_a = option.exclusion) === null || _a === void 0 ? void 0 : _a.includes(name))) {
                const val = rules.reverse ? rules.reverse(this[name], this) : this[name];
                if (option.lightly === false ||
                    (val !== '' && val !== null && val !== undefined)) {
                    json[rules.to || name] = val;
                }
            }
        });
        return json;
    }
}
exports.Model = Model;
/**
 * 注解类为一个实体，实现继承的效果。如果不用此注解，那么将丢失父类的字段定义
 * @returns
 */
const Entity = () => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return function (target) {
        const parent = Object.getPrototypeOf(target.prototype);
        if (parent.constructor.name !== 'Object' && target !== parent.constructor) {
            const ex = storage_1.default.entity(parent.constructor).attrs;
            storage_1.default.entity(target).merge(ex);
        }
    };
};
exports.Entity = Entity;
const setMessageFormat = (v) => {
    message = v;
};
exports.setMessageFormat = setMessageFormat;
const setLogger = (logger) => {
    errorLogger = logger;
};
exports.setLogger = setLogger;
