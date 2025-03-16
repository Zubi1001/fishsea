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
    
    // Create a simple seabed
    createSimpleSeabed();
    
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

// Enhance the createSimpleSeabed function
function createSimpleSeabed() {
    console.log("Creating enhanced seabed");
    
    // Get sand textures (either from placeholder or loaded textures)
    const { sandTexture, sandNormalMap } = createPlaceholderSandTextures();
    
    // Create a large seabed with more segments for better detail
    const seabedGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
    
    // Add more pronounced terrain variation to make it more visible
    const vertices = seabedGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        // Skip the edges to keep them flat (prevents gaps)
        const x = vertices[i];
        const z = vertices[i + 2];
        const distFromCenter = Math.sqrt(x * x + z * z);
        
        if (distFromCenter < 450) {
            // Create more pronounced hills and valleys
            vertices[i + 1] = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 8 +  // Increased amplitude
                             Math.sin(x * 0.04 + 0.5) * Math.cos(z * 0.03 + 0.2) * 5 + // Increased amplitude
                             Math.sin(x * 0.08) * Math.cos(z * 0.08) * 3 + // Added higher frequency detail
                             (Math.random() * 1.0); // Increased random variation
        }
    }
    
    // Create enhanced material with textures and more vibrant colors
    const seabedMaterial = new THREE.MeshStandardMaterial({
        color: 0xf0d7aa, // Brighter sand color
        map: sandTexture,
        normalMap: sandNormalMap,
        normalScale: new THREE.Vector2(3, 3), // Increased normal effect for more visibility
        roughness: 0.6, // Less rough for more light reflection
        metalness: 0.2,
        side: THREE.DoubleSide
    });
    
    const seabed = new THREE.Mesh(seabedGeometry, seabedMaterial);
    seabed.rotation.x = Math.PI / 2;
    seabed.position.y = -20; // Raised from -25 to be more visible
    seabed.receiveShadow = true;
    
    // Add collision detection for the seabed
    seabed.collisionShape = {
        type: 'plane',
        normal: new THREE.Vector3(0, 1, 0),
        constant: 20 // Updated to match new position.y
    };
    collidableObjects.push(seabed);
    
    scene.add(seabed);
    console.log("Enhanced seabed created at y = -20");
    
    // Add seabed decorations
    addSeabedDecorations(seabed);
    
    return seabed;
}

// Update the createPlaceholderSandTextures function for more visible textures
function createPlaceholderSandTextures() {
    console.log("Creating enhanced sand textures");
    
    // Create a canvas for the sand texture
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 512;
    textureCanvas.height = 512;
    const textureCtx = textureCanvas.getContext('2d');
    
    // Fill with sand color - using a more vibrant base
    textureCtx.fillStyle = '#e6c99d';
    textureCtx.fillRect(0, 0, 512, 512);
    
    // Add more pronounced texture patterns
    for (let y = 0; y < 512; y += 2) {
        for (let x = 0; x < 512; x += 2) {
            // Create small sand ripples
            const ripple = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 10;
            const value = Math.random() * 60 - 30 + ripple; // More contrast
            textureCtx.fillStyle = `rgb(${230 + value}, ${201 + value}, ${157 + value})`;
            textureCtx.fillRect(x, y, 2, 2);
        }
    }
    
    // Add some darker spots to simulate pebbles and small rocks
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 4 + 1;
        const darkness = Math.random() * 50 + 30;
        
        textureCtx.fillStyle = `rgba(0, 0, 0, ${darkness/100})`;
        textureCtx.beginPath();
        textureCtx.arc(x, y, size, 0, Math.PI * 2);
        textureCtx.fill();
    }
    
    // Create sand texture
    const sandTexture = new THREE.CanvasTexture(textureCanvas);
    sandTexture.wrapS = sandTexture.wrapT = THREE.RepeatWrapping;
    sandTexture.repeat.set(20, 20);
    
    // Create a canvas for the normal map with more pronounced bumps
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = 512;
    normalCanvas.height = 512;
    const normalCtx = normalCanvas.getContext('2d');
    
    // Fill with neutral normal color (128, 128, 255)
    normalCtx.fillStyle = 'rgb(128, 128, 255)';
    normalCtx.fillRect(0, 0, 512, 512);
    
    // Add more pronounced normal map patterns
    for (let y = 0; y < 512; y += 2) {
        for (let x = 0; x < 512; x += 2) {
            // Create ripple patterns in the normal map
            const ripple = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 15;
            const noise = (Math.random() - 0.5) * 30 + ripple; // More pronounced bumps
            const r = 128 + noise;
            const g = 128 + noise;
            normalCtx.fillStyle = `rgb(${r}, ${g}, 255)`;
            normalCtx.fillRect(x, y, 2, 2);
        }
    }
    
    // Create normal map texture
    const sandNormalMap = new THREE.CanvasTexture(normalCanvas);
    sandNormalMap.wrapS = sandNormalMap.wrapT = THREE.RepeatWrapping;
    sandNormalMap.repeat.set(20, 20);
    
    return { sandTexture, sandNormalMap };
}

