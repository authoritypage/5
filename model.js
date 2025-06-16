/*
    THE FRACTURE | src/models/model-manager.js
    (Conceptual) Functions for creating different 3D models or geometric entities
    that appear and deform in the scene.
*/

import * as THREE from 'three';

/**
 * Creates a basic abstract building representation.
 * In a real scenario, you'd load a GLTF model here.
 * @param {THREE.Material} material - The material to apply (e.g., your custom shader material).
 * @returns {THREE.Mesh} A simple building mesh.
 */
export function createAbstractBuilding(material) {
    const geometry = new THREE.BoxGeometry(1, 4, 1); // Simple tall box
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

/**
 * Creates a liquid plane.
 * @param {THREE.Material} material - The material to apply (should contain liquid shader logic).
 * @returns {THREE.Mesh} A large plane for liquid effects.
 */
export function addLiquidPlane(material) {
    const geometry = new THREE.PlaneGeometry(50, 50, 50, 50); // High segments for distortion
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Lie flat
    return mesh;
}

/**
 * Creates 3D text using a PlaneGeometry and a texture.
 * For truly dynamic 3D text (not images), you'd use Three.js TextGeometry with a font loader.
 * @param {THREE.Texture} textTexture - Pre-rendered image of the text.
 * @returns {THREE.Mesh} A plane with the text texture.
 */
export function createFragmentedText(textTexture) {
    const geometry = new THREE.PlaneGeometry(4, 1); // Aspect ratio for typical text
    const material = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true, alphaTest: 0.5 });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}
