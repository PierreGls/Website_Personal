import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/DRACOLoader.js';
import { LoadingBar } from '../libs/LoadingBar.js';
import { AppContext } from './AppContext.js';

//MVT SCENES
const SCENES_MIN_X = -1;
const SCENES_MAX_X = 18;
const SCROLL_SPEED = 0.0005;
const ANIMATION_SCENES_LERP_RATIO = 0.05;

//PROJECT
let scrollProjectAmount = 0;
const INITIAL_OFFSET_Y_PROJECTS = 1.5; 
const INTERVALLE_Y_PROJECTS = 0.3;
const OFFSET_Z_PROJECTS_STATE_VISIBLE = 0;
const OFFSET_Z_PROJECTS_STATE_INVISIBLE = -10;
let offsetZProjects = OFFSET_Z_PROJECTS_STATE_INVISIBLE;
const INTERVALLE_Z_PROJECTS = 1;
const SCROLL_PROJECT_MULTIPLIER = 10;
const SCROLL_PROJECT_MAX_MULTIPLIER = 0.1;

const ANIMATION_PROJECT_X_POS_MULTIPLIER = 1.5;
const ANIMATION_PROJECT_Z_ROT_MULTIPLIER = -0.5;
const ANIMATION_PROJECT_LERP_RATIO = 0.08;

//let scenesMeshes = [];
//let projectsMeshes = [];
let projectsMeshes_Childrens = [];
//let projectMap = new Map();
//let projectsVisible = new Map();
let projectsData = [];

//Filters
const allTags = new Set();

const SHADOW_CASTER_OBJS = [
    'Desk',
    'DeskSmall',
    'Pot',
    'Plant1',
    'Plant1001',
    'Pot001',
    'Plant',
    'Plane',
    'Pilllow001',
    'Pilllow',
    'Pilllow2',
    'Table',
    'Tasse002',
    'Tasse003',
    'Cactus',
    'Cube060',
    'Cube060_1',
    'ShelfRoom',
    'Pillow',
    'Pot003',
    'Cube058',
    'Book005',
    'Circle001',
    'Circle001_1',
    'Circle001_2',
    'Cube019',
    'Cube019_1',
];
const SHADOW_RECEIVER_OBJS = [
    'Walls001',
    'Walls',
    'Walls3',
    'Cube034',
    'Desk',
    'Sofa',
    'Sofa2',
    'Table',
    'ShelfRoom',
    'Cube039_1',
    'Cube039_2',
    'Cube039_3',
    'Cube058',
];

export class SceneLoader{
	constructor(scene, renderer){
        this.scene    = scene;
        this.renderer = renderer;

        this.loadingBar = new LoadingBar();

        //Create container for scenes and projects
        this.sceneContainer = null;
        this.projectContainer = null;
        this.createContainers();

        // Initialisation du loader
        this.loader = new GLTFLoader().setPath('../../assets/');
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('../../libs/three/examples/jsm/libs/draco/');
        this.loader.setDRACOLoader(dracoLoader);

        //this.loadGLTFs();

        
        /* DOESNT WORK
        this.load('scene1', 0, () => {
            //console.log(this.renderer);
            this.renderer.startLoop(this.renderer.renderer.render.bind(this));
        });
        */

        console.log('✅ SceneLoader ready');
    }

    /*************************************
     ************** INIT  
    **************************************/
    createContainers(){
        // Crée un Object3D vide comme parent
        this.sceneContainer = new THREE.Object3D();
        this.sceneContainer.position.set(0, 0, 0);
        this.sceneContainer.name = 'SceneContainer';
        this.scene.add(this.sceneContainer);

        this.projectContainer = new THREE.Object3D();
        this.projectContainer.position.set(0, 0, 0);
        this.projectContainer.name = 'ProjectContainer';
        this.scene.add(this.projectContainer);

        AppContext.sceneContainer =  this.sceneContainer;
        AppContext.projectContainer =  this.projectContainer;
        
        console.log('✅ Containers created');
    }

    generateTagButtons(){
        // Crée les boutons
        const tagContainer = document.getElementById('tag-filters');
        tagContainer.innerHTML = '';
        
        allTags.forEach(tag => {
            const button = document.createElement('button');
            button.className = 'tag-filter';
            button.textContent = tag;
            button.dataset.tag = tag;
            
            button.addEventListener('click', () => {
                this.toggleTagFilter(tag, button);
            });
            
            tagContainer.appendChild(button);
        });
        
        console.log('✅ Tags générés:', allTags.size);
    }

    /*************************************
     ************** LOAD 
    **************************************/

