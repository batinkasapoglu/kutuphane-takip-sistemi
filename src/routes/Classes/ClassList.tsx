import { useEffect, useState } from "react";
import { toast } from "sonner";
import Modal from "../../components/UI/Modal";
import { School, Plus, Pencil, Trash2, Download, Upload, Users } from "lucide-react";

type ClassItem = {
  id: string;
  name: string;
};

export default function ClassList() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [editClass, setEditClass] = useState<ClassItem | null>(null);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [restoreMode, setRestoreMode] = useState<"merge" | "overwrite">("merge");

  const load = async () => {
    setLoading(true);
    try {
      const data = await window.api.getClasses();
      setClasses(data);
    } catch (error) {
      toast.error("Sınıflar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addClass = async () => {
    if (!newName.trim()) {
      toast.error("Sınıf adı boş olamaz!");
      return;
    }

    try {
      await window.api.addClass(newName.trim());
      toast.success("Sınıf eklendi");
      setNewName("");
      setIsAddOpen(false);
      load();
    } catch (error) {
      toast.error("Sınıf eklenirken hata oluştu");
    }
  };

  const saveEdit = async () => {
    if (!editClass || !editClass.name.trim()) {
      toast.error("Sınıf adı boş olamaz!");
      return;
    }

    try {
      await window.api.updateClass(editClass);
      toast.success("Sınıf güncellendi");
      setIsEditOpen(false);
      load();
    } catch (error) {
      toast.error("Sınıf güncellenirken hata oluştu");
    }
  };

  const remove = async (id: string, name: string) => {
    toast.warning(`"${name}" sınıfını silmek istediğinize emin misiniz?`, {
      action: {
        label: "Sil",
        onClick: async () => {
          try {
            await window.api.deleteClass(id);
            toast.success("Sınıf silindi");
            load();
          } catch (error) {
            toast.error("Sınıf silinirken hata oluştu");
          }
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <School className="text-blue-600" size={32} />
            Sınıf Yönetimi
          </h1>
          <p className="text-gray-500 mt-1">
            Okul sınıflarını yönetin
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors flex items-center gap-2"
            onClick={async () => {
              try {
                const res = await window.api.exportClassesToFile();
                if (res.canceled) return;
                toast.success(`Yedek indirildi (${res.count} sınıf)`);
              } catch (e) {
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

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium shadow-md shadow-blue-200 hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Yeni Sınıf
          </button>
        </div>
      </div>

      {/* Class Grid */}
      {classes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Henüz sınıf eklenmemiş</p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            İlk sınıfı ekle →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <School size={20} className="text-indigo-600" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    onClick={() => {
                      setEditClass(cls);
                      setIsEditOpen(true);
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    onClick={() => remove(cls.id, cls.name)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 text-lg">{cls.name}</h3>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Plus size={20} className="text-blue-600" />
          Yeni Sınıf
        </h2>

        <input
          className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Örn: 5-A, 6-B, 7-C..."
          onKeyDown={(e) => e.key === "Enter" && addClass()}
          autoFocus
        />

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setIsAddOpen(false)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            İptal
          </button>
          <button
            onClick={addClass}
            className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
          >
            Ekle
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Pencil size={20} className="text-amber-600" />
          Sınıf Düzenle
        </h2>

        <input
          className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
          value={editClass?.name || ""}
          onChange={(e) =>
            setEditClass((prev) =>
              prev ? { ...prev, name: e.target.value } : prev
            )
          }
          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
          autoFocus
        />

        <div className="flex gap-2 mt-4">
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
      </Modal>

      {/* Restore Modal */}
      <Modal isOpen={isRestoreOpen} onClose={() => setIsRestoreOpen(false)}>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Upload size={20} className="text-green-600" />
          Sınıf Yedeğinden Geri Yükle
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Geri yükleme yöntemini seçin, sonra yedek dosyasını seçeceksiniz.
        </p>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="restoreModeClasses"
              className="mt-1"
              checked={restoreMode === "merge"}
              onChange={() => setRestoreMode("merge")}
            />
            <div>
              <div className="font-semibold text-gray-800">Birleştir (Önerilen)</div>
              <div className="text-sm text-gray-600">
                Mevcut sınıfları silmez, yedektekileri ekler/günceller.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-red-200 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
            <input
              type="radio"
              name="restoreModeClasses"
              className="mt-1"
              checked={restoreMode === "overwrite"}
              onChange={() => setRestoreMode("overwrite")}
            />
            <div>
              <div className="font-semibold text-red-700">Üzerine Yaz (Riskli)</div>
              <div className="text-sm text-gray-600">
                Önce tüm sınıfları siler, sonra yedekten yükler.
              </div>
            </div>
          </label>

          {restoreMode === "overwrite" && (
            <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm">
              ⚠️ Dikkat: Bu işlem mevcut sınıfları geri dönüşsüz siler!
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
                  const res = await window.api.importClassesFromFile({
                    mode: restoreMode,
                  });
                  setIsRestoreOpen(false);
                  if (res.canceled) return;

                  toast.success(`Geri yüklendi (${res.restored} kayıt)`);
                  load();
                } catch (e) {
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
