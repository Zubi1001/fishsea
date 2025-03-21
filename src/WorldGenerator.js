import * as THREE from 'three';
import { state } from './state/globalState.js';

class WorldGenerator {
    constructor(scene) {
        this.scene = scene;
        this.chunkSize = 200; // Size of each chunk
        this.renderDistance = 2; // How many chunks to render in each direction
        this.loadedChunks = new Map(); // Map to store loaded chunks
        this.decorationDensity = {
            rocks: 10,     // Reduced from 25
            coral: 8,      // Reduced from 15
            plants: 12     // Reduced from 30
        };
        // Use the global state for collidable objects
        // this.collidableObjects = [];
    }
    
    // Get chunk coordinates from world position
    getChunkCoordFromPosition(position) {
        return {
            x: Math.floor(position.x / this.chunkSize),
            z: Math.floor(position.z / this.chunkSize)
        };
    }
    
    // Update chunks based on player position
    update(playerPosition) {
        const currentChunk = this.getChunkCoordFromPosition(playerPosition);
        
        // Determine which chunks should be loaded
        const chunksToLoad = [];
        for (let x = currentChunk.x - this.renderDistance; x <= currentChunk.x + this.renderDistance; x++) {
            for (let z = currentChunk.z - this.renderDistance; z <= currentChunk.z + this.renderDistance; z++) {
                const chunkKey = `${x},${z}`;
                if (!this.loadedChunks.has(chunkKey)) {
                    chunksToLoad.push({ x, z, key: chunkKey });
                }
            }
        }
        
        // Load new chunks
        chunksToLoad.forEach(chunk => {
            this.generateChunk(chunk.x, chunk.z, chunk.key);
        });
        
        // Unload distant chunks
        this.loadedChunks.forEach((chunkObject, key) => {
            const [x, z] = key.split(',').map(Number);
            
            if (Math.abs(x - currentChunk.x) > this.renderDistance || 
                Math.abs(z - currentChunk.z) > this.renderDistance) {
                // Remove chunk objects from scene
                chunkObject.objects.forEach(object => {
                    // Remove from collidable objects array
                    const index = state.collidableObjects.indexOf(object);
                    if (index !== -1) {
                        state.collidableObjects.splice(index, 1);
                    }
                    
                    this.scene.remove(object);
                    
                    // Properly dispose of geometries and materials
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                });
                
                // Remove from loaded chunks
                this.loadedChunks.delete(key);
            }
        });
    }
    
    // Generate a new chunk at the specified coordinates
    generateChunk(chunkX, chunkZ, chunkKey) {
        const chunkObjects = [];
        const worldX = chunkX * this.chunkSize;
        const worldZ = chunkZ * this.chunkSize;
        
        // Use the chunk coordinates as seeds for consistent generation
        const chunkSeed = chunkX * 10000 + chunkZ;
        
        // Generate seafloor for this chunk
        const seafloor = this.generateSeafloor(worldX, worldZ, chunkSeed);
        chunkObjects.push(seafloor);
        
        // Generate decorations using the same seed for consistency
        this.generateDecorations(worldX, worldZ, chunkSeed, chunkObjects);
        
        // Store the chunk
        this.loadedChunks.set(chunkKey, { 
            objects: chunkObjects,
            x: chunkX,
            z: chunkZ
        });
    }
    
