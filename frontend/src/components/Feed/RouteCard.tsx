'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RouteFeedItem } from '@/data/mockRoutes';
import { MapPin, Navigation2, Clock, Share2, Heart, MessageCircle } from 'lucide-react';

interface RouteCardProps {
  route: RouteFeedItem;
}

export default function RouteCard({ route }: RouteCardProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    let mapInstance: any = null;

    const initMap = () => {
      // @ts-ignore
      if (!window.ymaps) return;
      // @ts-ignore
      window.ymaps.ready(() => {
        if (!mapRef.current) return;
        mapRef.current.innerHTML = ''; // clear any previous maps

        // @ts-ignore
        const map = new window.ymaps.Map(mapRef.current, {
          center: route.points[0].coordinates,
          zoom: 10,
          controls: ['zoomControl']
        }, {
          suppressMapOpenBlock: true,
        });

        // For a feed, disable scrolling the map when the user scrolls the page
        map.behaviors.disable(['scrollZoom']);

        const coords = route.points.map(p => p.coordinates);

        // OSRM: бесплатный маршрут по реальным дорогам
        const osrmCoords = route.points.map(p => `${p.coordinates[1]},${p.coordinates[0]}`).join(';');
        
        fetch(`https://router.project-osrm.org/route/v1/driving/${osrmCoords}?overview=full&geometries=geojson`)
          .then(res => res.json())
          .then(data => {
            if (data.code === 'Ok' && data.routes.length > 0) {
              const routeGeometry = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
              
              // @ts-ignore — Тёмная обводка (стиль Яндекс.Навигатор)
              const outlineLine = new window.ymaps.Polyline(routeGeometry, {}, {
                strokeColor: '#388E3C',
                strokeWidth: 10,
                strokeOpacity: 0.7,
              });
              
              // @ts-ignore — Зелёная линия маршрута (Яндекс.Навигатор)
              const routeLine = new window.ymaps.Polyline(routeGeometry, {}, {
                strokeColor: '#50C758',
                strokeWidth: 7,
                strokeOpacity: 1,
              });
              
              map.geoObjects.add(outlineLine);
              map.geoObjects.add(routeLine);
              map.setBounds(routeLine.geometry.getBounds(), { checkZoomRange: true, zoomMargin: 40 });
            } else {
              throw new Error("OSRM routing failed");
            }
          })
          .catch(err => {
            console.warn("OSRM Router failed, falling back to direct line:", err);
            // @ts-ignore
            const fallbackOutline = new window.ymaps.Polyline(coords, {}, {
              strokeColor: '#388E3C', strokeWidth: 10, strokeOpacity: 0.7
            });
            // @ts-ignore
            const fallbackLine = new window.ymaps.Polyline(coords, {}, {
              strokeColor: '#50C758',
              strokeWidth: 7,
              strokeStyle: 'shortdash'
            });
            map.geoObjects.add(fallbackOutline);
            map.geoObjects.add(fallbackLine);
            // @ts-ignore
            map.setBounds(window.ymaps.util.bounds.fromPoints(coords), { checkZoomRange: true, zoomMargin: 40 });
          });

        // Опциональные точки (серые) — рисуем ПЕРВЫМИ, чтобы основные маркеры были поверх
        // Фабрика hint-лейаута с миниатюрой
        const createPhotoHint = (name: string, photoUrl?: string) => {
          const imgHtml = photoUrl
            ? `<img src="${photoUrl}" style="width:160px;height:100px;object-fit:cover;border-radius:6px 6px 0 0;display:block;" />`
            : '';
          // @ts-ignore
          return window.ymaps.templateLayoutFactory.createClass(
            '<div style="background:white;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.25);overflow:hidden;min-width:160px;max-width:180px;">' +
            imgHtml +
            '<div style="padding:6px 10px 8px;font-size:13px;font-weight:600;color:#1a1a1a;line-height:1.3;">' + name + '</div>' +
            '</div>'
          );
        };

        if (route.optionalPoints) {
          route.optionalPoints.forEach(point => {
            // @ts-ignore
            const placemark = new window.ymaps.Placemark(point.coordinates, {
              hintContent: point.name,
            }, {
              preset: 'islands#grayCircleDotIcon',
              iconColor: '#9CA3AF',
              hintLayout: createPhotoHint(point.name, point.photoUrl),
            });

            placemark.events.add('click', (e: any) => {
              e.preventDefault(); 
              setActivePointId(point.id);
            });

            map.geoObjects.add(placemark);
          });
        }

        // Кастомные HTML-маркеры в стиле Яндекс.Навигатора (поверх опциональных)
        // @ts-ignore
        const startLayout = window.ymaps.templateLayoutFactory.createClass(
          '<div style="width:32px;height:32px;border-radius:50%;background:#3C3C3C;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="5" fill="white"/></svg>' +
          '</div>'
        );
        // @ts-ignore
        const endLayout = window.ymaps.templateLayoutFactory.createClass(
          '<div style="width:32px;height:32px;border-radius:50%;background:#F44336;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white"/></svg>' +
          '</div>'
        );

        let waypointIndex = 1;
        route.points.forEach(point => {
          if (point.type === 'start') {
            // @ts-ignore
            const placemark = new window.ymaps.Placemark(point.coordinates, {
              hintContent: point.name,
            }, {
              iconLayout: startLayout,
              iconShape: { type: 'Circle', coordinates: [16, 16], radius: 16 },
              iconOffset: [-16, -16],
              hintLayout: createPhotoHint(point.name, point.photoUrl),
            });
            placemark.events.add('click', (e: any) => { e.preventDefault(); setActivePointId(point.id); });
            map.geoObjects.add(placemark);
          } else if (point.type === 'end') {
            // @ts-ignore
            const placemark = new window.ymaps.Placemark(point.coordinates, {
              hintContent: point.name,
            }, {
              iconLayout: endLayout,
              iconShape: { type: 'Circle', coordinates: [16, 16], radius: 16 },
              iconOffset: [-16, -16],
              hintLayout: createPhotoHint(point.name, point.photoUrl),
            });
            placemark.events.add('click', (e: any) => { e.preventDefault(); setActivePointId(point.id); });
            map.geoObjects.add(placemark);
          } else {
            const idx = waypointIndex++;
            // @ts-ignore
            const wpLayout = window.ymaps.templateLayoutFactory.createClass(
              '<div style="width:28px;height:28px;border-radius:6px;background:#3C3C3C;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px;">' +
              idx +
              '</div>'
            );
            // @ts-ignore
            const placemark = new window.ymaps.Placemark(point.coordinates, {
              hintContent: point.name,
            }, {
              iconLayout: wpLayout,
              iconShape: { type: 'Rectangle', coordinates: [[0, 0], [28, 28]] },
              iconOffset: [-14, -14],
              hintLayout: createPhotoHint(point.name, point.photoUrl),
            });
            placemark.events.add('click', (e: any) => { e.preventDefault(); setActivePointId(point.id); });
            map.geoObjects.add(placemark);
          }
        });

        mapInstance = map;
        setMapLoaded(true);
      });
    };

    // ymaps загружается глобально из layout.js, просто ждём готовности
    const checkAndInit = () => {
      // @ts-ignore
      if (window.ymaps) {
        initMap();
      } else {
        // Скрипт ещё не догрузился, ждём
        setTimeout(checkAndInit, 200);
      }
    };
    checkAndInit();

    return () => {
      if (mapInstance) mapInstance.destroy();
    };
  }, [route]);

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col mb-4 transition-all hover:shadow-md">
      {/* Header (Author / Title) */}
      <div className="flex items-center p-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mr-4 flex-shrink-0">
          {route.title.charAt(0)}
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900 leading-tight">{route.title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">От рекомендательной системы</p>
        </div>
      </div>

      {/* Post Text Description */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 leading-relaxed">{route.description}</p>
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-blue-600">
            <Navigation2 className="w-4 h-4" /> {route.distance}
          </span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-blue-600">
            <Clock className="w-4 h-4" /> {route.duration}
          </span>
        </div>
      </div>

      {/* Map Content (The "Photo" of the FB Post) */}
      <div className="relative w-full h-[320px] bg-neutral-100 rounded-none overflow-hidden">
        <div ref={mapRef} className="absolute inset-0 w-full h-full" />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">
            Загрузка карты маршрута...
          </div>
        )}
      </div>

      {/* Horizontal Carousel of Stops (Under the Map) */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Места по пути</h3>
        
        <div className="flex overflow-x-auto gap-4 pb-3" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {[...route.points.filter(p => p.type !== 'start' && p.type !== 'end'), ...(route.optionalPoints || [])].map(point => (
            <div 
              key={point.id} 
              className={`flex flex-col flex-shrink-0 w-[180px] bg-white border rounded-xl overflow-hidden shadow-sm cursor-pointer transition-colors ${activePointId === point.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}
              onClick={() => setActivePointId(point.id)}
            >
              <div className="h-28 bg-gray-200 w-full relative">
                {point.photoUrl ? (
                  <img src={point.photoUrl} alt={point.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full"><MapPin className="text-gray-400 w-8 h-8"/></div>
                )}
              </div>
              <div className="p-3">
                <p className="font-bold text-sm text-gray-900 truncate">{point.name}</p>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{point.shortDescription || 'Остановка'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FB-like Actions Footer */}
      <div className="flex border-t border-gray-100 px-2 py-1">
        <button 
          onClick={() => setLiked(!liked)}
          className={`flex items-center justify-center gap-2 flex-1 py-3 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors ${liked ? 'text-red-500' : 'text-gray-600'}`}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} /> 
          {liked ? 'В избранном' : 'Сохранить'}
        </button>
        <button 
          onClick={() => router.push(`/route/${route.id}`)}
          className="flex items-center justify-center gap-2 flex-1 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <MessageCircle className="w-5 h-5" /> Детали
        </button>
        <button className="flex items-center justify-center gap-2 flex-1 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Share2 className="w-5 h-5" /> Отправить
        </button>
      </div>
    </div>
  );
}
