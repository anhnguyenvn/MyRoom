import React from "react";

interface LoadingScreenProps {
  isVisible: boolean;
  progress?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isVisible,
  progress = 0,
}) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        zIndex: 1000,
      }}
    >
      <h2 style={{ marginBottom: "1rem" }}>Loading Room...</h2>
      <div
        style={{
          width: "300px",
          height: "20px",
          backgroundColor: "#333",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: "#4a90e2",
            transition: "width 0.3s ease-in-out",
          }}
        />
      </div>
      <p style={{ marginTop: "0.5rem" }}>{progress.toFixed(0)}%</p>
    </div>
  );
};

export default LoadingScreen;
