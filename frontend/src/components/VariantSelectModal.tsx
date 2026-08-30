import { Product } from '../hooks/useProducts';
import { X, Package } from 'lucide-react'; // ✅ Íconos

interface VariantSelectModalProps {
  product: Product | null;
  onSelect: (product: any, variant: any) => void;
  onClose: () => void;
}

export default function VariantSelectModal({ product, onSelect, onClose }: VariantSelectModalProps) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Seleccionar Variante</h2>
            <p className="text-xs text-slate-500 mt-0.5">{product.name} - {product.sku}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24} /></button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {product.variants.map((variant: any) => (
            <button
              key={variant.id}
              onClick={() => onSelect(product, variant)}
              disabled={variant.stock <= 0}
              className="w-full flex justify-between items-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-slate-900 dark:text-white">{variant.size.name}</span>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300">{variant.color.name}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${variant.stock <= 0 ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'}`}>
                Stock: {variant.stock}
              </span>
            </button>
          ))}
        </div>

        <button onClick={onClose} className="mt-6 w-full py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold rounded-lg transition-colors text-sm">
          Cancelar
        </button>
      </div>
    </div>
  );
}