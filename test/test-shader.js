/*
  This is an example of 3D rendering with
  a custom shader, special per-line shader effects,
  and glslify.
 */

import * as THREE from 'three'
// globalThis.THREE = THREE

import quote from 'sun-tzu-quotes'
import createText from '../index.js'
import loadFont from './load.js'

loadFont({
  font: 'fnt/DejaVu-sdf.fnt',
  image: 'fnt/DejaVu-sdf.png'
}, start)

function start (font, texture) {
  console.log('Starting shader test...')
  console.log('Font:', font)
  console.log('Texture:', texture)
  
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
  camera.lookAt(0, 0, 0)

  console.log('Camera position:', camera.position)
  console.log('Camera looking at:', { x: 0, y: 0, z: 0 })

  const geom = createText({
    font,
    align: 'center',
    width: 500,
    flipY: texture.flipY
  })

  console.log('Geometry created:', geom)

  // Initialize line attribute with default values
  const vertexCount = geom.getAttribute('position').count
  const lineData = new Array(vertexCount).fill(0)
  geom.setAttribute('line', new THREE.BufferAttribute(new Float32Array(lineData), 1))

  // Use inline shaders with the required glsl functions included
  // This bypasses the need for glslify to process the shaders
  
  const vertexShader = `
    attribute vec4 position;
    attribute vec2 uv;
    attribute float line;
    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;
    varying vec2 vUv;
    varying float vLine;

    void main() {
      vLine = line;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * position;
    }
  `;

  // Fragment shader with manually included noise and aastep implementations
  const fragmentShader = `
    precision highp float;

    uniform float opacity;
    uniform vec3 color;
    uniform sampler2D map;
    uniform float iGlobalTime;
    uniform float animate;
    varying vec2 vUv;
    varying float vLine;
    
    // Simplex 3D Noise implementation
    // Source: https://github.com/ashima/webgl-noise
    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec4 mod289(vec4 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec4 permute(vec4 x) {
      return mod289(((x*34.0)+1.0)*x);
    }
    
    vec4 taylorInvSqrt(vec4 r) {
      return 1.79284291400159 - 0.85373472095314 * r;
    }
    
    float noise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      
      // First corner
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;
      
      // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      
      // Permutations
      i = mod289(i);
      vec4 p = permute( permute( permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
              
      // Gradients
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      
      // Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      
      // Mix final noise value
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }
    
    // Anti-aliased step function
    float aastep(float threshold, float value) {
      #ifdef GL_OES_standard_derivatives
        float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
        return smoothstep(threshold-afwidth, threshold+afwidth, value);
      #else
        return step(threshold, value);
      #endif
    }

    void main() {
      vec4 texColor = texture2D(map, vUv);
      float sdf = texColor.a;
      
      float alpha = 0.0;
      float animValue = pow(abs(animate * 2.0 - 1.0), 12.0 - vLine * 5.0);
      float threshold = animValue * 0.5 + 0.5;
      alpha += 0.15 * aastep(threshold, sdf + 0.4 * noise(vec3(vUv * 10.0, iGlobalTime)));
      alpha += 0.35 * aastep(threshold, sdf + 0.1 * noise(vec3(vUv * 50.0, iGlobalTime)));
      alpha += 0.15 * aastep(threshold, sdf);

      gl_FragColor = vec4(color, alpha);
    }
  `;
  
  createScene(vertexShader, fragmentShader);

  function createScene(vertexShader, fragmentShader) {
    const material = new THREE.RawShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
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

  console.log('Material created:', material)
  console.log('Vertex shader:', material.vertexShader)
  console.log('Fragment shader:', material.fragmentShader)

  const text = new THREE.Mesh(geom, material)

  // scale it down so it fits in our 3D units
  const textAnchor = new THREE.Object3D()
  textAnchor.scale.multiplyScalar(-0.005)
  textAnchor.add(text)
  scene.add(textAnchor)

  console.log('Text mesh created:', text)
  console.log('Text anchor scale:', textAnchor.scale)
  console.log('Scene children:', scene.children)

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
  } // End of createScene function
}
