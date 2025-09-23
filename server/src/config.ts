import { config as load } from 'dotenv';

load();

export const PORT = parseInt(process.env.PORT || '3001', 10);
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod';
export const TOKEN_TTL_SECONDS = parseInt(process.env.TOKEN_TTL_SECONDS || '3600', 10);
