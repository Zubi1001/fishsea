import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Fish } from './entities/Fish.js';
import { Shark } from './entities/shark.js';
import { Octopus } from './entities/octopus.js';
import { Jellyfish } from './entities/jellyfish.js';
import { state } from './state/globalState.js';
import { PlayerFish } from './PlayerFish.js';
import { WorldGenerator } from './WorldGenerator.js';

// Mobile detection and control variables - add these globally
window.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Uncomment the line below to force mobile mode for testing on desktop
// window.isMobile = true;

window.joystickControls = null;
window.actionButtons = {};
window.touchState = {
    moving: false,
    lookingAround: false,
    lastX: 0,
    lastY: 0
};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0077be); // Ocean blue background

// Add underwater fog for depth effect
const fogColor = new THREE.Color(0x001e4d); // Darker blue for depth
const underwaterFog = new THREE.FogExp2(fogColor, 0.002);
scene.fog = underwaterFog;

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0077be);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
directionalLight.position.set(-50, 100, -50);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Add a second directional light from another angle
const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.5);
secondaryLight.position.set(-1, 0.5, -1);
scene.add(secondaryLight);

// Create seabed
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
    seabed.position.y = -40;           // Position at bottom

    // Enable shadows
    seabed.receiveShadow = true;
    
    // Add collision detection for the seabed
    seabed.collisionShape = {
        type: 'plane',
        normal: new THREE.Vector3(0, 1, 0),
        constant: -40  // Match the actual y position
    };
    state.collidableObjects.push(seabed);

    scene.add(seabed);
    
    return seabed;
}

// Create water surface
function createWaterSurface() {
    const waterGeometry = new THREE.PlaneGeometry(400, 400, 100, 100);
    
    // Create simple water material
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x0077be,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });

    const waterSurface = new THREE.Mesh(waterGeometry, waterMaterial);
    waterSurface.rotation.x = -Math.PI / 2;
    waterSurface.position.y = 45;
    scene.add(waterSurface);
    
    return waterSurface;
}

// Create player fish
let playerFish;
function createPlayerFish() {
    playerFish = new PlayerFish(scene, camera, { x: 0, y: 15, z: 0 });
    return playerFish;
}

// Create fish
function createFishes() {
    // Define a wider world area for fish to spawn
    const worldSize = {
        width: 500,  // Wider area instead of just -50 to 50
        height: 80,  // More vertical space
        depth: 500   // Deeper area
    };
    
    // Randomize fish counts
    const fishCounts = {
        regularFish: 60 + Math.floor(Math.random() * 40), // 60-100 regular fish
        sharks: 5 + Math.floor(Math.random() * 5),        // 5-10 sharks
        octopuses: 8 + Math.floor(Math.random() * 7),     // 8-15 octopuses
        jellyfish: 15 + Math.floor(Math.random() * 15)    // 15-30 jellyfish
    };
    
    console.log(`Generating sea life: ${fishCounts.regularFish} fish, ${fishCounts.sharks} sharks, ${fishCounts.octopuses} octopuses, ${fishCounts.jellyfish} jellyfish`);
    
    // Helper to generate a random position away from player start
    function getRandomPosition(minDistance = 0, heightRange = { min: 0, max: 30 }) {
        // Player starts at 0,15,0
        let position;
        let distanceFromCenter;
        
        // Keep generating positions until we find one that's far enough from the center
        do {
            position = {
                x: Math.random() * worldSize.width - worldSize.width/2,
                y: heightRange.min + Math.random() * (heightRange.max - heightRange.min),
                z: Math.random() * worldSize.depth - worldSize.depth/2
            };
            
            // Calculate distance from origin (player start)
            distanceFromCenter = Math.sqrt(position.x * position.x + position.z * position.z);
        } while (distanceFromCenter < minDistance);
        
        return position;
    }
    
    // Create regular fish - spread out over a large area
    for (let i = 0; i < fishCounts.regularFish; i++) {
        const position = getRandomPosition(30); // At least 30 units from center
        const color = Math.random() * 0xffffff;
        const size = 0.8 + Math.random() * 0.4;
        const fish = new Fish(scene, position, color, size);
        state.otherFish.push(fish);
    }
    
    console.log("Creating sharks with 3D models...");
    
    // Create sharks - using 3D model now
    const sharkColors = [
        0xff4500, // Orange-red
        0x00ff00, // Bright green 
        0x00ffff, // Cyan
        0xff00ff  // Magenta
    ];
    
    // Create sharks spread throughout the world
    for (let i = 0; i < fishCounts.sharks; i++) {
        // Position sharks at varied depths but mostly in mid-water
        const position = getRandomPosition(40, { min: 5, max: 35 });
        
        // Pick a random shark color
        const color = sharkColors[Math.floor(Math.random() * sharkColors.length)];
        // Varied sizes
        const size = 3 + Math.random() * 2;
        
        console.log(`Creating shark ${i+1} at position:`, position);
        
        const shark = new Shark(scene, position, color, size);
        // Sharks should move slower
        shark.maxSpeed = 0.02;
        state.otherFish.push(shark);
    }
    
    // Create octopuses - mostly near the seabed
    for (let i = 0; i < fishCounts.octopuses; i++) {
        const position = getRandomPosition(0, { min: -30, max: -10 }); // Near seabed
        const color = 0x800080 + Math.random() * 0x400040;
        const octopus = new Octopus(scene, position, color);
        state.otherFish.push(octopus);
    }
    
    // Create jellyfish - in upper water levels
    for (let i = 0; i < fishCounts.jellyfish; i++) {
        const position = getRandomPosition(0, { min: 10, max: 40 }); // Upper waters
        const color = 0xffcce6 + Math.random() * 0x001133; // Light pink color
        const jellyfish = new Jellyfish(scene, position, color);
        state.otherFish.push(jellyfish);
    }
}

