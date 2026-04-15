export const AppContext = {
    //Core elements
    renderer:   null,
    outlinePass:null,
    scene:      null,
    camera:     null,
    raycaster:  null,
    mouse:      null,
    filterUI:   null,
    
    //General
    isLoaded:   false,
    isMobile:   false,

    //Containers
    sceneContainer  : null,
    projectContainer: null,

    //State
    currentState: 0,

    //Scroll
    scrollSceneAmount  : 0,
    scrollProjectAmount: 0,

    //Meshs
    scenesMeshes   : [],
    projectsMeshes : [],
    projectsVisible: new Map(),
    projectMap     : new Map(),
    frameAR        : null,
    frameVR        : null,
    frameMR        : null,
    frameGame      : null,
    frameCV        : null,
    frameLinkedin  : null,


    //CONST 
    CAMERA_POS_Z : 3.0,
    INTERACTIVES_NAMES: [
        'Click_AR_1', 'Click_AR_2',
        'Click_VR_1', 'Click_VR_2',
        'Click_MR', 'Click_MR_1',
        'Click_Game_1', 'Click_Game_2',
        'Cube016', 'Cube016_1',
        'Click_Linkedin', 'Click_Linkedin001'
    ],
};