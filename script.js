/*
    THE FRACTURE | script.js
    This is the core script that orchestrates the surrealist 3D environment
    using Three.js, manages scroll transformations, cursor reactivity,
    and integrates sound.
    It ties together three-setup.js, shaders, and utility functions.
*/

// Import modules (ensure these paths are correct in your local setup)
import { createScene, addLights, addCamera, addRenderer, updateRendererSize, animate, scene, camera, renderer, clock } from './src/three-setup.js';
import { applyShaderEffects, updateShaderUniforms, createGlitchTexture } from './src/shaders/shader-manager.js'; // A new module for managing shaders
import { createAbstractBuilding, addLiquidPlane, createFragmentedText } from './src/models/model-manager.js'; // A new module for model creation
import { getRandomFloat, mapRange } from './src/utilities.js'; // Utility functions

// --- Global State Variables ---
let scrollProgress = 0; // 0 to 1, representing vertical scroll depth
let cursor = { x: 0, y: 0 }; // Normalized mouse coordinates (-1 to 1)
let sceneObjects = {}; // To hold references to Three.js objects (buildings, planes, texts)
let currentAmbientSound;
let glitchSound;
let isSoundEnabled = true; // State for sound toggle
let isLoading = true; // Loading state

// --- DOM Elements ---
const loadingOverlay = document.getElementById('loading-overlay');
const progressPercent = document.getElementById('progress-percent');
const uiOverlay = document.getElementById('ui-overlay');
const soundToggle = document.getElementById('soundToggle');

// --- Asset Loading Manager (For initial loading sequence) ---
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const gltfLoader = new THREE.GLTFLoader(loadingManager);

let glitchTexture, redOverlayTexture; // Global textures for shaders

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = Math.round((itemsLoaded / itemsTotal) * 100);
    if (progressPercent) progressPercent.textContent = `${progress}%`;
};

loadingManager.onLoad = () => {
    isLoading = false;
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        // Initial setup for the sound on user interaction
        initializeSounds();
    }
    // Fade in UI after loading completes
    if (uiOverlay) uiOverlay.classList.remove('hidden');
    console.log("All assets loaded. Simulation ready.");
};

// --- Initialization on DOM Load ---
document.addEventListener('DOMContentLoaded', () => {
    setupScene();
    loadAssets();
    gsap.registerPlugin(ScrollTrigger); // Register ScrollTrigger
    setupScrollTrigger();
    setupCursorEvents();
    setupSoundToggle();

    // Ensure initial scroll position reflects load
    window.dispatchEvent(new Event('scroll'));
});

/**
 * Core scene setup function.
 */
