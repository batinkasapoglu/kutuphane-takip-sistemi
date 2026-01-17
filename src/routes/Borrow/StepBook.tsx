import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Book, Category } from "../../types/book";
import QRScanner from "../../components/QRScanner";
import {
  Search,
  Filter,
  ArrowLeft,
  QrCode,
  Barcode,
  BookOpen,
  BookMarked,
  Check,
  X,
} from "lucide-react";

export default function StepBook({
  onSelect,
  onBack,
}: {
  selectedBook: Book | null;
  onSelect: (book: Book) => void;
  onBack: () => void;
}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [borrowedIds, setBorrowedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [qrOpen, setQrOpen] = useState(false);

  const barcodeRef = useRef<HTMLInputElement | null>(null);
  const [barcode, setBarcode] = useState("");

  const isBorrowed = useMemo(() => {
    const set = new Set(borrowedIds);
    return (bookId: string) => set.has(bookId);
  }, [borrowedIds]);

  // Initial load
  useEffect(() => {
    const loadInit = async () => {
      const [c, active] = await Promise.all([
        window.api.getCategories(),
        window.api.getActiveBorrowings(),
      ]);
      setCategories(c);
      setBorrowedIds(active.map((x) => x.bookId));
    };
    loadInit();
  }, []);

  // Search with debounce
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(async () => {
      const b = await window.api.getBooks({
        search,
        categoryId: catFilter || undefined,
      });
      setBooks(b);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, catFilter]);

  const trySelectBook = (book: Book) => {
    if (isBorrowed(book.id)) {
      toast.error("Bu kitap şu anda ödünçte. Tekrar ödünç verilemez.");
      return;
    }
    onSelect(book);
  };

  const fetchByCodeAndSelect = async (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    const result = await window.api.getBooks({ code: clean });

    if (!result || result.length === 0) {
      toast.error("Kitap bulunamadı.");
      return;
    }

    const book = result[0];

    if (isBorrowed(book.id)) {
      toast.error("Bu kitap şu anda ödünçte. Tekrar ödünç verilemez.");
      return;
    }

    onSelect(book);
    toast.success(`Kitap seçildi: ${book.title}`);
  };

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen size={20} className="text-blue-600" />
          Kitap Seçin
        </h2>

        <button
          className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors flex items-center gap-2"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          Geri
        </button>
      </div>

      {/* Barcode Input */}
      <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Barcode size={16} className="text-gray-500" />
          Barkod / QR ile Hızlı Seçim
        </div>
        <div className="flex gap-2">
          <input
            ref={barcodeRef}
            className="flex-1 border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="Kitap kodu okutun (BK-0001) ve Enter..."
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key !== "Enter") return;
              const code = barcode.trim();
              if (code.length < 3) return;
              await fetchByCodeAndSelect(code);
              setBarcode("");
            }}
          />
          <button
            className="px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
            onClick={() => setQrOpen(true)}
          >
            <QrCode size={18} />
            QR Tara
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          İpucu: Barkod okuyucu genelde sonunda Enter gönderir.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
            placeholder="Kitap adı veya yazar ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative">
          <Filter
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <select
            className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none min-w-37.5"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Book List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="max-h-75 overflow-y-auto space-y-2">
          {books.length === 0 ? (
            <div className="text-center py-8">
              <BookMarked size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">Kitap bulunamadı</p>
            </div>
          ) : (
            books.map((book) => {
              const borrowed = isBorrowed(book.id);

              return (
                <div
                  key={book.id}
                  className={`p-4 rounded-lg border transition-all flex items-center justify-between ${
                    borrowed
                      ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                      : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50 cursor-pointer"
                  }`}
                  onClick={() => !borrowed && trySelectBook(book)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        borrowed
                          ? "bg-gray-200"
                          : "bg-linear-to-br from-green-100 to-emerald-100"
                      }`}
                    >
                      <BookOpen
                        size={18}
                        className={borrowed ? "text-gray-400" : "text-green-600"}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{book.title}</div>
                      <div className="text-sm text-gray-500">{book.author}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-500 px-2 py-1 bg-gray-100 rounded">
                      {book.code}
                    </span>

                    {borrowed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        <X size={12} />
                        Ödünçte
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <Check size={12} />
                        Uygun
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="mt-3 text-sm text-gray-500 text-center">
        {books.length} kitap listelendi
      </div>

      {/* QR Scanner Modal */}
      {qrOpen && (
        <QRScanner
          onDetected={async (code) => {
            const clean = String(code || "").trim();
            if (!clean) return;

            const result = await window.api.getBooks({ code: clean });
            if (!result || result.length === 0) {
              toast.error("Bu QR bir kitabı temsil etmiyor veya kitap bulunamadı!");
              return;
            }

            const book = result[0];
            if (isBorrowed(book.id)) {
              toast.error("Bu kitap şu anda ödünçte. Tekrar ödünç verilemez.");
              return;
            }

            setQrOpen(false);
            onSelect(book);
            toast.success(`Kitap bulundu: ${book.title}`);
          }}
          onClose={() => setQrOpen(false)}
        />
      )}
    </div>
  );
}
