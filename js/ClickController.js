import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { AppContext } from './AppContext.js';

export class ClickController{
	constructor(){
        window.addEventListener('click', this.handleClickDetection.bind(this));
    }

    /*************************************
     ************** CLICK 
    **************************************/
    handleClickDetection(event){
        AppContext.raycaster.setFromCamera(AppContext.mouse, AppContext.camera.camera);
        this.handleClickDetectionsProjects(event);
    }

    handleClickDetectionsProjects(event){
        if(AppContext.isModalProjectVisible){ return; }
        const intersectsProjects = AppContext.raycaster.intersectObjects(AppContext.projectsMeshes);
        if(intersectsProjects.length > 0){
            const clickedObj = intersectsProjects[0].object;
            AppContext.filterUI.showProjectModal(clickedObj.userData.project);
        } 
    }
}