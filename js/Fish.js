class Fish {
    constructor(scene, position = { x: 0, y: 0, z: 0 }, color = 0xff9900, size = 1) {
        this.scene = scene;
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.maxSpeed = 0.05;
        this.maxForce = 0.002;
        this.wanderAngle = 0;
        this.size = size;
        this.fishType = 0; // Default fish type
        
        // Create fish body
        this.createFishMesh(position, color, size);
        
        // Add to scene
        this.scene.add(this.fishGroup);
        
        // Add collision shape
        if (typeof collidableObjects !== 'undefined') {
            this.collisionShape = {
                type: 'sphere',
                center: this.fishGroup.position.clone(),
                radius: size * 1.5
            };
            collidableObjects.push(this);
        }
    }
    
    createFishMesh(position, color, size) {
        this.fishGroup = new THREE.Group();
        
        // Different fish body shapes based on fishType
        if (this.fishType === 0) {
            // Standard fish (cone body)
            this.createStandardFish(color, size);
        } else if (this.fishType === 1) {
            // Flat fish (flatter body)
            this.createFlatFish(color, size);
        } else {
            // Angular fish (more angular features)
            this.createAngularFish(color, size);
        }
        
        // Position the fish
        this.fishGroup.position.set(position.x, position.y, position.z);
    }
    
    createStandardFish(color, size) {
        // Fish body
        const bodyGeometry = new THREE.ConeGeometry(size, size * 2, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: color });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.rotation.x = Math.PI / 2;
        
        // Tail
        const tailGeometry = new THREE.ConeGeometry(size * 0.8, size, 4);
        const tailMaterial = new THREE.MeshPhongMaterial({ color: color });
        this.tail = new THREE.Mesh(tailGeometry, tailMaterial);
        this.tail.position.z = -size;
        this.tail.rotation.x = Math.PI / 2;
        this.tail.scale.set(1, 0.5, 1);
        
        // Fins
        const finGeometry = new THREE.PlaneGeometry(size * 0.8, size * 0.4);
        const finMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            side: THREE.DoubleSide
        });
        
        this.leftFin = new THREE.Mesh(finGeometry, finMaterial);
        this.leftFin.position.set(size * 0.5, 0, 0);
        this.leftFin.rotation.y = Math.PI / 4;
        
        this.rightFin = new THREE.Mesh(finGeometry, finMaterial);
        this.rightFin.position.set(-size * 0.5, 0, 0);
        this.rightFin.rotation.y = -Math.PI / 4;
        
        // Add all parts to group
        this.fishGroup.add(this.body);
        this.fishGroup.add(this.tail);
        this.fishGroup.add(this.leftFin);
        this.fishGroup.add(this.rightFin);
    }
    
    createFlatFish(color, size) {
        // Flatter body
        const bodyGeometry = new THREE.BoxGeometry(size * 1.5, size * 0.4, size * 2);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: color });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // Tail
        const tailGeometry = new THREE.BoxGeometry(size, size * 0.3, size * 0.8);
        const tailMaterial = new THREE.MeshPhongMaterial({ color: color });
        this.tail = new THREE.Mesh(tailGeometry, tailMaterial);
        this.tail.position.z = -size * 1.4;
        
        // Fins
        const finGeometry = new THREE.PlaneGeometry(size * 1.2, size * 0.3);
        const finMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            side: THREE.DoubleSide
        });
        
        this.leftFin = new THREE.Mesh(finGeometry, finMaterial);
        this.leftFin.position.set(size * 0.8, 0, 0);
        this.leftFin.rotation.y = Math.PI / 6;
        
        this.rightFin = new THREE.Mesh(finGeometry, finMaterial);
        this.rightFin.position.set(-size * 0.8, 0, 0);
        this.rightFin.rotation.y = -Math.PI / 6;
        
        // Add all parts to group
        this.fishGroup.add(this.body);
        this.fishGroup.add(this.tail);
        this.fishGroup.add(this.leftFin);
        this.fishGroup.add(this.rightFin);
    }
    
    createAngularFish(color, size) {
        // Angular body
        const bodyGeometry = new THREE.DodecahedronGeometry(size, 0);
        bodyGeometry.scale(1, 0.7, 1.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: color });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // Tail
        const tailGeometry = new THREE.TetrahedronGeometry(size * 0.7, 0);
        tailGeometry.scale(1, 0.5, 1.5);
        const tailMaterial = new THREE.MeshPhongMaterial({ color: color });
        this.tail = new THREE.Mesh(tailGeometry, tailMaterial);
        this.tail.position.z = -size * 1.2;
        this.tail.rotation.x = Math.PI;
        
        // Fins
        const finGeometry = new THREE.TetrahedronGeometry(size * 0.5, 0);
        finGeometry.scale(0.7, 0.3, 1);
        const finMaterial = new THREE.MeshPhongMaterial({ color: color });
        
        this.leftFin = new THREE.Mesh(finGeometry, finMaterial);
        this.leftFin.position.set(size * 0.6, 0, 0);
        this.leftFin.rotation.z = Math.PI / 2;
        
        this.rightFin = new THREE.Mesh(finGeometry, finMaterial);
        this.rightFin.position.set(-size * 0.6, 0, 0);
        this.rightFin.rotation.z = -Math.PI / 2;
        
        // Add all parts to group
        this.fishGroup.add(this.body);
        this.fishGroup.add(this.tail);
        this.fishGroup.add(this.leftFin);
        this.fishGroup.add(this.rightFin);
    }
    
    update() {
        // Apply wandering behavior
        this.wander();
        
        // Update position based on velocity
        this.fishGroup.position.add(this.velocity);
        
        // Update rotation to face direction of movement
        if (this.velocity.length() > 0.001) {
            this.fishGroup.lookAt(
                this.fishGroup.position.x + this.velocity.x,
                this.fishGroup.position.y + this.velocity.y,
                this.fishGroup.position.z + this.velocity.z
            );
        }
        
        // Animate tail and fins
        this.animateParts();
        
        // Boundary check - wrap around if fish goes too far
        this.checkBoundaries();
        
        // Update collision shape position
        if (this.collisionShape) {
            this.collisionShape.center.copy(this.fishGroup.position);
        }
    }
    
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
    }
    
    applyForce(force) {
        this.acceleration.add(force);
        this.velocity.add(this.acceleration);
        this.acceleration.multiplyScalar(0);
    }
    
    animateParts() {
        // Simple tail wiggle animation
        this.tail.rotation.y = Math.sin(Date.now() * 0.01) * 0.5;
        
        // Fin movement
        this.leftFin.rotation.z = Math.sin(Date.now() * 0.008) * 0.2 + 0.2;
        this.rightFin.rotation.z = -Math.sin(Date.now() * 0.008) * 0.2 - 0.2;
    }
    
    checkBoundaries() {
        // Only limit vertical movement
        const pos = this.fishGroup.position;
        
        // Adjust vertical limits to match new seabed position
        if (pos.y > 40) {
            pos.y = 40;
            this.velocity.y *= -0.5;
        }
        if (pos.y < -30) { // Changed to -30 to stay above the seabed
            pos.y = -30;
            this.velocity.y *= -0.5;
        }
    }
}

