"use client";

import Image from 'next/image';
import type { Product, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PlusCircle, Edit, Trash2, Loader2, Download, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProductsTab({ products, isLoading, onEdit, onDelete, onAdd, onExport, onImport, categories }: { products: Product[], isLoading: boolean, onEdit: (p: Product) => void, onDelete: (id: number) => void, onAdd: () => void, onExport: () => void, onImport: () => void, categories: Category[] }) {
    return (
         <Card className="shadow-lg">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div><CardTitle>Gestionar Productos</CardTitle><CardDescription>Añade, edita o elimina productos de tu catálogo.</CardDescription></div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button onClick={onImport} variant="outline"><Upload className="mr-2 h-4 w-4" />Importar</Button>
                    <Button onClick={onExport} variant="outline"><Download className="mr-2 h-4 w-4" />Exportar</Button>
                    <Button onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Producto</Button>
                </div>
            </CardHeader>
            <CardContent className='p-0'>
                {isLoading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                    <div className="overflow-x-auto">
                        <Table><TableHeader><TableRow><TableHead>Imagen</TableHead><TableHead>Nombre</TableHead><TableHead>Precio</TableHead><TableHead>Descuento</TableHead><TableHead>Stock</TableHead><TableHead>Categorías</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader><TableBody>
                            {products.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <Image
                                            src={product.images[0] ?? "https://placehold.co/40x40.png"}
                                            alt={product.name}
                                            width={40}
                                            height={40}
                                            className="rounded-md object-cover"
                                            data-ai-hint={product.aiHint}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>
                                        {product.salePrice ? (
                                            <div className="flex flex-col">
                                                <span className="line-through text-muted-foreground text-xs">
                                                    ${product.price.toLocaleString('es-AR')}
                                                </span>
                                                <span className="font-bold text-base text-destructive">
                                                    ${product.salePrice.toLocaleString('es-AR')}
                                                </span>
                                            </div>
                                        ) : (
                                            `$${product.price.toLocaleString('es-AR')}`
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {product.salePrice && product.discountPercentage && (
                                            <Badge variant="destructive">-{product.discountPercentage}%</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{product.stock}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {product.categoryIds.map(catId => {
                                                const category = categories.find(c => c.id === catId);
                                                return category ? <Badge key={catId} variant="secondary">{category.name}</Badge> : null;
                                            })}
                                        </div>
                                    </TableCell>
                                    <TableCell><div className="flex gap-2">
                                        <Button variant="outline" size="icon" onClick={() => onEdit(product)}><Edit className="h-4 w-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el producto.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDelete(product.id)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div></TableCell>
                                </TableRow>
                            ))}
                        </TableBody></Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
