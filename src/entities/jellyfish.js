import * as THREE from 'three';
import { Fish } from './Fish.js';
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
        
        return wanderForce;
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

// Export the Jellyfish class
export { Jellyfish }; 