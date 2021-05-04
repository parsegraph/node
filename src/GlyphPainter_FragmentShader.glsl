#extension GL_OES_standard_derivatives : enable
uniform sampler2D u_glyphTexture;
varying highp vec4 fragmentColor;
varying highp vec4 backgroundColor;
varying highp vec2 texCoord;
varying highp float scale;

highp float aastep(highp float threshold, highp float value)
{
  highp float afwidth = 0.7 * length(vec2(dFdx(value), dFdy(value)));
  return smoothstep(threshold - afwidth, threshold + afwidth, value);
}

void main() {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  highp float distance = texture2D(u_glyphTexture, texCoord.st).a;
  highp float smoothing=0.5;
  highp float opacity = mix(aastep(smoothing, distance), distance, min(0.0, scale));
  if(backgroundColor.a == 0.0) {
    gl_FragColor = vec4(fragmentColor.rgb, fragmentColor.a * opacity);
  }
  else {
    gl_FragColor = mix(backgroundColor, fragmentColor, opacity);
  }
}