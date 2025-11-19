"use server";

import { z } from "zod";
import DOMPurify from 'isomorphic-dompurify';
import { addSubscriber } from "@/lib/subscribers";

// Helper function to sanitize form data
function sanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitizedData: Record<string, any> = {};
    for (const key in data) {
        if (typeof data[key] === 'string') {
            sanitizedData[key] = DOMPurify.sanitize(data[key]);
        } else {
            sanitizedData[key] = data[key];
        }
    }
    return sanitizedData;
}

const subscriberSchema = z.object({
  email: z.string().email("El email no es válido."),
});

export async function addSubscriberAction(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const sanitizedData = sanitizeData(rawData);

  const validatedFields = subscriberSchema.safeParse(sanitizedData);

  if (!validatedFields.success) {
    return {
      error: "Email inválido. Por favor, ingrese un email correcto.",
    };
  }

  try {
    await addSubscriber(validatedFields.data.email);
    return { message: "¡Gracias por suscribirte!" };
  } catch (e: any) {
    if (e.message.includes('ya está suscripto')) {
      return { error: "Este email ya está suscripto." };
    }
    return { error: e.message || "No se pudo procesar la suscripción." };
  }
}
