import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureSeedData } from './db';
import type { Drink, DrinkEvent, Settings, ThemeMode } from './types';
import { toDayKey, getMonthGrid } from './utils/date';
import { exportData, parseAndImport } from './utils/exportImport';
import { verifyPin } from './utils/crypto';
import { TabBar, type TabId } from './components/TabBar';
import { HomeScreen } from './screens/HomeScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { DrinksScreen } from './screens/DrinksScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DayEventsModal } from './components/DayEventsModal';
import { DrinkModal } from './components/DrinkModal';
import { PinGate } from './components/PinGate';

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const playLimitSound = () => {
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880;
  gain.gain.value = 0.04;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
};

function App() {
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [dayModalKey, setDayModalKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [drinkModal, setDrinkModal] = useState<Drink | null | 'new'>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [lockState, setLockState] = useState<'locked' | 'unlocked'>('unlocked');
  const [pinSetupMode, setPinSetupMode] = useState<'none' | 'setup' | 'change'>('none');

  const drinks = useLiveQuery(() => db.drinks.orderBy('sortOrder').toArray(), [], [] as Drink[]);
  const settings = useLiveQuery(() => db.settings.get('app'), [], null);

  const todayKey = toDayKey(new Date());
  const todayEvents = useLiveQuery(
    () => db.events.where('dayKey').equals(todayKey).sortBy('tsISO'),
    [todayKey],
    [] as DrinkEvent[]
  );
  const monthEvents = useLiveQuery(async () => {
    const start = toDayKey(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1));
    const end = toDayKey(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));
    return db.events.where('dayKey').between(start, end, true, true).toArray();
  }, [monthDate], [] as DrinkEvent[]);

  const eventsForDay = useLiveQuery(
    () =>
      dayModalKey
        ? db.events.where('dayKey').equals(dayModalKey).sortBy('tsISO')
        : Promise.resolve([] as DrinkEvent[]),
    [dayModalKey],
    [] as DrinkEvent[]
  );

  useEffect(() => {
    ensureSeedData().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!settings) return;
    if (settings.pinHash) {
      setLockState('locked');
    }
  }, [settings?.pinHash]);

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const mode = settings.themeMode === 'auto' ? (prefersLight ? 'light' : 'dark') : settings.themeMode;
    root.dataset.theme = mode;
  }, [settings?.themeMode]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && settings?.pinHash && settings.lockEnabled) {
        setLockState('locked');
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [settings?.pinHash, settings?.lockEnabled]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const drinksMap = useMemo(() => new Map(drinks.map((d) => [d.id, d])), [drinks]);
  const defaultDrink = settings ? drinksMap.get(settings.defaultDrinkId) ?? null : null;

  const countsByDay = useMemo(() => {
    const map = new Map<string, number>();
    monthEvents.forEach((ev) => {
      map.set(ev.dayKey, (map.get(ev.dayKey) ?? 0) + ev.quantity);
    });
    return map;
  }, [monthEvents]);

  const updateSettings = async (patch: Partial<Settings>) => {
    const current = await db.settings.get('app');
    if (!current) return;
    await db.settings.put({ ...current, ...patch, id: 'app' });
  };

  const addEvent = async () => {
    const liveSettings = await db.settings.get('app');
    if (!liveSettings) return;
    const drinkId = liveSettings.defaultDrinkId;
    const drink = await db.drinks.get(drinkId);
    if (!drink) {
      setToast('Selecciona bebida por defecto.');
      return;
    }

    const now = new Date();
    const event: DrinkEvent = {
      id: makeId('event'),
      drinkId,
      tsISO: now.toISOString(),
      dayKey: toDayKey(now),
      quantity: 1,
      abvOverride: drink.abv,
      mlOverride: drink.defaultMl,
    };

    await db.events.add(event);

    const newCount = await db.events.where('dayKey').equals(event.dayKey).count();
    if (newCount >= liveSettings.dailyLimitCount) {
      setToast(`Límite diario alcanzado (${newCount}/${liveSettings.dailyLimitCount}).`);
      if ('vibrate' in navigator) navigator.vibrate([160, 90, 160]);
      if (liveSettings.alertSoundEnabled) playLimitSound();
    } else {
      setToast(`+1 ${drink.emoji} ${drink.name}`);
    }
  };

  const undoLastToday = async () => {
    const todays = await db.events.where('dayKey').equals(todayKey).sortBy('tsISO');
    const last = todays[todays.length - 1];
    if (!last) {
      setToast('No hay eventos hoy para deshacer.');
      return;
    }
    await db.events.delete(last.id);
    setToast('Último evento eliminado.');
  };

  const saveDrink = async (
    payload: Pick<Drink, 'name' | 'emoji' | 'category' | 'defaultMl' | 'abv' | 'favorite'>,
    editingId?: string
  ) => {
    if (editingId) {
      const prev = await db.drinks.get(editingId);
      if (!prev) return;
      await db.drinks.put({ ...prev, ...payload });
      setToast('Bebida actualizada.');
      return;
    }

    const drink: Drink = {
      ...payload,
      id: makeId('drink'),
      sortOrder: drinks.length,
      createdAt: new Date().toISOString(),
    };
    await db.drinks.add(drink);
    setToast('Bebida creada.');
  };

  const deleteDrink = async (drink: Drink) => {
    const total = await db.drinks.count();
    if (total <= 1) {
      setToast('Debe existir al menos una bebida.');
      return;
    }

    await db.transaction('rw', db.drinks, db.events, db.settings, async () => {
      await db.drinks.delete(drink.id);
      await db.events.where('drinkId').equals(drink.id).delete();
      const liveSettings = await db.settings.get('app');
      if (!liveSettings) return;
      if (liveSettings.defaultDrinkId === drink.id) {
        const candidate = await db.drinks.orderBy('sortOrder').first();
        if (candidate) {
          await db.settings.put({ ...liveSettings, defaultDrinkId: candidate.id });
        }
      }
    });
    setToast('Bebida eliminada.');
  };

  const reorderDrinks = async (draggedId: string, targetId: string) => {
    const ordered = [...drinks].sort((a, b) => a.sortOrder - b.sortOrder);
    const fromIndex = ordered.findIndex((drink) => drink.id === draggedId);
    const toIndex = ordered.findIndex((drink) => drink.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;

    const [moved] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, moved);

    await db.drinks.bulkPut(
      ordered.map((drink, index) => ({
        ...drink,
        sortOrder: index,
      }))
    );
  };

  const deleteEvent = async (eventId: string) => {
    await db.events.delete(eventId);
    setToast('Evento eliminado.');
  };

  const updateEvent = async (eventId: string, drinkId: string, tsISO: string) => {
    const oldEvent = await db.events.get(eventId);
    if (!oldEvent) return;
    const drink = await db.drinks.get(drinkId);
    await db.events.put({
      ...oldEvent,
      drinkId,
      tsISO,
      dayKey: toDayKey(new Date(tsISO)),
      mlOverride: drink?.defaultMl ?? oldEvent.mlOverride,
      abvOverride: drink?.abv ?? oldEvent.abvOverride,
    });
    setToast('Evento actualizado.');
  };

  const setDefaultDrink = async (drinkId: string) => {
    await updateSettings({ defaultDrinkId: drinkId });
    setToast('Bebida por defecto actualizada.');
  };

  const handleImport = async (file: File) => {
    try {
      await parseAndImport(file);
      setToast('Importación completada.');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Error en importación.');
    }
  };

  const handleSetupPin = async (pinHash: string, pinSalt: string) => {
    await updateSettings({ pinHash, pinSalt });
    setPinSetupMode('none');
    setLockState('unlocked');
    setToast('PIN configurado.');
  };

  const handleDisablePin = async () => {
    if (!settings?.pinHash || !settings.pinSalt) return;
    const pin = window.prompt('Introduce PIN actual para desactivar:');
    if (!pin) return;
    const ok = await verifyPin(pin, settings.pinHash, settings.pinSalt);
    if (!ok) {
      setToast('PIN incorrecto.');
      return;
    }
    await updateSettings({ pinHash: null, pinSalt: null });
    setToast('PIN desactivado.');
  };

  const handleChangePin = async () => {
    if (!settings?.pinHash || !settings.pinSalt) {
      setPinSetupMode('setup');
      return;
    }
    const current = window.prompt('PIN actual:');
    if (!current) return;
    const ok = await verifyPin(current, settings.pinHash, settings.pinSalt);
    if (!ok) {
      setToast('PIN incorrecto.');
      return;
    }
    setPinSetupMode('change');
  };

  if (!ready || !settings) return <div className="loading">Cargando SipControl...</div>;

  const monthGrid = getMonthGrid(monthDate);

  return (
    <div className="app-shell">
      <main className="content-area">
        {activeTab === 'home' && (
          <HomeScreen
            defaultDrink={defaultDrink}
            todayCount={todayEvents.length}
            todayLimit={settings.dailyLimitCount}
            onQuickAdd={addEvent}
            onUndo={undoLastToday}
            onOpenDrinkPicker={() => setPickerOpen(true)}
            onGoCalendar={() => setActiveTab('calendar')}
            onExport={exportData}
            settings={settings}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarScreen
            monthDate={monthDate}
            monthGrid={monthGrid}
            countsByDay={countsByDay}
            onPrevMonth={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            onNextMonth={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            onDayTap={setDayModalKey}
          />
        )}

        {activeTab === 'drinks' && (
          <DrinksScreen
            drinks={drinks}
            defaultDrinkId={settings.defaultDrinkId}
            onSetDefault={setDefaultDrink}
            onToggleFavorite={(drink) => db.drinks.put({ ...drink, favorite: !drink.favorite })}
            onEdit={(drink) => setDrinkModal(drink)}
            onDelete={deleteDrink}
            onReorder={reorderDrinks}
            onCreate={() => setDrinkModal('new')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            settings={settings}
            onThemeChange={(mode: ThemeMode) => updateSettings({ themeMode: mode })}
            onLimitChange={(value) => updateSettings({ dailyLimitCount: Math.max(1, value || 1) })}
            onLockToggle={(value) => updateSettings({ lockEnabled: value })}
            onSoundToggle={(value) => updateSettings({ alertSoundEnabled: value })}
            onLockNow={() => setLockState('locked')}
            onSetupPin={() => setPinSetupMode('setup')}
            onChangePin={handleChangePin}
            onDisablePin={handleDisablePin}
            onExport={exportData}
            onImport={handleImport}
          />
        )}
      </main>

      <button type="button" className="fab" onClick={addEvent} aria-label="Añadir consumición">
        +
      </button>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {pickerOpen && (
        <div className="modal-backdrop" onClick={() => setPickerOpen(false)}>
          <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
            <h3>Cambiar bebida</h3>
            <div className="picker-grid">
              {drinks.map((drink) => (
                <button
                  key={drink.id}
                  type="button"
                  className={`glass-card picker-item ${drink.id === settings.defaultDrinkId ? 'active' : ''}`}
                  onClick={async () => {
                    await setDefaultDrink(drink.id);
                    setPickerOpen(false);
                  }}
                >
                  <span>{drink.emoji}</span>
                  <small>{drink.name}</small>
                </button>
              ))}
            </div>
            <button type="button" className="ghost" onClick={() => setPickerOpen(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {dayModalKey && (
        <DayEventsModal
          dayKey={dayModalKey}
          events={eventsForDay}
          drinks={drinks}
          onClose={() => setDayModalKey(null)}
          onDeleteEvent={deleteEvent}
          onUpdateEvent={updateEvent}
        />
      )}

      {drinkModal && (
        <DrinkModal
          initial={drinkModal === 'new' ? null : drinkModal}
          onClose={() => setDrinkModal(null)}
          onSave={(payload) =>
            saveDrink(payload, drinkModal !== 'new' && drinkModal ? drinkModal.id : undefined)
          }
        />
      )}

      {pinSetupMode !== 'none' && (
        <PinGate
          mode="setup"
          title={pinSetupMode === 'change' ? 'Nuevo PIN' : 'Configura tu PIN'}
          subtitle="Usa 4 a 6 dígitos para proteger SipControl"
          onSetup={({ pinHash, pinSalt }) => handleSetupPin(pinHash, pinSalt)}
        />
      )}

      {lockState === 'locked' && settings.pinHash && settings.pinSalt && (
        <PinGate
          mode="unlock"
          title="SipControl bloqueado"
          subtitle="Introduce tu PIN para continuar"
          pinHash={settings.pinHash}
          pinSalt={settings.pinSalt}
          onUnlock={() => setLockState('unlocked')}
        />
      )}

      {!settings.pinHash && !pinSetupMode && (
        <PinGate
          mode="setup"
          title="Protege tu app con PIN"
          subtitle="Necesario para desbloquear al abrir SipControl"
          onSetup={({ pinHash, pinSalt }) => handleSetupPin(pinHash, pinSalt)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
