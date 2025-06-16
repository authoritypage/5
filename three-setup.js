/*
    THE FRACTURE | src/three-setup.js
    Responsible for initializing the core Three.js scene, camera, renderer, and lights.
*/

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Optional: for debugging

// Core Scene Components
export const scene = new THREE.Scene();
export let camera;
export let renderer;
export const clock = new THREE.Clock();

let controls; // Orbit controls for dev

/**
 * Creates and configures the main camera.
 */
export function addCamera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5); // Start position
    scene.add(camera);
}

/**
 * Creates and configures the WebGL renderer.
 * @param {HTMLCanvasElement} canvas - The canvas element to render to.
 */
export function addRenderer(canvas) {
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true, // Smooth edges
        alpha: true // Allow transparency for CSS background if needed
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Optional: Add OrbitControls for debugging camera movement
    // controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true; // Smooths controls
    // controls.dampingFactor = 0.05;

    // Handle window resizing
    window.addEventListener('resize', () => {
        updateRendererSize();
    });
}

/**
 * Adjusts renderer and camera aspect ratio on window resize.
 */
export function updateRendererSize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Adds ambient and directional lighting to the scene.
 */
export function addLights() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white ambient light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);
}

/**
 * The main animation loop.
 * @param {Function} updateCallback - Function to call each frame for updates.
 */
export function animate(updateCallback) {
    const render = () => {
        const delta = clock.getDelta(); // Time elapsed since last frame
        const elapsed = clock.getElapsedTime(); // Total elapsed time

        // if (controls) controls.update(); // Only if OrbitControls is enabled

        updateCallback(elapsed, delta); // Pass time to main script for updates

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    };
    render();
}
