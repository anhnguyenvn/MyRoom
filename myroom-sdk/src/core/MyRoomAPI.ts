import * as BABYLON from "@babylonjs/core";
import { MyRoomContext } from "./MyRoomContext";
import { MyRoomController } from "./MyRoomController";
import { AssetLoader } from "./AssetLoader";
import { IAssetManifest_MyRoom } from "../models/types";

const RENDER_PERIOD_NORMAL = 3;
const RENDER_PERIOD_ACTIVE = 2;
const RENDER_PERIOD_INACTIVE = 60;

export class MyRoomAPI {
  private _scene: BABYLON.Nullable<BABYLON.Scene> = null;
  private _myRoomController: BABYLON.Nullable<MyRoomController> = null;
  private _context: BABYLON.Nullable<MyRoomContext> = null;
  private _assetLoader: BABYLON.Nullable<AssetLoader> = null;
  private _renderPeriod: number = 1;

  constructor(scene: BABYLON.Scene) {
    console.log("🚀 [Khởi tạo MyRoomAPI]");
    this._scene = scene;

    if (this._scene) {
      console.log("✅ Đã nhận được scene");

      const changeRenderLoopFunc = (isActive: boolean) => {
        if (isActive) {
          console.log("⚡️ Chuyển sang chế độ render nhanh (active)");
          this._blockChangeRenderLoopByPointer = true;
          this.changeRenderLoop(RENDER_PERIOD_ACTIVE);
        } else {
          console.log("⏸ Chuyển sang render bình thường");
          this._blockChangeRenderLoopByPointer = false;
          this.changeRenderLoop(RENDER_PERIOD_NORMAL);
        }
      };

      this._context = new MyRoomContext(this._scene, changeRenderLoopFunc);
      console.log("🧠 Đã tạo context");

      this._assetLoader = new AssetLoader(this._context, this._scene);
      console.log("📦 AssetLoader đã sẵn sàng");

      this.changeRenderLoop(RENDER_PERIOD_NORMAL);
      console.log(`🎯 Thiết lập renderLoop mặc định: ${RENDER_PERIOD_NORMAL}`);
    } else {
      console.error("❌ MyRoomAPI:constructor - KHÔNG CÓ scene truyền vào!");
    }
  }

  public async initialize(): Promise<void> {
    console.log("🚀 [MyRoomAPI] Initializing...");
    return Promise.resolve();
  }

  public changeRenderLoop(period: number) {
    this._renderPeriod = period;
    if (this._scene) {
      this._scene.getEngine().setHardwareScalingLevel(1 / period);
    }
    console.log(`⚙️ [MyRoomAPI] Đã thay đổi render period: ${period}`);
  }

  public initializeMyRoom(
    roomManifest: IAssetManifest_MyRoom | null,
    forRoomCoordi: boolean,
    onComplete: (() => void) | null = null
  ) {
    this._initializeMyRoom(roomManifest, forRoomCoordi, onComplete);
  }

  public clearMyRoom() {
    console.log("🧹 [MyRoomAPI] Clearing room");
    if (this._myRoomController) {
      this._myRoomController.dispose();
      this._myRoomController = null;
    }

    if (this._scene) {
      this._scene.meshes.forEach((mesh) => {
        if (!mesh.isDisposed()) {
          mesh.dispose();
        }
      });
    }
  }

  public finalize() {
    console.log("🏁 [MyRoomAPI] Finalizing");
    this.clearMyRoom();

    this._context = null;
    this._assetLoader = null;
  }

