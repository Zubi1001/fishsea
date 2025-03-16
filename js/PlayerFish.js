class PlayerFish extends Fish {
    constructor(scene, camera, position = { x: 0, y: 0, z: 0 }, color = 0x3399ff, size = 1.5) {
        super(scene, position, color, size);
        
        this.camera = camera;
        this.maxSpeed = 0.2;
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            quickUp: false,
            quickDown: false
        };
        
        // Improved control variables
        this.currentSpeed = 0;
        this.acceleration = 0.01;
        this.deceleration = 0.005;
        this.rotationSpeed = 0.04; // Increased from 0.03
        this.bankAngle = 0; // For tilting when turning
        
        // Set up camera to follow player
        this.cameraOffset = new THREE.Vector3(0, 3, -10);
        this.setupControls();
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleKeyDown(event) {
        switch(event.key) {
            case 'w':
            case 'W':
                this.input.forward = true;
                break;
            case 's':
            case 'S':
                this.input.backward = true;
                break;
            case 'ArrowLeft':
                this.input.left = true;
                break;
            case 'ArrowRight':
                this.input.right = true;
                break;
            case 'ArrowUp':
                this.input.up = true;
                break;
            case 'ArrowDown':
                this.input.down = true;
                break;
            case ' ':
                // Space for quick up movement
                this.input.quickUp = true;
                break;
            case 'Control':
                // Control for quick down movement
                this.input.quickDown = true;
                break;
        }
        
        // Prevent default behavior for arrow keys to avoid page scrolling
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
            event.preventDefault();
        }
    }
    
    handleKeyUp(event) {
        switch(event.key) {
            case 'w':
            case 'W':
                this.input.forward = false;
                break;
            case 's':
            case 'S':
                this.input.backward = false;
                break;
            case 'ArrowLeft':
                this.input.left = false;
                break;
            case 'ArrowRight':
                this.input.right = false;
                break;
            case 'ArrowUp':
                this.input.up = false;
                break;
            case 'ArrowDown':
                this.input.down = false;
                break;
            case ' ':
                this.input.quickUp = false;
                break;
            case 'Control':
                this.input.quickDown = false;
                break;
        }
    }
    
    update() {
        // Handle player input
        this.handleMovement();
        
        // Update position based on velocity
        this.fishGroup.position.add(this.velocity);
        
        // Update rotation to face direction of movement
        if (this.velocity.length() > 0.001) {
            // The fish already faces the direction it's moving due to our control system
            
            // Add banking effect when turning
            this.updateBanking();
        }
        
        // Animate tail and fins
        this.animateParts();
        
        // Update camera position to follow player
        this.updateCamera();
        
        // Apply drag/friction to slow down when not pressing keys
        this.velocity.multiplyScalar(0.95);
        
        // Check for collisions
        this.checkCollisions(this.scene.children);
    }
    
    handleMovement() {
        // Handle acceleration/deceleration with W/S
        if (this.input.forward) {
            this.currentSpeed = Math.min(this.currentSpeed + this.acceleration, this.maxSpeed);
        } else if (this.input.backward) {
            this.currentSpeed = Math.max(this.currentSpeed - this.acceleration, -this.maxSpeed * 0.5);
        } else {
            // Gradually slow down when neither W nor S is pressed
            if (this.currentSpeed > 0) {
                this.currentSpeed = Math.max(0, this.currentSpeed - this.deceleration);
            } else if (this.currentSpeed < 0) {
                this.currentSpeed = Math.min(0, this.currentSpeed + this.deceleration);
            }
        }
        
        // Get the direction vectors
        const forwardVector = new THREE.Vector3(0, 0, 1);
        forwardVector.applyQuaternion(this.fishGroup.quaternion);
        
        const rightVector = new THREE.Vector3(1, 0, 0);
        rightVector.applyQuaternion(this.fishGroup.quaternion);
        
        const upVector = new THREE.Vector3(0, 1, 0);
        upVector.applyQuaternion(this.fishGroup.quaternion);
        
        // Apply rotation based on arrow keys
        let rotationChanged = false;
        
        if (this.input.left) {
            // Rotate left around the up axis
            const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
                upVector, this.rotationSpeed
            );
            this.fishGroup.quaternion.premultiply(
                new THREE.Quaternion().setFromRotationMatrix(rotationMatrix)
            );
            rotationChanged = true;
        }
        
        if (this.input.right) {
            // Rotate right around the up axis
            const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
                upVector, -this.rotationSpeed
            );
            this.fishGroup.quaternion.premultiply(
                new THREE.Quaternion().setFromRotationMatrix(rotationMatrix)
            );
            rotationChanged = true;
        }
        
        if (this.input.up) {
            // Rotate up around the right axis
            const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
                rightVector, this.rotationSpeed
            );
            this.fishGroup.quaternion.premultiply(
                new THREE.Quaternion().setFromRotationMatrix(rotationMatrix)
            );
            rotationChanged = true;
        }
        
        if (this.input.down) {
            // Rotate down around the right axis
            const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
                rightVector, -this.rotationSpeed
            );
            this.fishGroup.quaternion.premultiply(
                new THREE.Quaternion().setFromRotationMatrix(rotationMatrix)
            );
            rotationChanged = true;
        }
        
        // Apply movement in the direction the fish is facing
        // This is the key change - we always apply the current speed in the forward direction
        // regardless of whether rotation is happening
        const movementVector = forwardVector.clone().multiplyScalar(this.currentSpeed);
        this.velocity.copy(movementVector);
        
        // Handle quick up/down movement (Space/Control)
        if (this.input.quickUp) {
            this.velocity.y += 0.1;
        }
        if (this.input.quickDown) {
            this.velocity.y -= 0.1;
        }
        
        // Limit speed
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
    }
    
    updateBanking() {
        // Add a banking effect (tilting) when turning
        let targetBank = 0;
        
        if (this.input.left) {
            targetBank = Math.PI * 0.15; // Bank right when turning left
        } else if (this.input.right) {
            targetBank = -Math.PI * 0.15; // Bank left when turning right
        }
        
        // Smoothly transition to the target bank angle
        this.bankAngle = this.bankAngle * 0.9 + targetBank * 0.1;
        
        // Apply the banking rotation
        this.fishGroup.rotation.z = this.bankAngle;
    }
    
    updateCamera() {
        // Calculate desired camera position
        const targetPosition = this.fishGroup.position.clone();
        
        // Get the direction the fish is facing
        const fishDirection = new THREE.Vector3(0, 0, 1);
        fishDirection.applyQuaternion(this.fishGroup.quaternion);
        
        // Calculate camera offset based on fish direction
        const offset = this.cameraOffset.clone();
        offset.applyQuaternion(this.fishGroup.quaternion);
        
        // Apply banking to camera as well
        const bankRotation = new THREE.Quaternion().setFromAxisAngle(
            fishDirection, this.bankAngle * 0.5
        );
        offset.applyQuaternion(bankRotation);
        
        // Set camera position with smooth following
        const currentCameraPos = this.camera.position.clone();
        const targetCameraPos = targetPosition.clone().add(offset);
        
        // Smooth camera movement (lerp)
        this.camera.position.lerpVectors(currentCameraPos, targetCameraPos, 0.1);
        
        // Make camera look at fish
        this.camera.lookAt(targetPosition);
    }
    
    checkBoundaries() {
        // Only limit vertical movement for the player
        const pos = this.fishGroup.position;
        
        if (pos.y > 40) {
            pos.y = 40;
            this.velocity.y = 0;
        }
        if (pos.y < -30) { // Changed to -30 to stay above the seabed
            pos.y = -30;
            this.velocity.y = 0;
        }
    }
    
    checkCollisions(objects) {
        // Player fish bounding sphere
        if (!this.collisionSphere) {
            // Create a bounding sphere for the player fish
            // We need to make sure we have a valid size property
            const collisionRadius = this.size ? this.size * 1.2 : 1.5; // Default to 1.5 if size is undefined
            
            this.collisionSphere = new THREE.Sphere(
                this.fishGroup.position.clone(),
                collisionRadius
            );
        }
        
        // Update the collision sphere position to match the fish
        this.collisionSphere.center.copy(this.fishGroup.position);
        
        // Check for collisions with each object
        let collisionOccurred = false;
        let collisionResponse = new THREE.Vector3();
        
        // Make sure objects is an array and not undefined
        if (!objects || !Array.isArray(objects) || objects.length === 0) {
            return false;
        }
        
        for (const object of objects) {
            // Skip if the object doesn't have a collision shape or is undefined
            if (!object || !object.collisionShape) continue;
            
            // Check collision based on shape type
            if (object.collisionShape.type === 'sphere') {
                // Sphere-sphere collision
                const objectSphere = object.collisionShape;
                
                // Make sure objectSphere has a center property
                if (!objectSphere.center) continue;
                
                // Update object sphere position if it's a moving object
                if (object.updateCollisionPosition && object.position) {
                    objectSphere.center.copy(object.position);
                }
                
                // Calculate distance between centers
                const distance = this.collisionSphere.center.distanceTo(objectSphere.center);
                const minDistance = this.collisionSphere.radius + objectSphere.radius;
                
                if (distance < minDistance) {
                    // Collision detected!
                    collisionOccurred = true;
                    
                    // Calculate collision normal (direction to push away)
                    const normal = new THREE.Vector3()
                        .subVectors(this.collisionSphere.center, objectSphere.center)
                        .normalize();
                    
                    // Calculate penetration depth
                    const penetration = minDistance - distance;
                    
                    // Add to collision response
                    collisionResponse.add(
                        normal.multiplyScalar(penetration * 1.01) // Slightly more than needed to prevent sticking
                    );
                }
            }
        }
        
        // Apply collision response if needed
        if (collisionOccurred) {
            // Move the fish out of collision
            this.fishGroup.position.add(collisionResponse);
            
            // Reflect velocity to bounce off obstacles
            // Project velocity onto collision normal and reflect
            const dot = this.velocity.dot(collisionResponse.normalize());
            if (dot < 0) {
                this.velocity.sub(collisionResponse.normalize().multiplyScalar(dot * 2));
                // Reduce velocity to simulate impact
                this.velocity.multiplyScalar(0.5);
                this.currentSpeed *= 0.5;
            }
            
            return true;
        }
        
        return false;
    }
} 