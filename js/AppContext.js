export const AppContext = {
    //Core elements
    render:     null,
    renderer:   null,
    outlinePass:null,
    scene:      null,
    camera:     null,
    audio:      null,
    raycaster:  null,
    mouse:      null,
    filterUI:   null,
    loadingBar: null,
    urlManager: null,
    
    //General
    areProjectsLoaded: false,
    isMobile         : false,

    //Containers
    projectContainer: null,

    //Scroll
    scrollProjectAmount: 0,
    offsetZProjects    : 0,
    targetScenesZ      : 0,

    //Meshs
    projectsData : [],
    projectsMeshes : [],
    projectsVisible: new Map(),
    projectMap     : new Map(),

    //Filters
    isModalProjectVisible : false,
    activeFilters: {
            searchText: '',
            tags: new Set()
        },
    currentProjectID: -1,
    currentProjectName: "",


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
    TAG_CSS_SCENES: 'menu-scenes',
    TAG_CSS_PROJECTS: 'menu-projects',

    BACKGROUND_VOLUME: 0.05, // Volume (0 à 1)

    INTERVALLE_Y_PROJECTS: 0.3,
    INTERVALLE_Z_PROJECTS: 1,
    INITIAL_OFFSET_Y_PROJECTS: 1.5,
    
};