// Add this function to create seabed decorations
function addSeabedDecorations(seabed) {
    // Create various seabed elements
    addCorals(seabed);
    addSeaweed(seabed);
    addSeabedCreatures(seabed);
    addRocks(seabed);
}

// Add coral formations to the seabed
function addCorals(seabed) {
    const coralCount = 100; // Number of coral formations
    const coralColors = [
        0xff7f50, // Coral
        0xff6347, // Tomato
        0xfa8072, // Salmon
        0xe9967a, // Dark salmon
        0xf08080, // Light coral
        0xcd5c5c  // Indian red
    ];
    
    for (let i = 0; i < coralCount; i++) {
        // Random position on the seabed
        const x = Math.random() * 900 - 450;
        const z = Math.random() * 900 - 450;
        
        // Get the y position from the seabed at this point (approximate)
        const y = -25 + Math.sin(x * 0.02) * Math.cos(z * 0.02) * 5 +
                 Math.sin(x * 0.04 + 0.5) * Math.cos(z * 0.03 + 0.2) * 3;
        
        // Create a coral formation (group of simple shapes)
        const coralGroup = new THREE.Group();
        
        // Number of branches in this coral
        const branchCount = Math.floor(Math.random() * 5) + 3;
        
        for (let j = 0; j < branchCount; j++) {
            // Choose a coral type (0: tube, 1: branch, 2: fan)
            const coralType = Math.floor(Math.random() * 3);
            
            // Choose a color
            const color = coralColors[Math.floor(Math.random() * coralColors.length)];
            
            let coralGeometry, coralMaterial, coral;
            
            if (coralType === 0) {
                // Tube coral
                coralGeometry = new THREE.CylinderGeometry(
                    0.2 + Math.random() * 0.3, // top radius
                    0.1 + Math.random() * 0.2, // bottom radius
                    1 + Math.random() * 2,     // height
                    8,                         // radial segments
                    3,                         // height segments
                    true                       // open ended
                );
                
                coralMaterial = new THREE.MeshStandardMaterial({
                    color: color,
                    roughness: 0.8,
                    metalness: 0.2,
                    side: THREE.DoubleSide
                });
                
                coral = new THREE.Mesh(coralGeometry, coralMaterial);
                
                // Position and rotate the tube
                coral.position.set(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 0.5,
                    (Math.random() - 0.5) * 2
                );
                coral.rotation.set(
                    Math.random() * 0.3,
                    Math.random() * Math.PI * 2,
                    Math.random() * 0.3
                );
                
            } else if (coralType === 1) {
                // Branching coral
                coral = createBranchingCoral(color);
                coral.position.set(
                    (Math.random() - 0.5) * 2,
                    0,
                    (Math.random() - 0.5) * 2
                );
                
            } else {
                // Fan coral
                coralGeometry = new THREE.PlaneGeometry(
                    1 + Math.random() * 2,
                    1 + Math.random() * 2,
                    5,
                    5
                );
                
                // Add some waviness to the fan
                const vertices = coralGeometry.attributes.position.array;
                for (let k = 0; k < vertices.length; k += 3) {
                    vertices[k + 2] = Math.sin(vertices[k] * 2) * 0.2;
                }
                
                coralMaterial = new THREE.MeshStandardMaterial({
                    color: color,
                    roughness: 0.9,
                    metalness: 0.1,
        side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.9
                });
                
                coral = new THREE.Mesh(coralGeometry, coralMaterial);
                
                // Position and rotate the fan
                coral.position.set(
                    (Math.random() - 0.5) * 2,
                    0.5 + Math.random() * 1.5,
                    (Math.random() - 0.5) * 2
                );
                coral.rotation.set(
                    Math.random() * 0.5 - 0.25,
                    Math.random() * Math.PI * 2,
                    Math.random() * 0.5 - 0.25
                );
            }
            
            coralGroup.add(coral);
        }
        
        // Scale the entire coral formation
        const scale = 0.5 + Math.random() * 1.5;
        coralGroup.scale.set(scale, scale, scale);
        
        // Position the coral formation on the seabed
        coralGroup.position.set(x, y, z);
        
        // Add to scene
        scene.add(coralGroup);
        
        // Add collision for larger corals
        if (scale > 1.2) {
            const collisionObject = {
                collisionShape: {
                    type: 'sphere',
                    center: new THREE.Vector3(x, y + scale * 1.5, z),
                    radius: scale * 1.5
                },
                updateCollisionPosition: false
            };
            collidableObjects.push(collisionObject);
        }
    }
}

