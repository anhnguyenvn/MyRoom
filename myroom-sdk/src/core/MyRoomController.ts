// src/core/MyRoomController.ts
import * as BABYLON from "@babylonjs/core";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { MyRoomContext } from "./MyRoomContext";
import {
  IMyRoomItemPlacementInfo,
  IMyRoomFigurePlacementInfo,
  IRoomGridInfo,
  IMyRoomItemFunctionData,
  ITransform,
} from "../models/types";
import { ItemDataManager } from "./ItemDataManager"; // Đảm bảo import đúng
import { IItemDefinition } from "../models/itemDataTypes"; // Đảm bảo import đúng

export class MyRoomController extends BABYLON.TransformNode {
  private _myRoomScene: BABYLON.Scene;
  private _context: MyRoomContext;
  private _itemDataManager: ItemDataManager;

  // SỬA LỖI 2: Thay đổi kiểu thành TransformNode
  private _placedItems: Map<string, BABYLON.TransformNode> = new Map();
  private _placedFigures: Map<string, BABYLON.TransformNode> = new Map();

  private _roomRootNode: BABYLON.Nullable<BABYLON.TransformNode> = null;
  private _isRoomSkinModelLoaded: boolean = false;
  private _roomLoadErrorOccurred: boolean = false;

  constructor(
    scene: BABYLON.Scene,
    context: MyRoomContext,
    itemDataManager: ItemDataManager
  ) {
    super("MyRoomController_RootNode", scene); // Đổi tên node để dễ nhận biết hơn
    this._myRoomScene = scene;
    this._context = context;
    this._itemDataManager = itemDataManager;

    this._roomRootNode = new BABYLON.TransformNode(
      "FullRoomContentRootNode",
      this._myRoomScene
    );
    this._roomRootNode.parent = this; // Gắn node quản lý nội dung phòng vào node chính của controller

    console.log(
      "🏠 MyRoomController created and initialized with ItemDataManager."
    );
  }

  public setRoomLoadErrorFlag(hasError: boolean): void {
    this._roomLoadErrorOccurred = hasError;
    if (hasError) {
      this._isRoomSkinModelLoaded = false;
    }
  }

  public setRoomMeshes(meshes: BABYLON.AbstractMesh[]): void {
    const oldSkin = this._myRoomScene.getTransformNodeByName(
      "importedRoomSkinNode"
    );
    oldSkin?.dispose(false, true);

    if (meshes && meshes.length > 0) {
      const skinRootNode = new BABYLON.TransformNode(
        "importedRoomSkinNode",
        this._myRoomScene
      );
      meshes.forEach((mesh) => {
        // Chỉ set parent nếu nó là root mesh thực sự của file GLB (chưa có parent)
        // Hoặc nếu file GLB chỉ có 1 mesh duy nhất và đó là root
        if (!mesh.parent && mesh !== skinRootNode) {
          mesh.setParent(skinRootNode);
        } else if (
          meshes.length === 1 &&
          mesh.parent === null &&
          mesh !== skinRootNode
        ) {
          mesh.setParent(skinRootNode);
        }
        // Nếu model đã có cấu trúc cha con phức tạp, mesh[0] thường là root của model đó,
        // và các mesh khác đã là con của nó. Không cần setParent lại cho các mesh con.
      });
      // Đảm bảo skinRootNode chứa các mesh chính, nếu meshes[0] là một node cha thực sự của model
      if (
        meshes.length > 0 &&
        meshes[0].parent === null &&
        meshes[0] !== skinRootNode
      ) {
        if (
          skinRootNode.getChildMeshes().length === 0 &&
          skinRootNode.getChildTransformNodes().length === 0
        ) {
          // Nếu skinRootNode rỗng và meshes[0] là root của model, gán meshes[0] làm con
          meshes[0].setParent(skinRootNode);
        }
      }

      skinRootNode.parent = this._roomRootNode;
      this._isRoomSkinModelLoaded = true;
      this._roomLoadErrorOccurred = false;
      console.log("🎨 Imported room skin has been set.");
    } else {
      this._isRoomSkinModelLoaded = false;
      console.warn(
        "⚠️ No meshes provided to setRoomMeshes, or meshes array was empty."
      );
    }
  }

