import { colors } from '@shared/lib/constants';

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {colors.map((color) => (
        <div
          key={color.id}
          onClick={() => onChange(color.id)}
          className={`h-10 cursor-pointer rounded-lg border-2 transition-all hover:scale-105 ${
            value === color.id
              ? 'ring-2 ring-indigo-500 ring-offset-2 border-transparent'
              : 'border-transparent'
          }`}
          style={{
            background: `linear-gradient(135deg, ${color.bg} 0%, ${color.accent} 100%)`
          }}
        />
      ))}
    </div>
  );
}
