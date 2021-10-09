import { Entity, Model, type, from, nullable, format, validator, to, reverse } from './dist/'

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
    (v) => v > 2020
  ])
  year = ''
}

console.log(new Staff({ name: 'Tapo Mapper', author: { name: 'tan' }, birthday: new Date() }))


@Entity()
export default class Query extends Model {
  constructor (source) {
    super()
    this.parse(source)
  }

  @from('nickname')
  @type(String)
  @to('userName')
  name = ''

  @type(String)
  @to("privatekey")
  @reverse((v) => 'base64://' + v)
  key = ''
}

const entity = new Query({ nickname: 'tapo', key: '123' })
console.log(entity.reverse())
