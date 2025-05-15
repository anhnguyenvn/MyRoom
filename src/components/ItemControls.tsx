import React, { useState } from "react";
import { SceneManager } from "../core/SceneManager";
import { useNotification } from "../context/NotificationContext";

const ItemControls: React.FC = () => {
  const [itemId, setItemId] = useState("default_item");
  const [placedItems, setPlacedItems] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const handleAddItem = () => {
    SceneManager.Room?.placeNewItem({
      itemId,
      callback: (instanceId) => {
        if (instanceId) {
          SceneManager.Room?.getAllItemIds((ids) => {
            setPlacedItems(ids);
            setSelectedItem(instanceId);
            showNotification(`Item ${itemId} added successfully`, "success");
          });
        } else {
          showNotification("Failed to add item", "error");
        }
      },
    });
  };

  const handleRemoveItem = () => {
    if (selectedItem) {
      SceneManager.Room?.removeItem(selectedItem);
      setPlacedItems(placedItems.filter((id) => id !== selectedItem));
      setSelectedItem(null);
    }
  };

  const handleRotateItem = () => {
    if (selectedItem) {
      SceneManager.Room?.rotateItem(selectedItem);
    }
  };

  const handleMoveItem = (x: number, z: number) => {
    if (selectedItem) {
      SceneManager.Room?.moveItem(selectedItem, x, 0.5, z);
    }
  };

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
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <label htmlFor="itemId">Item ID: </label>
          <input
            id="itemId"
            type="text"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            style={{ width: "200px" }}
          />
        </div>
        <button onClick={handleAddItem}>Add Item</button>
      </div>

      {placedItems.length > 0 && (
        <div>
          <h4>Placed Items:</h4>
          <div
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              marginBottom: "1rem",
            }}
          >
            {placedItems.map((id) => (
              <div
                key={id}
                style={{
                  padding: "0.5rem",
                  margin: "0.25rem 0",
                  backgroundColor: selectedItem === id ? "#ddd" : "transparent",
                  cursor: "pointer",
                  borderRadius: "4px",
                }}
                onClick={() => setSelectedItem(id)}
              >
                {id}
              </div>
            ))}
          </div>

          {selectedItem && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button onClick={handleRotateItem}>Rotate</button>
              <button onClick={handleRemoveItem}>Remove</button>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                  width: "100%",
                }}
              >
                <h5>Move Item:</h5>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "0.5rem",
                  }}
                >
                  <button onClick={() => handleMoveItem(-2, -2)}>↖</button>
                  <button onClick={() => handleMoveItem(0, -2)}>↑</button>
                  <button onClick={() => handleMoveItem(2, -2)}>↗</button>
                  <button onClick={() => handleMoveItem(-2, 0)}>←</button>
                  <button onClick={() => handleMoveItem(0, 0)}>○</button>
                  <button onClick={() => handleMoveItem(2, 0)}>→</button>
                  <button onClick={() => handleMoveItem(-2, 2)}>↙</button>
                  <button onClick={() => handleMoveItem(0, 2)}>↓</button>
                  <button onClick={() => handleMoveItem(2, 2)}>↘</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ItemControls;
