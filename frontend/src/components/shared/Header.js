'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream-100/80 backdrop-blur-md border-b border-cream-300/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🌿</span>
            <span className="font-display text-xl font-bold text-forest-700 group-hover:text-terracotta-500 transition-colors">
              KubanRoute
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/chat"
              className="text-sm font-medium text-terracotta-600 hover:text-terracotta-700 transition-colors flex items-center gap-1"
            >
              ИИ-Ассистент 🪄
            </Link>
            <Link
              href="/catalog"
              className="text-sm font-bold text-forest-700 hover:text-terracotta-500 transition-colors"
            >
              Каталог мест
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm font-medium text-forest-700/70 hover:text-forest-700 transition-colors"
            >
              Как это работает
            </Link>
            <Link
              href="/#examples"
              className="text-sm font-medium text-forest-700/70 hover:text-forest-700 transition-colors"
            >
              Примеры маршрутов
            </Link>
          </nav>

          {/* CTA & Auth */}
          <div className="flex items-center gap-4">
            <Link href="/auth/signin" className="text-sm font-bold text-forest-800 hover:text-terracotta-600 transition-colors">
              Войти
            </Link>
            <Link href="/survey" className="btn-primary text-sm py-2 px-5 shadow-md">
              Построить маршрут
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
