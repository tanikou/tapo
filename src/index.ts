/* eslint-disable */
import storage, { Attr } from './storage'

let errMessageFormat = `{entity}.{attr} defined as {type}, got：{value}`

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
  from?: string
  type?: Function | Function[]
  nullable?: boolean
  format?: (v: any, source: Record<string, unknown>) => any
  to?: string
  reverse?: (v: any, source: Record<string, unknown>) => any
  validator?: (value: any, source: Record<string, unknown>) => any | Array<(value: any, source: Record<string, unknown>) => any>
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
export const from = (value: string): any => {
  return function (target: ClassDecorator, name: string) {
    storage.entity(target.constructor).attr(name).setRule({ from: value })
  }
}

/**
 * 定义数据格式化转换方法
 * @param value 格式化方法
 * @returns
 */
export const format = (value: (v: any, ori: Record<string, unknown>) => any): any => {
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
export const validator = (value: (value: any, source: Record<string, unknown>) => any | Array<(value: any, source: Record<string, unknown>) => any>): any => {
  return function (target: ClassDecorator, name: string) {
    storage.entity(target.constructor).attr(name).setRule({ validator: value })
  }
}

/**
 * 定义数据逆向字段名，如果不定义在做逆向转换时将被忽略
 * @param value 逆向字段属性名
 * @returns
 */
export const to = (value: string): any => {
  return function (target: ClassDecorator, name: string) {
    storage.entity(target.constructor).attr(name).setRule({ to: value })
  }
}

/**
 * 自定义数据格式化转换方法
 * @param value 格式化方法
 * @returns
 */
export const reverse = (value: (v: any, ori: Record<string, unknown>) => any): any => {
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
 * Model基类，子类继承后可实现ORM转换
 */
export class Model {
  [key: string]: any

  constructor (source?: Record<string, any>) {
    this.parse(source)
  }

  /**
   * 实体初始化完成后的回调方法。子类可覆盖后实现自己的处理逻辑
   */
  onReady (): void {
    // 当初始化完成后调用，以便做一些特别处理
  }

  /**
   * 从来源对象中规则解析为实体对象
   * @param source 来源数据
   * @returns
   */
  doPrivateParse (attr: Attr, source: any): any {
    const { name, rules } = attr

    const origin = pick((rules.from || name).split('.'), source)

    const value = rules.format ? rules.format(origin, source) : origin
    if ((value === null || value === undefined) && rules.nullable === true) {
      return
    }

    this[name] = value

    if (rules.enumeration) {
      // 判断枚举类型是否匹配
      if (!rules.enumeration.includes(value)) {
        throw new ModelError(errMessageFormat.replace('{entity}', this.constructor.name).replace('{attr}', name).replace('{type}', rules.enumeration.join(', ')).replace('{value}', value))
      }
    } else if (Array.isArray(rules.type)) {
      // 判断数据类型是否为多类型的其中之一
      const typo = Object.getPrototypeOf(value).constructor
      if (!rules.type.includes(typo)) {
        throw new ModelError(errMessageFormat.replace('{entity}', this.constructor.name).replace('{attr}', name).replace('{type}', rules.type.map(v => v.name).join(', ')).replace('{value}', value))
      }
    } else if (rules.type) {
      // 判断数据类型是否精准匹配
      const typo = Object.getPrototypeOf(value).constructor
      if (rules.type === typo) {
        throw new ModelError(errMessageFormat.replace('{entity}', this.constructor.name).replace('{attr}', name).replace('{type}', rules.type.name).replace('{value}', value))
      }
    }

    if (rules.validator) {
      (Array.isArray(rules.validator) ? rules.validator : [rules.validator]).forEach(func => {
        func(value)
      })
    }
  }

  parse (source?: Record<string, any>): any {
    if (!source) {
      return this
    }

    storage.entity(this.constructor).attrs.forEach(attr => {
      this.doPrivateParse(attr, source)
    })

    return this
  }

  /**
   * 将数据合并到entity中（只合并entity定义过的key）
   * @param source 需要做合并的数据
   * @returns 
   */
  merge (source: Record<string, unknown>) {
    if (!source) {
      return this
    }

    storage.entity(this.constructor).attrs.forEach(attr => {
      if (Object.prototype.hasOwnProperty.call(source, attr.name)) {
        this.doPrivateParse(attr, source)
      }
    })

    return this
  }

  /**
   * 将实体转换为后端接口需要的JSON对象
   */
  reverse () {
    const json = {} as Record<string, any>

    storage.entity(this.constructor).attrs.forEach(attr => {
      const { name, rules } = attr
      if (rules.to) {
        json[rules.to] = rules.reverse ? rules.reverse(this[name], this) : this[name]
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
    if (parent.constructor.name !== 'Object' && target.name !== parent.constructor.name) {
      const ex = storage.entity(parent.constructor).attrs
      storage.entity(target).merge(ex)
    }
  }
}

export const setMessageFormat = (v: string) => {
  errMessageFormat = v
}
