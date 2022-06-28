a tiny and simple entity mapper for frontend. inspired by typeorm

`extendable，simple config，support typescript, zero dependency`

[中文文档](https://github.com/tanikou/tapo/blob/main/README.cn.md)

# install

```
npm i --save tapo
```

# define entity

```
import { Entity, Model, type } from 'tapo'

@Entity()
export default class Named extends Model {
  constructor (source) {
    super()
    this.merge(source)
  }

  @type(String)
  name = ''
}
```

example 1:

```
new Named().parse({ name: 'Tapo', date: new Date() })
```

get result

```
Named {name: "Tapo"}
```

example 2: `attr not match`

```
new Named().parse({ date: new Date() })
```

get result

```
Error: Named.name defined as String, got：undefined
```

# customize error message

```
import { setMessageFormat } from 'tapo'

setMessageFormat('{entity}.{attr}: {value} is not "{type}"')
```

get result

```
Error: Named.name: undefined is not "String"
```

# not match handler.

by default, it will throw an error if not match.

```
import { setLogger } from 'tapo'

setLogger(console)
```

or

```
setLogger({
  error: (v: string) => { alert(v) }
})
```

# `extend` others and more `anotations`

```
import { Entity, Model, type, from, nullable, parse, validator } from 'tapo'

@Entity()
export default class Staff extends Named {
  constructor (source) {
    super()
    this.merge(source)
  }

  @from('author.name')
  @type(String)
  author = ''

  @from('author.email')
  @nullable()
  email = ''

  @from('birthday')
  @type(Number)
  @parse(v => v.getFullYear())
  @validator([
    (v) => v.getFullYear() > 2020
  ])
  year = ''
}

new Staff().parse({
  name: 'Tapo Mapper',
  author: { name: 'tan' },
  birthday: new Date()
})
```

```
Staff { name: 'Tapo Mapper', author: 'tan', email: '', year: 2021 }
```

# as props type of vue component

```
<template>
  <div>
    {{ staff }}
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Staff from '@/entity/Staff'

export default defineComponent({
  props: {
    staff: {
      type: Staff
    }
  }
})
</script>
```

# mult type and enumeration

```
import { Entity, Model, type, enumeration } from 'tapo'

@Entity()
export default class Named extends Model {
  constructor (source) {
    super()
    this.merge(source)
  }

  @type(String)
  name = ''

  @type([String, Number])
  key = ''

  @enumeration([10, 20])
  age = 0
}
```

good

```
new Named().parse({ name: 'Tapo', key: 1,  age: 10})

get

Named { name: "Tapo", key: 1,  age: 10 }


new Named().parse({ name: 'Tapo', key: 'private key',  age: 10})

get

Named { name: "Tapo", key: "private key",  age: 10 }
```

error

```
new Named().parse({ name: 'Tapo', key: 1,  age: 30})

get

Error: Named.age defined as [10, 20], 30
```

# reverse entity to json object for api request

```
import { Entity, Model, type, to, reverse } from 'tapo'

@Entity()
export default class Query extends Model {
  constructor (source) {
    super()
    this.merge(source)
  }

  @from('nickname')
  @type(String)
  @to('userName')
  name = ''

  @type(String)
  @to("privatekey")
  @reverse((v) => 'base64://' + v)
  key = ''

  @to()
  addr = ''
}
```

```
const entity = new Query().parse({ nickname: 'tapo', key: '123' })

get

Query { name: "tapo", key: "123", addr: '' }


entity.reverse()

get

{ "userName": "tapo", "privatekey": "base64://123" }
```

entity.reverse() will ingore `null`, `''`, `undefined` property by default, you can use `entity.reverse({ lightly: false })` to get `{ "userName": "tapo", "privatekey": "base64://123", "addr": "" }`

```
interface ReverseOption {
  // lightly mode will ignore attribute if the value is blank string
  lightly?: boolean | undefined
  // ignore attribute
  exclusion?: string[]
}
```

# set lightly for global

```
import { defaults } from 'tapo'

defaults.lightly = false
```

# decorators

1. @`Enitity` => anotation for entity class
2. @`from` => define from original prop. eg: `@from('company.name')`
3. @`type` => define data type. support mult type. eg: `@type([Number, String])`
4. @`nullable` => allow data can be `null` or `undefined`
5. @`parse` => define how to parse the original data. eg: `@parse((v, me) => (v * me.unit) + 'miniute')`. `this` keyword in parse function is supported from V2.8.1
6. @`enumeration` => enumeration
7. @`validator` => support mult validator
8. @`omit` => omit this attribute when call functioin parse, merge, reverse
9. @`to` => define how to format entity to a json object, generally for the backend api. eg:tranfer entity attr`name` to `userName`，`@to('userName')`
10. @`reverse` => define how to format the entity attr to json attr.
    eg: `@reverse((v, me) => me.status === 1 ? moment(v).format('YYYYMMDD') : moment(v).format('YY-MM-DD'))`
    or : `@reverse(function(v) { return this.status === 1 ? v : '' })`
11. @`recover` => define how to convert string vlaue to the attritube value from query
12. `@format` alias to `@parse`

# private function of entity from model

1. `entity.parse`(source), the parameter `source` can be a json object or a entity, normally use this function to merge some values from other object
2. `entity.merge`(source), the parameter `source` can be a json object or a entity, this will set the attribute value of entity by source attr value (if the source has the same attribute)
3. `entity.recover`(source), the parameter `source` can be a json object or a entity, normally use this function to recover entity from the url. this function will auto tranform prop data to the type of defined. eg: http://localhost/logs?name=tapo&page=1&size=10. create entity by `new LogQuery().recover({ name: 'tapo', page: '1', size: '10' })` get result `LogQuery { name: 'tapo', page: 1, size: 10 }`
4. `entity.reverse()` transform entity to a json object

# more

you can define some prop without anotation. it will ignore when create a entity or reverse to a json object. eg:

```
@Entity()
export default class Named extends Model {
  constructor (source) {
    super()
    this.merge(source)
  }

  loading = false

  isme () {
    return this.name === 'tapo'
  }

  @type(String)
  name = ''
}
```

```
new Named().parse({ loading: true, name: 'tapo' })
```

get

```
Named { loading: false, name: "tapo" }
```

`named.isme()` will get `true`

`named.reverse()` will get json object `{ name: 'tapo' }`

especially useful for data lock in table

# use this in parse function

by default, tapo will parse attributes one by on as you defined.

```
@Entity()
export class Tp extends Model {
  constructor (source?: Record<string, unknown>) {
    super()
    this.merge(source)
  }

  @parse(function (this: Tp, v) {
    console.log(v, this.id)
    return v
  })
  @nullable()
  @type(String)
  @to()
  key = ''

  @parse((v) => {
    console.log(v)
    return v
  })
  @type(Number)
  @to()
  id = 0
}

new Tp().parse({ id: 1, key: '2' })

output:
1
2 1
```

# method parameter check in runtime

if your project do not support typescript, but you want to check the parameter in runtime

```
import { param } from 'tapo'
import { Log } from '../entity/log'

export class LogRepository extends Repository {
  @param(Log)
  static async create (row) {
    return axios.post('/system/log', row)
  }
}
```

```
LogRepository.create(new Member())
```

get

```
Error: LogRepository.create(Member <> Log)
```
