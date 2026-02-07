Minecraft Scene Creator

Overview:
Minecraft Scene Creator is a browser-based tool that lets you upload Minecraft skins, pose the character in 3D, and export the final render.

Main Features:
1) Upload and switch between multiple skins.
2) Pose limbs and body parts with intuitive controls.
3) Save and load poses using local storage.
4) Customize the background (color, image, or transparency).
5) Export the current view as an image.

Programs and libraries used:
- React + Vite
- skinview3d for rendering Minecraft skins in 3D
- html2canvas for exporting the rendered scene

Project Structure:
index.html: Vite entry HTML.
src/App.jsx: UI layout rendered by React.
src/appLogic.js: Core logic for viewer setup, skin management, and event handling.
src/main.jsx: React entry point.
style.css: Styling for layout and components.
public/skins/: Sample skins for quick testing.
public/heads/: Head textures (optional assets).
public/armors/: Armor textures (optional assets).

Development
1) Install dependencies:
	npm install
2) Run the dev server:
	npm run dev
3) Build for production:
	npm run build
4) Preview the production build:
	npm run preview

License:

