import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { AppContext } from './AppContext.js';

export class ClickController
{
	constructor()
    {
        window.addEventListener('click', this.handleClickDetection.bind(this));
    }

    //#region Click Detection

    handleClickDetection(event)
    {
        AppContext.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        AppContext.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        AppContext.camera.yawPivot.updateMatrixWorld(true);
        AppContext.raycaster.setFromCamera(AppContext.mouse, AppContext.camera.camera);

        this.handleClickDetectionsProjects(event);
    }

    handleClickDetectionsProjects(event)
    {
        if(AppContext.isModalProjectVisible){ return; }

        if(event.target.closest('#filter-bar, #menu-scenes, #menu-projects, #current-project, #project-modal, #top-right-buttons, #contact-modal'))
            { return; }

        const intersectsProjects = AppContext.raycaster.intersectObjects(AppContext.projectsMeshes);
        if(intersectsProjects.length > 0){
            const clickedObj    = intersectsProjects[0].object;
            const projectParent = clickedObj.parent.parent;

            const worldPos = new THREE.Vector3();
            projectParent.getWorldPosition(worldPos);
            AppContext.camera.centerOnPoint(worldPos);

            AppContext.filterUI.showProjectModal(clickedObj.userData.project);
        }
    }

    //#endregion
}