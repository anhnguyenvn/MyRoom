import React from "react";
import { SceneManager } from "../core/SceneManager";
import { IAssetManifest_MyRoom } from "../models/types";

interface ResetRoomButtonProps {
  initialManifest: IAssetManifest_MyRoom;
  onReset: () => void;
}

const ResetRoomButton: React.FC<ResetRoomButtonProps> = ({
  initialManifest,
  onReset,
}) => {
  const handleReset = () => {
    if (!SceneManager.Room) {
      console.error("Room not initialized");
      return;
    }

    // Clear the current room
    SceneManager.Room.clearMyRoom();

    // Reinitialize with the initial manifest
    SceneManager.Room.initializeMyRoom(initialManifest, false, () => {
      console.log("Room reset to initial state");
      onReset();
    });
  };

  return (
    <button
      onClick={handleReset}
      style={{
        padding: "0.5rem 1rem",
        backgroundColor: "#f44336",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        margin: "0.5rem",
      }}
    >
      Reset Room
    </button>
  );
};

export default ResetRoomButton;
