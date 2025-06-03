// src/TouchController.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import './TouchController.css';

interface TouchControllerProps {
  onMovementChange: (movement: { x: number; y: number; isMoving: boolean }) => void;
  onRotationChange: (rotation: number) => void;
  isVisible: boolean;
}

interface TouchData {
  identifier: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const TouchController: React.FC<TouchControllerProps> = ({
  onMovementChange,
  onRotationChange,
  isVisible
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [movementTouch, setMovementTouch] = useState<TouchData | null>(null);
  const [rotationTouch, setRotationTouch] = useState<TouchData | null>(null);
  
  const joystickRadius = 50; // Bán kính của joystick
  const knobRadius = 20; // Bán kính của knob
  const maxDistance = joystickRadius - knobRadius;

  const updateMovement = useCallback((deltaX: number, deltaY: number) => {
    console.log('updateMovement called with:', { deltaX, deltaY });
    const clampedDistance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxDistance);
    
    if (clampedDistance > 0) {
      const angle = Math.atan2(deltaY, deltaX);
      const clampedX = Math.cos(angle) * clampedDistance;
      const clampedY = Math.sin(angle) * clampedDistance;
      
      setJoystickPosition({ x: clampedX, y: clampedY });
      
      // Normalize movement values to -1 to 1 range
      const movementX = clampedX / maxDistance;
      const movementY = clampedY / maxDistance;
      
      const movementData = {
        x: movementX,
        y: movementY,
        isMoving: clampedDistance > 5 // Dead zone
      };
      
      console.log('Sending movement data:', movementData);
      onMovementChange(movementData);
    } else {
      setJoystickPosition({ x: 0, y: 0 });
      onMovementChange({ x: 0, y: 0, isMoving: false });
    }
  }, [maxDistance, onMovementChange]);

  // Thêm state để theo dõi mouse down
  const [isMouseDown, setIsMouseDown] = useState(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    if (!containerRef.current || !joystickRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const joystickRect = joystickRef.current.getBoundingClientRect();
    
    Array.from(e.changedTouches).forEach(touch => {
      const touchX = touch.clientX;
      const touchY = touch.clientY;
      
      // Check if touch is on joystick area
      const joystickCenterX = joystickRect.left + joystickRect.width / 2;
      const joystickCenterY = joystickRect.top + joystickRect.height / 2;
      const distanceToJoystick = Math.sqrt(
        Math.pow(touchX - joystickCenterX, 2) + Math.pow(touchY - joystickCenterY, 2)
      );
      
      if (distanceToJoystick <= joystickRadius && !movementTouch) {
        // Touch on joystick - handle movement
        setMovementTouch({
          identifier: touch.identifier,
          startX: joystickCenterX,
          startY: joystickCenterY,
          currentX: touchX,
          currentY: touchY
        });
        setIsActive(true);
        
        const deltaX = touchX - joystickCenterX;
        const deltaY = touchY - joystickCenterY;
        updateMovement(deltaX, deltaY);
      } else if (!rotationTouch) {
        // Touch outside joystick - handle rotation
        setRotationTouch({
          identifier: touch.identifier,
          startX: touchX,
          startY: touchY,
          currentX: touchX,
          currentY: touchY
        });
      }
    });
  }, [movementTouch, rotationTouch, updateMovement]);

  // Thêm mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    console.log('Mouse down on joystick!');
    e.preventDefault();
    e.stopPropagation();
    
    if (!joystickRef.current) return;
    
    const joystickRect = joystickRef.current.getBoundingClientRect();
    const joystickCenterX = joystickRect.left + joystickRect.width / 2;
    const joystickCenterY = joystickRect.top + joystickRect.height / 2;
    
    console.log('Mouse position:', { x: e.clientX, y: e.clientY });
    console.log('Joystick center:', { x: joystickCenterX, y: joystickCenterY });
    
    const distanceToJoystick = Math.sqrt(
      Math.pow(e.clientX - joystickCenterX, 2) + Math.pow(e.clientY - joystickCenterY, 2)
    );
    
    console.log('Distance to joystick:', distanceToJoystick, 'Radius:', joystickRadius);
    
    if (distanceToJoystick <= joystickRadius) {
      console.log('Mouse down accepted!');
      setIsMouseDown(true);
      setIsActive(true);
      
      // Simulate touch data with mouse
      setMovementTouch({
        identifier: -1, // Use -1 for mouse
        startX: joystickCenterX,
        startY: joystickCenterY,
        currentX: e.clientX,
        currentY: e.clientY
      });
      
      const deltaX = e.clientX - joystickCenterX;
      const deltaY = e.clientY - joystickCenterY;
      console.log('Initial delta:', { deltaX, deltaY });
      updateMovement(deltaX, deltaY);
    }
  }, [updateMovement]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMouseDown || !movementTouch) return;
    
    const deltaX = e.clientX - movementTouch.startX;
    const deltaY = e.clientY - movementTouch.startY;
    updateMovement(deltaX, deltaY);
    
    setMovementTouch(prev => prev ? {
      ...prev,
      currentX: e.clientX,
      currentY: e.clientY
    } : null);
  }, [isMouseDown, movementTouch, updateMovement]);

  const handleMouseUp = useCallback(() => {
    if (isMouseDown) {
      setIsMouseDown(false);
      setIsActive(false);
      setMovementTouch(null);
      setJoystickPosition({ x: 0, y: 0 });
      onMovementChange({ x: 0, y: 0, isMoving: false });
    }
  }, [isMouseDown, onMovementChange]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    Array.from(e.changedTouches).forEach(touch => {
      if (movementTouch && touch.identifier === movementTouch.identifier) {
        // Update movement
        const deltaX = touch.clientX - movementTouch.startX;
        const deltaY = touch.clientY - movementTouch.startY;
        updateMovement(deltaX, deltaY);
        
        setMovementTouch(prev => prev ? {
          ...prev,
          currentX: touch.clientX,
          currentY: touch.clientY
        } : null);
      } else if (rotationTouch && touch.identifier === rotationTouch.identifier) {
        // Update rotation
        const deltaX = touch.clientX - rotationTouch.currentX;
        const sensitivity = 0.01;
        onRotationChange(deltaX * sensitivity);
        
        setRotationTouch(prev => prev ? {
          ...prev,
          currentX: touch.clientX,
          currentY: touch.clientY
        } : null);
      }
    });
  }, [movementTouch, rotationTouch, updateMovement, onRotationChange]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    Array.from(e.changedTouches).forEach(touch => {
      if (movementTouch && touch.identifier === movementTouch.identifier) {
        setMovementTouch(null);
        setIsActive(false);
        setJoystickPosition({ x: 0, y: 0 });
        onMovementChange({ x: 0, y: 0, isMoving: false });
      } else if (rotationTouch && touch.identifier === rotationTouch.identifier) {
        setRotationTouch(null);
      }
    });
  }, [movementTouch, rotationTouch, onMovementChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Mouse event listeners
  useEffect(() => {
    if (!isMouseDown) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMouseDown, handleMouseMove, handleMouseUp]);

  console.log('TouchController render - isVisible:', isVisible);
  
  if (!isVisible) {
    console.log('TouchController not visible, returning null');
    return null;
  }

  console.log('TouchController rendering...');
  return (
    <div ref={containerRef} className="touch-controller">
      <div 
        ref={joystickRef}
        className={`joystick ${isActive ? 'active' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div 
          ref={knobRef}
          className="joystick-knob"
          style={{
            transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`
          }}
        />
      </div>
      
      <div className="touch-instructions">
        <div className="instruction-item">
          <div className="instruction-icon joystick-icon">🕹️</div>
          <span>Di chuyển</span>
        </div>
        <div className="instruction-item">
          <div className="instruction-icon touch-icon">👆</div>
          <span>Chạm để xoay</span>
        </div>
      </div>
    </div>
  );
};

export default TouchController;