// Scene setup
let scene, camera, renderer;
let playerFish;
let otherFish = [];
let waterSurface;
let worldGenerator;
let waterTexture, waterNormalMap;
let collidableObjects = [];

// Flag to track if animation has started
let animationStarted = false;

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0077be); // Ocean blue
    scene.fog = new THREE.FogExp2(0x0077be, 0.0005); // Reduced fog density
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 0);
    camera.lookAt(0, -25, 10); // Look toward the seabed
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('container').appendChild(renderer.domElement);
    
    // Add lights
    addLights();
    
    // Create water surface
    createWaterSurface();
    
    // Create seabed
    createSeabed();
    
    // Initialize world generator
    worldGenerator = new WorldGenerator(scene);
    
    // Create player fish
    playerFish = new PlayerFish(scene, camera, { x: 0, y: 0, z: 10 }); // Position above seabed
    
    // Create other fish
    createOtherFish(50);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();

    // Add after creating worldGenerator in init()
    window.animatedCreatures = []; // Initialize the array
    createSeabedCreatures(); // Add new function to create crabs
}

function addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);
    
    // Directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffbb, 1);
    sunLight.position.set(0, 50, 0);
    sunLight.castShadow = true;
    
    // Set up shadow properties
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    
    scene.add(sunLight);
    
    // Add underwater light rays
    createLightRays();
    
    // Add this inside the addLights function
    const seabedLight = new THREE.DirectionalLight(0xffffff, 0.8);
    seabedLight.position.set(0, 10, 0);
    seabedLight.target.position.set(0, -25, 0);
    seabedLight.castShadow = true;
    scene.add(seabedLight);
    scene.add(seabedLight.target);
}

function createLightRays() {
    // TODO: Add volumetric light rays for underwater effect
    // This would require a more advanced shader setup
}

function createWaterSurface() {
    console.log("Creating water surface with fallback textures");
    
    // Create fallback textures directly
    const { waterTexture, waterNormalMap } = createPlaceholderWaterTextures();
    
    // Create water surface that follows the player
    const waterGeometry = new THREE.PlaneGeometry(400, 400, 40, 40);
    const waterMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff, // White to let the texture show properly
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        map: waterTexture,
        normalMap: waterNormalMap,
        normalScale: new THREE.Vector2(0.5, 0.5),
        shininess: 100,
        specular: 0x111111
    });
    
    waterSurface = new THREE.Mesh(waterGeometry, waterMaterial);
    waterSurface.rotation.x = Math.PI / 2;
    waterSurface.position.y = 45;
    scene.add(waterSurface);
}

function createSeabed() {
    // Create a large plane for the seabed
    const seabedGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
    
    // Create a sandy material
    const seabedMaterial = new THREE.MeshStandardMaterial({
        color: 0xf0d7aa,  // Sandy color
        roughness: 0.8,   // Make it rough like sand
        metalness: 0.2,   // Slight shine for underwater look
        side: THREE.DoubleSide
    });
    
    const seabed = new THREE.Mesh(seabedGeometry, seabedMaterial);
    
    // Rotate and position the seabed
    seabed.rotation.x = -Math.PI / 2;  // Rotate to be horizontal
    seabed.position.y = -40;           // Match the base height of rocks
    
    // Enable shadows
    seabed.receiveShadow = true;
    
    // Add collision detection for the seabed
    seabed.collisionShape = {
        type: 'plane',
        normal: new THREE.Vector3(0, 1, 0),
        constant: -25  // Match the y position
    };
    collidableObjects.push(seabed);
    
    scene.add(seabed);
}

