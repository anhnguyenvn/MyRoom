// src/BabylonScene.tsx
import React, { useEffect, useRef, memo, forwardRef, useImperativeHandle, useState } from 'react';
import {
    Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, SceneLoader,
    StandardMaterial, Color3, Tools, AbstractMesh, AnimationGroup, Nullable,
    IParticleSystem, Material, PBRMaterial, MeshBuilder,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import '@babylonjs/inspector'; // Quan trọng: Import inspector để kích hoạt scene.debugLayer

export interface ModelInfo {
    type: string;
    path: string | null;
    color?: string;
}

interface BabylonSceneProps {
    modelsToLoad: ModelInfo[];
}

interface LoadedPartEntry {
    meshes: AbstractMesh[];
    animationGroups: AnimationGroup[];
}

export interface BabylonSceneHandle {
    resetCamera: () => void;
    toggleInspector: () => void;
}

const BabylonScene = forwardRef<BabylonSceneHandle, BabylonSceneProps>(({ modelsToLoad }, ref) => {
    const reactCanvas = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Nullable<Engine>>(null);
    const sceneRef = useRef<Nullable<Scene>>(null);
    const cameraRef = useRef<Nullable<ArcRotateCamera>>(null);
    const loadedPartsRef = useRef<Record<string, LoadedPartEntry>>({});
    const [isInspectorVisible, setIsInspectorVisible] = useState(false);

    const defaultCameraAlpha = -Math.PI / 1.5;
    const defaultCameraBeta = Math.PI / 2.5;
    const defaultCameraRadius = 2.5;
    const defaultCameraTarget = new Vector3(0, 1.0, 0);

    const resetCameraLocal = () => {
        if (cameraRef.current) {
            cameraRef.current.alpha = defaultCameraAlpha;
            cameraRef.current.beta = defaultCameraBeta;
            cameraRef.current.radius = defaultCameraRadius;
            cameraRef.current.setTarget(defaultCameraTarget.clone());
        }
    };

    useImperativeHandle(ref, () => ({
        resetCamera: resetCameraLocal,
        toggleInspector: () => {
            if (sceneRef.current) {
                if (isInspectorVisible) {
                    sceneRef.current.debugLayer.hide();
                    setIsInspectorVisible(false);
                    console.log("BabylonScene: Inspector hidden.");
                } else {
                    sceneRef.current.debugLayer.show({
                        embedMode: true, // Cho phép nhúng tốt hơn
                        // enableClose: true, // Nút đóng mặc định của inspector
                        // globalRoot: document.body, // Phần tử DOM để gắn inspector vào
                    }).then(() => {
                        console.log("BabylonScene: Inspector shown.");
                    }).catch(error => {
                        console.error("BabylonScene: Error showing inspector:", error);
                    });
                    setIsInspectorVisible(true);
                }
            } else {
                console.warn("BabylonScene: Scene not available to toggle inspector.");
            }
        }
    }));

    const clearMeshesForType = (partType: string) => {
        const partEntry = loadedPartsRef.current[partType];
        if (partEntry) {
            partEntry.animationGroups?.forEach(ag => ag.dispose());
            partEntry.meshes?.forEach(mesh => {
                if (sceneRef.current?.particleSystems) {
                    sceneRef.current.particleSystems = sceneRef.current.particleSystems.filter(ps => {
                        if (ps.emitter === mesh || (ps.emitter instanceof AbstractMesh && ps.emitter.parent === mesh)) {
                            ps.dispose(); return false;
                        }
                        return true;
                    });
                }
                if (mesh.skeleton && sceneRef.current?.debugLayer?.getSkeletonViewers) {
                    const viewer = sceneRef.current.debugLayer.getSkeletonViewers().find(v => v.skeleton === mesh.skeleton);
                    viewer?.dispose();
                }
                if (!mesh.isDisposed()) mesh.dispose(false, true);
            });
            delete loadedPartsRef.current[partType];
        }
    };

    const loadModel = async (partType: string, path: string, colorValue?: string) => {
        if (!sceneRef.current) return;
        clearMeshesForType(partType);

        try {
            const result = await SceneLoader.ImportMeshAsync(
                null, Tools.GetFolderPath(path), Tools.GetFilename(path), sceneRef.current
            );

            if (result.meshes?.length > 0) {
                loadedPartsRef.current[partType] = {
                    meshes: result.meshes,
                    animationGroups: result.animationGroups || [],
                };
                result.meshes.forEach(mesh => {
                    if (!mesh.material && sceneRef.current) {
                        mesh.material = new StandardMaterial(`${partType}_mat_${mesh.name}`, sceneRef.current);
                    }
                    if (colorValue && mesh.material) {
                        const babylonColor = Color3.FromHexString(colorValue);
                        const material = mesh.material as Material;
                        if (material instanceof StandardMaterial) {
                            material.diffuseColor = babylonColor;
                        } else if (material instanceof PBRMaterial) {
                            material.albedoColor = babylonColor;
                        } else if ('albedoColor' in material) {
                             (material as any).albedoColor = babylonColor;
                        } else if ('diffuseColor' in material) {
                             (material as any).diffuseColor = babylonColor;
                        }
                    }
                });
            }
        } catch (error) {
            console.error(`BabylonScene: Error loading ${partType} from ${path}:`, error);
            clearMeshesForType(partType);
        }
    };

    useEffect(() => {
        if (reactCanvas.current && !engineRef.current) {
            const babylonEngine = new Engine(reactCanvas.current, true, { preserveDrawingBuffer: true, stencil: true, antialias: true });
            engineRef.current = babylonEngine;
            const babylonScene = new Scene(babylonEngine);
            sceneRef.current = babylonScene;

            const camera = new ArcRotateCamera(
                "camera",
                defaultCameraAlpha,
                defaultCameraBeta,
                defaultCameraRadius,
                defaultCameraTarget.clone(),
                babylonScene
            );
            camera.attachControl(reactCanvas.current, false);
            camera.lowerRadiusLimit = 0.5;
            camera.upperRadiusLimit = 10;
            camera.wheelDeltaPercentage = 0.01;
            camera.minZ = 0.1;
            camera.lowerBetaLimit = Math.PI * 0.1;
            camera.upperBetaLimit = Math.PI * 0.9;
            camera.panningSensibility = 1000;
            camera.panningDistanceLimit = camera.radius * 2; // Giới hạn dựa trên zoom hiện tại
            camera.panningInertia = 0.85;
            camera.inertia = 0.85;
            cameraRef.current = camera;

            const light1 = new HemisphericLight("light1", new Vector3(0.8, 1, 0.5), babylonScene);
            light1.intensity = 0.9;
            const light2 = new HemisphericLight("light2", new Vector3(-0.8, 0.5, -0.5), babylonScene);
            light2.intensity = 0.4;

            const ground = MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, babylonScene);
            const groundMaterial = new StandardMaterial("groundMaterial", babylonScene);
            groundMaterial.diffuseColor = new Color3(0.6, 0.6, 0.6);
            groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
            ground.material = groundMaterial;

            babylonEngine.runRenderLoop(() => sceneRef.current?.render());
            const resize = () => babylonEngine.resize();
            window.addEventListener('resize', resize);

            return () => {
                window.removeEventListener('resize', resize);
                if (sceneRef.current && isInspectorVisible) {
                    sceneRef.current.debugLayer.hide();
                }
                if (sceneRef.current) {
                    Object.keys(loadedPartsRef.current).forEach(clearMeshesForType);
                    sceneRef.current.dispose();
                }
                engineRef.current?.dispose();
                sceneRef.current = null;
                engineRef.current = null;
                cameraRef.current = null;
                loadedPartsRef.current = {};
            };
        }
    }, []); // Mảng dependency rỗng đảm bảo chỉ chạy một lần

    useEffect(() => {
        if (!sceneRef.current || !engineRef.current) return;
        const typesInProps = new Set(modelsToLoad.map(m => m.type));

        Object.keys(loadedPartsRef.current).forEach(loadedType => {
            if (!typesInProps.has(loadedType)) clearMeshesForType(loadedType);
        });

        const loadPromises = modelsToLoad.map(async ({ type, path, color }) => {
            if (path) await loadModel(type, path, color);
            else clearMeshesForType(type);
        });
        Promise.all(loadPromises).catch(err => console.error("BabylonScene: Error updating models:", err));
    }, [modelsToLoad]);

    useEffect(() => {
        if (!sceneRef.current || !modelsToLoad) return;
        modelsToLoad.forEach(({ type, color, path }) => {
            const loadedPartEntry = loadedPartsRef.current[type];
            if (color && path && loadedPartEntry?.meshes) {
                loadedPartEntry.meshes.forEach(mesh => {
                    if (mesh.material && !mesh.isDisposed()) {
                        const babylonColor = Color3.FromHexString(color);
                        const material = mesh.material as Material;
                        if (material instanceof StandardMaterial) {
                            if (!material.diffuseColor || !material.diffuseColor.equals(babylonColor)) material.diffuseColor = babylonColor;
                        } else if (material instanceof PBRMaterial) {
                            if (!material.albedoColor || !material.albedoColor.equals(babylonColor)) material.albedoColor = babylonColor;
                        } else if ('albedoColor' in material && (material as any).albedoColor && !(material as any).albedoColor.equals(babylonColor)) {
                            (material as any).albedoColor = babylonColor;
                        } else if ('diffuseColor' in material && (material as any).diffuseColor && !(material as any).diffuseColor.equals(babylonColor)) {
                            (material as any).diffuseColor = babylonColor;
                        }
                    }
                });
            }
        });
    }, [modelsToLoad]);

    return <canvas ref={reactCanvas} style={{ width: '100%', height: '100%', touchAction: 'none', outline: 'none' }} />;
});

export default memo(BabylonScene);