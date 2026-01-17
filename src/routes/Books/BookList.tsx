import { useEffect, useState } from "react";
import { toast } from "sonner";
import Modal from "../../components/UI/Modal";
import type { Book, Category } from "../../types/book";
import { useDebounce } from "../../hooks/useDebounce";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Search,
  Plus,
  Download,
  Upload,
  Pencil,
  Trash2,
  Filter,
  BookMarked,
} from "lucide-react";

export default function BookList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [editBook, setEditBook] = useState<Book | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [restoreMode, setRestoreMode] = useState<"merge" | "overwrite">("merge");
  const navigate = useNavigate();

  // Load categories only once
  useEffect(() => {
    window.api.getCategories().then(setCategories);
  }, []);

  // Load books when search or filter changes
  useEffect(() => {
    const loadBooks = async () => {
      setIsLoading(true);
      try {
        const list = await window.api.getBooks({
          search: debouncedSearch,
          categoryId: categoryFilter || undefined,
        });
        setBooks(list);
      } catch (error) {
        console.error(error);
        toast.error("Kitaplar yüklenirken hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };
    loadBooks();
  }, [debouncedSearch, categoryFilter]);

  const reloadBooks = async () => {
    try {
      const list = await window.api.getBooks({
        search: debouncedSearch,
        categoryId: categoryFilter || undefined,
      });
      setBooks(list);
    } catch (error) {
      console.error(error);
    }
  };

  const remove = async (id: string, title: string, isBorrowed?: boolean) => {
    if (isBorrowed) {
      toast.error("Ödünçte olan kitap silinemez! Önce iade alınmalı.");
      return;
    }
    toast.warning(`"${title}" kitabını silmek istediğinize emin misiniz?`, {
      action: {
        label: "Sil",
        onClick: async () => {
          try {
            await window.api.deleteBook(id);
            toast.success("Kitap silindi");
            reloadBooks();
          } catch (error) {
            toast.error("Kitap silinirken hata oluştu");
          }
        },
      },
    });
  };

  const saveEdit = async () => {
    if (!editBook) return;

    try {
      await window.api.updateBook(editBook);
      toast.success("Kitap güncellendi");
      setIsEditOpen(false);
      setEditBook(null);
      reloadBooks();
    } catch (error) {
      toast.error("Kitap güncellenirken hata oluştu");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <BookOpen className="text-blue-600" size={32} />
            Kitap Listesi
          </h1>
          <p className="text-gray-500 mt-1">
            Toplam {books.length} kitap kayıtlı
          </p>
        </div>

        <button
          onClick={() => navigate("/books/add")}
          className="px-5 py-2.5 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 text-white font-medium shadow-md shadow-blue-200 hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Yeni Kitap
        </button>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-62.5">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
              placeholder="Kitap adı, yazar, kod veya raf ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <select
              className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none min-w-45"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((c) => (
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
                  const res = await window.api.exportBooksToFile();
                  if (res.canceled) return;
                  toast.success(`Yedek indirildi (${res.count} kitap)`);
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

      {/* Book Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <BookMarked size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">
            {search || categoryFilter
              ? "Aramanızla eşleşen kitap bulunamadı"
              : "Henüz kitap eklenmemiş"}
          </p>
          {!search && !categoryFilter && (
            <button
              onClick={() => navigate("/books/add")}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              İlk kitabı ekle →
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-4 font-semibold text-gray-700">Kod</th>
                <th className="text-left p-4 font-semibold text-gray-700">Kitap Adı</th>
                <th className="text-left p-4 font-semibold text-gray-700">Yazar</th>
                <th className="text-left p-4 font-semibold text-gray-700">Kategori</th>
                <th className="text-left p-4 font-semibold text-gray-700">Raf</th>
                <th className="text-left p-4 font-semibold text-gray-700">Durum</th>
                <th className="text-right p-4 font-semibold text-gray-700">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b, index) => (
                <tr
                  key={b.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index === books.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-gray-100 text-gray-700">
                      {b.code}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{b.title}</div>
                    {b.publisher && (
                      <div className="text-xs text-gray-500 mt-0.5">{b.publisher}</div>
                    )}
                  </td>
                  <td className="p-4 text-gray-600">{b.author}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                      {categories.find((c) => c.id === b.categoryId)?.name || "-"}
                    </span>
                  </td>
                  <td className="p-4">
                    {b.shelfCode ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                        {b.shelfCode}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    {b.isBorrowed ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        Ödünçte
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Müsait
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        onClick={() => {
                          setEditBook(b);
                          setIsEditOpen(true);
                        }}
                        title="Düzenle"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => remove(b.id, b.title, !!b.isBorrowed)}
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

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Pencil size={20} className="text-amber-600" />
          Kitap Düzenle
        </h2>

        {editBook && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Kitap Adı
              </label>
              <input
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={editBook.title}
                onChange={(e) =>
                  setEditBook({ ...editBook, title: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Yazar
              </label>
              <input
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={editBook.author}
                onChange={(e) =>
                  setEditBook({ ...editBook, author: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Kategori
              </label>
              <select
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={editBook.categoryId}
                onChange={(e) =>
                  setEditBook({ ...editBook, categoryId: e.target.value })
                }
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
                Kaydet
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
                Mevcut kitapları silmez, yedektekileri ekler/günceller.
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
                Önce tüm kitapları siler, sonra yedekten yükler.
              </div>
            </div>
          </label>

          {restoreMode === "overwrite" && (
            <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm">
              ⚠️ Dikkat: Bu işlem mevcut kitapları geri dönüşsüz siler!
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
                  const res = await window.api.importBooksFromFile({
                    mode: restoreMode,
                  });
                  setIsRestoreOpen(false);

                  if (res.canceled) return;

                  toast.success(`Geri yüklendi (${res.restored} kayıt)`);
                  reloadBooks();
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
