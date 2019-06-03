const { parseDocument, parseText } = require('../dist/parse.js')
const expectedAST = require('./ast.json')

function assertParse (template, expectedAST) {
  expect(parseDocument(template)).toEqual(expectedAST)
}

function assertThrow (template) {
  expect(() => {
    parse(template)
  }).toThrow()
}

describe('xml parse', () => {
  it('parses', () => {
    assertParse(
      '<a></a>',
      expectedAST.singleEmptyTag
    )
  })

  it('parses a single empty tag', () => {
    assertParse(
      '<a/>',
      expectedAST.singleEmptyTag
    )
  })

  it('parses a single empty tag with white space', () => {
    assertParse(
      '<a           />',
      expectedAST.singleEmptyTag
    )
  })

  it('parses a single empty tag with attributes', () => {
    assertParse(
      '<a v-custom class="foo" />',
      expectedAST.singleEmptyTagWithAttrs
    )
  })

  it('parses a tag with child elements', () => {
    assertParse(
      '<a v-custom class="foo"><b /><c v-else></c></a>',
      expectedAST.tagWithChildElements
    )
  })

  it('throws', () => {
    assertThrow(
      '<a/></a>'
    )
  })

  it('parses with doctype', () => {
    assertParse(
      '<!DOCTYPE crumpets><a></a>',
      expectedAST.doctype
    )
  })
})

describe('text parse', () => {
  it('parses text', () => {
    expect(parseText('Hi, my name is Warren')).toBe(undefined)
  })

  it('parses text with interpolation', () => {
    expect(parseText('Hi, my name is {{ name }}').expression).toBe('"Hi, my name is "+(name)')
  })

  it('parses interpolation only', () => {
    expect(parseText('{{ name }}').expression).toBe('(name)')
  })
})
