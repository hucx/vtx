const parser = require('acorn').parse

/*
 * Parse an expression and extract all the references
 */

export function parseExpression (exp: string): string {
  let result: string[] = []
  
  function processNode (node) {
    if (!node) return
    switch (node.type) {
      case 'ArrayExpression':
        node.elements.forEach(e => processNode(e))
        break

      case 'BinaryExpression':
        processNode(node.left)
        processNode(node.right)
        break

      case 'CallExpression':
        processNode(node.callee)
        node.arguments.forEach(a => processNode(a))
        break

      case 'ConditionalExpression':
        processNode(node.test)
        processNode(node.consequent)
        processNode(node.alternate)
        break

      case 'Identifier':
        recordRef(node.name)
        break

      case 'MemberExpression':
        processNode(node.object)
        break
        
      case 'ObjectExpression':
        node.properties.forEach(p => processNode(p.value))
        break

      case 'Property':
        processNode(node.key)
        break

      default:
    }
  }

  function recordRef(ref: string) {
    if (ref[0] !== '_') result.push(ref)
  }
  
  processNode(parser(exp).body[0].expression)
  
  return `{${result.join()}}`
}
