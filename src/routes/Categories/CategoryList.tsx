import { useEffect, useState } from "react";
import { toast } from "sonner";
import Modal from "../../components/UI/Modal";
import { Bookmark, Plus, Pencil, Trash2, FolderOpen } from "lucide-react";

type Category = { id: string; name: string };

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await window.api.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error("Kategoriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addCategory = async () => {
    if (!newName.trim()) {
      toast.error("Kategori adı boş olamaz!");
      return;
    }
    try {
      await window.api.addCategory(newName.trim());
      toast.success("Kategori eklendi");
      setNewName("");
      setIsAddOpen(false);
      load();
    } catch (error) {
      toast.error("Kategori eklenirken hata oluştu");
    }
  };

  const saveEdit = async () => {
    if (!editCategory || !editCategory.name.trim()) {
      toast.error("Kategori adı boş olamaz!");
      return;
    }
    try {
      await window.api.updateCategory(editCategory);
      toast.success("Kategori güncellendi");
      setIsEditOpen(false);
      load();
    } catch (error) {
      toast.error("Kategori güncellenirken hata oluştu");
    }
  };

  const remove = async (id: string, name: string) => {
    toast.warning(`"${name}" kategorisini silmek istediğinize emin misiniz?`, {
      action: {
        label: "Sil",
        onClick: async () => {
          try {
            await window.api.deleteCategory(id);
            toast.success("Kategori silindi");
            load();
          } catch (error) {
            toast.error("Kategori silinirken hata oluştu");
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
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Bookmark className="text-blue-600" size={32} />
            Kategoriler
          </h1>
          <p className="text-gray-500 mt-1">
            Kitap kategorilerini yönetin
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium shadow-md shadow-blue-200 hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Yeni Kategori
        </button>
      </div>

      {/* Category List */}
      {categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FolderOpen size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Henüz kategori eklenmemiş</p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            İlk kategoriyi ekle →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {categories.map((c, index) => (
            <div
              key={c.id}
              className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                index !== categories.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <Bookmark size={18} className="text-blue-600" />
                </div>
                <span className="font-medium text-gray-800">{c.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                  onClick={() => {
                    setEditCategory(c);
                    setIsEditOpen(true);
                  }}
                  title="Düzenle"
                >
                  <Pencil size={18} />
                </button>

                <button
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  onClick={() => remove(c.id, c.name)}
                  title="Sil"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Plus size={20} className="text-blue-600" />
          Yeni Kategori
        </h2>
        <input
          className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Örn: Roman, Hikaye, Bilim..."
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
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
            onClick={addCategory}
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
          Kategori Düzenle
        </h2>
        <input
          className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
          value={editCategory?.name || ""}
          onChange={(e) =>
            setEditCategory((prev) =>
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
            Kaydet
          </button>
        </div>
      </Modal>
    </div>
  );
}
