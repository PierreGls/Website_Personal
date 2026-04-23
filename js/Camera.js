import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { AppContext } from './AppContext.js';
import { App } from './app.js';


const VERTICAL_MIN = -22 * Math.PI / 180;
const VERTICAL_MAX =  22 * Math.PI / 180;
const HORIZONTAL_SPEED = 0.03;
const VERTICAL_SPEED = 0.03;
const RETURN_SPEED    = 0.025;
const RETURN_SNAP     = 0.001;
const CENTERING_SPEED = 0.08;
const CENTERING_SNAP  = 0.003;

export class Camera
{
	constructor()
    {
        this.yawPivot = new THREE.Object3D();
        this.pitchPivot = new THREE.Object3D();

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 0, 0);

        this.yawPivot.add(this.pitchPivot);
        this.pitchPivot.add(this.camera);

        AppContext.scene.add(this.yawPivot);
        window.addEventListener('click', this.handleClickDetection.bind(this));
        
        this.targetCameraRotation = new THREE.Vector2();
        this._returning  = false;
        this._centering  = false;
        this._targetYaw  = 0;
        this._targetPitch = 0;

        if(AppContext.isMobile){
            this.handleTouchRotation();
        } else {
            this.handleMouseRotation();
        }
        AppContext.raycasterCenter = new THREE.Raycaster();

        window.addEventListener('resize', this.resize.bind(this) );
    }

    get instance() { return this.camera; }

    //#region Controls

    //Camera mvt to follow mouse
    handleMouseRotation(){
        document.addEventListener('mouseout', (e) => {
            if(!e.relatedTarget){
                this.horizontalSpeed = 0;
                this.verticalSpeed   = 0;
            }
        });

        window.addEventListener('mousemove', (event) => {
            if(event.target.closest('#filter-bar, #top-right-buttons') || AppContext.isModalProjectVisible){
                this.horizontalSpeed = 0;
                this.verticalSpeed   = 0;
                return;
            }
            const x = event.clientX / window.innerWidth;
            const y = event.clientY / window.innerHeight;

            // distance aux bords (0 au centre → 1 au bord)
            const edgeX = Math.max(0, Math.abs(x - 0.5) * 2 - 0.8);
            const edgeY = Math.max(0, Math.abs(y - 0.5) * 2 - 0.8);

            this.horizontalSpeed = edgeX * Math.sign(x - 0.5);
            this.verticalSpeed   = edgeY * Math.sign(y - 0.5);
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
            AppContext.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
            AppContext.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
            
            const maxRotation = Math.PI / 18;
            this.targetCameraRotation.x = AppContext.mouse.y * maxRotation;
            this.targetCameraRotation.y = AppContext.mouse.x * maxRotation;
        }, { passive: true });
        
        // Reset la rotation quand on relâche
        window.addEventListener('touchend', () => {
            this.targetCameraRotation.x = 0;
            this.targetCameraRotation.y = 0;
        });
    }

    //click detection
    handleClickDetection(event){
        // Lance le rayon
        AppContext.raycaster.setFromCamera(AppContext.mouse, this.camera);
    }

    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix(); 
    }

    //#endregion

    //#region Controls (reset / center)

    resetToInitial(){
        this._centering = false;
        this._returning = true;
    }

    centerOnPoint(worldPos){
        // Yaw : angle horizontal pour faire face au point
        this._targetYaw = Math.atan2(-worldPos.x, -worldPos.z);

        // Pitch : le raycaster centre applique y *= 1.75, donc on compense
        // en divisant Y par 1.75 pour que le highlight coïncide avec la cible
        const horizDist = Math.sqrt(worldPos.x * worldPos.x + worldPos.z * worldPos.z);
        const rawPitch  = Math.atan2(worldPos.y / 1.75, horizDist);
        this._targetPitch = Math.max(VERTICAL_MIN, Math.min(VERTICAL_MAX, rawPitch));

        this._returning = false;
        this._centering = true;
    }

    //#endregion

    //#region Lifecycle

    update(){

        if(this._centering){
            // Shortest-path yaw lerp (gère l'accumulation des tours)
            let yawDiff = this._targetYaw - this.yawPivot.rotation.y;
            yawDiff -= Math.round(yawDiff / (2 * Math.PI)) * (2 * Math.PI);
            this.yawPivot.rotation.y   += yawDiff * CENTERING_SPEED;
            this.pitchPivot.rotation.x += (this._targetPitch - this.pitchPivot.rotation.x) * CENTERING_SPEED;

            if(Math.abs(yawDiff) < CENTERING_SNAP && Math.abs(this._targetPitch - this.pitchPivot.rotation.x) < CENTERING_SNAP){
                this._centering = false;
            }
        } else if(this._returning){
            this.yawPivot.rotation.y   += (0 - this.yawPivot.rotation.y)   * RETURN_SPEED;
            this.pitchPivot.rotation.x += (0 - this.pitchPivot.rotation.x) * RETURN_SPEED;

            if(Math.abs(this.yawPivot.rotation.y) < RETURN_SNAP && Math.abs(this.pitchPivot.rotation.x) < RETURN_SNAP){
                this.yawPivot.rotation.y   = 0;
                this.pitchPivot.rotation.x = 0;
                this._returning = false;
            }
        } else {
            // --- YAW (horizontal, pas de clamp)
            if(this.horizontalSpeed){
                this.yawPivot.rotation.y -= this.horizontalSpeed * HORIZONTAL_SPEED;
            }

            // --- PITCH (vertical, clamp)
            if(this.verticalSpeed){
                this.pitchPivot.rotation.x -= this.verticalSpeed * VERTICAL_SPEED;

                this.pitchPivot.rotation.x = Math.max(
                    VERTICAL_MIN,
                    Math.min(VERTICAL_MAX, this.pitchPivot.rotation.x)
                );
            }
        }

        var cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        cameraDirection.y *= 1.75;
        AppContext.raycasterCenter.set(new THREE.Vector3(0, 0, 0), cameraDirection);

    }

    //#endregion
}