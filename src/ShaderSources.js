/**
 * @type {{type: string, source: string}}
 */
export const vertexQuad = {
  type: 'x-shader/x-vertex',
  source: `
  precision mediump float;

  uniform mat4 u_projection;
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main(){
      v_texCoord = a_texCoord;
      gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
  }
`
}

/**
 * @type {{type: string, source: string}}
 */
export const fragmentYUV = {
  type: 'x-shader/x-fragment',
  source: `
  precision lowp float;
  
  varying vec2 v_texCoord;
  
  uniform sampler2D texture;

  void main(void) {
    gl_FragColor = texture2D(texture, v_texCoord);
  }
`
}
