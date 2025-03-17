
import * as THREE from 'three';
import { Fish } from './Fish.js';
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
        
        return wanderForce;
    }
}

// Export the Octopus class
export { Octopus };