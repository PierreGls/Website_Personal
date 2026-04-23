import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { AppContext } from './AppContext.js';

const DELAY_APPEARANCE_BUTTONS = 1000;//milliseconds

var buttonSet = new Set();

export class UIManager
{
	constructor()
    {
        this.setupFilters();
        this.setupUI();
    }

    //#region Initialization

    setupUI()
    {
        const buttonsProjects = document.querySelectorAll('#menu-projects button');
        buttonsProjects.forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                console.log("Button click")
            });
        });

        document.getElementById('btn-contact').addEventListener('click', () => {
            this.showContactModal();
        });

        //Anim current menu with delay
        setTimeout(() => {
            this.fadeInMenu(AppContext.TAG_CSS_PROJECTS);
            this.fadeInFilters();
        }, DELAY_APPEARANCE_BUTTONS);

        console.log('✅ UI setup complete');
    }

    setupFilters()
    {
        // Input de recherche
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            this.modifySearchInput(e);
        });
    
        // Bouton reset
        document.getElementById('reset-filters').addEventListener('click', () => {
            this.resetFilters();
        });
        // Setup toggle
        this.setupFilterToggle();        
        console.log('✅ Filters setup complete');
    }

    setupFilterToggle()
    {
        this.filtersCollapsed = false;
        
        const toggleBtn = document.getElementById('toggle-filters');
        const filterContent = document.getElementById('filter-content');
        const filterBar = document.getElementById('filter-bar');
        
        toggleBtn.addEventListener('click', () => {
            this.toggleFilterCollapse(filterContent, toggleBtn, filterBar);
        });
        console.log('✅ Toggle filters setup complete');
    }

    generateTagButtons()
    {
        const tagContainer = document.getElementById('tag-filters');

        tagContainer.innerHTML = '';
        
        AppContext.allTags.forEach(tag => {
            const button = document.createElement('button');
            button.className = 'tag-filter';
            button.textContent = tag;
            button.dataset.tag = tag;
            
            button.addEventListener('click', () => {
                this.toggleTagFilter(tag, button);
            });            
            tagContainer.appendChild(button);
            buttonSet.add(button);
        }); 
        this.applyFilters(false);
        console.log('✅ Tags buttons generated:', AppContext.allTags.size);
    }

    //#endregion

    //#region Animations

   // Fade out un menu
    fadeOutMenu(menuId)
    {
        const menu = document.getElementById(menuId);
        if(menu){
            menu.classList.remove('fade-in');
            menu.classList.add('fade-out');
            console.log('👋 Fade out:', menuId);
        }
    }

    // Fade in un menu
    fadeInMenu(menuId)
    {
        const menu = document.getElementById(menuId);
        if(menu){
            menu.classList.remove('fade-out');
            menu.classList.add('fade-in');
            console.log('👋 Fade in:', menuId);
        }
    }

    // Fade out la barre de filtres
    fadeOutFilters()
    {
        const filterBar = document.getElementById('filter-bar');
        if(filterBar){
            filterBar.classList.remove('fade-in');
            filterBar.classList.add('fade-out');
            console.log('👋 Filtres cachés');
        }
    }

    // Fade in la barre de filtres
    fadeInFilters()
    {
        const filterBar = document.getElementById('filter-bar');
        if(filterBar){
            filterBar.classList.remove('fade-out');
            filterBar.classList.add('fade-in');
            console.log('👋 Filtres affichés');
        }
    }

    //#endregion

    //#region Filters

    modifySearchInput(e)
    {
        const rawValue = e.target.value;
        const sanitizedValue = this.sanitizeInput(rawValue);        
        AppContext.activeFilters.searchText = sanitizedValue.toLowerCase();
        this.applyFilters(true);
    }

    toggleFilterCollapse(filterContent, toggleBtn, filterBar)
    {
        this.filtersCollapsed = !this.filtersCollapsed;
        
        if(this.filtersCollapsed){
            filterContent.classList.add('collapsed');
            toggleBtn.classList.add('collapsed');
            filterBar.classList.add('collapsed');
            console.log('📁 Filters collapsed');
        } else {
            filterContent.classList.remove('collapsed');
            toggleBtn.classList.remove('collapsed');
            filterBar.classList.remove('collapsed');
            console.log('📂 Filters open');
        }
    }

    toggleTagFilter(tag, button)
    {
        if(AppContext.activeFilters.tags.size <= 0)
        {
            buttonSet.forEach(btn => {
                btn.classList.remove('active');
            });
        }

        if(AppContext.activeFilters.tags.has(tag)){
            // Désactive le tag
            AppContext.activeFilters.tags.delete(tag);
            button.classList.remove('active');
        } else {
            // Active le tag
            AppContext.activeFilters.tags.add(tag);
            button.classList.add('active');
        }
        
        this.applyFilters(true);
        console.log('🏷️ Active filters:', [...AppContext.activeFilters.tags]);
    }

    applyFilters(mustReloadURL)
    {
        const previousVisibleCount = AppContext.projectsVisible.size;
        AppContext.projectsVisible.clear();
        let currentKeyVisible = 0;
        AppContext.scrollProjectAmount = 0;

        AppContext.projectMap.forEach((projectParent, key) => {
            const projectInfos = projectParent.children[0].children[0].userData.project;
            let visible = true;
            // Filtre par nom
            if(AppContext.activeFilters.searchText){
                const nameMatch = projectInfos.name.toLowerCase().includes(AppContext.activeFilters.searchText);
                if(!nameMatch) visible = false;
            }
            // Filtre par tags
            if(AppContext.activeFilters.tags.size > 0)
            {
                const hasMatchingTag = projectInfos.tags?.some(tag => 
                    AppContext.activeFilters.tags.has(tag)
                );
                if(!hasMatchingTag) visible = false;
            }
            else
            {
                buttonSet.forEach(btn => {
                    btn.classList.add('active');
                });
            }
            projectParent.visible = visible;            
            if(visible){
                AppContext.projectsVisible.set(currentKeyVisible, projectParent);
                currentKeyVisible++;
            }
        });

        //Camera reset
        if(mustReloadURL && AppContext.camera && currentKeyVisible < previousVisibleCount){
            AppContext.camera.resetToInitial();
        }

        //URL
        if(mustReloadURL){
            AppContext.urlManager.updateURL();
        }
        console.log('🔍 Filters applied : ' + (currentKeyVisible) + ' visible projects');
    }

    resetFilters()
    {
        // Reset recherche
        document.getElementById('search-input').value = '';
        AppContext.activeFilters.searchText = '';
        
        // Reset tags
        AppContext.activeFilters.tags.clear();
        document.querySelectorAll('.tag-filter').forEach(btn => {
            btn.classList.remove('active');
        });

        this.applyFilters(true);        
        console.log('🔄 Filtres réinitialisés');
    }

    getButtonFilterByTag(tagValue)
    {
        const button = document.querySelector(`[data-tag="${tagValue}"]`);
        return button;
    }

    //Increase security against code injection
    sanitizeInput(input)
    {
        // Retire les caractères dangereux
        return input
            .replace(/[<>\"']/g, '') 
            .trim()
            .substring(0, 100); 
    }

    //#endregion

    //#region Modal

    showContactModal(){
        AppContext.isModalProjectVisible = true;

        const modal = document.createElement('div');
        modal.id = 'contact-modal';
        modal.innerHTML = `
            <div class="modal-content contact-modal-content">
                <span class="close">&times;</span>
                <h2>Contact</h2>
                <p class="contact-name">Guillaume Bertrand</p>
                <div class="contact-links">
                    <a class="contact-link" href="mailto:guillaumebertrand33@gmail.com">
                        ✉ guillaumebertrand33@gmail.com
                    </a>
                    <a class="contact-link" href="https://www.linkedin.com/in/guillaumebertrand33/" target="_blank" rel="noopener noreferrer">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        LinkedIn
                    </a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const close = () => {
            document.body.removeChild(modal);
            AppContext.isModalProjectVisible = false;
        };

        modal.querySelector('.close').onclick = close;
        modal.addEventListener('click', (e) => { if(e.target === modal) close(); });
    }

    showProjectModal(project){
        AppContext.isModalProjectVisible = true;
        AppContext.currentProjectID = project.id;

        let tagHTML = '';
        project.tags.forEach(newTag => {
            tagHTML += `<p class="tag">${newTag}</p>`
        });

        // Crée une modal HTML avec la vidéo et description
        const modal = document.createElement('div');
        modal.id = 'project-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>${project.name}</h2>
                <div class="tags">
                    ${tagHTML}
                </div>
                <video controls autoplay>
                    <source src="${project.videoPath}" type="video/mp4">
                </video>
                <p class="description">${project.description}</p>
                <div class="links">
                    ${project.links.github ? `<a href="${project.links.github}" target="_blank">GitHub</a>` : ''}
                    ${project.links.demo ? `<a href="${project.links.demo}" target="_blank">Demo</a>` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

        AppContext.audio.setVolumeBGMusic(0.0);
        
        // Fermeture
        modal.querySelector('.close').onclick = () => {
            document.body.removeChild(modal);
            AppContext.isModalProjectVisible = false;
            AppContext.currentProjectID = -1;

            //Sound
            AppContext.audio.setVolumeBGMusic(AppContext.BACKGROUND_VOLUME);

            //URL
            AppContext.urlManager.updateURL();
        };

        //URL
        AppContext.urlManager.updateURL();
    }

    //#endregion

	update() 
    {   
    }
}