    // Generate seafloor with improved procedural generation
    generateSeafloor(worldX, worldZ, seed) {
        // Increase resolution for more detailed terrain
        const geometry = new THREE.PlaneGeometry(
            this.chunkSize, 
            this.chunkSize, 
            32,  // Increased from 20
            32   // Increased from 20
        );
        
        // Add more varied height variation to the seafloor
        const vertices = geometry.attributes.position.array;
        
        // Create a seeded random function
        const seededRandom = this.createSeededRandom(seed);
        
        // Generate more interesting terrain with multiple frequencies
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            const absoluteX = worldX + x + this.chunkSize/2;
            const absoluteZ = worldZ + z + this.chunkSize/2;
            
            // Create multi-frequency noise for more natural terrain
            // Large scale features
            const largeScale = 
                Math.sin(absoluteX * 0.01 + seed * 0.1) * 
                Math.cos(absoluteZ * 0.01 + seed * 0.05) * 2;
                
            // Medium scale features
            const mediumScale = 
                Math.sin(absoluteX * 0.03 + seed * 0.2) * 
                Math.cos(absoluteZ * 0.03 + seed * 0.15) * 1;
                
            // Small scale features
            const smallScale = 
                Math.sin(absoluteX * 0.07 + seed * 0.3) * 
                Math.cos(absoluteZ * 0.07 + seed * 0.25) * 0.5;
            
            // Add more significant random noise
            const noise = (seededRandom() - 0.5) * 1.5;
            
            // Combine all frequencies with the noise
            vertices[i + 1] = largeScale + mediumScale + smallScale + noise;
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        // Use a material with color variation based on height
        const material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            shininess: 5,
            wireframe: false
        });
        
        // Add vertex colors based on height for more visual variation
        const colors = [];
        for (let i = 0; i < vertices.length; i += 3) {
            const height = vertices[i + 1];
            
            // Base sand color
            let r = 0.82; // d2
            let g = 0.71; // b4
            let b = 0.55; // 8c
            
            // Adjust color based on height
            if (height > 1.5) {
                // Lighter sand for higher areas
                r = 0.9;
                g = 0.8;
                b = 0.6;
            } else if (height < -1.5) {
                // Darker, more bluish for deeper areas
                r = 0.6;
                g = 0.55;
                b = 0.5;
            }
            
            // Add slight random variation to each vertex color
            r += (seededRandom() - 0.5) * 0.1;
            g += (seededRandom() - 0.5) * 0.1;
            b += (seededRandom() - 0.5) * 0.1;
            
            colors.push(r, g, b);
        }
        
        // Add the colors to the geometry
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = Math.PI / 2;
        
        // Position the floor
        floor.position.set(
            worldX + this.chunkSize/2, 
            -35, 
            worldZ + this.chunkSize/2
        );
        floor.receiveShadow = true;
        
        this.scene.add(floor);
        return floor;
    }
    
    // Get a slightly varied seafloor color based on the seed
    getSeafloorColor(seed) {
        // Use the seed to generate a slightly different color for each chunk
        const r = 0.6 + (seed % 100) / 1000;
        const g = 0.45 + ((seed % 77) / 1000);
        const b = 0.3 + ((seed % 55) / 1000);
        
        return new THREE.Color(r, g, b);
    }
    
    // Generate decorations for a chunk
    generateDecorations(worldX, worldZ, seed, chunkObjects) {
        // Use a seeded random number generator for consistent generation
        const seededRandom = this.createSeededRandom(seed);
        
        // Generate rocks
        for (let i = 0; i < this.decorationDensity.rocks; i++) {
            const rock = this.createRock(
                worldX + seededRandom() * this.chunkSize,
                -39 + seededRandom() * 2, // Adjusted height to match new seabed
                worldZ + seededRandom() * this.chunkSize,
                seededRandom
            );
            chunkObjects.push(rock);
        }
        
        // Generate coral
        for (let i = 0; i < this.decorationDensity.coral; i++) {
            const coral = this.createCoral(
                worldX + seededRandom() * this.chunkSize,
                -39, // Adjusted height to match new seabed
                worldZ + seededRandom() * this.chunkSize,
                new THREE.Color(
                    seededRandom() * 0.5 + 0.5,
                    seededRandom() * 0.5,
                    seededRandom() * 0.5 + 0.5
                ),
                seededRandom
            );
            chunkObjects.push(coral);
        }
        
        // Generate seaweed and plants
        for (let i = 0; i < this.decorationDensity.plants; i++) {
            const plant = this.createSeaweed(
                worldX + seededRandom() * this.chunkSize,
                -39, // Adjusted height to match new seabed
                worldZ + seededRandom() * this.chunkSize,
                seededRandom
            );
            chunkObjects.push(plant);
        }
    }
    
    // Create a rock with the given parameters
    createRock(x, y, z, seededRandom) {
        try {
            // Use simpler geometry for better performance
            const rockGeometry = new THREE.DodecahedronGeometry(seededRandom() * 4 + 2, 0);
            const rockMaterial = new THREE.MeshPhongMaterial({
                color: new THREE.Color(
                    0.3 + seededRandom() * 0.2,
                    0.3 + seededRandom() * 0.2,
                    0.3 + seededRandom() * 0.2
                )
            });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            
            rock.position.set(x, y, z);
            
            // Random rotation
            rock.rotation.x = seededRandom() * Math.PI;
            rock.rotation.y = seededRandom() * Math.PI;
            rock.rotation.z = seededRandom() * Math.PI;
            
            // Random scale
            const scale = seededRandom() * 1.5 + 0.5;
            rock.scale.set(scale, scale * 0.8, scale);
            
            rock.castShadow = true;
            rock.receiveShadow = true;
            this.scene.add(rock);
            
            // Add collision shape safely
            if (typeof state.collidableObjects !== 'undefined') {
                rock.collisionShape = {
                    type: 'sphere',
                    center: rock.position.clone(),
                    radius: Math.max(scale * 2, scale * 0.8 * 2) * 1.2
                };
                state.collidableObjects.push(rock);
            }
            
            return rock;
        } catch (error) {
            console.error("Error creating rock:", error);
            // Return a dummy object to prevent further errors
            const dummyGroup = new THREE.Group();
            dummyGroup.position.set(x, y, z);
            this.scene.add(dummyGroup);
            return dummyGroup;
        }
    }
    
    // Create coral formation
    createCoral(x, y, z, color, seededRandom) {
        try {
            const coralGroup = new THREE.Group();
            coralGroup.position.set(x, y, z);
            
            // Create 2-3 branches (reduced from 3-5)
            const branchCount = Math.floor(seededRandom() * 2) + 2;
            
            for (let i = 0; i < branchCount; i++) {
                try {
                    const height = seededRandom() * 6 + 3;
                    const radius = seededRandom() * 0.5 + 0.3;
                    
                    const branchGeometry = new THREE.CylinderGeometry(radius, radius * 1.5, height, 6, 1);
                    const branchMaterial = new THREE.MeshPhongMaterial({ color: color });
                    const branch = new THREE.Mesh(branchGeometry, branchMaterial);
                    
                    // Position and rotate the branch
                    branch.position.set(
                        (seededRandom() - 0.5) * 3,
                        height / 2,
                        (seededRandom() - 0.5) * 3
                    );
                    
                    branch.rotation.set(
                        seededRandom() * 0.3,
                        seededRandom() * Math.PI * 2,
                        seededRandom() * 0.3
                    );
                    
                    coralGroup.add(branch);
                } catch (branchError) {
                    console.error("Error creating coral branch:", branchError);
                }
            }
            
            this.scene.add(coralGroup);
            
            // Add collision shape to the entire coral group
            if (typeof state.collidableObjects !== 'undefined') {
                coralGroup.collisionShape = {
                    type: 'sphere',
                    center: coralGroup.position.clone(),
                    radius: 4 // Approximate radius for the whole coral
                };
                state.collidableObjects.push(coralGroup);
            }
            
            return coralGroup;
        } catch (error) {
            console.error("Error creating coral:", error);
            // Return a dummy object to prevent further errors
            const dummyGroup = new THREE.Group();
            dummyGroup.position.set(x, y, z);
            this.scene.add(dummyGroup);
            return dummyGroup;
        }
    }
    
    // Create seaweed
    createSeaweed(x, y, z, seededRandom) {
        try {
            const seaweedGroup = new THREE.Group();
            seaweedGroup.position.set(x, y, z);
            
            // Create 2-4 strands of seaweed
            const strandCount = Math.floor(seededRandom() * 3) + 2;
            
            for (let i = 0; i < strandCount; i++) {
                try {
                    const height = seededRandom() * 8 + 5;
                    const width = seededRandom() * 0.5 + 0.3;
                    
                    // Create a simple plane for each strand
                    const strandGeometry = new THREE.PlaneGeometry(width, height, 1, 4);
                    
                    // Add some wave to the seaweed by adjusting vertices
                    const vertices = strandGeometry.attributes.position.array;
                    for (let j = 0; j < vertices.length; j += 3) {
                        // Only adjust x position (assuming y is up)
                        vertices[j] += Math.sin(vertices[j + 1] * 0.5) * 0.5;
                    }
                    strandGeometry.attributes.position.needsUpdate = true;
                    
                    // Green color with some variation
                    const green = 0.6 + seededRandom() * 0.3;
                    const strandMaterial = new THREE.MeshPhongMaterial({
                        color: new THREE.Color(0.1, green, 0.2),
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.9
                    });
                    
                    const strand = new THREE.Mesh(strandGeometry, strandMaterial);
                    
                    // Position the strand
                    strand.position.set(
                        (seededRandom() - 0.5) * 2,
                        height / 2,
                        (seededRandom() - 0.5) * 2
                    );
                    
                    // Rotate the strand randomly
                    strand.rotation.y = seededRandom() * Math.PI;
                    
                    seaweedGroup.add(strand);
                } catch (strandError) {
                    console.error("Error creating seaweed strand:", strandError);
                }
            }
            
            this.scene.add(seaweedGroup);
            
            // Add a very small collision shape - seaweed shouldn't block much
            if (typeof state.collidableObjects !== 'undefined') {
                seaweedGroup.collisionShape = {
                    type: 'sphere',
                    center: seaweedGroup.position.clone(),
                    radius: 1 // Small radius - seaweed is passable
                };
                state.collidableObjects.push(seaweedGroup);
            }
            
            return seaweedGroup;
        } catch (error) {
            console.error("Error creating seaweed:", error);
            // Return a dummy object to prevent further errors
            const dummyGroup = new THREE.Group();
            dummyGroup.position.set(x, y, z);
            this.scene.add(dummyGroup);
            return dummyGroup;
        }
    }
    
    // Create a seeded random number generator
    createSeededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }
}

export { WorldGenerator }; 