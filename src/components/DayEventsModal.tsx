import { useState } from 'react';
import type { Drink, DrinkEvent } from '../types';
import { formatTime } from '../utils/date';

type Props = {
  dayKey: string;
  events: DrinkEvent[];
  drinks: Drink[];
  onClose: () => void;
  onDeleteEvent: (eventId: string) => void;
  onUpdateEvent: (eventId: string, drinkId: string, tsISO: string) => void;
};

const toInputDateTime = (iso: string): string => {
  const date = new Date(iso);
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  const hh = `${date.getHours()}`.padStart(2, '0');
  const mm = `${date.getMinutes()}`.padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}`;
};

export const DayEventsModal = ({
  dayKey,
  events,
  drinks,
  onClose,
  onDeleteEvent,
  onUpdateEvent,
}: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDrinkId, setEditingDrinkId] = useState<string>('');
  const [editingDateTime, setEditingDateTime] = useState<string>('');
  const drinksMap = new Map(drinks.map((drink) => [drink.id, drink]));

  const startEdit = (event: DrinkEvent) => {
    setEditingId(event.id);
    setEditingDrinkId(event.drinkId);
    setEditingDateTime(toInputDateTime(event.tsISO));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingDrinkId('');
    setEditingDateTime('');
  };

  const saveEdit = () => {
    if (!editingId || !editingDrinkId || !editingDateTime) return;
    const iso = new Date(editingDateTime).toISOString();
    onUpdateEvent(editingId, editingDrinkId, iso);
    cancelEdit();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal glass-card" onClick={(e) => e.stopPropagation()}>
        <h3>{dayKey}</h3>
        {events.length === 0 && <p className="muted">No hay consumiciones registradas.</p>}
        <ul className="event-list">
          {events.map((event) => {
            const drink = drinksMap.get(event.drinkId);
            const isEditing = editingId === event.id;
            return (
              <li key={event.id}>
                <div className="event-main">
                  {!isEditing && (
                    <>
                      <span>
                        {drink?.emoji ?? '🥤'} {drink?.name ?? 'Bebida'}
                      </span>
                      <small>{formatTime(event.tsISO)}</small>
                    </>
                  )}
                  {isEditing && (
                    <div className="event-edit-grid">
                      <select value={editingDrinkId} onChange={(e) => setEditingDrinkId(e.target.value)}>
                        {drinks.map((drinkOption) => (
                          <option key={drinkOption.id} value={drinkOption.id}>
                            {drinkOption.emoji} {drinkOption.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="datetime-local"
                        value={editingDateTime}
                        onChange={(e) => setEditingDateTime(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <div className="event-actions">
                  {!isEditing && (
                    <button type="button" className="ghost" onClick={() => startEdit(event)}>
                      Editar
                    </button>
                  )}
                  {isEditing && (
                    <>
                      <button type="button" className="ghost" onClick={cancelEdit}>
                        Cancelar
                      </button>
                      <button type="button" className="primary" onClick={saveEdit}>
                        Guardar
                      </button>
                    </>
                  )}
                  <button type="button" className="danger" onClick={() => onDeleteEvent(event.id)}>
                    Borrar
                  </button>
                </div>
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
