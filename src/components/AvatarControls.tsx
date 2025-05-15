import React, { useState } from "react";
import { SceneManager } from "../core/SceneManager";

const AvatarControls: React.FC = () => {
  const [avatarId, setAvatarId] = useState("default_avatar");
  const [isAvatar, setIsAvatar] = useState(true);
  const [placedFigures, setPlacedFigures] = useState<string[]>([]);
  const [selectedFigure, setSelectedFigure] = useState<string | null>(null);

  const handleAddFigure = () => {
    SceneManager.Room?.placeNewFigure(avatarId, isAvatar, (id) => {
      if (id) {
        SceneManager.Room?.getAllFigureIds((ids) => {
          setPlacedFigures(ids);
          setSelectedFigure(id);
        });
      }
    });
  };

  const handleRemoveFigure = () => {
    if (selectedFigure) {
      SceneManager.Room?.removeFigure(selectedFigure);
      setPlacedFigures(placedFigures.filter((id) => id !== selectedFigure));
      setSelectedFigure(null);
    }
  };

  const handleRotateFigure = () => {
    if (selectedFigure) {
      SceneManager.Room?.rotateFigure(selectedFigure);
    }
  };

  const handleMoveFigure = (x: number, z: number) => {
    if (selectedFigure) {
      SceneManager.Room?.moveFigure(selectedFigure, x, 0, z);
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
      <h3>Avatar Controls</h3>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <label htmlFor="avatarId">Avatar ID: </label>
          <input
            id="avatarId"
            type="text"
            value={avatarId}
            onChange={(e) => setAvatarId(e.target.value)}
            style={{ width: "200px" }}
          />
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={isAvatar}
              onChange={(e) => setIsAvatar(e.target.checked)}
            />
            Is Avatar (unchecked = figure)
          </label>
        </div>
        <button onClick={handleAddFigure}>Add Figure/Avatar</button>
      </div>

      {placedFigures.length > 0 && (
        <div>
          <h4>Placed Figures:</h4>
          <div
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              marginBottom: "1rem",
            }}
          >
            {placedFigures.map((id) => (
              <div
                key={id}
                style={{
                  padding: "0.5rem",
                  margin: "0.25rem 0",
                  backgroundColor:
                    selectedFigure === id ? "#ddd" : "transparent",
                  cursor: "pointer",
                  borderRadius: "4px",
                }}
                onClick={() => setSelectedFigure(id)}
              >
                {id}
              </div>
            ))}
          </div>

          {selectedFigure && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button onClick={handleRotateFigure}>Rotate</button>
              <button onClick={handleRemoveFigure}>Remove</button>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                  width: "100%",
                }}
              >
                <h5>Move Figure:</h5>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "0.5rem",
                  }}
                >
                  <button onClick={() => handleMoveFigure(-2, -2)}>↖</button>
                  <button onClick={() => handleMoveFigure(0, -2)}>↑</button>
                  <button onClick={() => handleMoveFigure(2, -2)}>↗</button>
                  <button onClick={() => handleMoveFigure(-2, 0)}>←</button>
                  <button onClick={() => handleMoveFigure(0, 0)}>○</button>
                  <button onClick={() => handleMoveFigure(2, 0)}>→</button>
                  <button onClick={() => handleMoveFigure(-2, 2)}>↙</button>
                  <button onClick={() => handleMoveFigure(0, 2)}>↓</button>
                  <button onClick={() => handleMoveFigure(2, 2)}>↘</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvatarControls;
