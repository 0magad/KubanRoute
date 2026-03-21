"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MapPin, Star } from "lucide-react";
import { tracker } from "@/lib/tracker";

// Mock auth ID, in real app get from useSession()
const USER_ID = "mock-user-id";

export default function PlaceCard({ place }: { place: any }) {
  const [liked, setLiked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent Link navigation
    const newLiked = !liked;
    setLiked(newLiked);
    if (typeof window !== "undefined") {
      if (newLiked) tracker.onLike(place.id);
      else tracker.onUnlike(place.id);
    }
  };

  const handleView = () => {
    if (typeof window !== "undefined") {
      tracker.onCardOpen(place.id);
    }
  };

  return (
    <Link href={`/place/${place.id}`} onClick={handleView} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full transform hover:-translate-y-1">
        
        {/* Abstract Photo Placeholder */}
        <div className="relative h-48 bg-gradient-to-tr from-forest-500 to-terracotta-500 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all duration-300" />
          <span className="text-5xl opacity-80 mix-blend-overlay">
             {place.type === "winery" ? "🍷" : place.type === "nature" ? "🏔️" : place.type === "farm" ? "🌾" : "🗺️"}
          </span>
          
          <button 
            onClick={handleLike}
            className="absolute top-3 right-3 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/40 transition-colors z-10"
          >
            <Heart size={20} fill={liked ? "#ef4444" : "none"} stroke={liked ? "#ef4444" : "white"} />
          </button>

          <div className="absolute bottom-3 left-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider backdrop-saturate-150">
             {place.type}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-forest-900 text-lg line-clamp-1 group-hover:text-terracotta-600 transition-colors">
              {place.name}
            </h3>
          </div>
          
          <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-4 flex-1">
            {place.short_description || "Красивое место в сердце Кубани, которое стоит посетить."}
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-400 font-medium mb-4">
            <div className="flex items-center gap-1">
              <MapPin size={16} className="text-terracotta-500 opacity-70" />
              <span>{parseFloat(place.lat).toFixed(2)}, {parseFloat(place.lng).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star size={16} className="text-gold-400 opacity-90 fill-gold-400" />
              <span>{place.avg_rating ? place.avg_rating.toFixed(1) : "Новое"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-50">
            {place.tags && place.tags.slice(0, 3).map((t: string) => (
              <span key={t} className="text-[10px] bg-forest-50 text-forest-700 px-2 py-1 rounded-md font-semibold tracking-wide">
                {t}
              </span>
            ))}
            {place.tags && place.tags.length > 3 && (
              <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-1 rounded-md font-semibold tracking-wide">
                +{place.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
