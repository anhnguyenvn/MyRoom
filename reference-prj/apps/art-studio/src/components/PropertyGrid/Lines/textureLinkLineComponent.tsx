import * as React from "react";

import type { Nullable } from "@babylonjs/core/types";
import type { Observable, Observer } from "@babylonjs/core/Misc/observable";
import type { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import type { Material } from "@babylonjs/core/Materials/material";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

import { TextLineComponent } from "client-tools-ui-components/lines/textLineComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWrench, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { FileButtonLineComponent } from "client-tools-ui-components/lines/fileButtonLineComponent";
import { Tools } from "@babylonjs/core/Misc/tools";
import type { Scene } from "@babylonjs/core/scene";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";

export interface ITextureLinkLineComponentProps {
    label: string;
    texture: Nullable<BaseTexture>;
    material?: Material;
    texturedObject?: { getScene: () => Scene };
    onSelectionChangedObservable?: Observable<any>;
    onDebugSelectionChangeObservable?: Observable<TextureLinkLineComponent>;
    propertyName?: string;
    onTextureCreated?: (texture: BaseTexture) => void;
    customDebugAction?: (state: boolean) => void;
    onTextureRemoved?: () => void;
    fileFormats?: string;
    cubeOnly?: boolean;
}

export class TextureLinkLineComponent extends React.Component<ITextureLinkLineComponentProps, { isDebugSelected: boolean }> {
    private _onDebugSelectionChangeObserver: Nullable<Observer<TextureLinkLineComponent>>=null;

    constructor(props: ITextureLinkLineComponentProps) {
        super(props);

        const material = this.props.material;
        const texture = this.props.texture;

        this.state = { isDebugSelected: material && material.reservedDataStore && material.reservedDataStore.debugTexture === texture };
    }

    componentDidMount() {
        if (!this.props.onDebugSelectionChangeObservable) {
            return;
        }
        this._onDebugSelectionChangeObserver = this.props.onDebugSelectionChangeObservable.add((line) => {
            if (line !== this) {
                this.setState({ isDebugSelected: false });
            }
        });
    }

    componentWillUnmount() {
        if (this.props.onDebugSelectionChangeObservable && this._onDebugSelectionChangeObserver) {
            this.props.onDebugSelectionChangeObservable.remove(this._onDebugSelectionChangeObserver);
        }
    }

    debugTexture() {
        if (this.props.customDebugAction) {
            const newState = !this.state.isDebugSelected;
            this.props.customDebugAction(newState);
            this.setState({ isDebugSelected: newState });

            if (this.props.onDebugSelectionChangeObservable) {
                this.props.onDebugSelectionChangeObservable.notifyObservers(this);
            }

            return;
        }

        const texture = this.props.texture;

        const material = this.props.material;

        if (!material || !texture) {
            return;
        }
        const scene = material.getScene();

        if (material.reservedDataStore && material.reservedDataStore.debugTexture === texture) {
            const debugMaterial = material.reservedDataStore.debugMaterial;
            texture.level = material.reservedDataStore.level;
            for (const mesh of scene.meshes) {
                if (mesh.material === debugMaterial) {
                    mesh.material = material;
                }
            }
            debugMaterial.dispose();
            material.reservedDataStore.debugTexture = null;
            material.reservedDataStore.debugMaterial = null;

            this.setState({ isDebugSelected: false });
            return;
        }

        let checkMaterial = material;
        let needToDisposeCheckMaterial = false;
        if (material.reservedDataStore && material.reservedDataStore.debugTexture) {
            checkMaterial = material.reservedDataStore.debugMaterial;
            needToDisposeCheckMaterial = true;
        }

        const debugMaterial = new StandardMaterial("debugMaterial", scene);
        debugMaterial.disableLighting = true;
        debugMaterial.sideOrientation = material.sideOrientation;
        debugMaterial.emissiveTexture = texture;
        debugMaterial.forceDepthWrite = true;
        debugMaterial.reservedDataStore = { hidden: true };

        for (const mesh of scene.meshes) {
            if (mesh.material === checkMaterial) {
                mesh.material = debugMaterial;
            }
        }

        if (!material.reservedDataStore) {
            material.reservedDataStore = {};
        }

        material.reservedDataStore.debugTexture = texture;
        material.reservedDataStore.debugMaterial = debugMaterial;
        material.reservedDataStore.level = texture.level;
        texture.level = 1.0;

        if (this.props.onDebugSelectionChangeObservable) {
            this.props.onDebugSelectionChangeObservable.notifyObservers(this);
        }

        if (needToDisposeCheckMaterial) {
            checkMaterial.dispose();
        }

        this.setState({ isDebugSelected: true });
    }

    onLink() {
        if (!this.props.onSelectionChangedObservable) {
            return;
        }

        const texture = this.props.texture;
        this.props.onSelectionChangedObservable.notifyObservers(texture!);
    }

    updateTexture(file: File) {
        const material = this.props.material ?? this.props.texturedObject;
        if (!material) {
            return;
        }
        Tools.ReadFile(
            file,
            (data) => {
                const blob = new Blob([data], { type: "octet/stream" });
                const url = URL.createObjectURL(blob);

                const extension = file.name.split(".").pop()?.toLowerCase();
                console.log(extension);
                const texture = this.props.cubeOnly
                    ? new CubeTexture(url, material.getScene(), [], false, undefined, undefined, undefined, undefined, false, extension ? "." + extension : undefined)
                    : new Texture(url, material.getScene(), false, false,
                    undefined, undefined,undefined,undefined,undefined,undefined,"image/png",undefined,undefined,extension ? "." + extension : undefined);

                if (this.props.propertyName) {
                    (material as any)[this.props.propertyName!] = texture;
                } else if (this.props.onTextureCreated) {
                    this.props.onTextureCreated(texture);
                }

                this.forceUpdate();
            },
            undefined,
            true
        );
    }

    removeTexture() {
        const material = this.props.material ?? this.props.texturedObject;
        if (!material) {
            return;
        }
        if (this.props.propertyName) {
            (material as any)[this.props.propertyName!] = null;
        } else if (this.props.onTextureRemoved) {
            this.props.onTextureRemoved();
        }

        this.forceUpdate();
    }

    render() {
        const texture = this.props.texture;

        if (!texture) {
            if (this.props.propertyName || this.props.onTextureCreated) {
                return (
                    <FileButtonLineComponent
                        label={`Add ${this.props.label} texture`}
                        onClick={(file) => this.updateTexture(file)}
                        accept={this.props.fileFormats ?? ".jpg, .png, .tga, .dds, .env"}
                    />
                );
            }
            return null;
        }
        return (
            <div className="textureLinkLine">
                {(!texture.isCube || this.props.cubeOnly) && (this.props.material || this.props.texturedObject) && (
                    <>
                        <div className={this.state.isDebugSelected ? "debug selected" : "debug"}>
                            {this.props.material && (
                                <span className="actionIcon" onClick={() => this.debugTexture()} title="Render as main texture">
                                    <FontAwesomeIcon icon={faWrench} />
                                </span>
                            )}
                            <span className="actionIcon" onClick={() => this.removeTexture()} title="Remove texture">
                                <FontAwesomeIcon icon={faTrash} />
                            </span>
                        </div>
                    </>
                )}
                <TextLineComponent label={this.props.label} value={texture.name} onLink={() => this.onLink()} />
            </div>
        );
    }
}
