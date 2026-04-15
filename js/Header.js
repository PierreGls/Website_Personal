import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { AppContext } from './AppContext.js';

//UI
const TAG_CSS_SCENES = 'menu-scenes';
const TAG_CSS_PROJECTS = 'menu-projects';
const DELAY_APPEARANCE_BUTTONS = 1000;//milliseconds

export class Header{
	constructor(){
        //Filters
        this.activeFilters = {
            searchText: '',
            tags: new Set()
        };
        this.setupFilters();

        //Header
        this.setupUI();
    }

    /*************************************
     ************** INIT  
    **************************************/

    setupUI(){
        const buttons = document.querySelectorAll('#menu-scenes button');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                console.log('🔘 Bouton cliqué, ID:', id);
                
                // Ton code ici selon le bouton
                this.onButtonMenuClick(id);
            });
        });

        const buttonsProjects = document.querySelectorAll('#menu-projects button');
        buttonsProjects.forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.onButtonBackToSceneClick(id);
            });
        });


        //Anim current menu with delay
        setTimeout(() => {
            if(AppContext.currentState === 0){{
                this.fadeInMenu(TAG_CSS_SCENES);
                this.fadeOutMenu(TAG_CSS_PROJECTS);
            }}
            else{
                this.fadeOutMenu(TAG_CSS_SCENES);
                this.fadeInMenu(TAG_CSS_PROJECTS);
            }
        }, DELAY_APPEARANCE_BUTTONS);
        
        console.log('✅ UI setup complete');
    }

    setupFilters(){
        // Input de recherche
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            const rawValue = e.target.value;
            const sanitizedValue = this.sanitizeInput(rawValue);
            this.activeFilters.searchText = sanitizedValue.toLowerCase();
            this.applyFilters(true);
        });
        
        // Bouton reset
        document.getElementById('reset-filters').addEventListener('click', () => {
            this.resetFilters();
        });

        // Setup toggle
        this.setupFilterToggle();

        // Cache les filtres au départ
        this.fadeOutFilters();
        
        console.log('✅ Filtres activés');
    }

    setupFilterToggle(){
        this.filtersCollapsed = false;
        
        const toggleBtn = document.getElementById('toggle-filters');
        const filterContent = document.getElementById('filter-content');
        const filterBar = document.getElementById('filter-bar');
        
        toggleBtn.addEventListener('click', () => {
            this.filtersCollapsed = !this.filtersCollapsed;
            
            if(this.filtersCollapsed){
                // Replie
                filterContent.classList.add('collapsed');
                toggleBtn.classList.add('collapsed');
                filterBar.classList.add('collapsed');
                console.log('📁 Filtres repliés');
            } else {
                // Déplie
                filterContent.classList.remove('collapsed');
                toggleBtn.classList.remove('collapsed');
                filterBar.classList.remove('collapsed');
                console.log('📂 Filtres dépliés');
            }
        });

        console.log('✅ Toggle filtres activé');
    }

    /*************************************
     ************** ANIM UI 
    **************************************/
    // Fade out un menu
    fadeOutMenu(menuId){
        const menu = document.getElementById(menuId);
        if(menu){
            menu.classList.remove('fade-in');
            menu.classList.add('fade-out');
            console.log('👋 Fade out:', menuId);
        }
    }

    // Fade in un menu
    fadeInMenu(menuId){
        const menu = document.getElementById(menuId);
        if(menu){
            menu.classList.remove('fade-out');
            menu.classList.add('fade-in');
            console.log('👋 Fade in:', menuId);
        }
    }

    // Switch entre deux menus
    switchMenus(hideMenuId, showMenuId){
        this.fadeOutMenu(hideMenuId);
        
        // Attend la fin du fade out avant de fade in
        setTimeout(() => {
            this.fadeInMenu(showMenuId);
        }, 500); // Durée du fade out
    }

    // Fade out la barre de filtres
    fadeOutFilters(){
        const filterBar = document.getElementById('filter-bar');
        if(filterBar){
            filterBar.classList.remove('fade-in');
            filterBar.classList.add('fade-out');
            console.log('👋 Filtres cachés');
        }
    }

    // Fade in la barre de filtres
    fadeInFilters(){
        const filterBar = document.getElementById('filter-bar');
        if(filterBar){
            filterBar.classList.remove('fade-out');
            filterBar.classList.add('fade-in');
            console.log('👋 Filtres affichés');
        }
    }

    /*************************************
     ************** MENU SCENE 
    **************************************/

    onButtonMenuClick(id){
        if(AppContext.currentState === 1) { 
            console.log("Can't click on these buttons if we are on the projects");
            return;
        }
        console.log('Action bouton ' + id);
        AppContext.scrollSceneAmount = (id - 1)/3;
    }

    /*************************************
     ************** MENU PROJECTS FILTERS
    **************************************/
    toggleTagFilter(tag, button){
        if(this.activeFilters.tags.has(tag)){
            // Désactive le tag
            this.activeFilters.tags.delete(tag);
            button.classList.remove('active');
        } else {
            // Active le tag
            this.activeFilters.tags.add(tag);
            button.classList.add('active');
        }
        
        this.applyFilters(true);
        console.log('🏷️ Filtres actifs:', [...this.activeFilters.tags]);
    }

    applyFilters(mustReloadURL){
        AppContext.projectsVisible.clear();
        let currentKeyVisible = 0;

        AppContext.scrollProjectAmount = 0;
        
        AppContext.projectMap.forEach((projectParent, key) => {
            const projectInfos = projectParent.children[0].children[0].userData.project;
            let visible = true;

            // Filtre par nom
            if(this.activeFilters.searchText){
                const nameMatch = projectInfos.name.toLowerCase().includes(this.activeFilters.searchText);
                if(!nameMatch) visible = false;
            }
            
            // Filtre par tags
            if(this.activeFilters.tags.size > 0){
                const hasMatchingTag = projectInfos.tags?.some(tag => 
                    this.activeFilters.tags.has(tag)
                );
                if(!hasMatchingTag) visible = false;
            }
            
            projectParent.visible = visible;
            
            if(visible){
                AppContext.projectsVisible.set(currentKeyVisible, projectParent);
                currentKeyVisible++;
            }
        });

        //URL
        if(mustReloadURL){
            console.log("TODO updateURL");
            //this.updateURL();
        }
        
        console.log('🔍 Filtres appliqués : ' + (currentKeyVisible) + ' projects visibles ');
    }

    resetFilters(){
        // Reset recherche
        document.getElementById('search-input').value = '';
        this.activeFilters.searchText = '';
        
        // Reset tags
        this.activeFilters.tags.clear();
        document.querySelectorAll('.tag-filter').forEach(btn => {
            btn.classList.remove('active');
        });

        this.applyFilters(true);
        
        console.log('🔄 Filtres réinitialisés');
    }

    onButtonBackToSceneClick(id){
        if(AppContext.currentState === 0) { 
            console.log("Can't click on these buttons if we are on the projects");
            return;
        }

        console.log('🔘 Bouton cliqué BACK TO HOME, ID:', id);
        this.onChangeState(0, false);
    }

    getButtonFilterByTag(tagValue){
        const button = document.querySelector(`[data-tag="${tagValue}"]`);

        console.log('Tag:', tagValue);
        console.log(document);

        return button;
    }

    //Increase security against code injection
    sanitizeInput(input){
        // Retire les caractères dangereux
        return input
            .replace(/[<>\"']/g, '') // Retire < > " '
            .trim()
            .substring(0, 100); // Limite la longueur
    }

    /*************************************
     ************** UPDATE 
    **************************************/
	update() {   

    }
}