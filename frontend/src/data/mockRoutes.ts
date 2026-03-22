// Mock route data for route examples

export interface RoutePoint {
  id: string;
  type: 'start' | 'waypoint' | 'end';
  name: string;
  coordinates: [number, number]; // [lat, lng]
  photoUrl?: string;
  shortDescription?: string;
}

export interface RouteFeedItem {
  id: string;
  title: string;
  description: string;
  distance: string;
  duration: string;
  points: RoutePoint[];
  optionalPoints?: RoutePoint[];
}

export const mockRoutes: RouteFeedItem[] = [
  {
    id: 'route-1',
    title: 'Большой винный тур: от Краснодара до моря',
    description: 'Масштабное путешествие по главным винодельням и терруарам Кубани с дегустациями и экскурсиями.',
    distance: '180 км',
    duration: '3.5 часа',
    points: [
      {
        id: 'r3-1',
        type: 'start',
        name: 'Краснодар (Старт)',
        coordinates: [45.035470, 38.975313],
      },
      {
        id: 'r3-2',
        type: 'waypoint',
        name: 'Винодельня Собер Баш',
        coordinates: [44.789173, 38.834015],
        photoUrl: '/images/routes/sober_bash.png',
        shortDescription: 'Уютная винодельня у подножия горы Собер-Баш с уникальными автохтонными сортами.'
      },
      {
        id: 'r3-3',
        type: 'waypoint',
        name: 'Долина Лефкадия',
        coordinates: [44.945209, 37.848383],
        photoUrl: '/images/routes/lefkadia.png',
        shortDescription: 'Российская Тоскана: бескрайние виноградники, лаванда, сыроварня и музей вина.'
      },
      {
        id: 'r3-4',
        type: 'waypoint',
        name: 'Винзавод Саук-Дере',
        coordinates: [44.896191, 37.886022],
        photoUrl: '/images/routes/sauk_dere.png',
        shortDescription: 'Легендарные подземные винные подвалы в бывших сланцевых шахтах.'
      },
      {
        id: 'r3-5',
        type: 'end',
        name: 'Завод шампанских ВИН Абрау-Дюрсо',
        coordinates: [44.704245, 37.596957],
      }
    ],
    optionalPoints: [
      { id: 'op2', type: 'waypoint', name: 'Дача Брежнева', coordinates: [44.883516, 38.847913], photoUrl: '/images/routes/dacha_brezhneva.png', shortDescription: 'Исторический объект (по желанию)' },
      { id: 'op3', type: 'waypoint', name: 'Лавандовая ферма', coordinates: [44.841315, 38.531444], photoUrl: '/images/routes/lavender_farm.jpg', shortDescription: 'Фотозона (по желанию)' },
      { id: 'op4', type: 'waypoint', name: 'Перекаты', coordinates: [44.830991, 38.159392], photoUrl: '/images/routes/perekaty.png', shortDescription: 'Красивый вид (по желанию)' },
      { id: 'op5', type: 'waypoint', name: 'Часовня', coordinates: [44.873971, 37.749835], photoUrl: '/images/routes/chapel.png', shortDescription: 'Архитектура (по желанию)' },
      { id: 'op6', type: 'waypoint', name: 'Гора Лысая-Новороссийская', coordinates: [44.762751, 37.784803], photoUrl: '/images/routes/gora_lysaya.png', shortDescription: 'Панорама (по желанию)' },
    ]
  },
  {
    id: 'route-2',
    title: 'Винный тур выходного дня',
    description: 'Идеальный маршрут для ценителей вина и живописных пейзажей в районе Новороссийска.',
    distance: '120 км',
    duration: '2.5 часа',
    points: [
      {
        id: 'p1',
        type: 'start',
        name: 'Краснодар (Старт)',
        coordinates: [45.035470, 38.975313],
      },
      {
        id: 'p2',
        type: 'waypoint',
        name: 'Винодельня Шато Пино',
        coordinates: [44.685363, 37.749004],
        photoUrl: 'https://cdn.mesto.ru/photos/2021/04/13/2f664b28-cd58-45fc-adb5-392da2778ca9.jpg',
        shortDescription: 'Знаменитая винодельня с рестораном и улиточной фермой.',
      },
      {
        id: 'p3',
        type: 'waypoint',
        name: 'Абрау-Дюрсо',
        coordinates: [44.704245, 37.596957],
        photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Abrau-Durso_Lake.jpg/1200px-Abrau-Durso_Lake.jpg',
        shortDescription: 'Родина российского шампанского у лазурного озера.',
      },
      {
        id: 'p4',
        type: 'end',
        name: 'Новороссийск (Набережная)',
        coordinates: [44.717757, 37.781669],
      }
    ]
  },
  {
    id: 'route-3',
    title: 'Горный ретрит в Сочи',
    description: 'Маршрут от побережья к вершинам Красной Поляны с потрясающими смотровыми.',
    distance: '85 км',
    duration: '2 часа',
    points: [
      {
        id: 's1',
        type: 'start',
        name: 'Сочи (Центр)',
        coordinates: [43.585278, 39.720278],
      },
      {
        id: 's2',
        type: 'waypoint',
        name: 'Скайпарк',
        coordinates: [43.523821, 39.997275],
        photoUrl: 'https://sochi.ru/upload/iblock/934/9341857c5a05bced3e51af5862dff786.jpg',
        shortDescription: 'Самый длинный подвесной пешеходный мост.',
      },
      {
        id: 's3',
        type: 'end',
        name: 'Роза Хутор',
        coordinates: [43.670984, 40.297479],
      }
    ]
  }
];
