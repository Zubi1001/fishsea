import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Fish } from './Fish.js';

// Shark class
class Shark extends Fish {
    constructor(scene, position = { x: 0, y: 0, z: 0 }, color = 0x607d8b, size = 3) {
        super(scene, position, color, size);
        this.predator = true; // Sharks are predators
        this.modelLoaded = false; // Flag to track if the model has loaded
        this.mixer = null; // Animation mixer for shark model
        this.animations = []; // Store animations
    }
    
    createFishMesh(position, color, size) {
        this.fishGroup = new THREE.Group();
        
        // Position the shark group
        this.fishGroup.position.set(position.x, position.y, position.z);
        
        // Create a temporary placeholder while the model loads
        // Making the placeholder more visible for debugging
        const placeholderGeometry = new THREE.BoxGeometry(size, size/2, size*2);
        const placeholderMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, // Bright red for visibility
            transparent: true,
            opacity: 0.8
        });
        this.placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
        this.fishGroup.add(this.placeholder);
        
        console.log("Attempting to load shark model...");
        
        // Load the shark GLB model - try both potential paths
        const loader = new GLTFLoader();
        
        // Make sharks 4x larger than originally specified
        const enhancedSize = size * 4;
        
        // Try the first path
        loader.load(
            '/models/shark.glb', // Path to the model
            (gltf) => {
                console.log("Shark model loaded successfully!");
                this.handleModelLoaded(gltf, color, enhancedSize);
            },
            // Progress callback
            (xhr) => {
                console.log(`Shark model loading: ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
            },
            // Error callback
            (error) => {
                console.error('Error loading shark model from /models/shark.glb:', error);
                console.log("Trying alternate path...");
                
                // Try an alternate path if the first one fails
                loader.load(
                    'models/shark.glb', // Alternate path without leading slash
                    (gltf) => {
                        console.log("Shark model loaded successfully from alternate path!");
                        this.handleModelLoaded(gltf, color, enhancedSize);
                    },
                    (xhr) => {
                        console.log(`Shark model loading (alt path): ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
                    },
                    (error) => {
                        console.error('Error loading shark model from alternate path:', error);
                    }
                );
            }
        );
    }
    
    // Helper method to handle a successfully loaded model
    handleModelLoaded(gltf, color, size) {
        // Remove the placeholder
        if (this.placeholder) {
            this.fishGroup.remove(this.placeholder);
            this.placeholder = null;
        }
        
        // Add the loaded model to the group
        this.sharkModel = gltf.scene;
        
        // Log the model's structure to help with debugging
        console.log("Shark model structure:", this.sharkModel);
        
        // Ensure we have proper bounds for the model
        let boundingBox = new THREE.Box3().setFromObject(this.sharkModel);
        let modelSize = new THREE.Vector3();
        boundingBox.getSize(modelSize);
        console.log("Original model dimensions:", modelSize);
        
        // Create a wrapper group for proper orientation
        const modelWrapper = new THREE.Group();
        this.fishGroup.add(modelWrapper);
        
        // Scale the model to match the desired size, ensuring it's visible
        // Use the enhanced size (4x larger) to make sharks more imposing
        const scaleFactor = size / Math.max(modelSize.x, modelSize.y, modelSize.z);
        console.log("Using scale factor:", scaleFactor);
        this.sharkModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Apply an additional scaling to make the shark 4x larger
        this.sharkModel.scale.multiplyScalar(4.0);
        
        // Apply the material color to make it more visible
        this.sharkModel.traverse((child) => {
            if (child.isMesh) {
                console.log("Found mesh in shark model:", child.name);
                // Create a new material with the color
                if (child.material) {
                    const oldMaterial = child.material;
                    
                    // Try using a brighter material for better visibility
                    const useOriginalMaterial = true; // Set to true to keep original textures
                    
                    if (useOriginalMaterial) {
                        // Keep original material but make it visible
                        child.material.side = THREE.DoubleSide;
                        child.material.needsUpdate = true;
                    } else {
                        // Use a bright, obvious material for debugging
                        child.material = new THREE.MeshBasicMaterial({ 
                            color: 0xff5500,  // Bright orange
                            side: THREE.DoubleSide
                        });
                    }
                    
                    // Enable shadows
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            }
        });
        
        // First, add to the wrapper
        modelWrapper.add(this.sharkModel);
        
        // Try different transformations to get proper orientation
        
        // Approach 1: Fix model orientation - make Z-axis forward
        // First reset all rotations
        this.sharkModel.rotation.set(0, 0, 0);
        
        // The model is swimming backward, so rotate it 180° around Y axis
        modelWrapper.rotateY(Math.PI);
        
        // Previously we tried to flip the shark right-side up with Z rotation,
        // but they're still upside down. Let's try X rotation instead.
        modelWrapper.rotateX(Math.PI);
        
        // Save reference to the wrapper for animation
        this.modelWrapper = modelWrapper;
        
        // Add a minimal collision box sized to the actual visible model
        // rather than using the entire bounding box
        const collisionScale = 0.6; // Make the collision box 60% of the visible size for a tighter fit
        const collisionBox = new THREE.Box3().setFromObject(this.sharkModel);
        const collisionSize = new THREE.Vector3();
        collisionBox.getSize(collisionSize);
        
        // Create an invisible collision shape
        const collisionGeometry = new THREE.BoxGeometry(
            collisionSize.x * collisionScale,
            collisionSize.y * collisionScale,
            collisionSize.z * collisionScale
        );
        const collisionMaterial = new THREE.MeshBasicMaterial({
            visible: false // Make it invisible
        });
        
        this.collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
        modelWrapper.add(this.collisionMesh);
        
        // Expose the collision shape for collision detection
        this.fishGroup.collisionShape = {
            type: 'box',
            mesh: this.collisionMesh
        };
        
        // Setup animations if they exist
        if (gltf.animations && gltf.animations.length > 0) {
            console.log("Found animations:", gltf.animations.length);
            this.mixer = new THREE.AnimationMixer(this.sharkModel);
            this.animations = gltf.animations;
            
            // Play the first animation by default
            const action = this.mixer.clipAction(this.animations[0]);
            action.play();
        } else {
            console.log("No animations found in the model");
        }
        
        this.modelLoaded = true;
        
        // Check the final bounding box to ensure it's properly sized
        boundingBox = new THREE.Box3().setFromObject(this.sharkModel);
        boundingBox.getSize(modelSize);
        console.log("Final model dimensions after scaling:", modelSize);
    }
    
    animateParts() {
        // If model isn't loaded yet or doesn't have animations, exit
        if (!this.modelLoaded) {
            // Animate placeholder while waiting for model
            if (this.placeholder) {
                this.placeholder.rotation.y = Date.now() * 0.001;
            }
            return;
        }
        
        // Update animation mixer if it exists
        if (this.mixer) {
            this.mixer.update(0.016); // Approx 60fps
        } else {
            // If no animations, implement some basic motion
            if (this.sharkModel && this.modelWrapper) {
                // Create subtle swimming motion
                const time = Date.now() * 0.001;
                
                // Add subtle body sway for more realistic swimming
                // Apply to the wrapper to maintain orientation
                this.modelWrapper.rotation.z = Math.sin(time * 1.5) * 0.05; // Side-to-side sway
                
                // Add subtle up/down motion
                this.modelWrapper.position.y = Math.sin(time) * 0.1;
                
                // You can add more custom animations here
            }
        }
    }
    
    // Override wander to make sharks more aggressive/territorial
    wander() {
        // Random wandering behavior with occasional lunges
        this.wanderAngle += (Math.random() - 0.5) * 0.2;
        
        // Occasionally make a sudden lunge
        if (Math.random() < 0.005) {
            this.velocity.multiplyScalar(3);
        }
        
        const wanderX = Math.cos(this.wanderAngle);
        const wanderY = Math.sin(this.wanderAngle) * 0.3; // Less vertical movement
        const wanderZ = Math.sin(this.wanderAngle + Math.PI/4);
        
        const wanderForce = new THREE.Vector3(wanderX, wanderY, wanderZ);
        wanderForce.normalize().multiplyScalar(this.maxForce);
        
        this.applyForce(wanderForce);
        
        // Limit speed
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
        
        return wanderForce;
    }
    
    // Override the update method to handle animations
    update() {
        // Call the parent class update method
        super.update();
        
        // If the model has animations, we may want to update them here
        if (this.modelLoaded && this.mixer) {
            // Animation updates are handled in animateParts
        }
    }
}

// Export the Shark class
export { Shark };