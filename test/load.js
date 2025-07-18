import loadFont from 'load-bmfont'
import * as THREE from 'three'

// A utility to load a font, then a texture
export default function (opt, cb) {
  loadFont(opt.font, function (err, font) {
    if (err) throw err
    const loader = new THREE.TextureLoader()
    loader.load(opt.image, function (tex) {
      cb(font, tex)
    })
  })
}