// Make sure this function is defined and creates both textures
function createPlaceholderWaterTextures() {
    console.log("Creating placeholder water textures");
    
    // Create a canvas for the water texture
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 512;
    textureCanvas.height = 512;
    const textureCtx = textureCanvas.getContext('2d');
    
    // Create a blue gradient
    const gradient = textureCtx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#0066aa');
    gradient.addColorStop(0.5, '#0099ff');
    gradient.addColorStop(1, '#0066aa');
    
    textureCtx.fillStyle = gradient;
    textureCtx.fillRect(0, 0, 512, 512);
    
    // Add some wave patterns
    textureCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    textureCtx.lineWidth = 2;
    
    for (let i = 0; i < 20; i++) {
        textureCtx.beginPath();
        for (let x = 0; x < 512; x += 10) {
            const y = 100 + i * 20 + Math.sin(x * 0.05) * 10;
            if (x === 0) {
                textureCtx.moveTo(x, y);
            } else {
                textureCtx.lineTo(x, y);
            }
        }
        textureCtx.stroke();
    }
    
    // Create water texture
    const waterTexture = new THREE.CanvasTexture(textureCanvas);
    waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;
    waterTexture.repeat.set(5, 5);
    
    // Create a canvas for the normal map
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = 512;
    normalCanvas.height = 512;
    const normalCtx = normalCanvas.getContext('2d');
    
    // Fill with neutral normal color (128, 128, 255)
    normalCtx.fillStyle = 'rgb(128, 128, 255)';
    normalCtx.fillRect(0, 0, 512, 512);
    
    // Add some normal map patterns
    for (let y = 0; y < 512; y += 4) {
        for (let x = 0; x < 512; x += 4) {
            const noise = Math.sin(x * 0.01) * Math.cos(y * 0.01) * 20;
            const r = 128 + noise;
            const g = 128 + noise;
            normalCtx.fillStyle = `rgb(${r}, ${g}, 255)`;
            normalCtx.fillRect(x, y, 4, 4);
        }
    }
    
    // Create normal map texture
    const waterNormalMap = new THREE.CanvasTexture(normalCanvas);
    waterNormalMap.wrapS = waterNormalMap.wrapT = THREE.RepeatWrapping;
    waterNormalMap.repeat.set(5, 5);
    
    return { waterTexture, waterNormalMap };
}

