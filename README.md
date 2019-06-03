# VTTX

VTTX is a templating engine for XML documents. It is based on a similar syntax
to Vue templates. It's like a static version of Vue, but it can be used for
any XML document, not just HTML.

## Installation

```javascript
npm install --save VTTX
```

## Usage

Import VTTX by whichever means necessary.

```javascript
import VTTX from 'VTTX'
```

Use `{{ delimiters }}` to interpolate values into a template

```html
<div>
  <span>{{ foo }}</span>
</div>
```

Templates need to be registered before they can be used.

```javascript
VTTX.register('myCoolTemplate', 'template source')
// or
const template = VTTX.register('myCoolTemplate', 'template source')
```

Render a template by providing a name and some data to `VTTX.render` or call
the render function on the template directly

```javascript
VTTX.render('myCoolTemplate', { foo: 'bar' })
template.render({ foo: 'bar' })
```

Templates render with interpolated text

```html
<div>
  <span>bar</span>
</div>
```

### Directives

#### Iteration

Iterate over arrays using the `v-for` Directives

```html
<ul>
  <li v-for="item in items">
    <span>{{ item }}</span>
  </li>
</ul>
```

```html
<ul>
  <li v-for="(item, index) in items">
    <span>{{ index }}. {{ item.name }} {{ item.value }}</span>
  </li>
</ul>
```

#### Conditionals

Conditional rendering with `v-if`, `v-else-if` and `v-else`

```html
<div>
  <div v-if="x === false">x is false</div>
  <div v-else-if="y > 4">y is greater than 4</div>
  <div v-else>What?</div>
</div>
```

### Partials

Call partials by name and providing local data

```html
<div class="green">
  <my-cool-list v-bind="{ list }" />
</div>
```
```html
<!-- myCoolList.html -->
<ul>
  <li v-for="item in list">{{ item }}</li>
</ul>
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Todo

* A more convenient way of registering many templates
* Better error reporting
* Slots
* Improve documentation

## Acknowledgements

VTTX is based on the Vue template compiler. The basic architecture and a few
functions are the same, but most of the code is original.

## License
[MIT](https://choosealicense.com/licenses/mit/)