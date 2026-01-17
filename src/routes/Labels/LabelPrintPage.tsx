import { useEffect, useMemo, useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import fontkit from "@pdf-lib/fontkit";
import bwipjs from "bwip-js";
import { Printer, Download, Search, Tag } from "lucide-react";

type Book = {
  id: string;
  title: string;
  author: string;
  code: string;
  shelfCode?: string;
};

let cachedFontBytes: ArrayBuffer | null = null;

async function getTurkishFontBytes() {
  if (cachedFontBytes) return cachedFontBytes;
  const res = await fetch("fonts/NotoSans-Regular.ttf");
  if (!res.ok) throw new Error("Font bulunamadı: /fonts/NotoSans-Regular.ttf");
  cachedFontBytes = await res.arrayBuffer();
  return cachedFontBytes;
}

function fitTextToWidth(opts: {
  font: any;
  text: string;
  maxWidth: number;
  maxSize: number;
  minSize: number;
}) {
  const { font, text, maxWidth, maxSize, minSize } = opts;
  let size = maxSize;
  while (size > minSize) {
    const w = font.widthOfTextAtSize(text, size);
    if (w <= maxWidth) return { text, size };
    size -= 0.5;
  }
  // Eğer hala sığmamışsa metni kısalt
  const ell = "…";
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = text.slice(0, mid) + ell;
    const w = font.widthOfTextAtSize(candidate, minSize);
    if (w <= maxWidth) lo = mid;
    else hi = mid - 1;
  }

  // Sadece metin kısaltılmışsa 3 nokta ekle
  if (lo < text.length) {
    return { text: text.slice(0, lo) + ell, size: minSize };
  }
  return { text, size: minSize };
}

