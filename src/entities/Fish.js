import * as THREE from 'three';
import { state } from '../state/globalState.js';

export class Fish {
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
        this.collisionShape = {
            type: 'sphere',
            center: this.fishGroup.position.clone(),
            radius: size * 1.5
        };
        state.collidableObjects.push(this);
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
        // Apply wandering behavior (with reduced influence)
        const wanderForce = this.wander();
        wanderForce.multiplyScalar(0.5); // Reduce the influence of wandering
        this.applyForce(wanderForce);
        
        // Apply schooling behavior if there are nearby fish
        if (state.otherFish.length > 0) {
            // Find nearby fish (within 20 units)
            const nearbyFish = state.otherFish.filter(fish => 
                fish !== this && 
                fish.fishGroup.position.distanceTo(this.fishGroup.position) < 20
            );
            
            if (nearbyFish.length > 0) {
                this.schoolWithNeighbors(nearbyFish);
            }
        }
        
        // Update velocity and position
        this.velocity.add(this.acceleration);
        this.velocity.clampLength(0, this.maxSpeed);
        this.fishGroup.position.add(this.velocity);
        
        // Reset acceleration
        this.acceleration.set(0, 0, 0);
        
        // Make fish face the direction of movement
        if (this.velocity.length() > 0.001) {
            this.fishGroup.lookAt(
                this.fishGroup.position.clone().add(this.velocity)
            );
        }
        
        // Animate tail and fins
        this.animateParts();
        
        // Check boundaries
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
        
        return wanderForce;
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
    
    schoolWithNeighbors(neighbors, separationDistance = 3, alignmentDistance = 5, cohesionDistance = 7) {
        // Initialize steering forces
        const separation = new THREE.Vector3();
        const alignment = new THREE.Vector3();
        const cohesion = new THREE.Vector3();
        
        let separationCount = 0;
        let alignmentCount = 0;
        let cohesionCount = 0;
        
        // Check each neighbor
        for (const neighbor of neighbors) {
            // Skip if it's not the same type of fish (don't school with different species)
            if (this.constructor.name !== neighbor.constructor.name) continue;
            
            // Get distance to neighbor
            const distance = this.fishGroup.position.distanceTo(neighbor.fishGroup.position);
            
            // Separation: steer to avoid crowding local flockmates
            if (distance > 0 && distance < separationDistance) {
                const diff = new THREE.Vector3().subVectors(
                    this.fishGroup.position,
                    neighbor.fishGroup.position
                );
                diff.normalize();
                diff.divideScalar(distance); // Weight by distance
                separation.add(diff);
                separationCount++;
            }
            
            // Alignment: steer towards the average heading of local flockmates
            if (distance > 0 && distance < alignmentDistance) {
                alignment.add(neighbor.velocity);
                alignmentCount++;
            }
            
            // Cohesion: steer to move toward the average position of local flockmates
            if (distance > 0 && distance < cohesionDistance) {
                cohesion.add(neighbor.fishGroup.position);
                cohesionCount++;
            }
        }
        
        // Calculate average and apply steering forces
        if (separationCount > 0) {
            separation.divideScalar(separationCount);
            separation.normalize();
            separation.multiplyScalar(this.maxSpeed);
            separation.sub(this.velocity);
            separation.clampLength(0, this.maxForce * 1.5); // Separation is stronger
        }
        
        if (alignmentCount > 0) {
            alignment.divideScalar(alignmentCount);
            alignment.normalize();
            alignment.multiplyScalar(this.maxSpeed);
            alignment.sub(this.velocity);
            alignment.clampLength(0, this.maxForce);
        }
        
        if (cohesionCount > 0) {
            cohesion.divideScalar(cohesionCount);
            cohesion.sub(this.fishGroup.position);
            cohesion.normalize();
            cohesion.multiplyScalar(this.maxSpeed);
            cohesion.sub(this.velocity);
            cohesion.clampLength(0, this.maxForce);
        }
        
        // Apply the forces with different weights
        this.applyForce(separation.multiplyScalar(1.5)); // Separation is most important
        this.applyForce(alignment.multiplyScalar(1.0));
        this.applyForce(cohesion.multiplyScalar(1.0));
        
        return this;
    }
}



// Export the Fish class
