import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

export const uploadImage = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No se ha subido ningún archivo' });
    }

    // Convertir el buffer a un stream legible
    const stream = Readable.from(req.file.buffer);

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'modexastock' },
      (error, result) => {
        if (error) {
          console.error('Error Cloudinary:', error);
          return res.status(500).json({ status: 'error', message: 'Error al subir imagen' });
        }
        return res.status(200).json({ status: 'success', data: { url: result?.secure_url } });
      }
    );

    stream.pipe(uploadStream);
  } catch (error) {
    console.error('Error en uploadImage:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};