// Helper function to create branching coral
function createBranchingCoral(color) {
    const branchGroup = new THREE.Group();
    
    // Create main stem
    const stemGeometry = new THREE.CylinderGeometry(0.1, 0.2, 2, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide
    });
    
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 1;
    branchGroup.add(stem);
    
    // Add branches
    const branchCount = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < branchCount; i++) {
        const branchGeometry = new THREE.CylinderGeometry(0.05, 0.1, 0.5 + Math.random() * 1, 8);
        const branch = new THREE.Mesh(branchGeometry, stemMaterial);
        
        // Position branch along the stem
        const height = 0.5 + Math.random() * 1.5;
        branch.position.y = height;
        
        // Rotate branch outward
        const angle = Math.random() * Math.PI * 2;
        branch.rotation.z = Math.PI / 4 + Math.random() * 0.5;
        branch.rotation.y = angle;
        
        branchGroup.add(branch);
    }
    
    return branchGroup;
}

// Add seaweed to the seabed
function addSeaweed(seabed) {
    const seaweedCount = 200;
    const seaweedColors = [
        0x2e8b57, // Sea green
        0x3cb371, // Medium sea green
        0x20b2aa, // Light sea green
        0x008080, // Teal
        0x008b8b  // Dark cyan
    ];
    
    for (let i = 0; i < seaweedCount; i++) {
        // Random position on the seabed
        const x = Math.random() * 900 - 450;
        const z = Math.random() * 900 - 450;
        
        // Get the y position from the seabed at this point (approximate)
        const y = -25 + Math.sin(x * 0.02) * Math.cos(z * 0.02) * 5 +
                 Math.sin(x * 0.04 + 0.5) * Math.cos(z * 0.03 + 0.2) * 3;
        
        // Create a seaweed strand
        const color = seaweedColors[Math.floor(Math.random() * seaweedColors.length)];
        const height = 5 + Math.random() * 10;
        const segments = Math.floor(height * 2);
        
        const seaweedGeometry = new THREE.PlaneGeometry(1, height, 1, segments);
        
        // Add waviness to the seaweed
        const vertices = seaweedGeometry.attributes.position.array;
        for (let j = 0; j < vertices.length; j += 3) {
            const vertexY = vertices[j + 1];
            if (vertexY > 0) {
                // Increasing wave amplitude as we go up
                const waveStrength = vertexY / height * 0.5;
                vertices[j] += Math.sin(vertexY * 2) * waveStrength;
            }
        }
        
        const seaweedMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        
        const seaweed = new THREE.Mesh(seaweedGeometry, seaweedMaterial);
        
        // Position and rotate the seaweed
        seaweed.position.set(x, y + height / 2, z);
        seaweed.rotation.y = Math.random() * Math.PI * 2;
        
        // Add to scene
        scene.add(seaweed);
        
        // Store reference for animation
        if (!window.seaweedStrands) {
            window.seaweedStrands = [];
        }
        window.seaweedStrands.push({
            mesh: seaweed,
            height: height,
            speed: 0.5 + Math.random() * 0.5,
            phase: Math.random() * Math.PI * 2
        });
    }
}

