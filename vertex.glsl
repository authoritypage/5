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
