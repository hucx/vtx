import { kebabCase } from 'lodash'

type CreateElementOptions = {
  attrs?: object[],
  value?: string,
  bind?: object
}

const renderFns = {
  _c: createElement,
  _l: renderList,
  _p: renderPartial
}

export default renderFns

export function toFunction (local, code) {
  let result
  try {
    result = new Function ('{ _c, _l, _p }', local, `return ${code}`)
  } catch (err) {
    err.message += ':in create render function'
    throw err
  }
  return result
}

// templateMap allows a value to be referenced by either camel or kebabCase
export const templateMap = new Proxy ({}, {
  get (obj, prop): any {
    return obj[kebabCase(prop)]
  },
  set (obj, prop, value): boolean {
    try {
      obj[kebabCase(prop)] = value
    } catch (e) {
      return false
    }
    return true
  },
  has (target, prop) {
    prop = kebabCase(prop)
    if (prop in target) return true
    return false
  }
})

export function createElement (
  tag: string,
  ...args: any[]
): string {
  let result: string
  let options: CreateElementOptions = args[0]
  let children: string | string[] = args[1]
  
  if (args.length === 1 && Array.isArray(args[0])) {
    options = undefined
    children = args[0]
  }

  if (tag in templateMap) {
    let locals = options ? options.bind : undefined
    return templateMap[tag].render(locals)
  }

  switch (tag) {
    case 'doctype':
      result = doctype(options)
      break

    default:
      result = `<${tag}`

      if (options) {
        if (options.attrs && options.attrs.length > 0) {
          result += options.attrs.reduce((a: any, b: any): string => {
            return a + ` ${b.name}="${b.value}"`
          }, '')
        }
      }

      result += '>'

      if (children) {
        if (Array.isArray(children)) {
          result += children.join('')
        } else {
          result += children
        }
      }

      result += `</${tag}>`
  }

  return result
}

function doctype (options: CreateElementOptions): string {
  return `<!DOCTYPE ${options.value}>`
}

export function renderList (
  val: any,
  render: (
    val: any,
    keyOrIndex: string | number,
    index?: number
  ) => string
): string {
  let ret: string[]
  if (Array.isArray(val) || typeof val === 'string') {
    ret = new Array(val.length)
    for (let i = 0, l = val.length; i < l; i++) {
      ret[i] = render(val[i], i)
    }
  } else if (typeof val === 'number') {
    ret = new Array(val)
    for (let i = 0; i < val; i++) {
      ret[i] = render(i + 1, i)
    }
  }
  return ret.join('')
}

export function renderPartial (name: string, data: object) {
  return templateMap[name].render(data)
}
