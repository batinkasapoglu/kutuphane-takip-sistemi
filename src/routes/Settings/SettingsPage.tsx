import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings, Clock, Tag, Save, Eye, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [limit, setLimit] = useState(15);
  const [warningBefore, setWarningBefore] = useState(3);
  const [saving, setSaving] = useState(false);

  // Etiket ayarları (mm)
  const [labelW, setLabelW] = useState(70);
  const [labelH, setLabelH] = useState(35);
  const [marginLeft, setMarginLeft] = useState(7);
  const [marginTop, setMarginTop] = useState(12);
  const [gapX, setGapX] = useState(2);
  const [gapY, setGapY] = useState(2);
  const [cols, setCols] = useState(3);
  const [qrMm, setQrMm] = useState(18);
  const [barcodeHeightMm, setBarcodeHeightMm] = useState(8);

  useEffect(() => {
    async function load() {
      const limitVal = await window.api.getSetting("borrow_limit_days");
      const warnVal = await window.api.getSetting("warning_days_before");
      const w = await window.api.getSetting("label_w_mm");
      const h = await window.api.getSetting("label_h_mm");
      const ml = await window.api.getSetting("label_margin_left_mm");
      const mt = await window.api.getSetting("label_margin_top_mm");
      const gx = await window.api.getSetting("label_gap_x_mm");
      const gy = await window.api.getSetting("label_gap_y_mm");
      const cc = await window.api.getSetting("label_cols");
      const qr = await window.api.getSetting("label_qr_mm");
      const bh = await window.api.getSetting("label_barcode_h_mm");

      if (w) setLabelW(Number(w));
      if (h) setLabelH(Number(h));
      if (ml) setMarginLeft(Number(ml));
      if (mt) setMarginTop(Number(mt));
      if (gx) setGapX(Number(gx));
      if (gy) setGapY(Number(gy));
      if (cc) setCols(Number(cc));
      if (qr) setQrMm(Number(qr));
      if (bh) setBarcodeHeightMm(Number(bh));

      if (limitVal) setLimit(Number(limitVal));
      if (warnVal) setWarningBefore(Number(warnVal));
    }

    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([
        window.api.setSetting({ key: "label_w_mm", value: String(labelW) }),
        window.api.setSetting({ key: "label_h_mm", value: String(labelH) }),
        window.api.setSetting({ key: "label_margin_left_mm", value: String(marginLeft) }),
        window.api.setSetting({ key: "label_margin_top_mm", value: String(marginTop) }),
        window.api.setSetting({ key: "label_gap_x_mm", value: String(gapX) }),
        window.api.setSetting({ key: "label_gap_y_mm", value: String(gapY) }),
        window.api.setSetting({ key: "label_cols", value: String(cols) }),
        window.api.setSetting({ key: "label_qr_mm", value: String(qrMm) }),
        window.api.setSetting({ key: "label_barcode_h_mm", value: String(barcodeHeightMm) }),
        window.api.setSetting({ key: "borrow_limit_days", value: String(limit) }),
        window.api.setSetting({ key: "warning_days_before", value: String(warningBefore) }),
      ]);
      toast.success("Ayarlar başarıyla kaydedildi!");
    } catch (error) {
      toast.error("Ayarlar kaydedilirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Settings className="text-blue-600" size={32} />
          Ayarlar
        </h1>
        <p className="text-gray-500 mt-1">
          Uygulama ayarlarını buradan yönetebilirsiniz
        </p>
      </div>

      <div className="space-y-6">
        {/* Ödünç Ayarları */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              Ödünç Verme Ayarları
            </h2>
          </div>

          <div className="p-6 space-y-5">
            {/* Gün sınırı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ödünç verme süresi (gün)
              </label>
              <input
                type="number"
                min={1}
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Kitaplar bu süre sonunda gecikmiş sayılır
              </p>
            </div>

            {/* Uyarı süresi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sarı uyarı kaç gün kala başlasın?
              </label>
              <select
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={warningBefore}
                onChange={(e) => setWarningBefore(Number(e.target.value))}
              >
                <option value={0}>Sarı uyarı verilmesin</option>
                <option value={1}>1 gün kala</option>
                <option value={2}>2 gün kala</option>
                <option value={3}>3 gün kala</option>
                <option value={5}>5 gün kala</option>
                <option value={7}>7 gün kala</option>
              </select>
            </div>
          </div>
        </div>

        {/* Etiket Ayarları */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Tag size={20} className="text-amber-600" />
              Etiket Ayarları
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InputField
                label="Etiket Genişlik (mm)"
                value={labelW}
                onChange={setLabelW}
              />
              <InputField
                label="Etiket Yükseklik (mm)"
                value={labelH}
                onChange={setLabelH}
              />
              <InputField
                label="Sol Kenar Boşluğu (mm)"
                value={marginLeft}
                onChange={setMarginLeft}
              />
              <InputField
                label="Üst Kenar Boşluğu (mm)"
                value={marginTop}
                onChange={setMarginTop}
              />
              <InputField
                label="Yatay Boşluk (mm)"
                value={gapX}
                onChange={setGapX}
              />
              <InputField
                label="Dikey Boşluk (mm)"
                value={gapY}
                onChange={setGapY}
              />
              <InputField
                label="Sütun Sayısı"
                value={cols}
                onChange={setCols}
                min={1}
                max={6}
              />
              <InputField
                label="QR Boyutu (mm)"
                value={qrMm}
                onChange={setQrMm}
                min={10}
                max={40}
              />
              <InputField
                label="Barkod Yüksekliği (mm)"
                value={barcodeHeightMm}
                onChange={setBarcodeHeightMm}
                min={4}
                max={15}
              />
            </div>

            {/* A4 Önizleme */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Eye size={16} />
                A4 Önizleme
              </div>
              <LabelPreviewA4
                labelW={labelW}
                labelH={labelH}
                marginLeft={marginLeft}
                marginTop={marginTop}
                gapX={gapX}
                gapY={gapY}
                cols={cols}
              />
              <div className="flex items-start gap-2 mt-3 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>
                  Bu önizleme yaklaşık ölçüdedir. Yazdırırken "Sayfaya Sığdır" seçeneğini kapatın ve %100 ölçekte yazdırın.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Kaydet Butonu */}
        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium shadow-md shadow-blue-200 hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save size={18} />
                Ayarları Kaydet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Reusable Input Component
function InputField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        className="w-full border border-gray-300 p-2.5 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

// A4 Preview Component
function LabelPreviewA4(props: {
  labelW: number;
  labelH: number;
  marginLeft: number;
  marginTop: number;
  gapX: number;
  gapY: number;
  cols: number;
}) {
  const scale = 1.8;
  const W = 210 * scale;
  const H = 297 * scale;

  const lw = props.labelW * scale;
  const lh = props.labelH * scale;
  const ml = props.marginLeft * scale;
  const mt = props.marginTop * scale;
  const gx = props.gapX * scale;
  const gy = props.gapY * scale;

  const rowsToShow = 3;
  const items = [];
  for (let i = 0; i < props.cols * rowsToShow; i++) {
    const col = i % props.cols;
    const row = Math.floor(i / props.cols);
    const x = ml + col * (lw + gx);
    const y = mt + row * (lh + gy);
    items.push({ x, y });
  }

  return (
    <div
      className="bg-white border-2 border-dashed border-gray-300 rounded-lg relative overflow-hidden mx-auto"
      style={{ width: W, height: H }}
    >
      {/* Grid lines hint */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 20px)' }} />
      </div>

      {items.map((it, idx) => (
        <div
          key={idx}
          className="absolute border-2 border-blue-400 bg-blue-50/50 rounded flex items-center justify-center text-xs text-blue-600 font-medium"
          style={{ left: it.x, top: it.y, width: lw, height: lh }}
        >
          Etiket {idx + 1}
        </div>
      ))}
    </div>
  );
}
