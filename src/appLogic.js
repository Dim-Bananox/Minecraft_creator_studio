import html2canvas from "html2canvas";
import { SkinViewer } from "skinview3d";

export function initApp() {
  if (window.__mcsceneInitialized) return () => {};
  window.__mcsceneInitialized = true;

  // --- CONSTANTS ---
  const STEVE_SKIN = "/skins/steve.png";
  const ALEX_SKIN = "/skins/alex.png";

  // --- DOM ELEMENTS ---
  const renderArea = document.getElementById("renderArea");
  const skinUpload = document.getElementById("skinUpload");
  const uploadedSkinsContainer = document.getElementById("uploadedSkins");
  const loadSteveBtn = document.getElementById("loadSteve");
  const loadAlexBtn = document.getElementById("loadAlex");
  const playerUsername = document.getElementById("playerUsername");
  const fetchSkinBtn = document.getElementById("fetchSkinBtn");

  const savePoseBtn = document.getElementById("savePose");
  const loadPoseBtn = document.getElementById("loadPose");
  const poseNameInput = document.getElementById("poseNameInput");
  const poseGalleryModal = document.getElementById("poseGalleryModal");
  const poseGalleryContent = document.getElementById("poseGalleryContent");

  const exportBtn = document.getElementById("exportBtn");

  const bgUpload = document.getElementById("bgUpload");
  const uploadBgBtn = document.getElementById("uploadBgBtn");
  const bgColorPicker = document.getElementById("bgColorPicker");
  const bgTransparent = document.getElementById("bgTransparent");
  const removeBgBtn = document.getElementById("removeBgBtn");

  const resetPositionBtn = document.getElementById("resetPositionBtn");

  const penBtn = document.getElementById("penBtn");
  const eraserBtn = document.getElementById("eraserBtn");
  const shapeBtn = document.getElementById("shapeBtn");
  const colorPicker = document.getElementById("colorPicker");
  const brushSize = document.getElementById("brushSize");
  const clearCanvasBtn = document.getElementById("clearCanvasBtn");

  const drawCanvas = document.getElementById("drawCanvas");

  if (!renderArea || !drawCanvas) {
    window.__mcsceneInitialized = false;
    return () => {};
  }

  // --- STATE ---
  let characters = [];
  let selectedCharacterId = null;
  let uploadedSkins = [];
  let currentSkin = STEVE_SKIN; // Track current skin for pose saving
  let poseDB = JSON.parse(localStorage.getItem("poses") || "{}");
  let bgColor = bgColorPicker?.value || "#000000";
  let bgImage = null;
  let transparentMode = false;

  // Resize state
  let resizingChar = null;
  let resizeData = null;

  // Drawing state
  let isDrawing = false;
  let drawMode = ""; // 'pen' or 'eraser'
  let currentColor = "#000000";

  // Shape state
  let shapeMode = false;
  let shapeType = "line"; // 'line', 'rect', 'circle'
  let shapeStart = null;
  let shapeBaseImage = null;
  let shapeLastCoords = null;

  // Initialize pen as active
  let penInitialized = false;

  // --- UTILS ---
  const deg = v => (v * Math.PI) / 180;

  function setSkin(url) {
    const sel = getSelectedCharacter();
    if (sel && sel.viewer) sel.viewer.loadSkin(url);
    if (sel) sel.skin = url;
    currentSkin = url; // Update currentSkin for pose saving
    highlightActiveSkin();
  }

  if (loadSteveBtn) {
    loadSteveBtn.style.backgroundImage = 'url("/heads/steve_head.png")';
    loadSteveBtn.onclick = () => setSkin(STEVE_SKIN);
  }
  if (loadAlexBtn) {
    loadAlexBtn.style.backgroundImage = 'url("/heads/alex_head.png")';
    loadAlexBtn.onclick = () => setSkin(ALEX_SKIN);
  }

  if (fetchSkinBtn && playerUsername) {
    fetchSkinBtn.onclick = async () => {
      const username = playerUsername.value.trim();
      if (!username) {
        alert("Please enter a Minecraft username");
        return;
      }

      try {
        const uuidResponse = await fetch(
          `/mojang/users/profiles/minecraft/${encodeURIComponent(username)}`
        );
        if (!uuidResponse.ok) throw new Error("Player not found");

        const uuidData = await uuidResponse.json();
        if (!uuidData?.id) throw new Error("Player not found");

        const profileResponse = await fetch(
          `/session/session/minecraft/profile/${encodeURIComponent(uuidData.id)}`
        );
        if (!profileResponse.ok) throw new Error("Failed to fetch skin");

        const profileData = await profileResponse.json();
        const texturesProp = profileData?.properties?.find(
          prop => prop.name === "textures"
        );
        if (!texturesProp?.value) throw new Error("No skin found");

        const decoded = JSON.parse(atob(texturesProp.value));
        const skinUrl = decoded?.textures?.SKIN?.url;
        if (!skinUrl) throw new Error("No skin found");

        const proxiedSkinUrl = skinUrl.startsWith("https://textures.minecraft.net")
          ? skinUrl.replace("https://textures.minecraft.net", "/textures")
          : skinUrl;

        setSkin(proxiedSkinUrl);
        uploadedSkins.push({ name: username, url: proxiedSkinUrl });
        renderUploadedSkins();
      } catch (error) {
        alert(`Error fetching skin: ${error.message}`);
      }
    };
  }

  const uploadBtn = document.getElementById("uploadBtn");
  if (uploadBtn && skinUpload) uploadBtn.onclick = () => skinUpload.click();

  if (skinUpload) {
    skinUpload.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      uploadedSkins.push({ name: file.name, url });
      setSkin(url);
      renderUploadedSkins();
    });
  }

  function renderUploadedSkins() {
    const uploadBtn = document.getElementById("uploadBtn");
    const uploadedSkinsContainer = document.getElementById("uploadedSkins");

    if (!uploadedSkinsContainer || !uploadBtn) return;

    // Clear only the skin previews, not the button
    Array.from(uploadedSkinsContainer.children).forEach(child => {
      if (child.id !== "uploadBtn") {
        child.remove();
      }
    });

    uploadedSkins.forEach(skin => {
      const wrapper = document.createElement("div");
      wrapper.className = "skinPreview";

      const miniCanvas = document.createElement("canvas");
      miniCanvas.width = 80;
      miniCanvas.height = 100;

      const miniViewer = new SkinViewer({
        canvas: miniCanvas,
        width: 80,
        height: 100,
        skin: skin.url
      });
      miniViewer.controls.enableRotate = false;
      miniViewer.controls.enableZoom = false;

      const name = document.createElement("div");
      name.className = "skinName";
      name.textContent = skin.name;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "skinDeleteBtn";
      deleteBtn.textContent = "X";
      deleteBtn.onclick = e => {
        e.stopPropagation();
        // Replace this skin with Steve for all characters using it
        characters.forEach(ch => {
          if (ch.skin === skin.url) {
            ch.skin = STEVE_SKIN;
            if (ch.viewer) ch.viewer.loadSkin(STEVE_SKIN);
          }
        });
        // Remove skin from uploaded list
        uploadedSkins = uploadedSkins.filter(s => s.url !== skin.url);
        // If current character's skin was removed, update UI
        if (getSelectedCharacter()?.skin === skin.url) {
          setSkin(STEVE_SKIN);
        }
        renderUploadedSkins();
      };

      wrapper.appendChild(miniCanvas);
      wrapper.appendChild(name);
      wrapper.appendChild(deleteBtn);

      wrapper.onclick = () => {
        const sel = getSelectedCharacter();
        if (sel) {
          sel.skin = skin.url;
        }
        setSkin(skin.url);
      };
      wrapper.dataset.skin = skin.url;

      uploadedSkinsContainer.insertBefore(wrapper, uploadBtn);
    });

    highlightActiveSkin();
  }

  function highlightActiveSkin() {
    const sel = getSelectedCharacter();
    const activeSkin = sel?.skin;
    document.querySelectorAll(".skinPreview").forEach(el => {
      el.classList.toggle("active", el.dataset.skin === activeSkin);
    });
    // Highlight built-in skins
    if (loadSteveBtn) loadSteveBtn.classList.toggle("active", activeSkin === STEVE_SKIN);
    if (loadAlexBtn) loadAlexBtn.classList.toggle("active", activeSkin === ALEX_SKIN);
  }

  // --- SLIDERS ---
  const sliders = {
    headX: document.getElementById("headX"),
    headY: document.getElementById("headY"),
    rightArmX: document.getElementById("rightArmX"),
    rightArmZ: document.getElementById("rightArmZ"),
    leftArmX: document.getElementById("leftArmX"),
    leftArmZ: document.getElementById("leftArmZ"),
    rightLegX: document.getElementById("rightLegX"),
    leftLegX: document.getElementById("leftLegX")
  };

  function bindSlider(slider, part, axis) {
    if (!slider) return;
    slider.addEventListener("input", () => {
      const val = slider.value;
      const sel = getSelectedCharacter();
      if (sel && sel.viewer && sel.viewer.playerObject)
        sel.viewer.playerObject.skin[part].rotation[axis] = deg(val);
      if (sel) {
        sel.sliderValues = sel.sliderValues || {};
        sel.sliderValues[Object.keys(sliders).find(k => sliders[k] === slider)] = val;
      }
    });
  }

  bindSlider(sliders.headX, "head", "x");
  bindSlider(sliders.headY, "head", "y");
  bindSlider(sliders.rightArmX, "rightArm", "x");
  bindSlider(sliders.rightArmZ, "rightArm", "z");
  bindSlider(sliders.leftArmX, "leftArm", "x");
  bindSlider(sliders.leftArmZ, "leftArm", "z");
  bindSlider(sliders.rightLegX, "rightLeg", "x");
  bindSlider(sliders.leftLegX, "leftLeg", "x");

  // --- Character management functions ---
  function getSelectedCharacter() {
    return characters.find(c => c.id === selectedCharacterId) || null;
  }

  function renderCharactersList() {
    const list = document.getElementById("charactersList");
    if (!list) return;
    list.innerHTML = "";
    characters.forEach(c => {
      const item = document.createElement("div");
      item.className = "characterItem";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = c.name;
      nameSpan.onclick = () => selectCharacter(c.id);

      const visibilityBtn = document.createElement("button");
      visibilityBtn.className = "visibilityBtn";
      visibilityBtn.textContent = c.visible ? "Show" : "Hide";
      visibilityBtn.onclick = e => {
        e.stopPropagation();
        c.visible = !c.visible;
        visibilityBtn.textContent = c.visible ? "Show" : "Hide";
        if (c.wrapper) c.wrapper.style.display = c.visible ? "block" : "none";
      };

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "deleteBtn";
      deleteBtn.textContent = "X";
      deleteBtn.onclick = e => {
        e.stopPropagation();
        // Remove character viewport from render area
        const charViewport = document.querySelector(`.charViewport[data-id="${c.id}"]`);
        if (charViewport) charViewport.remove();
        // Remove from characters array
        characters = characters.filter(ch => ch.id !== c.id);
        // Select another character if current is deleted
        if (selectedCharacterId === c.id) {
          if (characters.length > 0) selectCharacter(characters[0].id);
          else selectedCharacterId = null;
        }
        renderCharactersList();
      };

      item.dataset.id = c.id;
      item.appendChild(visibilityBtn);
      item.appendChild(nameSpan);
      item.appendChild(deleteBtn);
      if (c.id === selectedCharacterId) item.classList.add("active");
      list.appendChild(item);
    });
  }

  function createCharacter(name = `Character ${characters.length + 1}`, skin = STEVE_SKIN) {
    const id = Date.now().toString();
    const sliderValues = Object.fromEntries(Object.keys(sliders).map(k => [k, 0]));
    // create DOM wrapper + canvas for this character
    const wrapper = document.createElement("div");
    wrapper.className = "charViewport";
    wrapper.dataset.id = id;
    const cvs = document.createElement("canvas");
    cvs.width = 320;
    cvs.height = 420;
    cvs.style.pointerEvents = "auto"; // Ensure canvas can receive pointer events
    wrapper.appendChild(cvs);

    // Add resize button to viewport (top left)
    const resizeViewportBtn = document.createElement("button");
    resizeViewportBtn.className = "resizeViewportBtn";
    resizeViewportBtn.textContent = "R";
    resizeViewportBtn.title = "Drag to resize";
    const aspectRatio = 320 / 420; // Keep aspect ratio

    resizeViewportBtn.addEventListener("pointerdown", e => {
      e.stopPropagation();
      resizingChar = { id, wrapper, cvs, charViewer: null }; // charViewer will be set below
      resizeData = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: wrapper.offsetWidth,
        startHeight: wrapper.offsetHeight,
        startTop: parseFloat(wrapper.style.top) || 0,
        startLeft: parseFloat(wrapper.style.left) || 0,
        aspectRatio: aspectRatio
      };
      wrapper.classList.add("resizing");
    });

    wrapper.appendChild(resizeViewportBtn);

    // Add delete button to viewport
    const deleteViewportBtn = document.createElement("button");
    deleteViewportBtn.className = "deleteViewportBtn";
    deleteViewportBtn.textContent = "X";
    deleteViewportBtn.onclick = e => {
      e.stopPropagation();
      // Remove character viewport from render area
      wrapper.remove();
      // Remove from characters array
      characters = characters.filter(ch => ch.id !== id);
      // Select another character if current is deleted
      if (selectedCharacterId === id) {
        if (characters.length > 0) selectCharacter(characters[0].id);
        else selectedCharacterId = null;
      }
      renderCharactersList();
    };
    wrapper.appendChild(deleteViewportBtn);

    renderArea.appendChild(wrapper);

    // create a skinviewer for this canvas
    const charViewer = new SkinViewer({ canvas: cvs, width: cvs.width, height: cvs.height, skin });
    charViewer.controls.enableRotate = true;
    charViewer.controls.enableZoom = false;

    // Store charViewer reference for resizing
    if (resizingChar && resizingChar.id === id) {
      resizingChar.charViewer = charViewer;
    }

    // Track zoom level for this character
    let lastZoom = charViewer.camera.position.z;
    const updateZoom = () => {
      const currentZoom = charViewer.camera.position.z;
      if (currentZoom !== lastZoom) {
        lastZoom = currentZoom;
        // Apply scale based on zoom (inverse: closer = bigger, farther = smaller)
        const defaultZoom = 70; // approximate default zoom
        const scale = defaultZoom / currentZoom;
        void scale;
      }
      requestAnimationFrame(updateZoom);
    };
    updateZoom();

    const c = {
      id,
      name,
      skin,
      sliderValues,
      viewer: charViewer,
      wrapper,
      canvas: cvs,
      moveEnabled: false,
      _posX: 0,
      _posY: 0,
      cameraPos: {
        x: charViewer.camera.position.x,
        y: charViewer.camera.position.y,
        z: charViewer.camera.position.z
      },
      visible: true
    };

    // Click on viewport to select this character
    wrapper.addEventListener("click", e => {
      e.stopPropagation();
      if (selectedCharacterId !== c.id) {
        selectCharacter(c.id);
      }
    });

    // pointerdown on wrapper to start dragging when this character is movable
    wrapper.addEventListener("pointerdown", e => {
      // Don't start drag if clicking on the delete button or resize button
      if (e.target.classList.contains("deleteViewportBtn")) return;
      if (e.target.classList.contains("resizeViewportBtn")) return;

      // If move is not enabled, stop propagation but don't drag
      if (!c.moveEnabled) {
        if (e.target === cvs) {
          e.stopPropagation();
        }
        return;
      }
      if (selectedCharacterId !== c.id) return;

      dragging = true;
      dragChar = c;

      startX = e.clientX - c._posX;
      startY = e.clientY - c._posY;

      wrapper.setPointerCapture(e.pointerId);
      wrapper.classList.add("dragging");
      wrapper.style.cursor = "grabbing";

      e.preventDefault();
    });

    characters.push(c);
    selectedCharacterId = id;
    renderCharactersList();
    selectCharacter(id);
    return c;
  }

  function selectCharacter(id) {
    // Save zoom and position of previously selected character
    const prev = getSelectedCharacter();
    if (prev && prev.viewer) {
      prev.cameraPos = {
        x: prev.viewer.camera.position.x,
        y: prev.viewer.camera.position.y,
        z: prev.viewer.camera.position.z
      };
    }

    selectedCharacterId = id;

    // Update character name display
    const characterNameEl = document.getElementById("characterName");
    if (characterNameEl) {
      characterNameEl.textContent =
        id !== null && characters.find(x => x.id === id)
          ? characters.find(x => x.id === id).name
          : "";
    }

    // Show/hide content in right panel based on selection
    const panelRight = document.querySelector(".panel-right");
    if (panelRight) {
      const childrenToToggle = panelRight.querySelectorAll("button, h3, input[type='range']");
      childrenToToggle.forEach(el => {
        el.style.display = id !== null ? "" : "none";
      });
    }

    if (id !== null) {
      const c = characters.find(x => x.id === id);
      if (!c) return;

      // Apply skin and sliders to viewer
      setSkin(c.skin);
      Object.entries(c.sliderValues).forEach(([k, v]) => {
        if (sliders[k]) {
          sliders[k].value = v;
          sliders[k].dispatchEvent(new Event("input"));
        }
      });

      // Restore zoom (camera position) and wrapper position
      if (c.viewer && c.cameraPos) {
        c.viewer.camera.position.set(c.cameraPos.x, c.cameraPos.y, c.cameraPos.z);
        c.viewer.controls.update();
        // Reapply transform with zoom
        const defaultZoom = 70;
        const scale = defaultZoom / c.cameraPos.z;
        void scale;
      }
      if (c.wrapper && c._posX !== undefined && c._posY !== undefined) {
        const defaultZoom = 70;
        const scale = defaultZoom / (c.cameraPos?.z || 70);
        void scale;
      }
    } else {
      // Deselect: reset sliders to 0
      Object.values(sliders).forEach(s => {
        if (!s) return;
        s.value = 0;
        s.dispatchEvent(new Event("input"));
      });
    }

    // selection: bring selected to front, enable its controls, disable others
    characters.forEach(ch => {
      const is = ch.id === id;
      if (ch.wrapper) ch.wrapper.classList.toggle("active", is);
      if (ch.wrapper) ch.wrapper.classList.toggle("movable", is && ch.moveEnabled);
      if (ch.wrapper) {
        const deleteBtn = ch.wrapper.querySelector(".deleteViewportBtn");
        const resizeBtn = ch.wrapper.querySelector(".resizeViewportBtn");
        if (deleteBtn) deleteBtn.style.display = is ? "block" : "none";
        if (resizeBtn) resizeBtn.style.display = is ? "block" : "none";
      }
      if (ch.wrapper) ch.wrapper.style.zIndex = is ? 200 : 100;
      // Allow pointer events on selected character's canvas for rotation
      if (ch.canvas) {
        ch.canvas.style.pointerEvents = is ? "auto" : "none";
      }
      // Enable rotation for selected character
      if (ch.viewer && ch.viewer.controls) {
        ch.viewer.controls.enableRotate = is;
      }
      // Disable move mode for characters that aren't selected
      if (!is && ch.moveEnabled) ch.moveEnabled = false;
    });

    // Update the move button state
    if (typeof updateMoveButtonState === "function") {
      updateMoveButtonState();
    }

    renderCharactersList();
  }

  // Wire addCharacter button
  const addCharacterBtn = document.getElementById("addCharacter");
  if (addCharacterBtn)
    addCharacterBtn.onclick = () => {
      const name = prompt("Character name:", `Character ${characters.length + 1}`);
      createCharacter(name || `Character ${characters.length + 1}`);
    };

  // Create initial character if none
  if (characters.length === 0) createCharacter("Main", STEVE_SKIN);

  // --- DRAWING SETUP ---
  const drawCtx = drawCanvas.getContext("2d");
  // Fixed canvas size to ensure consistent export
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  drawCanvas.width = CANVAS_WIDTH;
  drawCanvas.height = CANVAS_HEIGHT;
  drawCtx.lineWidth = brushSize?.value || 50;
  drawCtx.lineCap = "round";
  drawCtx.strokeStyle = currentColor;

  // Click on renderArea to deselect character
  renderArea.addEventListener("click", () => {
    selectCharacter(null);
  });

  // Toolbar events
  if (penBtn) {
    penBtn.onclick = () => {
      if (drawMode === "pen") {
        // If pen is already active, toggle it off
        drawMode = "";
        drawCanvas.style.pointerEvents = "none";
        penBtn.classList.remove("selected");
      } else {
        // Activate pen mode
        // Disable shape mode when switching to pen
        shapeMode = false;
        if (shapeBtn) shapeBtn.classList.remove("selected");
        drawMode = "pen";
        drawCanvas.style.pointerEvents = "auto";
        drawCtx.globalCompositeOperation = "source-over";
        penBtn.classList.add("selected");
        if (eraserBtn) eraserBtn.classList.remove("selected");
        // Deselect character to avoid interference
        selectCharacter(null);
      }
      updateBrushCursor();
    };
  }

  // Initialize pen as active on first load
  if (!penInitialized) {
    // Don't activate pen at startup - let user choose when to draw
    drawMode = "";
    drawCanvas.style.pointerEvents = "none";
    if (penBtn) penBtn.classList.remove("selected");
    penInitialized = true;
  }

  if (eraserBtn) {
    eraserBtn.onclick = () => {
      if (drawMode === "eraser") {
        drawMode = "";
        drawCanvas.style.pointerEvents = "none";
        eraserBtn.classList.remove("selected");
      } else {
        // Disable shape mode when switching to eraser
        shapeMode = false;
        if (shapeBtn) shapeBtn.classList.remove("selected");
        drawMode = "eraser";
        drawCanvas.style.pointerEvents = "auto";
        drawCtx.globalCompositeOperation = "destination-out";
        eraserBtn.classList.add("selected");
        if (penBtn) penBtn.classList.remove("selected");
      }
      updateBrushCursor();
    };
  }

  if (shapeBtn) {
    shapeBtn.onclick = () => {
      if (shapeMode) {
        // If shape mode is active, toggle it off
        shapeMode = false;
        drawCanvas.style.pointerEvents = "none";
        shapeBtn.classList.remove("selected");
        drawMode = "";
      } else {
        // Activate shape mode
        shapeMode = true;
        drawCanvas.style.pointerEvents = "auto";
        // Reset composite operation and colors for proper shape rendering
        drawCtx.globalCompositeOperation = "source-over";
        drawCtx.strokeStyle = currentColor;
        drawCtx.fillStyle = currentColor;
        shapeBtn.classList.add("selected");
        if (penBtn) penBtn.classList.remove("selected");
        if (eraserBtn) eraserBtn.classList.remove("selected");
        drawMode = "";
        selectCharacter(null);
        // Cycle through shapes: line -> rect -> circle -> line
        const shapes = ["line", "rect", "circle"];
        const currentIndex = shapes.indexOf(shapeType);
        shapeType = shapes[(currentIndex + 1) % shapes.length];
        const shapeNames = { line: "Line", rect: "Rectangle", circle: "Circle" };
        shapeBtn.textContent = `Shape: ${shapeNames[shapeType]}`;
      }
    };
  }

  if (colorPicker) {
    colorPicker.onchange = e => {
      currentColor = e.target.value;
      drawCtx.strokeStyle = currentColor;
      drawCtx.fillStyle = currentColor;
    };
  }

  if (brushSize) {
    brushSize.oninput = e => {
      drawCtx.lineWidth = e.target.value;
    };
  }

  if (clearCanvasBtn) {
    clearCanvasBtn.onclick = () => {
      drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    };
  }

  // Helper function to get correct canvas coordinates
  function getCanvasCoordinates(e) {
    const rect = drawCanvas.getBoundingClientRect();
    const scaleX = drawCanvas.width / rect.width;
    const scaleY = drawCanvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  // Drawing events
  drawCanvas.addEventListener("mousedown", startDrawing);
  drawCanvas.addEventListener("mousemove", draw);
  drawCanvas.addEventListener("mouseup", finishDrawing);
  drawCanvas.addEventListener("mouseout", cancelDrawing);
  drawCanvas.addEventListener("mousemove", updateCursor);

  function startDrawing(e) {
    const coords = getCanvasCoordinates(e);
    if (shapeMode) {
      shapeStart = { x: coords.x, y: coords.y };
      // Capture the current canvas image so previews don't get committed
      try {
        shapeBaseImage = drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
      } catch (err) {
        shapeBaseImage = null;
      }
      shapeLastCoords = null;
      isDrawing = true;
    } else if (drawMode === "pen" || drawMode === "eraser") {
      isDrawing = true;
      drawCtx.beginPath();
      drawCtx.moveTo(coords.x, coords.y);
    }
  }

  function draw(e) {
    if (!isDrawing) return;
    const coords = getCanvasCoordinates(e);

    if (shapeMode && shapeStart) {
      // Keep last coords for commit on mouseup
      shapeLastCoords = coords;
      // Restore base image to remove previous preview
      if (shapeBaseImage) drawCtx.putImageData(shapeBaseImage, 0, 0);
      else drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

      const x = shapeStart.x;
      const y = shapeStart.y;
      const width = coords.x - x;
      const height = coords.y - y;

      drawCtx.strokeStyle = currentColor;
      drawCtx.fillStyle = currentColor;
      drawCtx.lineWidth = brushSize?.value || 50;

      if (shapeType === "line") {
        drawCtx.beginPath();
        drawCtx.moveTo(x, y);
        drawCtx.lineTo(coords.x, coords.y);
        drawCtx.stroke();
      } else if (shapeType === "rect") {
        drawCtx.fillRect(x, y, width, height);
      } else if (shapeType === "circle") {
        const radius = Math.sqrt(width * width + height * height) / 2;
        drawCtx.beginPath();
        drawCtx.arc(x, y, radius, 0, 2 * Math.PI);
        drawCtx.fill();
      }
    } else if (drawMode === "pen" || drawMode === "eraser") {
      drawCtx.lineTo(coords.x, coords.y);
      drawCtx.stroke();
    }
  }

  function updateBrushCursor() {
    if (drawMode === "pen" || drawMode === "eraser") {
      const cursorCanvas = document.createElement("canvas");
      const cursorCtx = cursorCanvas.getContext("2d");
      const size = drawCtx.lineWidth;
      cursorCanvas.width = size + 8;
      cursorCanvas.height = size + 8;

      cursorCtx.beginPath();
      cursorCtx.arc(size / 2 + 4, size / 2 + 4, size / 2, 0, 2 * Math.PI);
      cursorCtx.strokeStyle = "rgba(0, 0, 255, 0.8)";
      cursorCtx.lineWidth = 4;
      cursorCtx.stroke();

      const dataURL = cursorCanvas.toDataURL();
      drawCanvas.style.cursor = `url(${dataURL}) ${size / 2 + 4} ${size / 2 + 4}, crosshair`;
    } else {
      drawCanvas.style.cursor = "default";
    }
  }

  function updateCursor() {
    updateBrushCursor();
  }

  function finishDrawing(e) {
    // Commit the drawing when mouse is released
    if (shapeMode) {
      // Use event coords if available, otherwise fallback to last tracked coords
      const coords = e ? getCanvasCoordinates(e) : shapeLastCoords;
      if (shapeStart && coords) {
        // Restore base and draw final shape
        if (shapeBaseImage) drawCtx.putImageData(shapeBaseImage, 0, 0);
        const x = shapeStart.x;
        const y = shapeStart.y;
        const width = coords.x - x;
        const height = coords.y - y;
        drawCtx.strokeStyle = currentColor;
        drawCtx.fillStyle = currentColor;
        drawCtx.lineWidth = brushSize?.value || 50;
        if (shapeType === "line") {
          drawCtx.beginPath();
          drawCtx.moveTo(x, y);
          drawCtx.lineTo(coords.x, coords.y);
          drawCtx.stroke();
        } else if (shapeType === "rect") {
          drawCtx.fillRect(x, y, width, height);
        } else if (shapeType === "circle") {
          const radius = Math.sqrt(width * width + height * height) / 2;
          drawCtx.beginPath();
          drawCtx.arc(x, y, radius, 0, 2 * Math.PI);
          drawCtx.fill();
        }
      }
      // Clear preview state
      shapeStart = null;
      shapeBaseImage = null;
      shapeLastCoords = null;
      isDrawing = false;
    } else {
      isDrawing = false;
    }
  }

  function cancelDrawing() {
    // Cancel preview without committing (e.g., pointer left canvas)
    if (shapeMode) {
      if (shapeBaseImage) drawCtx.putImageData(shapeBaseImage, 0, 0);
      shapeStart = null;
      shapeBaseImage = null;
      shapeLastCoords = null;
      isDrawing = false;
    } else {
      isDrawing = false;
    }
  }

  // --- RESET ---
  document.querySelectorAll(".reset").forEach(btn => {
    btn.onclick = () => {
      const part = btn.dataset.part;
      const sel = getSelectedCharacter();
      if (!sel || !sel.viewer) return;
      const s = sel.viewer.playerObject.skin;

      if (part === "headX") {
        sliders.headX.value = 0;
        s.head.rotation.x = 0;
      }
      if (part === "headY") {
        sliders.headY.value = 0;
        s.head.rotation.y = 0;
      }
      if (part === "rightArm") {
        sliders.rightArmX.value = 0;
        sliders.rightArmZ.value = 0;
        s.rightArm.rotation.set(0, 0, 0);
      }
      if (part === "leftArm") {
        sliders.leftArmX.value = 0;
        sliders.leftArmZ.value = 0;
        s.leftArm.rotation.set(0, 0, 0);
      }
      if (part === "legs") {
        sliders.rightLegX.value = 0;
        sliders.leftLegX.value = 0;
        s.rightLeg.rotation.set(0, 0, 0);
        s.leftLeg.rotation.set(0, 0, 0);
      }
    };
  });

  const resetAllBtn = document.getElementById("resetAll");
  if (resetAllBtn) {
    resetAllBtn.onclick = () => {
      Object.values(sliders).forEach(s => {
        if (!s) return;
        s.value = 0;
        s.dispatchEvent(new Event("input")); // Trigger input event to save values
      });
      const sel = getSelectedCharacter();
      if (sel && sel.viewer && sel.viewer.playerObject) {
        const s = sel.viewer.playerObject.skin;
        s.head.rotation.set(0, 0, 0);
        s.rightArm.rotation.set(0, 0, 0);
        s.leftArm.rotation.set(0, 0, 0);
        s.rightLeg.rotation.set(0, 0, 0);
        s.leftLeg.rotation.set(0, 0, 0);
      }
    };
  }

  // --- POSES ---
  if (savePoseBtn) {
    savePoseBtn.onclick = () => {
      const name = poseNameInput.value.trim();
      if (!name) return alert("Enter a pose name");
      if (poseDB[name]) return alert("Pose already exists");

      const sel = getSelectedCharacter();
      poseDB[name] = {
        skin: sel?.skin || STEVE_SKIN,
        data: Object.fromEntries(Object.entries(sliders).map(([k, v]) => [k, v.value]))
      };
      localStorage.setItem("poses", JSON.stringify(poseDB));
      poseNameInput.value = "";
    };
  }

  if (loadPoseBtn) {
    loadPoseBtn.onclick = () => {
      renderGallery();
      poseGalleryModal.style.display = "flex";
    };
  }

  function applyPose(pose) {
    // Apply slider values only, don't change the skin
    Object.entries(pose.data).forEach(([k, v]) => {
      if (sliders[k]) {
        sliders[k].value = v;
        sliders[k].dispatchEvent(new Event("input"));
      }
    });
  }

  // --- GALLERY ---
  if (poseGalleryModal) {
    poseGalleryModal.onclick = e => {
      if (e.target === poseGalleryModal) poseGalleryModal.style.display = "none";
    };
  }

  function renderGallery() {
    if (!poseGalleryContent) return;
    poseGalleryContent.innerHTML = "";
    for (const [name, pose] of Object.entries(poseDB)) {
      // Skip invalid poses
      if (!pose || typeof pose !== "object") {
        delete poseDB[name];
        continue;
      }

      const card = document.createElement("div");
      card.className = "poseCard";

      const miniCanvas = document.createElement("canvas");
      miniCanvas.width = 80;
      miniCanvas.height = 100;
      // Ensure skin has a valid value
      const skinUrl = pose.skin && typeof pose.skin === "string" ? pose.skin : STEVE_SKIN;
      const miniViewer = new SkinViewer({
        canvas: miniCanvas,
        width: 80,
        height: 100,
        skin: skinUrl
      });
      const map = {
        headX: ["head", "x"],
        headY: ["head", "y"],
        rightArmX: ["rightArm", "x"],
        rightArmZ: ["rightArm", "z"],
        leftArmX: ["leftArm", "x"],
        leftArmZ: ["leftArm", "z"],
        rightLegX: ["rightLeg", "x"],
        leftLegX: ["leftLeg", "x"]
      };
      if (pose.data && typeof pose.data === "object") {
        Object.entries(pose.data).forEach(([k, v]) => {
          const [part, axis] = map[k];
          if (part && axis && miniViewer.playerObject.skin[part]) {
            miniViewer.playerObject.skin[part].rotation[axis] = deg(v);
          }
        });
      }

      const strong = document.createElement("strong");
      strong.textContent = name;

      const applyBtn = document.createElement("button");
      applyBtn.textContent = "Apply";
      applyBtn.onclick = () => applyPose(pose);

      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.onclick = () => {
        delete poseDB[name];
        localStorage.setItem("poses", JSON.stringify(poseDB));
        renderGallery();
      };

      card.append(miniCanvas, strong, applyBtn, delBtn);
      poseGalleryContent.appendChild(card);
    }
    // Clean up localStorage if any poses were removed
    localStorage.setItem("poses", JSON.stringify(poseDB));
  }

  // --- EXPORT ---
  if (exportBtn) {
    exportBtn.onclick = async () => {
      const target = document.getElementById("renderArea");
      if (!target) return;

      // Save current styles
      const saved = characters.map(c => ({
        id: c.id,
        border: c.wrapper.style.border,
        bg: c.wrapper.style.background,
        overflow: c.wrapper.style.overflow,
        display: c.wrapper.querySelector(".deleteViewportBtn")?.style.display
      }));

      // Save renderArea border style
      const renderAreaBorder = target.style.border;

      // Hide all UI elements
      target.style.border = "none";

      // Hide delete buttons on viewports
      characters.forEach(c => {
        const deleteBtn = c.wrapper.querySelector(".deleteViewportBtn");
        const resizeBtn = c.wrapper.querySelector(".resizeViewportBtn");
        if (deleteBtn) deleteBtn.style.display = "none";
        if (resizeBtn) resizeBtn.style.display = "none";
      });

      // Hide containers and show all characters, allow overflow for zoom
      characters.forEach(c => {
        if (c.wrapper) {
          c.wrapper.style.border = "none";
          c.wrapper.style.background = "transparent";
          c.wrapper.style.overflow = "visible";
          c.wrapper.classList.remove("active", "movable");
        }
      });

      // Render all character viewers
      characters.forEach(c => {
        if (c.viewer) c.viewer.render();
      });

      const canvas = await html2canvas(target, {
        backgroundColor: null,
        useCORS: true,
        scale: 2
      });

      // Restore original styles
      target.style.border = renderAreaBorder;

      characters.forEach(c => {
        const s = saved.find(x => x.id === c.id);
        const deleteBtn = c.wrapper.querySelector(".deleteViewportBtn");
        const resizeBtn = c.wrapper.querySelector(".resizeViewportBtn");
        if (c.wrapper && s) {
          c.wrapper.style.border = s.border;
          c.wrapper.style.background = s.bg;
          c.wrapper.style.overflow = s.overflow;
        }
        // Restore delete button visibility
        if (deleteBtn && s) deleteBtn.style.display = s.display || "block";
        // Restore resize button visibility
        if (resizeBtn) resizeBtn.style.display = "block";
        if (deleteBtn && s) deleteBtn.style.display = s.display || "block";
      });

      // Restore character active/movable states
      const sel = getSelectedCharacter();
      if (sel && sel.wrapper) {
        sel.wrapper.classList.add("active");
        if (sel.moveEnabled) sel.wrapper.classList.add("movable");
      }

      const link = document.createElement("a");
      link.download = "minecraft_pose.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
  }

  // --- BACKGROUND SYSTEM ---
  if (uploadBgBtn && bgUpload) uploadBgBtn.onclick = () => bgUpload.click();

  const bgLayer = document.getElementById("backgroundLayer");

  const updateBackground = () => {
    if (!bgLayer) return;
    if (transparentMode) {
      bgLayer.style.backgroundColor = "transparent";
    } else {
      bgLayer.style.backgroundColor = bgColor;
    }

    if (bgImage) {
      bgLayer.style.backgroundImage = `url("${bgImage}")`;
      bgLayer.style.backgroundSize = "contain";
      bgLayer.style.backgroundRepeat = "no-repeat";
      bgLayer.style.backgroundPosition = "center";
    } else {
      bgLayer.style.backgroundImage = "";
    }
  };

  if (bgColorPicker) {
    bgColorPicker.addEventListener("input", () => {
      bgColor = bgColorPicker.value;
      if (!transparentMode) updateBackground();
    });
  }

  // Transparent toggle
  if (bgTransparent) {
    bgTransparent.addEventListener("click", () => {
      transparentMode = !transparentMode;
      bgTransparent.classList.toggle("active", transparentMode);
      updateBackground();
    });
  }

  // Image
  if (bgUpload) {
    bgUpload.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;

      bgImage = URL.createObjectURL(file);
      updateBackground();
    });
  }

  // Bouton pour enlever l'image
  if (removeBgBtn) {
    removeBgBtn.onclick = () => {
      bgImage = null;
      updateBackground();
    };
  }

  // --- MOVE SYSTEM ---
  const moveBtn = document.getElementById("moveModeBtn");
  let dragging = false;
  let dragChar = null;
  let startX = 0;
  let startY = 0;

  if (moveBtn) {
    moveBtn.onclick = () => {
      const sel = getSelectedCharacter();
      if (!sel) {
        alert("Select a character first");
        return;
      }
      sel.moveEnabled = !sel.moveEnabled;
      moveBtn.classList.toggle("active", sel.moveEnabled);

      // Update movable class for all characters
      characters.forEach(ch => {
        if (ch.wrapper) {
          // Only add movable class if this is the selected character AND move is enabled
          ch.wrapper.classList.toggle("movable", ch.id === sel.id && sel.moveEnabled);
          // Update cursor
          if (ch.id === sel.id) {
            ch.wrapper.style.cursor = sel.moveEnabled ? "grab" : "default";
          }
        }
      });

      characters.forEach(ch => {
        if (ch.viewer && ch.viewer.controls)
          ch.viewer.controls.enableRotate = !sel.moveEnabled && ch.id === sel.id;
        if (ch.canvas) ch.canvas.style.pointerEvents = ch.id === sel.id && !sel.moveEnabled ? "auto" : "none";
      });
    };
  }

  // Update button state when any character changes
  function updateMoveButtonState() {
    const moveBtn = document.getElementById("moveModeBtn");
    if (!moveBtn) return; // Early exit if button doesn't exist yet
    const sel = getSelectedCharacter();
    if (sel) {
      moveBtn.classList.toggle("active", sel.moveEnabled);
    }
  }

  if (resetPositionBtn) {
    resetPositionBtn.onclick = () => {
      const sel = getSelectedCharacter();
      if (!sel) return;
      sel._posX = 0;
      sel._posY = 0;
      const scale = 1;
      if (sel.wrapper) {
        sel.wrapper.style.transform = `translate(0, 0) scale(${scale})`;
      }
    };
  }

  // Global resize listeners
  document.addEventListener("pointermove", () => {
    // Handle resize for any character in resizing state
    characters.forEach(c => {
      if (c.wrapper && c.wrapper.classList.contains("resizing")) {
        const rect = c.resizeButton?.getBoundingClientRect?.();
        const parentRect = c.wrapper.parentElement?.getBoundingClientRect?.();
        void rect;
        void parentRect;
      }
    });
  });

  document.addEventListener("pointerup", () => {
    // Reset resizing flag for all characters
    characters.forEach(c => {
      if (c.wrapper && c.wrapper.classList.contains("resizing")) {
        c.resizing = false;
        c.wrapper.classList.remove("resizing");
      }
    });
  });

  // Global resize listeners
  document.addEventListener("pointermove", e => {
    if (!resizingChar || !resizeData) return;

    const deltaX = e.clientX - resizeData.startX;
    const deltaY = e.clientY - resizeData.startY;
    // Use the larger delta to maintain proportional growth
    // Invert so that moving towards top-left (negative delta) makes it bigger
    const delta = -(Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY);

    // Calculate new height and width maintaining aspect ratio
    const newHeight = Math.max(150, resizeData.startHeight + delta);
    const newWidth = newHeight * resizeData.aspectRatio;

    // The bottom-right corner should stay fixed
    // Bottom-right = startLeft + startWidth, startTop + startHeight
    const bottomRightX = resizeData.startLeft + resizeData.startWidth;
    const bottomRightY = resizeData.startTop + resizeData.startHeight;

    // New top-left so bottom-right stays fixed
    const newTop = bottomRightY - newHeight;
    const newLeft = bottomRightX - newWidth;

    resizingChar.wrapper.style.width = newWidth + "px";
    resizingChar.wrapper.style.height = newHeight + "px";
    resizingChar.wrapper.style.top = newTop + "px";
    resizingChar.wrapper.style.left = newLeft + "px";

    // Find the character and update its viewer
    const char = characters.find(c => c.id === resizingChar.id);
    if (char && char.viewer) {
      // Use setSize if available, otherwise update canvas dimensions
      if (char.viewer.setSize) {
        char.viewer.setSize(Math.round(newWidth), Math.round(newHeight));
      } else {
        resizingChar.cvs.width = Math.round(newWidth);
        resizingChar.cvs.height = Math.round(newHeight);
        char.viewer.camera.aspect = newWidth / newHeight;
        char.viewer.camera.updateProjectionMatrix();
      }
      char.viewer.render();
      // Call render again to ensure proper display
      requestAnimationFrame(() => char.viewer.render());
    }
  });

  document.addEventListener("pointerup", () => {
    if (!resizingChar || !resizeData) return;

    resizingChar.wrapper.classList.remove("resizing");
    resizingChar = null;
    resizeData = null;
  });

  // Mouse move
  window.addEventListener("pointermove", e => {
    if (!dragging || !dragChar) return;

    dragChar._posX = e.clientX - startX;
    dragChar._posY = e.clientY - startY;

    const scale = dragChar.scale || 1;
    dragChar.wrapper.style.transform = `translate(${dragChar._posX}px, ${dragChar._posY}px) scale(${scale})`;
  });

  // Mouse up - always stop dragging
  window.addEventListener("pointerup", () => {
    if (!dragging) return;

    dragging = false;

    if (dragChar && dragChar.wrapper) {
      dragChar.wrapper.classList.remove("dragging");
      dragChar.wrapper.style.cursor = dragChar.moveEnabled ? "grab" : "default";
    }

    dragChar = null;
  });

  return () => {
    window.__mcsceneInitialized = false;
  };
}
