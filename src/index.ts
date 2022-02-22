/* eslint-disable */
import storage, { Attr } from './storage'

let message = `{entity}.{attr} defined as {type}, got: {value}`

let errorLogger = {
  error(v: string): void {
    throw new ModelError(v)
  },
}

let notify = ({ entity = '', attr = '', type = '', value = '' }) => {
  errorLogger.error(
    message
      .replace('{entity}', entity)
      .replace('{attr}', attr)
      .replace('{type}', type)
      .replace('{value}', value)
  )
}

export class ModelError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, new.target)
    }
    if (typeof Object.setPrototypeOf === 'function') {
      Object.setPrototypeOf(this, new.target.prototype)
    } else {
      (this as any).__proto__ = new.target.prototype
    }
  }
}

export interface ModelConfig {
  enumeration?: any[]
  from?: string | undefined
  type?: Function | Function[]
  nullable?: boolean
  format?: (v: any, source: Record<string, unknown>) => any
  to?: string | undefined
  reverse?: (v: any, source: Record<string, unknown>) => any
  omit?: boolean
  validator?: (
    value: any,
    source: Record<string, unknown>
  ) => any | Array<(value: any, source: Record<string, unknown>) => any>
}

export interface ReverseOption {
  lightly?: boolean | undefined
  exclusion?: string[]
}

export const field = (config: ModelConfig): any => {
  return function (target: ClassDecorator, name: string) {
    storage.entity(target.constructor).attr(name).setRule(config)
  }
}

/**
 * 定义数据类型
 * @param value String Number Boolean ...其他基础数据类型或实体类
 * @returns
 */
export const type = (value: Function | Function[]): any => {
  return function (target: ClassDecorator, name: string) {
    storage.entity(target.constructor).attr(name).setRule({ type: value })
  }
}

/**
 * 定义数据来源字段，可多层结构，如member.company.id
 * @param value 来源字段，如果为空则表示属性名一致
 * @returns
 */
export const from = (value?: string): any => {
  return function (target: ClassDecorator, name: string) {
    storage.entity(target.constructor).attr(name).setRule({ from: value })
  }
}

export const enumeration = (value: any[]): any => {
  return function (target: ClassDecorator, name: string) {
    storage
      .entity(target.constructor)
      .attr(name)
      .setRule({ enumeration: value })
  }
}

/**
 * 定义数据格式化转换方法
 * @param value 格式化方法
 * @returns
 */
export const format = (
  value: (v: any, ori: Record<string, unknown>) => any
): any => {
  return function (target: ClassDecorator, name: string) {
    storage.entity(target.constructor).attr(name).setRule({ format: value })
  }
}

/**
 * 标记此属性可以为null或者undefined
 * @param value = true, true可以为空，false则不可
 * @returns
 */
export const nullable = (value = true): any => {
  return function (target: ClassDecorator, name: string) {
    storage.entity(target.constructor).attr(name).setRule({ nullable: value })
  }
}

/**
 * 定义数据校验方法。返回false则表示验证不通过，自定义提示信息可通过throw new Error实现
 * @param value 校验方法数组
 * @returns
 */
export const validator = (
  value: (
    value: any,
    source: Record<string, unknown>
  ) => any | Array<(value: any, source: Record<string, unknown>) => any>
): any => {
  return function (target: ClassDecorator, name: string) {
    storage.entity(target.constructor).attr(name).setRule({ validator: value })
  }
}

/**
 * 定义数据逆向字段名，如果不定义在做逆向转换时将被忽略
 * @param value 逆向字段属性名，如果为空则表示属性名一致
 * @returns
 */
export const to = (value?: string): any => {
  return function (target: ClassDecorator, name: string) {
    storage.entity(target.constructor).attr(name).setRule({ to: value })
  }
}

/**
 * 忽略属性，用于reverse时忽略特定字段
 * @returns
 */
export const omit = (value = true): any => {
  return function (target: ClassDecorator, name: string) {
    storage.entity(target.constructor).attr(name).setRule({ omit: value })
  }
}

/**
 * 自定义数据格式化转换方法
 * @param value 格式化方法
 * @returns
 */
export const reverse = (
  value: (v: any, ori: Record<string, unknown>) => any
): any => {
  return function (target: ClassDecorator, name: string) {
    storage.entity(target.constructor).attr(name).setRule({ reverse: value })
  }
}

/**
 * 根据key路径从源数据中提取值
 * @param key key路径，如id或company.id
 * @param source 源数据
 * @returns
 */
const pick = (key: string[], source: Record<string, any>): any => {
  if (!source) {
    return undefined
  }

  if (key.length === 1) {
    return source[key[0]]
  }

  const top = key.shift() || ''

  return pick(key, source[top])
}

/**
 * 将query中的字符串的值转为属性定义的类型的值
 * @param value query中字符串的值
 * @param clazz 类型，如String, Number, Boolean, Array等
 * @returns
 */
export function converty(value: any, clazz: Function): any {
  if (clazz === Boolean) {
    return value === 'false' ? false : clazz(value)
  } else if (clazz === Array) {
    return value.split ? value.split(',') : Array.isArray(value) ? value : []
  } else {
    return clazz(value)
  }
}

/**
 * Model基类，子类继承后可实现ORM转换
 */
export class Model {
  [key: string]: any

  constructor(source?: Record<string, any>) {
    this.parse(source)
  }

