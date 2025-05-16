// src/core/MyRoomAPI.ts
import * as BABYLON from "@babylonjs/core";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader"; // Cần thiết nếu dùng trực tiếp, nhưng thường là AssetsManager
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager"; // Import AssetsManager
import { MyRoomContext } from "./MyRoomContext";
import { MyRoomController } from "./MyRoomController";
import {
  IAssetManifest_MyRoom,
  IMyRoomItemPlacementInfo,
  IMyRoomFigurePlacementInfo,
} from "../models/types";
import itemDataManagerInstance from "./ItemDataManager";
import { AbstractAssetTask, MeshAssetTask, TextFileAssetTask /*, ... */ } from "@babylonjs/core/Misc/assetsManager";

const RENDER_PERIOD_NORMAL = 3;
const RENDER_PERIOD_ACTIVE = 2;
const RENDER_PERIOD_INACTIVE = 60;

export class MyRoomAPI {
  private _scene: BABYLON.Nullable<BABYLON.Scene> = null;
  private _myRoomController: BABYLON.Nullable<MyRoomController> = null;
  private _context: BABYLON.Nullable<MyRoomContext> = null;

  private ASSET_BASE_URL = "/models/"; // Trỏ đến public/models/
  private ASSET_VERSION = "v1.0.3"; // Thay đổi khi asset được cập nhật

  constructor(scene: BABYLON.Scene) {
    console.log("🚀 [MyRoomAPI] Initializing MyRoomAPI...");
    this._scene = scene;

    if (this._scene) {
      const changeRenderLoopFunc = (isActive: boolean) => {
        if (isActive) {
          this.changeRenderLoop(RENDER_PERIOD_ACTIVE);
        } else {
          this.changeRenderLoop(RENDER_PERIOD_NORMAL);
        }
      };
      this._context = new MyRoomContext(this._scene, changeRenderLoopFunc);
      // Quan trọng: Truyền ItemDataManager vào MyRoomController
      this._myRoomController = new MyRoomController(
        this._scene,
        this._context,
        itemDataManagerInstance
      );
      this.changeRenderLoop(RENDER_PERIOD_NORMAL);
      console.log(
        "✅ [MyRoomAPI] MyRoomAPI Initialized with Scene and Controller."
      );
    } else {
      console.error("❌ [MyRoomAPI] Scene not provided during construction!");
    }
  }

  public async initialize(): Promise<void> {
    console.log(
      "🚀 [MyRoomAPI] Explicit initialize call (if needed for async setup beyond constructor)."
    );
    // Nếu ItemDataManager cần load bất đồng bộ và chưa load xong, có thể đợi ở đây
    if (!itemDataManagerInstance.isDataLoaded()) {
      console.log(
        "[MyRoomAPI] Item data not loaded, attempting to load now..."
      );
      try {
        await itemDataManagerInstance.loadAllData();
        console.log(
          "[MyRoomAPI] Item data loaded successfully during API initialization."
        );
      } catch (error) {
        console.error(
          "❌ [MyRoomAPI] Failed to load item data during API initialization:",
          error
        );
        // Quyết định xem có nên ném lỗi hay không
      }
    }
    return Promise.resolve();
  }

  public changeRenderLoop(period: number) {
    this._renderPeriod = period;
    if (this._scene) {
      this._scene.getEngine().setHardwareScalingLevel(1 / period);
    }
    // console.log(`⚙️ [MyRoomAPI] Render period changed to: ${period}`);
  }
  private _renderPeriod: number = RENDER_PERIOD_NORMAL;

