// API Base URL
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://kubanroute.onrender.com';

// Survey options
export const SURVEY_STEPS = [
  {
    id: 'group_type',
    question: 'Кто едет?',
    description: 'Выберите тип вашей группы',
    type: 'single',
    options: [
      { value: 'solo', label: 'Соло', icon: '🧑', description: 'Путешествие в одиночку' },
      { value: 'couple', label: 'Пара', icon: '💑', description: 'Романтическое путешествие' },
      { value: 'family', label: 'Семья с детьми', icon: '👨‍👩‍👧‍👦', description: 'Отдых для всей семьи' },
      { value: 'company', label: 'Компания', icon: '👥', description: 'Путешествие с друзьями' },
      { value: 'elderly', label: 'Пожилые', icon: '👴', description: 'Спокойный отдых' },
    ],
  },
  {
    id: 'days',
    question: 'Сколько дней?',
    description: 'Выберите продолжительность поездки',
    type: 'single',
    options: [
      { value: '1-2', label: '1–2 дня', icon: '⚡', description: 'Короткий уикенд' },
      { value: '3-5', label: '3–5 дней', icon: '🌤️', description: 'Мини-отпуск' },
      { value: '7+', label: 'Неделя и больше', icon: '🌴', description: 'Полноценный отдых' },
    ],
  },
  {
    id: 'budget',
    question: 'Бюджет на человека?',
    description: 'Примерный бюджет на всю поездку',
    type: 'single',
    options: [
      { value: 'low', label: 'До 5 000 ₽', icon: '💰', description: 'Бюджетный отдых' },
      { value: 'medium', label: '5 000 – 15 000 ₽', icon: '💳', description: 'Средний бюджет' },
      { value: 'high', label: '15 000+ ₽', icon: '💎', description: 'Комфорт без ограничений' },
    ],
  },
  {
    id: 'interests',
    question: 'Что интересует?',
    description: 'Выберите одну или несколько тем',
    type: 'multi',
    options: [
      { value: 'wine', label: 'Вино', icon: '🍷', description: 'Дегустации и винодельни' },
      { value: 'nature', label: 'Природа', icon: '🌿', description: 'Горы, водопады, леса' },
      { value: 'history', label: 'История', icon: '🏛️', description: 'Казачьи станицы и музеи' },
      { value: 'farming', label: 'Фермерство', icon: '🌾', description: 'Фермы и агротуризм' },
      { value: 'active', label: 'Активный отдых', icon: '🏔️', description: 'Треккинг и спорт' },
      { value: 'remote', label: 'Удалённая работа', icon: '💻', description: 'Коворкинги и тишина' },
    ],
  },
  {
    id: 'transport',
    question: 'Есть автомобиль?',
    description: 'Это влияет на доступные места',
    type: 'single',
    options: [
      { value: 'yes', label: 'Да, есть', icon: '🚗', description: 'Максимум возможностей' },
      { value: 'no', label: 'Нет', icon: '🚌', description: 'Только общ. транспорт' },
      { value: 'rent', label: 'Готов арендовать', icon: '🔑', description: 'Арендуем на месте' },
    ],
  },
];

// Loading hints that rotate during route generation
export const LOADING_HINTS = [
  'Подбираем лучшие места для вас…',
  'Изучаем виноградники Тамани…',
  'Проверяем расписание фестивалей…',
  'Строим оптимальный маршрут…',
  'Выбираем уютные гостевые дома…',
  'Рассчитываем время в пути…',
  'Добавляем атмосферные описания…',
  'Почти готово! Финальные штрихи…',
];

// Place types
export const PLACE_TYPES = {
  farm: { label: 'Ферма', icon: '🌾', color: 'forest' },
  winery: { label: 'Винодельня', icon: '🍷', color: 'terracotta' },
  guesthouse: { label: 'Гостевой дом', icon: '🏡', color: 'gold' },
  craft: { label: 'Мастерская', icon: '🎨', color: 'terracotta' },
  nature: { label: 'Природа', icon: '🌿', color: 'forest' },
  festival: { label: 'Фестиваль', icon: '🎉', color: 'gold' },
  route: { label: 'Маршрут', icon: '🥾', color: 'forest' },
  restaurant: { label: 'Ресторан', icon: '🍽️', color: 'terracotta' },
};

// Tag labels
export const TAG_LABELS = {
  child_friendly: 'Для детей',
  elderly_friendly: 'Для пожилых',
  couples: 'Для пар',
  solo: 'Для одного',
  groups: 'Для групп',
  remote_workers: 'Для удалёнщиков',
  public_transport: 'Общ. транспорт',
  car_required: 'Нужна машина',
  walking_distance_from_town: 'Пешком из города',
  wine_tasting: 'Дегустация вин',
  farming: 'Фермерство',
  hiking: 'Треккинг',
  history: 'История',
  crafts: 'Мастер-классы',
  gastronomy: 'Гастрономия',
  festival: 'Фестиваль',
  coworking: 'Коворкинг',
  free_entry: 'Бесплатно',
  booking_required: 'Бронирование',
  guided_tour_only: 'Только экскурсии',
  pet_friendly: 'С животными',
  disabled_access: 'Доступная среда',
  parking: 'Парковка',
  wifi: 'Wi-Fi',
};

// Month names
export const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель',
  'Май', 'Июнь', 'Июль', 'Август',
  'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
