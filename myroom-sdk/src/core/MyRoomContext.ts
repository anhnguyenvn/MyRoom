import * as BABYLON from "@babylonjs/core";

export class MyRoomContext {
  private _scene: BABYLON.Nullable<BABYLON.Scene> = null;
  private _changeRenderLoopFunc: ((isActive: boolean) => void) | undefined;

  constructor(
    scene: BABYLON.Scene,
    changeRenderLoopFunc?: (isActive: boolean) => void
  ) {
    this._scene = scene;
    this._changeRenderLoopFunc = changeRenderLoopFunc;
    console.log("🧠 MyRoomContext created");
  }

  public getScene(): BABYLON.Nullable<BABYLON.Scene> {
    return this._scene;
  }

  public setActiveRenderLoop(isActive: boolean) {
    if (this._changeRenderLoopFunc) {
      this._changeRenderLoopFunc(isActive);
    }
  }
}
