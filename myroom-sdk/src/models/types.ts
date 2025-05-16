// src/models/types.ts
export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export interface ITransform {
  position: IVector3;
  rotation: IVector3; // Giả định là độ (degrees), sẽ chuyển sang radians khi áp dụng
  scale: IVector3;
}

export interface IRoomGridInfo {
  meshName: string; // Tên mesh trong model phòng sẽ áp dụng grid này (e.g., "Floor", "Wall_Left")
  gridType: "FLOOR" | "WALL"; // Loại grid
  gridSize: { w: number; h: number }; // Số ô lưới theo chiều rộng/cao của meshName
  gridOffset: { x: number; y: number }; // Độ lệch của grid so với gốc meshName
}

export interface IMyRoomItemPlacementInfo {
  id: string; // Instance ID, unique trong phòng
  itemId: string; // ID của item từ item.json (ví dụ: "7Xy9bdWtdiQXlBG2b6AQi")
  transform: ITransform;
  order: number; // Thứ tự render hoặc logic khác
  // Các thuộc tính tùy chỉnh khác có thể được lưu ở đây nếu cần ghi đè dữ liệu từ item.json
  // Ví dụ: customData?: any;
}

export interface IMyRoomFigurePlacementInfo {
  id?: string; // Instance ID, nếu không có sẽ tự tạo
  avatarId: string; // ID của item "AVATAR" hoặc "FIGURE" từ item.json
  transform?: ITransform;
  isAvatar?: boolean; // Phân biệt avatar người chơi và NPC/figure tĩnh
  parentId?: string; // Nếu figure này được gắn vào một item khác
}

export interface IMyRoomItemFunctionData {
  instanceId: string; // ID của item instance đang thực thi function
  functionType: string; // Loại function (có thể map từ itemDef.funtion)
  functionData: any; // Dữ liệu cho function đó
}

export interface IAssetManifest_MyRoom {
  main: {
    type: string; // e.g., "MyRoom"
    room: {
      backgroundColor: string; // e.g., "#RRGGBBAA"
      roomSkinId: string; // ID của item "MYROOMSKIN" từ item.json, hoặc mã màu
      grids: IRoomGridInfo[];
      templateId?: string; // ID của một preset/template hoàn chỉnh
    };
    environment?: string; // ID của item "ENVLIGHT" từ item.json
    items?: IMyRoomItemPlacementInfo[];
    figures?: IMyRoomFigurePlacementInfo[];
    itemFunctionDatas?: IMyRoomItemFunctionData[];
    defaultAvatarPos?: any; // Vị trí avatar mặc định
  };
}
