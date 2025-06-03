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

  const updateMovement = useCallback((currentX: number, currentY: number, centerX: number, centerY: number) => {
    // Tính toán vector di chuyển từ trung tâm joystick đến vị trí touch
    const deltaX = currentX - centerX;
    const deltaY = currentY - centerY;
    
    // Tính toán khoảng cách từ trung tâm
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Giới hạn khoảng cách tối đa (bán kính joystick)
    const joystickRadius = 50; // Bán kính của joystick
    const clampedDistance = Math.min(distance, joystickRadius);
    
    // Tính toán hướng di chuyển đã chuẩn hóa
    let normalizedX = 0;
    let normalizedY = 0;
    
    if (distance > 0) {
      normalizedX = deltaX / distance;
      normalizedY = deltaY / distance;
    }
    
    // Áp dụng khoảng cách đã giới hạn để có được vector di chuyển cuối cùng
    const movementX = normalizedX * clampedDistance / joystickRadius;
    const movementY = normalizedY * clampedDistance / joystickRadius;
    
    // Cập nhật vị trí joystick
    setJoystickPosition({
      x: movementX * joystickRadius,
      y: movementY * joystickRadius
    });
    
    // Xử lý dead zone (vùng không phản ứng ở giữa joystick)
    const deadZone = 0.1; // 10% của bán kính
    const normalizedDistance = clampedDistance / joystickRadius;
    
    let finalMovementX = 0;
    let finalMovementY = 0;
    let isMoving = false;
    
    if (normalizedDistance > deadZone) {
      // Tính toán giá trị di chuyển sau khi áp dụng dead zone
      const movementScale = (normalizedDistance - deadZone) / (1 - deadZone);
      finalMovementX = movementX * movementScale;
      finalMovementY = movementY * movementScale;
      isMoving = true;
    }
    
    // Chỉ ghi log và gửi dữ liệu khi có chuyển động thực sự
    if (isMoving || Math.abs(finalMovementX) > 0.001 || Math.abs(finalMovementY) > 0.001) {
      console.log('Movement calculated:', { 
        x: finalMovementX, 
        y: finalMovementY, 
        isMoving: isMoving,
        distance: normalizedDistance,
        deadZone: deadZone
      });
      
      // Gửi dữ liệu di chuyển đến component cha
      onMovementChange({ x: finalMovementX, y: -finalMovementY, isMoving: isMoving });
    }
  }, [onMovementChange]);

  // Thêm state để theo dõi mouse down
  const [isMouseDown, setIsMouseDown] = useState(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    console.log('Touch start event received', { touches: e.touches.length });
    
    if (e.touches.length === 0) {
      console.warn('No touches in touch start event');
      return;
    }
    
    // Lấy vị trí của joystick
    const joystickElement = joystickRef.current;
    if (!joystickElement) {
      console.error('Joystick element not found');
      return;
    }
    
    const joystickRect = joystickElement.getBoundingClientRect();
    const joystickCenterX = joystickRect.left + joystickRect.width / 2;
    const joystickCenterY = joystickRect.top + joystickRect.height / 2;
    
    console.log('Joystick position:', { 
      left: joystickRect.left, 
      top: joystickRect.top, 
      width: joystickRect.width, 
      height: joystickRect.height,
      centerX: joystickCenterX,
      centerY: joystickCenterY
    });
    
    // Tăng bán kính phát hiện joystick để dễ sử dụng hơn
    const extendedRadius = 200; // Tăng bán kính phát hiện lên 200px
    
    // Ưu tiên xử lý touch đầu tiên cho di chuyển nếu chưa có movement touch
    if (!movementTouch && e.touches.length > 0) {
      const firstTouch = e.touches[0];
      const touchX = firstTouch.clientX;
      const touchY = firstTouch.clientY;
      
      console.log('Processing first touch for movement:', { id: firstTouch.identifier, x: touchX, y: touchY });
      
      // Kiểm tra khoảng cách đến joystick
      const distanceToJoystick = Math.sqrt(
        Math.pow(touchX - joystickCenterX, 2) + 
        Math.pow(touchY - joystickCenterY, 2)
      );
      
      console.log('Distance to joystick:', distanceToJoystick, 'Extended radius:', extendedRadius);
      
      // Luôn sử dụng touch đầu tiên cho movement nếu chưa có movement touch
      // hoặc nếu touch này nằm gần joystick
      if (distanceToJoystick <= extendedRadius) {
        console.log('Setting movement touch:', { id: firstTouch.identifier, x: touchX, y: touchY });
        
        // Đặt vị trí bắt đầu của touch là vị trí trung tâm của joystick
        setMovementTouch({
          identifier: firstTouch.identifier,
          startX: joystickCenterX,
          startY: joystickCenterY,
          currentX: touchX,
          currentY: touchY
        });
        
        setIsActive(true);
        
        // Cập nhật movement ngay lập tức
        updateMovement(touchX, touchY, joystickCenterX, joystickCenterY);
      }
    }
    
    // Xử lý các touch còn lại
    Array.from(e.touches).forEach((touch, index) => {
      // Bỏ qua touch đầu tiên nếu đã được xử lý cho movement
      if (index === 0 && movementTouch && touch.identifier === movementTouch.identifier) {
        return;
      }
      
      const touchX = touch.clientX;
      const touchY = touch.clientY;
      
      console.log('Processing additional touch:', { id: touch.identifier, x: touchX, y: touchY });
      
      // Nếu chưa có movement touch và touch này không phải là rotation touch
      if (!movementTouch && (!rotationTouch || touch.identifier !== rotationTouch.identifier)) {
        const distanceToJoystick = Math.sqrt(
          Math.pow(touchX - joystickCenterX, 2) + 
          Math.pow(touchY - joystickCenterY, 2)
        );
        
        if (distanceToJoystick <= extendedRadius) {
          console.log('Setting movement touch from additional touches:', { id: touch.identifier, x: touchX, y: touchY });
          
          setMovementTouch({
            identifier: touch.identifier,
            startX: joystickCenterX,
            startY: joystickCenterY,
            currentX: touchX,
            currentY: touchY
          });
          
          setIsActive(true);
          
          updateMovement(touchX, touchY, joystickCenterX, joystickCenterY);
          return; // Đã xử lý touch này, không cần xử lý cho rotation
        }
      }
      
      // Nếu chưa có rotation touch và touch này không phải là movement touch
      if (!rotationTouch && (!movementTouch || touch.identifier !== movementTouch.identifier)) {
        console.log('Setting rotation touch:', { id: touch.identifier, x: touchX, y: touchY });
        
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
      // Chỉ ghi log khi thực sự kết thúc chuyển động
      console.log('Mouse up detected - resetting movement state');
      
      setIsMouseDown(false);
      setIsActive(false);
      setMovementTouch(null);
      setJoystickPosition({ x: 0, y: 0 });
      
      // Đảm bảo gửi trạng thái isMoving = false khi thả chuột
      // Chỉ gửi một lần khi kết thúc chuyển động
      onMovementChange({ x: 0, y: 0, isMoving: false });
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
    
    // Ưu tiên xử lý touch di chuyển trước
    if (movementTouch) {
      // Tìm touch tương ứng với movementTouch
      const moveTouch = Array.from(e.changedTouches).find(
        touch => touch.identifier === movementTouch.identifier
      );
      
      if (moveTouch) {
        console.log('Touch move detected for movement control:', { 
          x: moveTouch.clientX, 
          y: moveTouch.clientY, 
          startX: movementTouch.startX, 
          startY: movementTouch.startY,
          deltaX: moveTouch.clientX - movementTouch.startX,
          deltaY: moveTouch.clientY - movementTouch.startY
        });
        
        // Update movement sử dụng giá trị absolute và trung tâm joystick
        updateMovement(moveTouch.clientX, moveTouch.clientY, movementTouch.startX, movementTouch.startY);
        
        // Cập nhật vị trí hiện tại của touch
        setMovementTouch(prev => {
          if (!prev) {
            console.warn('Movement touch is null in update function');
            return null;
          }
          console.log('Updating movement touch position', {
            from: { x: prev.currentX, y: prev.currentY },
            to: { x: moveTouch.clientX, y: moveTouch.clientY }
          });
          return {
            ...prev,
            currentX: moveTouch.clientX,
            currentY: moveTouch.clientY
          };
        });
      } else {
        console.log('Movement touch not found in changedTouches');
      }
    }
    
    // Xử lý touch xoay
    if (rotationTouch) {
      const rotTouch = Array.from(e.changedTouches).find(
        touch => touch.identifier === rotationTouch.identifier
      );
      
      if (rotTouch) {
        // Update rotation
        const deltaX = rotTouch.clientX - rotationTouch.currentX;
        const sensitivity = 0.01;
        console.log('Touch move detected for rotation control:', { 
          deltaX: deltaX, 
          rotation: deltaX * sensitivity 
        });
        
        onRotationChange(deltaX * sensitivity);
        
        setRotationTouch(prev => prev ? {
          ...prev,
          currentX: rotTouch.clientX,
          currentY: rotTouch.clientY
        } : null);
      }
    }
    
    // Xử lý các touch khác nếu cần
    Array.from(e.changedTouches).forEach(touch => {
      // Bỏ qua các touch đã xử lý
      if ((movementTouch && touch.identifier === movementTouch.identifier) ||
          (rotationTouch && touch.identifier === rotationTouch.identifier)) {
        return;
      }
      
      console.log('Unhandled touch:', {
        identifier: touch.identifier,
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    });
  }, [movementTouch, rotationTouch, updateMovement, onRotationChange]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    if (e.changedTouches.length === 0) {
      return;
    }
    
    let movementTouchEnded = false;
    let rotationTouchEnded = false;
    
    Array.from(e.changedTouches).forEach(touch => {
      if (movementTouch && touch.identifier === movementTouch.identifier) {
        movementTouchEnded = true;
      } else if (rotationTouch && touch.identifier === rotationTouch.identifier) {
        rotationTouchEnded = true;
      }
    });
    
    // Xử lý kết thúc touch di chuyển
    if (movementTouchEnded) {
      // Chỉ ghi log khi thực sự kết thúc chuyển động
      console.log('Movement touch ended - resetting movement state');
      
      setMovementTouch(null);
      setIsActive(false);
      setJoystickPosition({ x: 0, y: 0 });
      
      // Gửi dữ liệu di chuyển với isMoving = false để dừng avatar
      // Chỉ gửi một lần khi kết thúc chuyển động
      onMovementChange({ x: 0, y: 0, isMoving: false });
    }
    
    // Xử lý kết thúc touch xoay
    if (rotationTouchEnded) {
      setRotationTouch(null);
      onRotationChange(0);
    }
    
    // Nếu không còn touch nào, đặt lại tất cả trạng thái
    if (e.touches.length === 0) {
      if (!movementTouchEnded && movementTouch) {
        setMovementTouch(null);
        setIsActive(false);
        setJoystickPosition({ x: 0, y: 0 });
        onMovementChange({ x: 0, y: 0, isMoving: false });
      }
      
      if (!rotationTouchEnded && rotationTouch) {
        setRotationTouch(null);
        onRotationChange(0);
      }
    }
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