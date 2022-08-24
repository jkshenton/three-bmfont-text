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
const createText = require('../')

require('./load')({
  font: 'fnt/Lato-Regular-64.fnt',
  image: 'fnt/lato.png'
}, start)

function start (font, texture) {
  const app = createOrbitViewer({
    clearColor: 'rgb(80, 80, 80)',
    clearAlpha: 1.0,
    fov: 65,
    position: new THREE.Vector3()
  })

  app.camera = new THREE.OrthographicCamera()
  app.camera.left = 0
  app.camera.top = 0
  app.camera.near = -100
  app.camera.far = 100

  const geom = createText({
    text: 'this bitmap text\nis rendered with \nan OrthographicCamera',
    font,
    align: 'left',
    width: 700,
    flipY: texture.flipY
  })

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    color: 'rgb(230, 230, 230)'
  })

  const layout = geom.layout
  const text = new THREE.Mesh(geom, material)
  const padding = 40
  text.position.set(padding, -layout.descender + layout.height + padding, 0)

  const textAnchor = new THREE.Object3D()
  textAnchor.add(text)
  textAnchor.scale.multiplyScalar(1 / (window.devicePixelRatio || 1))
  app.scene.add(textAnchor)

  // update orthographic
  app.on('tick', function () {
    // update camera
    const width = app.engine.width
    const height = app.engine.height
    app.camera.right = width
    app.camera.bottom = height
    app.camera.updateProjectionMatrix()
  })
}
