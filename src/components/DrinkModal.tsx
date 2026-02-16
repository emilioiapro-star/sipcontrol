import { useState, type FormEvent } from 'react';
import type { Drink, DrinkCategory } from '../types';

type Props = {
  initial?: Drink | null;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    emoji: string;
    category: DrinkCategory;
    defaultMl: number;
    abv?: number;
    favorite: boolean;
  }) => void;
};

export const DrinkModal = ({ initial, onClose, onSave }: Props) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🥤');
  const [category, setCategory] = useState<DrinkCategory>(initial?.category ?? 'alcohol');
  const [defaultMl, setDefaultMl] = useState(initial?.defaultMl ?? 330);
  const [abv, setAbv] = useState(initial?.abv?.toString() ?? '');
  const [favorite, setFavorite] = useState(initial?.favorite ?? false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const parsedAbv = abv ? Number(abv) : undefined;
    onSave({
      name: name.trim(),
      emoji: emoji.trim() || '🥤',
      category,
      defaultMl: Number(defaultMl),
      abv: Number.isFinite(parsedAbv) ? parsedAbv : undefined,
      favorite,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal glass-card" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <h3>{initial ? 'Editar bebida' : 'Nueva bebida'}</h3>
        <label>
          Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Emoji/Icono
          <input value={emoji} maxLength={4} onChange={(e) => setEmoji(e.target.value)} />
        </label>
        <label>
          Categoría
          <select value={category} onChange={(e) => setCategory(e.target.value as DrinkCategory)}>
            <option value="alcohol">Alcohol</option>
            <option value="no_alcohol">No alcohol</option>
          </select>
        </label>
        <label>
          Tamaño por defecto (ml)
          <input
            type="number"
            min={1}
            value={defaultMl}
            onChange={(e) => setDefaultMl(Number(e.target.value))}
          />
        </label>
        <label>
          ABV (%) opcional
          <input type="number" min={0} max={100} step={0.1} value={abv} onChange={(e) => setAbv(e.target.value)} />
        </label>
        <label className="row-line">
          <span>Favorito</span>
          <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} />
        </label>
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="ghost">
            Cancelar
          </button>
          <button type="submit" className="primary">
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
};
