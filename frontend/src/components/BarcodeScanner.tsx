import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertTriangle, Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode('barcode-reader');
        scannerRef.current = html5QrCode;

        // Configuración: usar cámara trasera en celulares, y webcam en PC
        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            // Al escanear con éxito
            onScan(decodedText);
            // Detener cámara y cerrar
            html5QrCode
              .stop()
              .then(() => {
                html5QrCode.clear();
                onClose();
              })
              .catch((err) => console.error('Error al detener escáner:', err));
          },
          (errorMessage) => {
            // Esto se ejecuta constantemente si no encuentra código, lo ignoramos para no llenar la consola
          }
        );
        setIsStarting(false);
      } catch (err: any) {
        console.error('Error al iniciar cámara:', err);
        setError('No se pudo acceder a la cámara. Asegúrate de dar permisos en el navegador.');
        setIsStarting(false);
      }
    };

    startScanner();

    // Limpieza al cerrar el componente
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Camera size={20} className="text-indigo-600" /> Escanear Producto
          </h3>
          <button
            onClick={() => {
              if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(() => {});
              }
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          {error ? (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-xl text-red-600 dark:text-red-400 flex items-start gap-3">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Error de Cámara</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          ) : (
            <div className="relative aspect-square w-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
              {/* Contenedor donde se inyecta el video de la cámara */}
              <div id="barcode-reader" className="w-full h-full" />

              {isStarting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <Loader2 className="animate-spin mb-2" size={32} />
                  <p className="text-sm">Iniciando cámara...</p>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
            Apunta la cámara hacia el código de barras del producto.
          </p>
        </div>
      </div>
    </div>
  );
}
