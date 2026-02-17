import { presets } from '@shared/lib/presets';
import { getLogoProxyUrl } from '@shared/lib/logo';

export default function PresetsGrid({ onSelect }) {
  const popular = presets.filter((p) => p.popular);

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {popular.map((preset) => {
        const logoUrl = getLogoProxyUrl(preset.domain);

        return (
          <button
            key={preset.name}
            onClick={() => onSelect(preset)}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-100 bg-white p-3 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/30"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                className="h-8 w-8 rounded-lg object-contain"
                crossOrigin="anonymous"
                alt={preset.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                }}
              />
            ) : null}
            <div
              className={`items-center justify-center h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 ${logoUrl ? 'hidden' : 'flex'}`}
            >
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{preset.name.charAt(0)}</span>
            </div>
            <span className="text-xs font-medium text-slate-600 truncate w-full text-center dark:text-slate-400">
              {preset.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
