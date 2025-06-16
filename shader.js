/*
    THE FRACTURE | src/shaders/shader-manager.js
    (Conceptual) Module to encapsulate custom shader setup and uniform management.
    For this complex case, it mainly serves as a placeholder for how you would
    apply and manage custom material shaders throughout the scene.
*/

import * as THREE from 'three';

// Function to create a custom shader material
export function createCustomShaderMaterial(vertexShader, fragmentShader, uniforms, textureMap = null) {
    const material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            u_time: { value: 0.0 },
            u_scrollProgress: { value: 0.0 },
            u_color: { value: new THREE.Color(0xFFFFFF) }, // Default white
            u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            u_glitchTexture: { value: null },
            u_redOverlayTexture: { value: null },
            u_mouse: { value: new THREE.Vector2(0, 0) }, // Mouse normalized coordinates
            ...uniforms // Merge any additional custom uniforms
        },
        transparent: true,
        side: THREE.DoubleSide,
        // You might need these based on what you are doing in the shader
        // wireframe: true,
        // blending: THREE.AdditiveBlending,
        // depthTest: false,
    });

    if (textureMap) {
        material.uniforms.u_texture = { value: textureMap };
    }

    return material;
}

// Function to update uniform values
export function updateShaderUniforms(material, time, scrollProgress, mouseCoords = new THREE.Vector2(0,0)) {
    if (material && material.uniforms) {
        if (material.uniforms.u_time) material.uniforms.u_time.value = time;
        if (material.uniforms.u_scrollProgress) material.uniforms.u_scrollProgress.value = scrollProgress;
        if (material.uniforms.u_resolution) material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
        if (material.uniforms.u_mouse) material.uniforms.u_mouse.value.copy(mouseCoords);
    }
}

// Function to create a specific glitch texture (if procedural)
// For now, this points to loading a pre-rendered image
export function createGlitchTexture(loader, path) {
    return new Promise((resolve, reject) => {
        loader.load(path, texture => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(4, 4); // Repeat to cover larger areas
            resolve(texture);
        }, undefined, reject);
    });
}
