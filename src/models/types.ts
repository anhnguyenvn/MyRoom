// src/models/types.ts
export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export interface ITransform {
  position: IVector3;
  rotation: IVector3;
  scale: IVector3;
}

export interface IRoomGridInfo {
  meshName: string;
  gridType: string;
  gridSize: { w: number; h: number };
  gridOffset: { x: number; y: number };
}

export interface IMyRoomItemPlacementInfo {
  id: string;
  itemId: string;
  transform: ITransform;
  order: number;
}

export interface IMyRoomFigurePlacementInfo {
  id?: string;
  avatarId: string;
  transform?: ITransform;
  isAvatar?: boolean;
  parentId?: string;
}

export interface IMyRoomItemFunctionData {
  instanceId: string;
  functionType: string;
  functionData: any;
}

export interface IAssetManifest_MyRoom {
  main: {
    type: string;
    room: {
      backgroundColor: string;
      roomSkinId: string;
      grids: IRoomGridInfo[];
      templateId?: string;
    };
    environment?: string;
    items?: IMyRoomItemPlacementInfo[];
    figures?: IMyRoomFigurePlacementInfo[];
    itemFunctionDatas?: IMyRoomItemFunctionData[];
    defaultAvatarPos?: any;
  };
}