async function barcodePngDataUrl(text: string, heightMM: number) {
  const canvas = document.createElement("canvas");
  bwipjs.toCanvas(canvas, {
    bcid: "code128",
    text,
    scale: 3,
    height: Math.max(8, Math.min(heightMM, 15)),
    includetext: false,
    textxalign: "center",
    backgroundcolor: "FFFFFF",
  });
  return canvas.toDataURL("image/png");
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

function calcFontSizes(textAreaH: number, labelH: number) {
  const ratio = labelH > 100 ? 0.28 : labelH > 80 ? 0.26 : 0.24;
  const bodyRatio = labelH > 100 ? 0.2 : labelH > 80 ? 0.18 : 0.16;

  const maxTitle = clamp(Math.floor(labelH * ratio), 10, 18);
  const maxBody = clamp(Math.floor(labelH * bodyRatio), 8, 14);

  const lines = 3;
  const titleGap = 4;
  const bodyGap = 3;

  const needed = maxTitle + titleGap + (lines - 1) * (maxBody + bodyGap);
  const scale = needed > textAreaH && textAreaH > 0 ? textAreaH / needed : 1;

  const titleSize = clamp(Math.floor(maxTitle * scale), 9, maxTitle);
  const bodySize = clamp(Math.floor(maxBody * scale), 7, maxBody);

  return {
    titleSize,
    bodySize,
    titleGap: titleSize + titleGap,
    bodyGap: bodySize + bodyGap,
  };
}

export default function LabelPrintPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());

  const mmToPt = (mm: number) => (mm * 72) / 25.4;

  useEffect(() => {
    window.api.getBooks().then((data) => {
      setBooks(data as Book[]);
      setLoading(false);
    });
  }, []);

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) => {
      const hay = [b.title, b.author, b.code, b.shelfCode || ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [books, search]);

  const toggleSelect = (id: string) => {
    setSelectedBooks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedBooks.size === filteredBooks.length) {
      setSelectedBooks(new Set());
    } else {
      setSelectedBooks(new Set(filteredBooks.map((b) => b.id)));
    }
  };

  const getLabelSettings = async () => {
    const [w, h, ml, mt, gx, gy, cols, qr, bh] = await Promise.all([
      window.api.getSetting("label_w_mm"),
      window.api.getSetting("label_h_mm"),
      window.api.getSetting("label_margin_left_mm"),
      window.api.getSetting("label_margin_top_mm"),
      window.api.getSetting("label_gap_x_mm"),
      window.api.getSetting("label_gap_y_mm"),
      window.api.getSetting("label_cols"),
      window.api.getSetting("label_qr_mm"),
      window.api.getSetting("label_barcode_h_mm"),
    ]);

    return {
      labelW: Number(w || 70),
      labelH: Number(h || 35),
      marginLeft: Number(ml || 7),
      marginTop: Number(mt || 12),
      gapX: Number(gx || 2),
      gapY: Number(gy || 2),
      cols: Number(cols || 3),
      qrMm: Number(qr || 18),
      barcodeHMm: Number(bh || 8),
    };
  };

  const drawOneLabel = async (opts: {
    pdfDoc: PDFDocument;
    page: any;
    font: any;
    book: Book;
    x: number;
    y: number;
    labelW: number;
    labelH: number;
    qrSize: number;
    barcodeHeight: number;
  }) => {
    const { pdfDoc, page, font, book, x, y, labelW, labelH } = opts;

    const padTop = 4;
    const padBottom = clamp(labelH * 0.06, 4, 10);
    const padSide = clamp(labelW * 0.04, 6, 10);
    const gapQR = clamp(labelW * 0.04, 5, 10);

    // Barcode ve QR boyutlarını etiket boyutuna göre sınırla
    const maxQrSize = Math.min(opts.qrSize, labelH * 0.45, labelW * 0.35);
    const qrSize = clamp(maxQrSize, 10, opts.qrSize);

    const maxBarcodeH = Math.min(
      opts.barcodeHeight,
      labelH * 0.3,
      qrSize * 0.6
    );
    const barcodeHeight = clamp(maxBarcodeH, 6, opts.barcodeHeight);

    // Alt alan: QR veya barcode'dan hangisi yüksekse + padding + küçük boşluk
    const bottomElementH = Math.max(qrSize, barcodeHeight);
    const bottomArea = padBottom + bottomElementH + 6;

    // Metin alanının yüksekliği
    const textAreaH = Math.max(20, labelH - padTop - bottomArea);

    const fonts = calcFontSizes(textAreaH, labelH);

    const textX = x + padSide;
    const textTop = y + labelH - padTop;

    // QR sağ alt köşede
    const qrX = x + labelW - padSide - qrSize;
    const qrY = y + padBottom;

    // Barcode sol alt köşede, QR ile aynı hizada
    const barcodeX = x + padSide;
    const barcodeY = y + padBottom + (qrSize - barcodeHeight) / 2; // Dikeyde ortala

    // Barcode genişliği
    const barcodeW = Math.max(0, labelW - padSide * 2 - qrSize - gapQR);

    // Metin alanı genişliği - tam etiket genişliği kullanılabilir çünkü metinler üstte
    const textMaxW = Math.max(0, labelW - padSide * 2 - 4);

    const qrBase64 = await QRCode.toDataURL(book.code, {
      margin: 1,
      width: 200,
    });
    const qrImage = await pdfDoc.embedPng(qrBase64);
    const barcodeBase64 = await barcodePngDataUrl(book.code, barcodeHeight);
    const barcodeImage = await pdfDoc.embedPng(barcodeBase64);

    // Etiket çerçevesi
    page.drawRectangle({
      x,
      y,
      width: labelW,
      height: labelH,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 0.5,
    });

    const y1 = textTop - fonts.titleGap;
    const y2 = y1 - fonts.bodyGap;
    const y3 = y2 - fonts.bodyGap;

    // Başlık
    const title = fitTextToWidth({
      font,
      text: book.title || "-",
      maxWidth: textMaxW,
      maxSize: fonts.bodySize,
      minSize: 7,
    });
    page.drawText(title.text, {
      x: textX,
      y: y1,
      size: title.size,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Yazar
    const author = fitTextToWidth({
      font,
      text: book.author || "-",
      maxWidth: textMaxW,
      maxSize: fonts.bodySize,
      minSize: 7,
    });
    page.drawText(author.text, {
      x: textX,
      y: y2,
      size: author.size,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Kod + Raf
    const shelfPart = book.shelfCode ? ` Raf:${book.shelfCode}` : "";
    const combined = fitTextToWidth({
      font,
      text: `${book.code}${shelfPart}`,
      maxWidth: textMaxW,
      maxSize: fonts.bodySize,
      minSize: 7,
    });
    page.drawText(combined.text, {
      x: textX,
      y: y3,
      size: combined.size,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Barcode
    if (barcodeW > 0) {
      page.drawImage(barcodeImage, {
        x: barcodeX,
        y: barcodeY,
        width: barcodeW,
        height: barcodeHeight,
      });
    }

    // QR Code
    page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
  };

  const generatePDF = async (booksToGenerate: Book[]) => {
    if (booksToGenerate.length === 0) return;

    setGenerating(true);
    try {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);
      const fontBytes = await getTurkishFontBytes();
      const font = await pdfDoc.embedFont(fontBytes);
      const cfg = await getLabelSettings();

      const pageW = 595;
      const pageH = 842;
      const labelW = mmToPt(cfg.labelW);
      const labelH = mmToPt(cfg.labelH);
      const marginLeft = mmToPt(cfg.marginLeft);
      const marginTop = mmToPt(cfg.marginTop);
      const gapX = mmToPt(cfg.gapX);
      const gapY = mmToPt(cfg.gapY);
      const qrSize = mmToPt(cfg.qrMm);
      const barcodeHeight = mmToPt(cfg.barcodeHMm);

      let page = pdfDoc.addPage([pageW, pageH]);
      let i = 0;

      for (let idx = 0; idx < booksToGenerate.length; idx++) {
        const book = booksToGenerate[idx];
        const col = i % cfg.cols;
        const row = Math.floor(i / cfg.cols);
        const x = marginLeft + col * (labelW + gapX);
        const yTop = pageH - marginTop - row * (labelH + gapY);
        const y = yTop - labelH;

        if (y < 10) {
          page = pdfDoc.addPage([pageW, pageH]);
          i = 0;
          idx--;
          continue;
        }

        await drawOneLabel({
          pdfDoc,
          page,
          font,
          book,
          x,
          y,
          labelW,
          labelH,
          qrSize,
          barcodeHeight,
        });
        i++;
      }

      const pdfBytes = await pdfDoc.save();
      await window.api.savePdfFile({
        defaultName: "etiketler.pdf",
        bytes: Array.from(pdfBytes),
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateSingleLabel = async (book: Book) => {
    setGenerating(true);
    try {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);
      const fontBytes = await getTurkishFontBytes();
      const font = await pdfDoc.embedFont(fontBytes);
      const cfg = await getLabelSettings();

      const labelW = mmToPt(cfg.labelW);
      const labelH = mmToPt(cfg.labelH);
      const qrSize = mmToPt(cfg.qrMm);
      const barcodeHeight = mmToPt(cfg.barcodeHMm);

      const page = pdfDoc.addPage([labelW, labelH]);
      await drawOneLabel({
        pdfDoc,
        page,
        font,
        book,
        x: 0,
        y: 0,
        labelW,
        labelH,
        qrSize,
        barcodeHeight,
      });

      const pdfBytes = await pdfDoc.save();
      await window.api.savePdfFile({
        defaultName: `${book.code}.pdf`,
        bytes: Array.from(pdfBytes),
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const booksToExport =
    selectedBooks.size > 0
      ? filteredBooks.filter((b) => selectedBooks.has(b.id))
      : filteredBooks;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Tag className="text-blue-600" size={32} />
          Kitap Etiketleri
        </h1>
        <p className="text-gray-500">
          Kitaplarınız için QR kodlu ve barkodlu etiketler oluşturun
        </p>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
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

          {/* Buttons */}
          <div className="flex gap-3 items-center">
            <span className="text-sm text-gray-500 px-2">
              {selectedBooks.size > 0
                ? `${selectedBooks.size} seçili`
                : `${filteredBooks.length} kitap`}
            </span>

            <button
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
              onClick={selectAll}
            >
              {selectedBooks.size === filteredBooks.length
                ? "Seçimi Kaldır"
                : "Tümünü Seç"}
            </button>

            <button
              className="px-5 py-2.5 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 text-white font-medium text-sm shadow-md shadow-blue-200 hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => generatePDF(booksToExport)}
              disabled={generating || booksToExport.length === 0}
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Printer size={18} />
                  PDF Oluştur ({booksToExport.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBooks.map((book) => {
          const isSelected = selectedBooks.has(book.id);
          return (
            <div
              key={book.id}
              className={`bg-white rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-md ${
                isSelected
                  ? "border-blue-500 bg-blue-50/50 shadow-md"
                  : "border-gray-100 hover:border-gray-200"
              }`}
              onClick={() => toggleSelect(book.id)}
            >
              <div className="flex justify-between items-start gap-3">
                {/* Book Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate mb-1">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {book.author}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {book.code}
                    </span>
                    {book.shelfCode && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                        Raf: {book.shelfCode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Selection indicator + Single download */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>

                  <button
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      generateSingleLabel(book);
                    }}
                    title="Tek etiket indir"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredBooks.length === 0 && (
        <div className="text-center py-12">
          <Tag className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">Aramanızla eşleşen kitap bulunamadı</p>
        </div>
      )}
    </div>
  );
}