  public async finalizeRoomSetup(
    backgroundColor: string,
    grids: IRoomGridInfo[],
    environmentItemId: string
  ): Promise<void> {
    if (this._roomLoadErrorOccurred || !this._isRoomSkinModelLoaded) {
      console.log(
        "[MyRoomController] No room skin model loaded or error, creating basic room."
      );
      this.initializeBasicRoom(backgroundColor, grids, environmentItemId); // Tạo phòng cơ bản
    }

    if (this._myRoomScene) {
      this._myRoomScene.clearColor =
        BABYLON.Color4.FromHexString(backgroundColor);
    }

    console.log(
      "📐 [MyRoomController] Room setup finalized. Background color set."
    );

    if (environmentItemId && this._itemDataManager.isDataLoaded()) {
      const envItemDef = this._itemDataManager.getItemById(environmentItemId);
      if (envItemDef && envItemDef.client_itemid) {
        const envCat3 = this._itemDataManager.getCategory3ById(
          envItemDef.category3
        );
        if (envCat3 && envCat3.SvnFolder && envCat3.ManifestType === 0) {
          const envModelPath =
            this._itemDataManager.getItemModelPath(environmentItemId); // Dùng hàm này để lấy đường dẫn đã xử lý
          if (envModelPath) {
            const envUrl = `/models/${envModelPath}`; // Giả sử ASSET_BASE_URL là /models/
            console.log(
              `[MyRoomController] Attempting to load environment: ${envUrl}`
            );
            try {
              const environmentTexture = new BABYLON.CubeTexture(
                envUrl,
                this._myRoomScene
              );
              this._myRoomScene.environmentTexture = environmentTexture;
              console.log(
                `[MyRoomController] Environment texture set from ${envUrl}`
              );
            } catch (e) {
              console.error(
                `[MyRoomController] Failed to load environment texture ${envUrl}:`,
                e
              );
            }
          }
        }
      }
    }
    // TODO: Implement grid logic based on `grids` and room meshes
  }

  public initializeBasicRoom(
    backgroundColor: string,
    grids: IRoomGridInfo[],
    environmentItemId: string
  ): void {
    const existingBasicRoom =
      this._myRoomScene.getTransformNodeByName("basicRoomRootNode");
    existingBasicRoom?.dispose(false, true);

    const basicRoomRoot = new BABYLON.TransformNode(
      "basicRoomRootNode",
      this._myRoomScene
    );
    const floor = BABYLON.MeshBuilder.CreateGround(
      "basic_floor",
      { width: 20, height: 20 },
      this._myRoomScene
    );
    const floorMaterial = new BABYLON.StandardMaterial(
      "floorMatBasic",
      this._myRoomScene
    );
    floorMaterial.diffuseColor = BABYLON.Color3.FromHexString("#A0A0A0");
    floor.material = floorMaterial;
    floor.parent = basicRoomRoot;

    const wallMat = new BABYLON.StandardMaterial(
      "wallMatBasic",
      this._myRoomScene
    );
    wallMat.diffuseColor = BABYLON.Color3.FromHexString("#C0C0C0");

    const wallN = BABYLON.MeshBuilder.CreateBox(
      "wallN",
      { width: 20, height: 6, depth: 0.2 },
      this._myRoomScene
    );
    wallN.position = new BABYLON.Vector3(0, 3, 10);
    wallN.material = wallMat;
    wallN.parent = basicRoomRoot;
    const wallS = BABYLON.MeshBuilder.CreateBox(
      "wallS",
      { width: 20, height: 6, depth: 0.2 },
      this._myRoomScene
    );
    wallS.position = new BABYLON.Vector3(0, 3, -10);
    wallS.material = wallMat;
    wallS.parent = basicRoomRoot;
    const wallE = BABYLON.MeshBuilder.CreateBox(
      "wallE",
      { width: 0.2, height: 6, depth: 20 },
      this._myRoomScene
    );
    wallE.position = new BABYLON.Vector3(10, 3, 0);
    wallE.material = wallMat;
    wallE.parent = basicRoomRoot;
    const wallW = BABYLON.MeshBuilder.CreateBox(
      "wallW",
      { width: 0.2, height: 6, depth: 20 },
      this._myRoomScene
    );
    wallW.position = new BABYLON.Vector3(-10, 3, 0);
    wallW.material = wallMat;
    wallW.parent = basicRoomRoot;

    basicRoomRoot.parent = this._roomRootNode;
    this._isRoomSkinModelLoaded = false;
    console.log("🧱 [MyRoomController] Basic room created.");
  }

