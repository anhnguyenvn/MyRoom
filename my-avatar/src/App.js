// src/App.js
import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import './AvatarControls.css';
import BabylonScene from './BabylonScene';
import AvatarControls from './AvatarControls';
import { availablePartsData, getDefaultConfigForGender } from './avatarPartsData';

function App() {
    const [avatarConfig, setAvatarConfig] = useState(() => getDefaultConfigForGender('male'));
    const [modelsToLoad, setModelsToLoad] = useState([]);

    useEffect(() => {
        const newModelsToLoad = [];
        const currentGenderData = availablePartsData[avatarConfig.gender];

        if (!currentGenderData) {
            console.error("Current gender data not found in App.js useEffect for modelsToLoad");
            return;
        }

        // Add fixed parts
        for (const partType in currentGenderData.fixedParts) {
            const path = currentGenderData.fixedParts[partType];
            if (path) {
                newModelsToLoad.push({
                    type: partType,
                    path: path,
                    color: avatarConfig.colors[partType] || currentGenderData.defaultColors[partType]
                });
            }
        }

        // Add selectable parts that are currently selected (path is not null)
        for (const partType in currentGenderData.selectableParts) {
            const path = avatarConfig.parts[partType];
            if (path) { // Only add if a part is selected (path is not null)
                newModelsToLoad.push({
                    type: partType,
                    path: path,
                    color: avatarConfig.colors[partType] || currentGenderData.defaultColors[partType]
                });
            }
        }
        setModelsToLoad(newModelsToLoad);
    }, [avatarConfig]);


    const handleGenderChange = useCallback((newGender) => {
        if (availablePartsData[newGender]) {
            setAvatarConfig(getDefaultConfigForGender(newGender));
        } else {
            console.error(`Attempted to switch to an invalid gender: ${newGender}`);
        }
    }, []);

    const handlePartChange = useCallback((partType, fileName) => {
        setAvatarConfig(prevConfig => {
            const newParts = {
                ...prevConfig.parts,
                [partType]: fileName,
            };
            // Khi đổi bộ phận, giữ màu cũ nếu có, nếu không thì lấy màu mặc định cho bộ phận đó của gender hiện tại
            const newColors = { ...prevConfig.colors };
            if (!newColors[partType] && fileName !== null) { // Nếu chưa có màu và đã chọn 1 bộ phận
                newColors[partType] = availablePartsData[prevConfig.gender]?.defaultColors?.[partType] || '#FFFFFF';
            } else if (fileName === null) { // Nếu bỏ chọn bộ phận, có thể xóa màu của nó hoặc giữ lại
                 delete newColors[partType]; // Xóa màu nếu bỏ chọn bộ phận
            }

            return {
                ...prevConfig,
                parts: newParts,
                colors: newColors
            };
        });
    }, []);

    const handleColorChange = useCallback((partType, color) => {
        setAvatarConfig(prevConfig => ({
            ...prevConfig,
            colors: {
                ...prevConfig.colors,
                [partType]: color,
            }
        }));
    }, []);

    const handleSaveAvatar = () => {
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
            alert("Could not save avatar configuration.");
        }
    };

    const handleLoadAvatar = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const loadedConfig = JSON.parse(e.target.result);
                    if (loadedConfig.gender && availablePartsData[loadedConfig.gender] && loadedConfig.parts && loadedConfig.colors) {
                        // Deep clone và validate
                        const validatedConfig = JSON.parse(JSON.stringify(getDefaultConfigForGender(loadedConfig.gender)));
                        validatedConfig.gender = loadedConfig.gender;

                        // Merge parts and colors from loaded file, ensuring they are valid
                        for(const partType in validatedConfig.parts) {
                            if(loadedConfig.parts.hasOwnProperty(partType)) {
                                // For selectable parts, check if the loaded fileName is valid
                                if(availablePartsData[loadedConfig.gender].selectableParts.hasOwnProperty(partType)) {
                                    const isValidPart = availablePartsData[loadedConfig.gender].selectableParts[partType].some(p => p.fileName === loadedConfig.parts[partType]);
                                    if(isValidPart || loadedConfig.parts[partType] === null) {
                                        validatedConfig.parts[partType] = loadedConfig.parts[partType];
                                    } else {
                                        console.warn(`Loaded part ${loadedConfig.parts[partType]} for ${partType} is invalid. Using default.`);
                                    }
                                } else if (availablePartsData[loadedConfig.gender].fixedParts.hasOwnProperty(partType)) {
                                    // Fixed parts are always taken from definition, but this check is for completeness
                                     validatedConfig.parts[partType] = availablePartsData[loadedConfig.gender].fixedParts[partType];
                                }
                            }
                        }
                        for(const colorType in validatedConfig.colors) {
                            if(loadedConfig.colors.hasOwnProperty(colorType)) {
                                validatedConfig.colors[colorType] = loadedConfig.colors[colorType];
                            }
                        }
                         // Add any extra colors from loaded file that might not be in default template (e.g. for parts not in default)
                        for(const loadedColorType in loadedConfig.colors) {
                            if(!validatedConfig.colors.hasOwnProperty(loadedColorType)) {
                                validatedConfig.colors[loadedColorType] = loadedConfig.colors[loadedColorType];
                            }
                        }


                        setAvatarConfig(validatedConfig);
                    } else {
                        alert("Invalid or incomplete avatar configuration file.");
                    }
                } catch (error) {
                    console.error("Error parsing JSON file:", error);
                    alert("Invalid JSON file format.");
                }
            };
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                alert("Could not read the selected file.");
            };
            reader.readAsText(file);
            event.target.value = null;
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Avatar Customizer</h1>
            </header>
            <div className="main-content">
                <div className="scene-container">
                    <BabylonScene modelsToLoad={modelsToLoad} />
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
                </div>
            </div>
        </div>
    );
}

export default App;