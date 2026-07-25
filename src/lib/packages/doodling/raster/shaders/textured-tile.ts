import { describeWebGLProgram } from '../../webgl/program/program';

const VERTEX_SHADER_SRC = `#version 300 es
  layout(location = 0) in vec2 a_position;
  layout(location = 1) in vec2 a_uv;

  uniform mat3 u_viewProjection;
  uniform float u_instanceLevel;
  uniform vec2 u_instancePosition;

  out vec2 v_uv;
  
  void main() {
    v_uv = a_uv;
    
    float scale = exp2(u_instanceLevel);
    vec2 worldPosition = (a_position + vec2(u_instancePosition.x, -u_instancePosition.y - 1.0)) * scale;
    vec3 clip = u_viewProjection * vec3(worldPosition * 256.0, 1.0);

    gl_Position = vec4(clip.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SRC = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 outColor;
  
  uniform sampler2D u_texture;

  float edgeFactor() {
      vec2 d = fwidth(v_uv);
      vec2 nearZero = smoothstep(vec2(0.0), d * 1.5, v_uv);
      vec2 nearOne  = smoothstep(vec2(0.0), d * 1.5, 1.0 - v_uv);
      float lineU = min(nearZero.x, nearOne.x);
      float lineV = min(nearZero.y, nearOne.y);
      return min(lineU, lineV);
  }
  
  void main() {
    vec4 pixel = texture(u_texture, v_uv);

    float edge = edgeFactor();
    
    outColor = mix(vec4(0.0, 0.0, 0.0, 1.0), pixel, edge);
  }
`;

export const shaderTexturedTile = describeWebGLProgram({
	vertexShaderSource: VERTEX_SHADER_SRC,
	fragmentShaderSource: FRAGMENT_SHADER_SRC,
	attributes: {
		position: 0,
		uv: 1
	},
	uniforms: {
		viewProjection: 'u_viewProjection',
		instanceLevel: 'u_instanceLevel',
		instancePosition: 'u_instancePosition',
		texture: 'u_texture'
	}
});
