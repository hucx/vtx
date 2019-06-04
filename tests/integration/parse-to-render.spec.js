const { parseDocument } = require('../../dist/parse')
const { process } = require('../../dist/process')
const { generate } = require('../../dist/code-gen')
const renderFns = require('../../dist/render').default
const { toFunction } = require('../../dist/render')
const { parseExpression } = require('../../dist/expression-parser')

describe('integration testing from parse to render', () => {
  it('renders template with locals', () => {
    const ast = parseDocument('<a>{{ foo }}</a>')
    process(ast)
    const code = generate(ast.elements)
    const _render = toFunction(parseExpression(code), code)
    expect(_render(renderFns, { foo: 'bar' })).toBe('<a>bar</a>')
  })

  it('renders template with locals that are undefined', () => {
    const ast = parseDocument('<a v-if="foo">{{ foo.name }}</a><b v-else>Nope</b>')
    process(ast)
    const code = generate(ast.elements)
    const _render = toFunction(parseExpression(code), code)
    expect(_render(renderFns, {})).toBe('<b>Nope</b>')
  })
})