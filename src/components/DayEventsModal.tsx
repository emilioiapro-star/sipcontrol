import type { Drink, DrinkEvent } from '../types';
import { formatTime } from '../utils/date';

type Props = {
  dayKey: string;
  events: DrinkEvent[];
  drinksMap: Map<string, Drink>;
  onClose: () => void;
};

export const DayEventsModal = ({ dayKey, events, drinksMap, onClose }: Props) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
        <h3>{dayKey}</h3>
        {events.length === 0 && <p className="muted">No hay consumiciones registradas.</p>}
        <ul className="event-list">
          {events.map((event) => {
            const drink = drinksMap.get(event.drinkId);
            return (
              <li key={event.id}>
                <span>
                  {drink?.emoji ?? '🥤'} {drink?.name ?? 'Bebida'}
                </span>
                <small>{formatTime(event.tsISO)}</small>
              </li>
            );
          })}
        </ul>
        <button type="button" className="primary" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};
