import { Link, useLocation } from "react-router-dom";
import {
  Book,
  Bookmark,
  Users,
  School,
  HandPlatter,
  Clock,
  Settings,
  LayoutDashboard,
  Printer,
  Library,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const { pathname } = useLocation();

  const menu = [
    { name: "Genel Bakış", path: "/dashboard", icon: LayoutDashboard },
    { type: "divider", label: "Ödünç İşlemleri" },
    { name: "Kitap Ödünç Ver", path: "/borrow", icon: HandPlatter },
    { name: "Aktif Ödünçler", path: "/borrow/active", icon: Clock },
    { type: "divider", label: "Kitap & Öğrenci" },
    { name: "Kitaplar", path: "/books", icon: Book },
    { name: "Kategoriler", path: "/categories", icon: Bookmark },
    { name: "Sınıflar", path: "/classes", icon: School },
    { name: "Öğrenciler", path: "/students", icon: Users },
    { type: "divider", label: "Yönetim" },
    { name: "Etiket Yazdırma", path: "/labels", icon: Printer },
    { name: "Ayarlar", path: "/settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-linear-to-b from-slate-900 to-slate-950 text-slate-300 h-full flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-5 flex items-center gap-3 text-white border-b border-slate-800/50">
        <div className="p-2.5 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-900/50">
          <Library size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">Kütüphane</h1>
          <p className="text-xs text-slate-400 font-medium">Yönetim Paneli</p>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {menu.map((item, index) => {
          if ("type" in item && item.type === "divider") {
            return (
              <div
                key={`div-${index}`}
                className="px-3 pt-5 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest"
              >
                {(item as any).label}
              </div>
            );
          }

          const linkItem = item as { name: string; path: string; icon: any };
          const Icon = linkItem.icon;
          const isActive = pathname === linkItem.path;

          return (
            <Link
              key={linkItem.path}
              to={linkItem.path}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm group
                ${
                  isActive
                    ? "bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/40"
                    : "hover:bg-slate-800/70 hover:text-white"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={18}
                  className={
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-white transition-colors"
                  }
                />
                {linkItem.name}
              </div>
              {isActive && <ChevronRight size={16} className="text-white/70" />}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              Admin User
            </p>
            <p className="text-xs text-slate-500 truncate">v1.2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
