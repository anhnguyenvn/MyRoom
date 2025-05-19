// src/avatarPartsData.ts

export interface PartItem {
  name: string;
  fileName: string | null;
}

export interface GenderSelectableParts {
  hair: PartItem[];
  top: PartItem[];
  bottom?: PartItem[];
  shoes?: PartItem[];
  accessory?: PartItem[];
}

export interface GenderFixedParts {
  body: string;
  head: string;
}

export interface GenderDefaultColors {
  hair?: string;
  top?: string;
  bottom?: string;
  shoes?: string;
  accessory?: string;
  [key: string]: string | undefined; // Cho phép các loại màu khác
}

export interface GenderData {
  fixedParts: GenderFixedParts;
  selectableParts: GenderSelectableParts;
  defaultColors: GenderDefaultColors;
}

export interface AvailableParts {
  male: GenderData;
  female: GenderData;
}

export const availablePartsData: AvailableParts = {
  male: {
    fixedParts: {
      body: "/models/male/body/male_body.glb",
      head: "/models/male/head/male_head.glb",
    },
    selectableParts: {
      hair: [
        { name: "No Hair", fileName: null },
        {
          name: "Male Hair Style 1", fileName: "/models/male/hair/male_hair_1.glb",
        },
        {
          name: "Male Hair Style 2", fileName: "/models/male/hair/male_hair_2.glb",
        },
        {
          name: "Male Hair Style 3", fileName: "/models/male/hair/male_hair_3.glb",
        },
        {
          name: "Male Hair Style 4", fileName: "/models/male/hair/male_hair_4.glb",
        },
      ],
      top: [
        { name: "No Top", fileName: null },
        { name: "Male T-Shirt 1", fileName: "/models/male/top/male_top_1.glb" },
        { name: "Male T-Shirt 2", fileName: "/models/male/top/male_top_2.glb" },
        { name: "Male T-Shirt 3", fileName: "/models/male/top/male_top_3.glb" },
      ],
      shoes: [
        { name: "No Shoes", fileName: null },
        { name: "Male Shoes 1", fileName: "/models/male/shoes/male_shoes_1.glb" },
      ],
      bottom: [
        { name: "No Bottom", fileName: null },
        { name: "Male Pant 1", fileName: "/models/male/bottom/male_bottom_1.glb" },
        { name: "Male Pant 2", fileName: "/models/male/bottom/male_bottom_2.glb" },
        { name: "Male Pant 3", fileName: "/models/male/bottom/male_bottom_3.glb" },
    ],
    },
    defaultColors: {
      hair: "#4A301B",
      top: "#1E90FF",
    },
  },
  female: {
    fixedParts: {
      body: "/models/female/body/female_body.glb",
      head: "/models/female/head/female_head.glb",
    },
    selectableParts: {
      hair: [
        { name: "No Hair", fileName: null },
        {
          name: "Female Hair Style 1",
          fileName: "/models/female/hair/female_hair_1.glb",
        },
        {
          name: "Female Hair Style 2",
          fileName: "/models/female/hair/female_hair_2.glb",
        },
      ],
      top: [
        { name: "No Top", fileName: null },
        { name: "Female shirt 1", fileName: "/models/female/top/female_top_1.glb"},
        { name: "Female shirt 2", fileName: "/models/female/top/female_top_2.glb"},
        { name: "Female shirt 3", fileName: "/models/female/top/female_top_3.glb"},
        { name: "Female shirt 4", fileName: "/models/female/top/female_top_4.glb"},
        { name: "Female shirt 5", fileName: "/models/female/top/female_top_5.glb"},
      ],
      shoes: [
        { name: "No Shoes", fileName: null },
        { name: "Female Shoes 1", fileName: "/models/female/shoes/female_shoes_1.glb" },
        { name: "Female Shoes 2", fileName: "/models/female/shoes/female_shoes_2.glb" },
        { name: "Female Shoes 3", fileName: "/models/female/shoes/female_shoes_3.glb" },
      ],
      bottom: [
        { name: "No Bottom", fileName: null },
        { name: "Female Pant 1", fileName: "/models/female/bottom/female_bottom_1.glb" },
        { name: "Female Pant 2", fileName: "/models/female/bottom/female_bottom_2.glb" },
        { name: "Female Pant 3", fileName: "/models/female/bottom/female_bottom_3.glb" },
        { name: "Female Pant 4", fileName: "/models/female/bottom/female_bottom_3.glb" },
    ],
    },
    defaultColors: {
      hair: "#C9A96A",
      top: "#FF69B4",
    },
  },
};

export interface AvatarPartPaths {
  body: string;
  head: string;
  hair: string | null;
  top: string | null;
  bottom?: string | null;
  shoes?: string | null;
  accessory?: string | null;
  [key: string]: string | null | undefined;
}

export interface AvatarColors {
  hair?: string;
  top?: string;
  bottom?: string;
  shoes?: string;
  accessory?: string;
  [key: string]: string | undefined;
}

export type Gender = keyof AvailableParts; // 'male' | 'female'

export interface AvatarConfig {
  gender: Gender;
  parts: AvatarPartPaths;
  colors: AvatarColors;
}

export const getDefaultConfigForGender = (gender: Gender): AvatarConfig => {
  const genderData = availablePartsData[gender];
  if (!genderData) {
    console.error(
      `getDefaultConfigForGender: Gender data for "${gender}" not found! Defaulting to male.`
    );
    return getDefaultConfigForGender("male");
  }

  const initialParts: AvatarPartPaths = {
    body: genderData.fixedParts.body,
    head: genderData.fixedParts.head,
    hair: null,
    top: null,
    bottom: null,
    shoes: null,
    accessory: null,
  };
  const initialColors: AvatarColors = { ...genderData.defaultColors };

  for (const partType in genderData.selectableParts) {
    const items =
      genderData.selectableParts[partType as keyof GenderSelectableParts];
    if (items && items.length > 0) {
      const firstActualItem = items.find((item) => item.fileName !== null);
      initialParts[partType] = firstActualItem
        ? firstActualItem.fileName
        : null;
    } else {
      initialParts[partType] = null;
    }
  }

  return {
    gender: gender,
    parts: initialParts,
    colors: initialColors,
  };
};
