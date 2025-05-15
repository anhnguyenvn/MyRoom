import * as BABYLON from "@babylonjs/core";
import { MyRoomContext } from "./MyRoomContext";
import { AvatarController } from "./AvatarController";
import {
  IRoomGridInfo,
  IMyRoomItemPlacementInfo,
  IMyRoomFigurePlacementInfo,
  IMyRoomItemFunctionData,
} from "../models/types";
import { AssetLoader } from "./AssetLoader";

export class MyRoomController extends BABYLON.TransformNode {
  private _context: MyRoomContext;
  private _scene: BABYLON.Scene;
  private _roomNode: BABYLON.Nullable<BABYLON.Mesh> = null;
  private _placedItems: Map<string, BABYLON.Mesh> = new Map();
  private _placedFigures: Map<string, AvatarController> = new Map();
  private _assetLoader: AssetLoader;
  constructor(
    scene: BABYLON.Scene,
    assetLoader: AssetLoader,
    context: MyRoomContext
  ) {
    super("MyRoomController", scene);
    this._scene = scene;
    this._context = context;
    this._assetLoader = assetLoader;
    console.log("🏠 MyRoomController created");
  }

  public async initModel(
    backgroundColor: string,
    roomSkinId: string,
    grids: IRoomGridInfo[],
    environment: string,
    playAnimation: boolean = false
  ): Promise<void> {
    console.log(
      "🎨 Initializing room model with backgroundColor:",
      backgroundColor
    );
    console.log("🧱 Room skin ID:", roomSkinId);
    console.log("📐 Grids:", grids);
    console.log("🌳 Environment:", environment);

    // Try to load the room model from the asset server
    const roomMesh = await this._assetLoader.loadRoomModel(roomSkinId);

    // If loading from asset server fails, create a basic room
    if (!roomMesh) {
      console.log(
        "⚠️ Could not load room model from asset server, creating basic room"
      );
      this._createBasicRoom(backgroundColor);
    } else {
      // Apply background color to the room
      const roomMaterial = new BABYLON.StandardMaterial(
        "roomMaterial",
        this._scene
      );
      roomMaterial.diffuseColor = BABYLON.Color3.FromHexString(backgroundColor);

      // Apply material to the room mesh if it doesn't have one
      if (!roomMesh.material) {
        roomMesh.material = roomMaterial;
      }

      this._roomNode = roomMesh as BABYLON.Mesh;
    }

    return Promise.resolve();
  }

  private _createBasicRoom(backgroundColor: string): void {
    // Create a simple floor
    const floor = BABYLON.MeshBuilder.CreateGround(
      "floor",
      { width: 10, height: 10 },
      this._scene
    );
    const floorMaterial = new BABYLON.StandardMaterial(
      "floorMaterial",
      this._scene
    );
    floorMaterial.diffuseColor = BABYLON.Color3.FromHexString(backgroundColor);
    floor.material = floorMaterial;

    // Create walls
    const wall1 = BABYLON.MeshBuilder.CreateBox(
      "wall1",
      { width: 10, height: 3, depth: 0.1 },
      this._scene
    );
    wall1.position = new BABYLON.Vector3(0, 1.5, -5);

    const wall2 = BABYLON.MeshBuilder.CreateBox(
      "wall2",
      { width: 10, height: 3, depth: 0.1 },
      this._scene
    );
    wall2.position = new BABYLON.Vector3(0, 1.5, 5);

    const wall3 = BABYLON.MeshBuilder.CreateBox(
      "wall3",
      { width: 0.1, height: 3, depth: 10 },
      this._scene
    );
    wall3.position = new BABYLON.Vector3(-5, 1.5, 0);

    const wall4 = BABYLON.MeshBuilder.CreateBox(
      "wall4",
      { width: 0.1, height: 3, depth: 10 },
      this._scene
    );
    wall4.position = new BABYLON.Vector3(5, 1.5, 0);

    const wallMaterial = new BABYLON.StandardMaterial(
      "wallMaterial",
      this._scene
    );
    wallMaterial.diffuseColor = BABYLON.Color3.FromHexString("#FFFFFF");

    wall1.material = wallMaterial;
    wall2.material = wallMaterial;
    wall3.material = wallMaterial;
    wall4.material = wallMaterial;

    // Group all room elements
    this._roomNode = floor;
  }

  public async placeItems(
    items: IMyRoomItemPlacementInfo[],
    functionDatas?: IMyRoomItemFunctionData[],
    playAnimation: boolean = false
  ): Promise<void> {
    console.log("🪑 Placing items:", items.length);

    // In a real implementation, this would load and place actual items
    // For our simplified version, we'll create basic shapes for items
    items.forEach((item) => {
      this._createBasicItem(item);
    });

    return Promise.resolve();
  }

