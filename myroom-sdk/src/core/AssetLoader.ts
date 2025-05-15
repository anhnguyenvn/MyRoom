import * as BABYLON from "@babylonjs/core";
import {
  AssetPackageFileLoader,
  IAssetPackageFileLoader,
} from "./AssetPackageFileLoader";
import { eAssetType } from "./AssetPackageInfoQuery";
import { MyRoomContext } from "./MyRoomContext";
import { IAssetManifest_MyRoom } from "../models/types";

interface IAssetLoadingContext {
  scene: BABYLON.Scene;
  parent?: BABYLON.Nullable<BABYLON.Node>;
}

export class AssetLoader {
  private _packageFileLoader: BABYLON.Nullable<IAssetPackageFileLoader> = null;
  private _scene: BABYLON.Nullable<BABYLON.Scene> = null;
  private _myRoomContext: MyRoomContext;

  constructor(
    roomContext: MyRoomContext,
    scene: BABYLON.Nullable<BABYLON.Scene> = null
  ) {
    this._myRoomContext = roomContext;
    this._scene = scene || BABYLON.EngineStore.LastCreatedScene;
    if (this._scene) {
      this._packageFileLoader = AssetPackageFileLoader.getInstance();
    }
  }

  public async loadGLBModel(
    itemId: string,
    parent?: BABYLON.Nullable<BABYLON.Node>
  ): Promise<BABYLON.Nullable<BABYLON.AssetContainer>> {
    if (!this._scene || !this._packageFileLoader) {
      console.error("Scene or PackageFileLoader is not initialized");
      return null;
    }

    try {
      // Load the GLB file from the asset server
      const objectUrl = await this._packageFileLoader.loadFile(
        eAssetType.Model_glb,
        itemId,
        `${itemId}.glb`
      );
      if (!objectUrl) {
        console.error(`Failed to load GLB model for item: ${itemId}`);
        return null;
      }

      // Load the GLB model into the scene
      const assetContainer = await BABYLON.SceneLoader.LoadAssetContainerAsync(
        "",
        objectUrl,
        this._scene
      );

      return assetContainer;
    } catch (error) {
      console.error(`Error loading GLB model for item: ${itemId}`, error);
      return null;
    }
  }

  public async loadRoomModel(
    roomSkinId: string
  ): Promise<BABYLON.Nullable<BABYLON.AbstractMesh>> {
    if (!this._scene || !this._packageFileLoader) {
      console.error("Scene or PackageFileLoader is not initialized");
      return null;
    }

    try {
      // Load the room model from the asset server
      const objectUrl = await this._packageFileLoader.loadFile(
        eAssetType.MyRoom,
        roomSkinId,
        `${roomSkinId}.glb`
      );
      if (!objectUrl) {
        console.error(`Failed to load room model: ${roomSkinId}`);
        return null;
      }

      // Load the room model into the scene
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        "",
        objectUrl,
        "",
        this._scene
      );

      if (result.meshes.length > 0) {
        return result.meshes[0];
      }

      return null;
    } catch (error) {
      console.error(`Error loading room model: ${roomSkinId}`, error);
      return null;
    }
  }

  public async loadAvatarModel(
    avatarId: string,
    parent?: BABYLON.Nullable<BABYLON.Node>
  ): Promise<BABYLON.Nullable<BABYLON.AbstractMesh>> {
    if (!this._scene || !this._packageFileLoader) {
      console.error("Scene or PackageFileLoader is not initialized");
      return null;
    }

    try {
      // Load the avatar model from the asset server
      const objectUrl = await this._packageFileLoader.loadFile(
        eAssetType.Avatar,
        avatarId,
        `${avatarId}.glb`
      );
      if (!objectUrl) {
        console.error(`Failed to load avatar model: ${avatarId}`);
        return null;
      }

      // Load the avatar model into the scene
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        "",
        objectUrl,
        "",
        this._scene
      );

      if (result.meshes.length > 0) {
        const rootMesh = result.meshes[0];
        if (parent) {
          rootMesh.parent = parent;
        }
        return rootMesh;
      }

      return null;
    } catch (error) {
      console.error(`Error loading avatar model: ${avatarId}`, error);
      return null;
    }
  }
}