// Add seabed creatures like starfish, crabs, etc.
function addSeabedCreatures(seabed) {
    // Add starfish
    addStarfish(50);
    
    // Add crabs
    addCrabs(30);
    
    // Add sea urchins
    addSeaUrchins(40);
    
    // Add clams/shells
    addShells(60);
}

// Add starfish to the seabed
function addStarfish(count) {
    const starfishColors = [
        0xff4500, // Orange red
        0xff8c00, // Dark orange
        0xffa500, // Orange
        0xffd700, // Gold
        0xffff00  // Yellow
    ];
    
    for (let i = 0; i < count; i++) {
        // Random position on the seabed
        const x = Math.random() * 900 - 450;
        const z = Math.random() * 900 - 450;
        
        // Get the y position from the seabed at this point (approximate)
        const y = -25 + Math.sin(x * 0.02) * Math.cos(z * 0.02) * 5 +
                 Math.sin(x * 0.04 + 0.5) * Math.cos(z * 0.03 + 0.2) * 3;
        
        // Create a starfish
        const color = starfishColors[Math.floor(Math.random() * starfishColors.length)];
        const size = 0.5 + Math.random() * 1.5;
        
        const starfish = createStarfish(color, size);
        
        // Position and rotate the starfish
        starfish.position.set(x, y + 0.1, z); // Slightly above seabed
        starfish.rotation.set(
            Math.random() * 0.2, // Slight tilt on x
            Math.random() * Math.PI * 2, // Random rotation on y
            Math.random() * 0.2  // Slight tilt on z
        );
        
        // Add to scene
        scene.add(starfish);
    }
}

// Helper function to create a starfish
function createStarfish(color, size) {
    const starfishGroup = new THREE.Group();
    
    // Create the center
    const centerGeometry = new THREE.CircleGeometry(size * 0.3, 16);
    const starfishMaterial = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide
    });
    
    const center = new THREE.Mesh(centerGeometry, starfishMaterial);
    center.rotation.x = -Math.PI / 2; // Lay flat
    starfishGroup.add(center);
    
    // Create 5 arms
    for (let i = 0; i < 5; i++) {
        const armGeometry = new THREE.BufferGeometry();
        
        // Create a tapered arm shape
        const vertices = [];
        const width = size * 0.2;
        const length = size;
        
        vertices.push(0, 0, 0); // Center point
        vertices.push(width, 0, length * 0.3);
        vertices.push(-width, 0, length * 0.3);
        
        vertices.push(width, 0, length * 0.3);
        vertices.push(width * 0.8, 0, length * 0.6);
        vertices.push(-width * 0.8, 0, length * 0.6);
        
        vertices.push(width * 0.8, 0, length * 0.6);
        vertices.push(-width * 0.8, 0, length * 0.6);
        vertices.push(0, 0, length);
        
        armGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        armGeometry.computeVertexNormals();
        
        const arm = new THREE.Mesh(armGeometry, starfishMaterial);
        arm.rotation.y = (i * Math.PI * 2) / 5;
        
        starfishGroup.add(arm);
    }
    
    // Add some bumps on top for texture
    for (let i = 0; i < 10; i++) {
        const bumpGeometry = new THREE.SphereGeometry(size * 0.05, 8, 8);
        const bump = new THREE.Mesh(bumpGeometry, starfishMaterial);
        
        // Random position within the starfish
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * size * 0.7;
        bump.position.set(
            Math.cos(angle) * radius,
            0.05, // Slightly raised
            Math.sin(angle) * radius
        );
        
        starfishGroup.add(bump);
    }
    
    return starfishGroup;
}

