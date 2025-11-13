'use server';

import { headers } from 'next/headers';
import bcrypt from 'bcrypt';

// --- Configuración de Seguridad ---
const MAX_ATTEMPTS = 3;
const LOCK_TIME = 3 * 60 * 1000; // 3 minutos en milisegundos

// --- Almacenamiento en Memoria para el Límite de Intentos ---
// NOTA: Este objeto se reiniciará si el servidor se reinicia. 
// Para producción persistente, se recomienda usar una base de datos como Redis.
const loginAttempts = new Map<string, { attempts: number; lockUntil: number }>();

// --- Función de Autenticación Segura ---
export async function authenticateAdmin(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // CORRECTO: Usamos `await` para esperar las cabeceras
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') ?? '127.0.0.1'; // Obtener la IP del usuario

    // 1. Verificar si la IP está bloqueada
    const attemptInfo = loginAttempts.get(ip);
    if (attemptInfo && attemptInfo.lockUntil > Date.now()) {
        const remainingSeconds = Math.ceil((attemptInfo.lockUntil - Date.now()) / 1000);
        return { success: false, error: `Demasiados intentos. Por favor, espera ${remainingSeconds} segundos.` };
    }

    // 2. Validar longitud de las credenciales
    if (email.length > 45 || password.length > 45) {
        return { success: false, error: 'El email y la contraseña no pueden exceder los 45 caracteres.' };
    }

    // 3. Obtener credenciales seguras del entorno (NO PÚBLICAS)
    const adminEmail = process.env.ADMIN_EMAIL;
    const hashedPassword = process.env.ADMIN_PASSWORD_HASH;

    if (!adminEmail || !hashedPassword) {
        console.error("Las credenciales de administrador (ADMIN_EMAIL, ADMIN_PASSWORD_HASH) no están configuradas en el servidor.");
        return { success: false, error: 'Error de configuración del servidor.' };
    }
    
    const isEmailCorrect = email === adminEmail;
    // Asegurarse de que password no sea nulo o indefinido antes de pasarlo a bcrypt
    const isPasswordCorrect = password ? await bcrypt.compare(password, hashedPassword) : false;

    // 4. Procesar el resultado del login
    if (isEmailCorrect && isPasswordCorrect) {
        // Login exitoso: limpiar intentos para esta IP
        loginAttempts.delete(ip);
        return { success: true, error: null };
    } else {
        // Login fallido: registrar intento y bloquear si es necesario
        let newAttempts = (attemptInfo?.attempts ?? 0) + 1;
        if (newAttempts >= MAX_ATTEMPTS) {
            loginAttempts.set(ip, { attempts: newAttempts, lockUntil: Date.now() + LOCK_TIME });
            return { success: false, error: 'Credenciales inválidas. Has alcanzado el límite de intentos. Inténtalo de nuevo en 3 minutos.' };
        } else {
            loginAttempts.set(ip, { attempts: newAttempts, lockUntil: 0 });
            return { success: false, error: 'Credenciales inválidas. Inténtalo de nuevo.' };
        }
    }
}
