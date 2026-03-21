import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata = {
  title: 'KubanRoute — Персонализированные маршруты по Краснодарскому краю',
  description:
    'Генератор персонализированных туристических маршрутов по Краснодарскому краю. Найдите свой идеальный маршрут за 2 минуты — винодельни, фермы, горы и море.',
  keywords: 'Краснодарский край, туризм, маршруты, винодельни, фермы, Кубань, путешествия',
  openGraph: {
    title: 'KubanRoute — Маршруты по Краснодарскому краю',
    description: 'Персональный маршрут за 2 минуты. Винодельни, фермы, природа.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script src={`https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_MAP_API_KEY || ''}&lang=ru_RU`} type="text/javascript"></script>
      </head>
      <body className="min-h-screen bg-cream-100 font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