  public async initializeMyRoom(
    roomManifest: IAssetManifest_MyRoom | null,
    forRoomCoordi: boolean, // Tham số này có thể không còn cần thiết nếu logic đã rõ ràng
    onComplete: (() => void) | null = null,
    onProgressCallback?:
      | ((event: BABYLON.ISceneLoaderProgressEvent) => void)
      | null
  ): Promise<void> {
    const start = performance.now();
    console.warn(
      "🚀 [MyRoomAPI] Initializing room with dynamic assets via AssetsManager..."
    );

    if (!this._scene) {
      console.error(
        "❌ [MyRoomAPI] Scene is not available for room initialization."
      );
      if (onComplete) onComplete();
      return;
    }
    if (!itemDataManagerInstance.isDataLoaded()) {
      console.error(
        "❌ [MyRoomAPI] Item data is not loaded yet. Cannot initialize room."
      );
      try {
        await itemDataManagerInstance.loadAllData(); // Cố gắng tải lại
        if (!itemDataManagerInstance.isDataLoaded()) {
          console.error("❌ [MyRoomAPI] Failed to load item data after retry.");
          if (onComplete) onComplete();
          return;
        }
        console.log(
          "[MyRoomAPI] Item data loaded successfully before room init."
        );
      } catch (e) {
        console.error("❌ [MyRoomAPI] Error retrying item data load:", e);
        if (onComplete) onComplete();
        return;
      }
    }

    this.clearMyRoom();

    if (!this._myRoomController) {
      console.log("[MyRoomAPI] MyRoomController was null, re-creating.");
      this._myRoomController = new MyRoomController(
        this._scene,
        this._context!,
        itemDataManagerInstance
      );
    }

    if (!roomManifest) {
      console.warn(
        "⚠️ [MyRoomAPI] No manifest provided, initializing an empty or default basic room."
      );
      await this._myRoomController.initializeBasicRoom(
        this._scene.clearColor.toHexString(true),
        [],
        ""
      );
      if (onComplete) onComplete();
      return;
    }

    const assetsManager = new AssetsManager(this._scene);
    assetsManager.useDefaultLoadingScreen = false;

    const allAssetTasks: BABYLON.AbstractAssetTask[] = [];

    // 1. Task tải Room Skin
    const roomSkinItemDef = itemDataManagerInstance.getItemById(
      roomManifest.main.room.roomSkinId
    );
    let roomSkinModelPath: string | null = null;
    if (roomSkinItemDef && roomSkinItemDef.client_itemid) {
      // Chỉ tải nếu là item và có client_itemid
      roomSkinModelPath = itemDataManagerInstance.getItemModelPath(
        roomSkinItemDef.ID
      );
    } else if (
      !roomSkinItemDef &&
      !roomManifest.main.room.roomSkinId.startsWith("#")
    ) {
      // Nếu roomSkinId không phải màu và không tìm thấy item definition, đó có thể là một ID cũ
      console.warn(
        `[MyRoomAPI] RoomSkinId "${roomManifest.main.room.roomSkinId}" is not a color and not found in item data. Will use basic room.`
      );
    }

    if (roomSkinModelPath) {
      const roomSkinTask = assetsManager.addMeshTask(
        `roomSkinTask_${roomManifest.main.room.roomSkinId}`,
        "", // rootURL, modelPath sẽ là đường dẫn tương đối từ ASSET_BASE_URL
        this.ASSET_BASE_URL,
        `${roomSkinModelPath}?v=${this.ASSET_VERSION}`
      );
      roomSkinTask.onSuccess = (task) => {
        console.log(`✅ [AssetsManager] Room skin loaded: ${task.name}`);
        this._myRoomController?.setRoomMeshes(task.loadedMeshes);
      };
      roomSkinTask.onError = (task, message, exception) => {
        console.error(
          `❌ [AssetsManager] Error loading room skin ${task.name}: ${message}`,
          exception
        );
        this._myRoomController?.setRoomLoadErrorFlag(true);
      };
      allAssetTasks.push(roomSkinTask);
    } else {
      this._myRoomController?.setRoomLoadErrorFlag(true); // Đánh dấu để tạo phòng cơ bản
    }

    // 2. Tasks tải Items
    const itemPlacementTasks: {
      itemData: IMyRoomItemPlacementInfo;
      task?: BABYLON.MeshAssetTask;
    }[] = [];
    if (roomManifest.main.items) {
      roomManifest.main.items.forEach((itemData) => {
        const modelPath = itemDataManagerInstance.getItemModelPath(
          itemData.itemId
        );
        if (modelPath) {
          const itemTask = assetsManager.addMeshTask(
            `itemTask_${itemData.itemId}_${itemData.id}`,
            "",
            this.ASSET_BASE_URL,
            `${modelPath}?v=${this.ASSET_VERSION}`
          );
          itemPlacementTasks.push({ itemData, task: itemTask });
          allAssetTasks.push(itemTask);
        } else {
          console.warn(
            `[MyRoomAPI] Could not resolve model path for item ID: ${itemData.itemId} (Instance: ${itemData.id}). Will use placeholder.`
          );
          itemPlacementTasks.push({ itemData });
        }
      });
    }

    // 3. Tasks tải Figures
    const figurePlacementTasks: {
      figureData: IMyRoomFigurePlacementInfo;
      task?: BABYLON.MeshAssetTask;
    }[] = [];
    if (roomManifest.main.figures) {
      roomManifest.main.figures.forEach((figureData) => {
        const modelPath = itemDataManagerInstance.getItemModelPath(
          figureData.avatarId
        );
        if (modelPath) {
          const figureTask = assetsManager.addMeshTask(
            `figureTask_${figureData.avatarId}_${
              figureData.id || figureData.avatarId
            }`,
            "",
            this.ASSET_BASE_URL,
            `${modelPath}?v=${this.ASSET_VERSION}`
          );
          figurePlacementTasks.push({ figureData, task: figureTask });
          allAssetTasks.push(figureTask);
        } else {
          console.warn(
            `[MyRoomAPI] Could not resolve model path for figure/avatar ID: ${figureData.avatarId}. Will use placeholder.`
          );
          figurePlacementTasks.push({ figureData });
        }
      });
    }

    let totalTasks = allAssetTasks.length;
    let completedTasks = 0;

    assetsManager.onProgress = (
      remainingCount,
      totalCount,
      lastFinishedTask
    ) => {
      completedTasks = totalCount - remainingCount;
      if (onProgressCallback) {
        const progressEvent = {
          lengthComputable: true,
          loaded: completedTasks,
          total: totalCount,
        } as BABYLON.ISceneLoaderProgressEvent;
        onProgressCallback(progressEvent);
      }
      // console.log(`[AssetsManager] Progress: ${completedTasks}/${totalCount}. Last: ${lastFinishedTask.name}`);
    };

    assetsManager.onFinish = async (finishedTasks) => {
      console.log("🎉 [AssetsManager] Finished all tasks.");
      if (!this._myRoomController) {
        console.error(
          "❌ [MyRoomAPI] MyRoomController is null after assets finished loading."
        );
        if (onComplete) onComplete();
        return;
      }

      // Gọi hàm này trước để controller biết có tạo phòng cơ bản hay không (dựa vào cờ _roomLoadError)
      await this._myRoomController.finalizeRoomSetup(
        roomManifest.main.room.backgroundColor,
        roomManifest.main.room.grids,
        roomManifest.main.environment || "" // `environment` có thể là ID của item ENVLIGHT
      );

      const loadedItemInfos = itemPlacementTasks.map((ipt) => ({
        itemData: ipt.itemData,
        meshes: ipt.task?.loadedMeshes || [],
      }));
      await this._myRoomController.placeImportedItems(loadedItemInfos);

      const loadedFigureInfos = figurePlacementTasks.map((fpt) => ({
        figureData: fpt.figureData,
        meshes: fpt.task?.loadedMeshes || [],
      }));
      await this._myRoomController.placeImportedFigures(
        loadedFigureInfos,
        forRoomCoordi
      );

      if (roomManifest.main.itemFunctionDatas) {
        roomManifest.main.itemFunctionDatas.forEach((data) => {
          this._myRoomController!.doItemFunction(data.instanceId, data);
        });
      }

      const end = performance.now();
      console.warn(
        `⏱️ [MyRoomAPI] Room initialization time (with assets): ${(
          end - start
        ).toFixed(2)} ms.`
      );
      if (onComplete) onComplete();
    };

    if (allAssetTasks.length > 0) {
      console.log(
        `⏳ [AssetsManager] Starting to load ${allAssetTasks.length} asset tasks...`
      );
      assetsManager.load();
    } else {
      console.log(
        "[MyRoomAPI] No assets to load via AssetsManager. Finalizing room setup immediately."
      );
      if (this._myRoomController) {
        await this._myRoomController.finalizeRoomSetup(
          roomManifest.main.room.backgroundColor,
          roomManifest.main.room.grids,
          roomManifest.main.environment || ""
        );
      }
      if (onComplete) onComplete();
    }
  }

