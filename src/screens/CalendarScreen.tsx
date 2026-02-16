import { monthLabel, toDayKey } from '../utils/date';

type Props = {
  monthDate: Date;
  monthGrid: Date[];
  countsByDay: Map<string, number>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayTap: (dayKey: string) => void;
};

export const CalendarScreen = ({
  monthDate,
  monthGrid,
  countsByDay,
  onPrevMonth,
  onNextMonth,
  onDayTap,
}: Props) => {
  const currentMonth = monthDate.getMonth();
  const weekday = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div className="screen-col">
      <header className="calendar-head">
        <button type="button" className="ghost" onClick={onPrevMonth}>
          ←
        </button>
        <h2>{monthLabel(monthDate)}</h2>
        <button type="button" className="ghost" onClick={onNextMonth}>
          →
        </button>
      </header>

      <div className="calendar-weekday">
        {weekday.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="calendar-grid glass-card">
        {monthGrid.map((date) => {
          const dayKey = toDayKey(date);
          const count = countsByDay.get(dayKey) ?? 0;
          const faded = date.getMonth() !== currentMonth;
          return (
            <button
              type="button"
              key={dayKey}
              className={`day-cell ${faded ? 'faded' : ''}`}
              onClick={() => onDayTap(dayKey)}
            >
              <span>{date.getDate()}</span>
              {count > 0 && <small>{count}</small>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
