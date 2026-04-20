import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { AppContext } from './AppContext.js';

//FADE SCENES
const FADE_START = 2.0;
const FADE_END = 4.0;
const FADE_Y_OFFSET = 2.0;

export class SceneOpacity{
	constructor(){

    }

    /*************************************
     ************** UPDATE 
    **************************************/
	update() { 
        //Fade scenes
        this.manageRenderScenes();  
    }

    manageRenderScenes(){
        if(AppContext.camera.instance == undefined){
            //return;
        }
        for(let i=0; i<AppContext.scenesMeshes.length; i++){
            const mesh = AppContext.scenesMeshes[i];
            const distanceToCamera = mesh.position.x - AppContext.camera.instance.position.x;

            let opacity = 0;
            if(distanceToCamera < FADE_START){
                opacity = 1.0;
            }
            else if(distanceToCamera >= FADE_START && distanceToCamera < FADE_END){
                opacity = 1.0 - (distanceToCamera - FADE_START) / (FADE_END - FADE_START);
            }
            else if(distanceToCamera >= FADE_END){
                opacity = 0.0;
            }

            //TO REMOVE
            opacity = 1;

            mesh.traverse(child => {
                if (child.isMesh) {
                    child.material.opacity = opacity;
                }
            });

            //position
            mesh.position.y = (opacity - 1) * FADE_Y_OFFSET; // Move up when fading in

        }
    }
}