// Initialize world generator
const worldGenerator = new WorldGenerator(scene);

// Create underwater elements
const seabed = createSeabed();
const waterSurface = createWaterSurface();
createPlayerFish();
createFishes();

// Add underwater particles
createUnderwaterParticles();

// Set up mobile controls if needed
setupMobileControls();

// Position camera
camera.position.set(0, 15, 30);

// Create underwater particle system for floating debris and bubbles
function createUnderwaterParticles() {
    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = Math.random() * 200 - 100;
        positions[i + 1] = Math.random() * 100 - 50;
        positions[i + 2] = Math.random() * 200 - 100;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.2,
        transparent: true,
        opacity: 0.6,
        color: 0xffffff,
        blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
    
    // Store the particle system in the state
    state.particleSystem = particleSystem;
    
    return particleSystem;
}

// Function to set up mobile controls
function setupMobileControls() {
    if (!window.isMobile) return; // Only setup on mobile devices
    
    console.log("Setting up mobile controls");
    
    // Create container for mobile controls
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'mobile-controls';
    controlsContainer.style.position = 'fixed';
    controlsContainer.style.bottom = '10px';
    controlsContainer.style.left = '0';
    controlsContainer.style.width = '100%';
    controlsContainer.style.height = '200px';
    controlsContainer.style.display = 'flex';
    controlsContainer.style.justifyContent = 'space-between';
    controlsContainer.style.pointerEvents = 'auto'; // Let events pass through this container
    controlsContainer.style.zIndex = '999'; // Make sure it appears above the game
    document.body.appendChild(controlsContainer);
    
    // Create left joystick for movement
    const leftJoystick = document.createElement('div');
    leftJoystick.id = 'left-joystick';
    leftJoystick.style.width = '120px';
    leftJoystick.style.height = '120px';
    leftJoystick.style.borderRadius = '60px';
    leftJoystick.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    leftJoystick.style.border = '2px solid white';
    leftJoystick.style.margin = '10px';
    leftJoystick.style.position = 'relative';
    leftJoystick.style.zIndex = '1000';
    leftJoystick.style.pointerEvents = 'auto';
    controlsContainer.appendChild(leftJoystick);
    
    // Create joystick handle with better visibility
    const leftHandle = document.createElement('div');
    leftHandle.id = 'left-handle';
    leftHandle.style.width = '60px';
    leftHandle.style.height = '60px';
    leftHandle.style.borderRadius = '30px';
    leftHandle.style.backgroundColor = 'rgba(0, 150, 255, 0.8)';
    leftHandle.style.border = '2px solid white';
    leftHandle.style.position = 'absolute';
    leftHandle.style.top = '30px';
    leftHandle.style.left = '30px';
    leftHandle.style.zIndex = '1001';
    leftHandle.style.pointerEvents = 'none';
    leftJoystick.appendChild(leftHandle);
    
    // Create action buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = 'buttons-container';
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.flexDirection = 'column';
    buttonsContainer.style.justifyContent = 'flex-end';
    buttonsContainer.style.margin = '10px';
    buttonsContainer.style.pointerEvents = 'auto';
    controlsContainer.appendChild(buttonsContainer);
    
    // Create boost button
    const boostButton = createActionButton('boost', 'BOOST');
    buttonsContainer.appendChild(boostButton);
    
    // Create up button
    const upButton = createActionButton('up', '↑');
    buttonsContainer.appendChild(upButton);
    
    // Create down button
    const downButton = createActionButton('down', '↓');
    buttonsContainer.appendChild(downButton);
    
    // Setup touch events for joystick
    setupJoystickEvents(leftJoystick, leftHandle);
    
    // Setup action button events
    setupActionButtonEvents();
    
    // Setup swipe for camera control (on the rest of the screen)
    setupCameraSwipeControls();
}

