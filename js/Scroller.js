import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { AppContext } from './AppContext.js';

//  DEBUG — mettre à true pour afficher les sphères colorées aux emplacements
//  sans lien avec les projets. Remettre à false en prod.
const DEBUG_SHOW_SLOTS = false;

//  Sphere parameters
const SPHERE_SLOTS_COUNT = 200; // max de projets visibles
const SPHERE_RADIUS    = 6.0;   // distance caméra → projets (unités world)
const THETA_STEP_DEG   = 15;    // espacement horizontal entre colonnes (degrés)
const PHI_STEP_DEG     = 15;    // espacement vertical entre rangs (degrés)
const MAX_LINE_COUNT     = 6;    // nb max de rangs (pour éviter les colonnes infinies)

//  Scroll & animation
const SCROLL_SPEED      = 0.0005;
const LERP_RATIO        = 0.07;
const SCROLL_CLAMP_VALUE = 11;

// Facteur de tassement horizontal au scroll : les rangs voisins restent proches du centre
const SCROLL_THETA_FACTOR = 0.3;

export class Scroller {
    constructor() {
        this._slots       = [];
        this._lastCount   = -1;
        this._debugMeshes = [];
        this._firstInit = false;
        
        this.buildSlots(SPHERE_SLOTS_COUNT);
        if (DEBUG_SHOW_SLOTS) this.refreshDebugMeshes();

        if (AppContext.isMobile) {
            this.setupTouchControls();
        } else {
            this.setupMouseControls();
        }
        console.log('✅ Scroller (sphere layout) — debug:', DEBUG_SHOW_SLOTS);
    }

    //#region Controls

    setupMouseControls() {
        window.addEventListener('wheel', this.handleScroll.bind(this));
        console.log('✅ Controls setup for PC');
    }