// Shark class
class Shark extends Fish {
    constructor(scene, position = { x: 0, y: 0, z: 0 }, color = 0x607d8b, size = 3) {
        super(scene, position, color, size);
        this.predator = true; // Sharks are predators
    }
    
    createFishMesh(position, color, size) {
        this.fishGroup = new THREE.Group();
        
        // Shark body - elongated cone
        const bodyGeometry = new THREE.ConeGeometry(size * 0.7, size * 3, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: color });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.rotation.x = Math.PI / 2;
        
        // Shark head - slightly different color
        const headGeometry = new THREE.ConeGeometry(size * 0.7, size, 8);
        const headMaterial = new THREE.MeshPhongMaterial({ 
            color: new THREE.Color(color).multiplyScalar(0.9) 
        });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.rotation.x = -Math.PI / 2;
        this.head.position.z = size * 1.5;
        
        // Shark tail - distinctive shape
        const tailGeometry = new THREE.BoxGeometry(size * 0.1, size * 1.5, size * 0.8);
        const tailMaterial = new THREE.MeshPhongMaterial({ color: color });
        this.tail = new THREE.Mesh(tailGeometry, tailMaterial);
        this.tail.position.z = -size * 1.5;
        this.tail.rotation.x = Math.PI / 2;
        
        // Dorsal fin
        const dorsalGeometry = new THREE.ConeGeometry(size * 0.8, size * 1.2, 4);
        dorsalGeometry.rotateX(Math.PI / 2);
        const dorsalMaterial = new THREE.MeshPhongMaterial({ color: color });
        this.dorsalFin = new THREE.Mesh(dorsalGeometry, dorsalMaterial);
        this.dorsalFin.position.set(0, size * 0.8, 0);
        this.dorsalFin.scale.set(0.1, 1, 0.5);
        
