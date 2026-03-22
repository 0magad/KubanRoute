"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RouteMap from "@/components/RouteMap";
import Header from "@/components/shared/Header";
import Link from "next/link";
import { Download, MapPin, Clock, Tag } from "lucide-react";

export default function RouteResultPage() {
  const params = useParams();
  const token = params.token as string;
  const [route, setRoute] = useState<any>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    // Try to load from API first, then fallback to sessionStorage
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/routes/${token}`)
      .then((r) => r.json())
      .then((d) => {
        setRoute(d);
        setLoading(false);
        loadNearbyPlaces(d);
      })
      .catch((e) => {
        console.error(e);
        const s = sessionStorage.getItem("kubanroute_result");
        if (s) {
          const parsed = JSON.parse(s);
          setRoute(parsed);
          loadNearbyPlaces(parsed);
        }
        setLoading(false);
      });
  }, [token]);

  const loadNearbyPlaces = async (routeData: any) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/places`);
      const allPlaces = await res.json();
      if (!Array.isArray(allPlaces)) return;

      // Get all place IDs already in the route
      const routePlaceIds = new Set<string>();
      routeData?.days?.forEach((day: any) => {
        day.places?.forEach((p: any) => routePlaceIds.add(p.id));
      });

      // Filter out places already in route, keep up to 10 nearby ones
      const nearby = allPlaces
        .filter((p: any) => !routePlaceIds.has(p.id))
        .slice(0, 10);

      setNearbyPlaces(nearby);
    } catch (e) {
      console.error("Failed to load nearby places", e);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🗺️</div>
          <p className="text-forest-600 text-xl font-display font-bold">Загрузка маршрута...</p>
        </div>
      </div>
    );

  if (!route)
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">😔</div>
          <p className="text-red-500 font-display text-xl font-bold">Маршрут не найден</p>
          <Link href="/catalog" className="mt-4 inline-block text-terracotta-500 hover:underline">
            ← Вернуться в каталог
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      <Header />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 pt-24 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Side: Route Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-forest-800">{route.title}</h1>
            <p className="mt-4 text-forest-700/80 leading-relaxed text-lg">{route.intro}</p>
          </div>

          {/* Route Meta */}
          {route.meta && (
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1.5 bg-forest-100 text-forest-700 rounded-full text-sm font-semibold">
                📅 {route.meta.days} дней
              </span>
              <span className="px-3 py-1.5 bg-terracotta-100 text-terracotta-700 rounded-full text-sm font-semibold">
                💰 {route.meta.budget === 'low' ? 'Эконом' : route.meta.budget === 'medium' ? 'Средний' : 'Премиум'}
              </span>
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                👥 {route.meta.group_type === 'solo' ? 'Соло' : route.meta.group_type === 'couple' ? 'Пара' : route.meta.group_type === 'family' ? 'Семья' : 'Компания'}
              </span>
            </div>
          )}

          {/* PDF Download */}
          <div className="flex gap-4">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/api/routes/${token}/pdf`}
              download
              className="btn-primary flex items-center justify-center gap-2 py-3 px-6 text-sm w-full sm:w-auto shadow-md"
            >
              <Download size={18} /> Скачать PDF
            </a>
          </div>

          {/* Day Tabs */}
          <div className="flex gap-2 flex-wrap">
            {route.days?.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeDay === i
                    ? 'bg-forest-800 text-white shadow-md'
                    : 'bg-white text-forest-700 border border-gray-200 hover:border-forest-400'
                }`}
              >
                День {i + 1}
              </button>
            ))}
          </div>

          {/* Active Day Content */}
          {route.days && route.days[activeDay] && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-forest-800 mb-2">
                День {route.days[activeDay].day_number}: {route.days[activeDay].title}
              </h2>
              <p className="text-gray-600 mb-5">{route.days[activeDay].description}</p>

              <div className="space-y-4">
                {route.days[activeDay].places?.map((p: any, i: number) => (
                  <Link
                    href={`/place/${p.id}`}
                    key={i}
                    className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl hover:bg-terracotta-50 transition-colors group cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-terracotta-100 text-terracotta-700 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 shadow-sm border border-terracotta-200">
                      <span className="text-xs opacity-70">{p.time_start}</span>
                      <span className="text-lg">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 text-lg group-hover:text-terracotta-600 transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed line-clamp-2">
                        {p.short_description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {p.tags?.slice(0, 4).map((t: string) => (
                          <span key={t} className="text-xs font-medium bg-white border border-gray-200 text-gray-500 px-2 py-1 rounded-md">
                            {t}
                          </span>
                        ))}
                        {(p.price_min > 0 || p.price_max > 0) && (
                          <span className="text-xs font-medium bg-terracotta-50 text-terracotta-600 px-2 py-1 rounded-md">
                            💰 {p.price_min}–{p.price_max} ₽
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Logistics Box */}
          {route.logistics && (
            <div className="bg-forest-800 text-white p-6 rounded-2xl shadow-lg">
              <h3 className="font-bold text-xl mb-4 font-display">Логистика и Советы</h3>
              <ul className="space-y-3 opacity-90">
                <li>🚗 {route.logistics.transport}</li>
                <li>🏨 {route.logistics.accommodation}</li>
                <li>🍽️ {route.logistics.food}</li>
              </ul>
            </div>
          )}
        </div>

        {/* Right Side: Map */}
        <div className="lg:sticky lg:top-24 h-[600px] lg:h-[calc(100vh-8rem)] rounded-2xl shadow-2xl overflow-hidden border-4 border-white">
          <RouteMap route={route} nearbyPlaces={nearbyPlaces} />
        </div>
      </div>
    </div>
  );
}
