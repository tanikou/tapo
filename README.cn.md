简单好用的前端实体映射工具

`Entity可继承，简单配置，可直接用作vue组件prop的类型限制。支持TS。零依赖`

# 安装

```
npm i --save tapo
```

# 定义实体类

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

例 1:

```
new Named({ name: 'Tapo', date: new Date() })
```

生成类

```
Named {name: "Tapo"}
```

例 2: `属性与定义不匹配的情况`

```
new Named({ date: new Date() })
```

运行后抛出一个 Error。（可通过`setLogger`自定义是抛出错误还是弹窗提示）

```
Error: Named.name defined as String, got：undefined
```

# 自定义错误信息

```
import { setMessageFormat } from 'tapo'

setMessageFormat('{entity}.{attr}: {value} is not "{type}"')
```

运行结果

```
Error: Named.name: undefined is not "String"
```

# 自定义不匹配时的处理

在类型不匹配时默认会抛出一个 Error，你可以设置 logger 覆盖默认处理

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

# `继承` 其他实体类 及 更多 `注解`

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

# 实体类可以直接做为 vue 的 prop type，强化组件的数据类型

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

# 多数据组件及枚举支持

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

正常的

```
new Named({ name: 'Tapo', key: 1,  age: 10})

生成

Named { name: "Tapo", key: 1,  age: 10 }


new Named({ name: 'Tapo', key: 'private key',  age: 10})

生成

Named { name: "Tapo", key: "private key",  age: 10 }
```

异常的值（30）

```
new Named({ name: 'Tapo', key: 1,  age: 30})

报错

Error: Named.age defined as [10, 20], 30
```

# 将前端的实体类转换成后端 API 所需要的 json object

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

生成类

Query { name: "tapo", key: "123", addr: '' }


entity.reverse()

转换成json为

{ "userName": "tapo", "privatekey": "base64://123" }
```

entity.reverse() 默认将忽略属性值为 `null`, `''`, `undefined`及未定义 to 的属性不传给后端, 可以使用 `entity.reverse({ lightly: false })` 会将所有定义了 to 的属性都传回去 `{ "userName": "tapo", "privatekey": "base64://123", "addr": "" }`

# 相关注解

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

# 从 Model 基类继续到的私有方法

1. `entity.merge`(source), 参数 `source` 可能是 json 也可以是实体类, 通常用来合并其他地方的属性值到实体中，如表格组件提交的新的分页或排序数据
2. `entity.mergein`(source), 通用用来将 url 中的参数还原给实体类. `mergein` 将自动识别`type`定义的类型并转换成指定的类型. 如: http://localhost/logs?name=tapo&page=1&size=10. 用 URL 中的参数合并到实体 `new LogQuery().mergein({ name: 'tapo', page: '1', size: '10' })` 得到结果 `LogQuery { name: 'tapo', page: 1, size: 10 }`
3. `entity.reverse()` 将实体转换为 json 数据

# 其他

你可以定义没有任务注解的属性或者方法。这时在生成实体与实体转换成 json 将忽略这些无任务注解的属性。 eg:

```
@Entity()
export default class Named extends Model {
  constructor (source) {
    super()
    this.parse(source)
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
new Named({ loading: true, name: 'tapo' })
```

生成类

```
Named { loading: false, name: "tapo" }
```

使用自定义的 `named.isme()` 获得结果 `true`

使用从 model 继承的方法 `named.reverse()` 生成 json `{ name: 'tapo' }`

一般在表格的行操作需要加防抖时特别好用