// Helper function to create action buttons
function createActionButton(id, text) {
    const button = document.createElement('div');
    button.id = id + '-button';
    button.className = 'mobile-action-button';
    button.innerText = text;
    button.style.width = '80px';
    button.style.height = '50px';
    button.style.borderRadius = '25px';
    button.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
    button.style.color = 'white';
    button.style.textAlign = 'center';
    button.style.lineHeight = '50px';
    button.style.fontWeight = 'bold';
    button.style.margin = '5px';
    button.style.userSelect = 'none';
    
    // Store reference to button
    window.actionButtons[id] = button;
    
    return button;
}

// Setup joystick events
function setupJoystickEvents(joystick, handle) {
    const joystickRect = joystick.getBoundingClientRect();
    const centerX = joystickRect.width / 2;
    const centerY = joystickRect.height / 2;
    const maxDistance = joystickRect.width / 2 - handle.offsetWidth / 2;
    
    // Handle joystick touch start
    joystick.addEventListener('touchstart', function(e) {
        e.preventDefault();
        handleJoystickTouch(e.touches[0].clientX - joystickRect.left, e.touches[0].clientY - joystickRect.top);
    });
    
    // Handle joystick touch move
    joystick.addEventListener('touchmove', function(e) {
        e.preventDefault();
        handleJoystickTouch(e.touches[0].clientX - joystickRect.left, e.touches[0].clientY - joystickRect.top);
    });
    
    // Handle joystick touch end
    joystick.addEventListener('touchend', function(e) {
        e.preventDefault();
        // Reset joystick position
        handle.style.top = centerY - handle.offsetHeight / 2 + 'px';
        handle.style.left = centerX - handle.offsetWidth / 2 + 'px';
        
        // Reset player inputs
        if (playerFish) {
            playerFish.input.forward = false;
            playerFish.input.backward = false;
            playerFish.input.left = false;
            playerFish.input.right = false;
        }
    });
    
    function handleJoystickTouch(x, y) {
        // Calculate distance from center
        let deltaX = x - centerX;
        let deltaY = y - centerY;
        let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // If distance is greater than max, normalize
        if (distance > maxDistance) {
            deltaX = deltaX / distance * maxDistance;
            deltaY = deltaY / distance * maxDistance;
            distance = maxDistance;
        }
        
        // Move handle
        handle.style.left = centerX + deltaX - handle.offsetWidth / 2 + 'px';
        handle.style.top = centerY + deltaY - handle.offsetHeight / 2 + 'px';
        
        // Calculate direction for player movement
        if (playerFish) {
            // Forward/backward based on Y position
            const forwardAmount = -deltaY / maxDistance; // Invert Y axis (up is forward)
            playerFish.input.forward = forwardAmount > 0.2;
            playerFish.input.backward = forwardAmount < -0.2;
            
            // Left/right based on X position
            const rightAmount = deltaX / maxDistance;
            playerFish.input.left = rightAmount < -0.2;
            playerFish.input.right = rightAmount > 0.2;
        }
    }
}