  // Update the _createBasicItem method to use AssetLoader
  private async _createBasicItem(
    item: IMyRoomItemPlacementInfo
  ): Promise<void> {
    // Try to load the item model from the asset server
    const itemMesh = await this._assetLoader.loadGLBModel(item.itemId);

    if (itemMesh) {
      // Add the item to the scene
      const instances = itemMesh.instantiateModelsToScene();

      if (instances.rootNodes.length > 0) {
        const rootNode = instances.rootNodes[0];

        // Apply transform
        rootNode.position = new BABYLON.Vector3(
          item.transform.position.x,
          item.transform.position.y,
          item.transform.position.z
        );

        rootNode.rotation = new BABYLON.Vector3(
          item.transform.rotation.x,
          item.transform.rotation.y,
          item.transform.rotation.z
        );

        rootNode.scaling = new BABYLON.Vector3(
          item.transform.scale.x,
          item.transform.scale.y,
          item.transform.scale.z
        );

        // Store the item
        this._placedItems.set(item.id, rootNode as BABYLON.Mesh);
      }
    } else {
      // Fallback to creating a basic box
      console.log(
        "⚠️ Could not load item model from asset server, creating basic box"
      );

      // Create a simple box to represent an item
      const itemMesh = BABYLON.MeshBuilder.CreateBox(
        item.id,
        { size: 0.5 },
        this._scene
      );

      // Apply transform
      itemMesh.position = new BABYLON.Vector3(
        item.transform.position.x,
        item.transform.position.y + 0.25, // Lift it slightly above the floor
        item.transform.position.z
      );

      itemMesh.rotation = new BABYLON.Vector3(
        item.transform.rotation.x,
        item.transform.rotation.y,
        item.transform.rotation.z
      );

      itemMesh.scaling = new BABYLON.Vector3(
        item.transform.scale.x,
        item.transform.scale.y,
        item.transform.scale.z
      );

      // Add a material with a random color
      const itemMaterial = new BABYLON.StandardMaterial(
        `material_${item.id}`,
        this._scene
      );
      itemMaterial.diffuseColor = new BABYLON.Color3(
        Math.random(),
        Math.random(),
        Math.random()
      );
      itemMesh.material = itemMaterial;

      // Store the item
      this._placedItems.set(item.id, itemMesh);
    }
  }

  public async placeFigures(
    figures: IMyRoomFigurePlacementInfo[],
    forRoomCoordi: boolean,
    playAnimation: boolean = false
  ): Promise<void> {
    console.log("👤 Placing figures:", figures.length);

    // In a real implementation, this would load and place actual figures/avatars
    // For our simplified version, we'll create basic shapes for figures
    figures.forEach((figure) => {
      this._createBasicFigure(figure);
    });

    return Promise.resolve();
  }

  private async _createBasicFigure(
    figure: IMyRoomFigurePlacementInfo
  ): Promise<void> {
    // Try to load the avatar model from the asset server
    const avatarMesh = await this._assetLoader.loadAvatarModel(figure.avatarId);

    if (avatarMesh) {
      // Apply transform if available
      if (figure.transform) {
        avatarMesh.position = new BABYLON.Vector3(
          figure.transform.position.x,
          figure.transform.position.y,
          figure.transform.position.z
        );

        avatarMesh.rotation = new BABYLON.Vector3(
          figure.transform.rotation.x,
          figure.transform.rotation.y,
          figure.transform.rotation.z
        );

        avatarMesh.scaling = new BABYLON.Vector3(
          figure.transform.scale.x,
          figure.transform.scale.y,
          figure.transform.scale.z
        );
      }

      // Create an AvatarController for this figure
      const avatarController = new AvatarController(
        figure.avatarId,
        this._scene,
        this._context
      );
      avatarController.setMesh(avatarMesh);

      if (!figure.isAvatar) {
        avatarController.markAsFigure();
      }

      // Store the figure
      this._placedFigures.set(figure.id || figure.avatarId, avatarController);
    } else {
      // Fallback to creating a basic figure
      console.log(
        "⚠️ Could not load avatar model from asset server, creating basic figure"
      );

      // Create a simple cylinder to represent a figure/avatar
      const figureMesh = BABYLON.MeshBuilder.CreateCylinder(
        figure.id || `figure_${Math.random().toString(36).substr(2, 9)}`,
        { height: 1.7, diameterTop: 0.2, diameterBottom: 0.5 },
        this._scene
      );

      // Apply transform if available
      if (figure.transform) {
        figureMesh.position = new BABYLON.Vector3(
          figure.transform.position.x,
          figure.transform.position.y + 0.85, // Half height to place on floor
          figure.transform.position.z
        );

        figureMesh.rotation = new BABYLON.Vector3(
          figure.transform.rotation.x,
          figure.transform.rotation.y,
          figure.transform.rotation.z
        );

        figureMesh.scaling = new BABYLON.Vector3(
          figure.transform.scale.x,
          figure.transform.scale.y,
          figure.transform.scale.z
        );
      } else {
        // Default position if no transform provided
        figureMesh.position = new BABYLON.Vector3(0, 0.85, 0);
      }

      // Add a material with a skin-like color
      const figureMaterial = new BABYLON.StandardMaterial(
        `material_${figure.id}`,
        this._scene
      );
      figureMaterial.diffuseColor = BABYLON.Color3.FromHexString("#FFD0B5");
      figureMesh.material = figureMaterial;

      // Create an AvatarController for this figure
      const avatarController = new AvatarController(
        figure.avatarId,
        this._scene,
        this._context
      );
      avatarController.setMesh(figureMesh);

      if (!figure.isAvatar) {
        avatarController.markAsFigure();
      }

      // Store the figure
      this._placedFigures.set(figure.id || figure.avatarId, avatarController);
    }
  }

