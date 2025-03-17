import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Fish } from './Fish.js';

// Jellyfish class
class Jellyfish extends Fish {
    constructor(scene, position = { x: 0, y: 0, z: 0 }, color = 0xffcce6, size = 1.2) {
        super(scene, position, color, size);
        this.pulseCycle = Math.random() * Math.PI * 2;
        this.tentaclePhases = [];
        for (let i = 0; i < 12; i++) {
            this.tentaclePhases.push(Math.random() * Math.PI * 2);
        }
        this.modelLoaded = false; // Flag to track if the model has loaded
        this.mixer = null; // Animation mixer for jellyfish model
        this.animations = []; // Store animations
        
        console.log(`Created jellyfish at position: ${JSON.stringify(position)}, color: ${color}, size: ${size}`);
    }
    
    createFishMesh(position, color, size) {
        this.fishGroup = new THREE.Group();
        
        // Position the jellyfish group
        this.fishGroup.position.set(position.x, position.y, position.z);
        
        // Create a temporary placeholder while the model loads
        const placeholderGeometry = new THREE.SphereGeometry(size, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const placeholderMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.7
        });
        this.placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
        this.fishGroup.add(this.placeholder);
        
        console.log("Attempting to load jellyfish model...");
        
        // Load the jellyfish GLB model - try both potential paths
        const loader = new GLTFLoader();
        
