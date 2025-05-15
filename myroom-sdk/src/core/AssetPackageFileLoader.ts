import { AssetPackageInfoQuery, eAssetType, IAssetPacakgeInfoQuery } from './AssetPackageInfoQuery';  
  
export class WaitList {  
  private _resolvers: (() => void)[] = [];  
  
  public wait(): Promise<void> {  
    return new Promise<void>((resolve) => {  
      this._resolvers.push(resolve);  
    });  
  }  
  
  public notifyAll(): void {  
    this._resolvers.forEach((resolve) => resolve());  
    this._resolvers = [];  
  }  
}  
  
interface ILoadedAsset {  
  objectUrl: string;  
  lastAccessTime: number;  
  lifetime: number;  
}  
  
export interface IAssetPackageFileLoader {  
  loadFile(assetType: eAssetType, assetId: string, filename: string): Promise<string>;  
}  
  
export class AssetPackageFileLoader implements IAssetPackageFileLoader {  
  private static _instance: AssetPackageFileLoader | null = null;  
  
  private _assetInfoQuery: IAssetPacakgeInfoQuery;  
  private _loadedAssets: Map<string, ILoadedAsset> = new Map<string, ILoadedAsset>();  
  private _loadingAssets: Map<string, WaitList> = new Map<string, WaitList>();  
  private _checkTimer: any = null;  
  
  public constructor() {  
    AssetPackageFileLoader._instance = this;  
    this._assetInfoQuery = new AssetPackageInfoQuery();  
    this._checkTimer = setInterval(() => this._removeLifetimeOverAssets(), 1000);  
  }  
  
  public finalize() {  
    if (this._checkTimer) {  
      clearInterval(this._checkTimer);  
      this._checkTimer = null;  
    }  
  }  
  
  public static getInstance(): AssetPackageFileLoader {  
    if (null == AssetPackageFileLoader._instance) {  
      return new AssetPackageFileLoader();  
    }  
    return AssetPackageFileLoader._instance;  
  }  
  
  public async loadFile(assetType: eAssetType, assetId: string, filename: string): Promise<string> {  
    const loadedAssetKey = this._makeLoaddedAssetKey(assetType, assetId, filename);  
    if (this._loadingAssets.has(loadedAssetKey)) {  
      const waitList = this._loadingAssets.get(loadedAssetKey);  
      if (waitList) {  
        await waitList.wait();  
      }  
    }  
  
    if (this._loadedAssets.has(loadedAssetKey)) {  
      const loadedAsset = this._loadedAssets.get(loadedAssetKey);  
      return loadedAsset!.objectUrl;  
    }  
  
    const waitList = new WaitList();  
    this._loadingAssets.set(loadedAssetKey, waitList);  
  
    let resultString = "";  
    const assetInfo = await this._assetInfoQuery.getAssetInfo(assetType, assetId);  
    if (assetInfo != null) {  
      resultString = await this._loadAsset_FromUrl(assetType, assetId, assetInfo.baseUrl, filename);  
      waitList.notifyAll();  
      this._loadingAssets.delete(loadedAssetKey);  
    } else {  
      console.error(`AssetPackageFileLoader.loadFile() : failed!! assetType=${eAssetType[assetType]} assetId=${assetId} filename=${filename}`);  
    }  
    return resultString;  
  }  
  
  private _makeLoaddedAssetKey(assetType: eAssetType, assetId: string, filename: string): string {  
    return `${eAssetType[assetType]}_${assetId}_${filename}`;  
  }  
  
  private _addLoadedAsset(assetType: eAssetType, assetId: string, filename: string, objectUrl: string, lifetime: number = 60): void {  
    const key = this._makeLoaddedAssetKey(assetType, assetId, filename);  
    this._loadedAssets.set(key, {  
      objectUrl,  
      lastAccessTime: Date.now(),  
      lifetime: lifetime  
    });  
  }  
  
  private _removeLifetimeOverAssets(): void {  
    const now = Date.now();  
    this._loadedAssets.forEach((asset, key) => {  
      if (now - asset.lastAccessTime > asset.lifetime * 1000) {  
        URL.revokeObjectURL(asset.objectUrl);  
        this._loadedAssets.delete(key);  
      }  
    });  
  }  
  
  private async _loadAsset_FromUrl(assetType: eAssetType, assetId: string, baseUrl: string, filename: string): Promise<string> {  
    const fileUrl = `${baseUrl}/${filename}`;  
    try {  
      const response = await fetch(fileUrl);  
      if (response.ok) {  
        const data = await response.blob();  
        const objUrl = URL.createObjectURL(data);  
        this._addLoadedAsset(assetType, assetId, filename, objUrl);  
        return objUrl;  
      }  
    } catch (error) {  
      console.error(`Failed to load asset from URL: ${fileUrl}`, error);  
    }  
  
    console.error(`AssetLoader._loadAsset_FromUrl() : failed!! assetType=${eAssetType[assetType]} assetId=${assetId} filename=${filename}`);  
    return "";  
  }  
}