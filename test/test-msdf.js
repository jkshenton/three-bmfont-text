/*
  This is an example of 2D rendering, simply
  using bitmap fonts in orthographic space.

  var geom = createText({
    multipage: true,
    ... other options
  })
 */

const THREE = require('three')
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
  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(background, 1.0)
  document.body.appendChild(renderer.domElement)

  // Create scene
  const scene = new THREE.Scene()

  // Create camera
  const camera = new THREE.OrthographicCamera()
  camera.left = 0
  camera.top = 0
  camera.near = -1
  camera.far = 1000

  const container = new THREE.Object3D()
  scene.add(container)
  const count = 25
  for (let i = 0; i < count; i++) {
    createGlyph()
  }

  let time = 0
  // Animation loop
  function animate () {
    requestAnimationFrame(animate)

    time += 0.016 // approximate delta time
    const s = (Math.sin(time * 0.5) * 0.5 + 0.5) * 2.0 + 0.5
    container.scale.set(s, s, s)

    // update camera
    const width = window.innerWidth
    const height = window.innerHeight
    camera.left = -width / 2
    camera.right = width / 2
    camera.top = -height / 2
    camera.bottom = height / 2
    camera.updateProjectionMatrix()

    renderer.setSize(width, height)
    renderer.render(scene, camera)
  }

  animate()

  // Handle window resize
  window.addEventListener('resize', function () {
    const width = window.innerWidth
    const height = window.innerHeight
    camera.left = -width / 2
    camera.right = width / 2
    camera.top = -height / 2
    camera.bottom = height / 2
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
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
