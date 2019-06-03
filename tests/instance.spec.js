const VTTX = require('../dist/instance').default

const instance = new VTTX()

describe('VTX', () => {
  describe('calls render functions', () => {
    it('createElement', () => {
      instance._render = function ({ _c, _l, _t }, local) {return _c('div')}
      expect(instance.render()).toBe('<div></div>')
    })

    it('createElement with children', () => {
      instance._render = function ({ _c, _l, _t }, local) {return _c('div',[_c('a')])}
      expect(instance.render()).toBe('<div><a></a></div>')
    })
  })
})