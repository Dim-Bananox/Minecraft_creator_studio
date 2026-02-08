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
  const themeToggle = document.getElementById("themeToggle");
  const languageSelect = document.getElementById("languageSelect");

  const savePoseBtn = document.getElementById("savePose");
  const loadPoseBtn = document.getElementById("loadPose");
  const poseGalleryModal = document.getElementById("poseGalleryModal");
  const poseGalleryContent = document.getElementById("poseGalleryContent");

  const exportBtn = document.getElementById("exportBtn");

  const bgUpload = document.getElementById("bgUpload");
  const uploadBgBtn = document.getElementById("uploadBgBtn");
  const bgColorPicker = document.getElementById("bgColorPicker");
  const bgTransparent = document.getElementById("bgTransparent");
  if (bgTransparent) bgTransparent.classList.toggle("active", true);
  const removeBgBtn = document.getElementById("removeBgBtn");


  const penBtn = document.getElementById("penBtn");
  const lineBtn = document.getElementById("lineBtn");
  const eraserBtn = document.getElementById("eraserBtn");
  const shapeBtn = document.getElementById("shapeBtn");
  const shapeSelect = document.getElementById("shapeSelect");
  const colorPicker = document.getElementById("colorPicker");
  const brushSize = document.getElementById("brushSize");
  const clearCanvasBtn = document.getElementById("clearCanvasBtn");

  const drawCanvas = document.getElementById("drawCanvas");

  if (!renderArea || !drawCanvas) {
    window.__mcsceneInitialized = false;
    return () => {};
  }

  const brushCursor = document.createElement("div");
  brushCursor.id = "brushCursor";
  brushCursor.style.display = "none";
  renderArea.appendChild(brushCursor);

  let lastCursor = null;

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

  let characterClipboard = null;
  let lastContextMenuPosition = null;

  // Initialize pen as active
  let penInitialized = false;

  // --- UTILS ---
  const deg = v => (v * Math.PI) / 180;

  const translations = {
    en: {
      appTitle: "Scene Creator",
      languageLabel: "Language",
      toggleTheme: "Toggle theme",
      lightMode: "Light Mode",
      darkMode: "Dark Mode",
      toolPen: "Pen",
      toolLine: "Line",
      toolEraser: "Eraser",
      toolShape: "Shape",
      brushSize: "Brush Size",
      clearCanvas: "Clear Canvas",
      exportScene: "Export Scene",
      mySkins: "My Skins",
      enterMinecraftName: "Enter a Minecraft name",
      importSkin: "Import Skin",
      myPoses: "My Poses",
      savePose: "Save Pose",
      loadPose: "Load Pose",
      myCharacter: "My Character",
      addCharacter: "Add Character",
      background: "Background",
      transparent: "Transparent",
      uploadImage: "Upload Image",
      removeImage: "Remove Image",
      head: "Head",
      arms: "Arms",
      legs: "Legs",
      resetUpDown: "Reset Up/Down",
      resetLeftRight: "Reset Left/Right",
      resetRightArm: "Reset Right Arm",
      resetLeftArm: "Reset Left Arm",
      resetLegs: "Reset Legs",
      resetAll: "Reset All",
      ok: "OK",
      cancel: "Cancel",
      nameCharacter: "Name your character",
      characterNameUsed: "Character name already used.",
      namePose: "Name your pose",
      posePlaceholder: "My pose",
      poseExists: "Pose already exists.",
      poseSaved: "Pose saved successfully.",
      noPoses: "No poses saved yet.",
      skinImported: "Skin imported successfully",
      enterMinecraftNameMessage: "Please enter a Minecraft name.",
      playerNotFound: "Player not found",
      failedFetchSkin: "Failed to fetch skin",
      noSkinFound: "No skin found",
      selectCharacterFirst: "Select a character first",
      apply: "Apply",
      delete: "Delete",
      hide: "Hide",
      show: "Show",
      copy: "Copy",
      paste: "Paste",
      move: "Move",
      resize: "Resize",
      shapeRectangle: "Rectangle",
      shapeCircle: "Circle",
      shapeTriangle: "Triangle"
    },
    fr: {
      appTitle: "Createur de Scene",
      languageLabel: "Langue",
      toggleTheme: "Changer le theme",
      lightMode: "Mode Clair",
      darkMode: "Mode Sombre",
      toolPen: "Stylo",
      toolLine: "Ligne",
      toolEraser: "Gomme",
      toolShape: "Forme",
      brushSize: "Taille du pinceau",
      clearCanvas: "Effacer le canevas",
      exportScene: "Exporter la scene",
      mySkins: "Mes skins",
      enterMinecraftName: "Entrer un nom Minecraft",
      importSkin: "Importer un skin",
      myPoses: "Mes poses",
      savePose: "Sauver la pose",
      loadPose: "Charger la pose",
      myCharacter: "Mon personnage",
      addCharacter: "Ajouter un personnage",
      background: "Arriere-plan",
      transparent: "Transparent",
      uploadImage: "Importer une image",
      removeImage: "Retirer l'image",
      head: "Tete",
      arms: "Bras",
      legs: "Jambes",
      resetUpDown: "Reinitialiser haut/bas",
      resetLeftRight: "Reinitialiser gauche/droite",
      resetRightArm: "Reinitialiser bras droit",
      resetLeftArm: "Reinitialiser bras gauche",
      resetLegs: "Reinitialiser jambes",
      resetAll: "Tout reinitialiser",
      ok: "OK",
      cancel: "Annuler",
      nameCharacter: "Nommer votre personnage",
      characterNameUsed: "Nom de personnage deja utilise.",
      namePose: "Nommer votre pose",
      posePlaceholder: "Ma pose",
      poseExists: "La pose existe deja.",
      poseSaved: "Pose enregistree.",
      noPoses: "Aucune pose enregistree.",
      skinImported: "Skin importe avec succes",
      enterMinecraftNameMessage: "Veuillez entrer un nom Minecraft.",
      playerNotFound: "Joueur introuvable",
      failedFetchSkin: "Echec du telechargement du skin",
      noSkinFound: "Aucun skin trouve",
      selectCharacterFirst: "Selectionnez un personnage d'abord",
      apply: "Appliquer",
      delete: "Supprimer",
      hide: "Cacher",
      show: "Afficher",
      copy: "Copier",
      paste: "Coller",
      move: "Deplacer",
      resize: "Redimensionner",
      shapeRectangle: "Rectangle",
      shapeCircle: "Cercle",
      shapeTriangle: "Triangle"
    },
    es: {
      appTitle: "Creador de Escenas",
      languageLabel: "Idioma",
      toggleTheme: "Cambiar tema",
      lightMode: "Modo Claro",
      darkMode: "Modo Oscuro",
      toolPen: "Lapiz",
      toolLine: "Linea",
      toolEraser: "Borrador",
      toolShape: "Forma",
      brushSize: "Tamano del pincel",
      clearCanvas: "Borrar lienzo",
      exportScene: "Exportar escena",
      mySkins: "Mis skins",
      enterMinecraftName: "Introduce un nombre de Minecraft",
      importSkin: "Importar skin",
      myPoses: "Mis poses",
      savePose: "Guardar pose",
      loadPose: "Cargar pose",
      myCharacter: "Mi personaje",
      addCharacter: "Agregar personaje",
      background: "Fondo",
      transparent: "Transparente",
      uploadImage: "Subir imagen",
      removeImage: "Quitar imagen",
      head: "Cabeza",
      arms: "Brazos",
      legs: "Piernas",
      resetUpDown: "Reiniciar arriba/abajo",
      resetLeftRight: "Reiniciar izquierda/derecha",
      resetRightArm: "Reiniciar brazo derecho",
      resetLeftArm: "Reiniciar brazo izquierdo",
      resetLegs: "Reiniciar piernas",
      resetAll: "Reiniciar todo",
      ok: "OK",
      cancel: "Cancelar",
      nameCharacter: "Nombra tu personaje",
      characterNameUsed: "El nombre ya esta en uso.",
      namePose: "Nombra tu pose",
      posePlaceholder: "Mi pose",
      poseExists: "La pose ya existe.",
      poseSaved: "Pose guardada.",
      noPoses: "No hay poses guardadas.",
      skinImported: "Skin importado correctamente",
      enterMinecraftNameMessage: "Introduce un nombre de Minecraft.",
      playerNotFound: "Jugador no encontrado",
      failedFetchSkin: "Error al obtener el skin",
      noSkinFound: "No se encontro skin",
      selectCharacterFirst: "Selecciona un personaje primero",
      apply: "Aplicar",
      delete: "Eliminar",
      hide: "Ocultar",
      show: "Mostrar",
      copy: "Copiar",
      paste: "Pegar",
      move: "Mover",
      resize: "Redimensionar",
      shapeRectangle: "Rectangulo",
      shapeCircle: "Circulo",
      shapeTriangle: "Triangulo"
    },
    de: {
      appTitle: "Szenenersteller",
      languageLabel: "Sprache",
      toggleTheme: "Thema wechseln",
      lightMode: "Heller Modus",
      darkMode: "Dunkler Modus",
      toolPen: "Stift",
      toolLine: "Linie",
      toolEraser: "Radierer",
      toolShape: "Form",
      brushSize: "Pinselgroesse",
      clearCanvas: "Leinwand leeren",
      exportScene: "Szene exportieren",
      mySkins: "Meine Skins",
      enterMinecraftName: "Minecraft Namen eingeben",
      importSkin: "Skin importieren",
      myPoses: "Meine Posen",
      savePose: "Pose speichern",
      loadPose: "Pose laden",
      myCharacter: "Mein Charakter",
      addCharacter: "Charakter hinzufuegen",
      background: "Hintergrund",
      transparent: "Transparent",
      uploadImage: "Bild hochladen",
      removeImage: "Bild entfernen",
      head: "Kopf",
      arms: "Arme",
      legs: "Beine",
      resetUpDown: "Oben/Unten zuruecksetzen",
      resetLeftRight: "Links/Rechts zuruecksetzen",
      resetRightArm: "Rechter Arm zuruecksetzen",
      resetLeftArm: "Linker Arm zuruecksetzen",
      resetLegs: "Beine zuruecksetzen",
      resetAll: "Alles zuruecksetzen",
      ok: "OK",
      cancel: "Abbrechen",
      nameCharacter: "Charakter benennen",
      characterNameUsed: "Name bereits verwendet.",
      namePose: "Pose benennen",
      posePlaceholder: "Meine Pose",
      poseExists: "Pose existiert bereits.",
      poseSaved: "Pose gespeichert.",
      noPoses: "Noch keine Posen gespeichert.",
      skinImported: "Skin erfolgreich importiert",
      enterMinecraftNameMessage: "Bitte Minecraft Namen eingeben.",
      playerNotFound: "Spieler nicht gefunden",
      failedFetchSkin: "Skin konnte nicht geladen werden",
      noSkinFound: "Kein Skin gefunden",
      selectCharacterFirst: "Bitte zuerst einen Charakter waehlen",
      apply: "Anwenden",
      delete: "Loeschen",
      hide: "Ausblenden",
      show: "Anzeigen",
      copy: "Kopieren",
      paste: "Einfuegen",
      move: "Bewegen",
      resize: "Groesse aendern",
      shapeRectangle: "Rechteck",
      shapeCircle: "Kreis",
      shapeTriangle: "Dreieck"
    },
    it: {
      appTitle: "Creatore di Scene",
      languageLabel: "Lingua",
      toggleTheme: "Cambia tema",
      lightMode: "Modalita Chiara",
      darkMode: "Modalita Scura",
      toolPen: "Penna",
      toolLine: "Linea",
      toolEraser: "Gomma",
      toolShape: "Forma",
      brushSize: "Dimensione pennello",
      clearCanvas: "Pulisci tela",
      exportScene: "Esporta scena",
      mySkins: "I miei skin",
      enterMinecraftName: "Inserisci un nome Minecraft",
      importSkin: "Importa skin",
      myPoses: "Le mie pose",
      savePose: "Salva posa",
      loadPose: "Carica posa",
      myCharacter: "Il mio personaggio",
      addCharacter: "Aggiungi personaggio",
      background: "Sfondo",
      transparent: "Trasparente",
      uploadImage: "Carica immagine",
      removeImage: "Rimuovi immagine",
      head: "Testa",
      arms: "Braccia",
      legs: "Gambe",
      resetUpDown: "Reimposta su/giu",
      resetLeftRight: "Reimposta sinistra/destra",
      resetRightArm: "Reimposta braccio destro",
      resetLeftArm: "Reimposta braccio sinistro",
      resetLegs: "Reimposta gambe",
      resetAll: "Reimposta tutto",
      ok: "OK",
      cancel: "Annulla",
      nameCharacter: "Dai un nome al personaggio",
      characterNameUsed: "Nome gia usato.",
      namePose: "Dai un nome alla posa",
      posePlaceholder: "La mia posa",
      poseExists: "La posa esiste gia.",
      poseSaved: "Posa salvata.",
      noPoses: "Nessuna posa salvata.",
      skinImported: "Skin importato con successo",
      enterMinecraftNameMessage: "Inserisci un nome Minecraft.",
      playerNotFound: "Giocatore non trovato",
      failedFetchSkin: "Impossibile ottenere lo skin",
      noSkinFound: "Nessuno skin trovato",
      selectCharacterFirst: "Seleziona prima un personaggio",
      apply: "Applica",
      delete: "Elimina",
      hide: "Nascondi",
      show: "Mostra",
      copy: "Copia",
      paste: "Incolla",
      move: "Sposta",
      resize: "Ridimensiona",
      shapeRectangle: "Rettangolo",
      shapeCircle: "Cerchio",
      shapeTriangle: "Triangolo"
    }
  };

  let currentLanguage = localStorage.getItem("language") || "en";

  const t = key => translations[currentLanguage]?.[key] || translations.en[key] || key;

  const updateThemeLabel = () => {
    if (!themeToggle) return;
    const isLight = document.body.classList.contains("light");
    themeToggle.textContent = isLight ? t("darkMode") : t("lightMode");
  };

  const applyLanguage = nextLanguage => {
    if (nextLanguage) currentLanguage = nextLanguage;
    localStorage.setItem("language", currentLanguage);
    if (languageSelect) languageSelect.value = currentLanguage;

    document.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
      el.title = t(el.dataset.i18nTitle);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(el => {
      el.setAttribute("aria-label", t(el.dataset.i18nAria));
    });

    const shapeSelectEl = document.getElementById("shapeSelect");
    if (shapeSelectEl) {
      Array.from(shapeSelectEl.options).forEach(option => {
        if (option.value === "rect") option.textContent = t("shapeRectangle");
        if (option.value === "circle") option.textContent = t("shapeCircle");
        if (option.value === "triangle") option.textContent = t("shapeTriangle");
      });
    }

    const menu = document.getElementById("characterContextMenu");
    if (menu) {
      const copyBtn = menu.querySelector('[data-action="copy"]');
      const pasteBtn = menu.querySelector('[data-action="paste"]');
      if (copyBtn) copyBtn.textContent = t("copy");
      if (pasteBtn) pasteBtn.textContent = t("paste");
    }

    document.querySelectorAll(".resizeViewportBtn").forEach(btn => {
      btn.title = t("resize");
      btn.setAttribute("aria-label", t("resize"));
    });
    document.querySelectorAll(".moveViewportBtn").forEach(btn => {
      btn.title = t("move");
      btn.setAttribute("aria-label", t("move"));
    });

    updateThemeLabel();
    renderCharactersList();
    renderGallery();
  };

  const setTheme = theme => {
    document.body.classList.toggle("light", theme === "light");
    updateThemeLabel();
    localStorage.setItem("theme", theme);
  };

  if (themeToggle) {
    const storedTheme = localStorage.getItem("theme") || "dark";
    applyLanguage(currentLanguage);
    setTheme(storedTheme);
    themeToggle.onclick = () => {
      const isLight = document.body.classList.contains("light");
      setTheme(isLight ? "dark" : "light");
    };
  }

  if (languageSelect) {
    languageSelect.value = currentLanguage;
    languageSelect.onchange = e => applyLanguage(e.target.value);
  }

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

  const appModal = document.getElementById("appModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalLabel = document.getElementById("modalLabel");
  const modalInput = document.getElementById("modalInput");
  const modalConfirm = document.getElementById("modalConfirm");
  const modalCancel = document.getElementById("modalCancel");
  let modalResolve = null;

  function openModal({
    title,
    message,
    inputLabel,
    inputPlaceholder,
    defaultValue,
    showInput,
    maxLength,
    confirmText,
    cancelText,
    showCancel
  }) {
    if (!appModal) return Promise.resolve(null);

    modalTitle.textContent = title || "";
    modalTitle.style.display = title ? "block" : "none";
    modalMessage.textContent = message || "";
    modalLabel.textContent = inputLabel || "";
    modalInput.value = defaultValue || "";
    modalInput.placeholder = inputPlaceholder || "";
    modalInput.maxLength = typeof maxLength === "number" ? maxLength : 524288;

    const hasInput = Boolean(showInput);
    const hasLabel = hasInput && Boolean(inputLabel);
    modalLabel.style.display = hasLabel ? "block" : "none";
    modalInput.style.display = hasInput ? "block" : "none";

    modalConfirm.textContent = confirmText || t("ok");
    modalCancel.textContent = cancelText || t("cancel");
    modalCancel.style.display = showCancel === false ? "none" : "inline-flex";

    appModal.classList.add("open");
    appModal.setAttribute("aria-hidden", "false");

    if (hasInput) {
      setTimeout(() => modalInput.focus(), 0);
    } else {
      setTimeout(() => modalConfirm.focus(), 0);
    }

    return new Promise(resolve => {
      modalResolve = resolve;
    });
  }

  function closeModal(value) {
    if (!appModal) return;
    appModal.classList.remove("open");
    appModal.setAttribute("aria-hidden", "true");
    if (typeof modalResolve === "function") {
      const resolver = modalResolve;
      modalResolve = null;
      resolver(value);
    }
  }

  if (modalConfirm) {
    modalConfirm.onclick = () => {
      const value = modalInput.style.display === "block" ? modalInput.value : true;
      closeModal(value);
    };
  }

  if (modalCancel) {
    modalCancel.onclick = () => closeModal(null);
  }

  if (appModal) {
    appModal.addEventListener("click", e => {
      if (e.target === appModal) closeModal(null);
    });
  }

  if (fetchSkinBtn) {
    fetchSkinBtn.onclick = async () => {
      const cleanName = (playerUsername?.value || "").trim();
      if (!cleanName) {
        await openModal({
          message: t("enterMinecraftNameMessage"),
          showInput: false,
          showCancel: false
        });
        return;
      }

      try {
        const uuidResponse = await fetch(
          `/mojang/users/profiles/minecraft/${encodeURIComponent(cleanName)}`
        );
        if (!uuidResponse.ok) throw new Error(t("playerNotFound"));

        const uuidData = await uuidResponse.json();
        if (!uuidData?.id) throw new Error(t("playerNotFound"));

        const profileResponse = await fetch(
          `/session/session/minecraft/profile/${encodeURIComponent(uuidData.id)}`
        );
        if (!profileResponse.ok) throw new Error(t("failedFetchSkin"));

        const profileData = await profileResponse.json();
        const texturesProp = profileData?.properties?.find(
          prop => prop.name === "textures"
        );
        if (!texturesProp?.value) throw new Error(t("noSkinFound"));

        const decoded = JSON.parse(atob(texturesProp.value));
        const skinUrl = decoded?.textures?.SKIN?.url;
        if (!skinUrl) throw new Error(t("noSkinFound"));

        const proxiedSkinUrl = skinUrl.startsWith("https://textures.minecraft.net")
          ? skinUrl.replace("https://textures.minecraft.net", "/textures")
          : skinUrl;

        setSkin(proxiedSkinUrl);
        const existingIndex = uploadedSkins.findIndex(s => s.name === cleanName);
        if (existingIndex >= 0) {
          uploadedSkins[existingIndex].url = proxiedSkinUrl;
        } else {
          uploadedSkins.push({ name: cleanName, url: proxiedSkinUrl });
        }
        renderUploadedSkins();
        await openModal({
          message: t("skinImported"),
          showInput: false,
          showCancel: false
        });
      } catch (error) {
        await openModal({
          message: `${t("failedFetchSkin")}: ${error.message}`,
          showInput: false,
          showCancel: false
        });
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

  function updateHeadUsage() {
    const selected = getSelectedCharacter();
    const selectedSkin = selected?.skin || null;
    if (loadSteveBtn) loadSteveBtn.classList.toggle("used", selectedSkin === STEVE_SKIN);
    if (loadAlexBtn) loadAlexBtn.classList.toggle("used", selectedSkin === ALEX_SKIN);
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
    updateHeadUsage();
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

  const sliderMap = {
    headX: ["head", "x"],
    headY: ["head", "y"],
    rightArmX: ["rightArm", "x"],
    rightArmZ: ["rightArm", "z"],
    leftArmX: ["leftArm", "x"],
    leftArmZ: ["leftArm", "z"],
    rightLegX: ["rightLeg", "x"],
    leftLegX: ["leftLeg", "x"]
  };

  function applySliderValuesToCharacter(character) {
    if (!character?.viewer?.playerObject) return;
    const skin = character.viewer.playerObject.skin;
    Object.entries(character.sliderValues || {}).forEach(([k, v]) => {
      const map = sliderMap[k];
      if (!map) return;
      const [part, axis] = map;
      if (skin[part]) skin[part].rotation[axis] = deg(v);
    });
  }

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

  const collapsibles = document.querySelectorAll(".panel-right .panelSection.collapsible");
  collapsibles.forEach(section => {
    section.classList.add("collapsed");
    const toggle = section.querySelector(".sectionToggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        section.classList.toggle("collapsed");
      });
    }
  });

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
      visibilityBtn.textContent = c.visible ? t("hide") : t("show");
      visibilityBtn.onclick = e => {
        e.stopPropagation();
        c.visible = !c.visible;
        visibilityBtn.textContent = c.visible ? t("hide") : t("show");
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
    updateHeadUsage();
  }

  function getUniqueCharacterName(baseName) {
    const existing = characters.map(c => c.name.trim().toLowerCase());
    if (!existing.includes(baseName.toLowerCase())) return baseName;
    let i = 2;
    while (existing.includes(`${baseName} ${i}`.toLowerCase())) i += 1;
    return `${baseName} ${i}`;
  }

  function buildCharacterCopyData(character) {
    if (!character) return null;
    const width = character.wrapper?.offsetWidth || character.canvas?.width || 320;
    const height = character.wrapper?.offsetHeight || character.canvas?.height || 420;
    const left = Number.parseFloat(character.wrapper?.style.left) || 0;
    const top = Number.parseFloat(character.wrapper?.style.top) || 0;
    const cameraPos = character.viewer
      ? {
          x: character.viewer.camera.position.x,
          y: character.viewer.camera.position.y,
          z: character.viewer.camera.position.z
        }
      : character.cameraPos;

    return {
      name: character.name,
      skin: character.skin,
      sliderValues: { ...(character.sliderValues || {}) },
      cameraPos,
      visible: character.visible !== false,
      width,
      height,
      left,
      top,
      posX: character._posX || 0,
      posY: character._posY || 0
    };
  }

  function pasteCharacterFromClipboard() {
    if (!characterClipboard) return;
    const data = characterClipboard;
    const newName = getUniqueCharacterName(`${data.name} Copy`);
    const newChar = createCharacter(newName, data.skin || STEVE_SKIN);
    if (!newChar) return;

    newChar.sliderValues = { ...(data.sliderValues || {}) };
    applySliderValuesToCharacter(newChar);

    if (data.cameraPos && newChar.viewer) {
      newChar.viewer.camera.position.set(
        data.cameraPos.x,
        data.cameraPos.y,
        data.cameraPos.z
      );
      newChar.viewer.controls.update();
      newChar.cameraPos = { ...data.cameraPos };
    }

    if (Number.isFinite(data.width) && Number.isFinite(data.height)) {
      newChar.wrapper.style.width = `${data.width}px`;
      newChar.wrapper.style.height = `${data.height}px`;
      if (newChar.viewer?.setSize) {
        newChar.viewer.setSize(Math.round(data.width), Math.round(data.height));
      } else if (newChar.canvas && newChar.viewer?.camera) {
        newChar.canvas.width = Math.round(data.width);
        newChar.canvas.height = Math.round(data.height);
        newChar.viewer.camera.aspect = data.width / data.height;
        newChar.viewer.camera.updateProjectionMatrix();
      }
      newChar.viewer?.render?.();
    }

    const offset = 20;
    let left = (Number.isFinite(data.left) ? data.left : 0) + offset;
    let top = (Number.isFinite(data.top) ? data.top : 0) + offset;
    if (lastContextMenuPosition && renderArea) {
      const rect = renderArea.getBoundingClientRect();
      left = lastContextMenuPosition.x - rect.left;
      top = lastContextMenuPosition.y - rect.top;
    }
    newChar.wrapper.style.left = `${left}px`;
    newChar.wrapper.style.top = `${top}px`;

    newChar._posX = (data.posX || 0) + offset;
    newChar._posY = (data.posY || 0) + offset;
    const scale = newChar.scale || 1;
    newChar.wrapper.style.transform = `translate(${newChar._posX}px, ${newChar._posY}px) scale(${scale})`;

    newChar.visible = data.visible !== false;
    newChar.wrapper.style.display = newChar.visible ? "block" : "none";

    selectCharacter(newChar.id);
    renderCharactersList();
  }

  const existingContextMenu = document.getElementById("characterContextMenu");
  const characterContextMenu = existingContextMenu || document.createElement("div");
  if (!existingContextMenu) {
    characterContextMenu.id = "characterContextMenu";
    characterContextMenu.innerHTML = `
      <button type="button" data-action="copy">Copy</button>
      <button type="button" data-action="paste">Paste</button>
    `;
    document.body.appendChild(characterContextMenu);
    const copyBtn = characterContextMenu.querySelector('[data-action="copy"]');
    const pasteBtn = characterContextMenu.querySelector('[data-action="paste"]');
    if (copyBtn) copyBtn.textContent = t("copy");
    if (pasteBtn) pasteBtn.textContent = t("paste");
  }

  function closeCharacterContextMenu() {
    characterContextMenu.style.display = "none";
    characterContextMenu.dataset.targetId = "";
  }

  function openCharacterContextMenu(x, y, targetId) {
    lastContextMenuPosition = { x, y };
    const copyBtn = characterContextMenu.querySelector('[data-action="copy"]');
    const pasteBtn = characterContextMenu.querySelector('[data-action="paste"]');
    if (copyBtn) copyBtn.style.display = targetId ? "block" : "none";
    if (pasteBtn)
      pasteBtn.style.display = characterClipboard ? "block" : "none";

    if (!targetId && !characterClipboard) return;

    characterContextMenu.dataset.targetId = targetId || "";
    characterContextMenu.style.display = "block";

    const menuWidth = characterContextMenu.offsetWidth || 160;
    const menuHeight = characterContextMenu.offsetHeight || 80;
    const maxX = window.innerWidth - menuWidth - 8;
    const maxY = window.innerHeight - menuHeight - 8;
    const clampedX = Math.max(8, Math.min(x, maxX));
    const clampedY = Math.max(8, Math.min(y, maxY));
    characterContextMenu.style.left = `${clampedX}px`;
    characterContextMenu.style.top = `${clampedY}px`;
  }

  characterContextMenu.addEventListener("click", e => {
    const action = e.target?.dataset?.action;
    if (!action) return;
    if (action === "copy") {
      const id = characterContextMenu.dataset.targetId;
      const c = characters.find(ch => ch.id === id);
      characterClipboard = buildCharacterCopyData(c);
    }
    if (action === "paste") pasteCharacterFromClipboard();
    closeCharacterContextMenu();
  });

  document.addEventListener("click", () => closeCharacterContextMenu());
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeCharacterContextMenu();
  });

  const charactersListEl = document.getElementById("charactersList");
  if (charactersListEl) {
    charactersListEl.addEventListener("contextmenu", e => {
      const item = e.target.closest(".characterItem");
      if (!item && !characterClipboard) return;
      e.preventDefault();
      openCharacterContextMenu(e.clientX, e.clientY, item?.dataset?.id || "");
    });
  }

  if (renderArea) {
    renderArea.addEventListener("contextmenu", e => {
      if (e.target.closest(".charViewport")) return;
      if (!characterClipboard) return;
      e.preventDefault();
      openCharacterContextMenu(e.clientX, e.clientY, "");
    });
  }

  function createCharacter(name = `Character ${characters.length + 1}`, skin = STEVE_SKIN) {
    const id = Date.now().toString();
    const sliderValues = Object.fromEntries(Object.keys(sliders).map(k => [k, 0]));
    const isFirst = characters.length === 0;
    const baseWidth = isFirst ? 480 : 320;
    const baseHeight = isFirst ? 640 : 420;
    // create DOM wrapper + canvas for this character
    const wrapper = document.createElement("div");
    wrapper.className = "charViewport";
    wrapper.dataset.id = id;
    const cvs = document.createElement("canvas");
    cvs.width = baseWidth;
    cvs.height = baseHeight;
    wrapper.style.width = `${baseWidth}px`;
    wrapper.style.height = `${baseHeight}px`;
    cvs.style.pointerEvents = "auto"; // Ensure canvas can receive pointer events
    wrapper.appendChild(cvs);

    // Add resize button to viewport (top left)
    const resizeViewportBtn = document.createElement("button");
    resizeViewportBtn.className = "resizeViewportBtn";
    resizeViewportBtn.textContent = "";
    resizeViewportBtn.title = t("resize");
    resizeViewportBtn.setAttribute("aria-label", t("resize"));
    const aspectRatio = baseWidth / baseHeight; // Keep aspect ratio

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
      wrapper.classList.add("resizing", "movable");
    });

    wrapper.appendChild(resizeViewportBtn);

    // Add move button to viewport (next to resize)
    const moveViewportBtn = document.createElement("button");
    moveViewportBtn.className = "moveViewportBtn";
    moveViewportBtn.title = t("move");
    moveViewportBtn.setAttribute("aria-label", t("move"));
    moveViewportBtn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 3h-2v4h-2V5H9l3-3zm0 20l-3-3h2v-4h2v4h2l-3 3zm10-10l-3 3v-2h-4v-2h4V9l3 3zM2 12l3-3v2h4v2H5v2l-3-3z" /></svg>';
    wrapper.appendChild(moveViewportBtn);

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
    if (isFirst) {
      const areaRect = renderArea.getBoundingClientRect();
      const left = Math.max(0, (areaRect.width - baseWidth) / 2);
      const top = Math.max(0, (areaRect.height - baseHeight) / 2);
      wrapper.style.left = `${left}px`;
      wrapper.style.top = `${top}px`;
    }

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
      visible: true,
      moveButton: moveViewportBtn
    };

    moveViewportBtn.addEventListener("pointerdown", e => {
      e.stopPropagation();
      e.preventDefault();
      moveHoldChar = c;
      setMoveMode(c, true);
      startDrag(c, e);
    });

    // Click on viewport to select this character
    wrapper.addEventListener("click", e => {
      e.stopPropagation();
      if (selectedCharacterId !== c.id) {
        selectCharacter(c.id);
      }
    });

    wrapper.addEventListener("contextmenu", e => {
      e.preventDefault();
      e.stopPropagation();
      openCharacterContextMenu(e.clientX, e.clientY, c.id);
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
      panelRight.style.display = id !== null ? "" : "none";
      const toggles = panelRight.querySelectorAll(
        ".panelSection.collapsible, .panelSection.collapsible *"
      );
      toggles.forEach(el => {
        el.style.display = id !== null ? "" : "none";
      });

      const resetAllBtn = panelRight.querySelector("#resetAll");
      if (resetAllBtn) {
        const resetSection = resetAllBtn.closest(".panelSection");
        if (resetSection) resetSection.style.display = id !== null ? "" : "none";
        else resetAllBtn.style.display = id !== null ? "" : "none";
      }

      const nameSection = panelRight.querySelector("#characterName")?.closest(".panelSection");
      if (nameSection) nameSection.style.display = id !== null ? "" : "none";
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

      document.querySelectorAll(".skinPreview").forEach(el => {
        el.classList.remove("active");
      });
      if (loadSteveBtn) loadSteveBtn.classList.remove("active");
      if (loadAlexBtn) loadAlexBtn.classList.remove("active");
    }

    updateHeadUsage();

    // selection: bring selected to front, enable its controls, disable others
    characters.forEach(ch => {
      const is = ch.id === id;
      if (ch.wrapper) ch.wrapper.classList.toggle("active", is);
      if (ch.wrapper) ch.wrapper.classList.toggle("movable", is && ch.moveEnabled);
      if (ch.wrapper) {
        const deleteBtn = ch.wrapper.querySelector(".deleteViewportBtn");
        const resizeBtn = ch.wrapper.querySelector(".resizeViewportBtn");
        const moveBtn = ch.wrapper.querySelector(".moveViewportBtn");
        if (deleteBtn) deleteBtn.style.display = is ? "block" : "none";
        if (resizeBtn) resizeBtn.style.display = is ? "block" : "none";
        if (moveBtn) {
          moveBtn.style.display = is ? "block" : "none";
          moveBtn.classList.toggle("active", is && ch.moveEnabled);
        }
      }
      if (ch.wrapper) ch.wrapper.style.zIndex = is ? 200 : 100;
      // Allow pointer events on selected character's canvas for rotation
      if (ch.canvas) {
        ch.canvas.style.pointerEvents = is ? "auto" : "none";
      }
      // Enable rotation for selected character
      if (ch.viewer && ch.viewer.controls) {
        ch.viewer.controls.enableRotate = is && !ch.moveEnabled;
      }
      // Disable move mode for characters that aren't selected
      if (!is && ch.moveEnabled) {
        ch.moveEnabled = false;
        if (ch.moveButton) ch.moveButton.classList.remove("active");
      }
    });

    renderCharactersList();
  }

  // Wire addCharacter button
  const addCharacterBtn = document.getElementById("addCharacter");
  if (addCharacterBtn)
    addCharacterBtn.onclick = async () => {
      const defaultName = `Character ${characters.length + 1}`;
      const name = await openModal({
        message: t("nameCharacter"),
        inputPlaceholder: defaultName,
        showInput: true,
        maxLength: 24
      });
      const cleanName = (name || "").trim() || defaultName;
      const exists = characters.some(
        c => c.name.trim().toLowerCase() === cleanName.toLowerCase()
      );
      if (exists) {
        await openModal({
          message: t("characterNameUsed"),
          showInput: false,
          showCancel: false
        });
        return;
      }
      createCharacter(cleanName);
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
  const setShapeSelected = active => {
    if (shapeBtn) shapeBtn.classList.toggle("selected", active);
    if (shapeSelect) shapeSelect.classList.toggle("selected", active);
  };

  const activateShapeMode = () => {
    shapeMode = true;
    drawCanvas.style.pointerEvents = "auto";
    drawCtx.globalCompositeOperation = "source-over";
    drawCtx.strokeStyle = currentColor;
    drawCtx.fillStyle = currentColor;
    setShapeSelected(true);
    if (lineBtn) lineBtn.classList.remove("selected");
    if (penBtn) penBtn.classList.remove("selected");
    if (eraserBtn) eraserBtn.classList.remove("selected");
    drawMode = "";
    selectCharacter(null);
  };

  const deactivateShapeMode = () => {
    shapeMode = false;
    drawCanvas.style.pointerEvents = "none";
    setShapeSelected(false);
    if (lineBtn) lineBtn.classList.remove("selected");
    drawMode = "";
  };

  if (shapeSelect) {
    if (shapeType === "line") shapeType = "rect";
    shapeSelect.value = shapeType;
    shapeSelect.onchange = e => {
      shapeType = e.target.value;
      activateShapeMode();
    };
  }

  if (lineBtn) {
    lineBtn.onclick = () => {
      if (shapeMode && shapeType === "line") {
        deactivateShapeMode();
      } else {
        shapeType = "line";
        shapeMode = true;
        drawCanvas.style.pointerEvents = "auto";
        drawCtx.globalCompositeOperation = "source-over";
        drawCtx.strokeStyle = currentColor;
        drawCtx.fillStyle = currentColor;
        if (lineBtn) lineBtn.classList.add("selected");
        if (penBtn) penBtn.classList.remove("selected");
        if (eraserBtn) eraserBtn.classList.remove("selected");
        setShapeSelected(false);
        drawMode = "";
        selectCharacter(null);
      }
    };
  }

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
        if (shapeMode) deactivateShapeMode();
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
        if (shapeMode) deactivateShapeMode();
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
        deactivateShapeMode();
      } else {
        // Activate shape mode
        activateShapeMode();
        if (shapeSelect) shapeType = shapeSelect.value;
        if (shapeSelect) shapeSelect.focus();
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
      updateBrushCursor();
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
  drawCanvas.addEventListener("mouseleave", () => {
    if (brushCursor) brushCursor.style.display = "none";
    drawCanvas.style.cursor = "default";
  });

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
      const rect = drawCanvas.getBoundingClientRect();
      const scaleX = rect.width / drawCanvas.width;
      const scaleY = rect.height / drawCanvas.height;
      const screenRadius = (drawCtx.lineWidth / 2) * ((scaleX + scaleY) / 2);
      const rx = screenRadius / scaleX;
      const ry = screenRadius / scaleY;

      drawCtx.beginPath();
      drawCtx.ellipse(coords.x, coords.y, rx, ry, 0, 0, 2 * Math.PI);
      drawCtx.fill();
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
      } else if (shapeType === "triangle") {
        drawCtx.beginPath();
        drawCtx.moveTo(x + width / 2, y);
        drawCtx.lineTo(x + width, y + height);
        drawCtx.lineTo(x, y + height);
        drawCtx.closePath();
        drawCtx.fill();
      }
    } else if (drawMode === "pen" || drawMode === "eraser") {
      drawCtx.lineTo(coords.x, coords.y);
      drawCtx.stroke();
    }
  }

  function updateBrushCursor() {
    if (drawMode === "pen" || drawMode === "eraser" || (shapeMode && shapeType === "line")) {
      const baseSize = drawCtx.lineWidth;
      const rect = drawCanvas.getBoundingClientRect();
      const scaleX = rect.width / drawCanvas.width;
      const scaleY = rect.height / drawCanvas.height;
      const borderSize = 4;
      const size = Math.max(2, baseSize * ((scaleX + scaleY) / 2) + borderSize * 2);

      brushCursor.style.width = `${size}px`;
      brushCursor.style.height = `${size}px`;
      brushCursor.style.display = "block";
      drawCanvas.style.cursor = "none";

      if (lastCursor) {
        brushCursor.style.left = `${lastCursor.x}px`;
        brushCursor.style.top = `${lastCursor.y}px`;
      }
    } else {
      brushCursor.style.display = "none";
      drawCanvas.style.cursor = "default";
    }
  }

  function updateCursor(e) {
    updateBrushCursor();
    if (brushCursor.style.display === "block" && e) {
      const rect = drawCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      lastCursor = { x, y };
      brushCursor.style.left = `${x}px`;
      brushCursor.style.top = `${y}px`;
    }
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
        } else if (shapeType === "triangle") {
          drawCtx.beginPath();
          drawCtx.moveTo(x + width / 2, y);
          drawCtx.lineTo(x + width, y + height);
          drawCtx.lineTo(x, y + height);
          drawCtx.closePath();
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
    savePoseBtn.onclick = async () => {
      const POSE_NAME_MAX = 24;
      const name = await openModal({
        message: t("namePose"),
        inputPlaceholder: t("posePlaceholder"),
        showInput: true,
        maxLength: POSE_NAME_MAX
      });
      const cleanName = (name || "").trim();
      if (!cleanName) return;
      if (cleanName.length > POSE_NAME_MAX) {
        await openModal({
          message: `Pose name too long (max ${POSE_NAME_MAX} characters).`,
          showInput: false,
          showCancel: false
        });
        return;
      }
      if (poseDB[cleanName]) {
        await openModal({
          message: t("poseExists"),
          showInput: false,
          showCancel: false
        });
        return;
      }

      const sel = getSelectedCharacter();
      poseDB[cleanName] = {
        skin: sel?.skin || STEVE_SKIN,
        data: Object.fromEntries(Object.entries(sliders).map(([k, v]) => [k, v.value]))
      };
      localStorage.setItem("poses", JSON.stringify(poseDB));
      await openModal({
        message: t("poseSaved"),
        showInput: false,
        showCancel: false
      });
    };
  }

  if (loadPoseBtn) {
    loadPoseBtn.onclick = () => {
      if (!poseDB || Object.keys(poseDB).length === 0) {
        openModal({
          message: t("noPoses"),
          showInput: false,
          showCancel: false
        });
        return;
      }
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
      applyBtn.className = "btnSecondary";
      applyBtn.textContent = t("apply");
      applyBtn.onclick = () => applyPose(pose);

      const delBtn = document.createElement("button");
      delBtn.className = "btnGhost";
      delBtn.textContent = t("delete");
      delBtn.onclick = () => {
        delete poseDB[name];
        localStorage.setItem("poses", JSON.stringify(poseDB));
        if (Object.keys(poseDB).length === 0) {
          poseGalleryModal.style.display = "none";
          return;
        }
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

      const prevSelectedId = selectedCharacterId;

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
      const renderAreaBg = target.style.background;

      // Hide all UI elements
      target.style.border = "none";
      if (transparentMode) target.style.background = "transparent";

      // Hide delete buttons on viewports
      characters.forEach(c => {
        const deleteBtn = c.wrapper.querySelector(".deleteViewportBtn");
        const resizeBtn = c.wrapper.querySelector(".resizeViewportBtn");
        const moveBtn = c.wrapper.querySelector(".moveViewportBtn");
        if (deleteBtn) deleteBtn.style.display = "none";
        if (resizeBtn) resizeBtn.style.display = "none";
        if (moveBtn) moveBtn.style.display = "none";
      });

      if (exportBtn) exportBtn.style.display = "none";

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
      target.style.background = renderAreaBg;

      characters.forEach(c => {
        const s = saved.find(x => x.id === c.id);
        const deleteBtn = c.wrapper.querySelector(".deleteViewportBtn");
        const resizeBtn = c.wrapper.querySelector(".resizeViewportBtn");
        const moveBtn = c.wrapper.querySelector(".moveViewportBtn");
        if (c.wrapper && s) {
          c.wrapper.style.border = s.border;
          c.wrapper.style.background = s.bg;
          c.wrapper.style.overflow = s.overflow;
        }
        const shouldShow = prevSelectedId && c.id === prevSelectedId;
        if (deleteBtn && s) deleteBtn.style.display = shouldShow ? (s.display || "block") : "none";
        if (resizeBtn) resizeBtn.style.display = shouldShow ? "block" : "none";
        if (moveBtn) moveBtn.style.display = shouldShow ? "block" : "none";
      });

      if (exportBtn) exportBtn.style.display = "block";

      // Restore character active/movable states and selection UI
      if (prevSelectedId && characters.some(c => c.id === prevSelectedId)) {
        selectCharacter(prevSelectedId);
      } else {
        selectCharacter(null);
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
  if (bgTransparent) {
    transparentMode = true;
    bgTransparent.classList.add("active");
  }

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

  updateBackground();

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
  let dragging = false;
  let dragChar = null;
  let startX = 0;
  let startY = 0;

  let moveHoldChar = null;

  function setMoveMode(sel, enabled) {
    const target = sel || getSelectedCharacter();
    if (!target) {
      alert(t("selectCharacterFirst"));
      return;
    }
    target.moveEnabled = enabled;

    characters.forEach(ch => {
      const isSelected = ch.id === target.id;
      if (ch.wrapper) {
        ch.wrapper.classList.toggle("movable", isSelected && target.moveEnabled);
        if (isSelected) ch.wrapper.style.cursor = target.moveEnabled ? "grab" : "default";
      }
      if (ch.viewer && ch.viewer.controls)
        ch.viewer.controls.enableRotate = isSelected && !target.moveEnabled;
      if (ch.canvas)
        ch.canvas.style.pointerEvents =
          isSelected && !target.moveEnabled ? "auto" : "none";
      if (ch.moveButton) ch.moveButton.classList.toggle("active", isSelected && target.moveEnabled);
    });
  }

  function startDrag(char, e) {
    if (!char || selectedCharacterId !== char.id) return;
    dragging = true;
    dragChar = char;
    startX = e.clientX - char._posX;
    startY = e.clientY - char._posY;
    char.wrapper.setPointerCapture(e.pointerId);
    char.wrapper.classList.add("dragging");
    char.wrapper.style.cursor = "grabbing";
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

    resizingChar.wrapper.classList.remove("resizing", "movable");
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

    if (moveHoldChar) {
      setMoveMode(moveHoldChar, false);
      moveHoldChar = null;
    }

    dragChar = null;
  });

  return () => {
    window.__mcsceneInitialized = false;
  };
}
