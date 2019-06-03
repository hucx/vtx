module.exports = {
  singleEmptyTag: {
    elements: [
      { type: 'element', name: 'a' }
    ] 
  },

  doctypeAndEmptyTag: {
    elements: [
      { type: 'doctype', value: 'crumpets'},
      { type: 'element', name: 'a' }
    ] 
  },

  multipleRootsWithChildren: {
    elements: [
      { type: 'doctype', value: 'crumpets'},
      {
        type: 'element',
        name: 'div',
        elements: [
          { type: 'element', name: 'a' },
          { type: 'element', name: 'b' }
        ]
      }
    ] 
  }
}