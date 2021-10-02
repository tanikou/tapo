/* eslint-disable */
import storage from './storage'

let errMessageFormat = `{entity}.{attr} defined as {type}, got：{value}`

export interface ModelConfig {
  from?: string
  type?: Function,
  nullable?: boolean,
  format?: (v: any, source: Record<string, unknown>) => any,
  validator?: Array<(value: any, source: Record<string, unknown>) => any>
}

export const field = (config: ModelConfig): any => {
  return function (target: ClassDecorator, name: string) {
    storage.entity(target.constructor).attr(name).setRule(config)
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
 * 定义数据类型
 * @param value String Number Boolean ...其他基础数据类型或实体类
 * @returns
 */
export const type = (value: Function): any => {
  return function (target: ClassDecorator, name: string) {
    storage.entity(target.constructor).attr(name).setRule({ type: value })
  }
}

/**
 * 标记此属性可以为null或者undefined
 * @param value = true, true = 可以为空，false则不可
 * @returns
 */
export const nullable = (value = true): any => {
  return function (target: ClassDecorator, name: string) {
    storage.entity(target.constructor).attr(name).setRule({ nullable: value })
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
 * 定义数据校验方法。返回false则表示验证不通过，自定义提示信息可通过throw new Error实现
 * @param value 校验方法数组
 * @returns
 */
export const validator = (value: Array<(value: any, source: Record<string, unknown>) => any>): any => {
  return function (target: ClassDecorator, name: string) {
    storage.entity(target.constructor).attr(name).setRule({ validator: value })
  }
}

const pick = (key: string[], value: Record<string, any>): any => {
  if (key.length === 1) {
    return value[key[0]]
  }

  const top = key.shift() || ''

  return pick(key, value[top])
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
  parse (source?: Record<string, any>): any {
    if (!source) { return this }

    storage.entity(this.constructor).attrs.forEach(attr => {
      const { name, rules } = attr

      const origin = pick((rules.from || name).split('.'), source)

      const value = rules.format ? rules.format(origin, source) : origin
      if ((value === null || value === undefined) && rules.nullable === true) {
        return
      }

      this[name] = value

      if (Object.prototype.toString.call(value) !== `[object ${rules.type?.name}]`) {
        throw new Error(errMessageFormat.replace('{entity}', this.constructor.name).replace('{attr}', name).replace('{type}', rules.type?.name).replace('{value}', value))
      }
    })

    this.onReady()

    return this
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
