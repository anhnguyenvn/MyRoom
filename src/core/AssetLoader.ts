import * as BABYLON from "@babylonjs/core";
import { MyRoomContext } from "./MyRoomContext";
import { MyRoomController } from "./MyRoomController";
import { IAssetManifest_MyRoom } from "../models/types";

export class AssetLoader {
  private _scene: BABYLON.Scene;
  private _context: MyRoomContext;

  constructor(context: MyRoomContext, scene: BABYLON.Scene) {
    this._context = context;
    this._scene = scene;
    console.log("📦 AssetLoader created");
  }

  public async loadAssetIntoScene(
    manifest: IAssetManifest_MyRoom
  ): Promise<void> {
    console.log("🔄 Loading assets into scene");

    const controller = new MyRoomController(this._scene, this._context);

    // Initialize room model
    await controller.initModel(
      manifest.main.room.backgroundColor,
      manifest.main.room.roomSkinId,
      manifest.main.room.grids,
      manifest.main.environment || ""
    );

    // Place items if available
    if (manifest.main.items) {
      await controller.placeItems(manifest.main.items);
    }

    // Place figures if available
    if (manifest.main.figures) {
      await controller.placeFigures(manifest.main.figures, false);
    }

    // Process item functions if available
    if (manifest.main.itemFunctionDatas) {
      manifest.main.itemFunctionDatas.forEach((data) => {
        controller.doItemFunction(data.instanceId, data);
      });
    }

    return Promise.resolve();
  }
}
