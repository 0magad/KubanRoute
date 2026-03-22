"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2 } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([{ role: "assistant", content: "Привет! Я Кубаноид — твой ИИ-помощник по Краснодарскому краю. Какой отдых ищешь?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const newMsgs = [...messages, { role: "user", content: input }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      if (!res.body) throw new Error("No readable stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botResponse = "";

      setMessages([...newMsgs, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                botResponse += data.token;
                setMessages([...newMsgs, { role: "assistant", content: botResponse }]);
              } else if (data.error) {
                setMessages([...newMsgs, { role: "assistant", content: `❌ Ошибка ИИ: ${data.error}` }]);
              }
            } catch (err) { }
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: "assistant", content: "Произошла ошибка связи с ИИ." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 pt-20 pb-10 flex justify-center px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-100">

        {/* Header */}
        <div className="bg-forest-800 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-terracotta-500 flex items-center justify-center text-white font-bold shadow-md">
            К
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Kuban.AI</h1>
            <p className="text-white/70 text-sm">Персональный гид</p>
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[65vh]">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center ${m.role === "user" ? "bg-slate-200 text-slate-600" : "bg-forest-100 text-forest-700"}`}>
                {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl max-w-[80%] ${m.role === "user" ? "bg-forest-800 text-white rounded-tr-none shadow-md" : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none shadow-sm"}`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <form onSubmit={sendMessage} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Расскажи, куда хочешь поехать..."
              className="w-full bg-white border border-gray-200 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-terracotta-500/50 focus:border-terracotta-500 transition-all shadow-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-terracotta-500 rounded-full text-white flex items-center justify-center hover:bg-terracotta-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="translate-x-0.5" />}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-3 flex justify-center gap-4">
            <span className="cursor-pointer hover:text-terracotta-500 transition" onClick={() => setInput("Едем с детьми на выходные, бюджет 10к")}>🧒 С детьми</span>
            <span className="cursor-pointer hover:text-terracotta-500 transition" onClick={() => setInput("Хочу на винодельню недалеко от Новороссийска")}>🍷 Винодельни</span>
            <span className="cursor-pointer hover:text-terracotta-500 transition" onClick={() => setInput("Тихий отдых на природе без людей")}>🏕️ Природа</span>
          </p>
        </div>
      </div>
    </div>
  );
}
