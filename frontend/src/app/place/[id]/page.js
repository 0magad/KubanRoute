'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { tracker } from '@/lib/tracker';
import { getPlace } from '@/lib/api';
import { PLACE_TYPES, TAG_LABELS, MONTHS } from '@/lib/constants';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

// Demo place data for when backend is unavailable
const DEMO_PLACES = {
  'place-001': {
    id: 'place-001',
    name: 'Винодельня «Кубань-Вино»',
    type: 'winery',
    description: 'Кубань-Вино — одна из крупнейших виноделен юга России, расположенная в самом сердце Таманского полуострова. Здесь, среди бескрайних виноградников, рождаются вина, которые знает вся страна. Но настоящее волшебство начинается, когда вы спускаетесь в прохладные погреба, где в дубовых бочках тихо стареют будущие шедевры.\n\nЭкскурсия начинается с прогулки по виноградным рядам — если приехать в сентябре, можно попасть на сбор урожая. Затем вас проведут по производству и погребам, а в финале ждёт дегустация 5–7 сортов в уютном зале с видом на виноградники.',
    short_description: 'Одна из крупнейших виноделен с экскурсиями по погребам и дегустацией от 500 ₽.',
    lat: 45.2117,
    lng: 36.7144,
    address: 'Краснодарский край, Темрюкский р-н, ст. Старотитаровская, ул. Заводская, 2',
    region: 'Темрюкский район',
    tags: ['wine_tasting', 'parking', 'guided_tour_only', 'couples'],
    seasons: [5, 6, 7, 8, 9, 10],
    price_min: 500,
    price_max: 1500,
    has_car_required: false,
    working_hours: { 'Пн-Пт': '10:00–18:00', 'Сб-Вс': '10:00–17:00' },
    photos: [],
    contacts: { phone: '+7 (861) 234-56-78', website: 'kubanvino.ru' },
    status: 'approved',
  },
  'place-002': {
    id: 'place-002',
    name: 'Фермерское хозяйство «Баракат»',
    type: 'farm',
    description: 'Маленькая семейная ферма, где козы гуляют по зелёным холмам, а в сыроварне пахнет свежим козьим сыром. Хозяева — Раиса и Ахмед — сами проведут вас по ферме, расскажут про каждую козу по имени и дадут попробовать сыр, которому нет аналогов в магазинах.\n\nДети будут в восторге: можно покормить козлят из бутылочки, собрать яйца у кур и помочь в огороде. А взрослые оценят домашнее вино и прохладу террасы с видом на поля.',
    short_description: 'Семейная сыроварня с дегустацией козьего сыра и прогулкой по ферме.',
    lat: 45.1962,
    lng: 36.8301,
    address: 'Краснодарский край, Темрюкский р-н, пос. Вышестеблиевская',
    region: 'Темрюкский район',
    tags: ['farming', 'child_friendly', 'gastronomy', 'free_entry', 'parking'],
    seasons: [4, 5, 6, 7, 8, 9, 10],
    price_min: 300,
    price_max: 800,
    has_car_required: true,
    working_hours: { 'Ежедневно': '09:00–18:00' },
    photos: [],
    contacts: { phone: '+7 (918) 123-45-67' },
    status: 'approved',
  },
};

