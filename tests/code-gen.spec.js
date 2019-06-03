const { generate } = require('../dist/code-gen.js')
const { parseDocument } = require('../dist/parse.js')
const { process } = require('../dist/process.js')
const ast = require('./processed-ast.js')

function assertCodegen (template, generatedCode) {
  let ast = parseDocument(template)
  process(ast)
  expect(generate(ast.elements)).toBe(generatedCode)
}

describe('code gen', () => {
  it('returns a string', () => {
    expect(generate(ast.singleEmptyTag.elements)).toBe(`_c('a')`)
  })

  it('multiple root level elements', () => {
    expect(generate(ast.doctypeAndEmptyTag.elements)).toBe(`_c('doctype',{value:'crumpets'})+_c('a')`)
  })

  it('multiple elements', () => {
    expect(generate(ast.multipleRootsWithChildren.elements)).toBe(
      `_c('doctype',{value:'crumpets'})+_c('div',[_c('a'),_c('b')])`
    )
  })
  
  it('generates tag with text', () => {
    assertCodegen(
      '<div>Hello World!</div>',
      `_c('div',["Hello World!"])`
    )
  })

  it('generates tag with a child tag', () => {
    assertCodegen(
      '<div><p>Hi</p></div>',
      `_c('div',[_c('p',["Hi"])])`
    )
  })

  it('generates tag with a child tag that has attributes', () => {
    assertCodegen(
      '<div><p class="foo">Hi</p></div>',
      `_c('div',[_c('p',{attrs:[{name:'class',value:'foo'}]},["Hi"])])`
    )
  })

  it('generates tag with a child tag that has binding', () => {
    assertCodegen(
      '<div><cool-list v-bind="{ items }" /></div>',
      `_c('div',[_c('cool-list',{bind:{ items }})])`
    )
  })

  it('generates tag with child tags', () => {
    assertCodegen(
      '<div><p>Hello</p><p>World!</p></div>',
      `_c('div',[_c('p',["Hello"]),_c('p',["World!"])])`
    )
  })

  it('generate v-for', () => {
    assertCodegen(
      '<ul><li v-for="item in items"></li></ul>',
      `_c('ul',[_l((items),function(item){return _c('li')})])`
    )
  })

  it('generate v-for with alias', () => {
    assertCodegen(
      '<ul><li v-for="item in items">{{ item }}</li></ul>',
      `_c('ul',[_l((items),function(item){return _c('li',[(item)])})])`
    )
  })
  
  it('generates v-if directive', () => {
    assertCodegen(
      '<div><p v-if="show">hello</p></div>',
      `_c('div',[(show)?_c('p',["hello"]):''])`
    )
  })

  it('generates v-if directive with other tags', () => {
    assertCodegen(
      '<div><p v-if="show">Hello</p><p>World!</p></div>',
      `_c('div',[(show)?_c('p',["Hello"]):'',_c('p',["World!"])])`
    )
  })

  it('generates v-if and v-else directive', () => {
    assertCodegen(
      '<div><p v-if="show">hello</p><p v-else>goodbye</p></div>',
      `_c('div',[(show)?_c('p',["hello"]):_c('p',["goodbye"])])`
    )
  })
  
  it('generates v-if, v-else-if and v-else directive', () => {
    assertCodegen(
      '<div><p v-if="show === 1">hello</p><p v-else-if="show === 2">maybe</p><p v-else>goodbye</p></div>',
      `_c('div',[(show === 1)?_c('p',["hello"]):(show === 2)?_c('p',["maybe"]):_c('p',["goodbye"])])`
    )
  })
})
