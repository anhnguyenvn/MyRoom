import { Scene } from "@babylonjs/core";
import { MyRoomAPI } from "./MyRoomAPI";

export type SceneType = "ROOM";

class SceneCore {
  api: MyRoomAPI;
  scene: Scene;

  constructor(scene: Scene, api: MyRoomAPI) {
    this.scene = scene;
    this.api = api;
  }

  active() {
    this.api.changeRenderLoop(3); // RENDER_PERIOD_NORMAL
  }

  inactive() {
    this.api.changeRenderLoop(60); // RENDER_PERIOD_INACTIVE
  }

  finalize() {
    if (this.api) {
      this.api.clearMyRoom();
      this.api.finalize();
    }

    if (this.scene) {
      this.scene.dispose();
    }
  }
}

export class SceneManager {
  private static _scene = new Map<SceneType, SceneCore | null>();

  public static get Room() {
    return this._scene.get("ROOM")?.api;
  }

  static initializeScene(params: {
    scene: Scene;
    type: SceneType;
    onSuccess?: () => void;
  }) {
    const { scene, type, onSuccess } = params;

    console.log("SceneManager initializing");
    if (!this._scene.has(type)) {
      const api = new MyRoomAPI(scene);
      api
        .initialize()
        .then(() => {
          console.log("SceneManager INITIALIZED");
          this._scene.set(type, new SceneCore(scene, api));
          if (onSuccess) {
            onSuccess();
          }
        })
        .catch((e) => {
          console.error("Error initializing scene:", e);
        });
    } else {
      console.log("SceneManager ALREADY INITIALIZED");
    }
  }

  static isInit(type: SceneType): boolean {
    return this._scene.has(type);
  }

  static finalize(type: SceneType) {
    console.log("SceneManager finalize");

    const _inst = this._scene.get(type);
    if (_inst) {
      _inst.finalize();
      this._scene.delete(type);
    }
  }
}
