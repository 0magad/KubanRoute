"use client";

import { useEffect, useState } from "react";
import RouteMap from "@/components/RouteMap";
import Header from "@/components/shared/Header";
import { Download } from "lucide-react";

export default function RouteResultPage({ params }: { params: { token: string } }) {
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/routes/${params.token}`)
      .then((r) => r.json())
      .then((d) => {
        setRoute(d);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        // Fallback to session mock if backend is down
        const s = sessionStorage.getItem("kubanroute_result");
        if (s) setRoute(JSON.parse(s));
        setLoading(false);
      });
  }, [params.token]);

  if (loading) return <div className="mt-32 text-center text-2xl font-bold font-display text-forest-800">Загрузка маршрута...</div>;
  if (!route) return <div className="mt-32 text-center text-red-500 font-display text-xl">Маршрут не найден</div>;

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      <Header />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 pt-24 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Info */}
        <div className="space-y-8">
          <div>
             <h1 className="text-4xl font-display font-bold text-forest-800">{route.title}</h1>
             <p className="mt-4 text-forest-700/80 leading-relaxed text-lg">{route.intro}</p>
          </div>

          <div className="flex gap-4">
            <a 
              href={`http://127.0.0.1:8000/api/routes/${params.token}/pdf`}
              download
              className="btn-primary flex items-center justify-center gap-2 py-3 px-6 text-sm w-full sm:w-auto shadow-md"
            >
              <Download size={18} /> Скачать PDF (Маршрутный лист)
            </a>
          </div>

          <div className="space-y-6">
            {route.days?.map((day: any) => (
               <div key={day.day_number} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-forest-800 mb-2">День {day.day_number}: {day.title}</h2>
                  <p className="text-gray-600 mb-4">{day.description}</p>
                  <div className="space-y-4">
                     {day.places?.map((p: any, i: number) => (
                        <div key={i} className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                           <div className="w-16 h-12 bg-terracotta-100 text-terracotta-700 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-sm border border-terracotta-200">
                              {p.time_start}
                           </div>
                           <div>
                              <h3 className="font-bold text-gray-800 text-lg">{p.name}</h3>
                              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{p.short_description}</p>
                              <div className="flex flex-wrap gap-2 mt-3">
                                 {p.tags?.slice(0, 4).map((t: string) => (
                                    <span key={t} className="text-xs font-medium bg-white border border-gray-200 text-gray-500 px-2 py-1 rounded-md">
                                       {t}
                                    </span>
                                 ))}
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            ))}
          </div>
          
          {/* Logistics Box */}
          <div className="bg-forest-800 text-white p-6 rounded-2xl shadow-lg mt-8">
             <h3 className="font-bold text-xl mb-4 font-display">Логистика и Советы</h3>
             <ul className="space-y-3 opacity-90">
                <li>🚗 {route.logistics?.transport}</li>
                <li>🏨 {route.logistics?.accommodation}</li>
                <li>🍽️ {route.logistics?.food}</li>
             </ul>
          </div>
        </div>

        {/* Right Side: Route Map Component Component */}
        <div className="lg:sticky lg:top-24 h-[600px] lg:h-[calc(100vh-8rem)] rounded-2xl shadow-2xl overflow-hidden border-4 border-white">
          <RouteMap route={route} />
        </div>
      </div>
    </div>
  );
}
