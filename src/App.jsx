import { useEffect } from "react";
import { initApp } from "./appLogic";

const characterNameStyle = {
  textAlign: "center",
  fontWeight: "bold",
  marginBottom: "10px",
  minHeight: "20px"
};

export default function App() {
  useEffect(() => {
    const cleanup = initApp();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, []);

  return (
    <>
      <h1 className="appTitle">Minecraft Scene Creator</h1>
      <button id="themeToggle" className="themeToggle" aria-label="Toggle theme">
        Light
      </button>

      <div className="toolbar">
        <button id="penBtn" className="toolBtn" aria-label="Pen" title="Pen">
          <img src="/icons/pen_button.png" alt="" className="toolIcon" />
        </button>
        <button id="lineBtn" className="toolBtn toolBtn--line" aria-label="Line" title="Line">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="toolIcon toolIcon--line">
            <path d="M4 18l16-12" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
        <button id="eraserBtn" className="toolBtn" aria-label="Eraser" title="Eraser">
          <img src="/icons/eraser_button.png" alt="" className="toolIcon" />
        </button>
        <div className="shapeControl">
          <button id="shapeBtn" className="toolBtn" aria-label="Shape" title="Shape">
            <img
              src="/icons/shapes_button.png"
              alt=""
              className="toolIcon toolIcon--shape"
            />
          </button>
          <select id="shapeSelect" className="shapeSelect" title="Shape">
            <option value="rect">Rectangle</option>
            <option value="circle">Circle</option>
            <option value="triangle">Triangle</option>
          </select>
        </div>
        <div className="brushControl">
          <label className="brushLabel" htmlFor="brushSize">
            Brush Size
          </label>
          <input
            type="range"
            id="brushSize"
            min="1"
            max="100"
            defaultValue="50"
            title="Brush Size"
          />
        </div>
        <input type="color" id="colorPicker" defaultValue="#000000" />
        <button
          id="clearCanvasBtn"
          className="toolBtn"
          aria-label="Clear Canvas"
          title="Clear Canvas"
        >
          <img src="/icons/delete_all_button.png" alt="" className="toolIcon" />
        </button>
        <div className="toolbarSpacer"></div>
        <button id="exportBtn" className="btnPrimary exportToolbar">
          Export Scene
        </button>
      </div>

      <div className="app">
        <div className="panel-left">
          <div className="panelSection">
            <h3>My Skins</h3>
            <div className="skinButtons">
              <button id="loadSteve" className="skinBtn"></button>
              <button id="loadAlex" className="skinBtn"></button>
            </div>
            <input
              type="text"
              id="playerUsername"
              placeholder="Enter a Minecraft name"
            />
            <button id="fetchSkinBtn" className="btnPrimary">Import Skin</button>
            <input type="file" id="skinUpload" hidden />
            <div id="uploadedSkins">
              <button id="uploadBtn" className="addSkinBtn">
                +
              </button>
            </div>
          </div>


          <div className="panelSection">
            <h3>My Poses</h3>
            <button id="savePose" className="btnPrimary">Save Pose</button>
            <button id="loadPose" className="btnSecondary">Load Pose</button>
          </div>

          <div className="panelSection">
            <h3>My Character</h3>
            <button id="addCharacter" className="btnPrimary">Add Character</button>
            <div id="charactersList" className="charactersList"></div>
          </div>
        </div>

        <div id="renderArea">
          <div id="backgroundLayer"></div>
          <canvas id="drawCanvas"></canvas>
          <div id="viewer"></div>
        </div>

        <div className="panel-right-column">
          <div className="panel-bg">
            <h3>Background</h3>
            <div className="bgButtons">
              <input type="color" id="bgColorPicker" defaultValue="#000000" />
              <input type="file" id="bgUpload" hidden />
              <button id="bgTransparent" className="btnSecondary">Transparent</button>
              <button id="uploadBgBtn" className="btnSecondary">Upload Image</button>
              <button id="removeBgBtn" className="btnGhost">Remove Image</button>
            </div>
          </div>

          <div className="panel-right">
            <div className="panelSection">
              <div id="characterName" style={characterNameStyle}></div>
            </div>

            <div className="panelSection collapsible" data-section="head">
            <button className="sectionToggle" type="button">
              Head
              <span className="chev">▾</span>
            </button>
            <div className="sectionContent">
              <input type="range" id="headX" min="-60" max="60" defaultValue="0" />
              <button className="reset" data-part="headX">
                Reset Up/Down
              </button>

              <input type="range" id="headY" min="-90" max="90" defaultValue="0" />
              <button className="reset" data-part="headY">
                Reset Left/Right
              </button>
            </div>
          </div>

          <div className="panelSection collapsible" data-section="arms">
            <button className="sectionToggle" type="button">
              Arms
              <span className="chev">▾</span>
            </button>
            <div className="sectionContent">
              <input
                type="range"
                id="rightArmX"
                min="-180"
                max="180"
                defaultValue="0"
              />
              <input type="range" id="rightArmZ" min="-90" max="90" defaultValue="0" />
              <button className="reset" data-part="rightArm">
                Reset Right Arm
              </button>

              <input
                type="range"
                id="leftArmX"
                min="-180"
                max="180"
                defaultValue="0"
              />
              <input type="range" id="leftArmZ" min="-90" max="90" defaultValue="0" />
              <button className="reset" data-part="leftArm">
                Reset Left Arm
              </button>
            </div>
          </div>

          <div className="panelSection collapsible" data-section="legs">
            <button className="sectionToggle" type="button">
              Legs
              <span className="chev">▾</span>
            </button>
            <div className="sectionContent">
              <input type="range" id="rightLegX" min="-90" max="90" defaultValue="0" />
              <input type="range" id="leftLegX" min="-90" max="90" defaultValue="0" />
              <button className="reset" data-part="legs">
                Reset Legs
              </button>
            </div>
          </div>

            <div className="panelSection">
              <button id="resetAll">Reset All</button>
            </div>
          </div>
        </div>
      </div>

      <div id="poseGalleryModal">
        <div id="poseGalleryContent"></div>
      </div>

      <div id="appModal" className="appModal" aria-hidden="true">
        <div className="appModalContent" role="dialog" aria-modal="true">
          <h3 id="modalTitle">Modal</h3>
          <p id="modalMessage"></p>
          <label id="modalLabel" htmlFor="modalInput"></label>
          <input id="modalInput" type="text" />
          <div className="appModalActions">
            <button id="modalCancel">Cancel</button>
            <button id="modalConfirm">OK</button>
          </div>
        </div>
      </div>
    </>
  );
}
