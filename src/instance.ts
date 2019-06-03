import { parseDocument } from './parse'
import { process } from './process'
import { generate } from './code-gen'
import renderFns, { templateMap } from './render'

export default class VTTX {
  name: string
  _render: Function

  constructor (name: string) {
    this.name = name
  }

  render (data: object = {}): string {
    return this._render(renderFns, data)
  }
  
  static register (name: string, source: string) {
    const i = new VTTX(name)
    i._render = VTTX.compile(source)
    templateMap[name] = i
    return i
  }
  
  static render (name: string, data: object) {
    return templateMap[name].render(data)
  }
  
  static compile(source: string): Function {
    const ast = parseDocument(source)
    process(ast)
    return new Function('{_c,_l,_p}', 'local', `with(local){return ${generate(ast.elements)}}`)
  }
}