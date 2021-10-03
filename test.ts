import { Entity, Model, type, from, nullable, format, validator } from './dist/'

@Entity()
export default class Named extends Model {
	constructor (source?: Record<string, unknown>) {
	  super()
	  this.parse(source)
	}
  
  @type(String)
  name = ''
}

@Entity()
export default class Staff extends Named {
  constructor (source?: Record<string, unknown>) {
    super()
    this.parse(source)
  }

  @from('author.name')
  @type(String)
  author = ''

  @from('author.email')
  @nullable()
  email = ''

  @from('birthday')
  @type(Number)
  @format(v => v.getFullYear())
  @validator([
    (v) => v.getFullYear() > 2020
  ])
  year = ''
}

console.log(new Staff({ name: 'Tapo Mapper', author: { name: 'tan' }, birthday: new Date() }))