  public async placeImportedItems(
    itemsToPlace: {
      itemData: IMyRoomItemPlacementInfo;
      meshes: BABYLON.AbstractMesh[];
    }[]
  ): Promise<void> {
    console.log(
      "🪑 [MyRoomController] Processing imported items:",
      itemsToPlace.length
    );
    for (const { itemData, meshes } of itemsToPlace) {
      const itemDefinition = this._itemDataManager.getItemById(itemData.itemId);
      if (!itemDefinition) {
        console.warn(
          `[MyRoomController] Item definition not found for ${itemData.itemId}, cannot place.`
        );
        continue;
      }

      if (meshes && meshes.length > 0) {
        const rootNode = new BABYLON.TransformNode(
          `item_root_${itemData.id}`,
          this._myRoomScene
        );
        rootNode.name = itemData.id;

        meshes.forEach((mesh) => {
          if (!mesh.parent && mesh !== rootNode) mesh.setParent(rootNode);
          else if (
            meshes.length === 1 &&
            mesh.parent === null &&
            mesh !== rootNode
          )
            mesh.setParent(rootNode);
        });
        // Nếu mesh[0] là root của model và chưa có parent, nó sẽ được gán vào rootNode ở trên.
        // Nếu model đã có cấu trúc, không cần làm gì thêm với các mesh con.

        this._applyTransform(rootNode, itemData.transform, itemDefinition);
        this._configureItemProperties(rootNode, itemDefinition);
        rootNode.parent = this._roomRootNode;
        this._placedItems.set(itemData.id, rootNode);
      } else {
        console.warn(
          `⚠️ [MyRoomController] No meshes for item: ${itemData.itemId} (ID: ${itemData.id}). Creating placeholder.`
        );
        const placeholder = this._createBasicPlaceholderItem(
          itemData,
          `placeholder_${itemData.id}`
        );
        placeholder.parent = this._roomRootNode;
        this._placedItems.set(itemData.id, placeholder); // placeholder là Mesh, cũng là TransformNode
      }
    }
    console.log(
      `[MyRoomController] Finished placing ${this._placedItems.size} items.`
    );
  }

  public async placeImportedFigures(
    figuresToPlace: {
      figureData: IMyRoomFigurePlacementInfo;
      meshes: BABYLON.AbstractMesh[];
    }[],
    forRoomCoordi: boolean
  ): Promise<void> {
    console.log(
      "👤 [MyRoomController] Processing imported figures:",
      figuresToPlace.length
    );
    for (const { figureData, meshes } of figuresToPlace) {
      const figureDefinition = this._itemDataManager.getItemById(
        figureData.avatarId
      );
      if (!figureDefinition) {
        console.warn(
          `[MyRoomController] Figure definition not found for ${figureData.avatarId}, cannot place.`
        );
        continue;
      }
      const figureInstanceId =
        figureData.id || `${figureData.avatarId}_${Date.now()}`;

      if (meshes && meshes.length > 0) {
        const rootNode = new BABYLON.TransformNode(
          `figure_root_${figureInstanceId}`,
          this._myRoomScene
        );
        rootNode.name = figureInstanceId;
        meshes.forEach((mesh) => {
          if (!mesh.parent && mesh !== rootNode) mesh.setParent(rootNode);
          else if (
            meshes.length === 1 &&
            mesh.parent === null &&
            mesh !== rootNode
          )
            mesh.setParent(rootNode);
        });

        if (figureData.transform) {
          this._applyTransform(
            rootNode,
            figureData.transform,
            figureDefinition
          );
        } else {
          rootNode.position = new BABYLON.Vector3(
            Math.random() * 2 - 1,
            0,
            Math.random() * 2 - 1
          );
        }
        if (figureData.isAvatar === false) {
          rootNode.scaling = rootNode.scaling.multiplyByFloats(0.7, 0.7, 0.7);
        }
        this._configureItemProperties(rootNode, figureDefinition);
        rootNode.parent = this._roomRootNode;
        this._placedFigures.set(figureInstanceId, rootNode);
      } else {
        console.warn(
          `⚠️ [MyRoomController] No meshes for figure: ${figureData.avatarId}.`
        );
        // TODO: Create placeholder for figure if needed
      }
    }
    console.log(
      `[MyRoomController] Finished placing ${this._placedFigures.size} figures.`
    );
  }

