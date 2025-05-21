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
        forward: false, backward: false, left: false, right: false,
        turnLeft: false, turnRight: false, jump: false, run: false,
        wave: false, dance: false
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
            // Tạo một bản sao của config để loại bỏ các trường không cần thiết
            const configToSave = {
                gender: avatarConfig.gender,
                parts: { ...avatarConfig.parts },
                colors: { ...avatarConfig.colors }
            };

            // Loại bỏ các part null và color không cần thiết
            Object.keys(configToSave.parts).forEach(key => {
                if (configToSave.parts[key] === null) {
                    delete configToSave.parts[key];
                }
            });

            Object.keys(configToSave.colors).forEach(key => {
                if (!configToSave.parts[key]) {
                    delete configToSave.colors[key];
                }
            });

            const jsonString = JSON.stringify(configToSave, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `avatar_${avatarConfig.gender}_${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Error saving avatar:", error);
            alert("Could not save avatar config. Please try again.");
        }
    }, [avatarConfig]);

    const handleLoadAvatar = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Kiểm tra kích thước file (giới hạn 1MB)
        if (file.size > 1024 * 1024) {
            alert("File is too large. Maximum size is 1MB.");
            event.target.value = "";
            return;
        }

        // Kiểm tra loại file
        if (file.type !== "application/json") {
            alert("Please select a valid JSON file.");
            event.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (typeof e.target?.result !== 'string') {
                    throw new Error("File content is not a string");
                }

                const loaded: AvatarConfig = JSON.parse(e.target.result);

                // Validate cấu trúc cơ bản
                if (!loaded.gender || !loaded.parts || !loaded.colors) {
                    throw new Error("Invalid avatar config structure");
                }

                // Validate gender
                if (!availablePartsData[loaded.gender]) {
                    throw new Error(`Invalid gender: ${loaded.gender}`);
                }

                // Dispose tất cả các part hiện tại
                const currentConfig = avatarConfig;
                const currentGenderData = availablePartsData[currentConfig.gender];
                
                // Dispose selectable parts
                for (const partType in currentGenderData.selectableParts) {
                    if (currentConfig.parts[partType]) {
                        babylonSceneRef.current?.disposePart?.(partType);
                    }
                }

                // Dispose fixed parts
                for (const partType in currentGenderData.fixedParts) {
                    if (currentConfig.parts[partType]) {
                        babylonSceneRef.current?.disposePart?.(partType);
                    }
                }

                // Tạo config mới với validation
                const baseConfig = getDefaultConfigForGender(loaded.gender);
                const validatedConfig: AvatarConfig = {
                    gender: loaded.gender,
                    parts: { ...baseConfig.parts },
                    colors: { ...baseConfig.colors }
                };

                // Validate và set parts
                const selectablePartsForGender = availablePartsData[loaded.gender].selectableParts;
                for (const partKey in loaded.parts) {
                    if (validatedConfig.parts.hasOwnProperty(partKey)) {
                        const loadedFile = loaded.parts[partKey];
                        if (selectablePartsForGender.hasOwnProperty(partKey)) {
                            const isValid = (selectablePartsForGender[partKey as keyof typeof selectablePartsForGender] || [])
                                .some(p => p.fileName === loadedFile);
                            if (isValid || loadedFile === null) {
                                validatedConfig.parts[partKey] = loadedFile;
                            } else {
                                console.warn(`Invalid file for part ${partKey}: ${loadedFile}`);
                                validatedConfig.parts[partKey] = null;
                            }
                        }
                    }
                }

                // Validate và set colors
                for (const colorKey in loaded.colors) {
                    if (validatedConfig.parts[colorKey] && loaded.colors[colorKey]) {
                        // Validate color format
                        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
                        if (colorRegex.test(loaded.colors[colorKey])) {
                            validatedConfig.colors[colorKey] = loaded.colors[colorKey];
                        } else {
                            console.warn(`Invalid color format for ${colorKey}: ${loaded.colors[colorKey]}`);
                            validatedConfig.colors[colorKey] = baseConfig.colors[colorKey] || '#FFFFFF';
                        }
                    }
                }

                // Xử lý fullset và clothing parts
                if (validatedConfig.parts.fullset) {
                    validatedConfig.parts.top = null;
                    validatedConfig.parts.bottom = null;
                    validatedConfig.parts.shoes = null;
                    delete validatedConfig.colors.top;
                    delete validatedConfig.colors.bottom;
                    delete validatedConfig.colors.shoes;
                }

                setAvatarConfig(validatedConfig);
                alert("Avatar loaded successfully!");
            } catch (err) {
                console.error("Error loading avatar:", err);
                alert(`Error loading avatar: ${err instanceof Error ? err.message : "Unknown error"}`);
            }
        };

        reader.onerror = () => {
            alert("Error reading file. Please try again.");
        };

        reader.readAsText(file);
        event.target.value = ""; // Reset input
    }, [avatarConfig]);

    useEffect(() => {
        const keyMap: Record<string, keyof ActiveMovement | null> = {
            w: 'forward', s: 'backward', a: 'left', d: 'right',
            q: 'turnLeft', e: 'turnRight', ' ': 'jump', shift: 'run',
            '1': 'wave', '2': 'dance'
        };

        const handleKeyAction = (event: KeyboardEvent, isActive: boolean) => {
            // Chỉ xử lý khi canvas đang được focus
            const canvas = document.querySelector('canvas');
            if (!canvas || document.activeElement !== canvas) return;

            const action = keyMap[event.key.toLowerCase()];
            if (action) {
                event.preventDefault();
                event.stopPropagation();
                setActiveMovement(prev => {
                    if (prev[action] !== isActive) {
                        console.log(`Setting ${action} to ${isActive}`);
                        return { ...prev, [action]: isActive };
                    }
                    return prev;
                });
            }
        };

        const onKeyDown = (e: KeyboardEvent) => handleKeyAction(e, true);
        const onKeyUp = (e: KeyboardEvent) => handleKeyAction(e, false);

        window.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('keyup', onKeyUp, true);

        // Thêm click handler để focus canvas
        const handleCanvasClick = () => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
                canvas.focus();
                console.log('Canvas focused via click');
            }
        };

        document.addEventListener('click', handleCanvasClick);

        return () => {
            window.removeEventListener('keydown', onKeyDown, true);
            window.removeEventListener('keyup', onKeyUp, true);
            document.removeEventListener('click', handleCanvasClick);
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
                        Q: Xoay trái, E: Xoay phải<br />
                        Space: Nhảy<br />
                        Shift: Chạy<br />
                        1: Vẫy tay<br />
                        2: Nhảy múa
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;