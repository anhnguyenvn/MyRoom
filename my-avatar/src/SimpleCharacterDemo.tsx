import React, { useState, useCallback } from 'react';
import SimpleCharacterController, { TouchMovement } from './SimpleCharacterController';
import SimpleTouchController from './SimpleTouchController';

const SimpleCharacterDemo: React.FC = () => {
    const [touchMovement, setTouchMovement] = useState<TouchMovement>({
        x: 0,
        y: 0,
        isMoving: false
    });

    const handleTouchMovement = useCallback((movement: TouchMovement) => {
        console.log('📱 SimpleCharacterDemo received movement:', {
            x: movement.x,
            y: movement.y,
            isMoving: movement.isMoving,
            durationBoost: movement.durationBoost,
            timestamp: new Date().toLocaleTimeString()
        });
        
        setTouchMovement(movement);
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            {/* Character Controller (3D Scene) */}
            <SimpleCharacterController touchMovement={touchMovement} />
            
            {/* Touch Controller Overlay */}
            <SimpleTouchController 
                onMovementChange={handleTouchMovement}
                isVisible={true}
            />
            
            {/* Instructions */}
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '15px',
                borderRadius: '8px',
                fontSize: '14px',
                maxWidth: '250px',
                zIndex: 1001
            }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Simple Character Controller</h3>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>Use the joystick (bottom-left) to move</li>
                    <li>Works with both touch and mouse</li>
                    <li>Character rotates to face movement direction</li>
                    <li>Camera follows the character</li>
                    <li>Hold longer for speed boost</li>
                </ul>
                
                <div style={{ marginTop: '15px', fontSize: '12px', opacity: 0.8 }}>
                    <div><strong>Current Movement:</strong></div>
                    <div>X: {touchMovement.x.toFixed(3)}</div>
                    <div>Y: {touchMovement.y.toFixed(3)}</div>
                    <div>Moving: {touchMovement.isMoving ? 'Yes' : 'No'}</div>
                    {touchMovement.durationBoost && (
                        <div>Boost: {touchMovement.durationBoost.toFixed(2)}x</div>
                    )}
                </div>
            </div>
            
            {/* Debug Panel */}
            <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '10px',
                borderRadius: '5px',
                fontSize: '11px',
                fontFamily: 'monospace',
                zIndex: 1001
            }}>
                <div>Debug Info:</div>
                <div>Touch Active: {touchMovement.isMoving ? '✅' : '❌'}</div>
                <div>X Axis: {(touchMovement.x * 100).toFixed(1)}%</div>
                <div>Y Axis: {(touchMovement.y * 100).toFixed(1)}%</div>
                <div>Timestamp: {new Date().toLocaleTimeString()}</div>
            </div>
        </div>
    );
};

export default SimpleCharacterDemo;