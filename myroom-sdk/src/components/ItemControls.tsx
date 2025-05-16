// src/components/ItemControls.tsx
import React, { useState, useEffect, useCallback } from "react";
import { SceneManager } from "../core/SceneManager";
import { useNotification } from "../context/NotificationContext";
import itemDataManagerInstance from "../core/ItemDataManager";
import { IItemDefinition } from "../models/itemDataTypes";
import * as BABYLON from "@babylonjs/core"; // Import BabylonJS để dùng Vector3

const ItemControls: React.FC = () => {
  const [availableItems, setAvailableItems] = useState<IItemDefinition[]>([]);
  const [selectedItemToAdd, setSelectedItemToAdd] = useState<string>(""); // Lưu Item ID từ item.json

  const [placedItemInstanceIds, setPlacedItemInstanceIds] = useState<string[]>(
    []
  );
  const [selectedPlacedItemInstanceId, setSelectedPlacedItemInstanceId] =
    useState<string | null>(null);
  const { showNotification } = useNotification();

  // State cho việc di chuyển item (ví dụ)
  const [moveX, setMoveX] = useState<string>("0");
  const [moveY, setMoveY] = useState<string>("0");
  const [moveZ, setMoveZ] = useState<string>("0");

  const loadAvailableItems = useCallback(() => {
    if (itemDataManagerInstance.isDataLoaded()) {
      const myRoomItems = itemDataManagerInstance.getDisplayableItems(
        (item, cat3) => {
          const cat1 = itemDataManagerInstance.getCategory1ById(item.category1);
          // Chỉ lấy MYROOMITEM và không phải là FIGURE (category3: 131116) hoặc NPC (category3: 161112)
          return (
            cat1?.Name === "MYROOMITEM" &&
            item.category3 !== 131116 &&
            item.category3 !== 161112 &&
            item.use_status === "Y" &&
            cat3?.IsShowShop === true
          );
        }
      );
      setAvailableItems(myRoomItems);
      if (myRoomItems.length > 0 && !selectedItemToAdd) {
        setSelectedItemToAdd(myRoomItems[0].ID);
      }
    }
  }, [selectedItemToAdd]);

  useEffect(() => {
    loadAvailableItems();
    // Nếu ItemDataManager tải dữ liệu bất đồng bộ, bạn có thể cần một cách để lắng nghe sự kiện data loaded
  }, [loadAvailableItems]); // Chạy khi component mount và selectedItemToAdd thay đổi để đảm bảo có giá trị default

  const refreshPlacedItems = useCallback(() => {
    if (SceneManager.Room) {
      SceneManager.Room.getAllItemIds((ids) => {
        setPlacedItemInstanceIds(ids);
      });
    }
  }, []);

  useEffect(() => {
    // Load danh sách item đã đặt khi SceneManager.Room sẵn sàng
    // và refresh sau mỗi lần thêm/xóa thành công (đã được gọi trong callbacks)
    if (SceneManager.Room) {
      refreshPlacedItems();
    }
    // Thêm cơ chế lắng nghe sự kiện global nếu có (ví dụ: itemAdded, itemRemoved)
    // để tự động refresh danh sách này từ bất kỳ đâu trong ứng dụng.
  }, []);

  const handleAddItem = useCallback(async () => {
    // Hàm này giờ là async
    if (!selectedItemToAdd) {
      showNotification("Please select an item to add.", "error");
      return;
    }
    showNotification(`Adding item: ${selectedItemToAdd}...`, "info");
    if (SceneManager.Room) {
      await SceneManager.Room.placeNewItem({
        // placeNewItem giờ là async
        itemId: selectedItemToAdd,
        callback: (instanceId) => {
          if (instanceId) {
            showNotification(
              `Item added (Instance ID: ${instanceId})`,
              "success"
            );
            refreshPlacedItems();
            setSelectedPlacedItemInstanceId(instanceId);
          } else {
            showNotification(
              "Failed to add item. Check console for details.",
              "error"
            );
          }
        },
      });
    }
  }, [selectedItemToAdd, showNotification, refreshPlacedItems]);

  const handleRemoveItem = useCallback(() => {
    if (selectedPlacedItemInstanceId && SceneManager.Room) {
      SceneManager.Room.removeItem(selectedPlacedItemInstanceId);
      showNotification(`Item ${selectedPlacedItemInstanceId} removed.`, "info");
      setPlacedItemInstanceIds((prev) =>
        prev.filter((id) => id !== selectedPlacedItemInstanceId)
      );
      if (placedItemInstanceIds.length - 1 === 0) {
        // Nếu xóa item cuối cùng
        setSelectedPlacedItemInstanceId(null);
      } else if (placedItemInstanceIds.length > 1) {
        // Chọn item khác nếu có
        const currentIndex = placedItemInstanceIds.indexOf(
          selectedPlacedItemInstanceId
        );
        if (currentIndex > 0) {
          setSelectedPlacedItemInstanceId(
            placedItemInstanceIds[currentIndex - 1]
          );
        } else {
          setSelectedPlacedItemInstanceId(placedItemInstanceIds[1]);
        }
      }
    }
  }, [selectedPlacedItemInstanceId, showNotification, placedItemInstanceIds]);

  const handleRotateSelectedItem = useCallback(() => {
    if (selectedPlacedItemInstanceId && SceneManager.Room) {
      SceneManager.Room.rotateItem(selectedPlacedItemInstanceId, Math.PI / 4); // Xoay 45 độ
      showNotification(`Rotated item ${selectedPlacedItemInstanceId}`, "info");
    }
  }, [selectedPlacedItemInstanceId, showNotification]);

  const handleMoveSelectedItem = useCallback(() => {
    if (selectedPlacedItemInstanceId && SceneManager.Room) {
      const x = parseFloat(moveX);
      const y = parseFloat(moveY);
      const z = parseFloat(moveZ);
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        SceneManager.Room.moveItem(selectedPlacedItemInstanceId, x, y, z);
        showNotification(
          `Moved item ${selectedPlacedItemInstanceId} to (${x}, ${y}, ${z})`,
          "info"
        );
      } else {
        showNotification("Invalid move coordinates.", "error");
      }
    }
  }, [selectedPlacedItemInstanceId, moveX, moveY, moveZ, showNotification]);

  // Lấy thông tin item đã đặt để hiển thị vị trí hiện tại (nếu cần)
  useEffect(() => {
    if (selectedPlacedItemInstanceId && SceneManager.Room) {
      // Chức năng này chưa có trong MyRoomAPI, cần thêm nếu muốn
      // Ví dụ: SceneManager.Room.getItemTransform(selectedPlacedItemInstanceId, (transform) => {
      //   if (transform) {
      //     setMoveX(String(transform.position.x));
      //     setMoveY(String(transform.position.y));
      //     setMoveZ(String(transform.position.z));
      //   }
      // });
    }
  }, [selectedPlacedItemInstanceId]);

  if (!itemDataManagerInstance.isDataLoaded()) {
    return (
      <div style={{ padding: "1rem", backgroundColor: "#f5f5f5" }}>
        Loading item definitions...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "1rem",
        backgroundColor: "#f5f5f5",
        borderRadius: "4px",
        margin: "1rem 0",
      }}
    >
      <h3>Item Controls</h3>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="itemSelect" style={{ marginRight: "0.5rem" }}>
          Select Item to Add:{" "}
        </label>
        <select
          id="itemSelect"
          value={selectedItemToAdd}
          onChange={(e) => setSelectedItemToAdd(e.target.value)}
          style={{ minWidth: "200px", padding: "0.25rem" }}
        >
          <option value="" disabled>
            -- Choose an Item --
          </option>
          {availableItems.map((item) => (
            <option key={item.ID} value={item.ID}>
              {item.title} ({item.ID.substring(0, 8)})
            </option>
          ))}
        </select>
        <button
          onClick={handleAddItem}
          disabled={!selectedItemToAdd}
          style={{ marginLeft: "0.5rem" }}
        >
          Add Item
        </button>
      </div>

      {placedItemInstanceIds.length > 0 && (
        <div>
          <h4>Placed Items (Instances):</h4>
          <select
            value={selectedPlacedItemInstanceId || ""}
            onChange={(e) =>
              setSelectedPlacedItemInstanceId(e.target.value || null)
            }
            style={{
              minWidth: "250px",
              padding: "0.25rem",
              marginBottom: "0.5rem",
              display: "block",
            }}
          >
            <option value="" disabled>
              -- Select a Placed Item --
            </option>
            {placedItemInstanceIds.map((instanceId) => (
              <option key={instanceId} value={instanceId}>
                {instanceId}
              </option>
            ))}
          </select>

          {selectedPlacedItemInstanceId && (
            <div
              style={{
                marginTop: "0.5rem",
                borderTop: "1px solid #ccc",
                paddingTop: "0.5rem",
              }}
            >
              <h5>Controls for: {selectedPlacedItemInstanceId}</h5>
              <button
                onClick={handleRotateSelectedItem}
                style={{ marginRight: "0.5rem" }}
              >
                Rotate Y (45°)
              </button>
              <button
                onClick={handleRemoveItem}
                style={{ backgroundColor: "#f44336", color: "white" }}
              >
                Remove
              </button>

              <div style={{ marginTop: "0.5rem" }}>
                Move to:
                <input
                  type="number"
                  value={moveX}
                  onChange={(e) => setMoveX(e.target.value)}
                  placeholder="X"
                  style={{ width: "50px", margin: "0 2px" }}
                />
                <input
                  type="number"
                  value={moveY}
                  onChange={(e) => setMoveY(e.target.value)}
                  placeholder="Y"
                  style={{ width: "50px", margin: "0 2px" }}
                />
                <input
                  type="number"
                  value={moveZ}
                  onChange={(e) => setMoveZ(e.target.value)}
                  placeholder="Z"
                  style={{ width: "50px", margin: "0 2px" }}
                />
                <button
                  onClick={handleMoveSelectedItem}
                  style={{ marginLeft: "5px" }}
                >
                  Move
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ItemControls;
