import type { Settings, ThemeMode } from '../types';

type Props = {
  settings: Settings | null;
  onThemeChange: (mode: ThemeMode) => void;
  onLimitChange: (value: number) => void;
  onLockToggle: (value: boolean) => void;
  onSoundToggle: (value: boolean) => void;
  onLockNow: () => void;
  onSetupPin: () => void;
  onChangePin: () => void;
  onDisablePin: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
};

export const SettingsScreen = ({
  settings,
  onThemeChange,
  onLimitChange,
  onLockToggle,
  onSoundToggle,
  onLockNow,
  onSetupPin,
  onChangePin,
  onDisablePin,
  onExport,
  onImport,
}: Props) => {
  return (
    <div className="screen-col">
      <h2>Settings</h2>

      <section className="glass-card">
        <h3>PIN</h3>
        {settings?.pinHash ? (
          <div className="stack-row">
            <button type="button" className="ghost" onClick={onChangePin}>
              Cambiar PIN
            </button>
            <button type="button" className="danger" onClick={onDisablePin}>
              Desactivar PIN
            </button>
          </div>
        ) : (
          <button type="button" className="primary" onClick={onSetupPin}>
            Activar PIN
          </button>
        )}
        <label className="row-line">
          <span>Auto-lock al volver al foreground</span>
          <input
            type="checkbox"
            checked={Boolean(settings?.lockEnabled)}
            onChange={(e) => onLockToggle(e.target.checked)}
          />
        </label>
        <button type="button" className="ghost" onClick={onLockNow}>
          Bloquear ahora
        </button>
      </section>

      <section className="glass-card">
        <h3>Tema</h3>
        <div className="segmented">
          {(['dark', 'light', 'auto'] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={settings?.themeMode === mode ? 'active' : ''}
              onClick={() => onThemeChange(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      <section className="glass-card">
        <h3>Límite diario</h3>
        <input
          type="number"
          min={1}
          max={40}
          value={settings?.dailyLimitCount ?? 3}
          onChange={(e) => onLimitChange(Number(e.target.value))}
        />
        <label className="row-line">
          <span>Sonido al llegar al límite</span>
          <input
            type="checkbox"
            checked={Boolean(settings?.alertSoundEnabled)}
            onChange={(e) => onSoundToggle(e.target.checked)}
          />
        </label>
      </section>

      <section className="glass-card">
        <h3>Datos</h3>
        <div className="stack-row">
          <button type="button" className="ghost" onClick={onExport}>
            Exportar JSON
          </button>
          <label className="file-input">
            Importar JSON
            <input
              type="file"
              accept="application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file);
                e.currentTarget.value = '';
              }}
            />
          </label>
        </div>
      </section>
    </div>
  );
};