// Setup action button events
function setupActionButtonEvents() {
    if (!playerFish) return;
    
    // Boost button
    window.actionButtons.boost.addEventListener('touchstart', function(e) {
        e.preventDefault();
        playerFish.input.boost = true;
        this.style.backgroundColor = 'rgba(255, 128, 0, 0.7)';
    });
    
    window.actionButtons.boost.addEventListener('touchend', function(e) {
        e.preventDefault();
        playerFish.input.boost = false;
        this.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
    });
    
    // Up button
    window.actionButtons.up.addEventListener('touchstart', function(e) {
        e.preventDefault();
        playerFish.input.quickUp = true;
        this.style.backgroundColor = 'rgba(0, 255, 255, 0.7)';
    });
    
    window.actionButtons.up.addEventListener('touchend', function(e) {
        e.preventDefault();
        playerFish.input.quickUp = false;
        this.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
    });
    
    // Down button
    window.actionButtons.down.addEventListener('touchstart', function(e) {
        e.preventDefault();
        playerFish.input.quickDown = true;
        this.style.backgroundColor = 'rgba(0, 128, 255, 0.7)';
    });
    
    window.actionButtons.down.addEventListener('touchend', function(e) {
        e.preventDefault();
        playerFish.input.quickDown = false;
        this.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
    });
}

// Setup camera swipe controls
function setupCameraSwipeControls() {
    // Create a style element for mobile optimizations
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        body { touch-action: none; }
        #container { touch-action: none; }
    `;
    document.head.appendChild(styleEl);
    
    // Add touch event listeners to the renderer
    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    function handleTouchStart(e) {
        // Ignore if the touch is on the joystick or buttons
        if (e.target.id === 'left-joystick' || e.target.classList.contains('mobile-action-button')) {
            return;
        }
        
        e.preventDefault();
        
        if (!playerFish) return;
        
        // Store the touch start position
        window.touchState.lastX = e.touches[0].clientX;
        window.touchState.lastY = e.touches[0].clientY;
        window.touchState.lookingAround = true;
        
        // Initialize mouse control values to match current camera
        playerFish.mouseControl.lastMouseX = e.touches[0].clientX;
        playerFish.mouseControl.lastMouseY = e.touches[0].clientY;
        playerFish.mouseControl.isDragging = true;
    }
    
    function handleTouchMove(e) {
        if (!window.touchState.lookingAround || !playerFish) return;
        
        e.preventDefault();
        
        // Calculate the change in position
        const deltaX = e.touches[0].clientX - window.touchState.lastX;
        const deltaY = e.touches[0].clientY - window.touchState.lastY;
        
        // Update the last position
        window.touchState.lastX = e.touches[0].clientX;
        window.touchState.lastY = e.touches[0].clientY;
        
        // Pass the touch data to handleMouseMove
        const mouseEvent = {
            clientX: e.touches[0].clientX,
            clientY: e.touches[0].clientY
        };
        
        playerFish.handleMouseMove(mouseEvent);
    }
    
    function handleTouchEnd(e) {
        window.touchState.lookingAround = false;
        if (playerFish) {
            playerFish.mouseControl.isDragging = false;
        }
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(newWidth, newHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    const deltaTime = 0.016; // Approximate delta time for animations (60fps)
    
    // Update player fish if available
    if (playerFish) {
        playerFish.update();
        
        // Check for collisions
        playerFish.checkCollisions(state.collidableObjects);
    }
    
    // Update world generator based on player position
    if (playerFish && worldGenerator) {
        worldGenerator.update(playerFish.fishGroup.position);
    }
    
    // Update all fish
    state.otherFish.forEach(fish => {
        // Update the fish
        fish.update();
        
        // If it's a shark with an animation mixer, update it specifically
        if (fish instanceof Shark && fish.mixer) {
            fish.mixer.update(deltaTime);
        }
    });
    
    // Update water surface
    if (waterSurface && playerFish) {
        waterSurface.position.x = playerFish.fishGroup.position.x;
        waterSurface.position.z = playerFish.fishGroup.position.z;
        
        // Simple wave animation
        const vertices = waterSurface.geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            vertices[i + 1] = Math.sin(time * 0.5 + x * 0.03) * 2.0 + 
                              Math.cos(time * 0.3 + z * 0.04) * 1.5;
        }
        waterSurface.geometry.attributes.position.needsUpdate = true;
    }
    
    // Animate particles
    if (state.particleSystem) {
        const positions = state.particleSystem.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            // Gentle floating motion
            positions[i + 1] += Math.sin(time + positions[i]) * 0.01;
            
            // Reset particles that float too high
            if (positions[i + 1] > 40) {
                positions[i + 1] = -40;
            }
        }
        state.particleSystem.geometry.attributes.position.needsUpdate = true;
        
        // Move particles with player if available
        if (playerFish) {
            state.particleSystem.position.copy(playerFish.fishGroup.position);
        }
    }
    
    renderer.render(scene, camera);
}

animate(); 