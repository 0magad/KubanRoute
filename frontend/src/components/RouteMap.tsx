"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

const DAY_COLORS = ['#2E6BB0', '#1A6E3C', '#B05A00', '#6E1A6B', '#8B6914'];
const TYPE_ICONS: Record<string, string> = {
  winery: '🍷', nature: '🏔️', farm: '🌾', park: '🌳', resort: '⛷️',
  entertainment: '🎢', museum: '🏛️', history: '📜', festival: '🎪',
  restaurant: '🍽️', modern: '🏙️', zoo: '🦁',
};

interface RouteMapProps {
  route: any;
  nearbyPlaces?: any[];
  onPlaceClick?: (placeId: string) => void;
}

export default function RouteMap({ route, nearbyPlaces = [], onPlaceClick }: RouteMapProps) {
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ymaps) return;

    (window as any).ymaps.ready(() => {
      const ymaps = (window as any).ymaps;

      const container = document.getElementById("route-map");
      if (container) container.innerHTML = "";

      const map = new ymaps.Map('route-map', {
        center: [44.8, 38.5],
        zoom: 8,
        controls: ['zoomControl', 'fullscreenControl']
      });
      mapRef.current = map;

      if (!route || !route.days) return;

      // Render route days
      route.days.forEach((day: any, di: number) => {
        const color = DAY_COLORS[di % DAY_COLORS.length];

        day.places.forEach((place: any, pi: number) => {
          const icon = TYPE_ICONS[place.type] || '📍';

          const balloonContent = `
            <div style="max-width:280px;font-family:sans-serif;">
              <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">
                День ${di + 1} · ${place.time_start || ''} ${icon}
              </div>
              <div style="font-size:16px;font-weight:700;color:#1a3a2a;margin-bottom:6px;">
                ${place.name}
              </div>
              <div style="font-size:13px;color:#555;line-height:1.4;margin-bottom:8px;">
                ${place.short_description || ''}
              </div>
              ${place.tags?.length ? `
                <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">
                  ${place.tags.slice(0, 3).map((t: string) =>
                    `<span style="font-size:11px;background:#f0f7f0;color:#2d5a3d;padding:2px 8px;border-radius:4px;">${t}</span>`
                  ).join('')}
                </div>
              ` : ''}
              ${place.price_min || place.price_max ? `
                <div style="font-size:12px;color:#b05a00;font-weight:600;">
                  💰 ${place.price_min === 0 ? 'Бесплатно' : `${place.price_min} – ${place.price_max} ₽`}
                </div>
              ` : ''}
              <a href="/place/${place.id}" style="display:inline-block;margin-top:8px;font-size:12px;color:#c0603a;font-weight:600;text-decoration:none;">
                Подробнее →
              </a>
            </div>
          `;

          const pm = new ymaps.Placemark(
            [place.lat, place.lng],
            {
              balloonContent: balloonContent,
              iconContent: pi + 1
            },
            {
              preset: 'islands#circleIcon',
              iconColor: color,
              balloonCloseButton: true,
              hideIconOnBalloonOpen: false,
            }
          );

          pm.events.add('click', () => {
            if (onPlaceClick) onPlaceClick(place.id);
          });

          map.geoObjects.add(pm);
        });

        // Route polyline
        const points = day.places.map((p: any) => [p.lat, p.lng]);
        if (points.length > 1) {
          map.geoObjects.add(new ymaps.Polyline(
            points,
            { balloonContent: `День ${di + 1}: ${day.title || ''}` },
            {
              strokeColor: color,
              strokeWidth: 4,
              strokeOpacity: 0.8,
              strokeStyle: 'solid',
            }
          ));
        }
      });

      // Render nearby recommended places
      if (nearbyPlaces.length > 0) {
        nearbyPlaces.forEach((place: any) => {
          const icon = TYPE_ICONS[place.type] || '📍';
          const pm = new ymaps.Placemark(
            [place.lat, place.lng],
            {
              balloonContent: `
                <div style="max-width:240px;font-family:sans-serif;">
                  <div style="font-size:10px;color:#c0603a;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">
                    ⭐ Рекомендация
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
              iconColor: '#c0603a',
            }
          );
          map.geoObjects.add(pm);
        });
      }

      // Auto-fit bounds
      try {
        map.setBounds(map.geoObjects.getBounds(), {
          checkZoomRange: true,
          zoomMargin: 50
        });
      } catch (e) {
        console.log("No bounds to set");
      }
    });
  }, [route, nearbyPlaces]);

  const openNavigator = (dayPlaces: any[]) => {
    const pts = dayPlaces.map((p: any) => `${p.lat},${p.lng}`).join('~');
    window.open(`yandexnavi://route?waypoints=${pts}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div id="route-map" className="w-full flex-1 min-h-[400px] rounded-2xl overflow-hidden shadow-lg border border-gray-200"></div>

      {route?.days && route.days.map((day: any, i: number) => (
        <button
          key={i}
          onClick={() => openNavigator(day.places)}
          className="w-full bg-slate-900 text-white p-3 rounded-lg hover:bg-slate-800 transition shadow-sm font-medium text-sm"
        >
          🧭 Открыть День {i + 1} в Яндекс.Навигаторе
        </button>
      ))}
    </div>
  );
}
