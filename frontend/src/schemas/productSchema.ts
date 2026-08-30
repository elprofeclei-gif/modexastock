import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  sku: z.string().min(1, 'El SKU es obligatorio'),
  description: z.string().optional().or(z.literal('')), // ✅ AGREGADO
  cost: z.coerce.number().min(0, 'El costo debe ser mayor o igual a 0').default(0), // ✅ AGREGADO
  price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  imageUrl: z.string().optional().or(z.literal('')),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  brandId: z.string().min(1, 'Selecciona una marca'),
  variants: z
    .array(
      z.object({
        sizeId: z.string().min(1, 'Selecciona la talla'),
        colorId: z.string().min(1, 'Selecciona el color'),
        stock: z.coerce.number().min(0, 'Stock inválido'),
        minStock: z.coerce.number().min(0, 'Stock mínimo inválido'),
      })
    )
    .min(1, 'Debes agregar al menos una variante'),
});

export type ProductFormData = z.infer<typeof productSchema>;