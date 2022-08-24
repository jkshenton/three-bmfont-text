/*
  This is an example of 2D rendering, simply
  using bitmap fonts in orthographic space.

  var geom = createText({
    multipage: true,
    ... other options
  })
 */

const THREE = require('three')
const createOrbitViewer = require('three-orbit-viewer')(THREE)
const shuffle = require('array-shuffle')
const quotes = shuffle(require('sun-tzu-quotes/quotes.json').join(' ').split('.'))
const createText = require('../')
const MSDFShader = require('../shaders/msdf')
const palettes = require('nice-color-palettes')
const palette = palettes[5]
const background = palette.shift()

require('./load')({
  font: 'fnt/Roboto-msdf.json',
  image: 'fnt/Roboto-msdf.png'
}, start)

function start (font, texture) {
  const app = createOrbitViewer({
    clearColor: background,
    clearAlpha: 1.0,
    fov: 65,
    position: new THREE.Vector3()
  })

  app.camera = new THREE.OrthographicCamera()
  app.camera.left = 0
  app.camera.top = 0
  app.camera.near = -1
  app.camera.far = 1000

  const container = new THREE.Object3D()
  app.scene.add(container)
  const count = 25
  for (let i = 0; i < count; i++) {
    createGlyph()
  }

  let time = 0
  // update orthographic
  app.on('tick', function (dt) {
    time += dt / 1000
    const s = (Math.sin(time * 0.5) * 0.5 + 0.5) * 2.0 + 0.5
    container.scale.set(s, s, s)
    // update camera
    const width = app.engine.width
    const height = app.engine.height
    app.camera.left = -width / 2
    app.camera.right = width / 2
    app.camera.top = -height / 2
    app.camera.bottom = height / 2
    app.camera.updateProjectionMatrix()
  })

  function createGlyph () {
    const angle = (Math.random() * 2 - 1) * Math.PI
    const geom = createText({
      text: quotes[Math.floor(Math.random() * quotes.length)].split(/\s+/g).slice(0, 6).join(' '),
      font,
      align: 'left',
      flipY: texture.flipY
    })

    const material = new THREE.RawShaderMaterial(MSDFShader({
      map: texture,
      transparent: true,
      color: palette[Math.floor(Math.random() * palette.length)]
    }))

    const layout = geom.layout
    const text = new THREE.Mesh(geom, material)
    text.position.set(0, -layout.descender + layout.height, 0)
    text.scale.multiplyScalar(Math.random() * 0.5 + 0.5)

    const textAnchor = new THREE.Object3D()
    textAnchor.add(text)
    textAnchor.rotation.z = angle
    container.add(textAnchor)
  }
}
