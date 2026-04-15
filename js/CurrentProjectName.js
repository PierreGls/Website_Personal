import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { AppContext } from './AppContext.js';

export class CurrentProjectName{
	constructor(){
        this.currentProjectName = '';
        this.currentProjectID = -1;
    }

    /*************************************
     ************** UPDATE 
    **************************************/
	update() {   
        //Project name in state 1
        this.updateCurrentProjectName();
    }

    updateCurrentProjectName(){
        const projectNameElement = document.getElementById('project-name');
        let closestProjectName = "";
        if(AppContext.currentState === 1){
            closestProjectName = this.findClosestProject(); 
        }
        
        if(closestProjectName !== ""){
            // Update seulement si le nom a changé
            if(this.currentProjectName !== closestProjectName){
                this.currentProjectName = closestProjectName;
                projectNameElement.textContent = closestProjectName;
                projectNameElement.classList.add('visible');
            }
        } else {
            // Aucun projet visible
            if(this.currentProjectName !== ''){
                this.currentProjectName = '';
                projectNameElement.classList.remove('visible');
            }
        }
    }
}