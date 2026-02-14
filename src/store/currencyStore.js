import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultCurrencies } from '@shared/lib/constants';

const CACHE_KEY = 'vexly_exchangeRates';
const DATE_KEY = 'vexly_ratesLastUpdate';
const CURRENCY_KEY = 'vexly_currency';
const ONE_DAY = 24 * 60 * 60 * 1000;

export const useCurrencyStore = create(
  persist(
    (set, get) => ({
      selectedCurrency: 'USD',
      currencies: { ...defaultCurrencies },

      setCurrency: (code) => set({ selectedCurrency: code }),

      initRates: async () => {
        const rates = await loadRates();
        if (rates) {
          set((state) => {
            const updated = { ...state.currencies };
            Object.keys(updated).forEach((code) => {
              if (rates[code]) {
                updated[code] = { ...updated[code], rate: rates[code] };
              }
            });
            return { currencies: updated };
          });
        }
      },
    }),
    {
      name: CURRENCY_KEY,
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name);
          if (!raw) return null;
          try {
            // Legacy format is just a currency code string like "USD"
            if (!raw.startsWith('{') && !raw.startsWith('[')) {
              return { state: { selectedCurrency: raw } };
            }
            return { state: JSON.parse(raw) };
          } catch {
            return { state: { selectedCurrency: raw } };
          }
        },
        setItem: (name, value) => {
          // Save as plain string for backward compat
          localStorage.setItem(name, value.state.selectedCurrency);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => ({ selectedCurrency: state.selectedCurrency }),
    }
  )
);

// Rate fetching helpers (kept outside store for simplicity)
function getCachedRates() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const lastUpdate = localStorage.getItem(DATE_KEY);
    if (!cached) return null;
    const parsedLastUpdate = parseInt(lastUpdate) || 0;
    if (isNaN(parsedLastUpdate)) return null;
    return { rates: JSON.parse(cached), lastUpdate: parsedLastUpdate };
  } catch {
    return null;
  }
}

function saveRates(rates) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
  localStorage.setItem(DATE_KEY, Date.now());
}

async function fetchRatesFromAPI() {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) {
      if (response.status === 429) {
        console.warn('Rate limit exceeded from exchange rate API');
      }
      return null;
    }
    const data = await response.json();
    if (data.result === 'success' && data.rates) {
      saveRates(data.rates);
      return data.rates;
    }
    throw new Error('Invalid response structure from rates API');
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return null;
  }
}

async function loadRates() {
  const cachedRates = getCachedRates();

  if (cachedRates) {
    const timeElapsed = Date.now() - cachedRates.lastUpdate;
    if (timeElapsed < ONE_DAY) {
      return cachedRates.rates;
    } else {
      const refreshedRates = await fetchRatesFromAPI();
      return refreshedRates || cachedRates.rates;
    }
  } else {
    const refreshedRates = await fetchRatesFromAPI();
    if (!refreshedRates) {
      console.warn('Failed to fetch rates, falling back to hardcoded rates.');
    }
    return refreshedRates;
  }
}