        // Side fins
        const finGeometry = new THREE.PlaneGeometry(size * 1.2, size * 0.6);
        const finMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            side: THREE.DoubleSide
        });
        
        this.leftFin = new THREE.Mesh(finGeometry, finMaterial);
        this.leftFin.position.set(size * 0.6, -size * 0.2, 0);
        this.leftFin.rotation.set(0, 0, -Math.PI / 6);
        
        this.rightFin = new THREE.Mesh(finGeometry, finMaterial);
        this.rightFin.position.set(-size * 0.6, -size * 0.2, 0);
        this.rightFin.rotation.set(0, 0, Math.PI / 6);
        
        // Add all parts to group
        this.fishGroup.add(this.body);
        this.fishGroup.add(this.head);
        this.fishGroup.add(this.tail);
        this.fishGroup.add(this.dorsalFin);
        this.fishGroup.add(this.leftFin);
        this.fishGroup.add(this.rightFin);
        
        // Position the shark
        this.fishGroup.position.set(position.x, position.y, position.z);
    }
    
    animateParts() {
        // Shark-specific animation - more subtle tail movement
        this.tail.rotation.y = Math.sin(Date.now() * 0.005) * 0.3;
        
        // Subtle fin movement
        this.leftFin.rotation.z = -Math.PI / 6 + Math.sin(Date.now() * 0.003) * 0.1;
        this.rightFin.rotation.z = Math.PI / 6 - Math.sin(Date.now() * 0.003) * 0.1;
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
    }
}

// Octopus class
class Octopus extends Fish {
    constructor(scene, position = { x: 0, y: 0, z: 0 }, color = 0x800080, size = 2) {
        super(scene, position, color, size);
        this.tentaclePhases = [];
        for (let i = 0; i < 8; i++) {
            this.tentaclePhases.push(Math.random() * Math.PI * 2);
        }
    }
    
