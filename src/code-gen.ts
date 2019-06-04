import { ASTNode } from './parse'
import { templateMap } from './render'

const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
const stripParensRE = /^\(|\)$/g

export function generate (nodes: ASTNode[]): string {
  let result = ''
  if (Array.isArray(nodes)) {
    let arr: string[] = []
    nodes.forEach(n => {
      arr.push(_generate(n))
    })
    result += arr.join('+')
  } else {
    throw new Error('nodes must be an array')
  }
  return result
}

function _generate (node: ASTNode): string {
  if (node.type === 'doctype') return generateDoctype(node)

  let result: string

  switch (node.type) {
    case 'element':
      result = generateElement(node)
      break
    case 'doctype':
      result = generateDoctype(node)
      break
    case 'text':
      result = generateText(node)
      break
  }

  return result
}

function generateElement (node: ASTNode): string {
  if (node.directives) {
    if (node.directives.for) {
      if (!node.directives.for.processed) {
        return generateFor(node)
      }
    } else if (node.directives.if) {
      if (!node.directives.if.processed) {
        return generateIf(node)
      }
    }
  }

  let result = `_c('${node.name}'`

  let attrs, bind
  if (node.directives) {
    if (node.directives.bind) bind = node.directives.bind
  }
  if (node.attributes) {
    if (node.attributes.length) attrs = node.attributes
  }

  if (attrs || bind) {
    let optsArr = []
    if (attrs) {
      let arr: string[] = []
      attrs.forEach(a => {
        arr.push(`{name:'${a.name}',value:'${a.value}'}`)
      })
      optsArr.push(`attrs:[${arr.join(',')}]`)
    }
    if (bind) {
      optsArr.push(`bind:${bind.exp}`)
    }
    result += `,{${optsArr.join(',')}}`
  }

  if (node.elements) {
    if (Array.isArray(node.elements)) {
      let arr: string[] = []
      node.elements.forEach(e => {
        arr.push(_generate(e))
      })
      result += `,[${arr.join(',')}]`
    }
  }

  result += ')'

  return result
}

function generateFor (node: ASTNode): string {
  const forParseResult: ForParseResult = parseFor(node.directives.for.exp)
  node.directives.for.processed = true
  return `_l((${forParseResult.for}),` +
    `function(${forParseResult.alias}${forParseResult.iterator1 || ''}){` +
      `return ${generateElement(node)}` +
    '})'
}

type ForParseResult = {
  for: string;
  alias: string;
  iterator1?: string;
  iterator2?: string;
}

function parseFor (exp: string) {
  const inMatch = exp.match(forAliasRE)
  if (!inMatch) return
  const res: ForParseResult = {
    for: inMatch[2].trim(),
    alias: null
  }
  const alias = inMatch[1].trim().replace(stripParensRE, '')
  const iteratorMatch = alias.match(forIteratorRE)
  if (iteratorMatch) {
    res.alias = alias.replace(forIteratorRE, '').trim()
    res.iterator1 = iteratorMatch[1].trim()
    if (iteratorMatch[2]) {
      res.iterator2 = iteratorMatch[2].trim()
    }
  } else {
    res.alias = alias
  }
  return res
}

function generateIf (node: ASTNode) {
  let directive = node.directives.if
  if (directive) directive.processed = true
  return generateIfConditions(node)
}

function generateIfConditions (
  node: ASTNode
): string {
  let directive: any = node.directives.if || node.directives.elseIf
  if (directive) {
    if (!directive.exp) throw new Error('v-if and v-else-if require a condition')
  } else if (node.directives.else) {
    return generateElement(node)
  }

  return `(${directive.exp})?${
    // wrap in a function to ensure that references are not exposed until
    // necessary
    `(()=>${generateElement(node)})()`
  }:${
    directive.else ? generateIf(directive.else) : '\'\''
  }`
}

function generateDoctype (node: ASTNode): string {
  return `_c('doctype',{value:'${node.value}'})`
}

function generateTemplate (node: ASTNode): string {
  return `_t('${node.name}',${node.directives.bind.exp})`
}

function generateText (node: ASTNode) {
  const txt = parseText(node.text)
  if (!txt) return JSON.stringify(node.text)
  return `${txt.expression}`
}

type ParseTextResult = {
  expression: string,
  tokens: string[]
}

export function parseText (text: string): ParseTextResult {
  const defaultDelimitersRE = /\{\{((?:.|\n)+?)\}\}/g
  if (!defaultDelimitersRE.test(text)) {
    return
  }
  const tokens = []
  const rawTokens = []
  let lastIndex = defaultDelimitersRE.lastIndex = 0
  let match: any, index: number, tokenValue: string
  while ((match = defaultDelimitersRE.exec(text))) {
    index = match.index
    // push text token
    if (index > lastIndex) {
      rawTokens.push(tokenValue = text.slice(lastIndex, index))
      tokens.push(JSON.stringify(tokenValue))
    }
    // tag token
    const exp = match[1].trim()
    tokens.push(`(${exp})`)
    rawTokens.push({ '@binding': exp })
    lastIndex = index + match[0].length
  }
  if (lastIndex < text.length) {
    rawTokens.push(tokenValue = text.slice(lastIndex))
    tokens.push(JSON.stringify(tokenValue))
  }
  return {
    expression: tokens.join('+'),
    tokens: rawTokens
  }
}
// function generatePartial (node) {
//   let result = `_p('${node.name}'`
//   if (node.directives) {
//     let bind = node.directives.bind
//     if (bind) {
//       result += ','
//       result += bind.exp
//     }
//   }
//   result += ')'
//   return result
// }