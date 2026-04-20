import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { AppContext } from './AppContext.js';

//Particles
const PARTICLES_COUNT = 100;
const PARTICLES_SIZE_MIN = 0.1;
const PARTICLES_SIZE_MAX = 0.3;
const PARTICLES_SIZE_MATERIALS = 0.7;
const PARTICLES_ROTATION_SPEED = 0.001;
const PARTICLES_POSITION_AMPLITUDE = 0.01;
let additionalRotY = 0;

export class Particles{
	constructor(){
        //Particles
        this.createBokehParticles();
    }

    /*************************************
     ************** Particles
    **************************************/
    createBokehParticles(){
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        
        for(let i = 0; i < PARTICLES_COUNT; i++){
            positions.push(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 100 + AppContext.CAMERA_POS_Z
            );
            
            // 👇 Couleurs aléatoires douces
            colors.push(
                0.5 + Math.random() * 0.5,  // R
                0.5 + Math.random() * 0.5,  // G
                0.8 + Math.random() * 0.2   // B (bleuté)
            );
            
            sizes.push(Math.random() * (PARTICLES_SIZE_MAX - PARTICLES_SIZE_MIN) + PARTICLES_SIZE_MIN);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: PARTICLES_SIZE_MATERIALS,
            vertexColors: true, // 👈 Utilise les couleurs par vertex
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
            map: this.createBokehTexture()
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.particles.position.z = -10;
        AppContext.scene.add(this.particles);
    }

    createBokehTexture(){
        // Crée une texture de cercle flou
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    /*************************************
     ************** UPDATE 
    **************************************/
	update() {   
        //Particle systeme
        this.updateMvtParticles();
    }
    updateMvtParticles(){
        if(this.particles){
            additionalRotY += PARTICLES_ROTATION_SPEED;
            this.particles.rotation.y = AppContext.scrollProjectAmount * 0.5 + additionalRotY;
            
            // Mouvement flottant
            const positions = this.particles.geometry.attributes.position.array;
            for(let i = 0; i < positions.length; i += 3){
                positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * PARTICLES_POSITION_AMPLITUDE;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
    }
}