import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

//CAMERA
const CAMERA_POS_Y = 1.5;
const CAMERA_POS_Z = 3.0;
const CAMERA_ROT_AMPLITUDE = 7.0;
const CAMERA_ROT_SPEED = 0.03;

export class Camera{
	constructor(){
		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, CAMERA_POS_Y, CAMERA_POS_Z );

        //Camera mvts
        this.targetCameraRotation = new THREE.Vector2();

        //Click detection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        window.addEventListener('click', this.handleClickDetection.bind(this));
        

        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if(this.isMobile){
            this.handleTouchRotation();
        } else {
            this.handleMouseRotation();
        }

        window.addEventListener('resize', this.resize.bind(this) );
    }

    /*************************************
     ************** SINGLETON  
    **************************************/
    
    get instance() { return this.camera; }

    /*************************************
     ************** CAMERA MVT 
    **************************************/
     //Camera mvt to follow mouse
    handleMouseRotation(){
         window.addEventListener('mousemove', (event) => {
            //store mouse position
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            //Do raycaster
            this.raycaster.setFromCamera(this.mouse, this.camera);

            //Manage cammera rotation
            const maxRotation = CAMERA_ROT_AMPLITUDE * Math.PI / 180; //radians
            this.targetCameraRotation.x = this.mouse.y * maxRotation; // Haut/Bas
            this.targetCameraRotation.y = - this.mouse.x * maxRotation; // Gauche/Droite
        });
    }
    handleTouchRotation(){
        window.addEventListener('touchmove', (event) => {
            if(currentState === 1){ 
                this.targetCameraRotation.x = 0;
                this.targetCameraRotation.y = 0;
                return;
            }

            // Utilise la position du doigt
            const touch = event.touches[0];
            this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
            
            const maxRotation = Math.PI / 18;
            this.targetCameraRotation.x = this.mouse.y * maxRotation;
            this.targetCameraRotation.y = this.mouse.x * maxRotation;
        }, { passive: true });
        
        // Reset la rotation quand on relâche
        window.addEventListener('touchend', () => {
            this.targetCameraRotation.x = 0;
            this.targetCameraRotation.y = 0;
        });
    }

    /*************************************
     ************** CLICK 
    **************************************/
    //click detection
    handleClickDetection(event){
        // Lance le rayon
        this.raycaster.setFromCamera(this.mouse, this.camera);
    }

    /*************************************
     ************** RESIZE 
    **************************************/
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix(); 
    }

    /*************************************
     ************** UPDATE 
    **************************************/
	update(){   
        //Cam rot
        if(this.targetCameraRotation){
            this.camera.rotation.x += (this.targetCameraRotation.x - this.camera.rotation.x) * CAMERA_ROT_SPEED;
            this.camera.rotation.y += (this.targetCameraRotation.y - this.camera.rotation.y) * CAMERA_ROT_SPEED;
        }
    }
}