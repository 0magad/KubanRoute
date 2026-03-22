"use client";

import React, { useEffect, useRef } from 'react';

const DAY_COLORS = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#dc2626'];
const TYPE_ICONS: Record<string, string> = {
  winery: '🍷', nature: '🏔️', farm: '🌾', park: '🌳', resort: '⛷️',
  entertainment: '🎢', museum: '🏛️', history: '📜', festival: '🎪',
  restaurant: '🍽️', modern: '🏙️', zoo: '🦁',
};

interface RouteMapProps {
  route: any;
  nearbyPlaces?: any[];
  selectedDayIndex?: number;
}

export default function RouteMap({ route, nearbyPlaces = [], selectedDayIndex }: RouteMapProps) {
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ymaps) return;

    (window as any).ymaps.ready(() => {
      const ymaps = (window as any).ymaps;

      const container = document.getElementById("route-map");
      if (container) container.innerHTML = "";

      const map = new ymaps.Map('route-map', {
        center: [44.9, 38.0],
        zoom: 8,
        controls: ['zoomControl', 'fullscreenControl', 'rulerControl']
      });
      mapInstanceRef.current = map;

      if (!route || !route.days) return;

      // Collect ALL points across all days for the single continuous polyline
      const allPoints: [number, number][] = [];
      let globalIndex = 1;

      route.days.forEach((day: any, di: number) => {
        const color = DAY_COLORS[di % DAY_COLORS.length];
        const isActiveDay = selectedDayIndex === undefined || selectedDayIndex === di;

        day.places.forEach((place: any, pi: number) => {
          const icon = TYPE_ICONS[place.type] || '📍';
          const pointCoords: [number, number] = [place.lat, place.lng];
          allPoints.push(pointCoords);

          // Balloon content with rich place info
          const balloonContent = `
            <div style="max-width:300px;font-family:-apple-system,sans-serif;padding:4px;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <div style="width:28px;height:28px;border-radius:50%;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;">${globalIndex}</div>
                <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;">День ${di + 1} · ${place.time_start || ''}</div>
              </div>
              <div style="font-size:17px;font-weight:700;color:#1a3a2a;margin-bottom:6px;">
                ${icon} ${place.name}
              </div>
              <div style="font-size:13px;color:#555;line-height:1.5;margin-bottom:8px;">
                ${place.short_description || ''}
              </div>
              ${place.tags?.length ? `
                <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">
                  ${place.tags.slice(0, 3).map((t: string) =>
                    `<span style="font-size:10px;background:#f0f7f0;color:#2d5a3d;padding:3px 8px;border-radius:6px;font-weight:600;">${t}</span>`
                  ).join('')}
                </div>
              ` : ''}
              ${place.price_min > 0 || place.price_max > 0 ? `
                <div style="font-size:12px;color:#b05a00;font-weight:600;margin-bottom:6px;">
                  💰 ${place.price_min === 0 ? 'Бесплатно' : `${place.price_min} – ${place.price_max} ₽`}
                </div>
              ` : ''}
              ${place.distance_from_prev_km > 0 ? `
                <div style="font-size:11px;color:#666;margin-bottom:6px;">
                  🚗 ${place.distance_from_prev_km} км от предыдущей точки (~${Math.ceil(place.distance_from_prev_km / 50 * 60)} мин)
                </div>
              ` : ''}
              <a href="/place/${place.id}" style="display:inline-block;margin-top:4px;font-size:13px;color:#c0603a;font-weight:700;text-decoration:none;padding:6px 14px;background:#fef2ee;border-radius:8px;">
                Подробнее о месте →
              </a>
            </div>
          `;

          const pm = new ymaps.Placemark(
            pointCoords,
            {
              balloonContent: balloonContent,
              iconContent: String(globalIndex),
            },
            {
              preset: 'islands#circleIcon',
              iconColor: isActiveDay ? color : `${color}88`,
              balloonCloseButton: true,
              hideIconOnBalloonOpen: false,
              zIndex: isActiveDay ? 1000 : 500,
            }
          );

          map.geoObjects.add(pm);
          globalIndex++;
        });

        // Day polyline (connects all places within the day)
        const dayPoints = day.places.map((p: any) => [p.lat, p.lng]);
        if (dayPoints.length > 1) {
          map.geoObjects.add(new ymaps.Polyline(
            dayPoints,
            {
              balloonContent: `<b>День ${di + 1}: ${day.title || ''}</b><br/>~${day.total_km || '?'} км`
            },
            {
              strokeColor: color,
              strokeWidth: isActiveDay ? 5 : 3,
              strokeOpacity: isActiveDay ? 0.9 : 0.4,
              strokeStyle: 'solid',
            }
          ));
        }
      });

      // Connect LAST place of each day to FIRST place of next day (dashed transit line)
      for (let di = 0; di < route.days.length - 1; di++) {
        const currentDayPlaces = route.days[di].places;
        const nextDayPlaces = route.days[di + 1].places;
        if (currentDayPlaces.length && nextDayPlaces.length) {
          const lastPlace = currentDayPlaces[currentDayPlaces.length - 1];
          const firstPlace = nextDayPlaces[0];
          map.geoObjects.add(new ymaps.Polyline(
            [[lastPlace.lat, lastPlace.lng], [firstPlace.lat, firstPlace.lng]],
            {},
            {
              strokeColor: '#94a3b8',
              strokeWidth: 2,
              strokeOpacity: 0.5,
              strokeStyle: 'dash',
            }
          ));
        }
      }

      // Nearby recommended places (orange dots)
      if (nearbyPlaces.length > 0) {
        nearbyPlaces.forEach((place: any) => {
          const icon = TYPE_ICONS[place.type] || '📍';
          const pm = new ymaps.Placemark(
            [place.lat, place.lng],
            {
              balloonContent: `
                <div style="max-width:240px;font-family:sans-serif;padding:4px;">
                  <div style="font-size:10px;color:#c0603a;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-weight:700;">
                    ⭐ Интересное рядом
                  </div>
                  <div style="font-size:15px;font-weight:700;color:#1a3a2a;margin-bottom:4px;">
                    ${icon} ${place.name}
                  </div>
                  <div style="font-size:12px;color:#666;line-height:1.4;">
                    ${place.short_description || place.short_desc || ''}
                  </div>
                  <a href="/place/${place.id}" style="display:inline-block;margin-top:6px;font-size:12px;color:#c0603a;font-weight:600;text-decoration:none;">
                    Подробнее →
                  </a>
                </div>
              `,
            },
            {
              preset: 'islands#dotIcon',
              iconColor: '#f97316',
              zIndex: 100,
            }
          );
          map.geoObjects.add(pm);
        });
      }

      // Auto-fit viewport
      try {
        map.setBounds(map.geoObjects.getBounds(), {
          checkZoomRange: true,
          zoomMargin: 60
        });
      } catch (e) {
        console.log("No bounds to set");
      }
    });
  }, [route, nearbyPlaces, selectedDayIndex]);

  const openNavigator = () => {
    if (!route?.days) return;
    const allPlaces = route.days.flatMap((d: any) => d.places);
    const pts = allPlaces.map((p: any) => `${p.lat},${p.lng}`).join('~');
    window.open(`yandexnavi://route?waypoints=${pts}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <div id="route-map" className="w-full flex-1 min-h-[400px] rounded-2xl overflow-hidden shadow-lg border border-gray-200"></div>

      <button
        onClick={openNavigator}
        className="w-full bg-gradient-to-r from-slate-800 to-slate-900 text-white p-3.5 rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all shadow-md font-semibold text-sm flex items-center justify-center gap-2"
      >
        🧭 Открыть весь маршрут в Яндекс.Навигаторе
      </button>

      {/* Day legend */}
      <div className="flex flex-wrap gap-2">
        {route?.days?.map((day: any, i: number) => (
          <div key={i} className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <div className="w-3 h-3 rounded-full" style={{ background: DAY_COLORS[i % DAY_COLORS.length] }} />
            День {i + 1} {day.total_km ? `(~${day.total_km} км)` : ''}
          </div>
        ))}
        {nearbyPlaces.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <div className="w-3 h-3 rounded-full bg-orange-400" />
            Интересное рядом
          </div>
        )}
      </div>
    </div>
  );
}
