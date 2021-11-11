 #ifdef GL_ES
precision mediump float;
#endif

varying highp vec4 contentColor;
varying highp vec2 texCoord;
varying highp float selectionAngle;
varying highp float selectionSize;

void main() {
    highp vec2 st = texCoord;
    st = st * 2.0 - 1.0;
    highp float d = 1.0 - min(1.0, length(abs(st)));
    // "d = 1.0 - pow(d, 0.2);
    highp float fragAngle = atan(st.y, st.x);
    highp float angleDiff = abs(selectionAngle - fragAngle);
    if(angleDiff > 3.14159*1.5) { angleDiff = 2.0*3.14159 - angleDiff; }
    highp float angleAlpha = 0.5*d*max(0.0, 1.0 - contentColor.a * (angleDiff / selectionSize));
    highp float centerSpotlight = 0.5;
    highp float interiorDeadspot = 0.35;
    highp float centerDist = distance(texCoord.xy, vec2(0.5, 0.5));
    highp float centerAlpha = 0.5*max(0.0, 1.0 - centerDist/centerSpotlight) - 0.5*max(0.0, 1.0 - centerDist/interiorDeadspot);
    gl_FragColor = vec4(contentColor.rgb, centerAlpha + angleAlpha);
}