function setupScene() {
    // Already defined in three-setup.js, just ensures it's called
    // createScene is handled by importing scene/camera/renderer
    addLights();
    addCamera();
    addRenderer(document.getElementById('fractureCanvas'));

    // Create a background plane that can be animated with shaders
    const backgroundPlaneGeometry = new THREE.PlaneGeometry(20, 20); // Large plane
    const backgroundPlaneMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float u_time;
            uniform float u_scrollProgress;
            uniform vec3 u_color;
            uniform vec2 u_resolution;
            uniform sampler2D u_glitchTexture;

            varying vec2 vUv;

            void main() {
                vec2 uv = vUv;
                vec3 finalColor = u_color;

                // Simple pulsating effect based on time
                float pulse = sin(u_time * 0.5) * 0.1 + 0.9;
                finalColor *= pulse;

                // Glitch effect based on scroll
                float glitchIntensity = u_scrollProgress * 2.0; // Intensify glitch with scroll
                if (glitchIntensity > 0.0) {
                    vec2 glitchUV = uv + vec2(sin(uv.y * 10.0 + u_time * 5.0) * glitchIntensity * 0.1, 0.0);
                    vec4 glitchColor = texture2D(u_glitchTexture, glitchUV);
                    finalColor += glitchColor.rgb * glitchIntensity * 0.5;
                }

                // Overall red bleed effect with scroll
                finalColor = mix(finalColor, vec3(1.0, 0.0, 0.0), u_scrollProgress * 0.8);

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `,
        uniforms: {
            u_time: { value: 0.0 },
            u_scrollProgress: { value: 0.0 },
            u_color: { value: new THREE.Color(0x000000) }, // Start with black
            u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            u_glitchTexture: { value: null } // Will assign after texture load
        },
        side: THREE.DoubleSide,
        transparent: true, // Allow transparency if needed
        depthWrite: false, // Prevents depth issues for background
    });

    sceneObjects.backgroundPlane = new THREE.Mesh(backgroundPlaneGeometry, backgroundPlaneMaterial);
    sceneObjects.backgroundPlane.position.z = -10; // Push to background
    scene.add(sceneObjects.backgroundPlane);

    // Add initial abstract building element
    gltfLoader.load('src/models/building_fragment.gltf', (gltf) => {
        sceneObjects.building = gltf.scene;
        sceneObjects.building.scale.set(0.1, 0.1, 0.1);
        sceneObjects.building.position.set(0, -2, -5);
        scene.add(sceneObjects.building);

        // Apply a base shader to the building that can distort
        sceneObjects.building.traverse((node) => {
            if (node.isMesh) {
                node.material = backgroundPlaneMaterial.clone(); // Re-use the background shader for distortion
                node.material.uniforms.u_color.value = new THREE.Color(0xAAAAAA); // Base color for building
            }
        });
    });


    // Add initial subliminal text (e.g., "Utopian Lie")
    const textGeometry = new THREE.PlaneGeometry(5, 1); // Simple plane for texture
    const textTexture = textureLoader.load('assets/textures/utopian_lie_text.png'); // Placeholder for pre-rendered text image
    const textMaterial = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true, alphaTest: 0.5 });
    sceneObjects.utopianText = new THREE.Mesh(textGeometry, textMaterial);
    sceneObjects.utopianText.position.set(3, 2, -2);
    scene.add(sceneObjects.utopianText);


    // Start animation loop
    animate((time) => {
        // Update shader uniforms
        if (sceneObjects.backgroundPlane && sceneObjects.backgroundPlane.material.uniforms) {
            sceneObjects.backgroundPlane.material.uniforms.u_time.value = time;
            sceneObjects.backgroundPlane.material.uniforms.u_scrollProgress.value = scrollProgress;
        }

        // Apply scroll transformations to existing objects
        if (sceneObjects.building) {
            sceneObjects.building.rotation.y = scrollProgress * Math.PI * 2; // Rotate based on scroll
            sceneObjects.building.position.y = -2 + scrollProgress * 5; // Move up
            // Scale and distort building based on scroll for "fracture" effect
            const scaleFactor = 1.0 - scrollProgress * 0.5; // Shrink it
            const distortIntensity = scrollProgress * 0.2; // Add some jitter
            sceneObjects.building.scale.set(
                0.1 * scaleFactor + getRandomFloat(-distortIntensity, distortIntensity),
                0.1 * scaleFactor + getRandomFloat(-distortIntensity, distortIntensity),
                0.1 * scaleFactor + getRandomFloat(-distortIntensity, distortIntensity)
            );
            // Apply a tint using the shader color if it's the custom one
            if (sceneObjects.building.material && sceneObjects.building.material.uniforms && sceneObjects.building.material.uniforms.u_color) {
                 sceneObjects.building.material.uniforms.u_color.value.lerp(new THREE.Color(0xFF0000), scrollProgress * 0.9); // Tint red
            }
        }
        if (sceneObjects.utopianText) {
            sceneObjects.utopianText.position.x = 3 - scrollProgress * 6; // Slide across
            sceneObjects.utopianText.rotation.z = scrollProgress * Math.PI; // Spin
            sceneObjects.utopianText.material.opacity = 1.0 - scrollProgress * 0.8; // Fade out
            // Apply more aggressive glitching to text via its shader (conceptual as material is BasicMaterial)
            // If it were a ShaderMaterial, we'd update its specific uniforms
        }


        // Glitch texture needs to be loaded and assigned
        if (glitchTexture && sceneObjects.backgroundPlane && !sceneObjects.backgroundPlane.material.uniforms.u_glitchTexture.value) {
             sceneObjects.backgroundPlane.material.uniforms.u_glitchTexture.value = glitchTexture;
        }
    });
}

/**
 * Loads required textures and 3D models.
 */
function loadAssets() {
    // Load glitch texture
    textureLoader.load('assets/textures/glitch_pattern.jpg', (texture) => {
        glitchTexture = texture;
        glitchTexture.wrapS = glitchTexture.wrapT = THREE.RepeatWrapping;
        glitchTexture.repeat.set(4, 4); // Repeat to fill space
    });

    // Load red overlay texture (e.g., a subtle grunge red texture for bleeding effects)
    textureLoader.load('assets/textures/red_overlay.png', (texture) => {
        redOverlayTexture = texture;
    });

    // This is where you would load more complex models with gltfLoader
    // e.g., gltfLoader.load('src/models/complex_fracture_model.gltf', (gltf) => { ... });
}


// --- Scroll-based Transformations (GSAP ScrollTrigger) ---
function setupScrollTrigger() {
    gsap.to(window, {
        scrollTrigger: {
            scrub: true,
            start: "top top",
            end: "bottom bottom", // Scrolls the entire body height
            onUpdate: (self) => {
                scrollProgress = self.progress; // GSAP's progress (0-1)
                // console.log("Scroll Progress:", scrollProgress);

                // Example: Trigger dramatic color shift on background material
                if (sceneObjects.backgroundPlane && sceneObjects.backgroundPlane.material.uniforms && sceneObjects.backgroundPlane.material.uniforms.u_color) {
                    const targetColor = new THREE.Color(0xFF0000); // Red
                    const currentColor = new THREE.Color(0x000000); // Black
                    currentColor.lerp(targetColor, scrollProgress * 0.9); // Smooth transition towards red
                    sceneObjects.backgroundPlane.material.uniforms.u_color.value.copy(currentColor);
                }

                // Example: Control Camera position based on scroll
                camera.position.z = 5 - scrollProgress * 10; // Move camera closer/further
                camera.rotation.y = scrollProgress * 0.5; // Small camera tilt

                // Fade out UI overlay as user scrolls down
                const uiOverlayOpacity = 1.0 - scrollProgress * 2; // Fade out faster
                if (uiOverlay) uiOverlay.style.opacity = Math.max(0, uiOverlayOpacity);
            }
        }
    });

    // Create a very long, invisible div to extend scroll height
    // This allows for more granular control over scroll progress (0-1) over a longer distance.
    const scrollHeightExtender = document.createElement('div');
    scrollHeightExtender.style.height = '500vh'; // Make it 5x the viewport height
    scrollHeightExtender.style.width = '1px'; // Minimal width
    scrollHeightExtender.style.position = 'absolute';
    scrollHeightExtender.style.top = '0';
    scrollHeightExtender.style.left = '0';
    scrollHeightExtender.style.zIndex = '0'; // Below the canvas
    document.body.appendChild(scrollHeightExtender);
}


// --- Cursor-reactive elements ---
function setupCursorEvents() {
    window.addEventListener('mousemove', (event) => {
        cursor.x = (event.clientX / window.innerWidth) * 2 - 1; // -1 to 1
        cursor.y = -(event.clientY / window.innerHeight) * 2 + 1; // -1 to 1

        // Example: Subtle distortion or light interaction on the scene via shader
        // This would require passing cursor coordinates to a shader uniform.
        if (sceneObjects.backgroundPlane && sceneObjects.backgroundPlane.material.uniforms) {
            sceneObjects.backgroundPlane.material.uniforms.u_mouse = { value: new THREE.Vector2(cursor.x, cursor.y) };
        }
    });

    // Trigger glitch sound/visual on click
    window.addEventListener('mousedown', (event) => {
        if (glitchSound && isSoundEnabled) {
            glitchSound.play();
        }
        // Example: Instantly create a burst of visual noise (brief shader uniform change)
        if (sceneObjects.backgroundPlane && sceneObjects.backgroundPlane.material.uniforms) {
            gsap.to(sceneObjects.backgroundPlane.material.uniforms.u_glitchIntensity, {
                value: 0.5,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: "power2.out"
            });
        }
    });
}


// --- Sound-driven visuals (Howler.js) ---
function initializeSounds() {
    if (!Howler.Howler.usingWebAudio) {
        console.warn("Web Audio API not supported or available. Sound will be limited.");
        return;
    }

    currentAmbientSound = new Howl({
        src: ['assets/audio/ambient_drone.mp3'],
        loop: true,
        volume: 0.5, // Start somewhat loud
        autoplay: false // Controlled by toggle
    });

    glitchSound = new Howl({
        src: ['assets/audio/static_burst.mp3'],
        volume: 0.8,
        autoplay: false
    });

    // Request user interaction to enable audio on modern browsers
    // A single click on the document can often enable all audio context
    const firstInteraction = () => {
        if (!currentAmbientSound.playing()) {
            currentAmbientSound.play();
        }
        document.removeEventListener('click', firstInteraction);
        document.removeEventListener('touchstart', firstInteraction);
    };
    document.addEventListener('click', firstInteraction);
    document.addEventListener('touchstart', firstInteraction); // For mobile
}

function setupSoundToggle() {
    if (!soundToggle) return;

    const soundStatusSpan = soundToggle.querySelector('.sound-status');
    const soundIcon = soundToggle.querySelector('i');

    // Initial check (can also check localStorage for user preference)
    if (localStorage.getItem('soundEnabled') === 'false') {
        isSoundEnabled = false;
        soundStatusSpan.textContent = 'Sound OFF';
        soundIcon.classList.remove('fa-volume-up');
        soundIcon.classList.add('fa-volume-mute');
        if (currentAmbientSound) currentAmbientSound.mute(true);
    } else {
        // Automatically play on interaction
        soundStatusSpan.textContent = 'Sound ON';
        soundIcon.classList.remove('fa-volume-mute');
        soundIcon.classList.add('fa-volume-up');
        if (currentAmbientSound) currentAmbientSound.mute(false);
    }


    soundToggle.addEventListener('click', () => {
        isSoundEnabled = !isSoundEnabled;
        localStorage.setItem('soundEnabled', isSoundEnabled);

        if (isSoundEnabled) {
            soundStatusSpan.textContent = 'Sound ON';
            soundIcon.classList.remove('fa-volume-mute');
            soundIcon.classList.add('fa-volume-up');
            if (currentAmbientSound && !currentAmbientSound.playing()) {
                 currentAmbientSound.play();
            } else if (currentAmbientSound) {
                 currentAmbientSound.mute(false);
            }
        } else {
            soundStatusSpan.textContent = 'Sound OFF';
            soundIcon.classList.remove('fa-volume-up');
            soundIcon.classList.add('fa-volume-mute');
            if (currentAmbientSound) currentAmbientSound.mute(true);
        }
    });

    // Initial audio unlock for mobile browsers
    document.body.addEventListener('touchstart', Howler.Howler.autoUnlock, { once: true });
    document.body.addEventListener('click', Howler.Howler.autoUnlock, { once: true });
}


// Expose to window for external access in development/debugging if needed
window.scene = scene;
window.camera = camera;
window.renderer = renderer;
