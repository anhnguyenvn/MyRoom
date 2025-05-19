// src/App.tsx
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import './App.css';
import './AvatarControls.css';
import BabylonScene, { ModelInfo, BabylonSceneHandle } from './BabylonScene';
import AvatarControls from './AvatarControls';
import { availablePartsData, getDefaultConfigForGender, AvatarConfig, Gender, AvatarPartPaths, AvatarColors } from './avatarPartsData';

const App: React.FC = () => {
    const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => getDefaultConfigForGender('male'));
    const babylonSceneRef = useRef<BabylonSceneHandle>(null);

    const modelsToLoad: ModelInfo[] = useMemo(() => {
        const newModels: ModelInfo[] = [];
        const genderData = availablePartsData[avatarConfig.gender];
        if (!genderData) return [];

        for (const partType in genderData.fixedParts) {
            const path = genderData.fixedParts[partType as keyof typeof genderData.fixedParts];
            if (path) {
                newModels.push({
                    type: partType, path: path,
                    color: avatarConfig.colors[partType] || genderData.defaultColors[partType]
                });
            }
        }
        for (const partType in genderData.selectableParts) {
            const path = avatarConfig.parts[partType];
            if (path) {
                newModels.push({
                    type: partType, path: path,
                    color: avatarConfig.colors[partType] || genderData.defaultColors[partType]
                });
            }
        }
        return newModels;
    }, [avatarConfig]);

    const handleGenderChange = useCallback((newGender: Gender) => {
        if (availablePartsData[newGender]) {
            setAvatarConfig(getDefaultConfigForGender(newGender));
        }
    }, []);

    const handlePartChange = useCallback((partType: string, fileName: string | null) => {
        setAvatarConfig(prevConfig => {
            const newParts: AvatarPartPaths = { ...prevConfig.parts, [partType]: fileName };
            const newColors: AvatarColors = { ...prevConfig.colors };
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
            ...prevConfig,
            colors: { ...prevConfig.colors, [partType]: color }
        }));
    }, []);

    const handleSaveAvatar = useCallback(() => {
        try {
            const jsonString = JSON.stringify(avatarConfig, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `avatar_config_${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Error saving avatar:", error);
            alert("Could not save avatar config.");
        }
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
                            gender: loaded.gender,
                            parts: { ...baseConfig.parts },
                            colors: { ...baseConfig.colors },
                        };

                        for (const partKey in loaded.parts) {
                            if (validatedConfig.parts.hasOwnProperty(partKey)) {
                                const loadedFile = loaded.parts[partKey];
                                const selectablePartsForGender = availablePartsData[loaded.gender].selectableParts;
                                if (selectablePartsForGender.hasOwnProperty(partKey)) {
                                    const isValid = (selectablePartsForGender[partKey as keyof typeof selectablePartsForGender] || [])
                                        .some(p => p.fileName === loadedFile);
                                    if (isValid || loadedFile === null) {
                                        validatedConfig.parts[partKey] = loadedFile;
                                    } else {
                                        // Giữ giá trị mặc định từ baseConfig nếu không hợp lệ
                                    }
                                }
                            }
                        }
                        for (const colorKey in loaded.colors) {
                            if (validatedConfig.colors.hasOwnProperty(colorKey) || (validatedConfig.parts[colorKey] !== null && validatedConfig.parts[colorKey] !== undefined)) {
                                validatedConfig.colors[colorKey] = loaded.colors[colorKey];
                            }
                        }
                        setAvatarConfig(validatedConfig);
                    } else {
                        alert("Invalid avatar config file structure or gender.");
                    }
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

    const handleResetCamera = () => {
        babylonSceneRef.current?.resetCamera();
    };

    const handleToggleInspector = () => {
        babylonSceneRef.current?.toggleInspector();
    };

    return (
        <div className="App">
            <header className="App-header"><h1>Avatar Customizer</h1></header>
            <div className="main-content">
                <div className="scene-container">
                    <BabylonScene ref={babylonSceneRef} modelsToLoad={modelsToLoad} />
                </div>
                <div className="controls-container">
                    <AvatarControls
                        currentConfig={avatarConfig}
                        availableParts={availablePartsData}
                        onGenderChange={handleGenderChange}
                        onPartChange={handlePartChange}
                        onColorChange={handleColorChange}
                        onSaveAvatar={handleSaveAvatar}
                        onLoadAvatar={handleLoadAvatar}
                    />
                    <div className="action-buttons" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <button onClick={handleResetCamera}>Reset Camera View</button>
                        <button onClick={handleToggleInspector} style={{marginTop: '10px'}}>
                            Toggle Scene Explorer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;