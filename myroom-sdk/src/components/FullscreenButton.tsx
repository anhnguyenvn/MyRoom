import React, { useState, useEffect } from "react";

const FullscreenButton: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        zIndex: 100,
        padding: "0.5rem 1rem",
        backgroundColor: "#2196F3",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
      }}
    >
      {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
    </button>
  );
};

export default FullscreenButton;
