const { parseDocument } = require('../../dist/parse')
const { process } = require('../../dist/process')
const { generate } = require('../../dist/code-gen')
const renderFns = require('../../dist/render').default
const { toFunction } = require('../../dist/render')
const { parseExpression } = require('../../dist/expression-parser')
const VTTX = require('../../dist/instance').default

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

  it('renders a partial with undefined properties', () => {
    const t = VTTX.register('template', '<a><partial v-bind="{ foo }" /></a>')
    const p = VTTX.register('partial', '<b><c v-if="foo">foo.name</c><d v-else>Nope</d></b>')
    expect(t.render({})).toBe('<a><b><d>Nope</d></b></a>')
  })
})