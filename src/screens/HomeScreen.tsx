import type { Drink, Settings } from '../types';
import { GlassCard } from '../components/GlassCard';

type Props = {
  defaultDrink: Drink | null;
  todayCount: number;
  todayLimit: number;
  onQuickAdd: () => void;
  onUndo: () => void;
  onOpenDrinkPicker: () => void;
  onGoCalendar: () => void;
  onExport: () => void;
  settings: Settings | null;
};

export const HomeScreen = ({
  defaultDrink,
  todayCount,
  todayLimit,
  onQuickAdd,
  onUndo,
  onOpenDrinkPicker,
  onGoCalendar,
  onExport,
  settings,
}: Props) => {
  return (
    <div className="screen-col">
      <header>
        <h1>SipControl</h1>
        <p className="muted">Control personal de bebidas</p>
      </header>

      <GlassCard className="hero-card">
        <p className="muted">Bebida actual</p>
        <h2>
          {defaultDrink?.emoji ?? '🥤'} {defaultDrink?.name ?? 'Sin seleccionar'}
        </h2>
        <div className="meter-row">
          <div>
            <strong>{todayCount}</strong>
            <small>Hoy</small>
          </div>
          <div>
            <strong>{todayLimit}</strong>
            <small>Límite</small>
          </div>
        </div>
        <button type="button" className="primary big-add" onClick={onQuickAdd}>
          +1
        </button>
        <button type="button" className="ghost" onClick={onUndo}>
          Deshacer último de hoy
        </button>
      </GlassCard>

      <div className="card-grid">
        <GlassCard>
          <h3>Cambiar bebida</h3>
          <button type="button" className="ghost" onClick={onOpenDrinkPicker}>
            Seleccionar
          </button>
        </GlassCard>
        <GlassCard>
          <h3>Límite</h3>
          <p>{settings?.dailyLimitCount ?? 3} bebidas/día</p>
        </GlassCard>
        <GlassCard>
          <h3>Ver calendario</h3>
          <button type="button" className="ghost" onClick={onGoCalendar}>
            Abrir
          </button>
        </GlassCard>
        <GlassCard>
          <h3>Exportar</h3>
          <button type="button" className="ghost" onClick={onExport}>
            Descargar JSON
          </button>
        </GlassCard>
      </div>
    </div>
  );
};
