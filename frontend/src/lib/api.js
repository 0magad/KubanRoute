import { API_BASE } from './constants';

/**
 * Generate a route based on user profile
 */
export async function generateRoute(profile) {
  try {
    const res = await fetch(`${API_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Generate route error:', error);
    // Return demo route as fallback
    return getDemoRoute(profile);
  }
}

/**
 * Get all places with optional filters
 */
export async function getPlaces(filters = {}) {
  try {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/api/places?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Get places error:', error);
    return [];
  }
}

/**
 * Get a single place by ID
 */
export async function getPlace(id) {
  try {
    const res = await fetch(`${API_BASE}/api/places/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Get place error:', error);
    return null;
  }
}

/**
 * Get a shared route by token
 */
export async function getRouteByToken(token) {
  try {
    const res = await fetch(`${API_BASE}/api/routes/${token}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Get route error:', error);
    return getDemoRoute();
  }
}

/**
 * Submit business form
 */
export async function submitBusiness(formData) {
  try {
    const res = await fetch(`${API_BASE}/api/business/submit`, {
      method: 'POST',
      body: formData, // multipart/form-data
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Submit business error:', error);
    throw error;
  }
}

/**
 * Demo route fallback when backend is unavailable
 */
function getDemoRoute(profile = {}) {
  return {
    id: 'demo-route-001',
    share_token: 'demo123',
    title: 'Три дня вокруг Темрюка: виноград, грязевые вулканы и домашний сыр',
    intro: 'Этот маршрут — для тех, кто устал от шумных пляжей и хочет увидеть Кубань такой, какой её знают местные. Вы проедете через виноградники, где собирают урожай руками. Попробуете сыр, который не найти ни в одном магазине. И увидите закат с вершины грязевого вулкана — зрелище, которое невозможно забыть.',
    profile: profile,
    meta: {
      days: 3,
      budget: 'medium',
      group_type: profile.group_type || 'couple',
      interests: profile.interests || ['wine', 'nature', 'farming'],
    },
    days: [
      {
        day_number: 1,
        title: 'Винная дорога Тамани',
        description: 'Первый день — знакомство с виноградниками и тихими дорогами полуострова. Начнёте с утренней прогулки по виноградным рядам, а закончите вечерней дегустацией в погребе старой усадьбы.',
        places: [
          {
            id: 'place-001',
            name: 'Винодельня «Кубань-Вино»',
            type: 'winery',
            short_description: 'Одна из крупнейших виноделен с экскурсиями по погребам и дегустацией от 500 ₽.',
            lat: 45.2117,
            lng: 36.7144,
            time_start: '10:00',
            time_end: '12:00',
            price_min: 500,
            price_max: 1500,
            tags: ['wine_tasting', 'parking', 'guided_tour_only'],
            photos: ['/images/demo/winery1.jpg'],
          },
          {
            id: 'place-002',
            name: 'Фермерское хозяйство «Баракат»',
            type: 'farm',
            short_description: 'Семейная сыроварня с дегустацией козьего сыра и прогулкой по ферме.',
            lat: 45.1962,
            lng: 36.8301,
            time_start: '13:00',
            time_end: '15:00',
            price_min: 300,
            price_max: 800,
            tags: ['farming', 'child_friendly', 'gastronomy', 'free_entry'],
            photos: ['/images/demo/farm1.jpg'],
          },
          {
            id: 'place-003',
            name: 'Грязевой вулкан Тиздар',
            type: 'nature',
            short_description: 'Природный вулкан с целебной грязью. Купание в грязевом кратере — уникальный опыт.',
            lat: 45.1234,
            lng: 36.8012,
            time_start: '16:00',
            time_end: '18:00',
            price_min: 700,
            price_max: 700,
            tags: ['nature', 'child_friendly', 'parking'],
            photos: ['/images/demo/nature1.jpg'],
          },
        ],
      },
      {
        day_number: 2,
        title: 'Атамань и казачья история',
        description: 'Второй день посвящён истории и традициям Кубани. Вы окунётесь в атмосферу казачьей станицы, попробуете борщ по столетнему рецепту и увидите закат над лиманом.',
        places: [
          {
            id: 'place-004',
            name: 'Этнографический комплекс «Атамань»',
            type: 'festival',
            short_description: 'Реконструкция казачьей станицы под открытым небом. Мастер-классы и традиционная кухня.',
            lat: 45.2301,
            lng: 36.6112,
            time_start: '10:00',
            time_end: '14:00',
            price_min: 400,
            price_max: 400,
            tags: ['history', 'child_friendly', 'crafts', 'gastronomy'],
            photos: ['/images/demo/ataman1.jpg'],
          },
          {
            id: 'place-005',
            name: 'Виноградники «Фанагория»',
            type: 'winery',
            short_description: 'Легендарная винодельня с панорамными виноградниками. Авторские экскурсии и дегустации.',
            lat: 45.1900,
            lng: 36.5800,
            time_start: '15:00',
            time_end: '17:30',
            price_min: 600,
            price_max: 2000,
            tags: ['wine_tasting', 'parking', 'couples'],
            photos: ['/images/demo/winery2.jpg'],
          },
        ],
      },
      {
        day_number: 3,
        title: 'Лавандовые поля и домашний мёд',
        description: 'Последний день — расслабленный и атмосферный. Лавандовые поля, пасека с домашним мёдом и фермерский рынок, где вы соберёте гостинцы домой.',
        places: [
          {
            id: 'place-006',
            name: 'Лавандовое поле «Прованс Кубани»',
            type: 'nature',
            short_description: 'Фотогеничное лавандовое поле с ароматерапией и магазином эфирных масел.',
            lat: 45.0812,
            lng: 37.0233,
            time_start: '09:00',
            time_end: '11:00',
            price_min: 200,
            price_max: 200,
            tags: ['nature', 'couples', 'parking', 'free_entry'],
            photos: ['/images/demo/lavender1.jpg'],
          },
          {
            id: 'place-007',
            name: 'Пасека «Золотой улей»',
            type: 'farm',
            short_description: 'Экскурсия по пасеке с дегустацией 6 сортов мёда. Мастер-класс по свечам из воска.',
            lat: 45.0980,
            lng: 37.0420,
            time_start: '12:00',
            time_end: '14:00',
            price_min: 350,
            price_max: 350,
            tags: ['farming', 'child_friendly', 'crafts'],
            photos: ['/images/demo/honey1.jpg'],
          },
          {
            id: 'place-008',
            name: 'Фермерский рынок Темрюка',
            type: 'restaurant',
            short_description: 'Крупнейший фермерский рынок полуострова. Свежие овощи, домашние сыры и вино.',
            lat: 45.2768,
            lng: 37.3806,
            time_start: '15:00',
            time_end: '17:00',
            price_min: 0,
            price_max: 0,
            tags: ['gastronomy', 'free_entry', 'public_transport'],
            photos: ['/images/demo/market1.jpg'],
          },
        ],
      },
    ],
    logistics: {
      transport: 'Маршрут рассчитан на автомобиль. Расстояние между точками 15–40 км.',
      accommodation: 'Рекомендуем гостевой дом «Усадьба на лимане» — 2 500 ₽/сутки.',
      food: 'Обед включён в маршрут: фермерские кафе и дегустации.',
    },
  };
}
