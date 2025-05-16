import React, { useState, useCallback, useEffect, useRef } from "react";
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
import LoadingScreen from "./components/LoadingScreen"; // Import LoadingScreen

import itemDataManagerInstance from "./core/ItemDataManager"; // Import ItemDataManager instance

// Sample room manifest - **SỬ DỤNG itemId TỪ item.json**
const defaultRoomManifest: IAssetManifest_MyRoom = {
  main: {
    type: "MyRoom",
    room: {
      backgroundColor: "#87CEEBFF", // Sky blue
      roomSkinId: "3lz7nEFagi9s3OpXU1ILg",
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
          gridSize: { w: 20, h: 10 },
          gridOffset: { x: 0, y: 0 },
        },
        {
          meshName: "RightWall",
          gridType: "WALL",
          gridSize: { w: 20, h: 10 },
          gridOffset: { x: 0, y: 0 },
        },
      ],
    },
    environment: "1szZzGeZqzulBzOPy3SMq", // ID của "My Room Preferences 인사이드 낮" (Daylight Environment)
    items: [
      {
        id: "chair_instance_01",
        itemId: "7Xy9bdWtdiQXlBG2b6AQi", // ID của "Chair" (Chair) từ item.json
        transform: {
          position: { x: 1, y: 0, z: -2 },
          rotation: { x: 0, y: 45, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        order: 1,
      },
      // {
      //   id: "table_instance_01",
      //   itemId: "9QxcXSGMtUFWxnsmw7NoW", // ID của "테이블" (Table) từ item.json
      //   transform: {
      //     position: { x: -1.5, y: 0, z: -1 },
      //     rotation: { x: 0, y: 0, z: 0 },
      //     scale: { x: 1, y: 1, z: 1 },
      //   },
      //   order: 2,
      // },
    ],
    figures: [
      // Ví dụ figure (nếu có định nghĩa figure trong item.json)
      {
        id: "npc_figure_01",
        avatarId: "34aDyVneHDnaCDEY6gW9Me", // e.g., item có category3 là 131116 (FIGURE)
        transform: { position: { x: 0, y: 0, z: 2 }, rotation: { x: 0, y: 180, z: 0 }, scale: { x: 0.8, y: 0.8, z: 0.8 }},
        isAvatar: true,
      }
    ],
  },
};

const App: React.FC = () => {
  const [roomManifest, setRoomManifest] =
    useState<IAssetManifest_MyRoom>(defaultRoomManifest);
  const [isSceneReady, setIsSceneReady] = useState(false); // Theo dõi scene BabylonJS sẵn sàng
  const [isDataLoading, setIsDataLoading] = useState(true); // Theo dõi ItemDataManager tải xong
  const [backgroundColor, setBackgroundColor] = useState(
    defaultRoomManifest.main.room.backgroundColor
  );
  const [isDarkMode, setIsDarkMode] = useState(false);

  const initialManifestRef = useRef<IAssetManifest_MyRoom>(
    JSON.parse(JSON.stringify(defaultRoomManifest))
  );

  useEffect(() => {
    const loadItemData = async () => {
      setIsDataLoading(true);
      try {
        await itemDataManagerInstance.loadAllData();
        console.log("Item definitions loaded successfully in App.tsx.");
      } catch (error) {
        console.error("Failed to load item definitions in App.tsx:", error);
        // Hiển thị thông báo lỗi cho người dùng nếu cần
      } finally {
        setIsDataLoading(false);
      }
    };
    loadItemData();
  }, []);

  const handleThemeToggle = useCallback(
    () => setIsDarkMode((prev) => !prev),
    []
  );

  const handleRoomReset = useCallback(() => {
    setRoomManifest(JSON.parse(JSON.stringify(initialManifestRef.current)));
    setBackgroundColor(
      initialManifestRef.current.main.room.backgroundColor || "#6b8cc2"
    );
  }, []);

  const handleSceneReadyCallback = useCallback(() => {
    // Đổi tên để tránh nhầm lẫn
    setIsSceneReady(true);
    console.log("BabylonJS Scene is ready and loaded.");
  }, []);

  const handleBackgroundColorChange = useCallback((color: string) => {
    setBackgroundColor(color);
    setRoomManifest((prevManifest) => ({
      ...prevManifest,
      main: {
        ...prevManifest.main,
        room: { ...prevManifest.main.room, backgroundColor: color },
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
    const jsonData = JSON.stringify(roomManifest, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "myroom-manifest.json";
    document.body.appendChild(a);
    a.click();
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

  if (isDataLoading) {
    // Hiển thị màn hình tải cho dữ liệu JSON
    return (
      <LoadingScreen
        isVisible={true}
        progress={itemDataManagerInstance.isDataLoaded() ? 100 : 0}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100vh",
        backgroundColor: isDarkMode ? "#333" : "#fff",
        color: isDarkMode ? "#fff" : "#333",
        transition: "background-color 0.3s, color 0.3s",
      }}
    >
      <div
        style={{
          width: "350px",
          height: "100%",
          overflowY: "auto",
          borderRight: `1px solid ${isDarkMode ? "#444" : "#ddd"}`,
          backgroundColor: isDarkMode ? "#222" : "#f0f0f0",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1>MyRoom SDK</h1>
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
            justifyContent: "space-around",
            margin: "0.5rem 0",
          }}
        >
          <ScreenshotButton />
          <ResetRoomButton
            initialManifest={initialManifestRef.current}
            onReset={handleRoomReset}
          />
        </div>
        <div style={{ flexGrow: 1, overflowY: "auto" }}>
          <CameraControls />
          <ItemControls /> {/* Sẽ được cập nhật để dùng ItemDataManager */}
          <AvatarControls /> {/* Sẽ được cập nhật để dùng ItemDataManager */}
        </div>
      </div>

      <div style={{ flex: 1, position: "relative", height: "100%" }}>
        <RoomRenderer
          roomManifest={roomManifest}
          onSceneReady={handleSceneReadyCallback} // Sử dụng callback đã đổi tên
          // backgroundColor prop có thể không cần nữa nếu manifest quản lý màu nền
        />
      </div>
    </div>
  );
};

export default App;