  private _applyTransform(
    node: BABYLON.TransformNode,
    transform: ITransform,
    itemDef?: IItemDefinition
  ) {
    let finalY = transform.position.y;
    // Logic điều chỉnh Y để item nằm trên sàn có thể phức tạp hơn,
    // cần bounding box của model sau khi tải. Tạm thời giữ nguyên Y từ transform.
    // if (itemDef && itemDef.placement_attach_type === 1) { // 1: FLOOR_ITEM
    //    // Example: if model origin is at its center bottom
    //    // finalY = transform.position.y; // or if model origin is at geometric center:
    //    // node.computeWorldMatrix(true); // force computation
    //    // const boundingInfo = node.getHierarchyBoundingVectors(true);
    //    // finalY = transform.position.y - boundingInfo.min.y;
    // }

    node.position = new BABYLON.Vector3(
      transform.position.x,
      finalY,
      transform.position.z
    );
    node.rotationQuaternion = null;
    node.rotation = new BABYLON.Vector3(
      BABYLON.Tools.ToRadians(transform.rotation.x),
      BABYLON.Tools.ToRadians(transform.rotation.y),
      BABYLON.Tools.ToRadians(transform.rotation.z)
    );
    node.scaling = new BABYLON.Vector3(
      transform.scale.x,
      transform.scale.y,
      transform.scale.z
    );
  }

  private _configureItemProperties(
    node: BABYLON.TransformNode,
    itemDef: IItemDefinition
  ) {
    node.metadata = node.metadata || {};
    node.metadata.itemDefinitionId = itemDef.ID;
    node.metadata.itemDefinition = itemDef; // Lưu toàn bộ item definition vào metadata của node
    // console.log(`[MyRoomController] Configured metadata for ${itemDef.title} on node ${node.name}`);

    // TODO: Implement specific logic based on itemDef.placement_attach_type, sw, sh, useGrids
    // For example, if it's a WALL item, ensure it's near a wall or attach it.
    // If it's STACKABLE, allow other items on top.
  }

