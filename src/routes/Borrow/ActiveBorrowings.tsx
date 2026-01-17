import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Borrowing } from "../../types/borrowing";
import Modal from "../../components/UI/Modal";
import QRScanner from "../../components/QRScanner";
import {
  Clock,
  Search,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  BookOpen,
  User,
  Calendar,
  QrCode,
  Barcode,
  X,
} from "lucide-react";

export default function ActiveBorrowings() {
  const [borrows, setBorrows] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(15);
  const [warningBefore, setWarningBefore] = useState(3);
  const [search, setSearch] = useState("");
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [restoreMode, setRestoreMode] = useState<"merge" | "overwrite">(
    "merge"
  );
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcode, setBarcode] = useState("");
  const barcodeRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const active = await window.api.getActiveBorrowings();
      setBorrows(active);
    } catch (error) {
      toast.error("Ödünçler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    window.api.getSetting("borrow_limit_days").then((v) => {
      if (v) setLimit(Number(v));
    });
    window.api.getSetting("warning_days_before").then((v) => {
      if (v) setWarningBefore(Number(v));
    });
  }, []);

  const returnBook = async (id: string, bookTitle: string) => {
    toast.info(`"${bookTitle}" kitabını geri almak istiyor musunuz?`, {
      action: {
        label: "Geri Al",
        onClick: async () => {
          try {
            await window.api.returnBook(id);
            toast.success("Kitap geri alındı");
            load();
          } catch (error) {
            toast.error("Kitap geri alınırken hata oluştu");
          }
        },
      },
    });
  };

  // ✅ Barkod okuyucular Enter / newline / boşluk basabiliyor.
  //    Kod eşleşmesini stabil yapalım.
  const normalizeCode = (v: string) =>
    (v || "")
      .trim()
      .replace(/[\r\n\t]/g, "") // Enter / newline temizle
      .replace(/\u0000/g, "") // bazı okuyucular null char basabiliyor
      .toUpperCase();

  const findAndReturnBook = async (raw: string) => {
    const clean = normalizeCode(raw);
    if (!clean) return;

    // 1) Eğer API zaten bookCode veriyorsa direkt dene (hızlı yol)
    let matchingBorrow =
      borrows.find((b: any) => normalizeCode(b.bookCode || "") === clean) ||
      null;

    // 2) Bulunamadıysa: koddan kitabı bul → bookId ile aktif ödünçte ara
    if (!matchingBorrow) {
      const booksByCode = await window.api.getBooks({ code: clean });
      const book = booksByCode?.[0];

      if (!book) {
        toast.error("Bu kodla kitap bulunamadı");
        return;
      }

      matchingBorrow = borrows.find((b: any) => b.bookId === book.id) || null;
    }

    if (!matchingBorrow) {
      toast.error("Bu kitap şu an aktif ödünçte değil");
      return;
    }

    try {
      await window.api.returnBook(matchingBorrow.id);
      toast.success(`"${matchingBorrow.bookTitle ?? "Kitap"}" geri alındı`);
      setBarcode(""); // ✅ input temizle
      load();
      // ✅ Barkod okuyucu akışında fokus kaybolmasın
      barcodeRef.current?.focus();
    } catch (error) {
      toast.error("Kitap geri alınırken hata oluştu");
    }
  };

  const calculateDays = (date: string) => {
    const start = new Date(date);
    const today = new Date();
    const diff = today.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Client-side search
  const filteredBorrows = borrows.filter((br) => {
    const text = search.toLowerCase();
    const fullName = (br.studentName ?? "").toLowerCase();
    const title = (br.bookTitle ?? "").toLowerCase();
    return fullName.includes(text) || title.includes(text);
  });

  // Stats
  const lateCount = borrows.filter(
    (br) => calculateDays(br.borrowDate) > limit
  ).length;
  const nearCount = borrows.filter((br) => {
    const days = calculateDays(br.borrowDate);
    return warningBefore > 0 && days <= limit && limit - days <= warningBefore;
  }).length;

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Clock className="text-blue-600" size={32} />
            Aktif Ödünçler
          </h1>
          <p className="text-gray-500 mt-1">
            {borrows.length} aktif ödünç kayıdı
          </p>
        </div>

        {/* Stats Badges */}
        <div className="flex gap-3">
          {lateCount > 0 && (
            <div className="px-4 py-2 rounded-lg bg-red-100 text-red-700 flex items-center gap-2">
              <AlertTriangle size={18} />
              <span className="font-semibold">{lateCount}</span>
              <span className="text-sm">gecikmiş</span>
            </div>
          )}
          {nearCount > 0 && (
            <div className="px-4 py-2 rounded-lg bg-amber-100 text-amber-700 flex items-center gap-2">
              <AlertCircle size={18} />
              <span className="font-semibold">{nearCount}</span>
              <span className="text-sm">yakında</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Barcode Input */}
          <div className="flex-1 min-w-62.5 flex gap-2">
            <div className="relative flex-1">
              <Barcode
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                ref={barcodeRef}
                type="text"
                placeholder="Kitap kodu okutun (BK-0001) ve Enter..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key !== "Enter") return;
                  const code = normalizeCode(barcode);
                  if (code.length < 3) return;

                  await findAndReturnBook(code);

                  // (findAndReturnBook içinde zaten focus + temizleme var)
                }}
              />
            </div>
            <button
              className="px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
              onClick={() => setIsScannerOpen(true)}
            >
              <QrCode size={18} />
              Tara
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-62.5">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Öğrenci adı veya kitap adı ara..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Backup Buttons */}
          <div className="flex gap-2">
            <button
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors flex items-center gap-2"
              onClick={async () => {
                try {
                  const res = await window.api.exportBorrowingsToFile();
                  if (res.canceled) return;
                  toast.success(`Yedek indirildi (${res.count} kayıt)`);
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
          </div>
        </div>
      </div>

      {/* Borrowings Grid */}
      {filteredBorrows.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Clock size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">
            {search
              ? "Aramanızla eşleşen ödünç bulunamadı"
              : "Aktif ödünç kaydı yok"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBorrows.map((br) => {
            const days = calculateDays(br.borrowDate);
            const isLate = days > limit;
            const isNearDeadline =
              warningBefore > 0 && !isLate && limit - days <= warningBefore;

            return (
              <div
                key={br.id}
                className={`bg-white rounded-xl border-2 p-4 transition-all ${
                  isLate
                    ? "border-red-300 bg-red-50/50"
                    : isNearDeadline
                    ? "border-amber-300 bg-amber-50/50"
                    : "border-gray-100"
                }`}
              >
                {/* Status Badge */}
                {(isLate || isNearDeadline) && (
                  <div className="mb-3">
                    {isLate ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        <AlertTriangle size={12} />
                        {days - limit} gün gecikmiş
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                        <AlertCircle size={12} />
                        {limit - days} gün kaldı
                      </span>
                    )}
                  </div>
                )}

                {/* Student */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <User size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {br.studentName ?? "Bilinmiyor"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {br.className ?? "-"}
                    </p>
                  </div>
                </div>

                {/* Book */}
                <div className="flex items-start gap-2 mb-3">
                  <BookOpen size={16} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800">
                      {br.bookTitle ?? "Kitap bulunamadı"}
                    </p>
                    <p className="text-sm text-gray-500">{br.bookAuthor}</p>
                  </div>
                </div>

                {/* Date & Days */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Calendar size={14} />
                  <span>{br.borrowDate}</span>
                  <span className="text-gray-400">•</span>
                  <span>{days} gün oldu</span>
                </div>

                {/* Return Button */}
                <button
                  className="w-full py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  onClick={() => returnBook(br.id, br.bookTitle ?? "Kitap")}
                >
                  <RotateCcw size={16} />
                  Geri Al
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Restore Modal */}
      <Modal isOpen={isRestoreOpen} onClose={() => setIsRestoreOpen(false)}>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Upload size={20} className="text-green-600" />
          Ödünç Yedeğinden Geri Yükle
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Geri yükleme yöntemini seçin, sonra yedek dosyasını seçeceksiniz.
        </p>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="restoreModeBorrowings"
              className="mt-1"
              checked={restoreMode === "merge"}
              onChange={() => setRestoreMode("merge")}
            />
            <div>
              <div className="font-semibold text-gray-800">
                Birleştir (Önerilen)
              </div>
              <div className="text-sm text-gray-600">
                Mevcut ödünçleri silmez, yedektekileri ekler/günceller.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-red-200 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
            <input
              type="radio"
              name="restoreModeBorrowings"
              className="mt-1"
              checked={restoreMode === "overwrite"}
              onChange={() => setRestoreMode("overwrite")}
            />
            <div>
              <div className="font-semibold text-red-700">
                Üzerine Yaz (Riskli)
              </div>
              <div className="text-sm text-gray-600">
                Önce tüm ödünçleri siler, sonra yedekten yükler.
              </div>
            </div>
          </label>

          {restoreMode === "overwrite" && (
            <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm">
              ⚠️ Dikkat: Bu işlem mevcut ödünç kayıtlarını geri dönüşsüz siler!
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
                  const res = await window.api.importBorrowingsFromFile({
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

      {/* QR Scanner Modal */}
      <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)}>
        <div className="relative">
          <button
            onClick={() => setIsScannerOpen(false)}
            className="absolute -top-2 -right-2 p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        <QRScanner
          onDetected={async (code) => {
            setIsScannerOpen(false);
            await findAndReturnBook(code);
          }}
          onClose={() => setIsScannerOpen(false)}
        />
      </Modal>
    </div>
  );
}
