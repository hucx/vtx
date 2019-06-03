const { createElement, renderList, renderPartial, templateMap } = require('../dist/render')
const VTTX = require('../dist/instance').default

describe('render functions', () => {
  describe('createElement', () => {
    it('renders a doctype tag', () => {
      expect(createElement('doctype', {value:'html'})).toBe('<!DOCTYPE html>')
    })

    it('renders simple tag', () => {
      expect(createElement('div')).toBe('<div></div>')
    })

    it('renders tag with children', () => {
      expect(createElement('div', ['some text', '<a></a>'])).toBe('<div>some text<a></a></div>')
    })

    it('renders tag with attrs', () => {
      expect(createElement('div', { attrs: [{ name: 'class', value: 'foo' }]})).toBe('<div class="foo"></div>')
    })

    it('renders tag with attrs and children', () => {
      expect(createElement(
        'div',
        { attrs: [{ name: 'class', value: 'foo' }]},
        ['some text', '<a></a>']
      )).toBe('<div class="foo">some text<a></a></div>')
    })
  })

  describe('renderPartial', () => {
    it('renders a partial', () => {
      VTTX.register('partial', '<b></b>')
      expect(createElement('partial')).toBe('<b></b>')
    })

    it('renders a partial with data', () => {
      VTTX.register('partial', '<b>{{ foo }}</b>')
      expect(createElement('partial', { bind: { foo: 'bar' }})).toBe('<b>bar</b>')
    })
  })
  
  describe('template map', () => {
    it('should return value regardless of case', () => {
      templateMap['fooChoo'] = 'barChoo'
      templateMap['fooChooChooCha'] = 'barChooChooCha'
      expect(templateMap['foo-choo']).toBe('barChoo')
      expect(templateMap['foo-choo-choo-cha']).toBe('barChooChooCha')
    })
  })
})