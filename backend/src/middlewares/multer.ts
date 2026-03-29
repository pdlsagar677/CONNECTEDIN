// src/middlewares/multer.ts
import multer from 'multer';
import { Request } from 'express';

interface MulterFileCompatible {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const storage = multer.memoryStorage();

const multerInstance = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1,
  },
  fileFilter: (req: Request, file: MulterFileCompatible, cb: multer.FileFilterCallback) => {
    cb(null, true);
  },
});

export const uploadProfilePicture = multerInstance.single('profilePhoto');

export default multerInstance;
