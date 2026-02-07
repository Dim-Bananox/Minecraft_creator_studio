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
      <h1>MINECRAFT SKIN POSER</h1>

      <div className="toolbar">
        <button id="penBtn">Pen</button>
        <button id="eraserBtn">Eraser</button>
        <button id="shapeBtn">Shape</button>
        <input type="color" id="colorPicker" defaultValue="#000000" />
        <input
          type="range"
          id="brushSize"
          min="1"
          max="100"
          defaultValue="50"
          title="Brush Size"
        />
        <button id="clearCanvasBtn">Clear Canvas</button>
      </div>

      <div className="app">
        <div className="panel-left">
          <button id="exportBtn">Export Image</button>

          <div className="skinButtons">
            <button id="loadSteve" className="skinBtn"></button>
            <button id="loadAlex" className="skinBtn"></button>
          </div>

          <h3>My Poses</h3>
          <input type="text" id="poseNameInput" placeholder="Pose name" />
          <button id="savePose">Save Pose</button>
          <button id="loadPose">Load Pose</button>

          <h3>My Skins</h3>
          <input
            type="text"
            id="playerUsername"
            placeholder="Minecraft username"
          />
          <button id="fetchSkinBtn">Fetch Skin</button>
          <input type="file" id="skinUpload" hidden />
          <div id="uploadedSkins">
            <button id="uploadBtn" className="addSkinBtn">
              +
            </button>
          </div>

          <h3>My Character</h3>
          <button id="addCharacter">Add Character</button>
          <div id="charactersList" className="charactersList"></div>

          <h3>Background</h3>
          <div className="bgButtons">
            <input type="color" id="bgColorPicker" defaultValue="#000000" />
            <input type="file" id="bgUpload" hidden />
            <button id="bgTransparent">Transparent</button>
            <button id="uploadBgBtn">Upload Image</button>
            <button id="removeBgBtn">Remove Image</button>
          </div>
        </div>

        <div id="renderArea">
          <div id="backgroundLayer"></div>
          <canvas id="drawCanvas"></canvas>
          <div id="viewer"></div>
        </div>

        <div className="panel-right">
          <div id="characterName" style={characterNameStyle}></div>
          <button id="moveModeBtn">Move Character</button>
          <button id="resetPositionBtn">Reset Position</button>

          <h3>Head Up / Down</h3>
          <input type="range" id="headX" min="-60" max="60" defaultValue="0" />
          <button className="reset" data-part="headX">
            Reset
          </button>

          <h3>Head Left / Right</h3>
          <input type="range" id="headY" min="-90" max="90" defaultValue="0" />
          <button className="reset" data-part="headY">
            Reset
          </button>

          <h3>Right Arm</h3>
          <input
            type="range"
            id="rightArmX"
            min="-180"
            max="180"
            defaultValue="0"
          />
          <input type="range" id="rightArmZ" min="-90" max="90" defaultValue="0" />
          <button className="reset" data-part="rightArm">
            Reset
          </button>

          <h3>Left Arm</h3>
          <input
            type="range"
            id="leftArmX"
            min="-180"
            max="180"
            defaultValue="0"
          />
          <input type="range" id="leftArmZ" min="-90" max="90" defaultValue="0" />
          <button className="reset" data-part="leftArm">
            Reset
          </button>

          <h3>Legs</h3>
          <input type="range" id="rightLegX" min="-90" max="90" defaultValue="0" />
          <input type="range" id="leftLegX" min="-90" max="90" defaultValue="0" />
          <button className="reset" data-part="legs">
            Reset
          </button>
          <button id="resetAll">Reset All</button>
        </div>
      </div>

      <div id="poseGalleryModal">
        <div id="poseGalleryContent"></div>
      </div>
    </>
  );
}
