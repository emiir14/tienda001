"use client";

import { useState, useMemo } from 'react';
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
import { PlusCircle, Edit, Trash2, Loader2, Download, Upload, ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Pagination } from './Pagination';

const ITEMS_PER_PAGE = 50;

type SortableKeys = 'id' | 'name' | 'price' | 'discountPercentage' | 'stock';

export function ProductsTab({ products, isLoading, onEdit, onDelete, onAdd, onExport, onImport, categories }: { products: Product[], isLoading: boolean, onEdit: (p: Product) => void, onDelete: (id: number) => void, onAdd: () => void, onExport: () => void, onImport: () => void, categories: Category[] }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys, direction: 'asc' | 'desc' } | null>(null);

    const sortedProducts = useMemo(() => {
        let sortableItems = [...products];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;

                if (sortConfig.key === 'price') {
                    aValue = a.salePrice ?? a.price;
                    bValue = b.salePrice ?? b.price;
                } else if (sortConfig.key === 'discountPercentage') {
                    // A discount is only "active" if there is a salePrice.
                    // This makes sorting consistent with what's displayed.
                    aValue = (a.salePrice && a.discountPercentage) ? a.discountPercentage : 0;
                    bValue = (b.salePrice && b.discountPercentage) ? b.discountPercentage : 0;
                } else {
                    // Fallback for other sortable keys like id, name, stock
                    const key = sortConfig.key;
                    aValue = a[key] ?? 0;
                    bValue = b[key] ?? 0;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [products, sortConfig]);

    const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = sortedProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const requestSort = (key: SortableKeys) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1); // Reset to first page after sorting
    };

    const getSortIcon = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ChevronsUpDown className="ml-2 h-4 w-4" />;
        }
        if (sortConfig.direction === 'asc') {
            return <ArrowUp className="ml-2 h-4 w-4" />;
        }
        return <ArrowDown className="ml-2 h-4 w-4" />;
    };
    
    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const renderHeaderButton = (key: SortableKeys, label: string) => (
        <Button variant="ghost" onClick={() => requestSort(key)} className="px-2">
            {label}
            {getSortIcon(key)}
        </Button>
    );

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
                    <>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-4">Imagen</TableHead>
                                        <TableHead>{renderHeaderButton('id', 'ID')}</TableHead>
                                        <TableHead>{renderHeaderButton('name', 'Nombre')}</TableHead>
                                        <TableHead>{renderHeaderButton('price', 'Precio')}</TableHead>
                                        <TableHead>{renderHeaderButton('discountPercentage', 'Descuento')}</TableHead>
                                        <TableHead>{renderHeaderButton('stock', 'Stock')}</TableHead>
                                        <TableHead>Categorías</TableHead>
                                        <TableHead className="pr-4 text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedProducts.map(product => (
                                        <TableRow key={product.id}>
                                            <TableCell className="pl-4">
                                                <Image
                                                    src={product.images[0] ?? "https://placehold.co/40x40.png"}
                                                    alt={product.name}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-md object-cover"
                                                />
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{product.id}</TableCell>
                                            <TableCell className="font-medium max-w-xs truncate" title={product.name}>{product.name}</TableCell>
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
                                                {product.salePrice && product.discountPercentage ? (
                                                    <Badge variant="destructive">-{product.discountPercentage}%</Badge>
                                                ) : <span className='text-center w-full block'>-</span>}
                                            </TableCell>
                                            <TableCell>{product.stock}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {product.categoryIds.map(catId => {
                                                        const category = categories.find(c => c.id === catId);
                                                        return category ? <Badge key={catId} variant="secondary">{category.name}</Badge> : null;
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-4">
                                                <div className="flex gap-2 justify-end">
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
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                         <div className="px-4 border-t">
                            <Pagination 
                                currentPage={currentPage} 
                                totalPages={totalPages} 
                                onPageChange={handlePageChange} 
                            />
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}