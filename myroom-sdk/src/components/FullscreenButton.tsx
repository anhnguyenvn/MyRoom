// src/components/FullscreenButton.tsx
import React, { useState, useEffect, useCallback } from "react";

export interface FullscreenButtonProps {
  targetElement?: HTMLElement | null; // Phần tử cụ thể để toàn màn hình, ví dụ: canvasRef.current.parentElement
  buttonStyle?: React.CSSProperties;
  className?: string;
}

const FullscreenButton: React.FC<FullscreenButtonProps> = ({
  targetElement,
  buttonStyle,
  className,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(
    !!document.fullscreenElement
  );

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange); // Safari
    document.addEventListener("mozfullscreenchange", handleFullscreenChange); // Firefox
    document.addEventListener("MSFullscreenChange", handleFullscreenChange); // IE/Edge

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, [handleFullscreenChange]);

  const toggleFullscreen = async () => {
    const element = targetElement || document.documentElement; // Mặc định là toàn bộ trang

    try {
      if (!document.fullscreenElement) {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          // Firefox
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).webkitRequestFullscreen) {
          // Chrome, Safari, Opera
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).msRequestFullscreen) {
          // IE/Edge
          await (element as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Fullscreen API error:", error);
      // Có thể hiển thị thông báo lỗi cho người dùng nếu muốn
    }
  };

  const defaultStyle: React.CSSProperties = {
    position: "absolute",
    top: "10px",
    // Để nút này bên cạnh nút HelpButton, bạn có thể điều chỉnh left hoặc right
    // Ví dụ, nếu HelpButton ở left: "10px", nút này có thể ở left: "60px" hoặc right: "10px"
    right: "10px",
    zIndex: 1001, // Cao hơn các element khác một chút
    padding: "0.5rem 1rem",
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  };

  const combinedStyle = { ...defaultStyle, ...buttonStyle };

  return (
    <button
      onClick={toggleFullscreen}
      style={combinedStyle}
      className={className}
      title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
    >
      {isFullscreen ? "Exit Fullscreen " : "Fullscreen"}{" "}
      {/* Exit Fullscreen / Fullscreen */}
    </button>
  );
};

export default FullscreenButton;
