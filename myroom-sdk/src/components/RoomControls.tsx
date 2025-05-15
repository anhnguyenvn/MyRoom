import React from "react";

interface RoomControlsProps {
  onBackgroundColorChange: (color: string) => void;
  backgroundColor: string;
  onExportManifest: () => void;
  onImportManifest: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RoomControls: React.FC<RoomControlsProps> = ({
  onBackgroundColorChange,
  backgroundColor,
  onExportManifest,
  onImportManifest,
}) => {
  return (
    <div
      style={{
        padding: "0.75rem",
        backgroundColor: "#f5f5f5",
        borderRadius: "4px",
        margin: "0.5rem 0",
      }}
    >
      <h3 style={{ marginTop: 0, fontSize: "1rem" }}>Room Settings</h3>
      <div
        style={{
          display: "flex",
          flexDirection: "column", // Changed to column
          gap: "0.5rem",
        }}
      >
        <div>
          <label
            htmlFor="bgColor"
            style={{ display: "block", marginBottom: "0.25rem" }}
          >
            Background:
          </label>
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              id="bgColor"
              type="color"
              value={backgroundColor}
              onChange={(e) => onBackgroundColorChange(e.target.value)}
              style={{ marginRight: "0.5rem" }}
            />
            <span>{backgroundColor}</span>
          </div>
        </div>
        <div>
          <label
            htmlFor="manifestUpload"
            style={{ display: "block", marginBottom: "0.25rem" }}
          >
            Import:
          </label>
          <input
            id="manifestUpload"
            type="file"
            accept=".json"
            onChange={onImportManifest}
            style={{ width: "100%", fontSize: "0.8rem" }}
          />
        </div>
        <button
          onClick={onExportManifest}
          style={{ padding: "0.4rem 0.75rem", marginTop: "0.25rem" }}
        >
          Export Manifest
        </button>
      </div>
    </div>
  );
};

export default RoomControls;
