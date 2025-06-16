/*
    THE FRACTURE | src/utilities.js
    General utility functions for calculations, etc.
*/

/**
 * Generates a random float within a specified range.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} A random float between min and max.
 */
export function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Maps a value from one range to another.
 * @param {number} value - The input value.
 * @param {number} inMin - The minimum of the input range.
 * @param {number} inMax - The maximum of the input range.
 * @param {number} outMin - The minimum of the output range.
 * @param {number} outMax - The maximum of the output range.
 * @returns {number} The value mapped to the new range.
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
