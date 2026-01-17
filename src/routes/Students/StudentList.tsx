import { useEffect, useState } from "react";
import { toast } from "sonner";
import Modal from "../../components/UI/Modal";
import type { Student, Class } from "../../types/student";
import { useDebounce } from "../../hooks/useDebounce";
import {
  Users,
  Search,
  Download,
  Upload,
  Pencil,
  Trash2,
  Filter,
  UserPlus,
  GraduationCap,
} from "lucide-react";

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  const [fullName, setFullName] = useState("");
  const [classId, setClassId] = useState("");
  const [schoolNumber, setSchoolNumber] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [restoreMode, setRestoreMode] = useState<"merge" | "overwrite">("merge");

  // Load classes initially
  useEffect(() => {
    window.api.getClasses().then(setClasses);
  }, []);

  // Load students on search/filter change
  useEffect(() => {
    const loadStudents = async () => {
      setIsLoading(true);
      try {
        const s = await window.api.getStudents({
          search: debouncedSearch,
          classId: classFilter || undefined,
        });
        setStudents(s);
      } catch (error) {
        toast.error("Öğrenciler yüklenirken hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };
    loadStudents();
  }, [debouncedSearch, classFilter]);

  const reloadStudents = async () => {
    try {
      const s = await window.api.getStudents({
        search: debouncedSearch,
        classId: classFilter || undefined,
      });
      setStudents(s);
    } catch (error) {
      console.error(error);
    }
  };

  const addStudent = async () => {
    if (!fullName.trim() || !classId) {
      toast.error("İsim ve sınıf zorunludur!");
      return;
    }

    try {
      await window.api.addStudent({
        fullName: fullName.trim(),
        classId,
        schoolNumber: schoolNumber.trim(),
      });

      toast.success("Öğrenci eklendi");
      setFullName("");
      setClassId("");
      setSchoolNumber("");
      setIsAddOpen(false);
      reloadStudents();
    } catch (error) {
      toast.error("Öğrenci eklenirken hata oluştu");
    }
  };

  const saveEdit = async () => {
    if (!editStudent || !editStudent.fullName.trim() || !editStudent.classId) {
      toast.error("İsim ve sınıf zorunludur!");
      return;
    }

    try {
      await window.api.updateStudent(editStudent);
      toast.success("Öğrenci güncellendi");
      setIsEditOpen(false);
      setEditStudent(null);
      reloadStudents();
    } catch (error) {
      toast.error("Öğrenci güncellenirken hata oluştu");
    }
  };

  const remove = async (id: string, name: string) => {
    toast.warning(`"${name}" öğrencisini silmek istediğinize emin misiniz?`, {
      action: {
        label: "Sil",
        onClick: async () => {
          try {
            await window.api.deleteStudent(id);
            toast.success("Öğrenci silindi");
            reloadStudents();
          } catch (error) {
            toast.error("Öğrenci silinirken hata oluştu");
          }
        },
      },
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Users className="text-blue-600" size={32} />
            Öğrenci Yönetimi
          </h1>
          <p className="text-gray-500 mt-1">
            Toplam {students.length} öğrenci kayıtlı
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium shadow-md shadow-blue-200 hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2"
        >
          <UserPlus size={18} />
          Yeni Öğrenci
        </button>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
              placeholder="Öğrenci adı veya okul numarası ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Class Filter */}
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <select
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none min-w-[180px]"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">Tüm Sınıflar</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Backup Buttons */}
          <div className="flex gap-2">
            <button
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors flex items-center gap-2"
              onClick={async () => {
                try {
                  const res = await window.api.exportStudentsToFile();
                  if (res.canceled) return;
                  toast.success(`Yedek indirildi (${res.count} öğrenci)`);
                } catch (error) {
                  toast.error("Yedek indirilemedi");
                }
              }}
            >
              <Download size={18} />
              Yedekle
            </button>

            <button
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors flex items-center gap-2"
              onClick={() => {
                setRestoreMode("merge");
                setIsRestoreOpen(true);
              }}
            >
              <Upload size={18} />
              Geri Yükle
            </button>
          </div>
        </div>
      </div>

      {/* Student Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <GraduationCap size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">
            {search || classFilter
              ? "Aramanızla eşleşen öğrenci bulunamadı"
              : "Henüz öğrenci eklenmemiş"}
          </p>
          {!search && !classFilter && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              İlk öğrenciyi ekle →
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-4 font-semibold text-gray-700">Ad Soyad</th>
                <th className="text-left p-4 font-semibold text-gray-700">Sınıf</th>
                <th className="text-left p-4 font-semibold text-gray-700">Okul No</th>
                <th className="text-right p-4 font-semibold text-gray-700">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, index) => (
                <tr
                  key={s.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index === students.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-700">
                          {s.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-800">{s.fullName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700">
                      {classes.find((c) => c.id === s.classId)?.name || "-"}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {s.schoolNumber || (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        onClick={() => {
                          setEditStudent(s);
                          setIsEditOpen(true);
                        }}
                        title="Düzenle"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => remove(s.id, s.fullName)}
                        title="Sil"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Student Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-blue-600" />
          Öğrenci Ekle
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ad Soyad <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Örn: Ahmet Yılmaz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Sınıf <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">Sınıf Seçin</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Okul Numarası
            </label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="İsteğe bağlı"
              value={schoolNumber}
              onChange={(e) => setSchoolNumber(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setIsAddOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              İptal
            </button>
            <button
              onClick={addStudent}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
            >
              Ekle
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Student Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Pencil size={20} className="text-amber-600" />
          Öğrenci Düzenle
        </h2>

        {editStudent && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={editStudent.fullName}
                onChange={(e) =>
                  setEditStudent({ ...editStudent, fullName: e.target.value })
                }
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sınıf <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={editStudent.classId}
                onChange={(e) =>
                  setEditStudent({ ...editStudent, classId: e.target.value })
                }
              >
                <option value="">Sınıf Seçin</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Okul Numarası
              </label>
              <input
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={editStudent.schoolNumber || ""}
                onChange={(e) =>
                  setEditStudent({ ...editStudent, schoolNumber: e.target.value })
                }
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsEditOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                İptal
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-medium transition-colors"
              >
                Güncelle
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Restore Modal */}
      <Modal isOpen={isRestoreOpen} onClose={() => setIsRestoreOpen(false)}>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Upload size={20} className="text-green-600" />
          Yedekten Geri Yükle
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Geri yükleme yöntemini seçin, sonra yedek dosyasını seçeceksiniz.
        </p>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="restoreMode"
              className="mt-1"
              checked={restoreMode === "merge"}
              onChange={() => setRestoreMode("merge")}
            />
            <div>
              <div className="font-semibold text-gray-800">Birleştir (Önerilen)</div>
              <div className="text-sm text-gray-600">
                Mevcut öğrencileri silmez, yedektekileri ekler/günceller.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-red-200 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
            <input
              type="radio"
              name="restoreMode"
              className="mt-1"
              checked={restoreMode === "overwrite"}
              onChange={() => setRestoreMode("overwrite")}
            />
            <div>
              <div className="font-semibold text-red-700">Üzerine Yaz (Riskli)</div>
              <div className="text-sm text-gray-600">
                Önce tüm öğrencileri siler, sonra yedekten yükler.
              </div>
            </div>
          </label>

          {restoreMode === "overwrite" && (
            <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm">
              ⚠️ Dikkat: Bu işlem mevcut öğrencileri geri dönüşsüz siler!
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              onClick={() => setIsRestoreOpen(false)}
            >
              Vazgeç
            </button>

            <button
              className={`flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-colors ${
                restoreMode === "overwrite"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              onClick={async () => {
                try {
                  const res = await window.api.importStudentsFromFile({
                    mode: restoreMode,
                  });

                  setIsRestoreOpen(false);
                  if (res.canceled) return;

                  toast.success(`Geri yüklendi (${res.restored} kayıt)`);
                  reloadStudents();
                } catch (error) {
                  toast.error("Geri yükleme başarısız");
                }
              }}
            >
              Dosya Seç ve Yükle
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
