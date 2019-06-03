const { readFileSync } = require('fs')
const { join } = require('path')
const VTTX = require('../../dist/instance.js').default

describe('simple template rendering', () => {
  it('renders a simple template with list', () => {
    const template = readFileSync(join(__dirname, '../templates/simple.html'), 'utf8')
    const generated = readFileSync(join(__dirname, '../templates/simple-gen.html'), 'utf8')
    
    const i = new VTTX('simple')
    i._render = VTTX.compile(template)
    
    expect(i.render({
      items: [
        { name: 'Justin' },
        { name: 'Darren' },
        { name: 'Pauline' },
        { name: 'The Colonel' }
      ]
    })).toBe(generated)
  })

  it('renders a simple template with conditionals', () => {
    const template = readFileSync(join(__dirname, '../templates/if.html'), 'utf8')
    const generated = readFileSync(join(__dirname, '../templates/if-gen.html'), 'utf8')
    
    const i = new VTTX('simple')
    i._render = VTTX.compile(template)
    
    expect(i.render({
      show: false,
      foo: 'bar'
    })).toBe(generated)
  })
})