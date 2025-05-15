import React from "react";
import { SceneManager } from "../core/SceneManager";

const CameraControls: React.FC = () => {
  const handleResetCamera = () => {
    const scene = SceneManager.Room?._scene;
    if (scene) {
      const camera = scene.cameras[0];
      if (camera && camera.type === "ArcRotateCamera") {
        const arcCamera = camera as BABYLON.ArcRotateCamera;
        arcCamera.setPosition(new BABYLON.Vector3(0, 5, -10));
        arcCamera.setTarget(BABYLON.Vector3.Zero());
      }
    }
  };

  const handleZoomIn = () => {
    const scene = SceneManager.Room?._scene;
    if (scene) {
      const camera = scene.cameras[0];
      if (camera && camera.type === "ArcRotateCamera") {
        const arcCamera = camera as BABYLON.ArcRotateCamera;
        arcCamera.radius -= 2;
      }
    }
  };

  const handleZoomOut = () => {
    const scene = SceneManager.Room?._scene;
    if (scene) {
      const camera = scene.cameras[0];
      if (camera && camera.type === "ArcRotateCamera") {
        const arcCamera = camera as BABYLON.ArcRotateCamera;
        arcCamera.radius += 2;
      }
    }
  };

  return (
    <div
      style={{
        padding: "1rem",
        backgroundColor: "#f5f5f5",
        borderRadius: "4px",
        margin: "1rem 0",
      }}
    >
      <h3>Camera Controls</h3>
      <div style={{ display: "flex", gap: "1rem" }}>
        <button onClick={handleResetCamera}>Reset Camera</button>
        <button onClick={handleZoomIn}>Zoom In</button>
        <button onClick={handleZoomOut}>Zoom Out</button>
      </div>
    </div>
  );
};

export default CameraControls;
