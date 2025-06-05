import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface TouchMovement {
    x: number;
    y: number;
    isMoving: boolean;
    durationBoost?: number;
}

interface SimpleTouchControllerProps {
    onMovementChange: (movement: TouchMovement) => void;
    isVisible?: boolean;
}

const SimpleTouchController: React.FC<SimpleTouchControllerProps> = ({
    onMovementChange,
    isVisible = true
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const joystickRef = useRef<HTMLDivElement>(null);
    const knobRef = useRef<HTMLDivElement>(null);
    
    const [isActive, setIsActive] = useState(false);
    const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
    const [touchStartTime, setTouchStartTime] = useState(0);
    
    const joystickRadius = 60;
    const knobRadius = 20;
    const maxDistance = joystickRadius - knobRadius;

    // Calculate movement from joystick position
    const calculateMovement = useCallback((centerX: number, centerY: number, touchX: number, touchY: number) => {
        const deltaX = touchX - centerX;
        const deltaY = touchY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Limit distance to joystick radius
        const clampedDistance = Math.min(distance, maxDistance);
        
        // Calculate normalized direction
        let normalizedX = 0;
        let normalizedY = 0;
        
        if (distance > 0) {
            normalizedX = deltaX / distance;
            normalizedY = deltaY / distance;
        }
        
        // Apply clamped distance
        const movementX = normalizedX * clampedDistance / maxDistance;
        const movementY = normalizedY * clampedDistance / maxDistance;
        
        // Update knob visual position
        setKnobPosition({
            x: movementX * maxDistance,
            y: movementY * maxDistance
        });
        
        // Apply dead zone
        const deadZone = 0.1;
        const normalizedDistance = clampedDistance / maxDistance;
        
        let finalX = 0;
        let finalY = 0;
        let isMoving = false;
        
        if (normalizedDistance > deadZone) {
            const movementScale = (normalizedDistance - deadZone) / (1 - deadZone);
            finalX = movementX * movementScale;
            finalY = movementY * movementScale;
            isMoving = true;
        }
        
        // Calculate duration boost
        const touchDuration = Date.now() - touchStartTime;
        const durationBoost = Math.min(1.0 + (touchDuration / 3000), 1.5);
        
        console.log('🕹️ SimpleTouchController movement:', {
            raw: { x: deltaX, y: deltaY },
            normalized: { x: movementX, y: movementY },
            final: { x: finalX, y: finalY },
            isMoving,
            distance: normalizedDistance,
            durationBoost
        });
        
        // Send movement data
        onMovementChange({
            x: finalX,
            y: finalY,
            isMoving,
            durationBoost
        });
    }, [maxDistance, onMovementChange, touchStartTime]);

    // Reset joystick to center
    const resetJoystick = useCallback(() => {
        setKnobPosition({ x: 0, y: 0 });
        setIsActive(false);
        onMovementChange({ x: 0, y: 0, isMoving: false });
    }, [onMovementChange]);

    // Touch event handlers
    const handleTouchStart = useCallback((e: TouchEvent) => {
        e.preventDefault();
        
        if (!joystickRef.current || e.touches.length === 0) return;
        
        const touch = e.touches[0];
        const joystickRect = joystickRef.current.getBoundingClientRect();
        const centerX = joystickRect.left + joystickRect.width / 2;
        const centerY = joystickRect.top + joystickRect.height / 2;
        
        // Check if touch is within joystick area
        const touchDistance = Math.sqrt(
            Math.pow(touch.clientX - centerX, 2) + 
            Math.pow(touch.clientY - centerY, 2)
        );
        
        if (touchDistance <= joystickRadius + 20) { // Add some tolerance
            setIsActive(true);
            setTouchStartTime(Date.now());
            calculateMovement(centerX, centerY, touch.clientX, touch.clientY);
            
            console.log('👆 Touch started on joystick');
        }
    }, [calculateMovement]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        e.preventDefault();
        
        if (!isActive || !joystickRef.current || e.touches.length === 0) return;
        
        const touch = e.touches[0];
        const joystickRect = joystickRef.current.getBoundingClientRect();
        const centerX = joystickRect.left + joystickRect.width / 2;
        const centerY = joystickRect.top + joystickRect.height / 2;
        
        calculateMovement(centerX, centerY, touch.clientX, touch.clientY);
    }, [isActive, calculateMovement]);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        e.preventDefault();
        resetJoystick();
        console.log('👆 Touch ended');
    }, [resetJoystick]);

    // Mouse event handlers (for desktop testing)
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        
        if (!joystickRef.current) return;
        
        const joystickRect = joystickRef.current.getBoundingClientRect();
        const centerX = joystickRect.left + joystickRect.width / 2;
        const centerY = joystickRect.top + joystickRect.height / 2;
        
        setIsActive(true);
        setTouchStartTime(Date.now());
        calculateMovement(centerX, centerY, e.clientX, e.clientY);
        
        console.log('🖱️ Mouse down on joystick');
    }, [calculateMovement]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isActive || !joystickRef.current) return;
        
        const joystickRect = joystickRef.current.getBoundingClientRect();
        const centerX = joystickRect.left + joystickRect.width / 2;
        const centerY = joystickRect.top + joystickRect.height / 2;
        
        calculateMovement(centerX, centerY, e.clientX, e.clientY);
    }, [isActive, calculateMovement]);

    const handleMouseUp = useCallback(() => {
        resetJoystick();
        console.log('🖱️ Mouse up');
    }, [resetJoystick]);

    // Set up event listeners
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Touch events
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

    // Mouse events for desktop
    useEffect(() => {
        if (!isActive) return;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isActive, handleMouseMove, handleMouseUp]);

    if (!isVisible) return null;

    return (
        <div 
            ref={containerRef}
            style={{
                position: 'fixed',
                bottom: '50px',
                left: '50px',
                width: `${joystickRadius * 2}px`,
                height: `${joystickRadius * 2}px`,
                zIndex: 1000,
                pointerEvents: 'auto'
            }}
        >
            {/* Joystick base */}
            <div
                ref={joystickRef}
                onMouseDown={handleMouseDown}
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: isActive ? 'none' : 'all 0.2s ease',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: isActive 
                        ? '0 0 20px rgba(76, 175, 80, 0.6)' 
                        : '0 4px 8px rgba(0, 0, 0, 0.3)'
                }}
            >
                {/* Joystick knob */}
                <div
                    ref={knobRef}
                    style={{
                        width: `${knobRadius * 2}px`,
                        height: `${knobRadius * 2}px`,
                        borderRadius: '50%',
                        backgroundColor: isActive ? '#4CAF50' : '#2196F3',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) translate(${knobPosition.x}px, ${knobPosition.y}px)`,
                        transition: isActive ? 'none' : 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                        border: '2px solid white'
                    }}
                />
            </div>
            
            {/* Test button */}
            <button
                onClick={() => {
                    console.log('🔴 Test button clicked');
                    onMovementChange({ x: 0.5, y: 0.5, isMoving: true, durationBoost: 1.0 });
                    setTimeout(() => {
                        onMovementChange({ x: 0, y: 0, isMoving: false });
                    }, 1000);
                }}
                style={{
                    position: 'absolute',
                    top: '-50px',
                    left: '0',
                    padding: '8px 12px',
                    backgroundColor: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    pointerEvents: 'auto'
                }}
            >
                Test
            </button>
        </div>
    );
};

export default SimpleTouchController;