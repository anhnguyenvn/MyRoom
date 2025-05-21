// src/App.tsx
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import './App.css';
import './AvatarControls.css';
import BabylonScene, { ModelInfo, BabylonSceneHandle, ActiveMovement } from './BabylonScene';
import AvatarControls from './AvatarControls';
import { availablePartsData, getDefaultConfigForGender, AvatarConfig, Gender, AvatarPartPaths, AvatarColors } from './avatarPartsData';

const App: React.FC = () => {
    const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => getDefaultConfigForGender('male'));
    const babylonSceneRef = useRef<BabylonSceneHandle>(null);
    const [activeMovement, setActiveMovement] = useState<ActiveMovement>({
        forward: false, backward: false, left: false, right: false, turnLeft: false, turnRight: false
    });

    const modelsToLoad: ModelInfo[] = useMemo(() => {
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

    const handleGenderChange = useCallback((newGender: Gender) => {
        if (availablePartsData[newGender]) {
            // Dispose tất cả các part hiện tại trước khi load gender mới
            const currentConfig = avatarConfig;
            const currentGenderData = availablePartsData[currentConfig.gender];
            
            // Dispose tất cả các selectable parts
            for (const partType in currentGenderData.selectableParts) {
                if (currentConfig.parts[partType]) {
                    // Gọi dispose thông qua BabylonScene ref
                    babylonSceneRef.current?.disposePart?.(partType);
                }
            }

            // Dispose các fixed parts
            for (const partType in currentGenderData.fixedParts) {
                if (currentConfig.parts[partType]) {
                    babylonSceneRef.current?.disposePart?.(partType);
                }
            }

            // Load cấu hình mới cho gender mới
            setAvatarConfig(getDefaultConfigForGender(newGender));
        }
    }, [avatarConfig]);

    const handlePartChange = useCallback((partType: string, fileName: string | null) => {
        setAvatarConfig(prevConfig => {
            const newParts: AvatarPartPaths = { ...prevConfig.parts };
            const newColors: AvatarColors = { ...prevConfig.colors };

            // Nếu đang chọn fullset, set các part liên quan về null
            if (partType === 'fullset') {
                newParts.top = null;
                newParts.bottom = null;
                newParts.shoes = null;
                // Xóa màu của các part đã bị disable
                delete newColors.top;
                delete newColors.bottom;
                delete newColors.shoes;
            }
            // Nếu đang chọn một clothing part và đang có fullset, set fullset về null
            else if (['top', 'bottom', 'shoes'].includes(partType) && newParts.fullset) {
                newParts.fullset = null;
                delete newColors.fullset;
            }

            // Cập nhật part được chọn
            newParts[partType] = fileName;

            // Xử lý màu sắc
            const defaultColorForPart = availablePartsData[prevConfig.gender]?.defaultColors?.[partType];
            if (fileName !== null && !newColors[partType]) {
                newColors[partType] = defaultColorForPart || '#FFFFFF';
            } else if (fileName === null) {
                delete newColors[partType];
            }

            return { ...prevConfig, parts: newParts, colors: newColors };
        });
    }, []);

    const handleColorChange = useCallback((partType: string, color: string) => {
        setAvatarConfig(prevConfig => ({
            ...prevConfig, colors: { ...prevConfig.colors, [partType]: color }
        }));
    }, []);

    const handleSaveAvatar = useCallback(() => {
        try {
            const jsonString = JSON.stringify(avatarConfig, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `avatar_config_${Date.now()}.json`;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) { console.error("Error saving avatar:", error); alert("Could not save avatar config."); }
    }, [avatarConfig]);

    const handleLoadAvatar = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    if (typeof e.target?.result !== 'string') throw new Error("File content not string.");
                    const loaded: AvatarConfig = JSON.parse(e.target.result);
                    if (loaded.gender && availablePartsData[loaded.gender] && loaded.parts && loaded.colors) {
                        const baseConfig = getDefaultConfigForGender(loaded.gender);
                        const validatedConfig: AvatarConfig = {
                            gender: loaded.gender, parts: { ...baseConfig.parts }, colors: { ...baseConfig.colors },
                        };
                        for (const partKey in loaded.parts) {
                            if (validatedConfig.parts.hasOwnProperty(partKey)) {
                                const loadedFile = loaded.parts[partKey];
                                const selectablePartsForGender = availablePartsData[loaded.gender].selectableParts;
                                if (selectablePartsForGender.hasOwnProperty(partKey)) {
                                    const isValid = (selectablePartsForGender[partKey as keyof typeof selectablePartsForGender] || [])
                                        .some(p => p.fileName === loadedFile);
                                    if (isValid || loadedFile === null) validatedConfig.parts[partKey] = loadedFile;
                                }
                            }
                        }
                        for (const colorKey in loaded.colors) {
                            if (validatedConfig.colors.hasOwnProperty(colorKey) || (validatedConfig.parts[colorKey] !== null && validatedConfig.parts[colorKey] !== undefined)) {
                                validatedConfig.colors[colorKey] = loaded.colors[colorKey];
                            }
                        }
                        setAvatarConfig(validatedConfig);
                    } else { alert("Invalid avatar config file structure or gender."); }
                } catch (err) {
                    console.error("Error parsing JSON:", err);
                    alert(`Invalid JSON: ${err instanceof Error ? err.message : "Unknown error"}`);
                }
            };
            reader.onerror = () => alert("Could not read file.");
            reader.readAsText(file);
            if (event.target) event.target.value = "";
        }
    }, []);

    useEffect(() => {
        const keyMap: Record<string, keyof ActiveMovement | null> = {
            w: 'forward', s: 'backward', a: 'left', d: 'right', q: 'turnLeft', e: 'turnRight'
        };
        const handleKeyAction = (event: KeyboardEvent, isActive: boolean) => {
            const action = keyMap[event.key.toLowerCase()];
            if (action) {
                // Ngăn hành vi mặc định của trình duyệt cho các phím mũi tên, space, v.v. nếu chúng được dùng để di chuyển
                if (['w', 's', 'a', 'd', 'q', 'e'].includes(event.key.toLowerCase())) {
                    event.preventDefault();
                }
                setActiveMovement(prev => {
                    if (prev[action] !== isActive) return { ...prev, [action]: isActive };
                    return prev;
                });
            }
        };
        const onKeyDown = (e: KeyboardEvent) => handleKeyAction(e, true);
        const onKeyUp = (e: KeyboardEvent) => handleKeyAction(e, false);

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, []);

    const handleResetCamera = () => babylonSceneRef.current?.resetCamera();
    const handleToggleInspector = () => babylonSceneRef.current?.toggleInspector();

    return (
        <div className="App">
            <header className="App-header"><h1>Avatar Customizer</h1></header>
            <div className="main-content">
                <div className="scene-container">
                    <BabylonScene ref={babylonSceneRef} modelsToLoad={modelsToLoad} activeMovement={activeMovement} />
                </div>
                <div className="controls-container">
                    <AvatarControls
                        currentConfig={avatarConfig} availableParts={availablePartsData}
                        onGenderChange={handleGenderChange} onPartChange={handlePartChange}
                        onColorChange={handleColorChange} onSaveAvatar={handleSaveAvatar}
                        onLoadAvatar={handleLoadAvatar}
                    />
                    <div className="action-buttons" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <button onClick={handleResetCamera}>Reset Camera View</button>
                        <button onClick={handleToggleInspector} style={{ marginTop: '10px' }}>Toggle Scene Explorer</button>
                    </div>
                    <div className="movement-instructions" style={{ marginTop: '20px', fontSize: '0.9em', textAlign: 'left', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
                        <strong>Điều khiển:</strong><br />
                        W: Tiến, S: Lùi<br />
                        A: Sang trái (Strafe), D: Sang phải (Strafe)<br />
                        Q: Xoay trái, E: Xoay phải
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;