function createOtherFish(count) {
    const fishColors = [
        0xff6600, // Orange
        0xff9900, // Gold
        0xffcc00, // Yellow
        0x66ccff, // Light blue
        0xff6699, // Pink
        0x99ff66, // Lime
        0x9966ff  // Purple
    ];
    
    // Create regular fish (70% of total)
    const regularFishCount = Math.floor(count * 0.7);
    
    // Create fish in schools (groups)
    const schoolCount = Math.floor(regularFishCount / 5); // Create about 5 fish per school
    
    for (let s = 0; s < schoolCount; s++) {
        // Choose a random center point for this school
        const schoolCenter = {
            x: Math.random() * 160 - 80,
            y: Math.random() * 80 - 40,
            z: Math.random() * 160 - 80
        };
        
        // Choose a common color and similar size for this school
        const schoolColor = fishColors[Math.floor(Math.random() * fishColors.length)];
        const baseSize = Math.random() * 0.8 + 0.6; // Base size between 0.6 and 1.4
        const fishType = Math.floor(Math.random() * 3); // Same fish type for the school
        
        // Create 3-7 fish per school
        const fishInSchool = Math.floor(Math.random() * 5) + 3;
        
        for (let i = 0; i < fishInSchool; i++) {
            // Position fish near the school center
            const position = {
                x: schoolCenter.x + (Math.random() * 10 - 5),
                y: schoolCenter.y + (Math.random() * 10 - 5),
                z: schoolCenter.z + (Math.random() * 10 - 5)
            };
            
            // Slight variation in size and color
            const size = baseSize * (0.9 + Math.random() * 0.2); // ±10% size variation
            const colorVariation = Math.random() * 0.1 - 0.05; // ±5% color variation
            
            // Create a slightly modified color
            const color = new THREE.Color(schoolColor);
            color.r = Math.min(1, Math.max(0, color.r * (1 + colorVariation)));
            color.g = Math.min(1, Math.max(0, color.g * (1 + colorVariation)));
            color.b = Math.min(1, Math.max(0, color.b * (1 + colorVariation)));
            
            const fish = new Fish(scene, position, color.getHex(), size);
            fish.maxSpeed = (Math.random() * 0.03 + 0.04) * (1.5 - size/2);
            fish.fishType = fishType;
            
            otherFish.push(fish);
        }
    }
    
    // Create some solitary fish to fill the count
    const remainingFish = regularFishCount - otherFish.length;
    for (let i = 0; i < remainingFish; i++) {
        const position = {
            x: Math.random() * 160 - 80,
            y: Math.random() * 80 - 40,
            z: Math.random() * 160 - 80
        };
        
        const color = fishColors[Math.floor(Math.random() * fishColors.length)];
        const size = Math.random() * 1.2 + 0.4; // Size between 0.4 and 1.6
        
        const fish = new Fish(scene, position, color, size);
        fish.maxSpeed = (Math.random() * 0.05 + 0.03) * (1.5 - size/2);
        fish.fishType = Math.floor(Math.random() * 3);
        
        otherFish.push(fish);
    }
    
    // Create sharks (10% of total)
    const sharkCount = Math.floor(count * 0.1);
    for (let i = 0; i < sharkCount; i++) {
        const position = {
            x: Math.random() * 200 - 100,
            y: Math.random() * 60 - 30,
            z: Math.random() * 200 - 100
        };
        
        // Sharks are usually gray/blue
        const sharkColors = [0x607d8b, 0x455a64, 0x546e7a, 0x78909c];
        const color = sharkColors[Math.floor(Math.random() * sharkColors.length)];
        
        // Sharks are larger
        const size = Math.random() * 1.5 + 2.5; // Size between 2.5 and 4.0
        
        const shark = new Shark(scene, position, color, size);
        shark.maxSpeed = Math.random() * 0.04 + 0.02; // Slightly slower but more menacing
        
        otherFish.push(shark);
    }
    
    // Create octopuses (10% of total)
    const octopusCount = Math.floor(count * 0.1);
    for (let i = 0; i < octopusCount; i++) {
        const position = {
            x: Math.random() * 160 - 80,
            y: -30 + Math.random() * 10, // Closer to the seabed
            z: Math.random() * 160 - 80
        };
        
        // Octopus colors
        const octopusColors = [0x800080, 0x4b0082, 0x8b008b, 0xff00ff];
        const color = octopusColors[Math.floor(Math.random() * octopusColors.length)];
        
        const size = Math.random() * 1.0 + 1.5; // Size between 1.5 and 2.5
        
        const octopus = new Octopus(scene, position, color, size);
        octopus.maxSpeed = Math.random() * 0.02 + 0.01; // Slower movement
        
        otherFish.push(octopus);
    }
    
    // Create jellyfish (10% of total)
    const jellyfishCount = Math.floor(count * 0.1);
    for (let i = 0; i < jellyfishCount; i++) {
        const position = {
            x: Math.random() * 160 - 80,
            y: Math.random() * 60 - 10, // More in upper waters
            z: Math.random() * 160 - 80
        };
        
        // Jellyfish colors - translucent blues and pinks
        const jellyfishColors = [0x88ccff, 0xffaacc, 0xaaddff, 0xffccee];
        const color = jellyfishColors[Math.floor(Math.random() * jellyfishColors.length)];
        
        const size = Math.random() * 0.8 + 0.8; // Size between 0.8 and 1.6
        
        const jellyfish = new Jellyfish(scene, position, color, size);
        jellyfish.maxSpeed = Math.random() * 0.01 + 0.005; // Very slow drifting
        
        otherFish.push(jellyfish);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update player fish
    playerFish.update();
    
    // Check for collisions
    playerFish.checkCollisions(collidableObjects);
    
    // Update world generator based on player position
    worldGenerator.update(playerFish.fishGroup.position);
    
    // Update other fish
    updateOtherFish();
    
    // Update water surface to follow player
    updateWaterSurface();
    
    // Animate seaweed
    animateSeaweed();
    
    // Animate seabed creatures
    animateSeabedCreatures();
    
    // Update debug info
    if (window.updateDebugInfo) {
        window.updateDebugInfo();
    }
    
    // Render scene
    renderer.render(scene, camera);
}

function updateOtherFish() {
    // Update existing fish
    otherFish.forEach(fish => fish.update());
    
    // Check if we need to spawn new fish or remove distant ones
    const playerPos = playerFish.fishGroup.position;
    const maxDistance = 300; // Maximum distance before fish are removed
    const minFishCount = 50; // Minimum number of fish around the player
    
    // Remove fish that are too far away
    otherFish = otherFish.filter(fish => {
        const distance = fish.fishGroup.position.distanceTo(playerPos);
        if (distance > maxDistance) {
            scene.remove(fish.fishGroup);
            return false;
        }
        return true;
    });
    
    // Spawn new fish if needed
    if (otherFish.length < minFishCount) {
        const fishToAdd = minFishCount - otherFish.length;
        
        // Spawn a mix of different creatures
        for (let i = 0; i < fishToAdd; i++) {
            // Spawn creatures in a ring around the player
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 100; // Between 100-200 units away
            
            // Determine creature type based on probability
            const creatureType = Math.random();
            
            if (creatureType < 0.7) {
                // 70% chance for regular fish
                spawnRegularFish(playerPos, angle, distance);
            } else if (creatureType < 0.8) {
                // 10% chance for sharks
                spawnShark(playerPos, angle, distance);
            } else if (creatureType < 0.9) {
                // 10% chance for octopuses
                spawnOctopus(playerPos, angle, distance);
            } else {
                // 10% chance for jellyfish
                spawnJellyfish(playerPos, angle, distance);
            }
        }
    }
}

// Helper functions to spawn different creature types
function spawnRegularFish(playerPos, angle, distance) {
    const fishColors = [
        0xff6600, // Orange
        0xff9900, // Gold
        0xffcc00, // Yellow
        0x66ccff, // Light blue
        0xff6699, // Pink
        0x99ff66, // Lime
        0x9966ff, // Purple
        0x00ffff, // Cyan
        0xff0000, // Red
        0x00ff00, // Green
        0x0000ff  // Blue
    ];
    
    const position = {
        x: playerPos.x + Math.cos(angle) * distance,
        y: Math.random() * 80 - 40,
        z: playerPos.z + Math.sin(angle) * distance
    };
    
    const color = fishColors[Math.floor(Math.random() * fishColors.length)];
    const size = Math.random() * 1.2 + 0.4; // Size between 0.4 and 1.6
    
    const fish = new Fish(scene, position, color, size);
    fish.maxSpeed = (Math.random() * 0.05 + 0.03) * (1.5 - size/2);
    fish.fishType = Math.floor(Math.random() * 3); // 0, 1, or 2 for different fish shapes
    
    otherFish.push(fish);
}

function spawnShark(playerPos, angle, distance) {
    const position = {
        x: playerPos.x + Math.cos(angle) * distance,
        y: Math.random() * 60 - 30,
        z: playerPos.z + Math.sin(angle) * distance
    };
    
    // Sharks are usually gray/blue
    const sharkColors = [0x607d8b, 0x455a64, 0x546e7a, 0x78909c];
    const color = sharkColors[Math.floor(Math.random() * sharkColors.length)];
    
    // Sharks are larger
    const size = Math.random() * 1.5 + 2.5; // Size between 2.5 and 4.0
    
    const shark = new Shark(scene, position, color, size);
    shark.maxSpeed = Math.random() * 0.04 + 0.02; // Slightly slower but more menacing
    
    otherFish.push(shark);
}

function spawnOctopus(playerPos, angle, distance) {
    const position = {
        x: playerPos.x + Math.cos(angle) * distance,
        y: -30 + Math.random() * 10, // Closer to the seabed
        z: playerPos.z + Math.sin(angle) * distance
    };
    
    // Octopus colors
    const octopusColors = [0x800080, 0x4b0082, 0x8b008b, 0xff00ff];
    const color = octopusColors[Math.floor(Math.random() * octopusColors.length)];
    
    const size = Math.random() * 1.0 + 1.5; // Size between 1.5 and 2.5
    
    const octopus = new Octopus(scene, position, color, size);
    octopus.maxSpeed = Math.random() * 0.02 + 0.01; // Slower movement
    
    otherFish.push(octopus);
}

function spawnJellyfish(playerPos, angle, distance) {
    const position = {
        x: playerPos.x + Math.cos(angle) * distance,
        y: Math.random() * 60 - 10, // More in upper waters
        z: playerPos.z + Math.sin(angle) * distance
    };
    
    // Jellyfish colors - translucent blues and pinks
    const jellyfishColors = [0x88ccff, 0xffaacc, 0xaaddff, 0xffccee];
    const color = jellyfishColors[Math.floor(Math.random() * jellyfishColors.length)];
    
    const size = Math.random() * 0.8 + 0.8; // Size between 0.8 and 1.6
    
    const jellyfish = new Jellyfish(scene, position, color, size);
    jellyfish.maxSpeed = Math.random() * 0.01 + 0.005; // Very slow drifting
    
    otherFish.push(jellyfish);
}

function updateWaterSurface() {
    if (waterSurface) {
        // Move water surface to follow player (only x and z)
        waterSurface.position.x = playerFish.fishGroup.position.x;
        waterSurface.position.z = playerFish.fishGroup.position.z;
        
        // Animate water texture
        const time = Date.now() * 0.001;
        if (waterTexture) {
            waterTexture.offset.x = time * 0.05;
            waterTexture.offset.y = time * 0.03;
        }
        if (waterNormalMap) {
            waterNormalMap.offset.x = time * 0.03;
            waterNormalMap.offset.y = time * 0.02;
        }
        
        // Simple water animation - adjust vertices for wave effect
        const vertices = waterSurface.geometry.attributes.position.array;
        
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            vertices[i + 2] = Math.sin(time * 0.5 + x * 0.05) * 2 + 
                             Math.cos(time * 0.3 + z * 0.05) * 2;
        }
        
        waterSurface.geometry.attributes.position.needsUpdate = true;
    }
}

