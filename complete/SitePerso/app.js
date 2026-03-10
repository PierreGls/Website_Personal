import * as THREE from 'three';
import { GLTFLoader } from '../../libs/three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '../../libs/three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from '../../libs/three/examples/jsm/loaders/RGBELoader.js';
import { LoadingBar } from '../../libs/LoadingBar.js';
import { EffectComposer } from '../../libs/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../../libs/three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from '../../libs/three/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass } from '../../libs/three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from '../../libs/three/examples/jsm/shaders/GammaCorrectionShader.js';
import { SMAAPass } from '../../libs/three/examples/jsm/postprocessing/SMAAPass.js';

const COLOR_BG = 0xaaaaaa;

//CAMERA
const CAMERA_POS_Y = 1.5;
const CAMERA_POS_Z = 3.0;
const CAMERA_ROT_AMPLITUDE = 7.0;
const CAMERA_ROT_SPEED = 0.03;

//MVT SCENES
const SCENES_MIN_X = -1;
const SCENES_MAX_X = 18;
const SCROLL_SPEED = 0.0005;
const ANIMATION_SCENES_LERP_RATIO = 0.05;

//FADE SCENES
const FADE_START = 2.0;
const FADE_END = 4.0;
const FADE_Y_OFFSET = 2.0;

//UI
const TAG_CSS_SCENES = 'menu-scenes';
const TAG_CSS_PROJECTS = 'menu-projects';
const DELAY_APPEARANCE_BUTTONS = 1000;//milliseconds

//Particles
const PARTICLES_COUNT = 100;
const PARTICLES_SIZE_MIN = 0.1;
const PARTICLES_SIZE_MAX = 0.3;
const PARTICLES_SIZE_MATERIALS = 0.7;
const PARTICLES_ROTATION_SPEED = 0.001;
const PARTICLES_POSITION_AMPLITUDE = 0.01;
let additionalRotY = 0;

//MUSIC
const BACKGROUND_VOLUME = 0.05; // Volume (0 à 1)

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

let scenesMeshes = [];
let projectsMeshes = [];
let projectsMeshes_Childrens = [];
let projectMap = new Map();
let projectsVisible = new Map();
let projectsData = [];

let currentState = 0; 
//0 = scenes
//1 = projects
let isModalProjectVisible = false;
let isProjectInstancied = false;

//Filters
const allTags = new Set();

//Used for outline
//Chaque pair, l'outline s'applique sur le premier
const INTERACTIVES_NAMES = [
    'Click_AR_1', 'Click_AR_2',
    'Click_VR_1', 'Click_VR_2',
    'Click_MR_1', 'Click_MR_2',
    'Click_Game_1', 'Click_Game_2',
    'Cube016', 'Cube016_1',
    'Click_Linkedin', 'Click_Linkedin001'
];

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

class App{
	constructor(){
        currentState = 0; //TODO : set to 0
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();

		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, CAMERA_POS_Y, CAMERA_POS_Z );
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( COLOR_BG );
        
        this.setupLight();
			
