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
  const result: ASTNode = { type: 'root', elements: [] }
  let state = 'OUTSIDE'
  let stack = []
  let tagName = undefined
  let attrName = ''
  let attrValue = ''
  let charData = ''
  let raw: string
  let index = 0
  let charDataRE = dotRE

  // State machine for parsing an XML document.  This is pretty loose
  const states = {
    OUTSIDE (char: string) {
      if (char === '<') {
        state = 'TAG_BEGIN'
      } else if (whiteSpaceRE.test(char)) {
        state = 'OUTSIDE'
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
        if (source.substring[index + 3] === '!--') {
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
        stack.push({
          type: 'element',
          name: tagName
        })
        state = 'INSIDE_ELEMENT'
      } else if (whiteSpaceRE.test(char)) {
        stack.push({
          type: 'element',
          name: tagName
        })
        state = 'INSIDE_START_TAG'
      } else if (char === '/') {
        if (source[index + 1] === '>') {
          stack.push({
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
        }
      } else if (char === '>') {
        state = 'INSIDE_ELEMENT'
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
        state = 'INSIDE_ELEMENT'
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
    INSIDE_ELEMENT (char: string) {
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
      }
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
        state = 'OUTSIDE'
      }
    }
  }
  
  while (source[index]) {
    states[state](source[index])
    index++
  }
  
  if (state !== 'OUTSIDE') throw new Error ('unexpected EOF')

  return result
  
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
    if (stack.length === 0) {
      result.elements.push(child)
    } else {
      let el = stack[stack.length - 1]
      let elements = (el.elements || (el.elements = []))

      elements.push(child)
    }
  }
  
  function endElement () {
    let el = stack.pop()
    if (stack.length > 0) {
      addElement(el)
      state = 'INSIDE_ELEMENT'
    } else {
      result.elements.push(el)
      state = 'OUTSIDE'
    }
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
