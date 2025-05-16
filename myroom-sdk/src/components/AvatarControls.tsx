// src/components/AvatarControls.tsx
import React, { useState, useEffect } from "react";
import { SceneManager } from "../core/SceneManager";
import { useNotification } from "../context/NotificationContext";
import itemDataManagerInstance from "../core/ItemDataManager";
import { IItemDefinition } from "../models/itemDataTypes";

const AvatarControls: React.FC = () => {
  const [availableFigures, setAvailableFigures] = useState<IItemDefinition[]>(
    []
  );
  const [selectedFigureToAdd, setSelectedFigureToAdd] = useState<string>(""); // Item ID from item.json
  const [isFigurePlayerAvatar, setIsFigurePlayerAvatar] =
    useState<boolean>(true); // true if player avatar, false for static figure/NPC

  const [placedFigureInstanceIds, setPlacedFigureInstanceIds] = useState<
    string[]
  >([]);
  const [selectedPlacedFigureInstanceId, setSelectedPlacedFigureInstanceId] =
    useState<string | null>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (itemDataManagerInstance.isDataLoaded()) {
      const figures = itemDataManagerInstance.getDisplayableItems((item) => {
        const cat1 = itemDataManagerInstance.getCategory1ById(item.category1);
        // Lọc các item là AVATAR hoặc FIGURE (ví dụ category3: 131116 là FIGURE)
        // Hoặc bạn có thể có một category riêng cho AVATAR PRESET (ví dụ: category3: 161111)
        return (
          (cat1?.Name === "AVATAR" ||
            item.category3 === 131116 ||
            item.category3 === 161111) &&
          item.use_status === "Y"
        );
      });
      setAvailableFigures(figures);
      if (figures.length > 0) {
        setSelectedFigureToAdd(figures[0].ID);
      }
    }
  }, []); // Hoặc theo dõi isDataLoaded từ App context/prop

  const refreshPlacedFigures = () => {
    SceneManager.Room?.getAllFigureIds((ids) => {
      setPlacedFigureInstanceIds(ids);
    });
  };

  useEffect(() => {
    if (SceneManager.Room) {
      refreshPlacedFigures();
    }
  }, [SceneManager.Room]);

  const handleAddFigure = () => {
    if (!selectedFigureToAdd) {
      showNotification("Please select a figure/avatar to add.", "error");
      return;
    }
    SceneManager.Room?.placeNewFigure(
      selectedFigureToAdd, // ID của item từ item.json
      isFigurePlayerAvatar,
      (instanceId) => {
        if (instanceId) {
          showNotification(
            `Figure/Avatar added (ID: ${instanceId})`,
            "success"
          );
          refreshPlacedFigures();
          setSelectedPlacedFigureInstanceId(instanceId);
        } else {
          showNotification("Failed to add figure/avatar", "error");
        }
      }
    );
  };

  const handleRemoveFigure = () => {
    if (selectedPlacedFigureInstanceId) {
      SceneManager.Room?.removeFigure(selectedPlacedFigureInstanceId);
      showNotification(
        `Figure ${selectedPlacedFigureInstanceId} removed.`,
        "info"
      );
      setPlacedFigureInstanceIds((prev) =>
        prev.filter((id) => id !== selectedPlacedFigureInstanceId)
      );
      setSelectedPlacedFigureInstanceId(null);
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
      <h3>Avatar/Figure Controls</h3>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <label htmlFor="figureSelect">Select Figure: </label>
          <select
            id="figureSelect"
            value={selectedFigureToAdd}
            onChange={(e) => setSelectedFigureToAdd(e.target.value)}
            style={{ width: "200px", marginRight: "10px" }}
          >
            <option value="" disabled>
              -- Select a figure --
            </option>
            {availableFigures.map((fig) => (
              <option key={fig.ID} value={fig.ID}>
                {fig.title} ({fig.ID})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={isFigurePlayerAvatar}
              onChange={(e) => setIsFigurePlayerAvatar(e.target.checked)}
            />
            Is Player Avatar (Controllable)
          </label>
        </div>
        <button onClick={handleAddFigure} disabled={!selectedFigureToAdd}>
          Add Selected Figure
        </button>
      </div>

      {placedFigureInstanceIds.length > 0 && (
        <div>
          <h4>Placed Figures (Instances):</h4>
          <div
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              marginBottom: "1rem",
            }}
          >
            {placedFigureInstanceIds.map((instanceId) => (
              <div
                key={instanceId}
                style={{
                  padding: "0.5rem",
                  margin: "0.25rem 0",
                  backgroundColor:
                    selectedPlacedFigureInstanceId === instanceId
                      ? "#ddd"
                      : "transparent",
                  cursor: "pointer",
                  borderRadius: "4px",
                }}
                onClick={() => setSelectedPlacedFigureInstanceId(instanceId)}
              >
                {instanceId}
              </div>
            ))}
          </div>
          {selectedPlacedFigureInstanceId && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                onClick={() =>
                  SceneManager.Room?.rotateFigure(
                    selectedPlacedFigureInstanceId
                  )
                }
              >
                Rotate
              </button>
              <button onClick={handleRemoveFigure}>Remove</button>
              {/* Move controls for figures... */}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvatarControls;
