import { describeWebGLProgram } from '../../util/webgl-program';

const VERTEX_SHADER_SRC = `#version 300 es
  layout(location = 0) in vec2 a_position;
  layout(location = 1) in vec2 a_texCoord;

  out vec2 v_texCoord;
  
  void main() {
    v_texCoord = a_texCoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SRC = `#version 300 es
  precision highp float;
  in vec2 v_texCoord;
  out vec4 outColor;
  
  uniform sampler2D u_texture;
  
  void main() {
    outColor = texture(u_texture, v_texCoord);
  }
`;

export const shaderUnlitTexture = describeWebGLProgram({
	vertexShaderSource: VERTEX_SHADER_SRC,
	fragmentShaderSource: FRAGMENT_SHADER_SRC,
	attributes: {
		position: 'a_position',
		texCoord: 'a_texCoord'
	},
	uniforms: {
		texture: 'u_texture'
	}
});
