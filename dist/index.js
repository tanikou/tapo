"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMessageFormat = exports.Entity = exports.Model = exports.reverse = exports.to = exports.validator = exports.nullable = exports.format = exports.from = exports.type = exports.field = exports.ModelError = void 0;
/* eslint-disable */
const storage_1 = __importDefault(require("./storage"));
let errMessageFormat = `{entity}.{attr} defined as {type}, got：{value}`;
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
 * Model基类，子类继承后可实现ORM转换
 */
class Model {
    constructor(source) {
        this.parse(source);
    }
    /**
     * 实体初始化完成后的回调方法。子类可覆盖后实现自己的处理逻辑
     */
    onReady() {
        // 当初始化完成后调用，以便做一些特别处理
    }
    /**
     * 从来源对象中规则解析为实体对象
     * @param source 来源数据
     * @returns
     */
    doPrivateParse(attr, source) {
        const { name, rules } = attr;
        const origin = pick((rules.from || name).split('.'), source);
        const value = rules.format ? rules.format(origin, source) : origin;
        if ((value === null || value === undefined) && rules.nullable === true) {
            return;
        }
        this[name] = value;
        if (rules.enumeration) {
            // 判断枚举类型是否匹配
            if (!rules.enumeration.includes(value)) {
                throw new ModelError(errMessageFormat.replace('{entity}', this.constructor.name).replace('{attr}', name).replace('{type}', rules.enumeration.join(', ')).replace('{value}', value));
            }
        }
        else if (Array.isArray(rules.type)) {
            // 判断数据类型是否精准匹配
            if (value === undefined || value === null) {
                throw new ModelError(errMessageFormat.replace('{entity}', this.constructor.name).replace('{attr}', name).replace('{type}', rules.type.map(v => v.name).join(', ')).replace('{value}', value));
            }
            // 判断数据类型是否为多类型的其中之一
            const typo = Object.getPrototypeOf(value).constructor;
            if (!rules.type.includes(typo)) {
                throw new ModelError(errMessageFormat.replace('{entity}', this.constructor.name).replace('{attr}', name).replace('{type}', rules.type.map(v => v.name).join(', ')).replace('{value}', value));
            }
        }
        else if (rules.type) {
            // 判断数据类型是否精准匹配
            if (value === undefined || value === null) {
                throw new ModelError(errMessageFormat.replace('{entity}', this.constructor.name).replace('{attr}', name).replace('{type}', rules.type.name).replace('{value}', value));
            }
            const typo = Object.getPrototypeOf(value);
            if (rules.type === typo) {
                throw new ModelError(errMessageFormat.replace('{entity}', this.constructor.name).replace('{attr}', name).replace('{type}', rules.type.name).replace('{value}', value));
            }
        }
        if (rules.validator) {
            (Array.isArray(rules.validator) ? rules.validator : [rules.validator]).forEach(func => {
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
        storage_1.default.entity(this.constructor).attrs.forEach(attr => {
            const { name, rules } = attr;
            this[name] = source[name];
        });
        return this;
    }
    parse(source) {
        if (!source) {
            return this;
        }
        const isen = Object.getPrototypeOf(source).constructor === Object.getPrototypeOf(this).constructor;
        if (isen) {
            this.doPrivateCopy(source);
        }
        else {
            storage_1.default.entity(this.constructor).attrs.forEach(attr => {
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
        const isen = Object.getPrototypeOf(source).constructor === Object.getPrototypeOf(this).constructor;
        if (isen) {
            this.doPrivateCopy(source);
        }
        else {
            storage_1.default.entity(this.constructor).attrs.forEach(attr => {
                if (Object.prototype.hasOwnProperty.call(source, attr.name)) {
                    this.doPrivateParse(attr, source);
                }
            });
        }
        return this;
    }
    /**
     * 将实体转换为后端接口需要的JSON对象
     */
    reverse(option = { lightly: true }) {
        const json = {};
        storage_1.default.entity(this.constructor).attrs.forEach(attr => {
            const { name, rules } = attr;
            if (rules.hasOwnProperty('to')) {
                const val = rules.reverse ? rules.reverse(this[name], this) : this[name];
                if (option.lightly === false || (val !== '' && val !== null)) {
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
    errMessageFormat = v;
};
exports.setMessageFormat = setMessageFormat;
