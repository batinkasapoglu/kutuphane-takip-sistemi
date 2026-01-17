import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserPlus, ArrowLeft, User, School, Hash } from "lucide-react";

type Class = {
  id: string;
  name: string;
};

export default function AddStudent() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [classId, setClassId] = useState("");
  const [schoolNumber, setSchoolNumber] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const cls = await window.api.getClasses();
        setClasses(cls);
      } catch (error) {
        toast.error("Sınıflar yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const add = async () => {
    if (!fullName.trim()) {
      toast.error("Ad Soyad alanı zorunludur!");
      return;
    }
    if (!classId) {
      toast.error("Lütfen bir sınıf seçin!");
      return;
    }

    setSaving(true);
    try {
      await window.api.addStudent({
        fullName: fullName.trim(),
        classId,
        schoolNumber: schoolNumber.trim(),
      });

      toast.success("Öğrenci başarıyla eklendi!");
      setFullName("");
      setClassId("");
      setSchoolNumber("");
    } catch (error) {
      toast.error("Öğrenci eklenirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/students")}
          className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <UserPlus className="text-blue-600" size={32} />
            Yeni Öğrenci
          </h1>
          <p className="text-gray-500">Sisteme yeni öğrenci kaydedin</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          {/* Ad Soyad */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="text-gray-400" />
              Ad Soyad <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Örn: Ahmet Yılmaz"
              autoFocus
            />
          </div>

          {/* Sınıf */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <School size={16} className="text-gray-400" />
              Sınıf <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">Sınıf seçin...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {classes.length === 0 && (
              <p className="text-sm text-amber-600 mt-1">
                Henüz sınıf eklenmemiş.{" "}
                <button
                  onClick={() => navigate("/classes")}
                  className="underline hover:no-underline"
                >
                  Sınıf ekle →
                </button>
              </p>
            )}
          </div>

          {/* Okul Numarası */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Hash size={16} className="text-gray-400" />
              Okul Numarası
              <span className="text-gray-400 font-normal">(isteğe bağlı)</span>
            </label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={schoolNumber}
              onChange={(e) => setSchoolNumber(e.target.value)}
              placeholder="Örn: 123"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => navigate("/students")}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-white font-medium transition-colors"
          >
            İptal
          </button>
          <button
            onClick={add}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium shadow-md shadow-blue-200 hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Kaydediliyor...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Kaydet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
