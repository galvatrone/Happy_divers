import { LANG } from './i18n';

// The cards the diver passes on the way down. Each one tells a part of the dive centre's story.
// t      = dive progress (0→1) at which the card is centred and the scroll pauses.
// label/depth feed the route map on the left.
// m      = depth in metres, sets the marker on the card's depth ruler.
// Blocks (all optional): body, quote, steps, rows, tags, checks, photos, facts, note.
// Region: Paralimni, Cyprus (from the centre's Facebook page title).
const RU = [
  {
    t: 0.16, m: 3, label: 'О центре', depth: '0–5 м',
    kicker: 'Лагуна',
    title: 'Семейный дайв-центр с 2004 года',
    body: 'Мы начинали с одной лодки и любви к морю. Сегодня Happy Divers — PADI 5-Star Instructor Development Center и учебный центр SSI.\n\nЗа двадцать лет изменилось многое: лодок стало больше, снаряжение — новее, команда — опытнее. Не изменилось главное: момент, когда человек всплывает после первого погружения и спрашивает, когда можно обратно.',
    facts: [['20+', 'лет под водой'], ['800+', 'выпускников'], ['6', 'дайверов на гида']],
    note: 'Домашний риф начинается прямо у пирса — в ста метрах от нашей хижины.',
  },
  {
    t: 0.26, m: 6, label: 'Первый раз', depth: '3–8 м',
    kicker: 'Мелководье',
    title: 'Первое погружение начинается на мелководье',
    body: 'Пробное погружение не требует опыта и сертификата. Достаточно уметь плавать и хотеть посмотреть, что там внизу.',
    steps: [
      ['Знакомство', 'Рассказываем, как устроено снаряжение, как дышать и как общаться жестами.'],
      ['Мелкая вода', 'Стоим по грудь в лагуне: первый вдох под водой, продувка маски, плавучесть.'],
      ['Погружение', 'Идём вдоль рифа на глубине до 8 метров. Инструктор всё время рядом — на расстоянии руки.'],
      ['На берегу', 'Чай, разбор погружения и фотографии. Решаете, хотите ли продолжать.'],
    ],
    note: 'Всё снаряжение выдаём мы. С собой — купальник, полотенце и хорошее настроение.',
  },
  {
    t: 0.36, m: 12, label: 'Курсы', depth: '8–18 м',
    kicker: 'Подводный сад',
    title: 'Курсы PADI и SSI: от Open Water до Divemaster',
    body: 'Учим по системам PADI и SSI. Сертификат действует по всему миру и не имеет срока годности.',
    rows: [
      ['Open Water Diver', '4 дня · до 18 м', 'Теория, бассейн и четыре погружения в открытой воде.'],
      ['Advanced Open Water', '3 дня · до 30 м', 'Ночные погружения, навигация, затонувшие объекты.'],
      ['Rescue Diver', '4 дня · до 30 м', 'Самоспасение и помощь другим под водой.'],
      ['Divemaster', '2 недели · до 40 м', 'Первая профессиональная ступень: ведите группы сами.'],
      ['Enriched Air Nitrox', '1 день', 'Больше времени на дне, меньше усталости.'],
    ],
  },
  {
    t: 0.46, m: 17, label: 'Жители рифа', depth: '14–20 м',
    kicker: 'Край рифа',
    title: 'Кто живёт на рифах у Паралимни',
    body: 'Риф — это город, и днём в нём час пик. Чем медленнее плывёшь, тем больше видишь: половина жителей прячется прямо на виду.',
    tags: ['Зелёные черепахи', 'Логгерхеды', 'Осьминоги', 'Мурены', 'Груперы', 'Крылатки', 'Каракатицы', 'Скаты', 'Барракуды', 'Голожаберники'],
    quote: 'Смотрим глазами, а не руками: риф растёт медленнее, чем его можно сломать одним касанием ласты',
  },
  {
    t: 0.56, m: 19, label: 'Галерея', depth: '16–22 м', wide: true,
    kicker: 'Над обрывом',
    title: 'Шесть кадров из-под воды',
    body: 'Примеры того, что попадает в объектив на погружениях. Нажмите на фото, чтобы рассмотреть.',
    photos: [
      ['turtle',    'Черепаха над рифом'],
      ['reef-a',    'Мягкие кораллы и стая антиасов'],
      ['clownfish', 'Рыба-клоун в актинии'],
      ['diver',     'Фотодайв на мелководье'],
      ['manta',     'Манты над плато'],
      ['reef-b',    'Край кораллового сада'],
    ],
  },
  {
    t: 0.66, m: 24, label: 'Дайв-сайты', depth: '18–30 м',
    kicker: 'Стена',
    title: 'Три дайв-сайта, куда мы ходим с гидом',
    body: 'Малые группы — не больше шести дайверов на гида. Маршрут подбираем под уровень: никто не скучает и никто не оказывается глубже, чем готов.',
    rows: [
      ['Собор', '22 м · пещера и арка', 'Огромный зал, в который сверху падают столбы света.'],
      ['Голубой грот', '16 м · грот и стена', 'Ночью стены светятся планктоном, в тоннелях живут мурены.'],
      ['Сады Посейдона', '18 м · риф', 'Груперы, осьминоги, голожаберники. Рай для подводной съёмки.'],
    ],
    note: 'Снаряжение включено, Nitrox и фотодайвы по запросу',
  },
  {
    t: 0.76, m: 32, label: 'Безопасность', depth: '30–35 м',
    kicker: 'Пещера',
    title: 'Пять правил каждого погружения',
    body: 'Хорошее погружение — то, после которого хочется ещё. Поэтому правила у нас простые и не обсуждаются.',
    checks: [
      'Брифинг перед каждым погружением: маршрут, глубина, время, сигналы.',
      'Проверка снаряжения в паре — прежде чем войти в воду.',
      'Не больше шести дайверов на гида, новичков — двое на инструктора.',
      'Остановка безопасности на пяти метрах — всегда.',
      'Кислород и аптечка на каждой лодке, партнёрство с DAN.',
    ],
    note: 'В пещеры и на глубину ниже 18 м — только с подходящим сертификатом.',
  },
  {
    t: 0.86, m: 34, label: 'Команда', depth: '33–35 м',
    kicker: 'Выход из пещеры',
    title: 'Трое, кто идёт с вами под воду',
    body: 'Под водой вы доверяете двум вещам: человеку рядом и тому, что надето. За обе отвечаем мы.',
    rows: [
      ['Капитан Яннис', 'PADI Course Director · 20 лет', 'Основатель центра. Под водой с тех пор, как научился ходить.'],
      ['Мария', 'SSI Instructor · 14 лет', 'Rescue и навигация. Вывела в открытую воду более 800 студентов.'],
      ['Костас', 'Divemaster и техник · 9 лет', 'Знает каждый метр местных рифов и держит снаряжение в идеале.'],
    ],
    note: 'Прокат каждый день: BCD, регулятор, гидрокостюм, маска, ласты, компьютер — всё обслужено и готово.',
  },
  {
    t: 0.97, m: 38, label: 'Бронирование', depth: '35–40 м',
    kicker: 'Сумеречная зона',
    title: 'Напишите нам до приезда на Кипр',
    body: 'Первый раз под водой или готовы к Divemaster — расскажите, есть ли у вас сертификат и на какие даты вы приезжаете. Подберём программу и ответим в течение 24 часов.',
    facts: [['PADI', '5-Star IDC'], ['SSI', 'Training Facility'], ['DAN', 'Partner']],
    note: 'Happy Divers, Паралимни, Кипр',
    link: 'https://www.facebook.com/people/Happy-Divers/100094601235799/',
    cta: true,
  },
];

