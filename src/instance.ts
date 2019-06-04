import { parseDocument } from './parse'
import { process } from './process'
import { generate } from './code-gen'
import renderFns, { templateMap, toFunction } from './render'
import { parseExpression } from './expression-parser'

export default class VTTX {
  name: string
  _render: Function

  constructor (name: string) {
    this.name = name
  }

  render (data: object = {}): string {
    let result

    try {
      result = this._render(renderFns, data)
    } catch (err) {
      err.message += ` : rendering ${this.name}`
    }

    return result
  }
  
  static register (name: string, source: string) {
    const i = new VTTX(name)

    try {
      i._render = VTTX.compile(source)
    } catch (err) {
      err.message += ` :compiling template`
      throw err
    }

    templateMap[name] = i
    return i
  }
  
  static render (name: string, data: object) {
    return templateMap[name].render(data)
  }
  
  static compile(source: string): Function {
    const ast = parseDocument(source)
    process(ast)
    const code = generate(ast.elements)
    return toFunction(parseExpression(code), code)
  }
}