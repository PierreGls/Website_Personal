# Portfolio 3D - Pierre Galus

Portfolio interactif en 3D créé avec Three.js présentant mes projets de manière immersive.

## ✨ Fonctionnalités

- 🎨 Galerie 3D interactive de projets
- 🔍 Système de filtrage par nom et tags
- 📱 Interface responsive
- ⚡ Effets visuels (outline, bokeh particles, flash transitions)
- 🎬 Modales vidéo pour chaque projet
- 🔗 URLs partageables avec filtres
- 🌐 Navigation fluide avec animations

## 🚀 Technologies

- **Three.js** - Rendu 3D
- **GLSL** - Shaders personnalisés
- **HTML/CSS/JavaScript** - Interface utilisateur
- **GLTF/GLB** - Modèles 3D (Blender)

## 🎮 Utilisation

- **Scroll** - Naviguer entre les projets
- **Clic** - Ouvrir les détails d'un projet
- **Filtres** - Rechercher par nom ou tags
- **Hover** - Effet d'outline sur les projets

## 📁 Structure du projet
```
portfolio-3d/
├── assets/
│   └── scene1.glb          # Modèles 3D
├── projects/
│   ├── index.json          # Liste des projets
│   └── project-01/
│       ├── logo.png
│       ├── video.mp4
│       └── info.json
├── libs/
│   └── three/              # Librairies Three.js
├── css/
│   └── style.css
├── js/
│   └── app.js
└── index.html
```

## 🎨 Ajouter un nouveau projet

1. Crée un dossier dans `projects/` :
```
projects/nouveau-projet/
├── logo.png
├── video.mp4
└── info.json
```

2. Mets à jour `projects/index.json` :
```json
{
  "projects": [
    {
      "id": "nouveau-projet",
      "name": "Mon Nouveau Projet",
      "folder": "nouveau-projet"
    }
  ]
}
```

## 🛠️ Configuration

- Modifier `INITIAL_OFFSET_Z_PROJECT` pour la position des projets
- Ajuster les couleurs dans `style.css`
- Personnaliser les effets dans `setupOutline()`

## 📄 Licence

MIT License

## 👤 Auteur

**Pierre Galus**

- Portfolio: [ton-site.com](https://ton-site.com)
- LinkedIn: [Pierre Galus](https://www.linkedin.com/in/pierregalus/)
- GitHub: [@ton-username](https://github.com/PierreGls)
