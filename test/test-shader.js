/*
  This is an example of 3D rendering with
  a custom shader, special per-line shader effects,
  and glslify.
 */

const THREE = require('three')
// globalThis.THREE = THREE

const quote = require('sun-tzu-quotes')
const createText = require('../')
const glslify = require('glslify')
const path = require('path')

require('./load')({
  font: 'fnt/DejaVu-sdf.fnt',
  image: 'fnt/DejaVu-sdf.png'
}, start)

function start (font, texture) {
  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0xdcdcdc, 1.0)
  document.body.appendChild(renderer.domElement)

  // Create scene
  const scene = new THREE.Scene()

  // Create camera
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(1, 1, -2)

  const geom = createText({
    font,
    align: 'center',
    width: 500,
    flipY: texture.flipY
  })

  // geom.setAttribute('line', new Float32Array(lineData));

  const material = new THREE.RawShaderMaterial({
    vertexShader: glslify(path.join(__dirname, '/shaders/fx.vert')),
    fragmentShader: glslify(path.join(__dirname, '/shaders/fx.frag')),
    uniforms: {
      animate: { value: 1 },
      iGlobalTime: { value: 0 },
      map: { value: texture },
      color: { value: new THREE.Color('#000') }
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: false
  })

  const text = new THREE.Mesh(geom, material)

  // scale it down so it fits in our 3D units
  const textAnchor = new THREE.Object3D()
  textAnchor.scale.multiplyScalar(-0.005)
  textAnchor.add(text)
  scene.add(textAnchor)

  const duration = 3
  next()

  let time = 0

  // Animation loop
  function animate () {
    requestAnimationFrame(animate)

    time += 0.016 // approximate delta time
    material.uniforms.iGlobalTime.value = time
    material.uniforms.animate.value = time / duration
    if (time > duration) {
      time = 0
      next()
    }

    renderer.render(scene, camera)
  }

  animate()

  // Handle window resize
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  function next () {
    // set new text string
    geom.update(quote())

    const lines = geom.visibleGlyphs.map(function (glyph) {
      return glyph.line
    })

    const lineCount = lines.reduce(function (a, b) {
      return Math.max(a, b)
    }, 0)

    // for each quad, let's give it a vertex attribute
    // with the line index
    const lineData = lines.map(function (line) {
      // map to 0..1 for attribute
      const t = lineCount <= 1 ? 1 : (line / (lineCount - 1))
      // quad - 4 verts
      return [t, t, t, t]
    }).reduce(function (a, b) {
      return a.concat(b)
    }, [])

    // update the "line" vertex attribute
    geom.setAttribute('line', new THREE.BufferAttribute(new Float32Array(lineData), 1))

    // center the text
    const layout = geom.layout
    text.position.x = -layout.width / 2
    text.position.y = layout.height / 2
  }
}
