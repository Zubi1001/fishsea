// Global state for the sea simulation
export const state = {
    otherFish: [],
    collidableObjects: [],
    animatedCreatures: [], // For seabed creatures
    seaweedStrands: [],    // For seaweed animations
    causticsEffect: null,  // For caustics lighting effects
    godRays: null,         // For volumetric light effects
    particleSystem: null,  // For particle effects
    waterSurface: null     // Reference to water surface
}; 