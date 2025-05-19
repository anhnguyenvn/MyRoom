// src/App.tsx
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'; // Thêm useMemo
import './App.css';
import './AvatarControls.css';
import BabylonScene, { ModelInfo } from './BabylonScene';
import AvatarControls from './AvatarControls';
import { availablePartsData, getDefaultConfigForGender, AvatarConfig, Gender, AvatarPartPaths, AvatarColors } from './avatarPartsData';

const App: React.FC = () => {
    const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => getDefaultConfigForGender('male'));
    const appRenderCountRef = useRef(0); // Debug render count

    useEffect(() => {
        appRenderCountRef.current += 1;
        console.log(`App.tsx render count: ${appRenderCountRef.current}`);
    });

    const modelsToLoad: ModelInfo[] = useMemo(() => {
        console.log("App.tsx: useMemo for modelsToLoad recalculating. Gender:", avatarConfig.gender); //, "Parts:", JSON.stringify(avatarConfig.parts));
        const newModels: ModelInfo[] = [];
        const genderData = availablePartsData[avatarConfig.gender];
        if (!genderData) {
            console.error("App.tsx: Gender data not found in useMemo for modelsToLoad.");
            return [];
        }

        // Fixed parts
        for (const partType in genderData.fixedParts) {
            const path = genderData.fixedParts[partType as keyof typeof genderData.fixedParts];
            if (path) {
                newModels.push({
                    type: partType,
                    path: path,
                    color: avatarConfig.colors[partType] || genderData.defaultColors[partType]
                });
            }
        }
        // Selectable parts
        for (const partType in genderData.selectableParts) {
            const path = avatarConfig.parts[partType];
            if (path) {
                newModels.push({
                    type: partType,
                    path: path,
                    color: avatarConfig.colors[partType] || genderData.defaultColors[partType]
                });
            }
        }
        // console.log("App.tsx: new modelsToLoad calculated:", JSON.stringify(newModels));
        return newModels;
    }, [avatarConfig]);

    const handleGenderChange = useCallback((newGender: Gender) => {
        console.log("App.tsx: handleGenderChange", newGender);
        if (availablePartsData[newGender]) {
            setAvatarConfig(getDefaultConfigForGender(newGender));
        }
    }, []);

    const handlePartChange = useCallback((partType: string, fileName: string | null) => {
        console.log("App.tsx: handlePartChange", partType, fileName);
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
        console.log("App.tsx: handleColorChange", partType, color);
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
                    console.log("App.tsx: Loaded config from JSON:", loaded);

                    if (loaded.gender && availablePartsData[loaded.gender] && loaded.parts && loaded.colors) {
                        const baseConfig = getDefaultConfigForGender(loaded.gender);
                        const validatedConfig: AvatarConfig = {
                            gender: loaded.gender,
                            parts: { ...baseConfig.parts }, // Start with default parts
                            colors: { ...baseConfig.colors }, // Start with default colors
                        };

                        // Validate and merge parts
                        for (const partKey in loaded.parts) {
                            if (validatedConfig.parts.hasOwnProperty(partKey)) { // Check if partType is valid
                                const loadedFile = loaded.parts[partKey];
                                const selectablePartsForGender = availablePartsData[loaded.gender].selectableParts;
                                if (selectablePartsForGender.hasOwnProperty(partKey)) { // Is it a selectable part?
                                    const isValid = (selectablePartsForGender[partKey as keyof typeof selectablePartsForGender] || [])
                                        .some(p => p.fileName === loadedFile);
                                    if (isValid || loadedFile === null) { // Allow null for "None"
                                        validatedConfig.parts[partKey] = loadedFile;
                                    } else {
                                        console.warn(`App.tsx: Loaded part ${loadedFile} for ${partKey} is invalid. Using default.`);
                                    }
                                }
                                // Fixed parts are taken from baseConfig and shouldn't be overridden unless explicitly managed
                            }
                        }
                        // Merge colors
                        for (const colorKey in loaded.colors) {
                             // Only apply color if part type is known or if the part is actually selected in the validated config
                            if (validatedConfig.colors.hasOwnProperty(colorKey) || (validatedConfig.parts[colorKey] !== null && validatedConfig.parts[colorKey] !== undefined)) {
                                validatedConfig.colors[colorKey] = loaded.colors[colorKey];
                            }
                        }
                        console.log("App.tsx: Setting validated config:", validatedConfig);
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
            if (event.target) event.target.value = ""; // Reset input
        }
    }, []); // Empty dependency array, this function doesn't change

    return (
        <div className="App">
            <header className="App-header"><h1>Avatar Customizer</h1></header>
            <div className="main-content">
                <div className="scene-container"><BabylonScene modelsToLoad={modelsToLoad} /></div>
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
                </div>
            </div>
        </div>
    );
};

export default App;