    setupTouchControls() {
        let startY = 0;
        window.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        }, { passive: true });
        window.addEventListener('touchmove', (e) => {
            const dy = startY - e.touches[0].clientY;
            this.handleScrollByValue(-dy);
            startY = e.touches[0].clientY;
        }, { passive: true });
        console.log('✅ Controls setup for Mobile');
    }

    handleScroll(e) {
        this.handleScrollByValue(e.deltaY);
    }

    handleScrollByValue(delta) {
        const n = AppContext.projectsVisible.size;
        if (n <= 4) { AppContext.scrollProjectAmount = 0; return; }

        AppContext.scrollProjectAmount += delta * SCROLL_SPEED;
        AppContext.scrollProjectAmount  = Math.max(-SCROLL_CLAMP_VALUE, AppContext.scrollProjectAmount);
        AppContext.scrollProjectAmount  = Math.min(AppContext.scrollProjectAmount, SCROLL_CLAMP_VALUE);
        console.log(`📜 Scroll: ${AppContext.scrollProjectAmount.toFixed(2)} / ${SCROLL_CLAMP_VALUE}`);
    }

    //#endregion

    //#region Loading & Slots management

    /**
     * Génère un tableau de { theta, phi } (radians) pour `count` emplacements.
     */
    buildSlots(count) {
        const slots     = [];
        const thetaStep = THREE.MathUtils.degToRad(THETA_STEP_DEG);
        const phiStep   = THREE.MathUtils.degToRad(PHI_STEP_DEG);

        let currentCircle = 0;
        let reachMaxLines = false;
        while (slots.length < count) 
        {
            const lineCount = Math.min(MAX_LINE_COUNT, (currentCircle+1) * 2);
            const coloumnCount = (currentCircle+1) * 2;

            const thetaStart = -(coloumnCount/2-0.5)*thetaStep;
            const phiStart = -(lineCount/2-0.5)*phiStep;

            for (let i = 0; i < lineCount && slots.length < count; i++)
            {
                for (let j = 0; j < coloumnCount && slots.length < count; j++) 
                {                        
                    if ((!reachMaxLines && (i == 0 || i == lineCount-1)) || j == 0 || j == coloumnCount-1)
                    {
                        const theta = thetaStart + j*thetaStep;
                        const phi = phiStart + i*phiStep;
                        slots.push({ theta, phi });
                    }
                }
            }

            if (lineCount >= MAX_LINE_COUNT) reachMaxLines = true; 
            currentCircle++;
        }
        this._slots = slots;
        console.log(`🔵 buildSlots: circle ${currentCircle}, total slots: ${slots.length}`);
    }

    /**
     * Convertit (theta, phi) sur la sphère en position world-space.
     */
    slotToWorld(theta, phi) 
    {
        const r = SPHERE_RADIUS;
        const halfHeight = SPHERE_RADIUS; // hauteur totale = 2 * r
        const x =  r * Math.sin(theta);
        const z = -r * Math.cos(theta);
        const y = phi * halfHeight;

        return new THREE.Vector3(x, y, z);
    }

    /**
     * Appelé quand le nb de projets visibles change (filtre appliqué).
     */
    buildAndTeleportSlots() 
    {        
        AppContext.projectsVisible.forEach((projectParent, key) => {
            if (key >= this._slots.length) return;
            const { theta, phi } = this._slots[key];
            projectParent.position.copy(this.slotToWorld(theta, phi));
            projectParent.rotation.set(0, -theta, 0);
        });
        console.log(`🔵 Sphere slots rebuilt for projects`);
    }

    //#endregion

    //#region Lifecycle

    update() {
        if (!AppContext.areProjectsLoaded) return;
        if (AppContext.projectsVisible.size === 0) return;
        if (!this._firstInit) this.buildAndTeleportSlots();
        this._firstInit = true;
        this.updatePositions();
    }

    updatePositions() {
        const activeIndex = AppContext.scrollProjectAmount; // 0 .. n-1 flottant
        const thetaStep     = THREE.MathUtils.degToRad(THETA_STEP_DEG);

        AppContext.projectsVisible.forEach((projectParent, key) => {
            if (key >= this._slots.length) return;

            const { theta, phi } = this._slots[key];

            const scrolledTheta   = theta + activeIndex * thetaStep * SCROLL_THETA_FACTOR;
            const targetPos = this.slotToWorld(scrolledTheta, phi);

            // Lerp position
            projectParent.position.lerp(targetPos, LERP_RATIO);

            // Lerp yaw (face caméra selon angle horizontal du slot)
            const dy = -scrolledTheta - projectParent.rotation.y; // angle à parcourir pour faire face à la caméra
            projectParent.rotation.y += dy * LERP_RATIO;

            // Annuler rotation X/Z parasites
            projectParent.rotation.x *= (1 - LERP_RATIO);
            projectParent.rotation.z *= (1 - LERP_RATIO);
        });
    }

    //#endregion

    //#region Debug

    /**
     * Crée des sphères colorées à chaque slot.
     * Vert = rangs frontaux, Rouge = rangs éloignés.
     * Appelé auto si DEBUG_SHOW_SLOTS = true.
     */
    refreshDebugMeshes() {
        // Nettoyer les anciennes
        this._debugMeshes.forEach(m => AppContext.scene.remove(m));
        this._debugMeshes = [];

        const geom = new THREE.SphereGeometry(0.15, 8, 8);
        console.log(`🔵 Sphere slots rebuilt for ${this._slots.length} projects`);
        this._slots.forEach(({ theta, phi }, i) => {
            const t   = i / Math.max(this._slots.length - 1, 1); // 0 → 1
            const col = new THREE.Color().setHSL(0.33 * (1 - t), 1.0, 0.5); // vert → rouge
            const mat = new THREE.MeshBasicMaterial({ color: col });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.copy(this.slotToWorld(theta, phi));
            mesh.name = `DEBUG_slot_${i}`;
            AppContext.scene.add(mesh);
            this._debugMeshes.push(mesh);
        });

        console.log(`🔵 Debug: ${this._slots.length} slot markers`);
    }

    /**
     * Bascule debug à chaud depuis la console du navigateur :
     *   window.app.scroller.toggleDebug()
     */
    toggleDebug() {
        if (this._debugMeshes.length > 0) {
            this._debugMeshes.forEach(m => AppContext.scene.remove(m));
            this._debugMeshes = [];
            console.log('🔵 Debug slots hidden');
        } else {
            this.refreshDebugMeshes();
        }
    }

    //#endregion
}