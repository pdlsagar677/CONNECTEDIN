"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parser_js_1 = __importDefault(require("datauri/parser.js"));
const path_1 = __importDefault(require("path"));
const parser = new parser_js_1.default();
const getDataUri = (file) => {
    if (!file.buffer) {
        throw new Error('File buffer is undefined. Ensure multer is configured with memoryStorage.');
    }
    // Ensure extension starts with dot
    let extName = path_1.default.extname(file.originalname).toLowerCase();
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
exports.default = getDataUri;
