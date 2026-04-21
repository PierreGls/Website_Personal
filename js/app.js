/*
import * as THREE from 'three';
import { GLTFLoader } from '../libs/three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '../libs/three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from '../libs/three/examples/jsm/loaders/RGBELoader.js';
import { LoadingBar } from '../libs/LoadingBar.js';
import { EffectComposer } from '../libs/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../libs/three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from '../libs/three/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass } from '../libs/three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from '../libs/three/examples/jsm/shaders/GammaCorrectionShader.js';
import { SMAAPass } from '../libs/three/examples/jsm/postprocessing/SMAAPass.js';
*/

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { AppContext } from './AppContext.js';
import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { SceneLoader } from './SceneLoader.js';
import { Header } from './Header.js';
import { Scroller } from './Scroller.js';
import { Particles } from './Particles.js';
import { Audio } from './Audio.js';
import { CurrentProjectName } from './CurrentProjectName.js';
import { ClickController } from './ClickController.js';
import { LoadFromURL } from './LoadFromURL.js';


const COLOR_BG = 0xaaaaaa;

class App{
	constructor(){
        AppContext.isMobile     = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        AppContext.areScenesLoaded     = false;
        AppContext.currentState = 0;
        AppContext.raycaster    = new THREE.Raycaster();
        AppContext.mouse        = new THREE.Vector2();

        this.clock              = new THREE.Clock();
        this.scene              = new THREE.Scene();
        this.scene.background   = new THREE.Color(COLOR_BG);
        AppContext.scene        = this.scene;
        this.camera             = new Camera();
        AppContext.camera       = this.camera;
        this.renderer           = new Renderer();
        AppContext.render       = this.render.bind(this);;
        AppContext.renderer     = this.renderer;
        this.outlinePass        = this.renderer.outline;
        this.loadFromURL        = new LoadFromURL(); 
        AppContext.urlManager   = this.loadFromURL;
        this.header             = new Header();
        AppContext.filterUI     = this.header;
        this.scenesLoader       = new SceneLoader();
        this.scroller           = new Scroller();
        this.particles          = new Particles();
        this.audio              = new Audio();
        AppContext.audio        = this.audio;
        this.clickController    = new ClickController();
        this.currentProjectName = new CurrentProjectName();

        //At the end : should be at the end of the meshes loading
        //AppContext.filterUI.onChangeState(0,false);
        setTimeout(() => {
            AppContext.urlManager.loadFromURL();
        }, 800);
        
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
        this.header.update();
        this.particles.update();
    }

    /*************************************
     ************** HELPER 
    **************************************/

    debugSceneHierarchy(){
        console.log('🌳 Hiérarchie:');
        console.log('Scene principale');
        console.log('└── SceneContainer', AppContext.sceneContainer.position);
        AppContext.sceneContainer.children.forEach((child, i) => {
            console.log('    └── Scène', i, child.position);
        });
    }
}

export { App };