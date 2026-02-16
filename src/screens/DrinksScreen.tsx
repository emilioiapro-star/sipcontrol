import type { Drink } from '../types';

type Props = {
  drinks: Drink[];
  defaultDrinkId: string | null;
  onSetDefault: (drinkId: string) => void;
  onToggleFavorite: (drink: Drink) => void;
  onEdit: (drink: Drink) => void;
  onDelete: (drink: Drink) => void;
  onCreate: () => void;
};

export const DrinksScreen = ({
  drinks,
  defaultDrinkId,
  onSetDefault,
  onToggleFavorite,
  onEdit,
  onDelete,
  onCreate,
}: Props) => {
  return (
    <div className="screen-col">
      <header className="row-head">
        <h2>Bebidas</h2>
        <button type="button" className="primary" onClick={onCreate}>
          Nueva
        </button>
      </header>

      <div className="list-col">
        {drinks.map((drink) => (
          <article className="glass-card drink-item" key={drink.id}>
            <div>
              <h3>
                {drink.emoji} {drink.name}
              </h3>
              <p className="muted">
                {drink.category === 'alcohol' ? 'Alcohol' : 'No alcohol'} · {drink.defaultMl}ml
                {drink.abv ? ` · ${drink.abv}%` : ''}
              </p>
            </div>
            <div className="drink-actions">
              <button type="button" className="ghost" onClick={() => onToggleFavorite(drink)}>
                {drink.favorite ? '★' : '☆'}
              </button>
              <button type="button" className="ghost" onClick={() => onSetDefault(drink.id)}>
                {defaultDrinkId === drink.id ? 'Por defecto' : 'Default'}
              </button>
              <button type="button" className="ghost" onClick={() => onEdit(drink)}>
                Editar
              </button>
              <button type="button" className="danger" onClick={() => onDelete(drink)}>
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
