export type ASTNode = {
  type: string,
  name?: string,
  value?: string,
  text?: string,
  attributes?: { name: string, value: string}[],
  elements?: ASTNode[],
  for?: string,
  isTemplate?: boolean,
  forProcessed?: boolean,
  directives?: { [key: string]: any }
}

type attr = {
  name: string,
  value: string
}

export type ParseTextResult = {
  expression: string,
  tokens: string[]
}

export function parseDocument (source: string): ASTNode {
  const nonWhiteSpaceRE = /\S/
  const dotRE = /./
  const tagNameRE = /[:\w-]/
  const attrValueRE = /[^<&"]/
  const whiteSpaceRE = /\s/
  let state = 'ROOT'
  let root: ASTNode = { type: 'root', elements: []}
  let stack: ASTNode[] = [root]
  let tagName = undefined
  let attrName = ''
  let attrValue = ''
  let charData = ''
  let raw: string
  let index = 0
  let charDataRE = dotRE

  // State machine for parsing an XML document.  This is pretty loose
  const states = {
    ROOT (char: string) {
      if (char === '<') {
        state = 'TAG_BEGIN'
      } else if (whiteSpaceRE.test(char)) {
        return
      } else {
        throw new Error('bad document')
      }
    },

    TAG_BEGIN (char: string) {
      if (tagNameRE.test(char)) {
        tagName = ''
        transitionTo('START_TAG')
      } else if (char === '/') {
        tagName = ''
        state = 'END_TAG'
      } else if (char === '!') {
        if (source.substring(index,index + 3) === '!--') {
          index += 3
          raw = ''
          state = 'COMMENT'
        } else {
          transitionTo('PROLOG')
        }
      } else if (char === '?') {
        state = 'PROLOG'
      } else {
        throw new Error('bad start tag')
      }
    },

    START_TAG (char: string) {
      if (tagNameRE.test(char)) {
        tagName += char
      } else if (char === '>') {
        addElement({
          type: 'element',
          name: tagName
        })
        state = 'CONTENTS'
      } else if (whiteSpaceRE.test(char)) {
        addElement({
          type: 'element',
          name: tagName
        })
        state = 'INSIDE_START_TAG'
      } else if (char === '/') {
        if (source[index + 1] === '>') {
          addElement({
            type: 'element',
            name: tagName
          })
          endElement()
          index++
        }
      }
    },
    INSIDE_START_TAG (char: string) {
      if (tagNameRE.test(char)) {
        attrName = char
        state = 'ATTRIBUTE_NAME'
      } else if (char === '/') {
        if (source[index + 1] === '>') { // Here we have an empty tag
          endElement()
          index++
          state = 'CONTENTS'
        }
      } else if (char === '>') {
        state = 'CONTENTS'
      }
    },
    ATTRIBUTE_NAME (char: string) {
      if (tagNameRE.test(char)) {
        attrName += char
      } else if (char === '=') {
        attrValue = undefined
        state = 'ATTRIBUTE_VALUE'
      } else if (whiteSpaceRE.test(char)) {
        addAttr({ name: attrName, value: null })
        state = 'INSIDE_START_TAG'
      } else if (char === '>') {
        addAttr({ name: attrName, value: null })
        state = 'CONTENTS'
      }
    },
    ATTRIBUTE_VALUE (char: string) {
      if (attrValue === undefined) {
        if (char === '"') {
          attrValue = ''
        }
      } else {
        if (attrValueRE.test(char)) {
          attrValue += char
        } else if (char === '"') {
          addAttr({ name: attrName, value: attrValue })
          state = 'INSIDE_START_TAG'
        }
      }
    },
    CONTENTS (char: string) {
      if (char === '<') {
        state = 'TAG_BEGIN'
      } else if (nonWhiteSpaceRE.test(char)) {
        state = 'CHARACTER_DATA'
        charData = char
      }
    },
    CHARACTER_DATA (char: string) {
      if (char === '\'') {
        charData += char
        state = 'SINGLE_QUOTES'
      } else if (char === '"') {
        charData += char
        state = 'DOUBLE_QUOTES'
      } else if (char === '`') {
        charData += char
        state = 'BACK_TICKS'
      } else if (char === '<') {
        addElement({ type: 'text', text: charData })
        state = 'TAG_BEGIN'
      } else if (char === '\n') {
        charData += char
        charDataRE = nonWhiteSpaceRE
      } else if (charDataRE.test(char)) {
        charData += char
        charDataRE = dotRE
      }
    },
    SINGLE_QUOTES (char: string) {
      if (char === '\'') {
        state = 'CHARACTER_DATA'
      }
      charData += char
    },
    DOUBLE_QUOTES (char: string) {
      if (char === '"') {
        state = 'CHARACTER_DATA'
      }
      charData += char
    },
    BACK_TICKS (char: string) {
      if (char === '`') {
        state = 'CHARACTER_DATA'
      }
      charData += char
    },
    END_TAG (char: string) {
      if (tagNameRE.test(char)) {
        tagName += char
      } else if (char === '>') {
        if (stack[stack.length - 1].name !== tagName) {
          throw new Error('mismatched tag names')
        }
        endElement()
        state = 'CONTENTS'
      }
    },
    COMMENT (char: string) {
      if (char === '-') {
        if (source.substring(index, index + 3) === '-->') {
          index += 2
          addElement({ type: 'comment', text: raw.trim() })
          endElement()
          state = 'CONTENTS'
          return
        }
      }

      raw += char
    },
    PROLOG (char: string) {
      if (char === '!') {
        if (source.substring(index, index + 8) === '!DOCTYPE') {
          index += 8
          raw = ''
          transitionTo('DOCTYPE')
        }
      }
    },
    DOCTYPE (char: string) {
      if (tagNameRE.test(char)) {
        raw += char
      } else if (char === '>') {
        addElement({ type: 'doctype', value: raw })
        endElement()
        state = 'CONTENTS'
      }
    }
  }
  
  while (source[index]) {
    states[state](source[index])
    index++
  }
  
  if (stack.length > 1) {
    let el = stack.pop()
    throw new Error(`unclosed ${el.name} tag`)
  }

  return root
  
  function transitionTo (newState: string) {
    state = newState
    states[state](source[index])
  }
  
  // Add an attribute to the current element
  function addAttr (attr: attr) {
    let el = stack[stack.length - 1]
    let attributes = (el.attributes || (el.attributes = []))
    attributes.push(attr)
  }

  // Push an element to the current element's elements array
  function addElement (child: ASTNode) {
    let el = stack[stack.length - 1]; // Typescript needs this semi colon
    (el.elements || (el.elements = [])).push(child)
    stack.push(child)
  }
  
  function endElement () {
    stack.pop()
  }
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
