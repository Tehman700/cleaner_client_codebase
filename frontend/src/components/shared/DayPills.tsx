import { dayLabel, getWeekDays, todayKey } from '../../utils/helpers';

interface Props {
  activeDay: string;
  onSelect: (day: string) => void;
}

export default function DayPills({ activeDay, onSelect }: Props) {
  const today = todayKey();
  return (
    <div className="date-picker-row">
      {getWeekDays().map(d => (
        <button
          key={d}
          className={`day-pill${d === activeDay ? ' active' : ''}`}
          onClick={() => onSelect(d)}
        >
          {dayLabel(d)}{d === today ? ' ·today' : ''}
        </button>
      ))}
    </div>
  );
}
