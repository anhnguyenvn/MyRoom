// src/components/RoomRender.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import * as BABYLON from "@babylonjs/core";
import { SceneManager } from "../core/SceneManager";
import { IAssetManifest_MyRoom } from "../models/types";
import LoadingScreen from "./LoadingScreen";
import RoomStats from "./RoomStats";
import HelpButton from "./HelpButton";
import FullscreenButton, { FullscreenButtonProps } from "./FullscreenButton"; // Import FullscreenButtonProps
import itemDataManagerInstance from "../core/ItemDataManager";

// Props cho RoomRenderer
interface RoomRendererProps {
  roomManifest: IAssetManifest_MyRoom;
  onSceneReady?: () => void; // Callback khi scene BabylonJS sẵn sàng
  width?: string;
  height?: string;
  // backgroundColor prop có thể không còn cần thiết nếu manifest kiểm soát hoàn toàn
  // backgroundColor?: string;
}

const RoomRenderer: React.FC<RoomRendererProps> = ({
  roomManifest,
  onSceneReady,
  width = "100%",
  height = "100%",
  // backgroundColor = '#6B8CC2' // Giá trị mặc định ban đầu, sẽ bị manifest ghi đè
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Ban đầu luôn là true để chờ ItemDataManager

  // Callback cho tiến trình tải của AssetsManager (hoặc SceneLoader nếu dùng riêng lẻ)
  const handleLoadingProgress = useCallback(
    (
      event:
        | BABYLON.ISceneLoaderProgressEvent
        | { loaded: number; total: number }
    ) => {
      if (
        (event as BABYLON.ISceneLoaderProgressEvent).lengthComputable !==
          undefined &&
        (event as BABYLON.ISceneLoaderProgressEvent).lengthComputable
      ) {
        const progressEvent = event as BABYLON.ISceneLoaderProgressEvent;
        const progress = (progressEvent.loaded / progressEvent.total) * 100;
        setLoadingProgress(progress);
      } else if (
        typeof (event as { loaded: number; total: number }).total ===
          "number" &&
        (event as { loaded: number; total: number }).total > 0
      ) {
        const progressEvent = event as { loaded: number; total: number };
        const progress = (progressEvent.loaded / progressEvent.total) * 100;
        setLoadingProgress(progress);
      }
      // console.log(`Loading progress: ${loadingProgress.toFixed(0)}%`);
    },
    []
  );

  // Effect chính để khởi tạo scene BabylonJS
  useEffect(() => {
    if (!canvasRef.current) {
      console.warn("[RoomRenderer] Canvas ref is not available yet.");
      return;
    }

    console.log("[RoomRenderer] Initializing BabylonJS Engine and Scene...");
    engineRef.current = new BABYLON.Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });
    sceneRef.current = new BABYLON.Scene(engineRef.current);
    sceneRef.current.clearColor = BABYLON.Color4.FromHexString(
      roomManifest.main.room.backgroundColor || "#6B8CC2FF"
    );

    const camera = new BABYLON.ArcRotateCamera(
      "camera1",
      -Math.PI / 2,
      Math.PI / 2.5,
      15,
      BABYLON.Vector3.Zero(),
      sceneRef.current
    );
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 50;
    camera.wheelPrecision = 50; // Giảm độ nhạy của zoom chuột
    camera.minZ = 0.1; // Khoảng cách gần nhất camera có thể render

    const light1 = new BABYLON.HemisphericLight(
      "light1",
      new BABYLON.Vector3(1, 1, 0),
      sceneRef.current
    );
    light1.intensity = 0.8;
    const light2 = new BABYLON.PointLight(
      "light2",
      new BABYLON.Vector3(0, 5, -5),
      sceneRef.current
    );
    light2.intensity = 0.5;

    // Khởi tạo SceneManager và MyRoomAPI
    SceneManager.initializeScene({
      scene: sceneRef.current,
      type: "ROOM",
      onSuccess: async () => {
        console.log(
          "[RoomRenderer] SceneManager initialized. MyRoomAPI (SceneManager.Room) is ready."
        );
        setIsLoading(true); // Bắt đầu quá trình tải dữ liệu và assets
        setLoadingProgress(0);

        // Đảm bảo ItemDataManager đã tải dữ liệu trước khi khởi tạo phòng
        if (!itemDataManagerInstance.isDataLoaded()) {
          console.log(
            "[RoomRenderer] Item data not loaded, attempting to load now via MyRoomAPI.initialize()..."
          );
          try {
            // MyRoomAPI.initialize() cũng sẽ cố gắng tải itemData nếu chưa có
            await SceneManager.Room?.initialize();
          } catch (e) {
            console.error(
              "[RoomRenderer] Failed to ensure item data is loaded for initial room load:",
              e
            );
            setIsLoading(false);
            // Hiển thị thông báo lỗi cho người dùng ở đây
            return;
          }
        }

        if (!itemDataManagerInstance.isDataLoaded()) {
          console.error(
            "[RoomRenderer] CRITICAL: Item data failed to load. Cannot proceed with room initialization."
          );
          setIsLoading(false);
          return;
        }
        console.log(
          "[RoomRenderer] Item data is ready. Initializing room with manifest..."
        );

        SceneManager.Room?.initializeMyRoom(
          roomManifest, // Manifest ban đầu từ App.tsx
          false, // forRoomCoordi (giữ lại nếu MyRoomAPI cần)
          () => {
            // onComplete callback
            console.log(
              "[RoomRenderer] Initial room loaded/initialized successfully."
            );
            setIsLoading(false);
            setLoadingProgress(100);
            if (onSceneReady) onSceneReady();
          },
          handleLoadingProgress // onProgress callback
        );
      },
    });

    // Render loop
    const renderLoop = () => {
      if (sceneRef.current) {
        sceneRef.current.render();
      }
    };
    engineRef.current.runRenderLoop(renderLoop);

    // Resize handler
    const handleResize = () => {
      if (engineRef.current) {
        engineRef.current.resize();
      }
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      console.log("[RoomRenderer] Cleaning up RoomRenderer...");
      window.removeEventListener("resize", handleResize);
      if (SceneManager.isInit("ROOM")) {
        console.log("[RoomRenderer] Finalizing SceneManager for ROOM type.");
        SceneManager.finalize("ROOM"); // Điều này sẽ gọi MyRoomAPI.finalize() và MyRoomController.dispose()
      }
      // Scene và Engine cũng nên được dispose nếu RoomRenderer bị unmount hoàn toàn
      // và không có ý định tái sử dụng chúng.
      // Tuy nhiên, SceneManager.finalize() đã bao gồm việc MyRoomController.dispose()
      // MyRoomAPI.finalize() không dispose scene vì scene được truyền từ ngoài vào
      // Chúng ta nên dispose scene và engine ở đây khi RoomRenderer bị unmount.
      if (sceneRef.current) {
        console.log("[RoomRenderer] Disposing scene.");
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
      if (engineRef.current) {
        console.log("[RoomRenderer] Disposing engine.");
        engineRef.current.dispose();
        engineRef.current = null;
      }
      console.log("[RoomRenderer] Cleanup complete.");
    };
  }, []); // Chỉ chạy một lần khi component mount

  // Effect để cập nhật phòng khi roomManifest thay đổi
  const firstManifestLoad = useRef(true);
  useEffect(() => {
    if (firstManifestLoad.current) {
      firstManifestLoad.current = false;
      // Không làm gì trong lần render đầu tiên vì useEffect ở trên đã xử lý
      // việc tải manifest ban đầu thông qua SceneManager.initializeScene -> initializeMyRoom
      return;
    }

    // Chỉ chạy nếu scene đã được khởi tạo, manifest thực sự thay đổi, và ItemDataManager đã sẵn sàng
    if (
      SceneManager.isInit("ROOM") &&
      roomManifest &&
      SceneManager.Room &&
      itemDataManagerInstance.isDataLoaded()
    ) {
      console.log(
        "[RoomRenderer] Room manifest prop changed, re-initializing room..."
      );
      setIsLoading(true);
      setLoadingProgress(0);

      SceneManager.Room.initializeMyRoom(
        roomManifest,
        false, // forRoomCoordi
        () => {
          // onComplete
          console.log(
            "[RoomRenderer] Room updated successfully after manifest change."
          );
          setIsLoading(false);
          setLoadingProgress(100);
        },
        handleLoadingProgress // onProgress
      );
    } else if (
      SceneManager.isInit("ROOM") &&
      !itemDataManagerInstance.isDataLoaded()
    ) {
      console.warn(
        "[RoomRenderer] Manifest changed, but item data is not ready yet. Initialization might be delayed or use stale data if not handled by MyRoomAPI.initialize()."
      );
    }
  }, [roomManifest, handleLoadingProgress, onSceneReady]); // Thêm handleLoadingProgress và onSceneReady vào dependencies

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ width, height, display: "block", outline: "none" }}
        touch-action="none" // Cải thiện tương tác cảm ứng
      />
      <LoadingScreen isVisible={isLoading} progress={loadingProgress} />
      {!isLoading && SceneManager.isInit("ROOM") && <RoomStats />}{" "}
      {/* Chỉ hiển thị RoomStats khi không loading và scene đã init */}
      <HelpButton />
      <FullscreenButton targetElement={canvasRef.current?.parentElement} />
    </>
  );
};

export default RoomRenderer;
