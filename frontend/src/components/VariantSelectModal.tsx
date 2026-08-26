import { Product } from '../hooks/useProducts';

interface VariantSelectModalProps {
  product: Product | null;
  onSelect: (product: any, variant: any) => void;
  onClose: () => void;
}

export default function VariantSelectModal({
  product,
  onSelect,
  onClose,
}: VariantSelectModalProps) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Seleccionar Variante
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {product.name} - {product.sku}
        </p>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {product.variants.map((variant: any) => (
            <button
              key={variant.id}
              onClick={() => onSelect(product, variant)}
              disabled={variant.stock <= 0}
              className="w-full flex justify-between items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {variant.size.name}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                  {variant.color.name}
                </span>
              </div>
              <span
                className={`text-sm font-semibold ${variant.stock <= 0 ? 'text-red-500' : 'text-green-500'}`}
              >
                Stock: {variant.stock}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
