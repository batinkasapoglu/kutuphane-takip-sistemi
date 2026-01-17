import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Clock, 
  AlertTriangle, 
  AlertCircle,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

type Borrow = {
  id: string;
  bookId: string;
  studentId: string;
  borrowDate: string;
  bookTitle?: string;
  studentName?: string;
};

export default function DashboardPage() {
  const [active, setActive] = useState<Borrow[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [limit, setLimit] = useState(15);
  const [warningBefore, setWarningBefore] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [activeBorrows, stats, limitVal, warnVal] = await Promise.all([
          window.api.getActiveBorrowings(),
          window.api.getDashboardStats(),
          window.api.getSetting("borrow_limit_days"),
          window.api.getSetting("warning_days_before"),
        ]);

        setActive(activeBorrows);
        setTotalBooks(stats.totalBooks);
        setTotalStudents(stats.totalStudents);
        if (limitVal) setLimit(Number(limitVal));
        if (warnVal) setWarningBefore(Number(warnVal));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  const calculateDays = (date: string) => {
    const start = new Date(date);
    return Math.floor(
      (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const totalActive = active.length;
  const late = active.filter((br) => calculateDays(br.borrowDate) > limit).length;
  const near = active.filter((br) => {
    const days = calculateDays(br.borrowDate);
    return warningBefore > 0 && days <= limit && limit - days <= warningBefore;
  }).length;

  // Son 5 gecikmiş ödünç
  const lateBorrows = active
    .filter((br) => calculateDays(br.borrowDate) > limit)
    .sort((a, b) => calculateDays(b.borrowDate) - calculateDays(a.borrowDate))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <LayoutDashboard className="text-blue-600" size={32} />
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Kütüphane durumuna genel bakış
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Toplam Kitap"
          value={totalBooks}
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Toplam Öğrenci"
          value={totalStudents}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Aktif Ödünç"
          value={totalActive}
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Gecikmiş"
          value={late}
          icon={AlertTriangle}
          color="red"
          highlight={late > 0}
        />
        <StatCard
          title="Yakında Gecikecek"
          value={near}
          icon={AlertCircle}
          color="amber"
          highlight={near > 0}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gecikmiş Kitaplar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-linear-to-r from-red-50 to-orange-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              Gecikmiş Kitaplar
            </h2>
            {late > 0 && (
              <Link
                to="/borrow/active"
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                Tümünü Gör <ArrowRight size={14} />
              </Link>
            )}
          </div>

          <div className="p-4">
            {lateBorrows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp size={40} className="mx-auto mb-2 text-green-400" />
                <p>Harika! Gecikmiş kitap yok.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lateBorrows.map((br) => {
                  const days = calculateDays(br.borrowDate);
                  const overdue = days - limit;
                  return (
                    <div
                      key={br.id}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 truncate">
                          {br.bookTitle || "Kitap"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {br.studentName || "Öğrenci"}
                        </p>
                      </div>
                      <div className="ml-3 text-right shrink-0">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          {overdue} gün gecikme
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Hızlı Erişim */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Hızlı Erişim
            </h2>
          </div>

          <div className="p-4 grid grid-cols-2 gap-3">
            <QuickLink to="/borrow" icon={Clock} label="Kitap Ödünç Ver" color="blue" />
            <QuickLink to="/borrow/active" icon={AlertCircle} label="Aktif Ödünçler" color="orange" />
            <QuickLink to="/books/add" icon={BookOpen} label="Yeni Kitap Ekle" color="green" />
            <QuickLink to="/students" icon={Users} label="Öğrenci Listesi" color="purple" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  highlight = false,
}: {
  title: string;
  value: number;
  icon: any;
  color: "blue" | "green" | "indigo" | "red" | "amber";
  highlight?: boolean;
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 shadow-blue-200",
    green: "from-green-500 to-green-600 shadow-green-200",
    indigo: "from-indigo-500 to-indigo-600 shadow-indigo-200",
    red: "from-red-500 to-red-600 shadow-red-200",
    amber: "from-amber-500 to-amber-600 shadow-amber-200",
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${
        highlight ? "border-red-200 ring-2 ring-red-100" : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2.5 rounded-lg bg-linear-to-br ${colorClasses[color]} shadow-md text-white`}
        >
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
    </div>
  );
}

// Quick Link Component
function QuickLink({
  to,
  icon: Icon,
  label,
  color,
}: {
  to: string;
  icon: any;
  label: string;
  color: "blue" | "green" | "orange" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    green: "bg-green-50 text-green-700 hover:bg-green-100",
    orange: "bg-orange-50 text-orange-700 hover:bg-orange-100",
    purple: "bg-purple-50 text-purple-700 hover:bg-purple-100",
  };

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 p-4 rounded-xl transition-colors ${colorClasses[color]}`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );
}
