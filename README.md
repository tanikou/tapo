a tiny and simple entity mapper for frontend. inspired by typeorm

`Entity可继承，简单配置，可直接用作vue组件prop的类型限制`

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


# use as vue component props type
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
    token: {
      type: Staff
    }
  }
})
</script>
```
