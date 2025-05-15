import React from "react";
import { SceneManager } from "../core/SceneManager";

const ScreenshotButton: React.FC = () => {
  const takeScreenshot = () => {
    if (!SceneManager.Room) {
      console.error("Room not initialized");
      return;
    }

    SceneManager.Room.createScreenShot(1024, (data) => {
      // Create a download link for the screenshot
      const link = document.createElement("a");
      link.href = data;
      link.download = `room-screenshot-${new Date()
        .toISOString()
        .replace(/:/g, "-")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <button
      onClick={takeScreenshot}
      style={{
        padding: "0.5rem 1rem",
        backgroundColor: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        margin: "0.5rem",
      }}
    >
      Take Screenshot
    </button>
  );
};

export default ScreenshotButton;