  public clearMyRoom() {
    console.log("🧹 [MyRoomAPI] Clearing room contents...");
    if (this._myRoomController) {
      this._myRoomController.disposeAllRoomContents();
    }
  }

  public finalize() {
    console.log("🏁 [MyRoomAPI] Finalizing MyRoomAPI instance...");
    if (this._myRoomController) {
      this._myRoomController.dispose();
      this._myRoomController = null;
    }
    this._context = null;
    // Không dispose scene ở đây vì nó được quản lý bởi SceneManager
    console.log("🏁 [MyRoomAPI] Finalized.");
  }

  public async placeNewItem(params: {
    itemId: string;
    callback?: (instanceId: string) => void;
  }): Promise<void> {
    if (
      !this._myRoomController ||
      !this._scene ||
      !itemDataManagerInstance.isDataLoaded()
    ) {
      console.error(
        "❌ [MyRoomAPI] Cannot place new item: Controller, scene, or item data not ready."
      );
      if (params.callback) params.callback("");
      return;
    }

    const modelPath = itemDataManagerInstance.getItemModelPath(params.itemId);
    if (!modelPath) {
      console.error(
        `❌ [MyRoomAPI] Cannot find model path for item ID: ${params.itemId}`
      );
      if (params.callback) params.callback("");
      return;
    }
    const fullModelUrl = `${this.ASSET_BASE_URL}${modelPath}?v=${this.ASSET_VERSION}`;

    const instanceId = await this._myRoomController.loadAndPlaceNewItemGLB(
      params.itemId,
      fullModelUrl
    );
    if (params.callback) params.callback(instanceId);
  }

