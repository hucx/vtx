const { readFileSync } = require('fs')
const { join } = require('path')
const VTTX = require('../../dist/instance.js').default

describe('template rendering with partials', () => {
  it('renders a template with a static partial', () => {
    const template = readFileSync(join(__dirname, '../templates/template-with-partial.html'), 'utf8')
    const partial = readFileSync(join(__dirname, '../templates/partials/styles.html'), 'utf8')
    const generated = readFileSync(join(__dirname, '../templates/template-with-partial-gen.html'), 'utf8')
    
    const i = VTTX.register('simple', template)
    const p = VTTX.register('docStyles', partial)
    
    expect(i.render()).toBe(generated)
  })

  it('renders a template with a partial that has locals', () => {
    const template = readFileSync(join(__dirname, '../templates/documents/invoice.html'), 'utf8')
    const partial = readFileSync(join(__dirname, '../templates/partials/items.html'), 'utf8')
    const generated = readFileSync(join(__dirname, '../templates/documents/invoice-gen.html'), 'utf8')
    
    const i = VTTX.register('invoice', template)
    VTTX.register('lineItems', partial)
    
    expect(i.render({
      items: [
        { name: 'Book', price: 10.23 },
        { name: 'Pencil', price: 1.45 }
      ]
    })).toBe(generated)
  })
})