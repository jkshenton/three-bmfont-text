import assign from 'object-assign'
import * as THREE from 'three'

export default function createBasicShader (opt) {
  opt = opt || {}
  const opacity = typeof opt.opacity === 'number' ? opt.opacity : 1
  const alphaTest = typeof opt.alphaTest === 'number' ? opt.alphaTest : 0.0001
  const precision = opt.precision || 'highp'
  const color = opt.color
  const map = opt.map

  // remove to satisfy r73
  delete opt.map
  delete opt.color
  delete opt.precision
  delete opt.opacity

  return assign({
    uniforms: {
      opacity: { value: opacity },
      map: { value: map || new THREE.Texture() },
      color: { value: new THREE.Color(color) }
    },
    vertexShader: [
      'attribute vec2 uv;',
      'attribute vec4 position;',
      'uniform mat4 projectionMatrix;',
      'uniform mat4 modelViewMatrix;',
      'varying vec2 vUv;',
      'void main() {',
      'vUv = uv;',
      'gl_Position = projectionMatrix * modelViewMatrix * position;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'precision ' + precision + ' float;',
      'uniform float opacity;',
      'uniform vec3 color;',
      'uniform sampler2D map;',
      'varying vec2 vUv;',

      'void main() {',
      '  gl_FragColor = texture2D(map, vUv) * vec4(color, opacity);',
      alphaTest === 0
        ? ''
        : '  if (gl_FragColor.a < ' + alphaTest + ') discard;',
      '}'
    ].join('\n')
  }, opt)
}