// Add crabs to the seabed
function addCrabs(count) {
    const crabColors = [
        0xb22222, // Firebrick
        0xcd5c5c, // Indian red
        0x8b4513, // Saddle brown
        0xa52a2a, // Brown
        0xbc8f8f  // Rosy brown
    ];
    
    for (let i = 0; i < count; i++) {
        // Random position on the seabed
        const x = Math.random() * 900 - 450;
        const z = Math.random() * 900 - 450;
        
        // Get the y position from the seabed at this point (approximate)
        const y = -25 + Math.sin(x * 0.02) * Math.cos(z * 0.02) * 5 +
                 Math.sin(x * 0.04 + 0.5) * Math.cos(z * 0.03 + 0.2) * 3;
        
        // Create a crab
        const color = crabColors[Math.floor(Math.random() * crabColors.length)];
        const size = 0.5 + Math.random() * 1;
        
        const crab = createCrab(color, size);
        
        // Position and rotate the crab
        crab.position.set(x, y + 0.2, z); // Slightly above seabed
        crab.rotation.y = Math.random() * Math.PI * 2; // Random rotation
        
        // Add to scene
        scene.add(crab);
        
        // Add to animated creatures
        if (!window.animatedCreatures) {
            window.animatedCreatures = [];
        }
        
        // Add with random movement pattern
        window.animatedCreatures.push({
            mesh: crab,
            type: 'crab',
            speed: 0.01 + Math.random() * 0.02,
            direction: new THREE.Vector3(
                Math.random() - 0.5,
                0,
                Math.random() - 0.5
            ).normalize(),
            nextDirectionChange: Math.random() * 200 + 100,
            counter: 0
        });
    }
}

// Helper function to create a crab
function createCrab(color, size) {
    const crabGroup = new THREE.Group();
    
    // Create the body
    const bodyGeometry = new THREE.SphereGeometry(size * 0.5, 16, 16);
    bodyGeometry.scale(1.5, 0.6, 1.2);
    
    const crabMaterial = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.3
    });
    
    const body = new THREE.Mesh(bodyGeometry, crabMaterial);
    crabGroup.add(body);
    
    // Create claws
    for (let i = 0; i < 2; i++) {
        const side = i === 0 ? 1 : -1;
        
        // Claw arm
        const armGeometry = new THREE.CylinderGeometry(
            size * 0.1,
            size * 0.1,
            size * 0.6,
            8
        );
        
        const arm = new THREE.Mesh(armGeometry, crabMaterial);
        arm.position.set(side * size * 0.7, 0, size * 0.3);
        arm.rotation.z = side * Math.PI / 4;
        crabGroup.add(arm);
        
        // Claw pincer
        const pincerGeometry = new THREE.SphereGeometry(size * 0.2, 8, 8);
        pincerGeometry.scale(1, 0.6, 0.6);
        
        const pincer = new THREE.Mesh(pincerGeometry, crabMaterial);
        pincer.position.set(
            side * size * 1.1,
            side * size * 0.2,
            size * 0.3
        );
        crabGroup.add(pincer);
    }
    
    // Create legs (4 on each side)
    for (let i = 0; i < 8; i++) {
        const side = i < 4 ? 1 : -1;
        const offset = (i % 4) - 1.5;
        
        // Leg
        const legGeometry = new THREE.CylinderGeometry(
            size * 0.05,
            size * 0.05,
            size * 0.8,
            8
        );
        
        const leg = new THREE.Mesh(legGeometry, crabMaterial);
        leg.position.set(
            side * size * 0.6,
            -size * 0.2,
            offset * size * 0.25
        );
        leg.rotation.z = side * Math.PI / 3;
        crabGroup.add(leg);
    }
    
    // Create eyes
    for (let i = 0; i < 2; i++) {
        const side = i === 0 ? 1 : -1;
        
        // Eye stalk
        const stalkGeometry = new THREE.CylinderGeometry(
            size * 0.03,
            size * 0.03,
            size * 0.2,
            8
        );
        
        const stalk = new THREE.Mesh(stalkGeometry, crabMaterial);
        stalk.position.set(side * size * 0.2, size * 0.3, size * 0.5);
        stalk.rotation.x = Math.PI / 4;
        crabGroup.add(stalk);
        
        // Eye
        const eyeGeometry = new THREE.SphereGeometry(size * 0.05, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.5,
            metalness: 0.5
        });
        
        const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        eye.position.set(
            side * size * 0.2,
            size * 0.4,
            size * 0.6
        );
        crabGroup.add(eye);
    }
    
    return crabGroup;
}

