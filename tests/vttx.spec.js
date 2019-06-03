const VTTX = require('../dist/instance').default
const { readFileSync } = require('fs')
const { join } = require('path')

describe('VTTX', () => {
  it('register template that has lots of text and single and double quotes', () => {
    const i = VTTX.register('styles', readFileSync(join(__dirname, './templates/partials/styles-2.html'), 'utf8'))
    expect(() => {
      i.render()
    }).not.toThrow()
  })
})