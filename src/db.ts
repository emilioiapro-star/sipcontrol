import Dexie, { type Table } from 'dexie';
import type { Drink, DrinkEvent, Settings } from './types';

class SipControlDB extends Dexie {
  drinks!: Table<Drink, string>;
  events!: Table<DrinkEvent, string>;
  settings!: Table<Settings, 'app'>;

  constructor() {
    super('sipcontrol_db');
    this.version(1).stores({
      drinks: 'id,name,category,favorite,createdAt',
      events: 'id,dayKey,drinkId,tsISO,[dayKey+drinkId]',
      settings: 'id',
    });
  }
}

export const db = new SipControlDB();

const defaultDrinkId = 'drink-beer-default';

export const ensureSeedData = async (): Promise<void> => {
  const hasSettings = await db.settings.get('app');
  if (hasSettings) return;

  const now = new Date().toISOString();
  const drink: Drink = {
    id: defaultDrinkId,
    name: 'Cerveza',
    emoji: '🍺',
    category: 'alcohol',
    defaultMl: 330,
    abv: 5,
    favorite: true,
    createdAt: now,
  };

  const settings: Settings = {
    id: 'app',
    defaultDrinkId,
    dailyLimitCount: 3,
    themeMode: 'dark',
    pinHash: null,
    pinSalt: null,
    lockEnabled: true,
    alertSoundEnabled: true,
  };

  await db.transaction('rw', db.drinks, db.settings, async () => {
    await db.drinks.add(drink);
    await db.settings.put(settings);
  });
};
