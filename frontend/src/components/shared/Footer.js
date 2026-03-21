import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-forest-800 text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🌿</span>
              <span className="font-display text-xl font-bold text-white">
                KubanRoute
              </span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Генератор персонализированных туристических маршрутов по Краснодарскому краю.
              Откройте Кубань с нестандартной стороны.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Навигация</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/survey" className="text-sm text-white/60 hover:text-gold-400 transition-colors">
                  Построить маршрут
                </Link>
              </li>
              <li>
                <Link href="/#examples" className="text-sm text-white/60 hover:text-gold-400 transition-colors">
                  Примеры маршрутов
                </Link>
              </li>
              <li>
                <Link href="/business" className="text-sm text-white/60 hover:text-gold-400 transition-colors">
                  Добавить своё место
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Контакты</h4>
            <ul className="space-y-2">
              <li className="text-sm text-white/60">
                📧 hello@kubanroute.ru
              </li>
              <li className="text-sm text-white/60">
                📱 Telegram: @kubanroute
              </li>
              <li className="text-sm text-white/60">
                🏠 Краснодарский край, Россия
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/40">
            © 2025 KubanRoute. Все права защищены.
          </p>
          <Link
            href="/business"
            className="text-sm text-gold-400 hover:text-gold-300 font-medium transition-colors"
          >
            🏢 Добавить своё место →
          </Link>
        </div>
      </div>
    </footer>
  );
}
