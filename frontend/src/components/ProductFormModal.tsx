import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '../schemas/productSchema';
import { useMeta } from '../hooks/useMeta';
import { useProducts } from '../hooks/useProducts';
import { useUpload } from '../hooks/useUpload';
import { X, Upload, Plus, Trash2, ImagePlus } from 'lucide-react'; // ✅ Íconos modernos

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  createProduct: (data: ProductFormData) => Promise<boolean>;
}

export default function ProductFormModal({ isOpen, onClose, createProduct }: ProductFormModalProps) {
  const { meta, loading: metaLoading, createCategory, createBrand } = useMeta();
  const { uploadImage, isUploading } = useUpload();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { imageUrl: '', variants: [{ sizeId: '', colorId: '', stock: 0, minStock: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'variants' });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      const url = await uploadImage(file);
      if (url) setValue('imageUrl', url);
    }
  };

  const handleAddCategory = async () => {
    const name = window.prompt('Ingrese el nombre de la nueva categoría:');
    if (name) { const newCategory = await createCategory(name); if (newCategory) setValue('categoryId', newCategory.id); }
  };

  const handleAddBrand = async () => {
    const name = window.prompt('Ingrese el nombre de la nueva marca:');
    if (name) { const newBrand = await createBrand(name); if (newBrand) setValue('brandId', newBrand.id); }
  };

  const onSubmit = async (data: ProductFormData) => {
    const success = await createProduct(data);
    if (success) { setImagePreview(null); onClose(); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nuevo Producto</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24} /></button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Sección Info Base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Imagen */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Imagen del Producto</label>
                <div className="flex items-center space-x-4">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-600" />
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                      <ImagePlus className="text-slate-400" size={24} />
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" disabled={isUploading} />
                  <label htmlFor="image-upload" className={`cursor-pointer px-4 py-2 ${isUploading ? 'bg-slate-400' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'} text-slate-800 dark:text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2`}>
                    <Upload size={16} /> {isUploading ? 'Subiendo...' : 'Subir Imagen'}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Nombre</label>
                <input {...register('name')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">SKU</label>
                <input {...register('sku')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" />
                {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Precio ($)</label>
                <input type="number" step="0.01" {...register('price')} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
              </div>

              {/* Select Categoría */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Categoría</label>
                <div className="flex space-x-2">
                  <select {...register('categoryId')} className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" disabled={metaLoading}>
                    <option value="">Selecciona...</option>
                    {meta?.categories.map((c: { id: string; name: string }) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                  <button type="button" onClick={handleAddCategory} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-bold transition-colors"><Plus size={16} /></button>
                </div>
                {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
              </div>

              {/* Select Marca */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Marca</label>
                <div className="flex space-x-2">
                  <select {...register('brandId')} className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" disabled={metaLoading}>
                    <option value="">Selecciona...</option>
                    {meta?.brands.map((b: { id: string; name: string }) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                  </select>
                  <button type="button" onClick={handleAddBrand} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-bold transition-colors"><Plus size={16} /></button>
                </div>
                {errors.brandId && <p className="text-red-500 text-xs mt-1">{errors.brandId.message}</p>}
              </div>
            </div>

            {/* Sección Variantes */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Variantes (Talla/Color/Stock)</h3>
                <button type="button" onClick={() => append({ sizeId: '', colorId: '', stock: 0, minStock: 1 })} className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1 font-semibold"><Plus size={12} /> Añadir</button>
              </div>

              {errors.variants && <p className="text-red-500 text-xs mb-2">{errors.variants.message}</p>}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Talla</label>
                      <select {...register(`variants.${index}.sizeId`)} className="w-full px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none">
                        <option value="">...</option>
                        {meta?.sizes.map((s: { id: string; name: string }) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Color</label>
                      <select {...register(`variants.${index}.colorId`)} className="w-full px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none">
                        <option value="">...</option>
                        {meta?.colors.map((c: { id: string; name: string }) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Stock</label>
                      <input type="number" {...register(`variants.${index}.stock`)} className="w-full px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Mínimo</label>
                      <input type="number" {...register(`variants.${index}.minStock`)} className="w-full px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div className="flex items-end h-full">
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(index)} className="w-full px-2 py-1.5 text-sm bg-red-50 dark:bg-red-500/10 text-red-600 rounded-md hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center gap-1 font-medium border border-red-200 dark:border-red-500/30"><Trash2 size={12} /> Eliminar</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors">Cancelar</button>
              <button type="submit" disabled={isSubmitting || isUploading} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:bg-indigo-400 transition-colors">{isSubmitting ? 'Guardando...' : 'Guardar Producto'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}