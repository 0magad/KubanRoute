'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const FEATURES = [
  {
    icon: '⏱️',
    title: '2 минуты',
    desc: '5 вопросов — и ваш персональный маршрут готов. Никаких часов поиска.',
  },
  {
    icon: '🗺️',
    title: 'Не «как у всех»',
    desc: 'Скрытые винодельни, фермы и мастерские, о которых знают только местные.',
  },
  {
    icon: '📖',
    title: 'Маршрут-история',
    desc: 'Не список мест, а сценарий поездки с атмосферой, логистикой и нарративом.',
  },
];

const EXAMPLE_ROUTES = [
  {
    title: 'Винная дорога Тамани',
    days: 3,
    tags: ['Вино', 'Гастрономия'],
    desc: 'Виноградники, погреба, дегустации и закат над лиманом',
    gradient: 'from-terracotta-500 to-gold-400',
    icon: '🍷',
  },
  {
    title: 'Горы и водопады Адыгеи',
    days: 5,
    tags: ['Природа', 'Активный отдых'],
    desc: 'Фишт, Большой Тхач, каньоны и горные реки',
    gradient: 'from-forest-500 to-forest-700',
    icon: '🏔️',
  },
  {
    title: 'Семейный уикенд на ферме',
    days: 2,
    tags: ['Семья', 'Фермерство'],
    desc: 'Козы, мёд, мастерские и свежий воздух для детей',
    gradient: 'from-gold-400 to-terracotta-400',
    icon: '🌾',
  },
];

export default function Home() {
  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-forest-800 via-forest-700 to-forest-900" />
          {/* Decorative shapes */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-terracotta-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-forest-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-white/80">Краснодарский край • {new Date().getFullYear()}</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={fadeInUp}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
            >
              Откройте{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-terracotta-400">
                Кубань
              </span>
              <br />
              такой, какой её знают местные
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Персональный маршрут за 2 минуты — винодельни, фермы, горы и скрытые жемчужины
              региона. Не список мест, а сценарий вашей поездки.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/survey"
                className="group relative bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white font-bold py-4 px-10 rounded-2xl text-lg shadow-xl shadow-terracotta-500/30 hover:shadow-2xl hover:shadow-terracotta-500/40 hover:-translate-y-1 transition-all duration-300"
              >
                <span className="relative z-10">Построить маршрут →</span>
                <div className="absolute inset-0 bg-gradient-to-r from-terracotta-600 to-terracotta-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <a
                href="#how-it-works"
                className="text-white/70 font-medium hover:text-white transition-colors py-4 px-6"
              >
                Как это работает ↓
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeInUp} className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto">
              {[
                { value: '50+', label: 'мест' },
                { value: '2', label: 'минуты' },
                { value: '∞', label: 'маршрутов' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-display text-3xl font-bold text-gold-400">{stat.value}</div>
                  <div className="text-sm text-white/50 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1"
          >
            <div className="w-1.5 h-3 bg-white/50 rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-cream-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeInUp} className="text-terracotta-500 font-semibold text-sm uppercase tracking-wider mb-3">
              Просто и быстро
            </motion.p>
            <motion.h2 variants={fadeInUp} className="section-title">
              Как это работает
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="glass-card p-8 text-center card-hover"
              >
                <div className="text-5xl mb-5">{feature.icon}</div>
                <h3 className="font-display text-xl font-bold text-forest-800 mb-3">{feature.title}</h3>
                <p className="text-forest-700/70 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Steps */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="mt-20 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0"
          >
            {[
              { step: '1', text: 'Ответьте на 5 вопросов' },
              { step: '2', text: 'Подождите 5 секунд' },
              { step: '3', text: 'Получите маршрут-историю' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp} className="flex items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-terracotta-500 to-terracotta-600 text-white font-bold flex items-center justify-center text-sm shadow-lg">
                    {item.step}
                  </div>
                  <span className="font-medium text-forest-800">{item.text}</span>
                </div>
                {i < 2 && (
                  <div className="hidden md:block mx-6 text-forest-300">→</div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Example Routes */}
      <section id="examples" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeInUp} className="text-terracotta-500 font-semibold text-sm uppercase tracking-wider mb-3">
              Вдохновение
            </motion.p>
            <motion.h2 variants={fadeInUp} className="section-title">
              Примеры маршрутов
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {EXAMPLE_ROUTES.map((route, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group relative overflow-hidden rounded-2xl shadow-lg card-hover cursor-pointer"
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${route.gradient} opacity-90`} />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all duration-300" />

                <div className="relative z-10 p-8 h-full flex flex-col justify-between min-h-[280px]">
                  <div>
                    <div className="text-4xl mb-4">{route.icon}</div>
                    <h3 className="font-display text-2xl font-bold text-white mb-2">{route.title}</h3>
                    <p className="text-white/80 text-sm leading-relaxed">{route.desc}</p>
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex gap-2">
                      {route.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-white/20 text-white px-3 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-white/70 font-medium">{route.days} дн.</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mt-12"
          >
            <Link href="/survey" className="btn-primary text-lg py-4 px-12">
              Создать свой маршрут →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Business CTA Section */}
      <section className="py-24 bg-forest-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 variants={fadeInUp} className="font-display text-3xl md:text-4xl font-bold text-white mb-6">
              Владеете фермой, винодельней или гостевым домом?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-white/70 text-lg mb-8 leading-relaxed">
              Добавьте своё место бесплатно — и получайте целевых туристов
              без затрат на маркетинг. Заполнение займёт 10 минут.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Link href="/business" className="inline-flex items-center gap-2 bg-gold-400 text-forest-900 font-bold py-4 px-10 rounded-2xl text-lg hover:bg-gold-300 transition-all duration-300 hover:-translate-y-1 shadow-xl">
                🏢 Добавить своё место
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}