  public async placeNewFigure(
    figureItemId: string,
    isAvatar: boolean,
    callback?: (id: string) => void
  ): Promise<void> {
    if (
      !this._myRoomController ||
      !this._scene ||
      !itemDataManagerInstance.isDataLoaded()
    ) {
      console.error(
        "❌ [MyRoomAPI] Cannot place new figure: Controller, scene, or item data not ready."
      );
      if (callback) callback("");
      return;
    }

    const modelPath = itemDataManagerInstance.getItemModelPath(figureItemId);
    if (!modelPath) {
      console.error(
        `❌ [MyRoomAPI] Cannot find model path for figure/avatar ID: ${figureItemId}`
      );
      if (callback) callback("");
      return;
    }
    const fullModelUrl = `${this.ASSET_BASE_URL}${modelPath}?v=${this.ASSET_VERSION}`;

    const placedId = await this._myRoomController.loadAndPlaceNewFigureGLB(
      figureItemId,
      fullModelUrl,
      isAvatar
    );
    if (callback) callback(placedId);
  }

  // Delegate other methods to MyRoomController
  public getAllItemIds(callback: (ids: string[]) => void): void {
    this._myRoomController?.getAllItemIds(callback);
  }
  public getAllFigureIds(callback: (ids: string[]) => void): void {
    this._myRoomController?.getAllFigureIds(callback);
  }
  public removeItem(instanceId: string): void {
    this._myRoomController?.removeItem(instanceId);
  }
  public removeFigure(figureId: string): void {
    this._myRoomController?.removeFigure(figureId);
  }
  public rotateItem(instanceId: string, angle?: number): void {
    this._myRoomController?.rotateItem(instanceId, angle);
  }
  public rotateFigure(figureId: string, angle?: number): void {
    this._myRoomController?.rotateFigure(figureId, angle);
  }
  public moveItem(instanceId: string, x: number, y: number, z: number): void {
    this._myRoomController?.moveItem(instanceId, new BABYLON.Vector3(x, y, z));
  }
  public moveFigure(figureId: string, x: number, y: number, z: number): void {
    this._myRoomController?.moveFigure(figureId, new BABYLON.Vector3(x, y, z));
  }
  public createScreenShot(
    size: number,
    successCallback: (data: string) => void
  ): void {
    if (!this._scene) {
      console.error("[MyRoomAPI] No scene available for screenshot");
      return;
    }
    if (!this._scene.activeCamera) {
      console.error("[MyRoomAPI] No active camera in scene for screenshot");
      return;
    }
    BABYLON.Tools.CreateScreenshot(
      this._scene.getEngine(),
      this._scene.activeCamera,
      size,
      successCallback
    );
  }

  // Thêm getter cho _scene để RoomStats có thể truy cập (nếu thực sự cần)
  // Hoặc tốt hơn là cung cấp các phương thức cụ thể để lấy stats
  public get scene(): BABYLON.Nullable<BABYLON.Scene> {
    return this._scene;
  }
}