// Add sea urchins to the seabed
function addSeaUrchins(count) {
    const urchinColors = [
        0x800080, // Purple
        0x4b0082, // Indigo
        0x000080, // Navy
        0x191970, // Midnight blue
        0x483d8b  // Dark slate blue
    ];
    
    for (let i = 0; i < count; i++) {
        // Random position on the seabed
        const x = Math.random() * 900 - 450;
        const z = Math.random() * 900 - 450;
        
        // Get the y position from the seabed at this point (approximate)
        const y = -25 + Math.sin(x * 0.02) * Math.cos(z * 0.02) * 5 +
                 Math.sin(x * 0.04 + 0.5) * Math.cos(z * 0.03 + 0.2) * 3;
        
        // Create a sea urchin
        const color = urchinColors[Math.floor(Math.random() * urchinColors.length)];
        const size = 0.5 + Math.random() * 1;
        
        const urchin = createSeaUrchin(color, size);
        
        // Position the urchin
        urchin.position.set(x, y + size * 0.5, z);
        
        // Add to scene
        scene.add(urchin);
        
        // Add collision for larger urchins
        if (size > 0.8) {
            const collisionObject = {
                collisionShape: {
                    type: 'sphere',
                    center: new THREE.Vector3(x, y + size * 0.5, z),
                    radius: size * 0.8
                },
                updateCollisionPosition: false
            };
            collidableObjects.push(collisionObject);
        }
    }
}

// Helper function to create a sea urchin
function createSeaUrchin(color, size) {
    const urchinGroup = new THREE.Group();
    
    // Create the body
    const bodyGeometry = new THREE.SphereGeometry(size * 0.5, 16, 16);
    const urchinMaterial = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.8,
        metalness: 0.2
    });
    
    const body = new THREE.Mesh(bodyGeometry, urchinMaterial);
    urchinGroup.add(body);
    
    // Create spikes
    const spikeCount = Math.floor(50 * size);
    
    for (let i = 0; i < spikeCount; i++) {
        const spikeGeometry = new THREE.CylinderGeometry(
            0.01 * size,
            0.03 * size,
            0.5 * size,
            8
        );
        
        const spike = new THREE.Mesh(spikeGeometry, urchinMaterial);
        
        // Position on the sphere surface
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        
        const x = Math.sin(phi) * Math.cos(theta);
        const y = Math.sin(phi) * Math.sin(theta);
        const z = Math.cos(phi);
        
        spike.position.set(
            x * size * 0.5,
            y * size * 0.5,
            z * size * 0.5
        );
        
        // Orient spike outward
        spike.lookAt(spike.position.clone().multiplyScalar(2));
        
        urchinGroup.add(spike);
    }
    
    return urchinGroup;
}

// Add shells to the seabed
function addShells(count) {
    const shellColors = [
        0xffffff, // White
        0xfffafa, // Snow
        0xf5f5f5, // White smoke
        0xffe4e1, // Misty rose
        0xfaebd7, // Antique white
        0xffdab9  // Peach puff
    ];
    
    for (let i = 0; i < count; i++) {
        // Random position on the seabed
        const x = Math.random() * 900 - 450;
        const z = Math.random() * 900 - 450;
        
        // Get the y position from the seabed at this point (approximate)
        const y = -25 + Math.sin(x * 0.02) * Math.cos(z * 0.02) * 5 +
                 Math.sin(x * 0.04 + 0.5) * Math.cos(z * 0.03 + 0.2) * 3;
        
        // Create a shell
        const color = shellColors[Math.floor(Math.random() * shellColors.length)];
        const size = 0.3 + Math.random() * 0.7;
        
        // Choose between clam and spiral shell
        const shellType = Math.random() > 0.5 ? 'clam' : 'spiral';
        const shell = shellType === 'clam' ? 
                      createClamShell(color, size) : 
                      createSpiralShell(color, size);
        
        // Position and rotate the shell
        shell.position.set(x, y + 0.05, z); // Slightly above seabed
        shell.rotation.y = Math.random() * Math.PI * 2; // Random rotation
        
        // Add to scene
        scene.add(shell);
    }
}

