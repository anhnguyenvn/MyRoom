import React, { useState } from "react";

const HelpButton: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowHelp(true)}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 100,
          padding: "0.5rem 1rem",
          backgroundColor: "#2196F3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        ?
      </button>

      {showHelp && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflow: "auto",
            }}
          >
            <h2>Room Renderer Help</h2>
            <h3>Controls</h3>
            <ul>
              <li>
                <strong>Camera:</strong> Use mouse to rotate, scroll to zoom
              </li>
              <li>
                <strong>Background Color:</strong> Change the room background
                color
              </li>
              <li>
                <strong>Presets:</strong> Load predefined room configurations
              </li>
              <li>
                <strong>Items:</strong> Add, move, rotate, and remove items
              </li>
              <li>
                <strong>Avatars:</strong> Add, move, rotate, and remove
                avatars/figures
              </li>
              <li>
                <strong>Screenshot:</strong> Take a screenshot of the current
                view
              </li>
              <li>
                <strong>Reset:</strong> Reset the room to its initial state
              </li>
            </ul>
            <h3>Import/Export</h3>
            <p>You can import and export room configurations as JSON files.</p>
            <button
              onClick={() => setShowHelp(false)}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "1rem",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpButton;
