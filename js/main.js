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
    scene.fog = new THREE.FogExp2(0x0077be, 0.001); // Reduced fog density
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, -10);
    
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
    playerFish = new PlayerFish(scene, camera, { x: 0, y: 0, z: 0 });
    
    // Create other fish
    createOtherFish(20);
    
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
    
    for (let i = 0; i < count; i++) {
        const position = {
            x: Math.random() * 160 - 80,
            y: Math.random() * 80 - 40,
            z: Math.random() * 160 - 80
        };
        
        const color = fishColors[Math.floor(Math.random() * fishColors.length)];
        const size = Math.random() * 0.8 + 0.6;
        
        const fish = new Fish(scene, position, color, size);
        fish.maxSpeed = Math.random() * 0.05 + 0.03;
        otherFish.push(fish);
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
    const minFishCount = 20; // Minimum number of fish around the player
    
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
        const fishColors = [
            0xff6600, // Orange
            0xff9900, // Gold
            0xffcc00, // Yellow
            0x66ccff, // Light blue
            0xff6699, // Pink
            0x99ff66, // Lime
            0x9966ff  // Purple
        ];
        
        for (let i = 0; i < fishToAdd; i++) {
            // Spawn fish in a ring around the player
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 100; // Between 100-200 units away
            
            const position = {
                x: playerPos.x + Math.cos(angle) * distance,
                y: Math.random() * 80 - 40,
                z: playerPos.z + Math.sin(angle) * distance
            };
            
            const color = fishColors[Math.floor(Math.random() * fishColors.length)];
            const size = Math.random() * 0.8 + 0.6;
            
            const fish = new Fish(scene, position, color, size);
            fish.maxSpeed = Math.random() * 0.05 + 0.03;
            otherFish.push(fish);
        }
    }
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

// Add this function to generate placeholder sand textures
function createPlaceholderSandTextures() {
    console.log("Creating placeholder sand textures");
    
    // Create a canvas for the sand texture
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 512;
    textureCanvas.height = 512;
    const textureCtx = textureCanvas.getContext('2d');
    
    // Fill with sand color
    textureCtx.fillStyle = '#d2b48c';
    textureCtx.fillRect(0, 0, 512, 512);
    
    // Add some noise for texture
    for (let y = 0; y < 512; y += 2) {
        for (let x = 0; x < 512; x += 2) {
            const value = Math.random() * 40 - 20;
            textureCtx.fillStyle = `rgb(${210 + value}, ${180 + value}, ${140 + value})`;
            textureCtx.fillRect(x, y, 2, 2);
        }
    }
    
    // Create sand texture
    const sandTexture = new THREE.CanvasTexture(textureCanvas);
    sandTexture.wrapS = sandTexture.wrapT = THREE.RepeatWrapping;
    sandTexture.repeat.set(20, 20);
    
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
            const noise = (Math.random() - 0.5) * 20;
            const r = 128 + noise;
            const g = 128 + noise;
            normalCtx.fillStyle = `rgb(${r}, ${g}, 255)`;
            normalCtx.fillRect(x, y, 4, 4);
        }
    }
    
    // Create normal map texture
    const sandNormalMap = new THREE.CanvasTexture(normalCanvas);
    sandNormalMap.wrapS = sandNormalMap.wrapT = THREE.RepeatWrapping;
    sandNormalMap.repeat.set(20, 20);
    
    return { sandTexture, sandNormalMap };
}

// Add this function to your main.js file
function createSimpleSeabed() {
    console.log("Creating simple seabed");
    
    // Create a large, simple seabed
    const seabedGeometry = new THREE.PlaneGeometry(1000, 1000, 20, 20);
    const seabedMaterial = new THREE.MeshPhongMaterial({
        color: 0xd2b48c, // Sand color
        side: THREE.DoubleSide,
        shininess: 5
    });
    
    const seabed = new THREE.Mesh(seabedGeometry, seabedMaterial);
    seabed.rotation.x = Math.PI / 2;
    seabed.position.y = -35; // Position it higher so it's visible
    seabed.receiveShadow = true;
    
    scene.add(seabed);
    console.log("Simple seabed created at y = -35");
    
    return seabed;
}

// Add this function to your main.js file
function addDebugInfo() {
    // Create a div for debug info
    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'absolute';
    debugDiv.style.bottom = '10px';
    debugDiv.style.left = '10px';
    debugDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    debugDiv.style.color = 'white';
    debugDiv.style.padding = '10px';
    debugDiv.style.fontFamily = 'monospace';
    debugDiv.style.fontSize = '12px';
    debugDiv.style.zIndex = '1000';
    debugDiv.id = 'debugInfo';
    document.body.appendChild(debugDiv);
    
    // Update debug info in animation loop
    window.updateDebugInfo = function() {
        if (!playerFish) return;
        
        const pos = playerFish.fishGroup.position;
        const debugInfo = document.getElementById('debugInfo');
        if (debugInfo) {
            debugInfo.innerHTML = `
                Player Position: X: ${pos.x.toFixed(2)}, Y: ${pos.y.toFixed(2)}, Z: ${pos.z.toFixed(2)}<br>
                Camera Position: X: ${camera.position.x.toFixed(2)}, Y: ${camera.position.y.toFixed(2)}, Z: ${camera.position.z.toFixed(2)}<br>
                Speed: ${playerFish.currentSpeed.toFixed(2)}<br>
                Loaded Chunks: ${worldGenerator ? worldGenerator.loadedChunks.size : 'N/A'}<br>
                FPS: ${(1000 / (Date.now() - lastFrameTime)).toFixed(1)}
            `;
        }
        lastFrameTime = Date.now();
    };
    
    let lastFrameTime = Date.now();
}

// Start the application
init(); 