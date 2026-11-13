// Two languages, English by default. The choice comes from `?lang=ru`, then from the last
// choice saved in the browser. Switching reloads the page — the texts are read once at start.
const SUPPORTED = ['en', 'ru'];

function detect() {
  if (typeof window === 'undefined') return 'en';
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (SUPPORTED.includes(fromUrl)) return fromUrl;
  try {
    const saved = window.localStorage.getItem('lang');
    if (SUPPORTED.includes(saved)) return saved;
  } catch { /* private mode */ }
  return 'en';
}

export const LANG = detect();
if (typeof document !== 'undefined') document.documentElement.lang = LANG;

export function setLang(lang) {
  try { window.localStorage.setItem('lang', lang); } catch { /* private mode */ }
  const url = new URL(window.location.href);
  url.searchParams.delete('lang');
  window.location.replace(url);
}

const STRINGS = {
  en: {
    heroKicker: 'Dive centre · Paralimni, Cyprus',
    heroSub: 'The shore stays behind. Everything worth seeing is under water',
    dive: 'Dive in',
    hint: 'or scroll down',
    diveLabel: 'The dive',
    openPhoto: 'Open photo',
    close: 'Close',
    book: 'Message us on Facebook',
    surface: 'Back to the surface',
    logoLabel: 'Happy Divers — back to the surface',
    route: 'Dive route',
    hud: 'Dive readings',
    depth: 'Depth', water: 'Water', visibility: 'Visibility', m: 'm',
    loaderTag: 'Dive centre · Paralimni, Cyprus',
    loader: ['Checking the gear…', 'Filling the tanks…', 'Reading the reef map…', 'Heading out to the lagoon…'],
    sceneError: 'The 3D scene could not start',
    switchTo: 'RU', switchLabel: 'Переключить на русский',
  },
  ru: {
    heroKicker: 'Дайв-центр · Паралимни, Кипр',
    heroSub: 'Берег остаётся позади. Всё самое интересное — под водой',
    dive: 'Нырнуть',
    hint: 'или листайте вниз',
    diveLabel: 'Погружение',
    openPhoto: 'Открыть фото',
    close: 'Закрыть',
    book: 'Написать в Facebook',
    surface: 'Всплыть к берегу',
    logoLabel: 'Happy Divers — к поверхности',
    route: 'Маршрут погружения',
    hud: 'Параметры погружения',
    depth: 'Глубина', water: 'Вода', visibility: 'Видимость', m: 'м',
    loaderTag: 'Дайв-центр · Паралимни, Кипр',
    loader: ['Проверяем снаряжение…', 'Забиваем баллоны…', 'Сверяем карту рифа…', 'Выходим в лагуну…'],
    sceneError: '3D-сцена не запустилась',
    switchTo: 'EN', switchLabel: 'Switch to English',
  },
};

export const T = STRINGS[LANG];
export const OTHER_LANG = LANG === 'en' ? 'ru' : 'en';
