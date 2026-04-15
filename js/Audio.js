import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { AppContext } from './AppContext.js';

//MUSIC
const BACKGROUND_VOLUME = 0.05; // Volume (0 à 1)

export class Audio{
	constructor(){
        //Sound
        this.setupBackgroundMusic();
    }

    /*************************************
     ************** INIT  
    **************************************/

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
     ************** UPDATE 
    **************************************/
	update() {   
    }
}