// Helper function to create a clam shell
function createClamShell(color, size) {
    const shellGroup = new THREE.Group();
    
    // Create the shell halves
    const shellGeometry = new THREE.SphereGeometry(size, 16, 16);
    shellGeometry.scale(1, 0.3, 1);
    
    // Cut the sphere in half
    const vertices = shellGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        if (vertices[i + 1] < 0) {
            vertices[i + 1] = 0;
        }
    }
    
    // Add ridges to the shell
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        const dist = Math.sqrt(x * x + z * z);
        if (dist > 0) {
            vertices[i + 1] += Math.sin(dist * 10) * 0.05 * size;
        }
    }
    
    const shellMaterial = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.3
    });
    
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    shellGroup.add(shell);
    
    return shellGroup;
}

// Helper function to create a spiral shell
function createSpiralShell(color, size) {
    const shellGroup = new THREE.Group();
    
    // Create the spiral
    const spiralPoints = [];
    const spiralTurns = 2 + Math.random() * 1;
    const spiralSegments = 50;
    
    for (let i = 0; i <= spiralSegments; i++) {
        const t = i / spiralSegments;
        const angle = t * Math.PI * 2 * spiralTurns;
        const radius = t * size;
        const height = t * size * 0.5;
        
        spiralPoints.push(
            new THREE.Vector3(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            )
        );
    }
    
    // Create a tube geometry along the spiral
    const tubeRadius = size * 0.15;
    const tubeSegments = 8;
    const tubeGeometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(spiralPoints),
        spiralSegments,
        tubeRadius,
        tubeSegments,
        false
    );
    
    const shellMaterial = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.3
    });
    
    const shell = new THREE.Mesh(tubeGeometry, shellMaterial);
    shellGroup.add(shell);
    
    return shellGroup;
}

// Add rocks to the seabed
function addRocks(seabed) {
    const rockCount = 80;
    const rockColors = [
        0x696969, // Dim gray
        0x808080, // Gray
        0xa9a9a9, // Dark gray
        0x778899, // Light slate gray
        0x708090  // Slate gray
    ];
    
    for (let i = 0; i < rockCount; i++) {
        // Random position on the seabed
        const x = Math.random() * 900 - 450;
        const z = Math.random() * 900 - 450;
        
        // Get the y position from the seabed at this point (approximate)
        const y = -25 + Math.sin(x * 0.02) * Math.cos(z * 0.02) * 5 +
                 Math.sin(x * 0.04 + 0.5) * Math.cos(z * 0.03 + 0.2) * 3;
        
        // Create a rock
        const color = rockColors[Math.floor(Math.random() * rockColors.length)];
        const size = 1 + Math.random() * 3;
        
        const rock = createRock(color, size);
        
        // Position the rock
        rock.position.set(x, y, z);
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI
        );
        
        // Add to scene
        scene.add(rock);
        
        // Add collision for larger rocks
        if (size > 1.5) {
            const collisionObject = {
                collisionShape: {
                    type: 'sphere',
                    center: new THREE.Vector3(x, y + size * 0.5, z),
                    radius: size * 0.8
                },
                updateCollisionPosition: false
            };
            collidableObjects.push(collisionObject);
        }
    }
}

// Helper function to create a rock
function createRock(color, size) {
    // Create a basic icosahedron
    const rockGeometry = new THREE.IcosahedronGeometry(size, 1);
    
    // Distort the vertices to make it look more like a rock
    const vertices = rockGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        vertices[i] += (Math.random() - 0.5) * size * 0.2;
        vertices[i + 1] += (Math.random() - 0.5) * size * 0.2;
        vertices[i + 2] += (Math.random() - 0.5) * size * 0.2;
    }
    
    // Update normals
    rockGeometry.computeVertexNormals();
    
    // Create material with some variation
    const colorVariation = Math.random() * 0.2 - 0.1;
    const rockColor = new THREE.Color(color);
    rockColor.r = Math.min(1, Math.max(0, rockColor.r * (1 + colorVariation)));
    rockColor.g = Math.min(1, Math.max(0, rockColor.g * (1 + colorVariation)));
    rockColor.b = Math.min(1, Math.max(0, rockColor.b * (1 + colorVariation)));
    
    const rockMaterial = new THREE.MeshStandardMaterial({
        color: rockColor,
        roughness: 0.9,
        metalness: 0.1
    });
    
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.castShadow = true;
    rock.receiveShadow = true;
    
    return rock;
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
                    vertices[i] = Math.sin(time * speed + phase + vertexY * 0.2) * waveStrength;
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

// Start the application
init(); 