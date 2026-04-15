import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { AppContext } from './AppContext.js';
import { Header } from './Header.js';


const COLOR_BG = 0xaaaaaa;

export class ClickController{
	constructor(){
        //Click detection
        window.addEventListener('click', this.handleClickDetection.bind(this));
    }

    /*************************************
     ************** CLICK 
    **************************************/
    //click detection
    handleClickDetection(event){
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
                    window.open('../../assets/PierreGalus_CV_XRDeveloper.pdf', '_blank');
                    break;
                case "Click_AR_1":
                case "Click_AR_2":
                    //this.resetFilters();
                    AppContext.filterUI.resetFilters();
                    AppContext.filterUI.toggleTagFilter('AR', AppContext.filterUI.getButtonFilterByTag("AR"));
                    this.onChangeState(1, false);
                    console.log('Click_AR');
                    break;
                case "Click_VR_1":
                case "Click_VR_2":
                    AppContext.filterUI.resetFilters();
                    AppContext.filterUI.toggleTagFilter('VR', AppContext.filterUI.getButtonFilterByTag("VR"));
                    this.onChangeState(1, false);
                    console.log('Click_VR');
                    break;
                case "Click_MR_1":
                case "Click_MR_2":
                    AppContext.filterUI.resetFilters();
                    this.onChangeState(1, false);
                    console.log('Click_MR');
                    break;
                case "Click_Game_1":
                case "Click_Game_2":
                    AppContext.filterUI.resetFilters();
                    AppContext.filterUI.toggleTagFilter('Games', AppContext.filterUI.getButtonFilterByTag("Games"));
                    this.onChangeState(1, false);
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
        if(isModalProjectVisible){ return; }
        const intersectsProjects = AppContext.raycaster.intersectObjects(AppContext.projectsMeshes);
        if(intersectsProjects.length > 0){
            const clickedObj = intersectsProjects[0].object;
            console.log('🎯 Project clicked2:', clickedObj.userData.project);

            this.showProjectModal(clickedObj.userData.project);
        } 
    }

    onChangeState(newState, fromLoadURL){
        console.log('Change state : ' + newState);
        AppContext.currentState = newState;

        if(newState === 0){
            this.targetScenesZ = 0;
            offsetZProjects = OFFSET_Z_PROJECTS_STATE_INVISIBLE;
            scrollProjectAmount = 0;
            this.fadeOutFilters();
            this.switchMenus(TAG_CSS_PROJECTS, TAG_CSS_SCENES);
            this.resetFilters();
        }
        else{
            this.targetScenesZ = 10;
            offsetZProjects = OFFSET_Z_PROJECTS_STATE_VISIBLE;
            this.fadeInFilters();
            this.switchMenus(TAG_CSS_SCENES, TAG_CSS_PROJECTS);
        }
        this.triggerFlash();
    }

    // Fonction pour déclencher le flash
    triggerFlash(){
        const flashOverlay = document.getElementById('flash-overlay');
        
        // Ajoute la classe
        flashOverlay.classList.add('flash');
        
        // Retire la classe après l'animation
        setTimeout(() => {
            flashOverlay.classList.remove('flash');
        }, 1100); // Durée de l'animation

        this.playSFXFlash();
        
        console.log('⚡ Flash!');
    }

    /*************************************
     ************** UPDATE 
    **************************************/
    
    //Update
	render() {   
        const dt = this.clock.getDelta();

        this.camera.update();
        this.renderer.update();
        this.scenesLoader.update();
        this.scroller.update();
        this.currentProjectName.update();
        this.outline.update();
    }

    debugSceneHierarchy(){
        console.log('🌳 Hiérarchie:');
        console.log('Scene principale');
        console.log('└── SceneContainer', this.sceneContainer.position);
        this.sceneContainer.children.forEach((child, i) => {
            console.log('    └── Scène', i, child.position);
        });
    }
}