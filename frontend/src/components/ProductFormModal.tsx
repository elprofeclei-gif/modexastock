import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '../schemas/productSchema';
import { useMeta } from '../hooks/useMeta';
import { useProducts } from '../hooks/useProducts';
import { useUpload } from '../hooks/useUpload';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  createProduct: (data: ProductFormData) => Promise<boolean>;
}

export default function ProductFormModal({
  isOpen,
  onClose,
  createProduct,
}: ProductFormModalProps) {
  const { meta, loading: metaLoading, createCategory, createBrand } = useMeta();
  const { uploadImage, isUploading } = useUpload();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      imageUrl: '',
      variants: [{ sizeId: '', colorId: '', stock: 0, minStock: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      const url = await uploadImage(file);
      if (url) {
        setValue('imageUrl', url);
      }
    }
  };

  const handleAddCategory = async () => {
    const name = window.prompt('Ingrese el nombre de la nueva categoría:');
    if (name) {
      const newCategory = await createCategory(name);
      if (newCategory) {
        setValue('categoryId', newCategory.id); // Seleccionar automáticamente la nueva categoría
      }
    }
  };

  const handleAddBrand = async () => {
    const name = window.prompt('Ingrese el nombre de la nueva marca:');
    if (name) {
      const newBrand = await createBrand(name);
      if (newBrand) {
        setValue('brandId', newBrand.id); // Seleccionar automáticamente la nueva marca
      }
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    const success = await createProduct(data);
    if (success) {
      setImagePreview(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nuevo Producto</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✖
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Sección Info Base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Imagen del Producto
                </label>
                <div className="flex items-center space-x-4">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className={`cursor-pointer px-4 py-2 ${isUploading ? 'bg-gray-400' : 'bg-gray-600 hover:bg-gray-700'} text-white text-sm font-medium rounded-lg transition-colors`}
                  >
                    {isUploading ? 'Subiendo...' : 'Seleccionar Imagen'}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  {...register('name')}
                  className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:outline-none"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SKU
                </label>
                <input
                  {...register('sku')}
                  className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:outline-none"
                />
                {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Precio ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('price')}
                  className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:outline-none"
                />
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
                )}
              </div>

              {/* Select Categoría con botón + */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría
                </label>
                <div className="flex space-x-2">
                  <select
                    {...register('categoryId')}
                    className="flex-1 px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:outline-none"
                    disabled={metaLoading}
                  >
                    <option value="">Selecciona...</option>
                    {meta?.categories.map((c: { id: string; name: string }) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 font-bold"
                  >
                    +
                  </button>
                </div>
                {errors.categoryId && (
                  <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>
                )}
              </div>

              {/* Select Marca con botón + */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Marca
                </label>
                <div className="flex space-x-2">
                  <select
                    {...register('brandId')}
                    className="flex-1 px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:outline-none"
                    disabled={metaLoading}
                  >
                    <option value="">Selecciona...</option>
                    {meta?.brands.map((b: { id: string; name: string }) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddBrand}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 font-bold"
                  >
                    +
                  </button>
                </div>
                {errors.brandId && (
                  <p className="text-red-500 text-xs mt-1">{errors.brandId.message}</p>
                )}
              </div>
            </div>

            {/* Sección Variantes */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Variantes (Talla/Color/Stock)
                </h3>
                <button
                  type="button"
                  onClick={() => append({ sizeId: '', colorId: '', stock: 0, minStock: 1 })}
                  className="text-sm px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  + Añadir
                </button>
              </div>

              {errors.variants && (
                <p className="text-red-500 text-xs mb-2">{errors.variants.message}</p>
              )}

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Talla</label>
                      <select
                        {...register(`variants.${index}.sizeId`)}
                        className="w-full px-2 py-1.5 text-sm rounded border bg-white dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                      >
                        <option value="">...</option>
                        {meta?.sizes.map((s: { id: string; name: string }) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Color</label>
                      <select
                        {...register(`variants.${index}.colorId`)}
                        className="w-full px-2 py-1.5 text-sm rounded border bg-white dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                      >
                        <option value="">...</option>
                        {meta?.colors.map((c: { id: string; name: string }) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Stock</label>
                      <input
                        type="number"
                        {...register(`variants.${index}.stock`)}
                        className="w-full px-2 py-1.5 text-sm rounded border bg-white dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">Mínimo</label>
                      <input
                        type="number"
                        {...register(`variants.${index}.minStock`)}
                        className="w-full px-2 py-1.5 text-sm rounded border bg-white dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div className="flex items-end h-full">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="w-full px-2 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:bg-blue-400"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
