// src/core/ItemDataManager.ts
import { IItemDefinition, ICategoryDefinition } from "../models/itemDataTypes";

const DATA_PATH = "/data/"; // Path to JSON data in the `public` folder

export class ItemDataManager {
  private items: Map<string, IItemDefinition> = new Map();
  private categories1: Map<string, ICategoryDefinition> = new Map();
  private categories2: Map<string, ICategoryDefinition> = new Map();
  private categories3: Map<string, ICategoryDefinition> = new Map();

  private isLoaded: boolean = false;

  constructor() {
    console.log("ItemDataManager instance created.");
  }

  public async loadAllData(): Promise<void> {
    if (this.isLoaded) {
      console.log("Item data is already loaded.");
      return;
    }

    try {
      console.log("Starting to load all item data...");
      const [itemData, cat1Data, cat2Data, cat3Data] = await Promise.all([
        fetch(`${DATA_PATH}item.json`).then((res) => {
          if (!res.ok)
            throw new Error(`Failed to fetch item.json: ${res.statusText}`);
          return res.json();
        }),
        fetch(`${DATA_PATH}EItemCategory1.json`).then((res) => {
          if (!res.ok)
            throw new Error(
              `Failed to fetch EItemCategory1.json: ${res.statusText}`
            );
          return res.json();
        }),
        fetch(`${DATA_PATH}EItemCategory2.json`).then((res) => {
          if (!res.ok)
            throw new Error(
              `Failed to fetch EItemCategory2.json: ${res.statusText}`
            );
          return res.json();
        }),
        fetch(`${DATA_PATH}EItemCategory3.json`).then((res) => {
          if (!res.ok)
            throw new Error(
              `Failed to fetch EItemCategory3.json: ${res.statusText}`
            );
          return res.json();
        }),
      ]);

      this.items = new Map(Object.entries(itemData));
      this.categories1 = new Map(Object.entries(cat1Data));
      this.categories2 = new Map(Object.entries(cat2Data));
      this.categories3 = new Map(Object.entries(cat3Data));

      this.isLoaded = true;
      console.log("Item data loaded successfully.");
      console.log(
        `Loaded ${this.items.size} items, ${this.categories1.size} C1, ${this.categories2.size} C2, ${this.categories3.size} C3.`
      );
    } catch (error) {
      console.error("FATAL: Error loading item data:", error);
      this.isLoaded = false;
      // In a real app, you might want to show an error to the user or have a fallback
      throw error;
    }
  }

  public isDataLoaded(): boolean {
    return this.isLoaded;
  }

  public getItemById(itemId: string): IItemDefinition | undefined {
    if (!this.isLoaded)
      console.warn("Attempted to get item before data was loaded!");
    return this.items.get(itemId);
  }

  public getCategory1ById(
    cat1Id: string | number
  ): ICategoryDefinition | undefined {
    if (!this.isLoaded)
      console.warn("Attempted to get category1 before data was loaded!");
    return this.categories1.get(String(cat1Id));
  }

  public getCategory2ById(
    cat2Id: string | number
  ): ICategoryDefinition | undefined {
    if (!this.isLoaded)
      console.warn("Attempted to get category2 before data was loaded!");
    return this.categories2.get(String(cat2Id));
  }

  public getCategory3ById(
    cat3Id: string | number
  ): ICategoryDefinition | undefined {
    if (!this.isLoaded)
      console.warn("Attempted to get category3 before data was loaded!");
    return this.categories3.get(String(cat3Id));
  }

  public getItemModelPath(itemIdFromJson: string): string | null {
    const itemDef = this.getItemById(itemIdFromJson);
    if (!itemDef) {
      console.warn(`No item definition found for ID: ${itemIdFromJson}`);
      return null;
    }

    const cat3Def = this.getCategory3ById(itemDef.category3);
    if (!cat3Def || !cat3Def.SvnFolder) {
      console.warn(
        `Category3 or SvnFolder not found for item ID: ${itemIdFromJson} (Cat3 ID: ${itemDef.category3})`
      );
      return null;
    }

    let modelFileName = itemDef.client_itemid;
    if (!modelFileName) {
      console.warn(`client_itemid is empty for item ID: ${itemIdFromJson}`);
      return null;
    }

    // Example SvnFolder to actual folder mapping
    // This needs to be robust based on your SvnFolder values
    let actualAssetFolder = "";
    const svnFolderLower = cat3Def.SvnFolder.toLowerCase();

    if (svnFolderLower.includes("item")) actualAssetFolder = "items";
    else if (
      svnFolderLower.includes("avatar_resource") ||
      svnFolderLower.includes("system_avatar")
    )
      actualAssetFolder = "avatars";
    else if (
      svnFolderLower.includes("skin") ||
      svnFolderLower.includes("system_myroom")
    )
      actualAssetFolder = "rooms";
    else if (svnFolderLower.includes("animation"))
      actualAssetFolder = "animations"; // For avatar animations
    else {
      console.warn(
        `SvnFolder '${cat3Def.SvnFolder}' does not have a defined mapping. Using SvnFolder as path.`
      );
      actualAssetFolder = cat3Def.SvnFolder; // Fallback or adjust as needed
    }

    // Basic cleaning of modelFileName if it contains suffixes like _COLOR
    if (modelFileName.toUpperCase().endsWith("_COLOR")) {
      modelFileName = modelFileName.substring(
        0,
        modelFileName.lastIndexOf("_COLOR")
      );
    }

    // Ensure it has a .glb extension if not present
    if (
      !modelFileName.toLowerCase().endsWith(".glb") &&
      !modelFileName.toLowerCase().endsWith(".gltf")
    ) {
      modelFileName += ".glb";
    }

    return `${actualAssetFolder}/${modelFileName}`; // e.g., "items/MR_CHAIR_0001.glb"
  }

  public getDisplayableItems(
    filterFn?: (item: IItemDefinition, cat3?: ICategoryDefinition) => boolean
  ): IItemDefinition[] {
    if (!this.isLoaded) return [];
    const allItems = Array.from(this.items.values());
    if (filterFn) {
      return allItems.filter((item) => {
        const cat3 = this.getCategory3ById(item.category3);
        return filterFn(item, cat3);
      });
    }
    // Default filter: usable and shown in shop
    return allItems.filter((item) => {
      const cat3 = this.getCategory3ById(item.category3);
      return item.use_status === "Y" && cat3?.IsShowShop === true;
    });
  }
}

const itemDataManagerInstance = new ItemDataManager();
export default itemDataManagerInstance;
