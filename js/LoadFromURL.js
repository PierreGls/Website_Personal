import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { AppContext } from './AppContext.js';



export class LoadFromURL{
	constructor(){
        // Charge les paramètres depuis l'URL
        //It would be bettter to use async to call it once everything is loaded
        setTimeout(() => {
            console.log("LoadFromURL: TO CHECK");
            this.loadFromURL();
        }, 700);
    }

    /*************************************
     ************** URL 
    **************************************/
    updateURL(){
        const params = new URLSearchParams();
        
        // Ajoute la recherche
        if(this.activeFilters.searchText){
            params.set('search', this.activeFilters.searchText);
        }
        
        // Ajoute les tags
        if(this.activeFilters.tags.size > 0){
            params.set('tags', [...this.activeFilters.tags].join(','));
        }
        
        // Ajoute le projet ouvert
        if(isModalProjectVisible && this.currentProjectID != -1){
            params.set('project', this.currentProjectID);
        }
        
        // Construit la nouvelle URL
        const newURL = params.toString() 
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;
        
        // Met à jour l'URL sans recharger
        window.history.pushState({}, '', newURL);
        
        console.log('🔗 URL mise à jour:', newURL);
        //http://127.0.0.1:5501/complete/SitePerso/index.html?tags=MR&project=VR_1
    }

    loadFromURL(){
        const params = new URLSearchParams(window.location.search);
        
        // Charge la recherche
        const search = params.get('search');
        if(search){
            document.getElementById('search-input').value = search;
            this.activeFilters.searchText = search.toLowerCase();
        }
        
        // Charge les tags
        const tags = params.get('tags');
        if(tags){
            const tagArray = tags.split(',');

            console.log('📋 Tags depuis URL:', tagArray);

            tagArray.forEach(tag => {
                this.activeFilters.tags.add(tag);
                
                // Active visuellement le bouton
                const button = this.getButtonFilterByTag(tag);
                if(button) button.classList.add('active');
            });
        }
        
        // Applique les filtres
        if(search || tags){
            this.applyFilters(false);
        }
        
        // Charge le projet si spécifié
        const projectId = params.get('project');
        if(projectId){
            const project = projectsData.find(p => p.id === projectId);
            if(project){
                setTimeout(() => {
                    this.showProjectModal(project);
                }, 500); // Petit délai pour laisser charger
            }
        }

        if(projectId || search || tags){
            this.onChangeState(1, true);
        }
        
        //To test
        //http://127.0.0.1:5501/complete/SitePerso/index.html?tags=MR%2CVR&project=VR_1
        console.log('📖 URL chargée');
    }

    /*************************************
     ************** UPDATE 
    **************************************/
	update() {   
    }
}