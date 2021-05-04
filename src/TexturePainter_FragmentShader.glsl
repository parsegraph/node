uniform sampler2D u_texture;
varying highp vec2 texCoord;
varying highp float alpha;

void main() {
  gl_FragColor = texture2D(u_texture, texCoord.st);
  gl_FragColor.a = gl_FragColor.a * alpha;
}