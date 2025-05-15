import React, { useState, useCallback } from "react";
import RoomRenderer from "./components/RoomRender";
import RoomControls from "./components/RoomControls";
import AvatarControls from "./components/AvatarControls";
import ItemControls from "./components/ItemControls";
import CameraControls from "./components/CameraControls";
import { IAssetManifest_MyRoom } from "./models/types";
import PresetSelector from "./components/PresetSelector";
import ScreenshotButton from "./components/ScreenshotButton";
import ResetRoomButton from "./components/ResetRoomButton";
import ThemeSwitcher from "./components/ThemeSwitcher";

// Sample room manifest based on the original project
const defaultRoomManifest: IAssetManifest_MyRoom = {
  main: {
    type: "MyRoom",
    room: {
      backgroundColor: "#6b8cc2ff",
      roomSkinId: "2NBOyh6Spw7E5QNaEr4BG4",
      grids: [
        {
          meshName: "Floor",
          gridType: "FLOOR",
          gridSize: { w: 20, h: 20 },
          gridOffset: { x: 0, y: 0 },
        },
        {
          meshName: "LeftWall",
          gridType: "WALL",
          gridSize: { w: 20, h: 20 },
          gridOffset: { x: 0, y: 0 },
        },
        {
          meshName: "RightWall",
          gridType: "WALL",
          gridSize: { w: 20, h: 20 },
          gridOffset: { x: 0, y: 0 },
        },
      ],
    },
    items: [
      {
        id: "chair_01",
        itemId: "7Xy9bdWtdiQXlBG2b6AQi",
        transform: {
          position: { x: 2, y: 0, z: 2 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        order: 1,
      },
    ],
    figures: [
      {
        id: "avatar_01",
        avatarId: "BJx99yaC9R2kLsy438O0m",
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 180, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        isAvatar: true,
      },
    ],
  },
};

const App: React.FC = () => {
  const [roomManifest, setRoomManifest] =
    useState<IAssetManifest_MyRoom>(defaultRoomManifest);
  const [isLoaded, setIsLoaded] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#6b8cc2");
  const [initialManifest] =
    useState<IAssetManifest_MyRoom>(defaultRoomManifest);

  const [isDarkMode, setIsDarkMode] = useState(false);

  // Add a handler for theme toggle
  const handleThemeToggle = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const handleRoomReset = useCallback(() => {
    setRoomManifest(initialManifest);
    setBackgroundColor(initialManifest.main.room.backgroundColor || "#6b8cc2");
  }, [initialManifest]);

  const handleSceneReady = useCallback(() => {
    setIsLoaded(true);
    console.log("Room scene is ready and loaded");
  }, []);

  const handleBackgroundColorChange = useCallback((color: string) => {
    setBackgroundColor(color);

    // Update the room manifest with the new background color
    setRoomManifest((prevManifest) => ({
      ...prevManifest,
      main: {
        ...prevManifest.main,
        room: {
          ...prevManifest.main.room,
          backgroundColor: color,
        },
      },
    }));
  }, []);

  const handleSelectPreset = useCallback((manifest: IAssetManifest_MyRoom) => {
    setRoomManifest(manifest);
    if (manifest.main.room.backgroundColor) {
      setBackgroundColor(manifest.main.room.backgroundColor);
    }
  }, []);

  const handleExportManifest = useCallback(() => {
    // Create a blob with the JSON data
    const jsonData = JSON.stringify(roomManifest, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });

    // Create a download link and trigger the download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "room-manifest.json";
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [roomManifest]);

  const handleImportManifest = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const manifest = JSON.parse(
            event.target?.result as string
          ) as IAssetManifest_MyRoom;
          setRoomManifest(manifest);
          if (manifest.main.room.backgroundColor) {
            setBackgroundColor(manifest.main.room.backgroundColor);
          }
        } catch (error) {
          console.error("Error parsing JSON manifest:", error);
          alert("Invalid JSON file. Please upload a valid room manifest.");
        }
      };
      reader.readAsText(file);
    },
    []
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row", // Changed from 'column' to 'row'
        height: "100vh",
        backgroundColor: isDarkMode ? "#333" : "#fff",
        color: isDarkMode ? "#fff" : "#333",
        transition: "background-color 0.3s, color 0.3s",
      }}
    >
      {/* Left Panel - UI Controls */}
      <div
        style={{
          width: "300px", // Fixed width for the left panel
          height: "100%",
          overflowY: "auto",
          borderRight: `1px solid ${isDarkMode ? "#444" : "#ddd"}`,
          backgroundColor: isDarkMode ? "#222" : "#f0f0f0",
          padding: "1rem",
        }}
      >
        <h1>Room Renderer</h1>
        <ThemeSwitcher isDarkMode={isDarkMode} onToggle={handleThemeToggle} />

        <RoomControls
          backgroundColor={backgroundColor}
          onBackgroundColorChange={handleBackgroundColorChange}
          onExportManifest={handleExportManifest}
          onImportManifest={handleImportManifest}
        />

        <PresetSelector onSelectPreset={handleSelectPreset} />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "0.5rem 0",
          }}
        >
          <ScreenshotButton />
          <ResetRoomButton
            initialManifest={initialManifest}
            onReset={handleRoomReset}
          />
        </div>

        <CameraControls />
        <AvatarControls />
        <ItemControls />
      </div>

      {/* Right Panel - Canvas */}
      <div
        style={{
          flex: 1, // Takes remaining space
          position: "relative",
          height: "100%",
        }}
      >
        <RoomRenderer
          roomManifest={roomManifest}
          onSceneReady={handleSceneReady}
          backgroundColor={backgroundColor}
        />
      </div>
    </div>
  );
};

export default App;
