import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { AppContext } from './AppContext.js';

const BASE_SCALE      = 0.6;
const HIGHLIGHT_SCALE = 0.75;
const LERP_SPEED      = 0.08;
const SNAP_THRESHOLD  = 0.001;

export class CurrentProjectName{
	constructor(){
        this._highlighted     = null;
        this._scalingProjects = new Map(); // projectParent → targetScale
    }

    //#region Find Closest Project

    findClosestProject(){
        if(AppContext.projectsVisible.size === 0) return { name: "", parent: null };

        let closestProjectName = "";
        let closestParent      = null;
        let minDistance        = Infinity;
        const position = new THREE.Vector3();
        AppContext.raycasterCenter.ray.at(5, position);

        AppContext.projectsVisible.forEach((projectParent) => {
            const distance = projectParent.position.distanceTo(position);
            if(distance < minDistance){
                minDistance = distance;
                const projectInfos = projectParent.children[0].children[0].userData.project;
                closestProjectName = projectInfos.name;
                closestParent      = projectParent;
            }
        });

        return { name: closestProjectName, parent: closestParent };
    }

    //#endregion

    //#region Highlight

    setHighlight(newParent){
        if(this._highlighted === newParent) return;

        // De-highlight previous
        if(this._highlighted){
            this._scalingProjects.set(this._highlighted, BASE_SCALE);
        }

        this._highlighted = newParent;

        // Highlight new
        if(newParent){
            this._scalingProjects.set(newParent, HIGHLIGHT_SCALE);

            const meshes = [];
            newParent.traverse(child => { if(child.isMesh) meshes.push(child); });
            AppContext.outlinePass.selectedObjects = meshes;
        } else {
            AppContext.outlinePass.selectedObjects = [];
        }
    }

    //#endregion

    //#region Lifecycle

	update()
    {
        const projectNameElement = document.getElementById('project-name');
        const container          = document.getElementById('current-project');
        const { name: closestName, parent: closestParent } = this.findClosestProject();

        if(closestName !== ""){
            if(AppContext.currentProjectName !== closestName){
                AppContext.currentProjectName = closestName;
                projectNameElement.textContent = closestName;
                container.classList.add('visible');
                this.setHighlight(closestParent);
            }
        } else {
            if(AppContext.currentProjectName !== ''){
                AppContext.currentProjectName = '';
                container.classList.remove('visible');
                this.setHighlight(null);
            }
        }

        // Animate all tracked project scales
        this._scalingProjects.forEach((targetScale, projectParent) => {
            const s = projectParent.scale;
            s.x += (targetScale - s.x) * LERP_SPEED;
            s.y += (targetScale - s.y) * LERP_SPEED;
            s.z += (targetScale - s.z) * LERP_SPEED;

            if(Math.abs(s.x - targetScale) < SNAP_THRESHOLD){
                s.setScalar(targetScale);
                this._scalingProjects.delete(projectParent);
            }
        });
    }

    //#endregion
}
