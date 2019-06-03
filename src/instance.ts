import { lstatSync, readdir, readFileSync } from 'fs'
import { basename } from 'path'
import { camelize, trimExtension, dotToDash } from './util'
import { parseDocument } from './parse'
import { process } from './process'
import { generate } from './code-gen'
import renderFns, { templateMap } from './render'

export default class VTX {
  name: string
  _render: (refs: object, data: object) => string
  
  constructor (name: string) {
    this.name = name
    VTX.register(name, this)
  }

  render (data: object = {}): string {
    return this._render(renderFns, data)
  }
  
  static register (name: string, instance: VTX) {
    templateMap[name] = instance
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

function prettifyFilename (name: string): string {
  let str: string = basename(name)
  trimExtension(str)
  dotToDash(str)
  camelize(str)
  return str
}