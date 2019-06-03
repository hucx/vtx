const { process } = require('../dist/process.js')
const rawAST = {
  elements: [
    {
      type: 'element',
      name: 'a',
      attributes: [
        { name: 'v-for', value: 'item in items' }
      ]
    },
    {
      type: 'element',
      name: 'a',
      attributes: [
        { name: 'v-for', value: 'item in items' },
        { name: 'v-bind', value: 'treasure' },
        { name: 'class', value: 'foo' }
      ]
    },
    {
      type: 'element',
      name: 'a',
      attributes: [
        { name: 'v-if', value: 'show === 1' }
      ]
    },
    {
      type: 'element',
      name: 'b',
      attributes: [
        { name: 'v-else-if', value: 'show === 2' }
      ]
    },
    {
      type: 'element',
      name: 'c',
      attributes: [
        { name: 'v-else', value: null }
      ]
    }
  ]
}

const processedAST = {
  elements: [
    {
      type: 'element',
      name: 'a',
      attributes: [],
      directives: {
        for: {
          exp: 'item in items',
          processed: false
        }
      }
    },
    {
      type: 'element',
      name: 'a',
      attributes: [
        { name: 'class', value: 'foo' }
      ],
      directives: {
        for: {
          exp: 'item in items',
          processed: false
        },
        bind: {
          exp: 'treasure',
          processed: false
        }
      }
    },
    {
      type: 'element',
      name: 'a',
      attributes: [],
      directives: {
        if: {
          exp: 'show === 1',
          processed: false,
          else: {
            type: 'element',
            name: 'b',
            attributes: [],
            directives: {
              elseIf: {
                exp: 'show === 2',
                processed: false,
                else: {
                  type: 'element',
                  name: 'c',
                  attributes: [],
                  directives: {
                    else: {
                      exp: null,
                      processed: false
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  ]
}

describe('AST processing', () => {
  it('processes raw AST', () => {
    process(rawAST)
    expect(rawAST).toEqual(processedAST)
  })
})