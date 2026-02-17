// Tailwind color palette - bg is the lighter shade, accent for gradients
export const colors = [
  { id: "purple", bg: "#FAF5FF", accent: "#E9D5FF" },
  { id: "blue", bg: "#EFF6FF", accent: "#BFDBFE" },
  { id: "cyan", bg: "#ECFEFF", accent: "#A5F3FC" },
  { id: "green", bg: "#F0FDF4", accent: "#BBF7D0" },
  { id: "yellow", bg: "#FEFCE8", accent: "#FEF08A" },
  { id: "orange", bg: "#FFF7ED", accent: "#FED7AA" },
  { id: "pink", bg: "#FDF2F8", accent: "#FBCFE8" },
  { id: "rose", bg: "#FFF1F2", accent: "#FECDD3" },
  { id: "slate", bg: "#F8FAFC", accent: "#E2E8F0" },
  { id: "indigo", bg: "#EEF2FF", accent: "#C7D2FE" },
  { id: "teal", bg: "#F0FDFA", accent: "#99F6E4" },
  { id: "amber", bg: "#FFFBEB", accent: "#FDE68A" },
];

export const currencyLocales = {
  USD: "en-US", EUR: "de-DE", GBP: "en-GB", JPY: "ja-JP", CNY: "zh-CN",
  KRW: "ko-KR", INR: "en-IN", CAD: "en-CA", AUD: "en-AU", CHF: "de-CH",
  HKD: "zh-HK", SGD: "en-SG", SEK: "sv-SE", NOK: "nb-NO", DKK: "da-DK",
  NZD: "en-NZ", MXN: "es-MX", BRL: "pt-BR", ZAR: "en-ZA", RUB: "ru-RU",
  TRY: "tr-TR", PLN: "pl-PL", THB: "th-TH", IDR: "id-ID", MYR: "ms-MY",
  PHP: "en-PH", VND: "vi-VN", TWD: "zh-TW", AED: "ar-AE", SAR: "ar-SA",
  ILS: "he-IL", CZK: "cs-CZ", HUF: "hu-HU", RON: "ro-RO", BGN: "bg-BG",
  HRK: "hr-HR", CLP: "es-CL", COP: "es-CO", ARS: "es-AR", PEN: "es-PE",
  EGP: "ar-EG", NGN: "en-NG", KES: "en-KE", PKR: "en-PK", BDT: "bn-BD",
  UAH: "uk-UA"
};

export const defaultCurrencies = {
  USD: { symbol: "$", name: "US Dollar", rate: 1 },
  EUR: { symbol: "€", name: "Euro", rate: 0.92 },
  GBP: { symbol: "£", name: "British Pound", rate: 0.79 },
  JPY: { symbol: "¥", name: "Japanese Yen", rate: 149.5 },
  CNY: { symbol: "¥", name: "Chinese Yuan", rate: 7.24 },
  KRW: { symbol: "₩", name: "South Korean Won", rate: 1320 },
  INR: { symbol: "₹", name: "Indian Rupee", rate: 83.12 },
  CAD: { symbol: "C$", name: "Canadian Dollar", rate: 1.36 },
  AUD: { symbol: "A$", name: "Australian Dollar", rate: 1.53 },
  CHF: { symbol: "CHF", name: "Swiss Franc", rate: 0.88 },
  HKD: { symbol: "HK$", name: "Hong Kong Dollar", rate: 7.82 },
  SGD: { symbol: "S$", name: "Singapore Dollar", rate: 1.34 },
  SEK: { symbol: "kr", name: "Swedish Krona", rate: 10.42 },
  NOK: { symbol: "kr", name: "Norwegian Krone", rate: 10.85 },
  DKK: { symbol: "kr", name: "Danish Krone", rate: 6.87 },
  NZD: { symbol: "NZ$", name: "New Zealand Dollar", rate: 1.64 },
  MXN: { symbol: "MX$", name: "Mexican Peso", rate: 17.15 },
  BRL: { symbol: "R$", name: "Brazilian Real", rate: 4.97 },
  ZAR: { symbol: "R", name: "South African Rand", rate: 18.65 },
  RUB: { symbol: "₽", name: "Russian Ruble", rate: 92.5 },
  TRY: { symbol: "₺", name: "Turkish Lira", rate: 29.2 },
  PLN: { symbol: "zł", name: "Polish Zloty", rate: 3.98 },
  THB: { symbol: "฿", name: "Thai Baht", rate: 35.2 },
  IDR: { symbol: "Rp", name: "Indonesian Rupiah", rate: 15650 },
  MYR: { symbol: "RM", name: "Malaysian Ringgit", rate: 4.72 },
  PHP: { symbol: "₱", name: "Philippine Peso", rate: 55.8 },
  VND: { symbol: "₫", name: "Vietnamese Dong", rate: 24500 },
  TWD: { symbol: "NT$", name: "Taiwan Dollar", rate: 31.5 },
  AED: { symbol: "د.إ", name: "UAE Dirham", rate: 3.67 },
  SAR: { symbol: "﷼", name: "Saudi Riyal", rate: 3.75 },
  ILS: { symbol: "₪", name: "Israeli Shekel", rate: 3.68 },
  CZK: { symbol: "Kč", name: "Czech Koruna", rate: 22.8 },
  HUF: { symbol: "Ft", name: "Hungarian Forint", rate: 356 },
  RON: { symbol: "lei", name: "Romanian Leu", rate: 4.57 },
  BGN: { symbol: "лв", name: "Bulgarian Lev", rate: 1.8 },
  HRK: { symbol: "kn", name: "Croatian Kuna", rate: 6.93 },
  CLP: { symbol: "CLP$", name: "Chilean Peso", rate: 880 },
  COP: { symbol: "COL$", name: "Colombian Peso", rate: 3950 },
  ARS: { symbol: "ARS$", name: "Argentine Peso", rate: 365 },
  PEN: { symbol: "S/", name: "Peruvian Sol", rate: 3.72 },
  EGP: { symbol: "E£", name: "Egyptian Pound", rate: 30.9 },
  NGN: { symbol: "₦", name: "Nigerian Naira", rate: 785 },
  KES: { symbol: "KSh", name: "Kenyan Shilling", rate: 153 },
  PKR: { symbol: "₨", name: "Pakistani Rupee", rate: 278 },
  BDT: { symbol: "৳", name: "Bangladeshi Taka", rate: 110 },
  UAH: { symbol: "₴", name: "Ukrainian Hryvnia", rate: 37.5 },
};

export function randColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getColor(colorId) {
  const found = colors.find(c => c.id === colorId);
  return found ? found : randColor();
}