  /**
   * 从来源对象中规则解析为实体对象
   * @param source 来源数据
   * @returns
   */
  doPrivateParse(attr: Attr, source: any): void {
    const { name, rules } = attr

    if (rules.hasOwnProperty('omit')) {
      return
    }

    const origin = pick((rules.from || name).split('.'), source)

    const value = rules.format ? rules.format(origin, source) : origin
    if ((value === null || value === undefined) && rules.nullable === true) {
      return
    }

    this[name] = value

    if (rules.enumeration) {
      // 判断枚举类型是否匹配
      if (!rules.enumeration.includes(value)) {
        notify({
          entity: this.constructor.name,
          attr: name,
          type: rules.enumeration.join(', '),
          value,
        })
      }
    } else if (Array.isArray(rules.type)) {
      // 判断数据类型是否精准匹配
      if (value === undefined || value === null) {
        notify({
          entity: this.constructor.name,
          attr: name,
          type: rules.type.map((v) => v.name).join(', '),
          value,
        })
      }
      // 判断数据类型是否为多类型的其中之一
      const typo = Object.getPrototypeOf(value).constructor
      if (!rules.type.includes(typo)) {
        notify({
          entity: this.constructor.name,
          attr: name,
          type: rules.type.map((v) => v.name).join(', '),
          value,
        })
      }
    } else if (rules.type) {
      // 判断数据类型是否精准匹配
      if (value === undefined || value === null) {
        notify({
          entity: this.constructor.name,
          attr: name,
          type: rules.type.name,
          value,
        })
      }
      const typo = Object.getPrototypeOf(value).constructor
      if (rules.type !== typo) {
        notify({
          entity: this.constructor.name,
          attr: name,
          type: rules.type.name,
          value,
        })
      }
    }

    if (rules.validator) {
      ;(Array.isArray(rules.validator)
        ? rules.validator
        : [rules.validator]
      ).forEach((func) => {
        func(value)
      })
    }
  }

  /**
   * 从来源对象中复制属性到实休
   * @param source 来源数据
   * @returns
   */
  doPrivateCopy(source: Record<string, any>): this {
    storage.entity(this.constructor).attrs.forEach((attr) => {
      const { name, rules } = attr
      if (
        Object.prototype.hasOwnProperty.call(source, name) &&
        !rules.hasOwnProperty('omit')
      ) {
        this[name] = source[name]
      }
    })
    return this
  }

  /**
   * 将数据源根据定义转换将值赋值给实体。数据源是同类型实体对象将根据属性直接赋值
   * @param source 数据源
   * @returns
   */
  parse(source?: Record<string, any>): this {
    if (!source) {
      return this
    }

    const isen =
      Object.getPrototypeOf(source).constructor ===
      Object.getPrototypeOf(this).constructor

    if (isen) {
      this.doPrivateCopy(source)
    } else {
      storage.entity(this.constructor).attrs.forEach((attr) => {
        this.doPrivateParse(attr, source)
      })
    }

    return this
  }

  /**
   * 将数据合并到entity中（只合并entity定义过的key）
   * @param source 需要做合并的数据
   * @returns
   */
  merge(source?: Record<string, unknown>): this {
    if (!source) {
      return this
    }

    this.doPrivateCopy(source)

    return this
  }

  /**
   * 将数据恢复到entity中（只合并entity定义过的key，数据类型如果不匹配将尝试自动转换，一般用于query还原）
   * @param source 需要做合并的数据
   * @returns
   */
  recover(source: Record<string, unknown>): this {
    if (!source) {
      return this
    }

    const isen =
      Object.getPrototypeOf(source).constructor ===
      Object.getPrototypeOf(this).constructor

    if (isen) {
      this.doPrivateCopy(source)
    } else {
      const attrs = storage.entity(this.constructor).attrs
      Object.keys(this).forEach((prop) => {
        if (!Object.prototype.hasOwnProperty.call(source, prop)) {
          return
        }
        const rules = attrs.find((attr) => attr.name === prop)?.rules

        if (!rules?.type) {
          const tp = Object.getPrototypeOf(this[prop]).constructor
          this[prop] = converty(source[prop], tp)
          return
        }
        const tp = Array.isArray(rules?.type) ? rules.type[0] : rules.type
        this[prop] = converty(source[prop], tp)
      })
    }

    return this
  }

  /**
   * 将实体转换为后端接口需要的JSON对象
   */
  reverse(
    option: ReverseOption = { lightly: true, exclusion: [] as string[] }
  ): Record<string, unknown> {
    const json = {} as Record<string, any>

    storage.entity(this.constructor).attrs.forEach((attr) => {
      const { name, rules } = attr
      if (
        rules.hasOwnProperty('to') &&
        !rules.hasOwnProperty('omit') &&
        !option.exclusion?.includes(name)
      ) {
        const val = rules.reverse ? rules.reverse(this[name], this) : this[name]
        if (
          option.lightly === false ||
          (val !== '' && val !== null && val !== undefined)
        ) {
          json[rules.to || name] = val
        }
      }
    })

    return json
  }
}

/**
 * 注解类为一个实体，实现继承的效果。如果不用此注解，那么将丢失父类的字段定义
 * @returns
 */
export const Entity = () => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (target: Function) {
    const parent = Object.getPrototypeOf(target.prototype)
    if (parent.constructor.name !== 'Object' && target !== parent.constructor) {
      const ex = storage.entity(parent.constructor).attrs
      storage.entity(target).merge(ex)
    }
  }
}

export const setMessageFormat = (v: string): void => {
  message = v
}

export const setLogger = (logger: { error: (v: string) => void }): void => {
  errorLogger = logger
}
