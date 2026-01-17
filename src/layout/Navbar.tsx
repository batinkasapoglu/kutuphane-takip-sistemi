import { Bell } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [time, setTime] = useState(new Date());
  const [lateCount, setLateCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Get late borrowings count
    const loadStats = async () => {
      try {
        const limit = await window.api.getSetting("borrow_limit_days");
        const active = await window.api.getActiveBorrowings();
        const limitDays = Number(limit || 15);
        
        const late = active.filter((br) => {
          const days = Math.floor(
            (Date.now() - new Date(br.borrowDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          return days > limitDays;
        });
        
        setLateCount(late.length);
      } catch (error) {
        console.error(error);
      }
    };
    
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const dateStr = time.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeStr = time.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="w-full h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      {/* Left - Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-800">
          📚 Kütüphane Otomasyonu
        </h1>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-4">
        {/* Date & Time */}
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">{timeStr}</p>
          <p className="text-xs text-gray-500">{dateStr}</p>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <Bell size={20} />
          </button>
          {lateCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {lateCount > 9 ? "9+" : lateCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}