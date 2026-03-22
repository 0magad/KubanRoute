import RoutesFeed from '@/components/Feed/RoutesFeed';

export const metadata = {
  title: 'Лента маршрутов | KubanRoute',
  description: 'Подобрано специально для вас',
};

export default function FeedPage() {
  return (
    <main className="min-h-screen bg-neutral-100 text-gray-900 w-full pb-20">
      <RoutesFeed />
    </main>
  );
}