// Function to animate seaweed
function animateSeaweed() {
    if (window.seaweedStrands) {
        const time = Date.now() * 0.001;
        
        window.seaweedStrands.forEach(seaweed => {
            const mesh = seaweed.mesh;
            const height = seaweed.height;
            const speed = seaweed.speed;
            const phase = seaweed.phase;
            
            // Skip if mesh is no longer in the scene
            if (!mesh || !mesh.geometry) return;
            
            // Animate the vertices to create a swaying motion
            const vertices = mesh.geometry.attributes.position.array;
            
            for (let i = 0; i < vertices.length; i += 3) {
                const vertexY = vertices[i + 1];
                if (vertexY > 0) {
                    // Increasing wave amplitude as we go up
                    const waveStrength = vertexY / height * 0.5;
                    vertices[i] += Math.sin(time * speed + phase + vertexY * 0.2) * waveStrength;
                }
            }
            
            mesh.geometry.attributes.position.needsUpdate = true;
        });
    }
}

// Function to animate seabed creatures
function animateSeabedCreatures() {
    if (window.animatedCreatures) {
        window.animatedCreatures.forEach(creature => {
            // Skip if mesh is no longer in the scene
            if (!creature.mesh) return;
            
            creature.counter++;
            
            // Change direction occasionally
            if (creature.counter >= creature.nextDirectionChange) {
                creature.direction = new THREE.Vector3(
                    Math.random() - 0.5,
                    0,
                    Math.random() - 0.5
                ).normalize();
                
                creature.nextDirectionChange = Math.random() * 200 + 100;
                creature.counter = 0;
            }
            
            // Move the creature
            if (creature.type === 'crab') {
                // Crabs move sideways
                const forward = new THREE.Vector3(0, 0, 1);
                forward.applyQuaternion(creature.mesh.quaternion);
                
                const sideways = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
                sideways.normalize();
                
                // Determine if moving left or right
                const moveDirection = Math.random() > 0.5 ? sideways : sideways.clone().negate();
                
                // Move the crab
                creature.mesh.position.add(moveDirection.multiplyScalar(creature.speed));
                
                // Rotate to face movement direction occasionally
                if (Math.random() < 0.02) {
                    creature.mesh.lookAt(
                        creature.mesh.position.clone().add(creature.direction)
                    );
                }
                
                // Animate legs (simple up/down motion)
                if (creature.mesh.children) {
                    for (let i = 4; i < 12; i++) { // Legs are children 4-11
                        if (creature.mesh.children[i]) {
                            creature.mesh.children[i].rotation.x = Math.sin(Date.now() * 0.01 + i) * 0.1;
                        }
                    }
                }
            }
        });
    }
}

// Add this new function
function createSeabedCreatures() {
    // Create 5-10 crabs
    const crabCount = Math.floor(Math.random() * 6) + 5;
    
    for (let i = 0; i < crabCount; i++) {
        const position = {
            x: Math.random() * 160 - 80,
            y: -35, // Place on seabed
            z: Math.random() * 160 - 80
        };
        
        // Create crab mesh (you'll need to implement this)
        const crab = new Crab(scene, position);
        
        // Add to animated creatures
        window.animatedCreatures.push({
            mesh: crab.mesh,
            type: 'crab',
            speed: 0.05,
            direction: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
            counter: 0,
            nextDirectionChange: Math.random() * 200 + 100
        });
    }
}

// Start the application
init(); 