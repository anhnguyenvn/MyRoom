import * as BABYLON from "@babylonjs/core";
import { MyRoomContext } from "./MyRoomContext";

export class AvatarController extends BABYLON.TransformNode {
  private _scene: BABYLON.Scene;
  private _context: MyRoomContext;
  private _avatarId: string;
  private _isFigure: boolean = false;

  constructor(
    avatarId: string,
    scene: BABYLON.Scene,
    context: MyRoomContext,
    parent: BABYLON.Nullable<BABYLON.Node> = null
  ) {
    super(`Avatar_${avatarId}`, scene);
    this._scene = scene;
    this._context = context;
    this._avatarId = avatarId;
    this.parent = parent;
    console.log(`🧍 AvatarController created for avatar ID: ${avatarId}`);
  }

  public getAvatarId(): string {
    return this._avatarId;
  }

  public markAsFigure(): void {
    this._isFigure = true;
  }

  public isFigure(): boolean {
    return this._isFigure;
  }

  public async initModel(): Promise<void> {
    console.log(`🔄 Initializing avatar model for ${this._avatarId}`);

    // Create a simple avatar representation (cylinder for body, sphere for head)
    const body = BABYLON.MeshBuilder.CreateCylinder(
      `avatar_body_${this._avatarId}`,
      { height: 1.5, diameterTop: 0.3, diameterBottom: 0.5 },
      this._scene
    );
    body.parent = this;
    body.position.y = 0.75;

    const head = BABYLON.MeshBuilder.CreateSphere(
      `avatar_head_${this._avatarId}`,
      { diameter: 0.5 },
      this._scene
    );
    head.parent = this;
    head.position.y = 1.75;

    // Apply materials
    const bodyMaterial = new BABYLON.StandardMaterial(
      `avatar_body_material_${this._avatarId}`,
      this._scene
    );
    bodyMaterial.diffuseColor = BABYLON.Color3.FromHexString("#3f88c5");
    body.material = bodyMaterial;

    const headMaterial = new BABYLON.StandardMaterial(
      `avatar_head_material_${this._avatarId}`,
      this._scene
    );
    headMaterial.diffuseColor = BABYLON.Color3.FromHexString("#ffb347");
    head.material = headMaterial;

    // Scale down if it's a figure (not an avatar)
    if (this._isFigure) {
      this.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
    }

    return Promise.resolve();
  }

  public prepareLoadingAnimation(): void {
    // Set initial state for loading animation
    this.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
    this.setEnabled(true);
  }

  public async playLoadingAnimation(delay: number = 0): Promise<void> {
    // Simple scale animation
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        BABYLON.Animation.CreateAndStartAnimation(
          `avatar_load_${this._avatarId}`,
          this,
          "scaling",
          30,
          30,
          this.scaling,
          this._isFigure
            ? new BABYLON.Vector3(0.5, 0.5, 0.5)
            : new BABYLON.Vector3(1, 1, 1),
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
          new BABYLON.CubicEase()
        );
        resolve();
      }, delay);
    });
  }
}
