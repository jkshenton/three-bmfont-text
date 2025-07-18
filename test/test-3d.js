/*
  This is an example of 3D rendering, using a
  signed distance field shader and standard derivatives
  for improved edge quality and scaling.

  We've also enabled anisotropy on the texture for
  crisp rendering at sharp angles.
 */

const THREE = require('three')
const createText = require('../')
const SDFShader = require('../shaders/sdf')

// load up a 'fnt' and texture
require('./load')({
  font: 'fnt/DejaVu-sdf.fnt',
  image: 'fnt/DejaVu-sdf.png'
}, start)

function start (font, texture) {
  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x282828, 1.0)
  document.body.appendChild(renderer.domElement)

  // Create scene
  const scene = new THREE.Scene()

  // Add some ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  // Create camera
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(0, -4, 8)
  camera.lookAt(0, 0, 0)

  const maxAni = renderer.capabilities.getMaxAnisotropy()

  // setup our texture with some nice mipmapping etc
  texture.needsUpdate = true
  texture.minFilter = THREE.LinearMipMapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = maxAni

  const copy = getCopy()

  // create our text geometry
  const geom = createText({
    text: getCopy(), // the string to render
    font, // the bitmap font definition
    width: 1000 // optional width for word-wrap
  })

  // here we use 'three-bmfont-text/shaders/sdf'
  // to help us build a shader material
  const material = new THREE.RawShaderMaterial(SDFShader({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    color: 'rgb(230, 230, 230)'
  }))

  const layout = geom.layout
  const text = new THREE.Mesh(geom, material)
  
  // Debug: log the geometry info
  console.log('Layout:', layout)
  console.log('Geometry positions:', geom.getAttribute('position').count)
  
  // center it horizontally
  text.position.x = -layout.width / 2
  // origin uses bottom left of last line
  // so we need to move it down a fair bit
  text.position.y = layout.height * 1.035
  text.position.z = 0

  // scale it down so it fits in our 3D units
  const textAnchor = new THREE.Object3D()
  textAnchor.scale.multiplyScalar(0.01)
  textAnchor.rotation.x = Math.PI // Flip 180 degrees to be right-side up
  textAnchor.add(text)
  textAnchor.position.set(0, 0, 0)
  scene.add(textAnchor)

  // Simple mouse controls
  let mouseX = 0
  let mouseY = 0
  let isMouseDown = false
  let cameraDistance = camera.position.length() // Track current zoom distance

  document.addEventListener('mousedown', function () {
    isMouseDown = true
  })

  document.addEventListener('mouseup', function () {
    isMouseDown = false
  })

  document.addEventListener('mousemove', function (event) {
    if (isMouseDown) {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1
    }
  })

  // Add scroll wheel zoom
  document.addEventListener('wheel', function (event) {
    event.preventDefault()
    
    // Zoom factor based on wheel delta
    const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9
    cameraDistance = Math.max(1, Math.min(50, cameraDistance * zoomFactor))
    
    // Scale the camera position to maintain direction but change distance
    camera.position.normalize().multiplyScalar(cameraDistance)
    camera.lookAt(0, 0, 0)
  })

  // Animation loop
  function animate () {
    requestAnimationFrame(animate)

    // Apply mouse rotation (maintain current zoom distance)
    if (isMouseDown) {
      camera.position.x = Math.sin(mouseX * Math.PI) * cameraDistance
      camera.position.z = Math.cos(mouseX * Math.PI) * cameraDistance
      camera.position.y = mouseY * cameraDistance
      camera.lookAt(0, 0, 0)
    }

    // scroll text (adjust direction due to rotation)
    text.position.y -= 0.9

    renderer.render(scene, camera)
  }

  animate()

  // Handle window resize
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
}

function getCopy () {
  return [
    'Total characters: 3,326',
    'Click + drag to rotate',
    '',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam sodales arcu felis, sed molestie ante faucibus a. Integer ligula est, cursus a nisl nec, tempus euismod lorem. Nullam risus felis, fringilla aliquam eros nec, condimentum pretium felis. Praesent rutrum ornare massa, ac rutrum nisl pharetra sit amet. Morbi scelerisque diam quis eleifend lacinia. Sed a porttitor leo. Aenean et vestibulum eros, id condimentum ligula. Quisque maximus, eros et bibendum tristique, enim nulla laoreet mi, molestie imperdiet felis dolor et turpis. Cras sed nunc nec tortor mollis auctor. Aenean cursus blandit metus, in viverra lacus fringilla nec. Nulla a consectetur urna. Sed scelerisque leo in arcu viverra, quis euismod leo maximus. Maecenas ultrices, ligula et malesuada volutpat, sapien nisi placerat ligula, quis dapibus eros diam vitae justo. Sed in elementum ante. Phasellus sed sollicitudin odio. Fusce iaculis tortor ut suscipit aliquam. Curabitur eu nunc id est commodo ornare eu nec arcu. Phasellus et placerat velit, ut tincidunt lorem. Sed at gravida urna. Vivamus id tristique lacus, nec laoreet dolor. Vivamus maximus quam nec consectetur aliquam. Integer condimentum nulla a elit porttitor molestie. Nullam nec dictum lacus. Curabitur rhoncus scelerisque magna ac semper. Curabitur porta est nec cursus tempus. Phasellus hendrerit ac dolor quis pellentesque. Aenean diam nisl, dapibus eget enim vitae, convallis tempor nibh. Proin sit amet ante suscipit, gravida odio ac, euismod neque. Sed sodales, leo eget congue ultricies, leo tellus euismod mauris, tempor finibus elit orci sit amet massa. Pellentesque aliquam magna a neque aliquet, ac dictum tortor dictum.',
    '',
    'Praesent vestibulum ultricies aliquam. Morbi ut ex at nunc ultrices convallis vel et metus. Aliquam venenatis diam ut sodales tristique. Duis et facilisis ipsum. Sed sed ex dictum, mattis urna nec, dictum ex. Donec facilisis tincidunt aliquam. Sed pellentesque ullamcorper tellus nec eleifend. Mauris pulvinar mi diam, et pretium magna molestie eu. In volutpat euismod porta. Etiam a magna non dolor accumsan finibus. Suspendisse potenti. Phasellus blandit nibh vel tortor facilisis auctor.',
    '',
    'Mauris vel iaculis libero. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Etiam et porttitor enim, eget semper ipsum. Vestibulum nec eros massa. Nullam ornare dui eget diam tincidunt tristique. Pellentesque molestie finibus pretium. Quisque in tempor elit. Fusce quis orci ut lacus cursus hendrerit. Curabitur iaculis eros et justo condimentum sodales. In massa sapien, mattis nec nibh id, sagittis semper ex. Nunc cursus sem sit amet leo maximus, vitae molestie lectus cursus.',
    '',
    'Morbi viverra ipsum purus, eu fermentum urna tincidunt at. Maecenas feugiat, est quis feugiat interdum, est ante egestas sem, sed porttitor arcu dui quis nulla. Praesent sed auctor enim. Sed vel dolor et nunc bibendum placerat. Nunc venenatis luctus tortor, ut gravida nunc auctor semper. Suspendisse non orci ut justo iaculis pretium lobortis nec nunc. Donec non libero tellus. Mauris felis mauris, consequat sed tempus ut, tincidunt sit amet nibh. Nam pellentesque lacinia massa, quis rhoncus erat fringilla facilisis. Pellentesque nunc est, lobortis non libero vel, dapibus suscipit dui.'
  ].join('\n')
}
