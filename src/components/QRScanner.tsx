import { useEffect, useRef, useState, useCallback } from "react";
import QrScanner from "qr-scanner";

export default function QrScannerPage({
  onDetected,
  onClose,
}: {
  onDetected?: (code: string) => void;
  onClose?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const [lastResult, setLastResult] = useState("");
  const [error, setError] = useState("");

  // Memoize callback to prevent unnecessary re-renders
  const handleDetected = useCallback(
    (code: string) => {
      setLastResult(code);
      onDetected?.(code);
    },
    [onDetected]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const scanner = new QrScanner(
      video,
      (result) => {
        handleDetected(result.data);
      },
      {
        preferredCamera: "environment",
        highlightScanRegion: false,
        highlightCodeOutline: false,
      }
    );

    scannerRef.current = scanner;

    scanner.start().catch((err) => {
      console.error(err);
      setError(err.message);
    });

    return () => {
      scanner.stop();
      scannerRef.current = null; // Clean up ref to prevent memory leaks
    };
  }, [handleDetected]);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">QR Kod Tarayıcı</h1>

      {error && (
        <div className="text-red-600 mb-4 text-center">{error}</div>
      )}

      <div className="rounded-lg overflow-hidden border bg-black">
        <video
          ref={videoRef}
          className="w-full h-87.5 object-cover"
        ></video>
      </div>

      <div className="mt-4 p-3 bg-gray-100 rounded border">
        <div className="font-medium">Son Kod:</div>
        <div className="text-lg font-bold break-all">
          {lastResult || "-"}
        </div>
      </div>

      <button
        className="mt-4 bg-gray-700 text-white px-4 py-2 rounded w-full"
        onClick={onClose}
      >
        Kapat
      </button>
    </div>
  );
}
