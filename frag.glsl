// THE FRACTURE | src/shaders/fragment.glsl
// A conceptual fragment shader for red bleeding, static, and liquid effects.
// For true liquid shaders, a more complex GLSL setup (e.g., noise functions, FBM) is needed.

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDirection;

uniform float u_time;
uniform float u_scrollProgress;
uniform vec3 u_color; // Base color passed from JS
uniform vec2 u_resolution;
uniform sampler2D u_glitchTexture; // Texture for static/noise
uniform sampler2D u_redOverlayTexture; // Texture for red bleeding overlay
uniform vec2 u_mouse; // For mouse influence

void main() {
    vec4 baseColor = vec4(u_color, 1.0); // Start with the object's base color

    // Dynamic red bleed effect based on scroll
    vec4 redOverlay = texture2D(u_redOverlayTexture, vUv * 2.0 + u_time * 0.05); // Sample red texture
    baseColor.rgb = mix(baseColor.rgb, vec3(1.0, 0.0, 0.0), u_scrollProgress * redOverlay.r * 1.5); // Intensify red with scroll & texture

    // Glitch / Static overlay
    float glitchIntensity = u_scrollProgress * 3.0; // Static increases with scroll depth
    vec2 glitchUvOffset = vec2(sin(vUv.y * 20.0 + u_time * 10.0) * glitchIntensity * 0.01, cos(vUv.x * 15.0 + u_time * 8.0) * glitchIntensity * 0.01);
    vec4 staticNoise = texture2D(u_glitchTexture, vUv + glitchUvOffset);

    // Mix static noise into color, stronger at higher scroll
    baseColor.rgb = mix(baseColor.rgb, staticNoise.rgb, glitchIntensity * 0.5);

    // Simulate "liquid" melting effect based on scroll (simplified, actual liquid needs more advanced math)
    float liquidAmount = pow(u_scrollProgress, 2.0) * 0.8; // Non-linear increase
    if (liquidAmount > 0.01) {
        // Sample texture or add distortion based on normal or position
        // This is highly conceptual, as a proper liquid shader requires complex SDF or noise fields.
        // For simple visual, mix with a blurred, slightly wavy version of itself
        vec2 distortedUv = vUv + vec2(sin(vUv.y * 10.0 + u_time * 0.8) * liquidAmount * 0.05,
                                    cos(vUv.x * 8.0 + u_time * 0.6) * liquidAmount * 0.05);
        vec4 liquidTint = texture2D(u_redOverlayTexture, distortedUv); // Use red texture for liquid distortion color
        baseColor.rgb = mix(baseColor.rgb, liquidTint.rgb, liquidAmount);
    }


    // Final color output
    gl_FragColor = baseColor;
}
