/*
  This is an example of 2D rendering, simply
  using bitmap fonts in orthographic space.

  var geom = createText({
    multipage: true,
    ... other options
  })
 */

import * as THREE from 'three'
import createText from '../index.js'

import loadFont from './load.js'

loadFont({
  font: 'fnt/Lato-Regular-64.fnt',
  image: 'fnt/lato.png'
}, start)

function start (font, texture) {
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
