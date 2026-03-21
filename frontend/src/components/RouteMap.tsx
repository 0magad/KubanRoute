"use client";

import React, { useEffect } from 'react';

const DAY_COLORS = ['#2E6BB0', '#1A6E3C', '#B05A00', '#6E1A6B', '#8B6914'];

export default function RouteMap({ route }: { route: any }) {
  useEffect(() => {
    // Basic guard to ensure window.ymaps is loaded (script tag should be in layout.tsx)
    if (typeof window !== "undefined" && (window as any).ymaps) {
      (window as any).ymaps.ready(() => {
        const ymaps = (window as any).ymaps;
        
        // Remove previous map container contents to prevent duplication on HMR
        const container = document.getElementById("map");
        if (container) container.innerHTML = "";

        const map = new ymaps.Map('map', {
          center: [44.8, 38.5], 
          zoom: 8,
          controls: ['zoomControl', 'fullscreenControl']
        });

        if (!route || !route.days) return;

        route.days.forEach((day: any, di: number) => {
          const color = DAY_COLORS[di % DAY_COLORS.length];

          // Places markers
          day.places.forEach((place: any, pi: number) => {
            const pm = new ymaps.Placemark(
              [place.lat, place.lng],
              { 
                balloonContent: `<b>${place.name}</b><br/>${place.short_description || ''}`,
                iconContent: pi + 1 
              },
              { 
                preset: 'islands#circleIcon', 
                iconColor: color 
              }
            );
            map.geoObjects.add(pm);
          });

          // Polyline routing (mocking the point array if polyline is absent)
          const points = day.places.map((p: any) => [p.lat, p.lng]);
          if (points.length > 1) {
            map.geoObjects.add(new ymaps.Polyline(
              points,
              { balloonContent: `День ${di + 1}` },
              { strokeColor: color, strokeWidth: 4, strokeOpacity: 0.8 }
            ));
          }
        });

        // Set bounds automatically to fit all markers
        try {
            map.setBounds(map.geoObjects.getBounds(), {
              checkZoomRange: true, 
              zoomMargin: 50
            });
        } catch (e) {
            console.log("No bounds to set");
        }
      });
    }
  }, [route]);

  // Deep Link Navigator
  const openNavigator = (dayPlaces: any[]) => {
    const pts = dayPlaces.map(p => `${p.lat},${p.lng}`).join('~');
    window.open(`yandexnavi://route?waypoints=${pts}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-4">
      <div id="map" className="w-full h-[500px] rounded-2xl overflow-hidden shadow-lg border border-gray-200"></div>
      
      {route?.days && route.days.map((day: any, i: number) => (
         <button 
           key={i}
           onClick={() => openNavigator(day.places)}
           className="w-full bg-slate-900 text-white p-3 rounded-lg hover:bg-slate-800 transition shadow-sm font-medium"
         >
           Открыть День {i + 1} в Яндекс.Навигаторе
         </button>
      ))}
    </div>
  );
}
