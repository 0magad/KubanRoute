"use client";

import { useEffect, useState } from "react";
import Header from "@/components/shared/Header";
import { Star, MapPin, Loader2, Send } from "lucide-react";

export default function PlacePage({ params }: { params: { id: string } }) {
  const [place, setPlace] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewInput, setReviewInput] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Ideally fetch a single place, but for now fallback to the catalog array if get_place isn't strict
    fetch(`http://127.0.0.1:8000/api/places`)
      .then(r => r.json())
      .then(d => {
         const found = d.find((p:any) => p.id === params.id) || d[0];
         setPlace(found);
         setLoading(false);
      })
      .catch(() => setLoading(false));

    // Wait for the endpoint to support fetching reviews for a place, mock for now
    setReviews([
      { id: 1, text: "Очень понравилось, атмосферно!", rating: 5, user_id: "Анна", created_at: "2026-03-20" },
      { id: 2, text: "Дорого, но вкусное вино.", rating: 4, user_id: "Игорь", created_at: "2026-03-22" }
    ]);
  }, [params.id]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewInput.trim() || submitting) return;
    setSubmitting(true);
    
    try {
      await fetch("http://127.0.0.1:8000/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           user_id: "mock-user-id",
           place_id: params.id,
           rating,
           opinion_text: reviewInput
        })
      });

      setReviews([{ id: Date.now(), text: reviewInput, rating, user_id: "Вы", created_at: new Date().toISOString() }, ...reviews]);
      setReviewInput("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="mt-32 text-center text-forest-800 animate-pulse text-xl font-bold">Загрузка информации...</div>;
  if (!place) return <div className="mt-32 text-center text-red-500 font-bold">Место не найдено</div>;

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      <Header />
      
      <div className="w-full h-80 bg-forest-800 mt-16 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        <span className="text-9xl opacity-60 z-0">
             {place.type === "winery" ? "🍷" : place.type === "nature" ? "🏔️" : place.type === "farm" ? "🌾" : "🗺️"}
        </span>
        <div className="absolute bottom-10 left-10 md:left-20 z-20 text-white">
           <span className="uppercase text-xs font-bold bg-terracotta-500 px-3 py-1 rounded-full mb-3 inline-block">
             {place.type}
           </span>
           <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">{place.name}</h1>
           <div className="flex items-center gap-4 text-white/80">
              <span className="flex items-center gap-1"><MapPin size={18} /> {parseFloat(place.lat).toFixed(2)}, {parseFloat(place.lng).toFixed(2)}</span>
              <span className="flex items-center gap-1"><Star size={18} className="fill-gold-400 text-gold-400" /> {place.avg_rating || "5.0"}</span>
           </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-8">
           <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h2 className="text-2xl font-bold text-forest-800 mb-4 font-display">Описание</h2>
             <p className="text-gray-600 leading-relaxed text-lg">
               {place.short_description || "Это удивительное место, которое обязательно стоит посетить во время вашего путешествия по Краснодарскому краю. Здесь вы сможете насладиться уникальной атмосферой и природой."}
             </p>
             <div className="flex flex-wrap gap-2 mt-6">
                {place.tags && place.tags.map((t: string) => (
                  <span key={t} className="bg-forest-50 text-forest-700 font-medium px-3 py-1 rounded-lg text-sm">
                    {t}
                  </span>
                ))}
             </div>
           </section>

           {/* AI Reviews Section */}
           <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-forest-800 font-display">Отзывы ИИ Аналитика</h2>
             </div>

             <form onSubmit={submitReview} className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">Оцените место</label>
                <div className="flex gap-2 mb-4">
                   {[1, 2, 3, 4, 5].map(r => (
                     <button key={r} type="button" onClick={() => setRating(r)} className="focus:outline-none">
                       <Star size={24} className={r <= rating ? "fill-gold-400 text-gold-400" : "text-gray-300"} />
                     </button>
                   ))}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={reviewInput}
                    onChange={e => setReviewInput(e.target.value)}
                    placeholder="Был здесь в прошлые выходные..."
                    className="w-full bg-white border border-gray-300 rounded-xl py-3 pl-4 pr-12 focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 transition-all font-medium text-gray-700"
                    disabled={submitting}
                  />
                  <button type="submit" disabled={submitting || !reviewInput} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-terracotta-500 text-white flex items-center justify-center rounded-lg hover:bg-terracotta-600 transition-colors disabled:opacity-50">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Ваш отзыв будет проанализирован ИИ для корректировки рекомендаций (работает на базе LLM_Service).</p>
             </form>

             <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r.id} className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm">
                     <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-forest-800">{r.user_id}</span>
                        <div className="flex gap-1">
                           {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className={i < r.rating ? "fill-gold-400 text-gold-400" : "text-gray-200"} />
                           ))}
                        </div>
                     </div>
                     <p className="text-gray-600 text-sm">{r.text}</p>
                  </div>
                ))}
             </div>
           </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
           <div className="bg-forest-800 text-white p-6 rounded-2xl shadow-lg border border-forest-900">
             <h3 className="font-bold text-lg mb-4 opacity-90">Информация</h3>
             <ul className="space-y-3 opacity-90 text-sm font-medium">
                <li className="flex justify-between border-b border-forest-700 pb-2">
                  <span className="opacity-70">Время работы:</span>
                  <span>{place.time_start} - {place.time_end}</span>
                </li>
                <li className="flex justify-between border-b border-forest-700 pb-2">
                  <span className="opacity-70">Средний чек:</span>
                  <span>{place.price_min} - {place.price_max} ₽</span>
                </li>
             </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
