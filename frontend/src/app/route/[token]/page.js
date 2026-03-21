'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getRouteByToken } from '@/lib/api';
import { PLACE_TYPES, TAG_LABELS } from '@/lib/constants';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function RoutePage() {
  const params = useParams();
  const [route, setRoute] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [showShareToast, setShowShareToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Try sessionStorage first (just generated)
      const cached = sessionStorage.getItem('kubanroute_result');
      if (cached) {
        try {
          setRoute(JSON.parse(cached));
          setIsLoading(false);
          return;
        } catch (e) {}
      }

      // Fetch by token
      const data = await getRouteByToken(params.token);
      setRoute(data);
      setIsLoading(false);
    }
    load();
  }, [params.token]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-float">🗺️</div>
          <p className="text-forest-600">Загружаем маршрут…</p>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">😔</div>
          <h2 className="font-display text-2xl font-bold text-forest-800 mb-2">Маршрут не найден</h2>
          <p className="text-forest-600/70 mb-6">Попробуйте создать новый маршрут</p>
          <Link href="/survey" className="btn-primary">Создать маршрут</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />

      {/* Hero Header */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-forest-800 via-forest-700 to-terracotta-900" />
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-64 h-64 bg-terracotta-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-80 h-80 bg-gold-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* Meta tags */}
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-2 mb-6">
              {route.meta?.interests?.map((interest) => (
                <span
                  key={interest}
                  className="text-xs bg-white/10 text-white/80 px-3 py-1 rounded-full border border-white/10"
                >
                  {TAG_LABELS[interest] || interest}
                </span>
              ))}
              <span className="text-xs bg-gold-400/20 text-gold-300 px-3 py-1 rounded-full border border-gold-400/20">
                {route.meta?.days} дн.
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={fadeInUp}
              className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6"
            >
              {route.title}
            </motion.h1>

            {/* Intro */}
            <motion.p
              variants={fadeInUp}
              className="text-lg text-white/70 max-w-3xl leading-relaxed mb-8"
            >
              {route.intro}
            </motion.p>

            {/* Action buttons */}
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 py-2.5 px-5 rounded-xl transition-all duration-200 text-sm font-medium"
              >
                🔗 Поделиться
              </button>
              <Link
                href="/survey"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 py-2.5 px-5 rounded-xl transition-all duration-200 text-sm font-medium"
              >
                ✏️ Изменить параметры
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Day tabs */}
      <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-md border-b border-cream-300/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {route.days?.map((day, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className={`
                  flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    activeDay === i
                      ? 'bg-terracotta-500 text-white shadow-md shadow-terracotta-500/20'
                      : 'bg-cream-100 text-forest-600 hover:bg-cream-200'
                  }
                `}
              >
                День {day.day_number}
              </button>
            ))}
            <button className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium bg-cream-100 text-forest-600 hover:bg-cream-200 transition-all duration-200 ml-2">
              📍 Карта
            </button>
          </div>
        </div>
      </div>

      {/* Day content */}
      <section className="py-12 bg-cream-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {route.days?.[activeDay] && (
                <DayContent day={route.days[activeDay]} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Logistics */}
      {route.logistics && (
        <section className="py-12 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-forest-800 mb-8">
              🚗 Логистика
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <LogisticsCard
                icon="🚗"
                title="Транспорт"
                text={route.logistics.transport}
              />
              <LogisticsCard
                icon="🏡"
                title="Жильё"
                text={route.logistics.accommodation}
              />
              <LogisticsCard
                icon="🍽️"
                title="Питание"
                text={route.logistics.food}
              />
            </div>
          </div>
        </section>
      )}

      {/* Share toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-forest-800 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-2"
          >
            ✅ Ссылка скопирована!
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}

function DayContent({ day }) {
  return (
    <div>
      {/* Day header */}
      <div className="mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-forest-800 mb-3">
          День {day.day_number}: {day.title}
        </h2>
        <p className="text-forest-600/70 text-lg leading-relaxed max-w-3xl">
          {day.description}
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="hidden md:block absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-terracotta-300 via-terracotta-400 to-terracotta-300" />

        <div className="space-y-6">
          {day.places?.map((place, i) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative flex gap-6"
            >
              {/* Timeline dot */}
              <div className="hidden md:flex flex-col items-center flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-terracotta-500 to-terracotta-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-terracotta-500/20">
                  {place.time_start || `${10 + i * 2}:00`}
                </div>
              </div>

              {/* Place card */}
              <Link
                href={`/place/${place.id}`}
                className="flex-1 glass-card p-6 card-hover group cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Photo placeholder */}
                  <div className="w-full sm:w-40 h-32 rounded-xl bg-gradient-to-br from-cream-200 to-cream-300 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <span className="text-4xl">{PLACE_TYPES[place.type]?.icon || '📍'}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs font-medium text-terracotta-500 uppercase tracking-wider">
                          {PLACE_TYPES[place.type]?.label || place.type}
                        </span>
                        <h3 className="font-display text-lg font-bold text-forest-800 group-hover:text-terracotta-600 transition-colors mt-0.5">
                          {place.name}
                        </h3>
                      </div>
                      {/* Mobile time */}
                      <span className="md:hidden text-sm text-terracotta-500 font-medium flex-shrink-0">
                        {place.time_start || `${10 + i * 2}:00`}
                      </span>
                    </div>

                    <p className="text-forest-600/70 text-sm leading-relaxed mb-3 line-clamp-2">
                      {place.short_description}
                    </p>

                    <div className="flex items-center flex-wrap gap-2">
                      {/* Price */}
                      {place.price_min != null && (
                        <span className="text-xs bg-forest-50 text-forest-700 px-2.5 py-1 rounded-full font-medium">
                          {place.price_min === 0 ? 'Бесплатно' : `от ${place.price_min} ₽`}
                        </span>
                      )}

                      {/* Time range */}
                      {place.time_start && place.time_end && (
                        <span className="text-xs bg-cream-200 text-forest-600 px-2.5 py-1 rounded-full">
                          {place.time_start} – {place.time_end}
                        </span>
                      )}

                      {/* Tags */}
                      {place.tags?.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs bg-cream-100 text-forest-500 px-2.5 py-1 rounded-full">
                          {TAG_LABELS[tag] || tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LogisticsCard({ icon, title, text }) {
  return (
    <div className="glass-card p-6">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-display text-lg font-bold text-forest-800 mb-2">{title}</h3>
      <p className="text-forest-600/70 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