export default function PlacePage() {
  const params = useParams();
  const [place, setPlace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      let data = await getPlace(params.id);

      // Fallback to demo data
      if (!data && DEMO_PLACES[params.id]) {
        data = DEMO_PLACES[params.id];
      }

      // Fallback to generic demo
      if (!data) {
        data = {
          id: params.id,
          name: 'Место не найдено',
          type: 'nature',
          description: 'Информация об этом месте будет добавлена в ближайшее время.',
          short_description: '',
          lat: 45.0,
          lng: 37.0,
          address: 'Краснодарский край',
          region: 'Краснодарский край',
          tags: [],
          seasons: [1,2,3,4,5,6,7,8,9,10,11,12],
          price_min: 0,
          price_max: 0,
          working_hours: {},
          photos: [],
          contacts: {},
          status: 'approved',
        };
      }

      setPlace(data);
      setIsLoading(false);

      // Track page view
      if (typeof window !== 'undefined') {
        tracker.onCardOpen(params.id);
      }

      // Load reviews
      try {
        const reviewsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${params.id}`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData);
        }
      } catch (e) {
        console.error('Failed to load reviews', e);
      }
    }
    load();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-float">📍</div>
          <p className="text-forest-600">Загружаем информацию о месте…</p>
        </div>
      </div>
    );
  }

  const placeType = PLACE_TYPES[place.type] || { label: place.type, icon: '📍', color: 'forest' };

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="relative pt-16">
        <div className="h-64 md:h-80 bg-gradient-to-br from-forest-700 via-forest-600 to-terracotta-800 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl opacity-20">{placeType.icon}</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      </section>

      {/* Content */}
      <section className="relative -mt-16 z-10 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 md:p-10 shadow-xl"
          >
            {/* Type badge */}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta-600 uppercase tracking-wider bg-terracotta-50 px-3 py-1.5 rounded-full mb-4">
              {placeType.icon} {placeType.label}
            </span>

            {/* Name */}
            <h1 className="font-display text-3xl md:text-4xl font-bold text-forest-800 mb-2">
              {place.name}
            </h1>

            {/* Region */}
            <p className="text-forest-600/60 mb-6 flex items-center gap-1">
              📍 {place.address || place.region}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {place.tags?.map((tag) => (
                <span key={tag} className="text-xs bg-cream-100 text-forest-600 px-3 py-1.5 rounded-full border border-cream-300">
                  {TAG_LABELS[tag] || tag}
                </span>
              ))}
            </div>

            {/* Description */}
            <div className="prose prose-forest max-w-none mb-10">
              {place.description?.split('\n\n').map((paragraph, i) => (
                <p key={i} className="text-forest-700/80 leading-relaxed mb-4 text-base">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* Price */}
              <InfoBlock icon="💰" title="Стоимость">
                {place.price_min === 0
                  ? 'Бесплатно'
                  : `${place.price_min} – ${place.price_max} ₽`}
              </InfoBlock>

              {/* Transport */}
              <InfoBlock icon="🚗" title="Как добраться">
                {place.has_car_required
                  ? 'Рекомендуется автомобиль'
                  : 'Доступно на общественном транспорте'}
              </InfoBlock>

              {/* Working hours */}
              {place.working_hours && Object.keys(place.working_hours).length > 0 && (
                <InfoBlock icon="🕐" title="Часы работы">
                  {Object.entries(place.working_hours).map(([day, hours]) => (
                    <div key={day} className="text-sm">
                      <span className="font-medium">{day}:</span> {hours}
                    </div>
                  ))}
                </InfoBlock>
              )}

              {/* Contacts */}
              {place.contacts && Object.keys(place.contacts).length > 0 && (
                <InfoBlock icon="📞" title="Контакты">
                  {place.contacts.phone && <div className="text-sm">{place.contacts.phone}</div>}
                  {place.contacts.website && (
                    <div className="text-sm text-terracotta-500 hover:text-terracotta-700">
                      🌐 {place.contacts.website}
                    </div>
                  )}
                </InfoBlock>
              )}
            </div>

            {/* Seasonality */}
            {place.seasons && place.seasons.length > 0 && (
              <div className="mb-10">
                <h3 className="font-display text-xl font-bold text-forest-800 mb-4">
                  📅 Лучшее время для посещения
                </h3>
                <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                  {MONTHS.map((month, i) => {
                    const isActive = place.seasons.includes(i + 1);
                    return (
                      <div
                        key={i}
                        className={`
                          text-center py-2 px-1 rounded-lg text-xs font-medium transition-all
                          ${isActive
                            ? 'bg-forest-500 text-white shadow-sm'
                            : 'bg-cream-200 text-forest-400'
                          }
                        `}
                      >
                        {month.slice(0, 3)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="mb-10">
              <h3 className="font-display text-xl font-bold text-forest-800 mb-6">
                💬 Отзывы ({reviews.length})
              </h3>

              {/* Submit Review Form */}
              <div className="bg-cream-50 rounded-xl border border-cream-200 p-5 mb-6">
                <h4 className="font-semibold text-forest-800 text-sm mb-3">Оставить отзыв</h4>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`text-2xl transition-transform hover:scale-110 ${
                        star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-forest-600 self-center">{reviewRating}/5</span>
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Поделитесь впечатлениями о месте..."
                  className="w-full border border-cream-300 rounded-lg p-3 text-sm text-forest-800 focus:outline-none focus:ring-2 focus:ring-terracotta-500/50 resize-none h-24 bg-white"
                />
                <button
                  disabled={submitting || !reviewText.trim()}
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          place_id: place.id,
                          rating: reviewRating,
                          text: reviewText,
                        }),
                      });
                      // Reload reviews
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${place.id}`);
                      if (res.ok) setReviews(await res.json());
                      setReviewText('');
                      setReviewRating(5);
                    } catch (e) {
                      console.error('Review submit error', e);
                    }
                    setSubmitting(false);
                  }}
                  className="mt-3 px-6 py-2 bg-terracotta-500 text-white rounded-lg text-sm font-semibold hover:bg-terracotta-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Отправка...' : 'Отправить отзыв'}
                </button>
              </div>

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <p className="text-forest-600/50 text-sm text-center py-6">Пока нет отзывов. Будьте первым!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r, i) => (
                    <div key={r.id || i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 text-xs font-bold">
                            {(r.user_id || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-forest-800">Путешественник</span>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={`text-sm ${s <= r.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-forest-700/80 leading-relaxed">{r.text}</p>
                      {r.created_at && (
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(r.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Back button */}
            <div className="flex items-center gap-4 pt-6 border-t border-cream-300">
              <button
                onClick={() => window.history.back()}
                className="btn-outline text-sm py-2 px-6"
              >
                ← Назад к каталогу
              </button>
              <Link href="/survey" className="btn-primary text-sm py-2 px-6">
                Создать маршрут
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}

function InfoBlock({ icon, title, children }) {
  return (
    <div className="p-5 bg-cream-50 rounded-xl border border-cream-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <h4 className="font-semibold text-forest-800 text-sm">{title}</h4>
      </div>
      <div className="text-forest-700/70">{children}</div>
    </div>
  );
}
