import { useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

export const useUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file) return null;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      // ✅ Corregido a /upload/image
      const response = await axios.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Imagen subida correctamente');
      return response.data.data.url;
    } catch (error: any) {
      toast.error('Error al subir la imagen');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
};