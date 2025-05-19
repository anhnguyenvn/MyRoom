// src/AvatarControls.tsx
import React from 'react';
import { AvatarConfig, AvailableParts, Gender, getDefaultConfigForGender } from './avatarPartsData';

interface AvatarControlsProps {
    currentConfig: AvatarConfig;
    availableParts: AvailableParts;
    onGenderChange: (newGender: Gender) => void;
    onPartChange: (partType: string, fileName: string | null) => void;
    onColorChange: (partType: string, color: string) => void;
    onSaveAvatar: () => void;
    onLoadAvatar: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const AvatarControls: React.FC<AvatarControlsProps> = ({
    currentConfig,
    availableParts,
    onGenderChange,
    onPartChange,
    onColorChange,
    onSaveAvatar,
    onLoadAvatar
}) => {
    const currentGenderData = availableParts[currentConfig.gender];

    if (!currentConfig || !currentGenderData) {
        // Attempt to use a fallback or show loading, though App.tsx should ensure valid currentConfig
        const fallbackGender: Gender = 'male';
        const tempConfig = currentConfig || getDefaultConfigForGender(fallbackGender);
        if (!availableParts[tempConfig.gender]) {
            return <div className="controls-panel">Error: Core avatar data unavailable.</div>;
        }
        // This state indicates a deeper issue if App.tsx isn't providing a valid config.
        return <div className="controls-panel">Loading configuration...</div>;
    }

    return (
        <div className="controls-panel">
            <h3>Customize Avatar</h3>
            <div className="control-group">
                <label htmlFor="gender-select">Gender:</label>
                <select
                    id="gender-select"
                    value={currentConfig.gender}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onGenderChange(e.target.value as Gender)}
                >
                    {(Object.keys(availableParts) as Gender[]).map(genderKey => (
                        <option key={genderKey} value={genderKey}>
                            {genderKey.charAt(0).toUpperCase() + genderKey.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {(Object.keys(currentGenderData.selectableParts) as Array<keyof typeof currentGenderData.selectableParts>).map(partType => {
                const items = currentGenderData.selectableParts[partType] || [];
                const currentPartFileName = currentConfig.parts[partType] ?? "null";

                return (
                    <div className="control-group" key={partType}>
                        <label htmlFor={`${partType}-select`}>
                            {partType.charAt(0).toUpperCase() + partType.slice(1)}:
                        </label>
                        <select
                            id={`${partType}-select`}
                            value={currentPartFileName}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                onPartChange(partType, e.target.value === "null" ? null : e.target.value)
                            }
                        >
                            {items.map((item, index) => (
                                <option
                                    key={`${partType}-${item.name}-${index}`}
                                    value={item.fileName === null ? "null" : item.fileName!}
                                >
                                    {item.name}
                                </option>
                            ))}
                        </select>

                        {currentPartFileName && currentPartFileName !== "null" && (
                            <div className="color-picker-group">
                                <label htmlFor={`${partType}-color`}>Color:</label>
                                <input
                                    type="color"
                                    id={`${partType}-color`}
                                    value={currentConfig.colors[partType] || currentGenderData.defaultColors[partType as keyof typeof currentGenderData.defaultColors] || '#FFFFFF'}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onColorChange(partType, e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                );
            })}

            <div className="action-buttons">
                <button onClick={onSaveAvatar}>Save Avatar (JSON)</button>
                <label htmlFor="load-avatar-input" className="button-like-label">Load Avatar (JSON)</label>
                <input id="load-avatar-input" type="file" accept=".json" onChange={onLoadAvatar} style={{ display: 'none' }}/>
            </div>
        </div>
    );
};

export default AvatarControls;