    createFishMesh(position, color, size) {
        this.fishGroup = new THREE.Group();
        
        // Octopus head/body
        const bodyGeometry = new THREE.SphereGeometry(size, 16, 16);
        bodyGeometry.scale(1, 0.8, 1);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: color });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(size * 0.2, 8, 8);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
        const pupilMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        
        this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.leftEye.position.set(size * 0.3, size * 0.2, size * 0.7);
        
        this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.rightEye.position.set(-size * 0.3, size * 0.2, size * 0.7);
        
        const pupilGeometry = new THREE.SphereGeometry(size * 0.1, 8, 8);
        this.leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        this.leftPupil.position.set(size * 0.3, size * 0.2, size * 0.85);
        
        this.rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        this.rightPupil.position.set(-size * 0.3, size * 0.2, size * 0.85);
        
        // Tentacles
        this.tentacles = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const tentacle = this.createTentacle(color, size, angle);
            this.tentacles.push(tentacle);
            this.fishGroup.add(tentacle);
        }
        
        // Add all parts to group
        this.fishGroup.add(this.body);
        this.fishGroup.add(this.leftEye);
        this.fishGroup.add(this.rightEye);
        this.fishGroup.add(this.leftPupil);
        this.fishGroup.add(this.rightPupil);
        
        // Position the octopus
        this.fishGroup.position.set(position.x, position.y, position.z);
    }
    
    createTentacle(color, size, angle) {
        const tentacleGroup = new THREE.Group();
        const segments = 8;
        const segmentLength = size * 0.4;
        
        // Create tentacle segments
        let prevSegment = null;
        for (let i = 0; i < segments; i++) {
            const segmentGeometry = new THREE.CylinderGeometry(
                size * 0.15 * (1 - i/segments), // Tapers toward the end
                size * 0.15 * (1 - (i+1)/segments),
                segmentLength,
                8
            );
            const segmentMaterial = new THREE.MeshPhongMaterial({ color: color });
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            
            // Position segment
            if (prevSegment) {
                segment.position.y = -segmentLength;
                prevSegment.add(segment);
            } else {
                segment.position.set(
                    Math.cos(angle) * size * 0.8,
                    -size * 0.5,
                    Math.sin(angle) * size * 0.8
                );
                tentacleGroup.add(segment);
            }
            
            prevSegment = segment;
        }
        
        return tentacleGroup;
    }
    
    animateParts() {
        // Animate tentacles with wave-like motion
        for (let i = 0; i < this.tentacles.length; i++) {
            const tentacle = this.tentacles[i];
            const time = Date.now() * 0.001;
            const phase = this.tentaclePhases[i];
            
            // Wave-like motion
            tentacle.rotation.x = Math.sin(time + phase) * 0.2;
            tentacle.rotation.z = Math.cos(time + phase * 0.7) * 0.2;
            
            // Animate child segments
            this.animateTentacleSegments(tentacle, time, phase, 0);
        }
    }
    
    animateTentacleSegments(segment, time, phase, depth) {
        if (depth > 7) return; // Limit recursion
        
        // Add more motion to each segment
        if (segment.children.length > 0) {
            segment.children[0].rotation.x = Math.sin(time * 1.5 + phase + depth * 0.5) * 0.3;
            segment.children[0].rotation.z = Math.cos(time + phase * 0.8 + depth * 0.3) * 0.3;
            
            // Recurse to next segment
            this.animateTentacleSegments(segment.children[0], time, phase, depth + 1);
        }
    }
    
    // Override wander to make octopuses move differently
    wander() {
        // Octopuses move more erratically with sudden direction changes
        if (Math.random() < 0.02) {
            this.wanderAngle = Math.random() * Math.PI * 2;
        } else {
            this.wanderAngle += (Math.random() - 0.5) * 0.4;
        }
        
        const wanderX = Math.cos(this.wanderAngle);
        const wanderY = Math.sin(this.wanderAngle) * 0.2; // Less vertical movement
        const wanderZ = Math.sin(this.wanderAngle + Math.PI/4);
        
        const wanderForce = new THREE.Vector3(wanderX, wanderY, wanderZ);
        wanderForce.normalize().multiplyScalar(this.maxForce);
        
        this.applyForce(wanderForce);
        
        // Octopuses can sometimes stop and hover
        if (Math.random() < 0.01) {
            this.velocity.multiplyScalar(0.5);
        }
        
        // Limit speed
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
    }
}

// Jellyfish class
class Jellyfish extends Fish {
    constructor(scene, position = { x: 0, y: 0, z: 0 }, color = 0x88ccff, size = 1.2) {
        super(scene, position, color, size);
        this.pulseCycle = Math.random() * Math.PI * 2;
        this.tentaclePhases = [];
        for (let i = 0; i < 12; i++) {
            this.tentaclePhases.push(Math.random() * Math.PI * 2);
        }
    }
    
    createFishMesh(position, color, size) {
        this.fishGroup = new THREE.Group();
        
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
        
        // Position the jellyfish
        this.fishGroup.position.set(position.x, position.y, position.z);
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
    }
} 