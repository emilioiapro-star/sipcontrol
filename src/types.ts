export type ThemeMode = 'dark' | 'light' | 'auto';
export type DrinkCategory = 'alcohol' | 'no_alcohol';

export type Drink = {
  id: string;
  name: string;
  emoji: string;
  category: DrinkCategory;
  defaultMl: number;
  abv?: number;
  favorite: boolean;
  sortOrder: number;
  createdAt: string;
};

export type DrinkEvent = {
  id: string;
  drinkId: string;
  tsISO: string;
  dayKey: string;
  quantity: 1;
  mlOverride?: number;
  abvOverride?: number;
};

export type Settings = {
  id: 'app';
  defaultDrinkId: string;
  dailyLimitCount: number;
  themeMode: ThemeMode;
  pinHash: string | null;
  pinSalt: string | null;
  lockEnabled: boolean;
  alertSoundEnabled?: boolean;
};

export type ExportPayloadV1 = {
  version: 1;
  exportedAt: string;
  drinks: Drink[];
  events: DrinkEvent[];
  settings: Settings;
};