// English texts, card by card in the same order. Positions, photos and links come from RU above.
const EN_TEXT = [
  {
    label: 'About', depth: '0–5 m', kicker: 'Lagoon',
    title: 'A family dive centre since 2004',
    body: 'We started with one boat and a love of the sea. Today Happy Divers is a PADI 5-Star Instructor Development Center and an SSI training facility.\n\nA lot has changed in twenty years: more boats, newer gear, a more experienced team. One thing has not: the moment someone surfaces from a first dive and asks when they can go back down.',
    facts: [['20+', 'years under water'], ['800+', 'divers certified'], ['6', 'divers per guide']],
    note: 'The house reef starts right at the pier, a hundred metres from our hut.',
  },
  {
    label: 'First time', depth: '3–8 m', kicker: 'Shallows',
    title: 'A first dive starts in the shallows',
    body: 'A try dive needs no experience and no certificate. Being able to swim and wanting to see what is down there is enough.',
    steps: [
      ['Briefing', 'We explain how the gear works, how to breathe and how to talk with hand signals.'],
      ['Shallow water', 'Standing chest-deep in the lagoon: the first breath under water, clearing a mask, buoyancy.'],
      ['The dive', 'Along the reef, no deeper than 8 metres. Your instructor stays within arm\'s reach the whole time.'],
      ['Back on shore', 'Tea, a debrief and the photos. You decide whether to carry on.'],
    ],
    note: 'We provide all the gear. Bring swimwear, a towel and a good mood.',
  },
  {
    label: 'Courses', depth: '8–18 m', kicker: 'Underwater garden',
    title: 'PADI and SSI courses, Open Water to Divemaster',
    body: 'We teach in the PADI and SSI systems. The certificate is recognised worldwide and never expires.',
    rows: [
      ['Open Water Diver', '4 days · to 18 m', 'Theory, pool sessions and four open-water dives.'],
      ['Advanced Open Water', '3 days · to 30 m', 'Night dives, navigation, wrecks.'],
      ['Rescue Diver', '4 days · to 30 m', 'Self-rescue and helping others under water.'],
      ['Divemaster', '2 weeks · to 40 m', 'The first professional level: lead groups yourself.'],
      ['Enriched Air Nitrox', '1 day', 'More bottom time, less fatigue.'],
    ],
  },
  {
    label: 'Reef life', depth: '14–20 m', kicker: 'Reef edge',
    title: 'Who lives on the reefs off Paralimni',
    body: 'A reef is a city, and by day it is rush hour. The slower you swim, the more you see: half the residents hide in plain sight.',
    tags: ['Green turtles', 'Loggerhead turtles', 'Octopuses', 'Moray eels', 'Groupers', 'Lionfish', 'Cuttlefish', 'Rays', 'Barracudas', 'Nudibranchs'],
    quote: 'We look with our eyes, not our hands: a reef grows more slowly than one fin kick can break it',
  },
  {
    label: 'Gallery', depth: '16–22 m', kicker: 'Above the drop-off',
    title: 'Six frames from under water',
    body: 'Examples of what ends up in front of the lens on a dive. Tap a photo for a closer look.',
    captions: ['A turtle over the reef', 'Soft corals and a school of anthias', 'A clownfish in its anemone', 'A photo dive in the shallows', 'Manta rays over the plateau', 'The edge of the coral garden'],
  },
  {
    label: 'Dive sites', depth: '18–30 m', kicker: 'The wall',
    title: 'Three dive sites we guide',
    body: 'Small groups, never more than six divers per guide. We match the route to your level: nobody is bored and nobody ends up deeper than they are ready for.',
    rows: [
      ['The Cathedral', '22 m · cave and arch', 'A huge chamber with columns of light falling from above.'],
      ['Blue Grotto', '16 m · grotto and wall', 'At night the walls glow with plankton, and morays live in the tunnels.'],
      ['Poseidon\'s Gardens', '18 m · reef', 'Groupers, octopuses, nudibranchs. A favourite for underwater photography.'],
    ],
    note: 'Gear included, Nitrox and photo dives on request',
  },
  {
    label: 'Safety', depth: '30–35 m', kicker: 'The cave',
    title: 'Five rules of every dive',
    body: 'A good dive is one that leaves you wanting another. So our rules are simple and not up for discussion.',
    checks: [
      'A briefing before every dive: route, depth, time, signals.',
      'A buddy check of the gear before anyone enters the water.',
      'No more than six divers per guide, and two beginners per instructor.',
      'A safety stop at five metres, every time.',
      'Oxygen and a first-aid kit on every boat, in partnership with DAN.',
    ],
    note: 'Caves and anything deeper than 18 m need the right certification.',
  },
  {
    label: 'Team', depth: '33–35 m', kicker: 'Cave exit',
    title: 'The three who go under with you',
    body: 'Under water you trust two things: the person beside you and the gear you are wearing. We answer for both.',
    rows: [
      ['Captain Yiannis', 'PADI Course Director · 20 yrs', 'Founder of the centre. Under water since he learned to walk.'],
      ['Maria', 'SSI Instructor · 14 yrs', 'Rescue and navigation. Has taken more than 800 students into open water.'],
      ['Kostas', 'Divemaster and technician · 9 yrs', 'Knows every metre of the local reefs and keeps the gear in perfect order.'],
    ],
    note: 'Rental every day: BCD, regulator, wetsuit, mask, fins, computer — all serviced and ready.',
  },
  {
    label: 'Booking', depth: '35–40 m', kicker: 'Twilight zone',
    title: 'Write to us before you fly to Cyprus',
    body: 'First time under water or ready for Divemaster — tell us whether you are certified and when you arrive. We will put a programme together and reply within 24 hours.',
    facts: [['PADI', '5-Star IDC'], ['SSI', 'Training Facility'], ['DAN', 'Partner']],
    note: 'Happy Divers, Paralimni, Cyprus',
  },
];

const EN = RU.map((wp, i) => {
  const { captions, ...text } = EN_TEXT[i];
  const merged = { ...wp, ...text };
  if (captions) merged.photos = wp.photos.map(([id], n) => [id, captions[n]]);
  return merged;
});

export const WAYPOINTS = LANG === 'ru' ? RU : EN;
