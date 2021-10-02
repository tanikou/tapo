import { ModelConfig } from './index'

export class Attr {
  name = ''
  rules: ModelConfig = {}

  constructor (name: string) {
    this.name = name
  }

  setRule (rule: ModelConfig): void {
    Object.assign(this.rules, rule)
  }
}

export class Meta {
  // eslint-disable-next-line @typescript-eslint/ban-types
  target: Function
  name = ''
  attrs: Attr[] = []

  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor (target: Function) {
    this.target = target
    this.name = target.name
  }

  attr (name: string): Attr {
    let attr = this.attrs.find(v => v.name === name)
    if (!attr) {
      attr = new Attr(name)
      this.attrs.push(attr)
    }

    return attr
  }

  merge (attrs: Attr[] = []): void {
    attrs.forEach(attr => {
      if (!this.attrs.find(v => v.name === attr.name)) {
        this.attrs.push(attr)
      }
    })
  }
}

export class ModelStorage {
  entities: Meta[] = []

  // eslint-disable-next-line @typescript-eslint/ban-types
  entity (target: Function): Meta {
    let entity = this.entities.find(v => v.target === target)
    if (!entity) {
      entity = new Meta(target)
      this.entities.push(entity)
    }
    return entity
  }
}

const storage = new ModelStorage()

export default storage
