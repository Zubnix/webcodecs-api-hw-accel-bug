import SimpleSurfaceShader from './SimpleSurfaceShader'
import Texture from './Texture'

let videoDecoder = null
const config = {
  codec: 'avc1.42001e', // h264 Baseline Level 3
  optimizeForLatency: true,
  hardwareAcceleration: 'prefer-hardware'
}

let canvas = null
/**
 * @type {SimpleSurfaceShader}
 */
let simpleSurfaceShader = null
let rgbaTexture = null

/**
 * @type {Array<Uint8Array>}
 */
const h264samples = []

let nroFrames = 0
let start = 0

function isKeyFrame(accessUnit) {
  const dataView = new DataView(accessUnit.buffer, accessUnit.byteOffset, accessUnit.length)
  const maxOffset = accessUnit.byteLength - Uint32Array.BYTES_PER_ELEMENT
  let sps = false
  let pps = false
  let idr = false
  for (let i = 0; i < maxOffset; i++) {
    const nalHeaderCandidate = dataView.getUint32(i)
    if (nalHeaderCandidate <= 0x000001ff && nalHeaderCandidate > 0x00000100) {
      const nalType = nalHeaderCandidate & 0x1f
      if (nalType === 7) {
        // Sequence parameter set
        sps = true
      } else if (nalType === 8) {
        // Picture parameter set
        pps = true
      } else if (nalType === 5) {
        // Coded slice of an IDR picture
        idr = true
      }
      if (pps && sps && idr) {
        return true
      }
    }
  }
  return false
}

/**
 * @param {Uint8Array} h264Nal
 */
function decode (h264Nal) {
  videoDecoder.decode(
      new EncodedVideoChunk({
        timestamp: 0,
        type: isKeyFrame(h264Nal) ? 'key' : 'delta',
        data: h264Nal,
      }),
  )
}

/**
 * @param {VideoFrame}videoFrame
 */
function onPicture (videoFrame) {
  decodeNext()

  canvas.width = videoFrame.displayWidth
  canvas.height = videoFrame.displayHeight

  // we upload the entire image, including stride padding & filler rows. The actual visible image will be mapped
  // from texture coordinates as to crop out stride padding & filler rows using maxXTexCoord and maxYTexCoord.

  rgbaTexture.image2dBuffer(videoFrame)
  // videoFrame.close()
  simpleSurfaceShader.setTexture(rgbaTexture)
  simpleSurfaceShader.updateShaderData({ w: canvas.width, h: canvas.height })
  simpleSurfaceShader.draw()
}

function decodeNext () {
  const nextFrame = h264samples.shift()
  if (nextFrame != null) {
    decode(nextFrame)
  } else {
    const fps = (1000 / (Date.now() - start)) * nroFrames
    window.alert(`Decoded ${nroFrames} (3440x1216) frames in ${Date.now() - start}ms @ ${fps >> 0}FPS`)
  }
}

function initWebGLCanvas () {
  canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl')
  simpleSurfaceShader = SimpleSurfaceShader.create(gl)
  rgbaTexture = Texture.create(gl, gl.RGBA)

  document.body.append(canvas)
}

/**
 * @param {DOMException}error
 */
function onError(error) {
  console.error(`Error from WebCodec decoder. Name: ${error.name}, Message: ${error.message}, code: ${error.code}`)
}

function main () {
  initWebGLCanvas()
  VideoDecoder.isConfigSupported(config).then(({supported}) => {
    if(!supported) {
      console.log('not supported')
      return
    }
    videoDecoder = new VideoDecoder({
      output: onPicture,
      error: onError
    })
    videoDecoder.configure(config)
  }).then(() => {
    const fetches = []
    for (let i = 0; i < 60; i++) {
      fetches.push(fetch(`h264samples/${i}`).then(response => {
        return response.arrayBuffer().then(function (buffer) {
          h264samples[i] = new Uint8Array(buffer)
        })
      }))
    }

    return Promise.all(fetches)
  }).then(() => {
    nroFrames = h264samples.length
    start = Date.now()
    decodeNext()
  })
}

main()
