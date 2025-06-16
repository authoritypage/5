// THE FRACTURE | src/shaders/vertex.glsl
// A conceptual vertex shader. Real complex distortion requires more uniforms
// (e.g., noise textures, distortion factors).

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDirection;

uniform float u_time;
uniform float u_scrollProgress;
uniform vec2 u_mouse; // Normalized mouse coords from -1 to 1

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);

    vec3 newPosition = position;

    // Scroll-based vertical distortion / displacement
    float scrollIntensity = u_scrollProgress * 2.0;
    newPosition.y += sin(newPosition.x * 5.0 + u_time * 0.2) * scrollIntensity * 0.5;
    newPosition.x += cos(newPosition.y * 3.0 + u_time * 0.3) * scrollIntensity * 0.3;

    // Mouse-reactive local distortion (e.g., push vertices away from cursor in screen space)
    vec4 projected_position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    vec2 screen_uv = (projected_position.xy / projected_position.w) * 0.5 + 0.5; // Normalized screen coords (0 to 1)

    float dist_from_mouse = distance(screen_uv, u_mouse * 0.5 + 0.5); // Convert mouse from -1 to 1 to 0 to 1
    float mouseInfluence = smoothstep(0.3, 0.0, dist_from_mouse); // Influence strongest close to mouse

    // Apply distortion perpendicular to surface, or along axis
    newPosition.xyz += normal * mouseInfluence * 0.5;


    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
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
