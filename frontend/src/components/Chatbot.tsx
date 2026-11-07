import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Car, Users, Fuel, Gauge, Loader2 } from 'lucide-react';

interface Vehicle {
  id: number;
  name: string;
  type: string;
  pricePerDay: number;
  fuel: string;
  transmission: string;
  seats: number;
  location: string;
  imageUrl: string;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
  vehicles?: Vehicle[];
}

// Configurable API URL (uses env variable on Vercel or falls back to localhost/render)
const API_BASE_URL = import.meta.env['VITE_API_URL'] || 'http://localhost:8000';

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Hello! I am your RideFleet Assistant. Ask me anything like "Find automatic cars in Raipur under ₹3000".'
    }
  ]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userQuery = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userQuery }]);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userQuery }),
      });

      if (!response.ok) throw new Error('Network error');

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: data.reply, vehicles: data.vehicles }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I had trouble searching the fleet right now. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 rounded-full shadow-xl transition-all transform hover:scale-105"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="font-semibold text-sm">Ask AI Assistant</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="w-[360px] sm:w-[410px] h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3.5 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/50 rounded-lg">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight">RideFleet Assistant</h3>
                <p className="text-xs text-blue-100">Live AI Fleet Search</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1.5 rounded-full text-blue-100 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Text Bubble */}
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Render Returned Vehicles */}
                {msg.vehicles && msg.vehicles.length > 0 && (
                  <div className="w-full mt-2.5 space-y-2.5">
                    {msg.vehicles.map((v) => (
                      <div
                        key={v.id}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
                      >
                        {v.imageUrl && (
                          <img
                            src={v.imageUrl}
                            alt={v.name}
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div className="p-3">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-semibold text-gray-900 text-xs">{v.name}</h4>
                            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                              ₹{v.pricePerDay}/day
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">{v.location}</p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-600 border-t border-gray-100 pt-2">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-gray-400" /> {v.seats} Seats
                            </span>
                            <span className="flex items-center gap-1">
                              <Fuel className="w-3 h-3 text-gray-400" /> {v.fuel}
                            </span>
                            <span className="flex items-center gap-1">
                              <Gauge className="w-3 h-3 text-gray-400" /> {v.transmission}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-gray-500 text-xs py-1">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Searching vehicle database...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="e.g. Find SUVs under ₹3000..."
              className="flex-1 text-sm border border-gray-300 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};