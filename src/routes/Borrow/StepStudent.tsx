import { useEffect, useState } from "react";
import { Search, Filter, Users, GraduationCap } from "lucide-react";

type Student = {
  id: string;
  fullName: string;
  classId: string;
  schoolNumber?: string;
};

type ClassItem = {
  id: string;
  name: string;
};

export default function StepStudent({
  onSelect,
}: {
  selectedStudent: any;
  onSelect: (student: Student) => void;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, c] = await Promise.all([
          window.api.getStudents(),
          window.api.getClasses(),
        ]);
        setStudents(s);
        setClasses(c);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = students.filter((s) => {
    const text = search.trim().toLowerCase();

    const matchText =
      !text ||
      s.fullName.toLowerCase().includes(text) ||
      (s.schoolNumber ?? "").toLowerCase().includes(text);

    const matchClass = classFilter ? s.classId === classFilter : true;

    return matchText && matchClass;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Users size={20} className="text-blue-600" />
        Öğrenci Seçin
      </h2>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
            placeholder="Öğrenci ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="relative">
          <Filter
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <select
            className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none min-w-[150px]"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">Tüm Sınıflar</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student List */}
      <div className="max-h-[350px] overflow-y-auto space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <GraduationCap size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">Öğrenci bulunamadı</p>
          </div>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all flex items-center justify-between group"
              onClick={() => onSelect(s)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700">
                    {s.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-800">{s.fullName}</div>
                  <div className="text-sm text-gray-500">
                    {classes.find((c) => c.id === s.classId)?.name || "-"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {s.schoolNumber && (
                  <span className="text-sm text-gray-500">{s.schoolNumber}</span>
                )}
                <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Seç →
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 text-sm text-gray-500 text-center">
        {filtered.length} öğrenci listelendi
      </div>
    </div>
  );
}
