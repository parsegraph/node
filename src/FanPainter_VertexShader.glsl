uniform mat3 u_world;

attribute vec2 a_position;
attribute vec4 a_color;
attribute vec2 a_texCoord;
attribute float a_selectionAngle;
attribute float a_selectionSize;

varying highp vec4 contentColor;
varying highp vec2 texCoord;
varying highp float selectionAngle;
varying highp float selectionSize;

void main() {
    gl_Position = vec4((u_world * vec3(a_position, 1.0)).xy, 0.0, 1.0);
    contentColor = a_color;
    texCoord = a_texCoord;
    selectionAngle = a_selectionAngle;
    selectionSize = a_selectionSize;
}