    load(name, index, onLoaded) {
        this.loader.load(
            (name ? name : 'scene1_blank') + '.glb',
            (gltf) => this._onLoaded(gltf, name, index, onLoaded),
            (xhr)  => this._onProgress(xhr),
            (err)  => this._onError(err)
        );
    }

    /*************************************
     ************** CALLBACKS
    **************************************/

    _onLoaded(gltf, name, index, onLoaded) {
        const root = gltf.scene;

        this.sceneObj = gltf.scene;
        this.sceneObj.rotation.set(0, 0, 0);
        this.sceneObj.position.set(6 * index,0,0);
        //this.scene.add( gltf.scene );
        this.sceneContainer.add(gltf.scene); //sceneContainer = parent
        this.loadingBar.visible = false;

        //Make material transparent
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                //Need to have to fade in/out
                child.material.transparent = true;

                //To have the good ouline
                switch(child.name){
                    case AppContext.INTERACTIVES_NAMES[0]:
                        AppContext.frameAR = child;
                        break;
                    case AppContext.INTERACTIVES_NAMES[2]:
                        AppContext.frameVR = child;
                        break;
                    case AppContext.INTERACTIVES_NAMES[4]:
                        AppContext.frameMR = child;
                        break;
                    case AppContext.INTERACTIVES_NAMES[6]:
                        AppContext.frameGame = child;
                        break;
                    case AppContext.INTERACTIVES_NAMES[8]:
                        AppContext.frameCV = child;
                        break;
                    case AppContext.INTERACTIVES_NAMES[10]:
                        AppContext.frameLinkedin = child;
                        break;
                    default:
                        break;
                }

                //Add Shadows casters on some objects
                if(SHADOW_CASTER_OBJS.includes(child.name)){
                    child.castShadow = true;
                }

                //Add Shadows receivers on some objects
                if(SHADOW_RECEIVER_OBJS.includes(child.name)){
                    child.receiveShadow = true;
                }
            }
        });

        //Add to array
        AppContext.scenesMeshes.push(gltf.scene);
        //console.log(`Scene ${name} loaded`);

        console.log(`✅ Scene "${name}" loaded`);

        // Callback appelé dans App (ex: démarrer le render loop)
        if (onLoaded) onLoaded(gltf);
    }

    _onProgress(xhr) {
        const progress = xhr.loaded / xhr.total;
        //if (onProgress) onProgress(progress);
    }

    _onError(err) {
        console.error('❌ SceneLoader error :', err.message);
    }

    /*************************************
     ************** LOAD 
    **************************************/

    // Load multiple GLTF scenes
    async loadGLTFs(){
        // Scenes
       this.loadGLTFScene('scene1', 0);
       this.loadGLTFScene('scene2', 1);
       this.loadGLTFScene('scene3', 2);
       this.loadGLTFScene('scene4', 3);
       
        //Projects
        //await this.loadProjects();
    }

    loadGLTFScene(name, index){
		// Load a glTF resource
		loader.load(
			// resource URL
			(name ? name : 'scene1_blank') + '.glb',
			// called when the resource is loaded
			gltf => {
                this.sceneObj = gltf.scene;
                this.sceneObj.rotation.set(0, 0, 0);
                this.sceneObj.position.set(6 * index,0,0);
				//this.scene.add( gltf.scene );
                this.sceneContainer.add(gltf.scene); //sceneContainer = parent
                this.loadingBar.visible = false;
                //this.renderer.setAnimationLoop(this.render.bind(this)); //TODO

                //Make material transparent
                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        //Need to have to fade in/out
                        child.material.transparent = true;

                        //To have the good ouline
                        switch(child.name){
                            case AppContext.INTERACTIVES_NAMES[0]:
                                AppContext.frameAR = child;
                                break;
                            case AppContext.INTERACTIVES_NAMES[2]:
                                AppContext.frameVR = child;
                                break;
                            case AppContext.INTERACTIVES_NAMES[4]:
                                AppContext.frameMR = child;
                                break;
                            case AppContext.INTERACTIVES_NAMES[6]:
                                AppContext.frameGame = child;
                                break;
                            case AppContext.INTERACTIVES_NAMES[8]:
                                AppContext.frameCV = child;
                                break;
                            case AppContext.INTERACTIVES_NAMES[10]:
                                AppContext.frameLinkedin = child;
                                break;
                            default:
                                break;
                        }

                        //Add Shadows casters on some objects
                        if(SHADOW_CASTER_OBJS.includes(child.name)){
                            child.castShadow = true;
                        }

                        //Add Shadows receivers on some objects
                        if(SHADOW_RECEIVER_OBJS.includes(child.name)){
                            child.receiveShadow = true;
                        }
                    }
                });

                //Add to array
                AppContext.scenesMeshes.push(gltf.scene);
                //console.log(`Scene ${name} loaded`);
			},
			// called while loading is progressing
			xhr => {
				this.loadingBar.progress = (xhr.loaded / xhr.total);
			},
			// called when loading has errors
			err => {
				console.error( err.message );
			}  
        );
    }

    /*************************************
     ************** PROJECTS 
    **************************************/

    async loadProjects(){
        try {
            // Charge la liste des projets
            const response = await fetch('../../assets/projects/index.json');
            const data = await response.json();
            
            // Charge les infos de chaque projet
            for(const project of data.projects){
                const folder = `${project.id}`.slice(0, 2)
                
                projectsData.push({
                    ...project,
                    logoPath: '../../assets/projects/'+ folder +"/"+ project.name + '/icon.png',
                    videoPath: '../../assets/projects/'+ folder +"/"+ project.name + '/preview.mp4'
                });

                if(project.tags){
                    project.tags.forEach(tag => allTags.add(tag));
                }
            }
            
            console.log('✅ Projets chargés:', projectsData);
            this.displayProjects();
            
        } catch(error){
            console.error('❌ Erreur chargement:', error);
        }
    }

    displayProjects(){
        // Crée les cubes/objets 3D pour chaque projet
        projectsData.forEach((project, index) => {
            this.loadProjectGLTF(project, index);
        });

        
        // Tri du plus petit Z au plus grand Z
        setTimeout(() => {
            //Sort the map
            const sortedMap = new Map(
                [...AppContext.projectMap.entries()].sort((a, b) => a[0] - b[0])
            );
            AppContext.projectMap = sortedMap;
            isProjectInstancied = true;
            //this.applyFilters(false); //TODO

            // Génère les boutons de tags
            this.generateTagButtons();
        }, 200);
        
        
    }
    
    loadProjectGLTF(project, index){

		// Load a glTF resource
		loader.load(
			// resource URL
			'instanceProject.glb',
			// called when the resource is loaded
			gltf => {
                this.sceneObj = gltf.scene;
                this.sceneObj.rotation.set(0, 0, 0);
                this.sceneObj.position.set(
                    0,
                    INITIAL_OFFSET_Y_PROJECTS + index * INTERVALLE_Y_PROJECTS,
                    offsetZProjects - index * INTERVALLE_Z_PROJECTS
                );
                this.sceneObj.scale.set(0.6,0.6,0.6);
				this.scene.add( gltf.scene );

                this.loadingBar.visible = false;
                //this.renderer.setAnimationLoop(this.render.bind(this)); //TODO

                //Get objs
                let frameObj = this.sceneObj.children[0].children[0];
                let placeholderObj = this.sceneObj.children[0].children[1];

                //To check multiple material 
                const materialToChange = placeholderObj.material;

                //Get logo texture
                const srcLlogo = project.logoPath;
                const textureLoader = new THREE.TextureLoader();

                textureLoader.loadAsync(srcLlogo)
                .then(texture => { // Use the texture
                    materialToChange.map = texture;
                })
                .catch(error => { // Path is invalid or image is inaccessible
                    console.error('Failed to load texture of ' + project.name + ' : ', error);
                });
                

                //Make material transparent
                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        //Need to have to fade in/out
                        child.material.transparent = true;

                        //Store infos in 3D obj
                        child.userData.project = project
                    }
                });

                //Add to array
                AppContext.projectsMeshes.push(gltf.scene);
                AppContext.projectsMeshes_Childrens.push(placeholderObj);
                AppContext.projectsMeshes_Childrens.push(frameObj);
                AppContext.projectMap.set(index, gltf.scene);
			},
			// called while loading is progressing
			xhr => {
				this.loadingBar.progress = (xhr.loaded / xhr.total);
			},
			// called when loading has errors
			err => {
				console.error( err.message );
			}  
        );
    }

    showProjectModal(project){
        isModalProjectVisible = true;
        this.currentProjectID = project.id;

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

        this.bgMusic.volume = 0.0;
        
        // Fermeture
        modal.querySelector('.close').onclick = () => {
            document.body.removeChild(modal);
            isModalProjectVisible = false;
            this.currentProjectID = -1;

            //Sound
            this.bgMusic.volume = BACKGROUND_VOLUME;


            //URL
            this.updateURL();
        };

        //URL
        this.updateURL();
    }

    findClosestProject(){
        if(AppContext.projectsVisible.size === 0) return "";
        
        let closestProjectName = "";
        let minDistance = Infinity;
        
        AppContext.projectsVisible.forEach((projectParent, key) => {
            const projectInfos = projectParent.children[0].children[0].userData.project;
            
            // Calcule la distance par rapport à INITIAL_OFFSET_Z_PROJECTS
            const distance = Math.abs(projectParent.position.z - offsetZProjects);

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
    }


}