  public async loadAndPlaceNewItemGLB(
    itemIdFromJson: string,
    modelUrl: string,
    initialTransform?: ITransform
  ): Promise<string> {
    const itemDefinition = this._itemDataManager.getItemById(itemIdFromJson);
    if (!itemDefinition) {
      console.error(
        `[MyRoomController] Cannot place new item: Definition for ${itemIdFromJson} not found.`
      );
      return "";
    }

    const instanceId = `item_${itemDefinition.ID}_${Date.now()}`;
    console.log(
      `[MyRoomController] Attempting to load new item GLB: ${itemDefinition.title} from ${modelUrl}`
    );
    try {
      const importResult = await SceneLoader.ImportMeshAsync(
        null,
        modelUrl.substring(0, modelUrl.lastIndexOf("/") + 1), // rootUrl
        modelUrl.substring(modelUrl.lastIndexOf("/") + 1), // sceneFilename
        this._myRoomScene
      );

      if (importResult.meshes && importResult.meshes.length > 0) {
        const rootNode = new BABYLON.TransformNode(
          `item_root_${instanceId}`,
          this._myRoomScene
        );
        rootNode.name = instanceId;
        importResult.meshes.forEach((mesh) => {
          if (!mesh.parent && mesh !== rootNode) mesh.setParent(rootNode);
          else if (
            importResult.meshes.length === 1 &&
            mesh.parent === null &&
            mesh !== rootNode
          )
            mesh.setParent(rootNode);
        });

        const defaultTransform: ITransform = {
          position: {
            x: (Math.random() - 0.5) * 4,
            y: 0,
            z: (Math.random() - 0.5) * 4,
          },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        };
        const t = initialTransform || defaultTransform;
        this._applyTransform(rootNode, t, itemDefinition);
        this._configureItemProperties(rootNode, itemDefinition);
        rootNode.parent = this._roomRootNode;
        this._placedItems.set(instanceId, rootNode);
        console.log(
          `✅ [MyRoomController] New item GLB placed: ${instanceId} (${itemDefinition.title})`
        );
        return instanceId;
      } else {
        console.warn(
          `⚠️ [MyRoomController] No meshes found in GLB for new item: ${itemDefinition.title}`
        );
        return "";
      }
    } catch (error) {
      console.error(
        `❌ [MyRoomController] Error loading new item GLB ${itemDefinition.title}:`,
        error
      );
      const placeholderTransform = initialTransform || {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      };
      const placeholderItemData: IMyRoomItemPlacementInfo = {
        id: instanceId,
        itemId: itemIdFromJson,
        transform: placeholderTransform,
        order: 0,
      };
      const placeholder = this._createBasicPlaceholderItem(
        placeholderItemData,
        `error_placeholder_${instanceId}`
      );
      placeholder.parent = this._roomRootNode;
      this._placedItems.set(instanceId, placeholder);
      return instanceId;
    }
  }

  public async loadAndPlaceNewFigureGLB(
    figureItemId: string,
    modelUrl: string,
    isAvatar: boolean,
    initialTransform?: ITransform
  ): Promise<string> {
    const figureDefinition = this._itemDataManager.getItemById(figureItemId);
    if (!figureDefinition) {
      console.error(
        `[MyRoomController] Cannot place new figure: Definition for ${figureItemId} not found.`
      );
      return "";
    }
    const instanceId = `figure_${figureDefinition.ID}_${Date.now()}`;
    console.log(
      `[MyRoomController] Attempting to load new figure GLB: ${figureDefinition.title} from ${modelUrl}`
    );
    try {
      const importResult = await SceneLoader.ImportMeshAsync(
        null,
        modelUrl.substring(0, modelUrl.lastIndexOf("/") + 1),
        modelUrl.substring(modelUrl.lastIndexOf("/") + 1),
        this._myRoomScene
      );
      if (importResult.meshes && importResult.meshes.length > 0) {
        const rootNode = new BABYLON.TransformNode(
          `figure_root_${instanceId}`,
          this._myRoomScene
        );
        rootNode.name = instanceId;
        importResult.meshes.forEach((mesh) => {
          if (!mesh.parent && mesh !== rootNode) mesh.setParent(rootNode);
          else if (
            importResult.meshes.length === 1 &&
            mesh.parent === null &&
            mesh !== rootNode
          )
            mesh.setParent(rootNode);
        });

        const defaultTransform: ITransform = {
          position: {
            x: (Math.random() - 0.5) * 2,
            y: 0,
            z: (Math.random() - 0.5) * 2,
          },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        };
        const t = initialTransform || defaultTransform;
        this._applyTransform(rootNode, t, figureDefinition);
        if (!isAvatar) {
          rootNode.scaling = rootNode.scaling.multiplyByFloats(0.7, 0.7, 0.7);
        }
        this._configureItemProperties(rootNode, figureDefinition);
        rootNode.parent = this._roomRootNode;
        this._placedFigures.set(instanceId, rootNode);
        console.log(
          `✅ [MyRoomController] New figure GLB placed: ${instanceId} (${figureDefinition.title})`
        );
        return instanceId;
      } else {
        console.warn(
          `⚠️ [MyRoomController] No meshes found for new figure GLB: ${figureDefinition.title}`
        );
        return "";
      }
    } catch (error) {
      console.error(
        `❌ [MyRoomController] Error loading new figure GLB ${figureDefinition.title}:`,
        error
      );
      return "";
    }
  }

