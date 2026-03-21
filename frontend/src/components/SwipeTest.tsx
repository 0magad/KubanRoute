"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X } from "lucide-react";
import { tracker } from "@/lib/tracker";

// Mock initial tags to establish a profile baseline
const SWIPE_CARDS = [
  { id: "swipe-1", name: "Дегустация в шато", tags: ["wine", "gastronomy"], image: "🍷" },
  { id: "swipe-2", name: "Палатки на скалах", tags: ["nature", "hiking"], image: "🏔️" },
  { id: "swipe-3", name: "Казачья станица", tags: ["history", "family"], image: "🛖" },
  { id: "swipe-4", name: "Морская вечеринка", tags: ["party", "beach"], image: "⛵" },
  { id: "swipe-5", name: "Сыроварня в горах", tags: ["farming", "gastronomy"], image: "🧀" },
];

export default function SwipeTest({ onClose }: { onClose: () => void }) {
  const [cards, setCards] = useState(SWIPE_CARDS);
  const [leaveX, setLeaveX] = useState(0);

  const handleSwipe = (direction: "left" | "right") => {
    if (cards.length === 0) return;

    const current = cards[0];
    // Record event
    if (typeof window !== "undefined") {
       if (direction === "right") tracker.onLike(current.id);
    }

    setLeaveX(direction === "right" ? 1000 : -1000);
    setTimeout(() => {
      setCards((prev) => prev.slice(1));
      setLeaveX(0);
      if (cards.length === 1) {
         // Force flush to backend then close
         tracker.flush();
         onClose();
      }
    }, 300);
  };

  if (cards.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-forest-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 relative flex flex-col items-center">
        
        <div className="text-center mb-8">
           <h2 className="text-2xl font-bold font-display text-forest-900">Давайте знакомиться!</h2>
           <p className="text-gray-500 mt-2">Смахните вправо то, что вам нравится, чтобы ИИ узнал ваши вкусы.</p>
        </div>

        <div className="relative w-full aspect-[4/5] max-w-sm flex items-center justify-center">
          <AnimatePresence>
            {cards.length > 0 && (
              <motion.div
                key={cards[0].id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, x: 0, rotate: 0 }}
                exit={{ x: leaveX, opacity: 0, rotate: leaveX > 0 ? 15 : -15 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-gradient-to-br from-cream-200 to-terracotta-100 rounded-3xl shadow-xl flex flex-col items-center justify-center border-4 border-white cursor-grab active:cursor-grabbing p-6"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_e, { offset }) => {
                  if (offset.x > 100) handleSwipe("right");
                  else if (offset.x < -100) handleSwipe("left");
                }}
              >
                <div className="text-8xl mb-8 filter drop-shadow-lg">{cards[0].image}</div>
                <h3 className="text-2xl font-bold text-center text-forest-900">{cards[0].name}</h3>
                <div className="flex gap-2 mt-4">
                   {cards[0].tags.map(t => <span key={t} className="bg-white/50 px-3 py-1 rounded-full text-xs font-bold text-forest-700 uppercase">{t}</span>)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-8 mt-10">
           <button 
             onClick={() => handleSwipe("left")}
             className="w-16 h-16 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-red-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-md active:scale-95"
           >
             <X size={32} strokeWidth={3} />
           </button>
           <button 
             onClick={() => handleSwipe("right")}
             className="w-16 h-16 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-green-500 hover:text-green-600 hover:border-green-200 hover:bg-green-50 transition-all shadow-md active:scale-95"
           >
             <Heart size={32} strokeWidth={3} fill="currentColor" />
           </button>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          Пропустить
        </button>
      </div>
    </div>
  );
}
