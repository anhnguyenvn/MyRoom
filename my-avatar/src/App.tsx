// src/App.tsx
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import './App.css';
import './AvatarControls.css';
import BabylonScene, { ModelInfo, BabylonSceneHandle, ActiveMovement, TouchMovement, TouchRotation } from './BabylonScene';
import AvatarControls from './AvatarControls';
import TouchController from './TouchController';
import { availablePartsData, getDefaultConfigForGender, AvatarConfig, Gender, AvatarPartPaths, AvatarColors } from './avatarPartsData';

const App: React.FC = () => {
    const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => getDefaultConfigForGender('male'));
    const babylonSceneRef = useRef<BabylonSceneHandle>(null);
    const [activeMovement, setActiveMovement] = useState<ActiveMovement>({
        forward: false, backward: false, left: false, right: false,
        turnLeft: false, turnRight: false, jump: false, run: false,
        wave: false, dance: false
    });
    
    const [touchMovement, setTouchMovement] = useState<TouchMovement>({ x: 0, y: 0, isMoving: false });
    const [touchRotation, setTouchRotation] = useState<TouchRotation>({ delta: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const [showTouchControls, setShowTouchControls] = useState(true); // Default to true for testing
    const [modelsToLoad, setModelsToLoad] = useState<ModelInfo[]>([]);

    const computedModelsToLoad: ModelInfo[] = useMemo(() => {
        const newModels: ModelInfo[] = [];
        const genderData = availablePartsData[avatarConfig.gender];
        if (!genderData) return [];

        for (const partType in genderData.fixedParts) {
            const path = genderData.fixedParts[partType as keyof typeof genderData.fixedParts];
            if (path) {
                newModels.push({ type: partType, path: path, color: avatarConfig.colors[partType] || genderData.defaultColors[partType] });
            }
        }
        for (const partType in genderData.selectableParts) {
            const path = avatarConfig.parts[partType];
            if (path) {
                newModels.push({ type: partType, path: path, color: avatarConfig.colors[partType] || genderData.defaultColors[partType] });
            }
        }
        return newModels;
    }, [avatarConfig]);

    // Sync computed models to state when avatar config changes
    useEffect(() => {
        setModelsToLoad(computedModelsToLoad);
    }, [computedModelsToLoad]);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                                 (window.innerWidth <= 768 && 'ontouchstart' in window);
            setIsMobile(isMobileDevice);
            setShowTouchControls(isMobileDevice);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle touch movement
    const handleTouchMovement = useCallback((movement: TouchMovement) => {
        console.log('handleTouchMovement called:', movement);
        setTouchMovement(movement);
    }, []);

    // Handle touch rotation
    const handleTouchRotation = useCallback((rotationDelta: number) => {
        setTouchRotation({ delta: rotationDelta });
        // Reset rotation delta after a short time
        setTimeout(() => setTouchRotation({ delta: 0 }), 50);
    }, []);

    const handleGenderChange = useCallback((newGender: Gender) => {
        if (newGender !== avatarConfig.gender) {
            // Dispose all current parts before changing gender
            const currentParts = Object.keys(avatarConfig.parts) as (keyof AvatarPartPaths)[];
            const disposeParts: ModelInfo[] = currentParts.map(partType => ({
                type: partType,
                path: null,
                color: null
            }));
            
            setModelsToLoad(disposeParts);
            
            // Set new gender config after a short delay to ensure disposal
            setTimeout(() => {
                setAvatarConfig(getDefaultConfigForGender(newGender));
            }, 100);
        } else {
            setAvatarConfig(getDefaultConfigForGender(newGender));
        }
    }, [avatarConfig]);

    const handlePartChange = useCallback((partType: string, fileName: string | null) => {
        setAvatarConfig(prev => {
            const newConfig = { ...prev };
            
            // Handle fullset logic
            if (partType === 'fullset') {
                if (fileName) {
                    // When selecting a fullset, clear individual clothing parts
                    newConfig.parts = {
                        ...newConfig.parts,
                        fullset: fileName,
                        top: null,
                        bottom: null
                    };
                } else {
                    // When removing fullset, just clear it
                    newConfig.parts = {
                        ...newConfig.parts,
                        fullset: null
                    };
                }
            } else if (partType === 'top' || partType === 'bottom') {
                // When selecting individual clothing, clear fullset
                if (fileName && newConfig.parts.fullset) {
                    newConfig.parts = {
                        ...newConfig.parts,
                        fullset: null,
                        [partType]: fileName
                    };
                } else {
                    newConfig.parts = {
                        ...newConfig.parts,
                        [partType]: fileName
                    };
                }
            } else {
                // For other parts, just update normally
                newConfig.parts = {
                    ...newConfig.parts,
                    [partType]: fileName
                };
            }
            
            return newConfig;
        });
    }, []);

    const handleColorChange = useCallback((partType: string, color: string) => {
        setAvatarConfig(prev => ({
            ...prev,
            colors: {
                ...prev.colors,
                [partType]: color
            }
        }));
    }, []);

    const handleSaveAvatar = useCallback(() => {
        try {
            // Create a clean config object without null values
            const cleanConfig = {
                gender: avatarConfig.gender,
                parts: Object.fromEntries(
                    Object.entries(avatarConfig.parts).filter(([_, value]) => value !== null)
                ),
                colors: Object.fromEntries(
                    Object.entries(avatarConfig.colors).filter(([_, value]) => value !== null && value !== undefined)
                )
            };
            
            const dataStr = JSON.stringify(cleanConfig, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `avatar-config-${Date.now()}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            alert("Avatar configuration saved successfully!");
        } catch (error) {
            console.error("Error saving avatar config:", error);
            alert("Could not save avatar config. Please try again.");
        }
    }, [avatarConfig]);

    const handleLoadAvatar = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        // Validate file size (max 1MB)
        if (file.size > 1024 * 1024) {
            alert("File too large. Please select a file smaller than 1MB.");
            return;
        }
        
        // Validate file type
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            alert("Please select a valid JSON file.");
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result;
                if (typeof result !== 'string') {
                    throw new Error("Invalid file content");
                }
                
                const loadedConfig = JSON.parse(result) as Partial<AvatarConfig>;
                
                // Validate the loaded config
                if (!loadedConfig.gender || !loadedConfig.parts) {
                    throw new Error("Invalid avatar configuration format");
                }
                
                // Validate gender
                if (!availablePartsData[loadedConfig.gender as Gender]) {
                    throw new Error(`Invalid gender: ${loadedConfig.gender}`);
                }
                
                // Dispose current avatar parts first
                const currentParts = Object.keys(avatarConfig.parts) as (keyof AvatarPartPaths)[];
                const disposeParts: ModelInfo[] = currentParts.map(partType => ({
                    type: partType,
                    path: null,
                    color: null
                }));
                
                setModelsToLoad(disposeParts);
                
                // Apply the loaded configuration after a short delay
                setTimeout(() => {
                    const genderData = availablePartsData[loadedConfig.gender as Gender];
                    const newConfig: AvatarConfig = {
                        gender: loadedConfig.gender as Gender,
                        parts: { ...genderData.selectableParts },
                        colors: { ...genderData.defaultColors }
                    };
                    
                    // Apply loaded parts
                    if (loadedConfig.parts) {
                        for (const [partType, fileName] of Object.entries(loadedConfig.parts)) {
                            if (fileName && typeof fileName === 'string') {
                                // Validate that the part exists for this gender
                                const availableParts = genderData.selectableParts[partType];
                                if (availableParts && availableParts.some(part => part.fileName === fileName)) {
                                    newConfig.parts[partType] = fileName;
                                }
                            }
                        }
                    }
                    
                    // Apply loaded colors
                    if (loadedConfig.colors) {
                        for (const [partType, color] of Object.entries(loadedConfig.colors)) {
                            if (color && typeof color === 'string') {
                                newConfig.colors[partType] = color;
                            }
                        }
                    }
                    
                    setAvatarConfig(newConfig);
                    alert("Avatar configuration loaded successfully!");
                }, 200);
                
            } catch (error) {
                console.error("Error loading avatar config:", error);
                alert(`Could not load avatar config: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        };
        
        reader.readAsText(file);
        event.target.value = ""; // Reset input
    }, [avatarConfig]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.code) {
                case 'KeyW': setActiveMovement(prev => ({ ...prev, forward: true })); break;
                case 'KeyS': setActiveMovement(prev => ({ ...prev, backward: true })); break;
                case 'KeyA': setActiveMovement(prev => ({ ...prev, left: true })); break;
                case 'KeyD': setActiveMovement(prev => ({ ...prev, right: true })); break;
                case 'KeyQ': setActiveMovement(prev => ({ ...prev, turnLeft: true })); break;
                case 'KeyE': setActiveMovement(prev => ({ ...prev, turnRight: true })); break;
                case 'Space': setActiveMovement(prev => ({ ...prev, jump: true })); break;
                case 'ShiftLeft': setActiveMovement(prev => ({ ...prev, run: true })); break;
                case 'Digit1': setActiveMovement(prev => ({ ...prev, wave: true })); break;
                case 'Digit2': setActiveMovement(prev => ({ ...prev, dance: true })); break;
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            switch (event.code) {
                case 'KeyW': setActiveMovement(prev => ({ ...prev, forward: false })); break;
                case 'KeyS': setActiveMovement(prev => ({ ...prev, backward: false })); break;
                case 'KeyA': setActiveMovement(prev => ({ ...prev, left: false })); break;
                case 'KeyD': setActiveMovement(prev => ({ ...prev, right: false })); break;
                case 'KeyQ': setActiveMovement(prev => ({ ...prev, turnLeft: false })); break;
                case 'KeyE': setActiveMovement(prev => ({ ...prev, turnRight: false })); break;
                case 'Space': setActiveMovement(prev => ({ ...prev, jump: false })); break;
                case 'ShiftLeft': setActiveMovement(prev => ({ ...prev, run: false })); break;
                case 'Digit1': setActiveMovement(prev => ({ ...prev, wave: false })); break;
                case 'Digit2': setActiveMovement(prev => ({ ...prev, dance: false })); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const handleResetCamera = () => babylonSceneRef.current?.resetCamera();
    const handleToggleInspector = () => babylonSceneRef.current?.toggleInspector();
    const handleToggleTouchControls = () => setShowTouchControls(!showTouchControls);

    return (
        <div className="app">
            <div className="main-content">
                <div className="scene-container">
                    <BabylonScene 
                        ref={babylonSceneRef} 
                        modelsToLoad={modelsToLoad} 
                        activeMovement={activeMovement}
                        touchMovement={touchMovement}
                        touchRotation={touchRotation}
                    />
                    <TouchController
                        onMovementChange={handleTouchMovement}
                        onRotationChange={handleTouchRotation}
                        isVisible={showTouchControls}
                    />
                </div>
                <div className="controls-container">
                    <AvatarControls
                        avatarConfig={avatarConfig}
                        availableParts={availablePartsData}
                        onGenderChange={handleGenderChange}
                        onPartChange={handlePartChange}
                        onColorChange={handleColorChange}
                        onSaveAvatar={handleSaveAvatar}
                        onLoadAvatar={handleLoadAvatar}
                    />
                    <div className="action-buttons" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <button onClick={handleResetCamera}>Reset Camera View</button>
                        <button onClick={handleToggleInspector} style={{ marginTop: '10px' }}>Toggle Scene Explorer</button>
                        <button 
                            onClick={handleToggleTouchControls}
                            style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '12px' }}
                        >
                            {showTouchControls ? 'Hide' : 'Show'} Touch Controls
                        </button>
                    </div>
                    <div className="movement-instructions" style={{ marginTop: '20px', fontSize: '0.9em', textAlign: 'left', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
                        <strong>Điều khiển:</strong><br />
                        {!isMobile ? (
                            <>
                                W: Tiến, S: Lùi<br />
                                A: Sang trái (Strafe), D: Sang phải (Strafe)<br />
                                Q: Xoay trái, E: Xoay phải<br />
                                Space: Nhảy<br />
                                Shift: Chạy<br />
                                1: Vẫy tay<br />
                                2: Nhảy múa
                            </>
                        ) : (
                            <>
                                🕹️ Joystick: Di chuyển nhân vật<br />
                                👆 Touch màn hình: Xoay nhân vật<br />
                                {showTouchControls ? 'Touch controls đang bật' : 'Touch controls đang tắt'}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;