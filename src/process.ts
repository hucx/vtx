import VTX from './instance'
import { ASTNode } from './parse'
import { parseText, ParseTextResult } from './parse'
import { camelize } from './util'
import { templateMap } from './render'

const directiveRE = /^v-(for|if|else-if|else|bind)(?:="([^]+)?")*/

type Directive = {
  exp: string,
  processed: boolean,
  [key: string]: any
}

type ProcessorState = {
  index: number,
  currentNode: ASTNode,
  previousNode: ASTNode,
  parentNode: ASTNode
}

export type IfCondition = {
  exp: string,
  node: ASTNode
}

let parentNode: ASTNode = null
let previousNode: ASTNode = null
let currentNode: ASTNode = null
let index: number
let increment: boolean

// If the node is an element node, mark it as a template if any registered
// templates have a matching name.
// If the node has any directives, remove them from the attributes and add to
// the directives field
export function process (node: ASTNode): void {
  previousNode = currentNode
  currentNode = node

  if (node.type === 'element') {
    if (node.name in templateMap) {
      node.isTemplate = true
    }
  }

  if (node.attributes && Array.isArray(node.attributes)) {
    for (let i = 0; i < node.attributes.length;) {
      let a = node.attributes[i]
      let match = directiveRE.exec(a.name)
      if (match) {
        let directives = node.directives || (node.directives = {})
        directives[camelize(match[1])] = {
          exp: a.value,
          processed: false
        }
        node.attributes.splice(i,1)
      } else {
        i++
      }
    }
  }

  // Process child nodes
  if (node.elements) {
    if (Array.isArray(node.elements)) {
      let rememberIndex = index
      let rememberParent = parentNode
      let rememberPreviousNode = previousNode
      parentNode = node
      currentNode = null
      previousNode = null
      index = 0
      for (; index < node.elements.length;) {
        increment = true
        process(node.elements[index])
        if (increment) index++
      }
      index = rememberIndex
      parentNode = rememberParent
      previousNode = rememberPreviousNode
      currentNode = node
    }
  }

  if (node.directives) {
    processIf(node)
  }
}

function processIf (node: ASTNode): void {
  if (node.directives.elseIf || node.directives.else) {
    let previousDirective = previousNode.directives.elseIf
      || previousNode.directives.if
    
    if (!previousDirective) {
      throw new Error(`an element with the v-else-if directive must be directly preceded by an element with a v-if or v-else-if directive`)
    } else {
      previousDirective.else = spliceNode()
    }
  }
}

// Splice a node from the current parent's elements
// set increment to false to account for reduced length of elements array
function spliceNode (): ASTNode {
  increment = false
  return parentNode.elements.splice(index, 1)[0]
}

function processText (node: ASTNode): void {
  if (node.type !== 'text') return
  let processedText = parseText(node.text)
  if (processedText) {
    node.text = processedText.expression
  }
}