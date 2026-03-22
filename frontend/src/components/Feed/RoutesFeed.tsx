'use client';

import React from 'react';
import { mockRoutes } from '@/data/mockRoutes';
import RouteCard from './RouteCard';

export default function RoutesFeed() {
  if (mockRoutes.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 h-screen">
        Нет доступных маршрутов
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto pt-6 px-4 md:px-0 flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Ваша лента</h1>
        <p className="text-gray-500 mt-1">Основано на ваших интересах и предыдущих поездках</p>
      </div>
      
      {mockRoutes.map((route) => (
        <RouteCard key={route.id} route={route} />
      ))}
    </div>
  );
}
