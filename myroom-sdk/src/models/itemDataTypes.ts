// src/models/itemDataTypes.ts

// Dựa trên cấu trúc của item.json
export interface IItemDefinition {
    ID: string;
    use_status: "Y" | "N";
    title: string;
    desc: string;
    hashtag: string[];
    category1: number;
    category2: number;
    category3: number;
    sale_status: number;
    price_type: number;
    price_amount: number;
    client_itemid: string;
    placement_attach_type: number;
    sw: number;
    sh: number;
    useGrids: string[];
    funtion: number; // Note: Original file has "funtion", consider renaming to "functionType" or similar
    link_address: string;
    funtion_address: string;
}

// Dựa trên cấu trúc của EItemCategory*.json
export interface ICategoryDefinition {
    ID: string;
    Name: string;
    Text: string;
    Desc: string;
    ActiveIcon: string;
    Parent?: string;
    IsShow?: "0" | "1" | boolean;
    IsShowShop?: boolean;
    HideWhenEquipped?: string;
    CameraRatio?: string;
    ManifestType?: number;
    SvnFolder?: string;
    GenerateThumbnail?: boolean;
    localKey?: string;
}

export interface ICategoryData {
    cat1: Map<string, ICategoryDefinition>;
    cat2: Map<string, ICategoryDefinition>;
    cat3: Map<string, ICategoryDefinition>;
}