/*
  This is an example of 2D rendering, using
  multiple texture pages. The glyphs are batched
  into a single BufferGeometry, and an attribute
  is used to provide the page ID to each glyph.

  The max number of pages is device dependent, based
  on how many samplers can be active at once. Typically
  for WebGL / mobile, this number is at least 8.

  var geom = createText({
    multipage: true,
    ... other options
  })
 */

const THREE = require('three')
const createText = require('../')
const Promise = require('bluebird')
const Shader = require('../shaders/multipage')
const loadFont = Promise.promisify(require('load-bmfont'))

// parallel load our font / textures
Promise.all([
  loadFont('fnt/Norwester-Multi-64.fnt'),
  loadTexture('fnt/Norwester-Multi_0.png'),
  loadTexture('fnt/Norwester-Multi_1.png'),
  loadTexture('fnt/Norwester-Multi_2.png'),
  loadTexture('fnt/Norwester-Multi_3.png')
]).then(function (assets) {
  start(assets[0], assets.slice(1))
})

function start (font, textures) {
  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x505050, 1.0)
  document.body.appendChild(renderer.domElement)

  // Create scene
  const scene = new THREE.Scene()

  // Create camera
  const camera = new THREE.OrthographicCamera()
  camera.left = 0
  camera.top = 0
  camera.near = -100
  camera.far = 100

  const geom = createText({
    multipage: true, // enable page buffers !
    font,
    width: 700,
    align: 'left'
  })

  // setup text
  geom.update([
    'This is a multi-page bitmap',
    'font batched into a single',
    'ThreeJS BufferGeometry'
  ].join(' '))

  const material = new THREE.RawShaderMaterial(Shader({
    textures,
    transparent: true,
    opacity: 0.95,
    color: 'rgb(230, 230, 230)'
  }))

  const layout = geom.layout
  const text = new THREE.Mesh(geom, material)
  const padding = 40
  text.position.set(padding, -layout.descender + layout.height + padding, 0)

  const textAnchor = new THREE.Object3D()
  textAnchor.add(text)
  textAnchor.scale.multiplyScalar(1 / (window.devicePixelRatio || 1))
  scene.add(textAnchor)

  // Animation loop
  function animate () {
    requestAnimationFrame(animate)

    // update camera
    const width = window.innerWidth
    const height = window.innerHeight
    camera.right = width
    camera.bottom = height
    camera.updateProjectionMatrix()

    renderer.setSize(width, height)
    renderer.render(scene, camera)
  }

  animate()

  // Handle window resize
  window.addEventListener('resize', function () {
    const width = window.innerWidth
    const height = window.innerHeight
    camera.right = width
    camera.bottom = height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  })
}

function loadTexture (path) {
  return new Promise(function (resolve, reject) {
    const loader = new THREE.TextureLoader()
    loader.load(path, resolve, reject)
  })
}
