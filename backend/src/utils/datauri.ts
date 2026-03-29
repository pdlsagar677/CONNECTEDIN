import DataUriParser from 'datauri/parser.js';
import path from 'path';

interface MulterFileCompatible {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

const parser = new DataUriParser();

const getDataUri = (file: MulterFileCompatible): string => {
  if (!file.buffer) {
    throw new Error('File buffer is undefined. Ensure multer is configured with memoryStorage.');
  }

  // Ensure extension starts with dot
  let extName = path.extname(file.originalname).toLowerCase();
  if (!extName.startsWith('.')) {
    extName = '.' + extName;
  }

  // Format the data URI
  const dataUri = parser.format(extName, file.buffer);

  if (!dataUri || !dataUri.content) {
    // Fallback to MIME type if extension fails
    const base64 = file.buffer.toString('base64');
    const mime = file.mimetype || 'application/octet-stream';
    return `data:${mime};base64,${base64}`;
  }

  return dataUri.content;
};

export default getDataUri;
