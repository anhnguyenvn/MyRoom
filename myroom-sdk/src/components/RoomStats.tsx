import React, { useState, useEffect } from "react";
import { SceneManager } from "../core/SceneManager";

const RoomStats: React.FC = () => {
  const [stats, setStats] = useState({
    fps: 0,
    itemCount: 0,
    figureCount: 0,
    triangles: 0,
  });

  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (!SceneManager.Room || !SceneManager.Room._scene) return;

      const scene = SceneManager.Room._scene;

      // Get stats
      const fps = Math.round(scene.getEngine().getFps());

      // Get item and figure counts
      SceneManager.Room.getAllItemIds((itemIds) => {
        SceneManager.Room?.getAllFigureIds((figureIds) => {
          // Calculate total triangles in the scene
          let triangles = 0;
          scene.meshes.forEach((mesh) => {
            if (mesh.getTotalVertices() > 0) {
              triangles += mesh.getTotalIndices() / 3;
            }
          });

          setStats({
            fps,
            itemCount: itemIds.length,
            figureCount: figureIds.length,
            triangles: Math.round(triangles),
          });
        });
      });
    }, 1000);

    return () => clearInterval(updateInterval);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        color: "white",
        padding: "0.5rem",
        borderRadius: "4px",
        fontSize: "12px",
        fontFamily: "monospace",
      }}
    >
      <div>FPS: {stats.fps}</div>
      <div>Items: {stats.itemCount}</div>
      <div>Figures: {stats.figureCount}</div>
      <div>Triangles: {stats.triangles}</div>
    </div>
  );
};

export default RoomStats;
