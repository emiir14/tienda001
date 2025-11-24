
import { NextResponse } from 'next/server';

const CORREO_ARGENTINO_API_URL = 'https://api.correoargentino.com.ar/prod/shipping_calculator'; // This is a placeholder URL

export async function POST(request: Request) {
  const { postalCode } = await request.json();

  if (!postalCode) {
    return NextResponse.json({ error: 'Código postal no proporcionado.' }, { status: 400 });
  }

  const apiKey = process.env.CORREO_ARGENTINO_API_KEY;
  const originPostalCode = process.env.NEXT_PUBLIC_ORIGIN_POSTAL_CODE;
  const weight = process.env.DEFAULT_PACKAGE_WEIGHT_KG || '0.5';

  if (!apiKey || !originPostalCode) {
    console.error('Error: Missing Correo Argentino environment variables.');
    // Simulate a successful response for frontend development if keys are missing
    const mockPrice = 3500.50;
    return NextResponse.json({ price: mockPrice });
    // In production, you might want to return a proper error:
    // return NextResponse.json({ error: 'El servicio de cálculo de envío no está disponible en este momento.' }, { status: 503 });
  }

  const requestBody = {
    origin_postal_code: originPostalCode,
    destination_postal_code: postalCode,
    weight_kg: parseFloat(weight),
    // You might need other parameters like package dimensions, service type, etc.
    // Refer to the official Correo Argentino API documentation.
  };

  try {
    // === PRODUCTION CODE (DISABLED FOR MOCK) ===
    /*
    const apiResponse = await fetch(CORREO_ARGENTINO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.json();
      console.error('Correo Argentino API Error:', errorBody);
      throw new Error(errorBody.message || 'Error al calcular el envío.');
    }

    const data = await apiResponse.json();
    const price = data.price; // Adjust this based on the actual API response structure

    if (price === undefined || price === null) {
      throw new Error('La respuesta de la API no contenía un precio válido.');
    }

    return NextResponse.json({ price });
    */

    // === MOCK RESPONSE (FOR DEVELOPMENT) ===
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockPrice = Math.floor(Math.random() * (8000 - 2500 + 1)) + 2500; // Random price between 2500 and 8000

    if (postalCode === "0000") { // Simulate an invalid postal code
        return NextResponse.json({ error: 'El código postal no es válido.' }, { status: 404 });
    }

    return NextResponse.json({ price: mockPrice });

  } catch (error) {
    console.error('Failed to calculate shipping:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al calcular el envío.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
