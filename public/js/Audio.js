import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { AppContext } from './AppContext.js';

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
        this.bgMusic.volume = AppContext.BACKGROUND_VOLUME;
        
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
        this.sfx.volume = AppContext.BACKGROUND_VOLUME;
        this.sfx.currentTime = 0;
        this.sfx.play();

        this.sfx.play()
            .then(() => {
                ///console.log('🎵 SFX lancée');
            })
            .catch(err => {
                console.warn('⚠️ Autoplay bloqué flash:', err);
            });
    }

    setVolumeBGMusic(newVolume){
        this.bgMusic.volume = newVolume;
    }



    /*************************************
     ************** UPDATE 
    **************************************/
	update() {   
    }
}