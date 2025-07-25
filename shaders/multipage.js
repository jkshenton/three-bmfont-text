import assign from 'object-assign'
import * as THREE from 'three'

export default function createMultipageShader (opt) {
  opt = opt || {}
  const opacity = typeof opt.opacity === 'number' ? opt.opacity : 1
  const precision = opt.precision || 'highp'
  const alphaTest = typeof opt.alphaTest === 'number' ? opt.alphaTest : 0.0001

  let textures = opt.textures || []
  textures = Array.isArray(textures) ? textures : [textures]

  const baseUniforms = {}
  textures.forEach(function (tex, i) {
    baseUniforms['texture' + i] = {
      value: tex
    }
  })

  const samplers = textures.map(function (tex, i) {
    return 'uniform sampler2D texture' + i + ';'
  }).join('\n')

  const body = textures.map(function (tex, i) {
    const cond = i === 0 ? 'if' : 'else if'
    return [
      cond + ' (vPage == ' + i + '.0) {',
      'sampleColor = texture2D(texture' + i + ', vUv);',
      '}'
    ].join('\n')
  }).join('\n')

  const color = opt.color

  // remove to satisfy r73
  delete opt.textures
  delete opt.color
  delete opt.precision
  delete opt.opacity

  let attributes = {
    attributes: { page: { type: 'f', value: 0 } }
  }

  const threeVers = (parseInt(THREE.REVISION, 10) || 0) | 0
  if (threeVers >= 72) {
    attributes = undefined
  }

  return assign({
    uniforms: assign({}, baseUniforms, {
      opacity: { value: opacity },
      color: { value: new THREE.Color(color) }
    }),
    vertexShader: [
      'attribute vec4 position;',
      'attribute vec2 uv;',
      'attribute float page;',
      'uniform mat4 projectionMatrix;',
      'uniform mat4 modelViewMatrix;',
      'varying vec2 vUv;',
      'varying float vPage;',
      'void main() {',
      'vUv = uv;',
      'vPage = page;',
      'gl_Position = projectionMatrix * modelViewMatrix * position;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'precision ' + precision + ' float;',
      'uniform float opacity;',
      'uniform vec3 color;',
      samplers,
      'varying float vPage;',
      'varying vec2 vUv;',
      'void main() {',
      'vec4 sampleColor = vec4(0.0);',
      body,
      'gl_FragColor = sampleColor * vec4(color, opacity);',
      alphaTest === 0
        ? ''
        : '  if (gl_FragColor.a < ' + alphaTest + ') discard;',
      '}'
    ].join('\n')
  }, attributes, opt)
}
