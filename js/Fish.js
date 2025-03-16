class Fish {
    constructor(scene, position = { x: 0, y: 0, z: 0 }, color = 0xff9900, size = 1) {
        this.scene = scene;
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.maxSpeed = 0.05;
        this.maxForce = 0.002;
        this.wanderAngle = 0;
        this.size = size; // Store size for collision detection
        
        // Create fish body
        this.createFishMesh(position, color, size);
        
        // Add to scene
        this.scene.add(this.fishGroup);
        
        // Add collision shape
        this.collisionShape = {
            type: 'sphere',
            center: this.fishGroup.position.clone(),
            radius: size * 1.5 // Slightly larger than the fish
        };
        
        // Function to update collision position
        this.updateCollisionPosition = true;
        
        // Add to collidable objects (if not the player fish)
        if (!(this instanceof PlayerFish)) {
            collidableObjects.push(this);
        }
    }
    
    createFishMesh(position, color, size) {
        this.fishGroup = new THREE.Group();
        
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
        
        // Position the fish
        this.fishGroup.position.set(position.x, position.y, position.z);
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
        // Random wandering behavior
        this.wanderAngle += (Math.random() - 0.5) * 0.3;
        
        const wanderX = Math.cos(this.wanderAngle);
        const wanderY = Math.sin(this.wanderAngle) * 0.5; // Less vertical movement
        const wanderZ = Math.sin(this.wanderAngle + Math.PI/4);
        
        const wanderForce = new THREE.Vector3(wanderX, wanderY, wanderZ);
        wanderForce.normalize().multiplyScalar(this.maxForce);
        
        this.applyForce(wanderForce);
        
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