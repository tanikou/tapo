a tiny and simple entity mapper for frontend. inspired by typeorm

`Entity可继承，简单配置，可直接用作vue组件prop的类型限制。支持TS`

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
    this.parse(source)
  }

  @type(String)
  name = ''
}
```

example 1:

```
new Named({ name: 'Tapo', date: new Date() })
```

get result

```
Named {name: "Tapo"}
```

example 2: `attr not match`

```
new Named({ date: new Date() })
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

# `extend` others and more `anotations`

```
import { Entity, Model, type, from, nullable, format, validator } from 'tapo'

@Entity()
export default class Staff extends Named {
  constructor (source) {
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

new Staff({
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
    this.parse(source)
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
new Named({ name: 'Tapo', key: 1,  age: 10})

get

Named { name: "Tapo", key: 1,  age: 10 }


new Named({ name: 'Tapo', key: 'private key',  age: 10})

get

Named { name: "Tapo", key: "private key",  age: 10 }
```

error

```
new Named({ name: 'Tapo', key: 1,  age: 30})

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

  @to()
  addr = ''
}
```

```
const entity = new Query({ nickname: 'tapo', key: '123' })

get

Query { name: "tapo", key: "123", addr: '' }


entity.reverse()

get

{ "userName": "tapo", "privatekey": "base64://123" }
```

entity.reverse() will ingore `null`, `''`, `undefined` property by default, you can use `entity.reverse({ lightly: false })` to get `{ "userName": "tapo", "privatekey": "base64://123", "addr": "" }`

# anotations

1. @`Enitity` => 注解在类上
2. @`from` => 定义字段数据来源，可多级结构。例`@from('company.name')`
3. @`type` => 定义字段数据类型，可是基础数据类型也可以类，可设置多类型,例: `@type([Number, String])`
4. @`nullable` => 设置是否允许为空，即允许值为`null`或`undefined`
5. @`format` => 用于自定义格式化转换数据。例：`@format(v => (v * 60) + '分钟')`
6. @`enumeration` => 设置数据只能是枚举的值
7. @`validator` => 自定义校验
8. @`to` => 定义将属性名转成换其他属性名，一般用于转给后端接口。例:类属性`name`转换成`userName`，`@to('userName')`
9. @`reverse` => 自定义在 to 时如何转换属性。
   例: `@reverse((v, me) => me.status === 1 ? moment(v).format('YYYYMMDD') : moment(v).format('YY-MM-DD'))`