		this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true
        } );
		this.renderer.setPixelRatio( window.devicePixelRatio, 2 );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;

        this.renderer.shadowMap.enabled = true; // 👈 Active les ombres
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Ombres douces
        
        container.appendChild( this.renderer.domElement );
		this.setupEnvironment();
		
        this.loadingBar = new LoadingBar();
        
        window.addEventListener('resize', this.resize.bind(this) );

        //Create container for scenes and projects
        this.sceneContainer = null;
        this.projectContainer = null;
        this.createContainers();

        //Load multiple GLTF scenes
        this.frameAR = null;
        this.frameVR = null;
        this.frameMR = null;
        this.frameGame = null;
        this.frameCV = null;
        this.frameLinkedin = null;
        this.loadGLTFs();

        //Camera mvts
        this.targetScenesX = 0;
        this.targetScenesZ = 0;
        this.scrollSceneAmount = 0;
        this.targetCameraRotation = new THREE.Vector2();
        window.addEventListener('wheel', this.handleScroll.bind(this));
        //const controls = new OrbitControls( this.camera, this.renderer.domElement );
	
        //Click detection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        window.addEventListener('click', this.handleClickDetection.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
        //UI
        this.setupUI();

        //Outline
        this.setupOutline();

        //Filters
        this.activeFilters = {
            searchText: '',
            tags: new Set()
        };
        this.setupFilters();

        this.currentProjectName = '';
        this.currentProjectID = -1;

        //Particles
        this.createBokehParticles();

        //Sound
        this.setupBackgroundMusic();

        // Charge les paramètres depuis l'URL
        //It would be bettter to use async to call it once everything is loaded
        setTimeout(() => {
            this.loadFromURL();
        }, 700);
    }

    /*************************************
     ************** INIT  
    **************************************/

    setupLight(){
        const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.5);
		this.scene.add(ambient);
        
        const light = new THREE.DirectionalLight( 0xFFFFFF, 1.1 );
        //Set Pos
        light.position.set( 8.9, 1, -1);
        //Set Rot
        const euler = new THREE.Euler(
            THREE.MathUtils.degToRad(45),  // X
            THREE.MathUtils.degToRad(30),  // Y
            THREE.MathUtils.degToRad(0)    // Z
        );
        light.position.setFromSphericalCoords(10, euler.x, euler.y);

        //Active shadows
        light.castShadow = true; // 👈 La lumière projette des ombres
        // Qualité des ombres
        light.shadow.mapSize.width = 1024;  // Plus élevé = plus net
        light.shadow.mapSize.height = 1024;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 100;
        light.shadow.camera.left = -20;
        light.shadow.camera.right = 20;
        light.shadow.camera.top = 20;
        light.shadow.camera.bottom = -20;

        this.scene.add(light);

        //To see the light position
        //const helper = new THREE.CameraHelper(light.shadow.camera);
        //this.scene.add(helper);
    }

    // Set HDR environment
    setupEnvironment(){
        const loader = new RGBELoader();
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        pmremGenerator.compileEquirectangularShader();
        
        const self = this;
        
        loader.load( '../../assets/hdr/venice_sunset_1k.hdr', ( texture ) => {
          const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
          pmremGenerator.dispose();

          self.scene.environment = envMap;

        }, undefined, (err)=>{
            console.error( 'An error occurred setting the environment');
        } );
    }

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
            if(currentState === 0){{
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

    setupOutline(){
        // Composer pour les effets post-processing
        this.composer = new EffectComposer(this.renderer);
        
        // Pass de rendu normal
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Pass pour l'outline
        this.outlinePass = new OutlinePass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.scene,
            this.camera
        );
        
        // Configure l'apparence de l'outline
        this.outlinePass.edgeStrength = 3;      // Épaisseur
        this.outlinePass.edgeGlow = 0.5;        // Glow
        this.outlinePass.edgeThickness = 1;     // Finesse
        this.outlinePass.pulsePeriod = 0;       // Pas de pulsation
        this.outlinePass.visibleEdgeColor.set('#ffffff'); // Couleur blanche
        this.outlinePass.hiddenEdgeColor.set('#ffffff');  // Couleur cachée
        
        this.outlinePass.overlayMaterial.depthTest = false;
        this.outlinePass.renderToScreen = true;

        this.composer.addPass(this.outlinePass);

        //Gamma Correction
        const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
        this.composer.addPass(gammaCorrectionPass);

        //Anti aliasing
        const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
        this.composer.addPass(smaaPass);

        
        
        console.log('✅ Outline setup complete');
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

    setupBackgroundMusic(){
        this.bgMusic = document.getElementById('background-music');
        this.bgMusic.volume = BACKGROUND_VOLUME;
        
        this.bgMusic.play()
            .then(() => {
                console.log('🎵 Musique lancée');
            })
            .catch(err => {
                console.warn('⚠️ Autoplay bloqué:', err);
            });
            
        
        console.log('✅ Background music setup');
    }

    /*************************************
     ************** SOUNDS
    **************************************/
    playSFXFlash(){
        this.sfx = document.getElementById('flashSFX');
        this.sfx.volume = BACKGROUND_VOLUME;
        this.sfx.currentTime = 0;
        this.sfx.play();
    }

    /*************************************
     ************** Particles
    **************************************/
    createBokehParticles(){
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        
        for(let i = 0; i < PARTICLES_COUNT; i++){
            positions.push(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 100 + CAMERA_POS_Z
            );
            
            // 👇 Couleurs aléatoires douces
            colors.push(
                0.5 + Math.random() * 0.5,  // R
                0.5 + Math.random() * 0.5,  // G
                0.8 + Math.random() * 0.2   // B (bleuté)
            );
            
            sizes.push(Math.random() * (PARTICLES_SIZE_MAX - PARTICLES_SIZE_MIN) + PARTICLES_SIZE_MIN);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: PARTICLES_SIZE_MATERIALS,
            vertexColors: true, // 👈 Utilise les couleurs par vertex
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
            map: this.createBokehTexture()
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.particles.position.z = -10;
        this.scene.add(this.particles);
    }

    createBokehTexture(){
        // Crée une texture de cercle flou
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
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
        if(currentState === 1) { 
            console.log("Can't click on these buttons if we are on the projects");
            return;
        }
        console.log('Action bouton ' + id);
        this.scrollSceneAmount = (id - 1)/3;
        this.setScenesTargetX();
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
        projectsVisible.clear();
        let currentKeyVisible = 0;

        scrollProjectAmount = 0;
        
        projectMap.forEach((projectParent, key) => {
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
                projectsVisible.set(currentKeyVisible, projectParent);
                currentKeyVisible++;
            }
        });

        //URL
        if(mustReloadURL){
            this.updateURL();
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
        if(currentState === 0) { 
            console.log("Can't click on these buttons if we are on the projects");
            return;
        }

        console.log('🔘 Bouton cliqué BACK TO HOME, ID:', id);
        this.onChangeState(0, false);
    }

    getButtonFilterByTag(tagValue){
        const button = document.querySelector(`[data-tag="${tagValue}"]`);
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
     ************** SCROLL 
    **************************************/
    handleScroll (e){
        if(currentState === 0){
            this.scrollSceneAmount += e.deltaY * SCROLL_SPEED;
            this.scrollSceneAmount = Math.max(0, Math.min(1, this.scrollSceneAmount));
            this.setScenesTargetX();
        }
        else if(currentState === 1){
            scrollProjectAmount += e.deltaY * SCROLL_SPEED;
            scrollProjectAmount = Math.max(scrollProjectAmount, 0); //min value = 0
            scrollProjectAmount = Math.min(scrollProjectAmount, SCROLL_PROJECT_MAX_MULTIPLIER * (projectsVisible.size - 1)); //max value = scrollMultiplier * nbr de projets
        }
    }

    setScenesTargetX(){
        this.targetScenesX = this.scrollSceneAmount * (SCENES_MAX_X - SCENES_MIN_X) + SCENES_MIN_X;  // minX to maxX
    }

    /*************************************
     ************** SCENES 
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
        
        console.log('✅ Containers created');
    }
    
    // Load multiple GLTF scenes
    async loadGLTFs(){
        // Scenes
       this.loadGLTFScene('scene1', 0);
       this.loadGLTFScene('scene2', 1);
       this.loadGLTFScene('scene3', 2);
       this.loadGLTFScene('scene4', 3);
       
        //Projects
        await this.loadProjects();
    }

    loadGLTFScene(name, index){
        const loader = new GLTFLoader( ).setPath('../../assets/');
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath( '../../libs/three/examples/jsm/libs/draco/' );
        loader.setDRACOLoader( dracoLoader );

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
                this.renderer.setAnimationLoop(this.render.bind(this));

                //Make material transparent
                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        //Need to have to fade in/out
                        child.material.transparent = true;

                        //To have the good ouline
                        switch(child.name){
                            case INTERACTIVES_NAMES[0]:
                                this.frameAR = child;
                                break;
                            case INTERACTIVES_NAMES[2]:
                                this.frameVR = child;
                                break;
                            case INTERACTIVES_NAMES[4]:
                                this.frameMR = child;
                                break;
                            case INTERACTIVES_NAMES[6]:
                                this.frameGame = child;
                                break;
                            case INTERACTIVES_NAMES[8]:
                                this.frameCV = child;
                                break;
                            case INTERACTIVES_NAMES[10]:
                                this.frameLinkedin = child;
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
                scenesMeshes.push(gltf.scene);
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
                [...projectMap.entries()].sort((a, b) => a[0] - b[0])
            );
            projectMap = sortedMap;
            isProjectInstancied = true;
            this.applyFilters(false);

            // Génère les boutons de tags
            this.generateTagButtons();
        }, 200);
        
        
    }
    
    loadProjectGLTF(project, index){
        const loader = new GLTFLoader( ).setPath('../../assets/');
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath( '../../libs/three/examples/jsm/libs/draco/' );
        loader.setDRACOLoader( dracoLoader );


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
                this.renderer.setAnimationLoop(this.render.bind(this));

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
                projectsMeshes.push(gltf.scene);
                projectsMeshes_Childrens.push(placeholderObj);
                projectsMeshes_Childrens.push(frameObj);
                projectMap.set(index, gltf.scene);
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
        if(projectsVisible.size === 0) return "";
        
        let closestProjectName = "";
        let minDistance = Infinity;
        
        projectsVisible.forEach((projectParent, key) => {
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
     ************** CLICK 
    **************************************/
    //click detection
    handleClickDetection(event){
        // Lance le rayon
        this.raycaster.setFromCamera(this.mouse, this.camera);

        if(currentState === 0){ //CLICK ON ROOMS
            this.handleClickDetectionsScenes(event);
        }
        else if(currentState === 1){ //CLICK ON PROJECT
            this.handleClickDetectionsProjects(event);
        } 
    }

    handleClickDetectionsScenes(event){
        const intersects = this.raycaster.intersectObjects(scenesMeshes);
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
                    this.resetFilters();
                    this.toggleTagFilter('AR', this.getButtonFilterByTag("AR"));
                    this.onChangeState(1, false);
                    console.log('Click_AR');
                    break;
                case "Click_VR_1":
                case "Click_VR_2":
                    this.resetFilters();
                    this.toggleTagFilter('VR', this.getButtonFilterByTag("VR"));
                    this.onChangeState(1, false);
                    console.log('Click_VR');
                    break;
                case "Click_MR_1":
                case "Click_MR_2":
                    this.resetFilters();
                    this.onChangeState(1, false);
                    console.log('Click_MR');
                    break;
                case "Click_Game_1":
                case "Click_Game_2":
                    this.resetFilters();
                    this.toggleTagFilter('Games', this.getButtonFilterByTag("Games"));
                    this.onChangeState(1, false);
                    console.log('Click_Game');
                    break;
                case INTERACTIVES_NAMES[10]: //Linkedin
                case INTERACTIVES_NAMES[11]:
                    console.log('Linkedin');
                    window.open('https://www.linkedin.com/in/pierregalus/', '_blank');
                    break;
            }
        } 
    }

    handleClickDetectionsProjects(event){
        if(isModalProjectVisible){ return; }
        const intersectsProjects = this.raycaster.intersectObjects(projectsMeshes);
        if(intersectsProjects.length > 0){
            const clickedObj = intersectsProjects[0].object;
            console.log('🎯 Project clicked2:', clickedObj.userData.project);

            this.showProjectModal(clickedObj.userData.project);
        } 
    }

    //Camera mvt to follow mouse
    handleMouseMove(event){
        //store mouse position
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        //Do raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        //Manage cammera rotation
        const maxRotation = CAMERA_ROT_AMPLITUDE * Math.PI / 180; //radians
        this.targetCameraRotation.x = this.mouse.y * maxRotation; // Haut/Bas
        this.targetCameraRotation.y = - this.mouse.x * maxRotation; // Gauche/Droite
    }

    onChangeState(newState, fromLoadURL){
        console.log('Change state : ' + newState);
        currentState = newState;

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
     ************** RESIZE 
    **************************************/
    // Set resize event
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.composer.setSize(window.innerWidth, window.innerHeight);  
    }

    /*************************************
     ************** UPDATE 
    **************************************/
    
    //Update
	render( ) {   
        const dt = this.clock.getDelta();

        //Cam rot
        if(this.targetCameraRotation){
            this.camera.rotation.x += (this.targetCameraRotation.x - this.camera.rotation.x) * CAMERA_ROT_SPEED;
            this.camera.rotation.y += (this.targetCameraRotation.y - this.camera.rotation.y) * CAMERA_ROT_SPEED;
        }

        //Fade scenes
        this.manageRenderScenes();

        //Hover scenes
        this.manageHover();

        //Mvt
        this.updateMovements();

        //Project name in state 1
        this.updateCurrentProjectName();

        //Particle systeme
        this.updateMvtParticles();

        //this.renderer.render( this.scene, this.camera );
        this.renderer.shadowMap.needsUpdate = true;
        this.composer.render();
    }

    //Manage fadeing of scenes based on camera position
    manageRenderScenes(){
        for(let i=0; i<scenesMeshes.length; i++){
            const mesh = scenesMeshes[i];
            const distanceToCamera = mesh.position.x - this.camera.position.x;
            //const distanceToCamera = Math.abs(mesh.position.x - this.camera.position.x); //si on veut faire le fade des 2 côtés
            
            let opacity = 0;
            if(distanceToCamera < FADE_START){
                opacity = 1.0;
            }
            else if(distanceToCamera >= FADE_START && distanceToCamera < FADE_END){
                opacity = 1.0 - (distanceToCamera - FADE_START) / (FADE_END - FADE_START);
            }
            else if(distanceToCamera >= FADE_END){
                opacity = 0.0;
            }

            //TO REMOVE
            opacity = 1;

            mesh.traverse(child => {
                if (child.isMesh) {
                    child.material.opacity = opacity;
                }
            });

            //position
            mesh.position.y = (opacity - 1) * FADE_Y_OFFSET; // Move up when fading in

        }
    }

    manageHover(){
        if(currentState === 0){ //CLICK ON ROOMS
            this.manageHoverScenes();
        }
        else if(currentState === 1){ //CLICK ON PROJECT
            this.manageHoverProjects();
        }
    }

    manageHoverScenes(){
        const intersects = this.raycaster.intersectObjects(scenesMeshes);
        
        let foundInteractive = false;
        this.outlinePass.selectedObjects = [];
        if(intersects.length > 0){
            const hoveredObject = intersects[0].object;
            if(INTERACTIVES_NAMES.some(name => hoveredObject.name.includes(name))){
                document.body.style.cursor = 'pointer';
                foundInteractive = true;

                switch(hoveredObject.name){
                    case INTERACTIVES_NAMES[1]:
                        this.outlinePass.selectedObjects = [this.frameAR];
                        break;
                    case INTERACTIVES_NAMES[3]:
                        this.outlinePass.selectedObjects = [this.frameVR];
                        break;
                    case INTERACTIVES_NAMES[5]:
                        this.outlinePass.selectedObjects = [this.frameMR];
                        break;
                    case INTERACTIVES_NAMES[7]:
                        this.outlinePass.selectedObjects = [this.frameGame];
                        break;
                    case INTERACTIVES_NAMES[9]:
                        this.outlinePass.selectedObjects = [this.frameCV];
                        break;
                    case INTERACTIVES_NAMES[11]:
                        this.outlinePass.selectedObjects = [this.frameLinkedin];
                        break;
                    default:
                        this.outlinePass.selectedObjects = [hoveredObject];
                        break;
                }
                
                //console.log('🖱️ Hover:', hoveredObject.name);
            }
        } 

        if(!foundInteractive){
            document.body.style.cursor = 'default';
        }
    }

    manageHoverProjects(){
        const intersects = this.raycaster.intersectObjects(projectsMeshes);
        
        let foundInteractive = false;
        this.outlinePass.selectedObjects = [];
        if(intersects.length > 0){
            const hoveredObject = intersects[0].object;
            document.body.style.cursor = 'pointer';
            foundInteractive = true;
            //this.outlinePass.selectedObjects = [hoveredObject]; //To add glow
        } 

        if(!foundInteractive){
            document.body.style.cursor = 'default';
        }
    }

    updateMovements(){
        //MOVE ROOMS
        this.updateSceneMovements();
        //MOVE PROJECTS
        this.updateProjectMovements();
    }

    updateSceneMovements(){
        //this.camera.position.x += (this.targetScenesX - this.camera.position.x) * SCENES_SPEED;
        if(this.sceneContainer){
            let currentPos = this.sceneContainer.position;
            let targetPos = new THREE.Vector3(-this.targetScenesX ,0, this.targetScenesZ);
            let lerpedPos = currentPos.lerp(targetPos, ANIMATION_SCENES_LERP_RATIO);
        }
    }

    updateProjectMovements(){
        if(!isProjectInstancied) {return;}
        
        projectsVisible.forEach((projectParent, key, map) => {
        //projectMeshesSorted.forEach((mesh, index) => {
            let defaultY = INITIAL_OFFSET_Y_PROJECTS + INTERVALLE_Y_PROJECTS * key;
            let defaultZ = offsetZProjects + INTERVALLE_Z_PROJECTS * (- key);
            
            let newPosY = defaultY - INTERVALLE_Y_PROJECTS * scrollProjectAmount * SCROLL_PROJECT_MULTIPLIER;
            let newPosZ = defaultZ + INTERVALLE_Z_PROJECTS * scrollProjectAmount * SCROLL_PROJECT_MULTIPLIER;
            
            let newPosX = 0;
            let newRotZ = 0;
            if(newPosZ > offsetZProjects){
                newPosX = (offsetZProjects - newPosZ) * ANIMATION_PROJECT_X_POS_MULTIPLIER;
                newRotZ = (offsetZProjects - newPosZ) * ANIMATION_PROJECT_Z_ROT_MULTIPLIER;
                if(key%2===0){
                    newPosX *= -1;
                    newRotZ *= -1;
                }
            }

            let currentPos = projectParent.position;
            let currentRot = new THREE.Vector3(
                projectParent.rotation.x,
                projectParent.rotation.y, 
                projectParent.rotation.z
            );

            let targetPos = new THREE.Vector3(newPosX ,newPosY, newPosZ);
            let targetRot = new THREE.Vector3(0 ,0, newRotZ);

            let lerpedPos = currentPos.lerp(targetPos, ANIMATION_PROJECT_LERP_RATIO);
            let lerpedRot = currentRot.lerp(targetRot, ANIMATION_PROJECT_LERP_RATIO);

            projectParent.position.set(
                lerpedPos.x,
                lerpedPos.y,
                lerpedPos.z
            );
            
            projectParent.rotation.set(
                lerpedRot.x,
                lerpedRot.y,
                lerpedRot.z
            );
        });
    }

    updateCurrentProjectName(){
        const projectNameElement = document.getElementById('project-name');
        let closestProjectName = "";
        if(currentState === 1){
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

    updateMvtParticles(){
        if(this.particles){
            additionalRotY += PARTICLES_ROTATION_SPEED;
            this.particles.rotation.y = scrollProjectAmount * 0.5 + additionalRotY;
            
            // Mouvement flottant
            const positions = this.particles.geometry.attributes.position.array;
            for(let i = 0; i < positions.length; i += 3){
                positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * PARTICLES_POSITION_AMPLITUDE;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
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

export { App };