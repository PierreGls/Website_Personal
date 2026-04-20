import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { AppContext } from './AppContext.js';

const SCROLL_SPEED = 0.0005;
const ANIMATION_SCENES_LERP_RATIO = 0.05;

//PROJECT
const SCROLL_PROJECT_MULTIPLIER = 10;
const SCROLL_PROJECT_MAX_MULTIPLIER = 0.1;

const ANIMATION_PROJECT_LERP_RATIO = 0.08;
const ANIMATION_PROJECT_X_POS_MULTIPLIER = 1.5;
const ANIMATION_PROJECT_Z_ROT_MULTIPLIER = -0.5;

export class Scroller{
	constructor(){
        if(AppContext.isMobile){
            this.setupTouchControls();
        } else {
            this.setupMouseControls();
        }
    }

    /*************************************
     ************** INIT  
    **************************************/
    setupMouseControls(){
        window.addEventListener('wheel', this.handleScroll.bind(this));
        console.log('✅ Controls setup for PC');
    }

    setupTouchControls(){
        let touchStartY = 0;
        let touchStartX = 0;
        
        // Touch start
        window.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
        }, { passive: true });
        
        // Touch move
        window.addEventListener('touchmove', (e) => {
            const touchY = e.touches[0].clientY;
            const touchX = e.touches[0].clientX;
            
            const deltaY = touchStartY - touchY;
            const deltaX = touchStartX - touchX;
            
            this.handleScrollByValue(-deltaY);

            touchStartY = touchY;
            touchStartX = touchX;
            
        }, { passive: true });

        console.log('✅ Controls setup for Mobile');
    }

    /*************************************
     ************** SCROLL 
    **************************************/
    //Desktop
    handleScroll (e){
        this.handleScrollByValue(e.deltaY);
    }

    handleScrollByValue(scrollValue){
        AppContext.scrollProjectAmount += scrollValue * SCROLL_SPEED;
        AppContext.scrollProjectAmount = Math.max(AppContext.scrollProjectAmount, 0); //min value = 0
        AppContext.scrollProjectAmount = Math.min(AppContext.scrollProjectAmount, SCROLL_PROJECT_MAX_MULTIPLIER * (AppContext.projectsVisible.size - 1)); //max value = scrollMultiplier * nbr de projets
    }

    /*************************************
     ************** UPDATE 
    **************************************/
    update() {   
        this.updateProjectMovements();
    }

    updateProjectMovements(){
        if(!AppContext.areProjectsLoaded) {return;}

        AppContext.projectsVisible.forEach((projectParent, key, map) => {
            let defaultY = AppContext.INITIAL_OFFSET_Y_PROJECTS + AppContext.INTERVALLE_Y_PROJECTS * key;
            let defaultZ = AppContext.offsetZProjects + AppContext.INTERVALLE_Z_PROJECTS * (- key);
            
            let newPosY = defaultY - AppContext.INTERVALLE_Y_PROJECTS * AppContext.scrollProjectAmount * SCROLL_PROJECT_MULTIPLIER;
            let newPosZ = defaultZ + AppContext.INTERVALLE_Z_PROJECTS * AppContext.scrollProjectAmount * SCROLL_PROJECT_MULTIPLIER;
            
            let newPosX = 0;
            let newRotZ = 0;
            if(newPosZ > AppContext.offsetZProjects){
                newPosX = (AppContext.offsetZProjects - newPosZ) * ANIMATION_PROJECT_X_POS_MULTIPLIER;
                newRotZ = (AppContext.offsetZProjects - newPosZ) * ANIMATION_PROJECT_Z_ROT_MULTIPLIER;
                if(key%2===0){
                    newPosX *= -1;
                    newRotZ *= -1;
                }
            }

            let currentPos = projectParent.position;
            let currentRot = new THREE.Vector3(
                projectParent.rotation.x,
                projectParent.rotation.y, 
                projectParent.rotation.z
            );

            let targetPos = new THREE.Vector3(newPosX ,newPosY, newPosZ);
            let targetRot = new THREE.Vector3(0 ,0, newRotZ);

            let lerpedPos = currentPos.lerp(targetPos, ANIMATION_PROJECT_LERP_RATIO);
            let lerpedRot = currentRot.lerp(targetRot, ANIMATION_PROJECT_LERP_RATIO);

            projectParent.position.set(
                lerpedPos.x,
                lerpedPos.y,
                lerpedPos.z
            );
            
            projectParent.rotation.set(
                lerpedRot.x,
                lerpedRot.y,
                lerpedRot.z
            );
        });
    }
}