import { IAssetManifest } from "./assetManifest";

export interface IChangeMaterialInfo {
    targetMeshPath: string;
    materialName: string;
}

export interface IAssetManifest_Model_glb extends IAssetManifest {
    format: number;
    main:
    {
        type: string,
        modelfile: string,
        scale?: number,
        rotAngle?: number,
        playAnim?: {
            animationGroupName: string,
            speed: number,
        };
        materials?: IChangeMaterialInfo[];
    };
}