  public doItemFunction(
    instanceId: string,
    functionData: IMyRoomItemFunctionData
  ): void {
    console.log("⚙️ Executing function for item:", instanceId, functionData);
    // In a real implementation, this would execute specific functions for items
  }

  public async placeNewItem(itemId: string): Promise<string> {
    console.log(`🪑 Placing new item: ${itemId}`);

    // Generate a unique instance ID
    const instanceId = `item_${itemId}_${Date.now()}`;

    // Create a simple item (box)
    const itemMesh = BABYLON.MeshBuilder.CreateBox(
      instanceId,
      { size: 1 },
      this._scene
    );

    // Position the item at a random location on the floor
    itemMesh.position = new BABYLON.Vector3(
      (Math.random() - 0.5) * 8,
      0.5, // Half height above the floor
      (Math.random() - 0.5) * 8
    );

    // Apply material
    const itemMaterial = new BABYLON.StandardMaterial(
      `material_${instanceId}`,
      this._scene
    );
    itemMaterial.diffuseColor = new BABYLON.Color3(
      Math.random(),
      Math.random(),
      Math.random()
    );
    itemMesh.material = itemMaterial;

    // Store the item
    this._placedItems.set(instanceId, itemMesh);

    console.log(`✅ Item placed with instance ID: ${instanceId}`);
    return instanceId;
  }

  public async placeNewFigure(
    figureId: string,
    isAvatar: boolean
  ): Promise<string> {
    console.log(`👤 Placing new figure: ${figureId}, isAvatar: ${isAvatar}`);

    // Create avatar controller
    const avatarController = new AvatarController(
      figureId,
      this._scene,
      this._context
    );

    // Mark as figure if not an avatar
    if (!isAvatar) {
      avatarController.markAsFigure();
    }

    // Position the figure at a random location on the floor
    avatarController.position = new BABYLON.Vector3(
      (Math.random() - 0.5) * 8,
      0, // On the floor
      (Math.random() - 0.5) * 8
    );

    // Initialize the model
    await avatarController.initModel();

    // Store the figure
    this._placedFigures.set(figureId, avatarController);

    console.log(`✅ Figure placed with ID: ${figureId}`);
    return figureId;
  }

  public getAllItemIds(callback: (ids: string[]) => void): void {
    callback(Array.from(this._placedItems.keys()));
  }

  public getAllFigureIds(callback: (ids: string[]) => void): void {
    callback(Array.from(this._placedFigures.keys()));
  }

  public clearAllItems(): void {
    this._placedItems.forEach((mesh) => {
      mesh.dispose();
    });
    this._placedItems.clear();
  }

  public clearAllFigures(): void {
    this._placedFigures.forEach((controller) => {
      controller.dispose();
    });
    this._placedFigures.clear();
  }

  public removeItem(instanceId: string): void {
    const item = this._placedItems.get(instanceId);
    if (item) {
      console.log(`🗑️ Removing item: ${instanceId}`);
      item.dispose();
      this._placedItems.delete(instanceId);
    }
  }

  public removeFigure(figureId: string): void {
    const figure = this._placedFigures.get(figureId);
    if (figure) {
      console.log(`🗑️ Removing figure: ${figureId}`);
      figure.dispose();
      this._placedFigures.delete(figureId);
    }
  }

  public rotateItem(instanceId: string, angle: number = Math.PI / 4): void {
    const item = this._placedItems.get(instanceId);
    if (item) {
      console.log(`🔄 Rotating item: ${instanceId}`);
      item.rotation.y += angle;
    }
  }

  public rotateFigure(figureId: string, angle: number = Math.PI / 4): void {
    const figure = this._placedFigures.get(figureId);
    if (figure) {
      console.log(`🔄 Rotating figure: ${figureId}`);
      figure.rotation.y += angle;
    }
  }

  public moveItem(instanceId: string, position: BABYLON.Vector3): void {
    const item = this._placedItems.get(instanceId);
    if (item) {
      console.log(`🚚 Moving item: ${instanceId}`);
      item.position = position;
    }
  }

  public moveFigure(figureId: string, position: BABYLON.Vector3): void {
    const figure = this._placedFigures.get(figureId);
    if (figure) {
      console.log(`🚶 Moving figure: ${figureId}`);
      figure.position = position;
    }
  }
}
