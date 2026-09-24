import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { AppContext } from './AppContext.js';

export class ClickController{
	constructor(){
        //Click detection
        window.addEventListener('click', this.handleClickDetection.bind(this));
    }

    /*************************************
     ************** CLICK 
    **************************************/
    handleClickDetection(event){
        if(this.isClickOnUI(event)){
            return;
        }

        // Lance le rayon 
        AppContext.raycaster.setFromCamera(AppContext.mouse, AppContext.camera.camera);
        //AppContext.raycaster.setFromCamera(this.mouse, this.camera.instance);

        if(AppContext.currentState === 0){ //CLICK ON ROOMS
            this.handleClickDetectionsScenes(event);
        }
        else if(AppContext.currentState === 1){ //CLICK ON PROJECT
            this.handleClickDetectionsProjects(event);
        } 
    }

    // Vérifie si le clic provient d'un élément d'interface plutôt que du canvas
    isClickOnUI(event){
        return !!event.target.closest('#filter-bar, .menu, #project-modal, #current-project');
    }

    handleClickDetectionsScenes(event){
        const intersects = AppContext.raycaster.intersectObjects(AppContext.scenesMeshes);
        if(intersects.length > 0){
            const clickedObj = intersects[0].object;
            //console.log('🎯 Object clicked:', clickedObj.name);
            
            switch(clickedObj.name){
                case 'Cube016_1':
                case 'Cube016':
                    console.log('Ouverture du PDF');
                    //Le '_blank' ouvre dans un nouvel onglet. Si tu veux ouvrir dans la même fenêtre, utilise '_self'.
                    window.open('../../assets/PierreGalus_CV_Developer.pdf', '_blank');
                    break;
                case "Click_AR_1":
                case "Click_AR_2":
                    //this.resetFilters();
                    AppContext.filterUI.resetFilters();
                    AppContext.filterUI.toggleTagFilter('AR', AppContext.filterUI.getButtonFilterByTag("AR"));
                    AppContext.filterUI.onChangeState(1, false);
                    console.log('Click_AR');
                    break;
                case "Click_VR_1":
                case "Click_VR_2":
                    AppContext.filterUI.resetFilters();
                    AppContext.filterUI.toggleTagFilter('VR', AppContext.filterUI.getButtonFilterByTag("VR"));
                    AppContext.filterUI.onChangeState(1, false);
                    console.log('Click_VR');
                    break;
                case "Click_MR_1":
                case "Click_MR_2":
                    AppContext.filterUI.resetFilters();
                    AppContext.filterUI.onChangeState(1, false);
                    console.log('Click_MR');
                    break;
                case "Click_Game_1":
                case "Click_Game_2":
                    AppContext.filterUI.resetFilters();
                    AppContext.filterUI.toggleTagFilter('Games', AppContext.filterUI.getButtonFilterByTag("Games"));
                    AppContext.filterUI.onChangeState(1, false);
                    console.log('Click_Game');
                    break;
                case AppContext.INTERACTIVES_NAMES[10]: //Linkedin
                case AppContext.INTERACTIVES_NAMES[11]:
                    console.log('Linkedin');
                    window.open('https://www.linkedin.com/in/pierregalus/', '_blank');
                    break;
            }
        } 
    }

    handleClickDetectionsProjects(event){
        if(AppContext.isModalProjectVisible){ return; }
        //because raycast hits invisible objects as well
        const visibleProjectMeshes = AppContext.projectsMeshes.filter(mesh => mesh.visible);
        const intersectsProjects = AppContext.raycaster.intersectObjects(visibleProjectMeshes);

        if(intersectsProjects.length > 0){
            const clickedObj = intersectsProjects[0].object;
            console.log('🎯 Project clicked2:', clickedObj.userData.project);

            AppContext.filterUI.showProjectModal(clickedObj.userData.project);
        } 
    }
}