export enum eAssetType {  
  Item = 0,  
  Avatar = 1,  
  Land = 2,  
  MyRoom = 3,  
  Enviroment = 4,  
  Model_glb = 5  
}  
  
export interface IAssetPackageInfo {  
  version: number;  
  baseUrl: string;  
}  
  
export interface IAssetPacakgeInfoQuery {  
  getAssetInfo(assetType: eAssetType, assetId: string): Promise<IAssetPackageInfo | null>;  
}  
  
export class AssetPackageInfoQuery implements IAssetPacakgeInfoQuery {  
  private static _isFirstCheckAssetServer = true;  
  private static _isUsingLocalAssetServer = false;  
  
  private static async _checkUsingLocalAssetServer(): Promise<boolean> {  
    if (this._isFirstCheckAssetServer) {  
      this._isFirstCheckAssetServer = false;  
      try {  
        const response = await fetch(`http://localhost:9567/status`);  
        if (response.ok) {  
          const status = await response.json();  
          this._isUsingLocalAssetServer = status.status === "ok";  
        } else {  
          this._isUsingLocalAssetServer = false;  
        }  
      } catch (error) {  
        this._isUsingLocalAssetServer = false;  
      }  
    }  
  
    return this._isUsingLocalAssetServer;  
  }  
  
  private static async _getAssetInfoFromLocalServer(itemId: string): Promise<any> {  
    if (await AssetPackageInfoQuery._checkUsingLocalAssetServer()) {  
      try {  
        const response = await fetch(`http://localhost:9567/items/${itemId}`);  
        if (response.ok) {  
          const info = await response.json();  
          return info;  
        }  
      } catch (error) {  
        // Ignore errors  
      }  
    }  
  
    return null;  
  }  
  
  public async getAssetInfo(assetType: eAssetType, assetId: string): Promise<IAssetPackageInfo | null> {  
    // For items and models, try to get info from local server  
    if (assetType === eAssetType.Item || assetType === eAssetType.Model_glb) {  
      const info = await AssetPackageInfoQuery._getAssetInfoFromLocalServer(assetId);  
      if (info) {  
        return {  
          version: info.option.version,  
          baseUrl: new URL(info.resource.manifest).origin + '/' + assetId  
        };  
      }  
    }  
  
    // Fallback for testing - return a hardcoded URL  
    return {  
      version: 1,  
      baseUrl: `http://localhost:9567/${assetId}`  
    };  
  }  
}