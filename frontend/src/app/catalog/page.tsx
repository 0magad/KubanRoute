"use client";

import { useEffect, useState } from "react";
import Header from "@/components/shared/Header";
import PlaceCard from "@/components/PlaceCard";
import SwipeTest from "@/components/SwipeTest";

export default function CatalogPage() {
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSwipe, setShowSwipe] = useState(false);

  useEffect(() => {
    // Check if user has done the swipe test before
    if (typeof window !== "undefined") {
      const swiped = localStorage.getItem("kubanroute_swiped");
      if (!swiped) {
        setShowSwipe(true);
        localStorage.setItem("kubanroute_swiped", "true");
      }
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/places`)
      .then(res => res.json())
      .then(data => {
        setPlaces(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      <Header />

      {showSwipe && <SwipeTest onClose={() => setShowSwipe(false)} />}

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl font-display font-bold text-forest-800">Каталог мест</h1>
          <p className="mt-3 text-lg text-forest-700/70 max-w-2xl">
            Откройте для себя уникальные локации Краснодарского края. Просматривайте, лайкайте и планируйте!
          </p>
        </div>

        {/* Filters Mock */}
        <div className="flex flex-wrap gap-3 mb-8">
          {["Все", "Винодельни 🍷", "Природа 🏔️", "Фермы 🌾", "Рестораны 🍽️"].map(f => (
            <button key={f} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-forest-700 hover:border-terracotta-500 hover:text-terracotta-600 transition-colors shadow-sm">
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-forest-700 text-lg animate-pulse font-bold">
            Загрузка каталога...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {places.map((place: any, i: number) => (
              <PlaceCard key={place.id || i} place={place} />
            ))}
            {places.length === 0 && (
              <div className="col-span-full text-center text-gray-500 mt-10">Нет мест для отображения.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