  private async _initializeMyRoom(
    roomManifest: IAssetManifest_MyRoom | null,
    forRoomCoordi: boolean,
    onComplete: (() => void) | null,
    serviceType?: string
  ) {
    const start = performance.now();
    console.warn("🚀 [MyRoom] Bắt đầu khởi tạo phòng...");

    // Clear any existing room
    this.clearMyRoom();

    if (!roomManifest) {
      console.warn("⚠️ [MyRoom] Không có manifest, khởi tạo phòng trống");
      if (onComplete) onComplete();
      return;
    }

    // Create a new room controller
    this._myRoomController = new MyRoomController(
      this._scene!,
      this._assetLoader!,
      this._context!
    );

    console.log(
      "🎨 [MyRoom] Khởi tạo backgroundColor:",
      roomManifest.main.room.backgroundColor
    );
    console.log("🧱 [MyRoom] RoomSkinId:", roomManifest.main.room.roomSkinId);
    console.log("📐 [MyRoom] Grids:", roomManifest.main.room.grids);
    console.log("🌳 [MyRoom] Environment:", roomManifest.main.environment);

    // Initialize the room model
    await this._myRoomController.initModel(
      roomManifest.main.room.backgroundColor,
      roomManifest.main.room.roomSkinId,
      roomManifest.main.room.grids,
      roomManifest.main.environment || "",
      true // playAnimation
    );

    // Place items if available
    if (roomManifest.main.items) {
      console.log(
        "🪑 [MyRoom] Có",
        roomManifest.main.items.length,
        "item(s) cần đặt trong phòng"
      );
      await this._myRoomController.placeItems(
        roomManifest.main.items,
        roomManifest.main.itemFunctionDatas,
        true // playAnimation
      );
      console.log("✅ [MyRoom] Đã hoàn tất đặt item");
    }

    // Place figures if available
    if (roomManifest.main.figures) {
      console.log(
        "👤 [MyRoom] Có",
        roomManifest.main.figures.length,
        "figure(s) cần đặt"
      );
      await this._myRoomController.placeFigures(
        roomManifest.main.figures,
        forRoomCoordi,
        true // playAnimation
      );
      console.log("✅ [MyRoom] Đã hoàn tất đặt figure");
    }

    const end = performance.now();
    console.warn(
      `⏱️ [MyRoom] Tổng thời gian khởi tạo: ${(end - start).toFixed(2)} ms.`
    );

    if (onComplete) onComplete();
  }
  public placeNewItem(params: {
    itemId: string;
    callback?: (instanceId: string) => void;
  }): void {
    if (!this._myRoomController) {
      console.error("❌ [MyRoomAPI] No room controller available");
      if (params.callback) params.callback("");
      return;
    }

    this._myRoomController.placeNewItem(params.itemId).then((instanceId) => {
      if (params.callback) params.callback(instanceId);
    });
  }

  public placeNewFigure(
    figureId: string,
    isAvatar: boolean,
    callback?: (id: string) => void
  ): void {
    if (!this._myRoomController) {
      console.error("❌ [MyRoomAPI] No room controller available");
      if (callback) callback("");
      return;
    }

    this._myRoomController.placeNewFigure(figureId, isAvatar).then((id) => {
      if (callback) callback(id);
    });
  }

  public getAllItemIds(callback: (ids: string[]) => void): void {
    if (!this._myRoomController) {
      console.error("❌ [MyRoomAPI] No room controller available");
      callback([]);
      return;
    }

    this._myRoomController.getAllItemIds(callback);
  }

  public getAllFigureIds(callback: (ids: string[]) => void): void {
    if (!this._myRoomController) {
      console.error("❌ [MyRoomAPI] No room controller available");
      callback([]);
      return;
    }

    this._myRoomController.getAllFigureIds(callback);
  }

  public removeItem(instanceId: string): void {
    if (!this._myRoomController) {
      console.error("❌ [MyRoomAPI] No room controller available");
      return;
    }

    this._myRoomController.removeItem(instanceId);
  }

  public removeFigure(figureId: string): void {
    if (!this._myRoomController) {
      console.error("❌ [MyRoomAPI] No room controller available");
      return;
    }

    this._myRoomController.removeFigure(figureId);
  }

  public rotateItem(instanceId: string, angle: number = Math.PI / 4): void {
    if (!this._myRoomController) {
      console.error("❌ [MyRoomAPI] No room controller available");
      return;
    }

    this._myRoomController.rotateItem(instanceId, angle);
  }

  public rotateFigure(figureId: string, angle: number = Math.PI / 4): void {
    if (!this._myRoomController) {
      console.error("❌ [MyRoomAPI] No room controller available");
      return;
    }

    this._myRoomController.rotateFigure(figureId, angle);
  }

  public moveItem(instanceId: string, x: number, y: number, z: number): void {
    if (!this._myRoomController) {
      console.error("❌ [MyRoomAPI] No room controller available");
      return;
    }

    this._myRoomController.moveItem(instanceId, new BABYLON.Vector3(x, y, z));
  }

  public moveFigure(figureId: string, x: number, y: number, z: number): void {
    if (!this._myRoomController) {
      console.error("❌ [MyRoomAPI] No room controller available");
      return;
    }

    this._myRoomController.moveFigure(figureId, new BABYLON.Vector3(x, y, z));
  }

  public createScreenShot(
    size: number,
    successCallback: (data: string) => void
  ): void {
    if (!this._scene) {
      console.error("No scene available for screenshot");
      return;
    }

    // Use BabylonJS Tools to create a screenshot
    BABYLON.Tools.CreateScreenshot(
      this._scene.getEngine(),
      this._scene.cameras[0],
      { width: size, height: size },
      successCallback
    );
  }

  // public get _scene(): BABYLON.Nullable<BABYLON.Scene> {
  //   return this._scene;
  // }
}
