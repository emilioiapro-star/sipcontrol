import { db } from '../db';
import type { Drink, DrinkEvent, ExportPayloadV1, Settings } from '../types';

const isDrink = (item: unknown): item is Drink => {
  if (!item || typeof item !== 'object') return false;
  const v = item as Partial<Drink>;
  return !!v.id && !!v.name && !!v.emoji && !!v.category && typeof v.defaultMl === 'number';
};

const isEvent = (item: unknown): item is DrinkEvent => {
  if (!item || typeof item !== 'object') return false;
  const v = item as Partial<DrinkEvent>;
  return !!v.id && !!v.drinkId && !!v.tsISO && !!v.dayKey && v.quantity === 1;
};

const isSettings = (item: unknown): item is Settings => {
  if (!item || typeof item !== 'object') return false;
  const v = item as Partial<Settings>;
  return (
    v.id === 'app' &&
    typeof v.defaultDrinkId === 'string' &&
    typeof v.dailyLimitCount === 'number' &&
    (v.themeMode === 'dark' || v.themeMode === 'light' || v.themeMode === 'auto')
  );
};

export const exportData = async (): Promise<void> => {
  const [drinks, events, settings] = await Promise.all([
    db.drinks.toArray(),
    db.events.toArray(),
    db.settings.get('app'),
  ]);

  if (!settings) throw new Error('No settings found');

  const payload: ExportPayloadV1 = {
    version: 1,
    exportedAt: new Date().toISOString(),
    drinks,
    events,
    settings,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sipcontrol-backup-${payload.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const parseAndImport = async (file: File): Promise<void> => {
  const raw = await file.text();
  const data = JSON.parse(raw) as Partial<ExportPayloadV1>;

  const version = data.version ?? 1;
  if (version !== 1) {
    throw new Error('Versión de backup no soportada.');
  }

  const drinks = Array.isArray(data.drinks) ? data.drinks : [];
  const events = Array.isArray(data.events) ? data.events : [];
  const settings = data.settings;

  if (!drinks.every(isDrink) || !events.every(isEvent) || !isSettings(settings)) {
    throw new Error('Archivo inválido o corrupto.');
  }

  const normalizedDrinks = drinks.map((drink, index) => ({
    ...drink,
    sortOrder: typeof drink.sortOrder === 'number' ? drink.sortOrder : index,
  }));

  await db.transaction('rw', db.drinks, db.events, db.settings, async () => {
    await db.drinks.clear();
    await db.events.clear();
    await db.settings.clear();
    await db.drinks.bulkPut(normalizedDrinks);
    await db.events.bulkPut(events);
    await db.settings.put(settings);
  });
};
