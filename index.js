import createLayout from 'layout-bmfont-text'
import createIndices from 'quad-indices'
import * as THREE from 'three'

import * as vertices from './lib/vertices.js'
import * as utils from './lib/utils.js'

// const Base = THREE.BufferGeometry

export default function createTextGeometry (opt) {
  return new TextGeometry(opt)
}

class TextGeometry extends THREE.BufferGeometry {
  constructor (opt) {
    super()

    if (typeof opt === 'string') {
      opt = { text: opt }
    }

    // use these as default values for any subsequent
    // calls to update()
    this._opt = Object.assign({}, opt)

    // also do an initial setup...
    if (opt) this.update(opt)
  }

  update (opt) {
    if (typeof opt === 'string') {
      opt = { text: opt }
    }

    // use constructor defaults
    opt = Object.assign({}, this._opt, opt)

    if (!opt.font) {
      throw new TypeError('must specify a { font } in options')
    }

    this.layout = createLayout(opt)

    // get vec2 texcoords
    const flipY = opt.flipY !== false

    // the desired BMFont data
    const font = opt.font

    // determine texture size from font file
    const texWidth = font.common.scaleW
    const texHeight = font.common.scaleH

    // get visible glyphs
    const glyphs = this.layout.glyphs.filter(function (glyph) {
      const bitmap = glyph.data
      return bitmap.width * bitmap.height > 0
    })

    // provide visible glyphs for convenience
    this.visibleGlyphs = glyphs

    // get common vertex data
    const positions = vertices.positions(glyphs)
    const uvs = vertices.uvs(glyphs, texWidth, texHeight, flipY)
    const indices = createIndices([], {
      clockwise: true,
      type: 'uint16',
      count: glyphs.length
    })

    // update vertex data
    this.setIndex(indices)
    this.setAttribute('position', new THREE.BufferAttribute(positions, 2))
    this.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))

    // update multipage data
    if (!opt.multipage && 'page' in this.attributes) {
      // disable multipage rendering
      this.removeAttribute('page')
    } else if (opt.multipage) {
      // enable multipage rendering
      const pages = vertices.pages(glyphs)
      this.setAttribute('page', new THREE.BufferAttribute(pages, 1))
    }
  }

  computeBoundingSphere () {
    if (this.boundingSphere === null) {
      this.boundingSphere = new THREE.Sphere()
    }

    const positions = this.attributes.position.array
    const itemSize = this.attributes.position.itemSize
    if (!positions || !itemSize || positions.length < 2) {
      this.boundingSphere.radius = 0
      this.boundingSphere.center.set(0, 0, 0)
      return
    }
    utils.computeSphere(positions, this.boundingSphere)
    if (isNaN(this.boundingSphere.radius)) {
      console.error('THREE.BufferGeometry.computeBoundingSphere(): ' +
        'Computed radius is NaN. The ' +
        '"position" attribute is likely to have NaN values.')
    }
  }

  computeBoundingBox () {
    if (this.boundingBox === null) {
      this.boundingBox = new THREE.Box3()
    }

    const bbox = this.boundingBox
    const positions = this.attributes.position.array
    const itemSize = this.attributes.position.itemSize
    if (!positions || !itemSize || positions.length < 2) {
      bbox.makeEmpty()
      return
    }
    utils.computeBox(positions, bbox)
  }
}
//
// function TextGeometry (opt) {
//   Base.call(this)
//
//   if (typeof opt === 'string') {
//     opt = { text: opt }
//   }
//
//   // use these as default values for any subsequent
//   // calls to update()
//   this._opt = Object.assign({}, opt)
//
//   // also do an initial setup...
//   if (opt) this.update(opt)
// }
//
// inherits(TextGeometry, Base)
//
// TextGeometry.prototype.update = function (opt) {
//   if (typeof opt === 'string') {
//     opt = { text: opt }
//   }
//
//   // use constructor defaults
//   opt = Object.assign({}, this._opt, opt)
//
//   if (!opt.font) {
//     throw new TypeError('must specify a { font } in options')
//   }
//
//   this.layout = createLayout(opt)
//
//   // get vec2 texcoords
//   var flipY = opt.flipY !== false
//
//   // the desired BMFont data
//   var font = opt.font
//
//   // determine texture size from font file
//   var texWidth = font.common.scaleW
//   var texHeight = font.common.scaleH
//
//   // get visible glyphs
//   var glyphs = this.layout.glyphs.filter(function (glyph) {
//     var bitmap = glyph.data
//     return bitmap.width * bitmap.height > 0
//   })
//
//   // provide visible glyphs for convenience
//   this.visibleGlyphs = glyphs
//
//   // get common vertex data
//   var positions = vertices.positions(glyphs)
//   var uvs = vertices.uvs(glyphs, texWidth, texHeight, flipY)
//   var indices = createIndices([], {
//     clockwise: true,
//     type: 'uint16',
//     count: glyphs.length
//   })
//
//   // update vertex data
//   this.setIndex(indices)
//   this.setAttribute('position', new THREE.BufferAttribute(positions, 2))
//   this.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
//
//   // update multipage data
//   if (!opt.multipage && 'page' in this.attributes) {
//     // disable multipage rendering
//     this.removeAttribute('page')
//   } else if (opt.multipage) {
//     // enable multipage rendering
//     var pages = vertices.pages(glyphs)
//     this.setAttribute('page', new THREE.BufferAttribute(pages, 1))
//   }
// }
//
// TextGeometry.prototype.computeBoundingSphere = function () {
//   if (this.boundingSphere === null) {
//     this.boundingSphere = new THREE.Sphere()
//   }
//
//   var positions = this.attributes.position.array
//   var itemSize = this.attributes.position.itemSize
//   if (!positions || !itemSize || positions.length < 2) {
//     this.boundingSphere.radius = 0
//     this.boundingSphere.center.set(0, 0, 0)
//     return
//   }
//   utils.computeSphere(positions, this.boundingSphere)
//   if (isNaN(this.boundingSphere.radius)) {
//     console.error('THREE.BufferGeometry.computeBoundingSphere(): ' +
//       'Computed radius is NaN. The ' +
//       '"position" attribute is likely to have NaN values.')
//   }
// }
//
// TextGeometry.prototype.computeBoundingBox = function () {
//   if (this.boundingBox === null) {
//     this.boundingBox = new THREE.Box3()
//   }
//
//   var bbox = this.boundingBox
//   var positions = this.attributes.position.array
//   var itemSize = this.attributes.position.itemSize
//   if (!positions || !itemSize || positions.length < 2) {
//     bbox.makeEmpty()
//     return
//   }
//   utils.computeBox(positions, bbox)
// }
