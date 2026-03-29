import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

const cloudinaryConfig: CloudinaryConfig = {
  cloud_name: process.env.CLOUD_NAME || '',
  api_key: process.env.API_KEY || '',
  api_secret: process.env.API_SECRET || ''
};

if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
  throw new Error('Cloudinary configuration is incomplete. Please check your environment variables.');
}

cloudinary.config(cloudinaryConfig);

export default cloudinary;