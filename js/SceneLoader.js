import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/DRACOLoader.js';
import { LoadingBar } from '../libs/LoadingBar.js';
import { AppContext } from './AppContext.js';

//Filters
const allTags = new Set();

export class SceneLoader{
	constructor(){
        this.scene    = AppContext.scene;

        AppContext.loadingBar = new LoadingBar();

        //Create container for scenes and projects
        this.projectContainer = null;
        this.createContainers();

        // Initialisation du loader
        this.loader = new GLTFLoader().setPath('../../assets/');
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('../../libs/three/examples/jsm/libs/draco/');
        this.loader.setDRACOLoader(dracoLoader);

        // Un objet pour stocker la progression de chaque GLB
        this._progress = {};

        this.loadGLTFs(AppContext.filterUI);

        console.log('✅ SceneLoader ready');
    }

    /*************************************
     ************** INIT  
    **************************************/
    createContainers(){
        // Crée un Object3D vide comme parent
        this.projectContainer = new THREE.Object3D();
        this.projectContainer.position.set(0, 0, 0);
        this.projectContainer.name = 'ProjectContainer';
        this.scene.add(this.projectContainer);

        AppContext.projectContainer = this.projectContainer;
        
        console.log('✅ Containers created');
    }

    generateTagButtons(filterUI){
        // Crée les boutons
        const tagContainer = document.getElementById('tag-filters');
        tagContainer.innerHTML = '';
        
        allTags.forEach(tag => {
            const button = document.createElement('button');
            button.className = 'tag-filter';
            button.textContent = tag;
            button.dataset.tag = tag;
            
            button.addEventListener('click', () => {
                //AppContext.filterUI.toggleTagFilter(tag, button);
                filterUI.toggleTagFilter(tag, button);
            });
            
            tagContainer.appendChild(button);
        });
        
        console.log('✅ Tags générés:', allTags.size);
    }

    /*************************************
     ************** LOAD 
    **************************************/
    // Load multiple GLTF projects
    async loadGLTFs(filterUI){
        //Projects
        await this.loadProjectsData();

        AppContext.projectsData.forEach((projectData, index) => {
            this.loadProject(projectData, index);
        });

        await this.sortProjects(filterUI);
    }

    async loadProjectsData(){
        try {
            // Charge la liste des projets
            const response = await fetch('../../assets/projects/index.json');
            const data = await response.json();
            
            // Charge les infos de chaque projet
            for(const project of data.projects){
                const folder = `${project.id}`.slice(0, 2)
                
                AppContext.projectsData.push({
                    ...project,
                    logoPath: '../../assets/projects/'+ folder +"/"+ project.name + '/icon.png',
                    videoPath: '../../assets/projects/'+ folder +"/"+ project.name + '/preview.mp4'
                });

                if(project.tags){
                    project.tags.forEach(tag => allTags.add(tag));
                }
            }
            
            console.log('✅ Projets chargés:', AppContext.projectsData);
            
        } catch(error){
            console.error('❌ Erreur chargement:', error);
        }
    }

    async sortProjects(filterUI){
        setTimeout(() => {
            //Sort the map
            const sortedMap = new Map(
                [...AppContext.projectMap.entries()].sort((a, b) => a[0] - b[0])
            );
            AppContext.projectMap = sortedMap;
            AppContext.filterUI.applyFilters(false);

            // Génère les boutons de tags
            this.generateTagButtons(filterUI);
        }, 500);
    }

    /*************************************
     ************** Loaders
    **************************************/
    loadProject(projectData, index, onLoaded) {
        this._progress[projectData.name] = 0;

        this.loader.load(
            'instanceProject.glb',
            (gltf) => this._onLoadedProject(gltf, index, projectData, onLoaded),
            (xhr)  => this._onProgress(xhr, projectData.name),
            (err)  => this._onError(err)
        );
    }

    /*************************************
     ************** CALLBACKS
    **************************************/
     _onProgress(xhr, name) {
        this._progress[name] = xhr.loaded / xhr.total;

        // Calcule la moyenne globale de tous les GLB
        const values    = Object.values(this._progress);
        const total     = values.reduce((sum, v) => sum + v, 0);
        const globalProgress = total / values.length;

        // Met à jour la loading bar
        AppContext.loadingBar.progress = globalProgress;

        //console.log(`📦 ${name} : ${Math.round(globalProgress * 100)}%`);
    }

    _onLoadedScene(gltf, name, index, onLoaded) {
        const root = gltf.scene;
        this.sceneObj = gltf.scene;
        this.sceneObj.rotation.set(0, 0, 0);
        this.sceneObj.position.set(6 * index,0,0);
        this.sceneContainer.add(gltf.scene); //sceneContainer = parent

        //Make material transparent
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                //Need to have to fade in/out
                child.material.transparent = true;

                //Work on material here
            }
        });

        //Add to array
        AppContext.scenesMeshes.push(gltf.scene);

        this._progress[name] = 1;
        this.isAllLoaded();

        //console.log(`✅ Scene "${name}" loaded`);

        // Callback appelé dans App (ex: démarrer le render loop)
        if (onLoaded) onLoaded(gltf);
    }

    _onLoadedProject(gltf, index, projectData, onLoaded) {
        this.sceneObj = gltf.scene;
        this.sceneObj.rotation.set(0, 0, 0);
        this.sceneObj.position.set(
            0,
            AppContext.INITIAL_OFFSET_Y_PROJECTS + index * AppContext.INTERVALLE_Y_PROJECTS,
            AppContext.offsetZProjects - index * AppContext.INTERVALLE_Z_PROJECTS
        );
        this.sceneObj.scale.set(0.6,0.6,0.6);
        AppContext.scene.add( gltf.scene );

        //Get objs
        let frameObj = this.sceneObj.children[0].children[0];
        let placeholderObj = this.sceneObj.children[0].children[1];

        //To check multiple material 
        const materialToChange = placeholderObj.material;

        //Get logo texture
        const srcLlogo = projectData.logoPath;
        const textureLoader = new THREE.TextureLoader();

        textureLoader.loadAsync(srcLlogo)
        .then(texture => { // Use the texture
            materialToChange.map = texture;
        })
        .catch(error => { // Path is invalid or image is inaccessible
            console.error('Failed to load texture of ' + projectData.name + ' : ', error);
        });
        
        //Make material transparent
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                //Need to have to fade in/out
                child.material.transparent = true;

                //Store infos in 3D obj
                child.userData.project = projectData
            }
        });

        //Add to arrays
        AppContext.projectsMeshes.push(gltf.scene);
        AppContext.projectMap.set(index, gltf.scene);

        this._progress[projectData.name] = 1;
        this.isAllLoaded();

        // Callback appelé dans App (ex: démarrer le render loop)
        if (onLoaded) onLoaded(gltf);
    }

    _onError(err) {
        console.error('❌ SceneLoader error :', err.message);
    }

    isAllLoaded(){
        if(AppContext.areProjectsLoaded) return true;

        const allLoaded = Object.values(this._progress).every(v => v === 1);
        if (allLoaded) {
            AppContext.loadingBar.visible = false;
            AppContext.areProjectsLoaded = true;
            AppContext.renderer.startLoop(AppContext.render);
            console.log('✅ Tous les GLB chargés');
        }
    }

    /*************************************
     ************** UPDATE 
    **************************************/
	update() {   
    }


}