import { neon } from '@neondatabase/serverless';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

let dbInstance: any = null;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(price: number): string {
    return `$${price.toFixed(2)}`;
}

/**
 * Indica si la aplicación está configurada para usar una base de datos real.
 * Esto se determina por la presencia de la variable de entorno de la cadena de conexión.
 * Es una constante que se evalúa en el momento de la construcción (build time) en el servidor.
 */
export const isDbConfigured = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);

/**
 * Devuelve una función de consulta de base de datos inicializada de forma "perezosa" (lazy).
 * Si la base de datos no está configurada, esta función lanzará un error.
 * Esto asegura que cualquier intento de usar la BD sin configuración falle de forma explícita y ruidosa.
 */
export function getDb() {
    if (dbInstance === null) {
        // Comprobamos la configuración de nuevo aquí dentro para ser absolutamente seguros.
        const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        
        if (!connectionString) {
            // Este es un error crítico de configuración.
            throw new Error('La cadena de conexión de la base de datos (POSTGRES_URL o DATABASE_URL) no está configurada.');
        }
        
        console.log('Inicializando conexión "perezosa" a la base de datos...');
        dbInstance = neon(connectionString);
    }
    return dbInstance;
}