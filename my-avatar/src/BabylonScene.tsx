// src/BabylonScene.tsx
import React, { useEffect, useRef, memo } from 'react'; // Bỏ useState nếu không dùng cho engine nữa
import {
    Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, SceneLoader,
    StandardMaterial, Color3, Tools, AbstractMesh, AnimationGroup, Nullable,
    IParticleSystem, Material, PBRMaterial, // MeshBuilder (nếu dùng)
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

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

const BabylonScene: React.FC<BabylonSceneProps> = ({ modelsToLoad }) => {
    const reactCanvas = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Nullable<Engine>>(null); // Dùng useRef cho engine
    const sceneRef = useRef<Nullable<Scene>>(null);
    const loadedPartsRef = useRef<Record<string, LoadedPartEntry>>({});
    const renderCountRef = useRef(0); // Debug render count

    useEffect(() => {
        renderCountRef.current += 1;
        console.log(`BabylonScene render count: ${renderCountRef.current}`);
    });


    const clearMeshesForType = (partType: string) => {
        // console.log(`BabylonScene: Clearing meshes for type: ${partType}`);
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
        if (!sceneRef.current) {
            console.warn("BabylonScene: loadModel called but scene is not ready.");
            return;
        }
        // console.log(`BabylonScene: Loading model for ${partType} from ${path}`);
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
                // console.log(`BabylonScene: Successfully loaded ${partType}`);
            }
        } catch (error) {
            console.error(`BabylonScene: Error loading ${partType} from ${path}:`, error);
            clearMeshesForType(partType);
        }
    };

    // useEffect khởi tạo Engine và Scene (CHỈ CHẠY MỘT LẦN)
    useEffect(() => {
        console.log("BabylonScene: Engine/Scene setup useEffect triggered (should be once).");
        if (reactCanvas.current && !engineRef.current) { // Kiểm tra engineRef.current
            const babylonEngine = new Engine(reactCanvas.current, true, { preserveDrawingBuffer: true, stencil: true });
            engineRef.current = babylonEngine; // Gán vào ref

            const babylonScene = new Scene(babylonEngine);
            sceneRef.current = babylonScene;

            const camera = new ArcRotateCamera("camera", -Math.PI / 1.5, Math.PI / 2.5, 2.5, new Vector3(0, 1.0, 0), babylonScene);
            camera.attachControl(reactCanvas.current, false);
            camera.lowerRadiusLimit = 0.5;
            camera.upperRadiusLimit = 8;
            camera.wheelDeltaPercentage = 0.015;
            camera.minZ = 0.1;

            const light1 = new HemisphericLight("light1", new Vector3(0.8, 1, 0.5), babylonScene);
            light1.intensity = 0.9;
            const light2 = new HemisphericLight("light2", new Vector3(-0.8, 0.5, -0.5), babylonScene);
            light2.intensity = 0.4;

            babylonEngine.runRenderLoop(() => sceneRef.current?.render());
            const resize = () => babylonEngine.resize();
            window.addEventListener('resize', resize);

            console.log("BabylonScene: Engine and Scene initialized.");

            return () => {
                console.log("BabylonScene: Cleaning up Engine and Scene.");
                window.removeEventListener('resize', resize);
                if (sceneRef.current) {
                    Object.keys(loadedPartsRef.current).forEach(clearMeshesForType); // Dọn dẹp các model đã tải
                    sceneRef.current.dispose();
                    sceneRef.current = null;
                }
                if (engineRef.current) {
                    engineRef.current.dispose();
                    engineRef.current = null;
                }
                loadedPartsRef.current = {};
            };
        }
    }, []); // <--- MẢNG DEPENDENCY RỖNG, CHẠY 1 LẦN KHI MOUNT, DỌN DẸP KHI UNMOUNT

    // useEffect để tải/cập nhật models khi `modelsToLoad` thay đổi
    useEffect(() => {
        console.log("BabylonScene: modelsToLoad (main loading) useEffect triggered. Length:", modelsToLoad.length); //, "Data:", JSON.stringify(modelsToLoad));
        if (!sceneRef.current || !engineRef.current) { // Đảm bảo engine và scene đã sẵn sàng
            // console.log("BabylonScene: modelsToLoad useEffect - scene or engine not ready, returning.");
            return;
        }

        const typesInProps = new Set(modelsToLoad.map(m => m.type));

        Object.keys(loadedPartsRef.current).forEach(loadedType => {
            if (!typesInProps.has(loadedType)) {
                // console.log(`BabylonScene: Clearing ${loadedType} as it's not in new modelsToLoad.`);
                clearMeshesForType(loadedType);
            }
        });

        const loadPromises = modelsToLoad.map(async ({ type, path, color }) => {
            if (path) {
                // console.log(`BabylonScene: Queuing load for ${type} from ${path}`);
                await loadModel(type, path, color);
            } else {
                // console.log(`BabylonScene: Queuing clear for ${type} as path is null.`);
                clearMeshesForType(type);
            }
        });

        Promise.all(loadPromises)
            .then(() => { /* console.log("BabylonScene: All model updates processed for this batch.")*/ })
            .catch(err => console.error("BabylonScene: Error processing model updates in useEffect:", err));

    }, [modelsToLoad]);

    // useEffect để cập nhật màu sắc (có thể được gộp vào useEffect trên nếu logic không quá phức tạp)
    useEffect(() => {
        // console.log("BabylonScene: modelsToLoad (color update) useEffect triggered. Length:", modelsToLoad.length);
        if (!sceneRef.current || !modelsToLoad) return;

        modelsToLoad.forEach(({ type, color, path }) => {
            const loadedPartEntry = loadedPartsRef.current[type];
            if (color && path && loadedPartEntry?.meshes) { // Chỉ cập nhật màu nếu model có path (đang được hiển thị)
                loadedPartEntry.meshes.forEach(mesh => {
                    if (mesh.material && !mesh.isDisposed()) {
                        const babylonColor = Color3.FromHexString(color);
                        const material = mesh.material as Material;
                        let colorUpdated = false;
                        if (material instanceof StandardMaterial) {
                            if (!material.diffuseColor || !material.diffuseColor.equals(babylonColor)) {
                                material.diffuseColor = babylonColor;
                                colorUpdated = true;
                            }
                        } else if (material instanceof PBRMaterial) {
                            if (!material.albedoColor || !material.albedoColor.equals(babylonColor)) {
                                material.albedoColor = babylonColor;
                                colorUpdated = true;
                            }
                        } else if ('albedoColor' in material && (material as any).albedoColor && !(material as any).albedoColor.equals(babylonColor)) {
                            (material as any).albedoColor = babylonColor;
                             colorUpdated = true;
                        } else if ('diffuseColor' in material && (material as any).diffuseColor && !(material as any).diffuseColor.equals(babylonColor)) {
                            (material as any).diffuseColor = babylonColor;
                             colorUpdated = true;
                        }
                        // if(colorUpdated) console.log(`BabylonScene: Color updated for ${type}`);
                    }
                });
            }
        });
    }, [modelsToLoad]);

    return <canvas ref={reactCanvas} style={{ width: '100%', height: '100%', touchAction: 'none', outline: 'none' }} />;
};

export default memo(BabylonScene);