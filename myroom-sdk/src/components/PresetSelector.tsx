import React from "react";
import { IAssetManifest_MyRoom } from "../models/types";

// Define some preset room configurations
const presets: { name: string; manifest: IAssetManifest_MyRoom }[] = [
  {
    name: "Empty Room",
    manifest: {
      main: {
        type: "MyRoom",
        room: {
          backgroundColor: "#6b8cc2ff",
          roomSkinId: "room_skin_01",
          grids: [
            {
              meshName: "Floor",
              gridType: "FLOOR",
              gridSize: { w: 20, h: 20 },
              gridOffset: { x: 0, y: 0 },
            },
          ],
        },
        items: [],
        figures: [],
      },
    },
  },
  {
    name: "Furnished Room",
    manifest: {
      main: {
        type: "MyRoom",
        room: {
          backgroundColor: "#e0d2c0ff",
          roomSkinId: "room_skin_01",
          grids: [
            {
              meshName: "Floor",
              gridType: "FLOOR",
              gridSize: { w: 20, h: 20 },
              gridOffset: { x: 0, y: 0 },
            },
          ],
        },
        items: [
          {
            id: "chair_01_instance",
            itemId: "chair_01",
            transform: {
              position: { x: -2, y: 0, z: -3 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
            order: 1,
          },
          {
            id: "table_01_instance",
            itemId: "table_01",
            transform: {
              position: { x: 0, y: 0, z: -1 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
            order: 2,
          },
        ],
        figures: [
          {
            id: "avatar_01_instance",
            avatarId: "avatar_01",
            transform: {
              position: { x: 2, y: 0, z: 2 },
              rotation: { x: 0, y: 180, z: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
            isAvatar: true,
          },
        ],
      },
    },
  },
];

interface PresetSelectorProps {
  onSelectPreset: (manifest: IAssetManifest_MyRoom) => void;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({ onSelectPreset }) => {
  return (
    <div
      style={{
        padding: "1rem",
        backgroundColor: "#f5f5f5",
        borderRadius: "4px",
        margin: "1rem 0",
      }}
    >
      <h3>Room Presets</h3>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          marginTop: "0.5rem",
        }}
      >
        {presets.map((preset, index) => (
          <button
            key={index}
            onClick={() => onSelectPreset(preset.manifest)}
            style={{ minWidth: "120px" }}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PresetSelector;