        // Try the first path
        loader.load(
            '/models/jellyfish.glb', // Path to the model
            (gltf) => {
                console.log("Jellyfish model loaded successfully!");
                this.handleModelLoaded(gltf, color, size);
            },
            // Progress callback
            (xhr) => {
                console.log(`Jellyfish model loading: ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
            },
            // Error callback
            (error) => {
                console.error('Error loading jellyfish model from /models/jellyfish.glb:', error);
                console.log("Trying alternate path...");
                
                // Try an alternate path if the first one fails
                loader.load(
                    'models/jellyfish.glb', // Alternate path without leading slash
                    (gltf) => {
                        console.log("Jellyfish model loaded successfully from alternate path!");
                        this.handleModelLoaded(gltf, color, size);
                    },
                    (xhr) => {
                        console.log(`Jellyfish model loading (alt path): ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
                    },
                    (error) => {
                        console.error('Error loading jellyfish model from alternate path:', error);
                        // If model fails to load, create a basic jellyfish with geometries
                        this.createBasicJellyfish(color, size);
                    }
                );
            }
        );
    }
    
    // Fallback method to create a basic jellyfish if the model fails to load
    createBasicJellyfish(color, size) {
        console.log("Creating basic jellyfish using geometries");
        
        // Remove placeholder
        if (this.placeholder) {
            this.fishGroup.remove(this.placeholder);
            this.placeholder = null;
        }
        
        // Jellyfish bell/dome
        const bellGeometry = new THREE.SphereGeometry(size, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const bellMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.7
        });
        this.bell = new THREE.Mesh(bellGeometry, bellMaterial);
        
        // Inner bell - slightly different color
        const innerGeometry = new THREE.SphereGeometry(size * 0.8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const innerMaterial = new THREE.MeshPhongMaterial({ 
            color: new THREE.Color(color).multiplyScalar(1.2),
            transparent: true,
            opacity: 0.5
        });
        this.innerBell = new THREE.Mesh(innerGeometry, innerMaterial);
        this.innerBell.position.y = -size * 0.1;
        
        // Tentacles
        this.tentacles = [];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const tentacle = this.createTentacle(color, size, angle);
            this.tentacles.push(tentacle);
            this.fishGroup.add(tentacle);
        }
        
        // Add all parts to group
        this.fishGroup.add(this.bell);
        this.fishGroup.add(this.innerBell);
        
        // Flag as loaded
        this.modelLoaded = true;
        console.log("Basic jellyfish created successfully as fallback");
    }
    
    // Helper method to handle a successfully loaded model
    handleModelLoaded(gltf, color, size) {
        // Remove the placeholder
        if (this.placeholder) {
            this.fishGroup.remove(this.placeholder);
            this.placeholder = null;
        }
        
        // Add the loaded model to the group
        this.jellyfishModel = gltf.scene;
        
        // Ensure we have proper bounds for the model
        let boundingBox = new THREE.Box3().setFromObject(this.jellyfishModel);
        let modelSize = new THREE.Vector3();
        boundingBox.getSize(modelSize);
        
        // Create a wrapper group for proper orientation
        const modelWrapper = new THREE.Group();
        this.fishGroup.add(modelWrapper);
        
        // Scale the model appropriately
        const scaleFactor = size * 1.5 / Math.max(modelSize.x, modelSize.y, modelSize.z);
        this.jellyfishModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Apply subtle transparency to the model
        this.jellyfishModel.traverse((child) => {
            if (child.isMesh) {
                if (child.material) {
                    // Use original model textures with subtle adjustments
                    child.material.side = THREE.DoubleSide;
                    child.material.transparent = true;
                    child.material.opacity = 0.85;
                    
                    // Add a very subtle emissive glow
                    child.material.emissive = new THREE.Color(0xffcce6).multiplyScalar(0.1);
                    child.material.emissiveIntensity = 0.2;
                    
                    child.material.needsUpdate = true;
                    
                    // Enable shadows
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            }
        });
        
        // First, add to the wrapper
        modelWrapper.add(this.jellyfishModel);
        
        // Fix model orientation - flip vertically to be right-side up
        modelWrapper.rotation.set(0, 0, 0); // Reset rotations
        modelWrapper.rotateX(0); // No rotation - bell should be on top, tentacles hanging down
        
        // Save reference to the wrapper for animation
        this.modelWrapper = modelWrapper;
        
        // Add a collision box (invisible)
        const collisionScale = 0.7; // Make the collision box 70% of the visible size
        const collisionBox = new THREE.Box3().setFromObject(this.jellyfishModel);
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
            this.mixer = new THREE.AnimationMixer(this.jellyfishModel);
            this.animations = gltf.animations;
            
            // Play the first animation by default
            const action = this.mixer.clipAction(this.animations[0]);
            action.play();
        } else {
            console.log("No animations found in the model");
        }
        
        this.modelLoaded = true;
    }
    
    createTentacle(color, size, angle) {
        const tentacleGroup = new THREE.Group();
        const length = size * 3 + Math.random() * size;
        
        // Create a line for the tentacle
        const points = [];
        const segments = 10;
        for (let i = 0; i < segments; i++) {
            points.push(new THREE.Vector3(0, -i * (length/segments), 0));
        }
        
        const tentacleGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const tentacleMaterial = new THREE.LineBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.6
        });
        
        const tentacle = new THREE.Line(tentacleGeometry, tentacleMaterial);
        tentacle.position.set(
            Math.cos(angle) * size * 0.8,
            0,
            Math.sin(angle) * size * 0.8
        );
        
        tentacleGroup.add(tentacle);
        return tentacleGroup;
    }
    
    animateParts() {
        // If model isn't loaded yet, animate placeholder
        if (!this.modelLoaded) {
            if (this.placeholder) {
                this.placeholder.rotation.y = Date.now() * 0.001;
            }
            return;
        }
        
        // Update animation mixer if it exists
        if (this.mixer) {
            this.mixer.update(0.016); // Approx 60fps
        } else if (this.jellyfishModel && this.modelWrapper) {
            // Custom animation for jellyfish model
            const time = Date.now() * 0.001;
            
            // Pulsing animation
            const pulseScale = 0.9 + Math.sin(time * 2 + this.pulseCycle) * 0.1;
            
            // Apply pulsing to the model wrapper
            this.modelWrapper.scale.y = pulseScale;
            
            // Gentle bobbing motion
            this.modelWrapper.position.y = Math.sin(time + this.pulseCycle) * 0.1;
            
            // Slight rotation animation
            this.modelWrapper.rotation.z = Math.sin(time * 0.5) * 0.05;
        } else if (this.bell) {
            // Fallback animation for basic jellyfish
            // Pulsing animation for the bell
            const time = Date.now() * 0.001;
            const pulseScale = 0.9 + Math.sin(time * 2 + this.pulseCycle) * 0.1;
            
            this.bell.scale.set(1, pulseScale, 1);
            this.innerBell.scale.set(1, pulseScale * 0.9, 1);
            
            // Animate tentacles with wave-like motion
            for (let i = 0; i < this.tentacles.length; i++) {
                const tentacle = this.tentacles[i];
                const phase = this.tentaclePhases[i];
                
                // Wave-like motion
                tentacle.rotation.x = Math.sin(time + phase) * 0.1;
                tentacle.rotation.z = Math.cos(time + phase * 0.7) * 0.1;
                
                // Scale tentacles with pulse
                const tentacleScale = 1 + Math.sin(time * 2 + this.pulseCycle + Math.PI) * 0.1;
                tentacle.scale.y = tentacleScale;
            }
        }
    }
    
    // Override wander to make jellyfish drift more
    wander() {
        // Jellyfish mostly drift with currents, with slight control
        this.wanderAngle += (Math.random() - 0.5) * 0.1;
        
        const wanderX = Math.cos(this.wanderAngle) * 0.5;
        const wanderY = Math.sin(Date.now() * 0.0005) * 0.3; // Slow up and down movement
        const wanderZ = Math.sin(this.wanderAngle + Math.PI/4) * 0.5;
        
        const wanderForce = new THREE.Vector3(wanderX, wanderY, wanderZ);
        wanderForce.normalize().multiplyScalar(this.maxForce * 0.5);
        
        this.applyForce(wanderForce);
        
        // Jellyfish move very slowly
        this.velocity.multiplyScalar(0.98);
        
        // Limit speed
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
        
        return wanderForce;
    }
    
    // Override update to make jellyfish always face upward
    update() {
        // Apply wandering behavior
        this.wander();
        
        // Update position based on velocity
        this.fishGroup.position.add(this.velocity);
        
        // Jellyfish always face upward, regardless of movement direction
        this.fishGroup.rotation.set(0, 0, 0);
        
        // Animate bell and tentacles
        this.animateParts();
        
        // Boundary check - wrap around if jellyfish goes too far
        this.checkBoundaries();
        
        // Update animation mixer if it exists
        if (this.modelLoaded && this.mixer) {
            // Animation updates are handled in animateParts
        }
        
        // Update collision shape position
        if (this.collisionShape) {
            this.collisionShape.center.copy(this.fishGroup.position);
        }
    }
}

// Export the Jellyfish class
export { Jellyfish }; 