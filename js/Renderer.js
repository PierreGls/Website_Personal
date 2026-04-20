import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/shaders/GammaCorrectionShader.js';
import { SMAAPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/SMAAPass.js';
import { RGBELoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/RGBELoader.js';

import { AppContext } from './AppContext.js';

export class Renderer{
	constructor(scene, camera){
        this.scene = scene;
        this.camera = camera;

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
        
        const container = document.createElement( 'div' );
        document.body.appendChild( container );
        container.appendChild( this.renderer.domElement );

        this.setupLight();
		this.setupEnvironment();
		
        window.addEventListener('resize', this.resize.bind(this) );

        //Outline
        this.setupOutline();
    }

    /*************************************
     ************** SINGLETON  
    **************************************/
    
    get instance() { return this.renderer; }

    get outline() { return this.outlinePass; }

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
        AppContext.outlinePass = this.outlinePass;

        //Gamma Correction
        const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
        this.composer.addPass(gammaCorrectionPass);

        //Anti aliasing
        const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
        this.composer.addPass(smaaPass);

        
        
        console.log('✅ Outline setup complete');
    }

    /*************************************
     ************** LOADER 
    **************************************/
    startLoop(renderFn) {
        this.renderer.setAnimationLoop(renderFn);
    }

    stopLoop() {
        this.renderer.setAnimationLoop(null);
    }


    /*************************************
     ************** RESIZE 
    **************************************/
    // Set resize event
    resize(){
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);  
    }

    /*************************************
     ************** UPDATE 
    **************************************/
    
    //Update
	update() {   
        //this.renderer.render( this.scene, this.camera );
        this.renderer.shadowMap.needsUpdate = true;
        this.composer.render();
    }
}