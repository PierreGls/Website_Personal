import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { AppContext } from './AppContext.js';

export class Outline{
	constructor(){
    }

    /*************************************
     ************** UPDATE 
    **************************************/
	update() {   
        this.manageHover();
    }

    manageHover(){
        if(AppContext.currentState === 0){ //CLICK ON ROOMS
            this.manageHoverScenes();
        }
        else if(AppContext.currentState === 1){ //CLICK ON PROJECT
            this.manageHoverProjects();
        }
    }

    manageHoverScenes(){
        const intersects = AppContext.raycaster.intersectObjects(AppContext.scenesMeshes);

        let foundInteractive = false;
        AppContext.outlinePass.selectedObjects = [];
        if(intersects.length > 0){
            const hoveredObject = intersects[0].object;
            if(AppContext.INTERACTIVES_NAMES.some(name => hoveredObject.name.includes(name))){
                document.body.style.cursor = 'pointer';
                foundInteractive = true;

                switch(hoveredObject.name){
                    case AppContext.INTERACTIVES_NAMES[1]:
                        AppContext.outlinePass.selectedObjects = [AppContext.frameAR];
                        break;
                    case AppContext.INTERACTIVES_NAMES[3]:
                        AppContext.outlinePass.selectedObjects = [AppContext.frameVR];
                        break;
                    case AppContext.INTERACTIVES_NAMES[5]:
                        AppContext.outlinePass.selectedObjects = [AppContext.frameMR];
                        break;
                    case AppContext.INTERACTIVES_NAMES[7]:
                        AppContext.outlinePass.selectedObjects = [AppContext.frameGame];
                        break;
                    case AppContext.INTERACTIVES_NAMES[9]:
                        AppContext.outlinePass.selectedObjects = [AppContext.frameCV];
                        break;
                    case AppContext.INTERACTIVES_NAMES[11]:
                        AppContext.outlinePass.selectedObjects = [AppContext.frameLinkedin];
                        break;
                    default:
                        AppContext.outlinePass.selectedObjects = [hoveredObject];
                        break;
                }
                
                //console.log('🖱️ Hover:', hoveredObject.name);
            }
        } 

        if(!foundInteractive){
            document.body.style.cursor = 'default';
        }
    }

    manageHoverProjects(){
        const intersects = AppContext.raycaster.intersectObjects(AppContext.projectsMeshes);
        
        let foundInteractive = false;
        AppContext.outlinePass.selectedObjects = [];
        if(intersects.length > 0){
            const hoveredObject = intersects[0].object;
            document.body.style.cursor = 'pointer';
            foundInteractive = true;
            //AppContext.outlinePass.selectedObjects = [hoveredObject]; //To add glow
        } 

        if(!foundInteractive){
            document.body.style.cursor = 'default';
        }
    }
}