  private _createBasicPlaceholderItem(
    itemData: IMyRoomItemPlacementInfo,
    name: string
  ): BABYLON.Mesh {
    const itemMesh = BABYLON.MeshBuilder.CreateBox(
      name,
      { size: 0.5 },
      this._myRoomScene
    ); // Giữ size cố định cho placeholder
    const itemDef = this._itemDataManager.getItemById(itemData.itemId); // Lấy itemDef để dùng trong _applyTransform
    this._applyTransform(itemMesh, itemData.transform, itemDef); // itemMesh là AbstractMesh, nhưng cũng là TransformNode

    const placeholderMaterial = new BABYLON.StandardMaterial(
      `material_placeholder_${itemData.id}`,
      this._myRoomScene
    );
    placeholderMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.3); // Vàng
    placeholderMaterial.alpha = 0.7;
    itemMesh.material = placeholderMaterial;
    return itemMesh;
  }

  public doItemFunction(
    instanceId: string,
    functionDataInput?: IMyRoomItemFunctionData
  ): void {
    const itemNode =
      this._placedItems.get(instanceId) || this._placedFigures.get(instanceId);
    if (
      !itemNode ||
      !itemNode.metadata ||
      !itemNode.metadata.itemDefinitionId
    ) {
      console.warn(
        `[MyRoomController] Item/Figure instance ${instanceId} not found or missing definition for doItemFunction.`
      );
      return;
    }
    const itemDef = this._itemDataManager.getItemById(
      itemNode.metadata.itemDefinitionId
    );
    if (!itemDef) {
      console.warn(
        `[MyRoomController] Item definition ${itemNode.metadata.itemDefinitionId} not found for doItemFunction.`
      );
      return;
    }

    console.log(
      `⚙️ [MyRoomController] Executing function for: ${itemDef.title} (Instance: ${instanceId}), Function Code: ${itemDef.funtion}`
    );

    switch (itemDef.funtion) {
      case 1: // Mở link
        if (itemDef.link_address) {
          console.log(`Opening link: ${itemDef.link_address}`);
          window.open(itemDef.link_address, "_blank");
        } else {
          console.warn("Function type 1 (Link) but link_address is empty.");
        }
        break;
      case 3:
      case 6: // TV (Vertical/Horizontal)
        if (
          itemDef.funtion_address &&
          itemNode instanceof BABYLON.TransformNode
        ) {
          console.log(`Playing video: ${itemDef.funtion_address}`);
          const screenMeshes = itemNode.getChildMeshes(false, (node) =>
            node.name.toLowerCase().includes("screen")
          );
          if (
            screenMeshes.length > 0 &&
            screenMeshes[0] instanceof BABYLON.Mesh
          ) {
            const screenMesh = screenMeshes[0] as BABYLON.Mesh;
            try {
              const videoTexture = new BABYLON.VideoTexture(
                `video_${instanceId}`,
                itemDef.funtion_address,
                this._myRoomScene,
                true,
                true
              );
              const videoMaterial = new BABYLON.StandardMaterial(
                `mat_video_${instanceId}`,
                this._myRoomScene
              );
              videoMaterial.diffuseTexture = videoTexture;
              videoMaterial.emissiveColor = new BABYLON.Color3(0.7, 0.7, 0.7); // Tăng độ sáng để video rõ hơn
              videoMaterial.roughness = 1.0; // Giảm độ bóng
              screenMesh.material = videoMaterial;
              videoTexture.video
                .play()
                .catch((e) =>
                  console.warn(
                    "Video play failed, user interaction might be required.",
                    e
                  )
                );
              console.log("Video texture applied.");
            } catch (e) {
              console.error("Error creating video texture: ", e);
            }
          } else {
            console.warn(
              "Screen mesh not found in TV model or itemNode is not a TransformNode."
            );
          }
        } else {
          console.warn("Function type 3/6 (TV) but funtion_address is empty.");
        }
        break;
      // TODO: Implement other function types (4: PlaceOnTop, 5: PictureFrame, 10: YoutubeLink, 11: NPC_Chat)
      case 11: // NPC Chat
        if (itemDef.funtion_address) {
          try {
            const chatSequences = JSON.parse(itemDef.funtion_address);
            // TODO: Logic hiển thị chatSequences (có thể là bong bóng chat 3D hoặc UI)
            console.log("NPC Chat sequences:", chatSequences);
            alert(
              `NPC Says (first message): ${chatSequences[0]?.chatImg || "..."}`
            );
          } catch (e) {
            console.error("Error parsing NPC chat function_address:", e);
          }
        }
        break;
      default:
        console.log(
          `Function type ${itemDef.funtion} for item ${itemDef.title} not implemented yet.`
        );
    }
  }

  public disposeAllRoomContents(): void {
    console.log("🧹 [MyRoomController] Disposing all current room contents...");
    this.clearAllItems();
    this.clearAllFigures();

    const importedSkinNode = this._myRoomScene.getTransformNodeByName(
      "importedRoomSkinNode"
    );
    importedSkinNode?.dispose(false, true);
    const basicRoomNode =
      this._myRoomScene.getTransformNodeByName("basicRoomRootNode");
    basicRoomNode?.dispose(false, true);

    this._isRoomSkinModelLoaded = false;
    this._roomLoadErrorOccurred = false;
  }

  public dispose(): void {
    console.log("🏠 [MyRoomController] Disposing MyRoomController instance...");
    this.disposeAllRoomContents();
    if (this._roomRootNode) {
      this._roomRootNode.dispose(false, true);
      this._roomRootNode = null;
    }
    // this._itemDataManager is managed externally, no need to dispose here
    super.dispose(); // Call dispose of the parent TransformNode
    console.log("🏠 [MyRoomController] MyRoomController fully disposed.");
  }

  public getAllItemIds(callback: (ids: string[]) => void): void {
    callback(Array.from(this._placedItems.keys()));
  }
  public getAllFigureIds(callback: (ids: string[]) => void): void {
    callback(Array.from(this._placedFigures.keys()));
  }

  public removeItem(instanceId: string): void {
    const item = this._placedItems.get(instanceId);
    if (item) {
      console.log(`[MyRoomController] Removing item: ${instanceId}`);
      item.dispose(false, true); // Dispose children and materials
      this._placedItems.delete(instanceId);
    } else {
      console.warn(
        `[MyRoomController] Item to remove not found: ${instanceId}`
      );
    }
  }
  public removeFigure(instanceId: string): void {
    const figure = this._placedFigures.get(instanceId);
    if (figure) {
      console.log(`[MyRoomController] Removing figure: ${instanceId}`);
      figure.dispose(false, true);
      this._placedFigures.delete(instanceId);
    } else {
      console.warn(
        `[MyRoomController] Figure to remove not found: ${instanceId}`
      );
    }
  }

  public rotateItem(instanceId: string, angle: number = Math.PI / 4): void {
    const item = this._placedItems.get(instanceId);
    if (item) {
      item.rotation.y += angle;
    }
  }
  public rotateFigure(instanceId: string, angle: number = Math.PI / 4): void {
    const figure = this._placedFigures.get(instanceId);
    if (figure) {
      figure.rotation.y += angle;
    }
  }

  public moveItem(instanceId: string, position: BABYLON.Vector3): void {
    const item = this._placedItems.get(instanceId);
    if (item) {
      item.position = position;
    }
  }
  public moveFigure(instanceId: string, position: BABYLON.Vector3): void {
    const figure = this._placedFigures.get(instanceId);
    if (figure) {
      figure.position = position;
    }
  }

  private clearAllItems(): void {
    this._placedItems.forEach((node) => {
      node.dispose(false, true);
    });
    this._placedItems.clear();
  }
  private clearAllFigures(): void {
    this._placedFigures.forEach((node) => {
      node.dispose(false, true);
    });
    this._placedFigures.clear();
  }
}
