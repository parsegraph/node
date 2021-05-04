uniform mat3 u_world;
uniform highp float u_scale;

attribute vec2 a_position;
attribute vec4 a_color;
attribute vec4 a_backgroundColor;
attribute vec2 a_texCoord;
attribute highp float a_scale;

varying highp vec2 texCoord;
varying highp vec4 fragmentColor;
varying highp vec4 backgroundColor;
varying highp float scale;

void main() {
  gl_Position = vec4((u_world * vec3(a_position, 1.0)).xy, 0.0, 1.0);
  fragmentColor = a_color;
  backgroundColor = a_backgroundColor;
  texCoord = a_texCoord;
  scale = a_scale * u_scale;
}