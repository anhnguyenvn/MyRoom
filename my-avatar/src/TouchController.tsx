// src/TouchController.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import './TouchController.css';

interface TouchControllerProps {
  onMovementChange: (movement: { x: number; y: number; isMoving: boolean }) => void;
  onRotationChange: (rotation: number) => void;
  isVisible: boolean;
  activeMovement?: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    turnLeft: boolean;
    turnRight: boolean;
    jump: boolean;
    run: boolean;
    wave: boolean;
    dance: boolean;
  };
  onActionChange?: (action: {
    jump?: boolean;
    run?: boolean;
    wave?: boolean;
    dance?: boolean;
  }) => void;
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
  isVisible,
  activeMovement,
  onActionChange
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

  const updateMovement = useCallback((absoluteX: number, absoluteY: number, centerX: number, centerY: number) => {
    console.log('updateMovement called with absolute position:', { absoluteX, absoluteY, centerX, centerY });
    
    // Kiểm tra đầu vào
    if (isNaN(absoluteX) || isNaN(absoluteY) || isNaN(centerX) || isNaN(centerY)) {
      console.error('Invalid input to updateMovement - contains NaN values');
      return;
    }
    
    // Tính toán khoảng cách từ vị trí hiện tại đến trung tâm joystick
    const deltaX = absoluteX - centerX;
    const deltaY = absoluteY - centerY;
    
    console.log('Delta values:', { deltaX, deltaY });
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const clampedDistance = Math.min(distance, maxDistance);
    
    console.log('Movement calculation - distance:', distance, 'clampedDistance:', clampedDistance, 'maxDistance:', maxDistance);
    
    if (clampedDistance > 0) {
      const angle = Math.atan2(deltaY, deltaX);
      const clampedX = Math.cos(angle) * clampedDistance;
      const clampedY = Math.sin(angle) * clampedDistance;
      
      console.log('Clamped position:', { clampedX, clampedY, angle: angle * (180 / Math.PI) });
      
      setJoystickPosition({ x: clampedX, y: clampedY });
      
      // Normalize movement values to -1 to 1 range
      const movementX = clampedX / maxDistance;
      const movementY = clampedY / maxDistance;
      
      console.log('Normalized movement:', { movementX, movementY });
      
      // Tính toán normalizedDistance để kiểm tra dead zone
      const normalizedDistance = Math.sqrt(movementX * movementX + movementY * movementY);
      const deadZone = 0.001; // Giảm xuống 0.1% dead zone để nhạy hơn
      
      // Đảm bảo luôn có giá trị isMoving = true khi có chuyển động
      const isMoving = normalizedDistance >= deadZone;
      
      console.log('Movement check:', { normalizedDistance, deadZone, isMovingCheck: normalizedDistance >= deadZone });
      
      // Tạo dữ liệu di chuyển với giá trị isMoving
      const movementData = {
        x: movementX,
        y: movementY,
        isMoving: true // Luôn đặt isMoving = true khi có chuyển động
      };
      
      // Đảm bảo rằng khi có chuyển động, isMoving luôn là true
      if (normalizedDistance > 0 && !isMoving) {
        console.log('Force setting isMoving to true for small movement');
        movementData.isMoving = true;
      }
      
      console.log('Sending movement data:', movementData, 'normalizedDistance:', normalizedDistance, 'deadZone:', deadZone, 'isMoving:', isMoving);
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
    
    console.log('Touch start event received', { touches: e.touches.length });
    
    if (!containerRef.current || !joystickRef.current) {
      console.error('Container or joystick ref is null');
      return;
    }
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const joystickRect = joystickRef.current.getBoundingClientRect();
    
    console.log('Container rect:', {
      left: containerRect.left,
      top: containerRect.top,
      width: containerRect.width,
      height: containerRect.height
    });
    
    console.log('Joystick rect:', {
      left: joystickRect.left,
      top: joystickRect.top,
      width: joystickRect.width,
      height: joystickRect.height
    });
    
    // Mở rộng vùng phát hiện joystick để dễ sử dụng hơn
    const joystickCenterX = joystickRect.left + joystickRect.width / 2;
    const joystickCenterY = joystickRect.top + joystickRect.height / 2;
    const extendedRadius = Math.max(joystickRadius * 1.5, 150); // Sử dụng bán kính tối thiểu 150px
    
    console.log('Joystick detection area:', { 
      centerX: joystickCenterX, 
      centerY: joystickCenterY, 
      radius: joystickRadius,
      extendedRadius: extendedRadius
    });
    
    Array.from(e.changedTouches).forEach(touch => {
      const touchX = touch.clientX;
      const touchY = touch.clientY;
      
      // Check if touch is on joystick area
      const distanceToJoystick = Math.sqrt(
        Math.pow(touchX - joystickCenterX, 2) + Math.pow(touchY - joystickCenterY, 2)
      );
      
      console.log('Touch detected:', { 
        touchX, 
        touchY, 
        distanceToJoystick, 
        isInJoystickArea: distanceToJoystick <= extendedRadius 
      });
      
      if (distanceToJoystick <= extendedRadius && !movementTouch) {
        console.log('Touch accepted for movement control');
        // Touch on joystick - handle movement
        setMovementTouch({
          identifier: touch.identifier,
          startX: joystickCenterX,
          startY: joystickCenterY,
          currentX: touchX,
          currentY: touchY
        });
        setIsActive(true);
        
        // Sử dụng giá trị absolute và trung tâm joystick
        updateMovement(touchX, touchY, joystickCenterX, joystickCenterY);
      } else if (!rotationTouch) {
        console.log('Touch accepted for rotation control');
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
  }, [movementTouch, rotationTouch, updateMovement, joystickRadius]);

  // Thêm mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Lấy vị trí của joystick element
    const joystickRect = joystickRef.current?.getBoundingClientRect();
    if (!joystickRect) return;
    
    const joystickCenterX = joystickRect.left + joystickRect.width / 2;
    const joystickCenterY = joystickRect.top + joystickRect.height / 2;
    const joystickRadius = joystickRect.width / 2;
    
    // Mở rộng vùng phát hiện joystick để dễ sử dụng hơn
    const extendedRadius = Math.max(joystickRadius, 150); // Sử dụng bán kính tối thiểu 150px
    
    console.log('Mouse down - Joystick detection area:', { 
      centerX: joystickCenterX, 
      centerY: joystickCenterY, 
      radius: joystickRadius,
      extendedRadius: extendedRadius
    });
    
    // Tính khoảng cách từ điểm click đến trung tâm joystick
    const clickX = e.clientX;
    const clickY = e.clientY;
    const distanceToJoystick = Math.sqrt(
      Math.pow(clickX - joystickCenterX, 2) + 
      Math.pow(clickY - joystickCenterY, 2)
    );
    
    console.log('Mouse down detected:', { 
      clickX, 
      clickY, 
      distanceToJoystick, 
      isInJoystickArea: distanceToJoystick <= extendedRadius 
    });
    
    // Nếu click vào khu vực joystick (mở rộng)
    if (distanceToJoystick <= extendedRadius) {
      console.log('Mouse down accepted for movement control');
      setIsMouseDown(true);
      setIsActive(true);
      
      // Lưu thông tin touch cho movement
      setMovementTouch({
        identifier: -1, // Use -1 for mouse
        startX: joystickCenterX,
        startY: joystickCenterY,
        currentX: clickX,
        currentY: clickY
      });
      
      updateMovement(clickX, clickY, joystickCenterX, joystickCenterY);
    }
  }, [updateMovement]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMouseDown || !movementTouch) return;
    
    console.log('Mouse move detected:', { 
      x: e.clientX, 
      y: e.clientY, 
      centerX: movementTouch.startX, 
      centerY: movementTouch.startY 
    });
    
    // Sử dụng giá trị absolute và trung tâm joystick
    updateMovement(e.clientX, e.clientY, movementTouch.startX, movementTouch.startY);
    
    setMovementTouch(prev => prev ? {
      ...prev,
      currentX: e.clientX,
      currentY: e.clientY
    } : null);
  }, [isMouseDown, movementTouch, updateMovement]);

  const handleMouseUp = useCallback(() => {
    if (isMouseDown) {
      console.log('Mouse up detected - resetting movement state');
      setIsMouseDown(false);
      setIsActive(false);
      setMovementTouch(null);
      setJoystickPosition({ x: 0, y: 0 });
      
      // Đảm bảo gửi trạng thái isMoving = false khi thả chuột
      const resetMovementData = { x: 0, y: 0, isMoving: false };
      console.log('Resetting movement data:', resetMovementData);
      onMovementChange(resetMovementData);
    }
  }, [isMouseDown, onMovementChange]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    console.log('Touch move event received', { 
      touches: e.touches.length, 
      changedTouches: e.changedTouches.length,
      movementTouchActive: !!movementTouch,
      rotationTouchActive: !!rotationTouch
    });
    
    if (e.changedTouches.length === 0) {
      console.warn('No changed touches in touch move event');
      return;
    }
    
    Array.from(e.changedTouches).forEach(touch => {
      console.log('Processing touch:', {
        identifier: touch.identifier,
        clientX: touch.clientX,
        clientY: touch.clientY,
        movementTouchId: movementTouch?.identifier,
        rotationTouchId: rotationTouch?.identifier
      });
      
      if (movementTouch && touch.identifier === movementTouch.identifier) {
        console.log('Touch move detected for movement control:', { 
          x: touch.clientX, 
          y: touch.clientY, 
          startX: movementTouch.startX, 
          startY: movementTouch.startY,
          deltaX: touch.clientX - movementTouch.startX,
          deltaY: touch.clientY - movementTouch.startY
        });
        
        // Update movement sử dụng giá trị absolute và trung tâm joystick
        updateMovement(touch.clientX, touch.clientY, movementTouch.startX, movementTouch.startY);
        
        setMovementTouch(prev => {
          if (!prev) {
            console.warn('Movement touch is null in update function');
            return null;
          }
          console.log('Updating movement touch position', {
            from: { x: prev.currentX, y: prev.currentY },
            to: { x: touch.clientX, y: touch.clientY }
          });
          return {
            ...prev,
            currentX: touch.clientX,
            currentY: touch.clientY
          };
        });
      } else if (rotationTouch && touch.identifier === rotationTouch.identifier) {
        // Update rotation
        const deltaX = touch.clientX - rotationTouch.currentX;
        const sensitivity = 0.01;
        console.log('Touch move detected for rotation control:', { 
          deltaX: deltaX, 
          rotation: deltaX * sensitivity 
        });
        
        onRotationChange(deltaX * sensitivity);
        
        setRotationTouch(prev => prev ? {
          ...prev,
          currentX: touch.clientX,
          currentY: touch.clientY
        } : null);
      } else {
        console.log('Touch not matching any active control');
      }
    });
  }, [movementTouch, rotationTouch, updateMovement, onRotationChange]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    Array.from(e.changedTouches).forEach(touch => {
      if (movementTouch && touch.identifier === movementTouch.identifier) {
        console.log('Touch end for movement control - resetting movement state');
        setMovementTouch(null);
        setIsActive(false);
        setJoystickPosition({ x: 0, y: 0 });
        
        // Đảm bảo gửi trạng thái isMoving = false khi kết thúc chạm
        const resetMovementData = { x: 0, y: 0, isMoving: false };
        console.log('Resetting movement data:', resetMovementData);
        onMovementChange(resetMovementData);
      } else if (rotationTouch && touch.identifier === rotationTouch.identifier) {
        console.log('Touch end for rotation control - resetting rotation state');
        setRotationTouch(null);
        onRotationChange(0);
      }
    });
  }, [movementTouch, rotationTouch, onMovementChange, onRotationChange]);

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

  // Xử lý các hành động avatar
  const handleActionClick = useCallback((action: string, value: boolean) => {
    if (onActionChange) {
      switch (action) {
        case 'jump':
          onActionChange({ jump: value });
          break;
        case 'run':
          onActionChange({ run: value });
          break;
        case 'wave':
          onActionChange({ wave: value });
          break;
        case 'dance':
          onActionChange({ dance: value });
          break;
      }
    }
  }, [onActionChange]);

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

      {/* Action buttons */}
      <div className="avatar-actions">
        <button 
          className={`action-button ${activeMovement?.jump ? 'active' : ''}`}
          onTouchStart={() => handleActionClick('jump', true)}
          onTouchEnd={() => handleActionClick('jump', false)}
          onMouseDown={() => handleActionClick('jump', true)}
          onMouseUp={() => handleActionClick('jump', false)}
        >
          <span role="img" aria-label="Jump">⬆️</span>
        </button>
        
        <button 
          className={`action-button ${activeMovement?.run ? 'active' : ''}`}
          onTouchStart={() => handleActionClick('run', true)}
          onTouchEnd={() => handleActionClick('run', false)}
          onMouseDown={() => handleActionClick('run', true)}
          onMouseUp={() => handleActionClick('run', false)}
        >
          <span role="img" aria-label="Run">🏃</span>
        </button>
        
        <button 
          className={`action-button ${activeMovement?.wave ? 'active' : ''}`}
          onTouchStart={() => handleActionClick('wave', true)}
          onTouchEnd={() => handleActionClick('wave', false)}
          onMouseDown={() => handleActionClick('wave', true)}
          onMouseUp={() => handleActionClick('wave', false)}
        >
          <span role="img" aria-label="Wave">👋</span>
        </button>
        
        <button 
          className={`action-button ${activeMovement?.dance ? 'active' : ''}`}
          onTouchStart={() => handleActionClick('dance', true)}
          onTouchEnd={() => handleActionClick('dance', false)}
          onMouseDown={() => handleActionClick('dance', true)}
          onMouseUp={() => handleActionClick('dance', false)}
        >
          <span role="img" aria-label="Dance">💃</span>
        </button>
      </div>
    </div>
  );
};

export default TouchController;