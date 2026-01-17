import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Category } from "../../types/book";
import { useNavigate } from "react-router-dom";
import {
  BookPlus,
  ArrowLeft,
  Book,
  User,
  Building2,
  Calendar,
  FileText,
  Bookmark,
  MapPin,
  Save,
} from "lucide-react";

export default function AddBook() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [publisher, setPublisher] = useState("");
  const [publishYear, setPublishYear] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [shelfCode, setShelfCode] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const cats = await window.api.getCategories();
        setCategories(cats);
      } catch (error) {
        toast.error("Kategoriler yüklenirken hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const addBook = async () => {
    if (!title.trim()) {
      toast.error("Kitap adı zorunludur!");
      return;
    }
    if (!author.trim()) {
      toast.error("Yazar adı zorunludur!");
      return;
    }
    if (!categoryId) {
      toast.error("Lütfen bir kategori seçin!");
      return;
    }

    setIsSaving(true);
    try {
      const res = await window.api.addBook({
        title: title.trim(),
        author: author.trim(),
        categoryId,
        publisher: publisher.trim(),
        publishYear: publishYear ? Number(publishYear) : null,
        pageCount: pageCount ? Number(pageCount) : null,
        shelfCode: shelfCode.trim(),
        description: description.trim(),
      });

      toast.success(`Kitap eklendi! Kod: ${res.code}`);

      // Form temizle
      setTitle("");
      setAuthor("");
      setCategoryId("");
      setPublisher("");
      setPublishYear("");
      setPageCount("");
      setShelfCode("");
      setDescription("");
    } catch (error) {
      toast.error("Kitap eklenirken bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/books")}
          className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <BookPlus className="text-blue-600" size={32} />
            Yeni Kitap Ekle
          </h1>
          <p className="text-gray-500">Kütüphaneye yeni kitap kaydedin</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          {/* Kitap Adı - Full Width */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Book size={16} className="text-gray-400" />
              Kitap Adı <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Suç ve Ceza"
              autoFocus
            />
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Yazar */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="text-gray-400" />
                Yazar <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Örn: Fyodor Dostoyevski"
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Bookmark size={16} className="text-gray-400" />
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Kategori seçin...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-sm text-amber-600 mt-1">
                  Henüz kategori yok.{" "}
                  <button
                    onClick={() => navigate("/categories")}
                    className="underline hover:no-underline"
                  >
                    Kategori ekle →
                  </button>
                </p>
              )}
            </div>

            {/* Yayın Evi */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Building2 size={16} className="text-gray-400" />
                Yayın Evi
              </label>
              <input
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="Örn: İş Bankası Yayınları"
              />
            </div>

            {/* Basım Yılı */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="text-gray-400" />
                Basım Yılı
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={publishYear}
                onChange={(e) => setPublishYear(e.target.value)}
                placeholder="Örn: 2020"
              />
            </div>

            {/* Sayfa Sayısı */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="text-gray-400" />
                Sayfa Sayısı
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={pageCount}
                onChange={(e) => setPageCount(e.target.value)}
                placeholder="Örn: 350"
              />
            </div>

            {/* Raf Kodu */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="text-gray-400" />
                Raf Kodu
              </label>
              <input
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={shelfCode}
                onChange={(e) => setShelfCode(e.target.value)}
                placeholder="Örn: A3-R2"
              />
            </div>
          </div>

          {/* Açıklama - Full Width */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kitap hakkında kısa açıklama..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => navigate("/books")}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-white font-medium transition-colors"
          >
            İptal
          </button>
          <button
            onClick={addBook}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 text-white font-medium shadow-md shadow-blue-200 hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save size={18} />
                Kaydet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
