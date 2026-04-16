import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { AppContext } from './AppContext.js';

export class CurrentProjectName{
	constructor(){
        this.currentProjectName = '';
        this.currentProjectID = -1;
    }

    /*************************************
     ************** METHODS 
    **************************************/
    findClosestProject(){
        if(AppContext.projectsVisible.size === 0) return "";
        
        let closestProjectName = "";
        let minDistance = Infinity;
        
        AppContext.projectsVisible.forEach((projectParent, key) => {
            const projectInfos = projectParent.children[0].children[0].userData.project;
            
            // Calcule la distance par rapport à INITIAL_OFFSET_Z_PROJECTS
            const distance = Math.abs(projectParent.position.z - AppContext.offsetZProjects);

            if(distance < minDistance){
                minDistance = distance;
                closestProjectName = projectInfos.name;
            }
        });
        
        return closestProjectName;
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