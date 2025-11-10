
import { neon, NeonQueryFunction } from '@neondatabase/serverless';

// Instancia Singleton para la función de conexión a la base de datos
// FIX: El tipo genérico requiere dos argumentos: <ArrayMode, FullResults>
let dbInstance: NeonQueryFunction<false, false> | null = null;

/**
 * Comprueba si la cadena de conexión de la base de datos está disponible en las variables de entorno.
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
