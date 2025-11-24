import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return new NextResponse('Missing filename or request body', { status: 400 });
  }

  try {
    const imageBuffer = await request.arrayBuffer();

    // Optimize the image with Sharp
    const optimizedBuffer = await sharp(Buffer.from(imageBuffer))
      .resize({ width: 1200, height: 1200, withoutEnlargement: true }) // Resize without enlarging
      .webp({ quality: 80 }) // Convert to WebP with 80% quality
      .toBuffer();

    // Sanitize filename for Vercel Blob
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const blobFilename = `products/${new Date().getTime()}-${sanitizedFilename}`;
    

    // Upload the optimized image to Vercel Blob
    const blob = await put(blobFilename, optimizedBuffer, {
      access: 'public',
      contentType: 'image/webp', // Set content type to webp
    });

    // Return the public URL
    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error uploading image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Error uploading image: ${errorMessage}`, { status: 500 });
  }
}
