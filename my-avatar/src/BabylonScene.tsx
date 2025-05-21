// src/BabylonScene.tsx
import React, { useEffect, useRef, memo, forwardRef, useImperativeHandle, useState } from 'react';
import {
    Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, SceneLoader,
    StandardMaterial, Color3, Tools, AbstractMesh, AnimationGroup, Nullable,
    IParticleSystem, Material, PBRMaterial, MeshBuilder, TransformNode, Quaternion,
    Matrix, Scalar,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import '@babylonjs/inspector';

export interface ModelInfo {
    type: string;
    path: string | null;
    color?: string;
}

export interface ActiveMovement {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    turnLeft: boolean;
    turnRight: boolean;
}

interface BabylonSceneProps {
    modelsToLoad: ModelInfo[];
    activeMovement: ActiveMovement;
}

interface LoadedPartEntry {
    meshes: AbstractMesh[];
    animationGroups: AnimationGroup[];
}

export interface BabylonSceneHandle {
    resetCamera: () => void;
    toggleInspector: () => void;
    disposePart: (partType: string) => void;
}

const rotationMatrix = new Matrix(); // Khai báo ở ngoài để tái sử dụng

const BabylonScene = forwardRef<BabylonSceneHandle, BabylonSceneProps>(({ modelsToLoad, activeMovement }, ref) => {
    const reactCanvas = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Nullable<Engine>>(null);
    const sceneRef = useRef<Nullable<Scene>>(null);
    const cameraRef = useRef<Nullable<ArcRotateCamera>>(null);
    const avatarRootRef = useRef<Nullable<TransformNode>>(null);
    const loadedPartsRef = useRef<Record<string, LoadedPartEntry>>({});
    const [isInspectorVisible, setIsInspectorVisible] = useState(false);

    const idleAnimRef = useRef<Nullable<AnimationGroup>>(null);
    const runAnimRef = useRef<Nullable<AnimationGroup>>(null);
    const currentAnimRef = useRef<Nullable<AnimationGroup>>(null);

    const defaultCameraAlpha = -Math.PI / 1.5;
    const defaultCameraBeta = Math.PI / 2.5;
    const defaultCameraRadius = 3.5;
    const defaultCameraTargetOffset = new Vector3(0, 1.2, 0);

    const resetCameraLocal = () => {
        if (cameraRef.current) {
            cameraRef.current.alpha = defaultCameraAlpha;
            cameraRef.current.beta = defaultCameraBeta;
            cameraRef.current.radius = defaultCameraRadius;
            const targetPosition = avatarRootRef.current
                ? avatarRootRef.current.absolutePosition.add(defaultCameraTargetOffset)
                : defaultCameraTargetOffset.clone();
            cameraRef.current.setTarget(targetPosition);
        }
    };

    useImperativeHandle(ref, () => ({
        resetCamera: resetCameraLocal,
        toggleInspector: () => {
            if (sceneRef.current) {
                if (isInspectorVisible) {
                    sceneRef.current.debugLayer.hide();
                    setIsInspectorVisible(false);
                } else {
                    sceneRef.current.debugLayer.show({ embedMode: true })
                        .then(() => {})
                        .catch(error => console.error("Error showing inspector:", error));
                    setIsInspectorVisible(true);
                }
            }
        },
        disposePart: (partType: string) => {
            console.log(`Disposing part from handle: ${partType}`);
            disposePartType(partType);
        }
    }));

    const clearMeshesForType = (partType: string) => {
        if (partType === 'body') {
            idleAnimRef.current?.stop(); runAnimRef.current?.stop();
            idleAnimRef.current = null; runAnimRef.current = null; currentAnimRef.current = null;
        }
        const partEntry = loadedPartsRef.current[partType];
        if (partEntry) {
            partEntry.animationGroups?.forEach(ag => ag.dispose());
            partEntry.meshes?.forEach(mesh => {
                if (!mesh.isDisposed()) mesh.dispose(false, true);
            });
            delete loadedPartsRef.current[partType];
        }
    };

    // Thêm các hàm tiện ích mới
    const disposePartType = (partType: string) => {
        console.log(`Disposing part type: ${partType}`);
        clearMeshesForType(partType);
    };

    const disposeFullsetRelatedParts = () => {
        console.log('Disposing fullset related parts');
        disposePartType('top');
        disposePartType('bottom');
        disposePartType('shoes');
    };

    const isFullset = (partType: string) => partType === 'fullset';
    const isClothingPart = (partType: string) => ['top', 'bottom', 'shoes'].includes(partType);

    const loadModel = async (partType: string, path: string, colorValue?: string) => {
        if (!sceneRef.current || !avatarRootRef.current) {
            console.warn("BabylonScene: loadModel - scene or avatarRoot not ready.");
            return;
        }

        // Kiểm tra và xử lý các trường hợp đặc biệt
        const currentPartEntry = loadedPartsRef.current[partType];
        const isCurrentPartFullset = currentPartEntry && isFullset(partType);
        const isNewPartFullset = isFullset(partType);
        const isNewPartClothing = isClothingPart(partType);

        // 1. Dispose part cùng loại
        disposePartType(partType);

        // 2. Nếu part mới là fullset, dispose các part liên quan
        if (isNewPartFullset) {
            console.log('Loading fullset, disposing related parts');
            disposeFullsetRelatedParts();
        }

        // 3. Nếu part cũ là fullset và part mới là clothing part, dispose fullset
        if (isCurrentPartFullset && isNewPartClothing) {
            console.log('Loading clothing part, disposing current fullset');
            disposePartType('fullset');
        }

        // 4. Nếu đang load một clothing part và có fullset đang active, dispose fullset
        if (isNewPartClothing && loadedPartsRef.current['fullset']) {
            console.log('Loading clothing part while fullset is active, disposing fullset');
            disposePartType('fullset');
        }

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
                    let designatedParent: Nullable<TransformNode> = avatarRootRef.current; // Mặc định cha là avatarRoot

                    if (partType === "hair") {
                        const headEntry = loadedPartsRef.current["head"];
                        if (headEntry && headEntry.meshes && headEntry.meshes.length > 0) {
                            // Gán tóc làm con của mesh đầu tiên của bộ phận đầu.
                            // Giả định mesh đầu tiên là node chính của đầu có thể transform.
                            // Nếu head.glb có một "attachment point" (node rỗng) riêng cho tóc, bạn nên gán vào đó.
                            designatedParent = headEntry.meshes[0] as TransformNode; // Ép kiểu nếu chắc chắn mesh[0] có thể làm parent
                            console.log(`BabylonScene: Parenting hair to head mesh: ${headEntry.meshes[0].name}`);
                        } else {
                            console.warn("BabylonScene: Head model not found or has no meshes when trying to parent hair. Defaulting hair parent to avatarRoot. Hair might appear at feet or misaligned if its origin is not set correctly for this scenario.");
                            // Nếu không tìm thấy đầu, tóc vẫn sẽ là con của avatarRoot.
                            // Điều này yêu cầu hair.glb phải được model với gốc tọa độ ở vị trí
                            // tương đối chính xác so với avatarRoot (ví dụ: ở vị trí đầu).
                        }
                    }

                    // Gán cha cho các mesh gốc của file GLB (những mesh chưa có parent)
                    if (!mesh.parent && designatedParent) {
                        mesh.parent = designatedParent;
                    }
                    // Fallback cuối cùng nếu không có designatedParent và mesh chưa có cha
                    else if (!mesh.parent && avatarRootRef.current) {
                        mesh.parent = avatarRootRef.current;
                    }


                    // Áp dụng vật liệu và màu sắc
                    if (!mesh.material && sceneRef.current) {
                        mesh.material = new StandardMaterial(`${partType}_mat_${mesh.name}`, sceneRef.current);
                    }
                    if (colorValue && mesh.material) {
                        const babylonColor = Color3.FromHexString(colorValue);
                        const material = mesh.material as Material;
                        if (material instanceof StandardMaterial) material.diffuseColor = babylonColor;
                        else if (material instanceof PBRMaterial) material.albedoColor = babylonColor;
                        else if ('albedoColor' in material) (material as any).albedoColor = babylonColor;
                        else if ('diffuseColor' in material) (material as any).diffuseColor = babylonColor;
                    }
                });

                if (partType === 'body' && result.animationGroups) {
                    idleAnimRef.current = result.animationGroups.find(ag => ag.name.toLowerCase().includes("idle")) || null;
                    runAnimRef.current = result.animationGroups.find(ag => ag.name.toLowerCase().includes("run") || ag.name.toLowerCase().includes("walk")) || null;
                    if (idleAnimRef.current) {
                        idleAnimRef.current.play(true); currentAnimRef.current = idleAnimRef.current;
                    } else if (runAnimRef.current) {
                        runAnimRef.current.play(true); currentAnimRef.current = runAnimRef.current;
                    }
                }
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

            avatarRootRef.current = new TransformNode("avatarRoot", babylonScene);
            avatarRootRef.current.rotationQuaternion = Quaternion.Identity();

            const cameraTargetNode = new TransformNode("cameraTarget", babylonScene);
            cameraTargetNode.parent = avatarRootRef.current;
            cameraTargetNode.position.copyFrom(defaultCameraTargetOffset);

            const camera = new ArcRotateCamera("camera", defaultCameraAlpha, defaultCameraBeta, defaultCameraRadius, cameraTargetNode, babylonScene);
            camera.attachControl(reactCanvas.current, false);
            camera.lowerRadiusLimit = 0.5; camera.upperRadiusLimit = 10;
            camera.wheelDeltaPercentage = 0.01; camera.minZ = 0.1;
            camera.lowerBetaLimit = Math.PI * 0.1; camera.upperBetaLimit = Math.PI * 0.9;
            camera.panningSensibility = 0;
            camera.allowUpsideDown = false;
            camera.inertia = 0.85;
            cameraRef.current = camera;

            const light1 = new HemisphericLight("light1", new Vector3(0.8, 1, 0.5), babylonScene); light1.intensity = 0.9;
            const light2 = new HemisphericLight("light2", new Vector3(-0.8, 0.5, -0.5), babylonScene); light2.intensity = 0.4;

            const ground = MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, babylonScene);
            const groundMaterial = new StandardMaterial("groundMat", babylonScene);
            groundMaterial.diffuseColor = new Color3(0.5, 0.55, 0.5); groundMaterial.specularColor = Color3.Black();
            ground.material = groundMaterial;

            const movementSpeed = 1.8;
            const rotationSpeed = 2.5;

            const sceneObserver = babylonScene.onBeforeRenderObservable.add(() => {
                if (!avatarRootRef.current || !engineRef.current) return;
                const deltaTime = engineRef.current.getDeltaTime() / 1000.0;
                let isMoving = false;
                const moveDirection = Vector3.Zero();
                if (avatarRootRef.current.rotationQuaternion) {
                    avatarRootRef.current.rotationQuaternion.toRotationMatrix(rotationMatrix);
                }
                const forwardLocal = Vector3.Forward(); // (0,0,1)
                const rightLocal = Vector3.Right(); // (1,0,0)
                
                const worldForward = Vector3.TransformCoordinates(forwardLocal, rotationMatrix);
                const worldRight = Vector3.TransformCoordinates(rightLocal, rotationMatrix);


                if (activeMovement.forward) { moveDirection.addInPlace(worldForward); isMoving = true; }
                if (activeMovement.backward) { moveDirection.subtractInPlace(worldForward); isMoving = true; }
                if (activeMovement.right) { moveDirection.addInPlace(worldRight); isMoving = true; }
                if (activeMovement.left) { moveDirection.subtractInPlace(worldRight); isMoving = true; }

                if (isMoving && moveDirection.lengthSquared() > 0.001) { // Thêm ngưỡng nhỏ để tránh di chuyển khi không cần
                    moveDirection.normalize().scaleInPlace(movementSpeed * deltaTime);
                    avatarRootRef.current.position.addInPlace(moveDirection);
                }
                let rotationAmount = 0;
                if (activeMovement.turnLeft) { rotationAmount = -rotationSpeed * deltaTime; isMoving = true;}
                if (activeMovement.turnRight) { rotationAmount = rotationSpeed * deltaTime; isMoving = true;}
                if (rotationAmount !== 0 && avatarRootRef.current.rotationQuaternion) {
                    const rotationDelta = Quaternion.RotationAxis(Vector3.UpReadOnly, rotationAmount);
                    avatarRootRef.current.rotationQuaternion.multiplyToRef(rotationDelta, avatarRootRef.current.rotationQuaternion);
                }

                if (isMoving) {
                    if (currentAnimRef.current !== runAnimRef.current && runAnimRef.current) {
                        idleAnimRef.current?.stop(); runAnimRef.current.play(true); currentAnimRef.current = runAnimRef.current;
                    }
                } else {
                    if (currentAnimRef.current !== idleAnimRef.current && idleAnimRef.current) {
                        runAnimRef.current?.stop(); idleAnimRef.current.play(true); currentAnimRef.current = idleAnimRef.current;
                    } else if (!idleAnimRef.current && currentAnimRef.current !== null) {
                        currentAnimRef.current?.stop(); currentAnimRef.current = null;
                    }
                }
            });

            babylonEngine.runRenderLoop(() => sceneRef.current?.render());
            const resize = () => babylonEngine.resize();
            window.addEventListener('resize', resize);

            return () => {
                window.removeEventListener('resize', resize);
                babylonScene.onBeforeRenderObservable.remove(sceneObserver);
                if (sceneRef.current && isInspectorVisible) sceneRef.current.debugLayer.hide();
                avatarRootRef.current?.dispose(false, true); avatarRootRef.current = null;
                loadedPartsRef.current = {};
                sceneRef.current?.dispose(); engineRef.current?.dispose();
                sceneRef.current = null; engineRef.current = null; cameraRef.current = null;
                idleAnimRef.current = null; runAnimRef.current = null; currentAnimRef.current = null;
            };
        }
    }, []);

    useEffect(() => {
        if (!sceneRef.current || !engineRef.current || !avatarRootRef.current) return;
        const typesInProps = new Set(modelsToLoad.map(m => m.type));
        Object.keys(loadedPartsRef.current).forEach(loadedType => {
            if (!typesInProps.has(loadedType)) clearMeshesForType(loadedType);
        });
        const loadPromises = modelsToLoad.map(async ({ type, path, color }) => {
            if (path) await loadModel(type, path, color); else clearMeshesForType(type);
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