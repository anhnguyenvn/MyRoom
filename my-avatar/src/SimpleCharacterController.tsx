import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, SceneLoader,
    StandardMaterial, Color3, MeshBuilder, TransformNode, Quaternion,
    Matrix, Scalar, AbstractMesh, Nullable
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export interface TouchMovement {
    x: number;
    y: number;
    isMoving: boolean;
    durationBoost?: number;
}

interface SimpleCharacterControllerProps {
    touchMovement?: TouchMovement;
}

const SimpleCharacterController: React.FC<SimpleCharacterControllerProps> = ({ touchMovement }) => {
    const reactCanvas = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Nullable<Engine>>(null);
    const sceneRef = useRef<Nullable<Scene>>(null);
    const cameraRef = useRef<Nullable<ArcRotateCamera>>(null);
    const characterRef = useRef<Nullable<AbstractMesh>>(null);
    const characterRootRef = useRef<Nullable<TransformNode>>(null);
    
    const [isSceneReady, setIsSceneReady] = useState(false);

    // Initialize Babylon.js scene
    useEffect(() => {
        if (!reactCanvas.current) return;

        const initializeScene = async () => {
            // Create engine
            const engine = new Engine(reactCanvas.current!, true, {
                preserveDrawingBuffer: true,
                stencil: true,
                antialias: true,
                alpha: false,
                premultipliedAlpha: false,
                powerPreference: "high-performance"
            });
            engineRef.current = engine;

            // Create scene
            const scene = new Scene(engine);
            sceneRef.current = scene;

            // Create character root transform node
            const characterRoot = new TransformNode("characterRoot", scene);
            characterRoot.position = Vector3.Zero();
            characterRootRef.current = characterRoot;

            // Create camera
            const camera = new ArcRotateCamera(
                "camera", 
                -Math.PI / 2, // alpha (horizontal rotation)
                Math.PI / 3,  // beta (vertical rotation)
                10,           // radius
                Vector3.Zero(), // target
                scene
            );
            camera.attachControl(reactCanvas.current!, true);
            camera.lowerRadiusLimit = 2;
            camera.upperRadiusLimit = 20;
            camera.setTarget(characterRoot.position);
            cameraRef.current = camera;

            // Create lighting
            const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
            light.intensity = 0.8;

            // Create ground
            const ground = MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);
            const groundMaterial = new StandardMaterial("groundMat", scene);
            groundMaterial.diffuseColor = new Color3(0.4, 0.6, 0.4);
            ground.material = groundMaterial;

            // Create simple character (box for now)
            const character = MeshBuilder.CreateBox("character", { width: 0.8, height: 1.8, depth: 0.4 }, scene);
            character.position.y = 0.9; // Half the height to sit on ground
            character.parent = characterRoot;
            
            const characterMaterial = new StandardMaterial("characterMat", scene);
            characterMaterial.diffuseColor = new Color3(0.2, 0.4, 0.8);
            character.material = characterMaterial;
            characterRef.current = character;

            // Movement parameters
            const movementSpeed = 3.0;
            const rotationSpeed = 2.0;

            // Store movement parameters for access in render loop
            (scene as any).movementSpeed = movementSpeed;
            (scene as any).rotationSpeed = rotationSpeed;

            // Start render loop
            engine.runRenderLoop(() => {
                scene.render();
            });

            // Handle window resize
            const handleResize = () => {
                engine.resize();
            };
            window.addEventListener('resize', handleResize);

            setIsSceneReady(true);
            console.log('✅ Simple Character Controller scene initialized');

            return () => {
                window.removeEventListener('resize', handleResize);
                scene.dispose();
                engine.dispose();
            };
        };

        initializeScene();
    }, []);

    // Movement logic that has access to current touchMovement prop
    useEffect(() => {
        if (!isSceneReady || !sceneRef.current || !engineRef.current) return;

        const scene = sceneRef.current;
        const engine = engineRef.current;
        const movementSpeed = (scene as any).movementSpeed || 3.0;
        const rotationSpeed = (scene as any).rotationSpeed || 2.0;

        const renderObserver = scene.onBeforeRenderObservable.add(() => {
            if (!characterRootRef.current || !cameraRef.current) return;

            const deltaTime = engine.getDeltaTime() / 1000.0;
            
            // Process touch movement
            if (touchMovement && touchMovement.isMoving) {
                console.log('🎮 Processing touch movement:', touchMovement);
                
                // Get camera direction vectors
                const cameraForward = cameraRef.current!.getDirection(Vector3.Forward());
                const cameraRight = cameraRef.current!.getDirection(Vector3.Right());
                
                // Flatten directions (remove Y component for ground movement)
                cameraForward.y = 0;
                cameraRight.y = 0;
                cameraForward.normalize();
                cameraRight.normalize();

                // Calculate movement direction based on touch input
                const moveDirection = Vector3.Zero();
                
                // Apply touch input (inverted Y for forward/backward)
                const forwardAmount = -touchMovement.y; // Negative Y means forward
                const rightAmount = touchMovement.x;    // Positive X means right
                
                moveDirection.addInPlace(cameraForward.scale(forwardAmount));
                moveDirection.addInPlace(cameraRight.scale(rightAmount));

                // Apply movement speed and delta time
                const finalMovement = moveDirection.scale(movementSpeed * deltaTime);
                
                // Apply duration boost if available
                if (touchMovement.durationBoost) {
                    finalMovement.scaleInPlace(touchMovement.durationBoost);
                }

                // Move character
                characterRootRef.current.position.addInPlace(finalMovement);

                // Rotate character to face movement direction
                if (moveDirection.lengthSquared() > 0.001) {
                    const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
                    const currentRotation = characterRootRef.current.rotation.y;
                    
                    // Smooth rotation
                    let rotationDiff = targetRotation - currentRotation;
                    
                    // Handle rotation wrap-around
                    if (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
                    if (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;
                    
                    const rotationStep = rotationSpeed * deltaTime;
                    if (Math.abs(rotationDiff) > rotationStep) {
                        characterRootRef.current.rotation.y += Math.sign(rotationDiff) * rotationStep;
                    } else {
                        characterRootRef.current.rotation.y = targetRotation;
                    }
                }

                // Update camera target to follow character
                cameraRef.current.setTarget(characterRootRef.current.position);
            }
        });

        return () => {
            scene.onBeforeRenderObservable.remove(renderObserver);
        };
    }, [touchMovement, isSceneReady]);

    // Log touch movement changes
    useEffect(() => {
        if (touchMovement) {
            console.log('🎯 SimpleCharacterController received touchMovement:', {
                x: touchMovement.x,
                y: touchMovement.y,
                isMoving: touchMovement.isMoving,
                durationBoost: touchMovement.durationBoost,
                timestamp: new Date().toLocaleTimeString()
            });
        }
    }, [touchMovement]);

    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <canvas 
                ref={reactCanvas} 
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'block',
                    outline: 'none'
                }}
                tabIndex={0}
            />
            {isSceneReady && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    fontSize: '12px'
                }}>
                    <div>Simple Character Controller</div>
                    <div>Touch Movement: {touchMovement?.isMoving ? 'Active' : 'Inactive'}</div>
                    <div>X: {touchMovement?.x?.toFixed(2) || '0.00'}</div>
                    <div>Y: {touchMovement?.y?.toFixed(2) || '0.00'}</div>
                    {touchMovement?.durationBoost && (
                        <div>Boost: {touchMovement.durationBoost.toFixed(2)}</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SimpleCharacterController;