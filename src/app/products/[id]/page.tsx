
import { notFound } from 'next/navigation';
import { getProductById, getProducts } from '@/lib/data/products';
import { ProductPageClient } from './ProductPageClient';
import type { Product } from '@/lib/types';
import type { Metadata, ResolvingMetadata } from 'next'

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
      notFound();
  }
  const product = await getProductById(id);

  if (!product) {
    return {
      title: 'Producto no encontrado',
    }
  }

  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || []

  return {
    title: `${product.name} | Joya - Elegancia Atemporal`,
    description: product.shortDescription || product.description,
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description,
      images: [product.images[0], ...previousImages],
    },
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const productId = parseInt(params.id, 10);
  if (isNaN(productId)) {
      notFound();
  }
  
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  // Fetch all products and find related ones
  const allProducts = await getProducts();
  const relatedProducts = allProducts.filter(p => 
    p.id !== product.id && // Exclude the current product
    p.categoryIds.some(catId => product.categoryIds.includes(catId)) // Check for shared categories
  ).slice(0, 4); // Limit to 4 recommendations

  return <ProductPageClient product={product} relatedProducts={relatedProducts} />;
}
