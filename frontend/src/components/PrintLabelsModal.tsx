import React, { useState, useEffect } from 'react';
import Barcode from 'react-barcode';
import { X, Printer, Check, PrinterCheck } from 'lucide-react';

interface VariantData {
  sku: string;
  productName: string;
  size: string;
  color: string;
}

export default function PrintLabelsModal({
  isOpen,
  onClose,
  variants,
}: {
  isOpen: boolean;
  onClose: () => void;
  variants: VariantData[];
}) {
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);

  // ✅ Al abrir el modal, preseleccionamos todas las variantes
  useEffect(() => {
    if (isOpen) {
      setSelectedSkus(variants.map((v) => v.sku));
    }
  }, [isOpen, variants]);

  if (!isOpen) return null;

  const toggleVariant = (sku: string) => {
    setSelectedSkus((prev) =>
      prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku]
    );
  };

  // ✅ Filtrar solo las etiquetas seleccionadas para la vista previa e impresión
  const labelsToPrint = variants.filter((v) => selectedSkus.includes(v.sku));

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 no-print">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl p-6 border border-slate-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Imprimir Etiquetas</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* ✅ ÁREA DE SELECCIÓN DE VARIANTES */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Selecciona qué variantes imprimir:
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSkus(variants.map((v) => v.sku))}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Seleccionar Todo
              </button>
              <button
                onClick={() => setSelectedSkus([])}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Borrar Selección
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {variants.map((v, idx) => {
              const isSelected = selectedSkus.includes(v.sku);
              return (
                <button
                  key={idx}
                  onClick={() => toggleVariant(v.sku)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-400'
                  }`}
                >
                  {isSelected && <Check size={12} />}
                  {v.size} / {v.color}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => window.print()}
            disabled={labelsToPrint.length === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 no-print"
          >
            <Printer size={18} /> Imprimir ({labelsToPrint.length})
          </button>
        </div>

        {/* ✅ ÁREA DE IMPRESIÓN (Solo etiquetas seleccionadas) */}
        <div className="print-area grid grid-cols-2 gap-4 bg-white p-4 rounded-lg">
          {labelsToPrint.map((v, idx) => (
            <div
              key={idx}
              className="label-box border border-slate-300 p-2 flex flex-col items-center justify-center text-center"
              style={{ width: '280px', height: '140px', overflow: 'hidden' }}
            >
              <p className="text-[10px] font-bold text-slate-900 uppercase w-full overflow-hidden text-ellipsis whitespace-nowrap mb-1">
                {v.productName}
              </p>
              <p className="text-[9px] text-slate-500 mb-1">
                Talla: {v.size} | Color: {v.color}
              </p>
              <Barcode
                value={v.sku}
                width={0.8}
                height={35}
                fontSize={8}
                margin={0}
                marginLeft={0}
                marginRight={0}
                textMargin={2}
                displayValue={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
