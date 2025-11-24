
"use client";

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Search, FileDown, FileUp } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Product, Category } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<F>): void => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), waitFor);
    };
}

export function ProductsTab({
    products,
    isLoading,
    onAdd,
    onEdit,
    onDelete,
    onExport,
    onImport,
    categories
}: {
    products: Product[];
    isLoading: boolean;
    onAdd: () => void;
    onEdit: (product: Product) => void;
    onDelete: (id: number) => void;
    onExport: () => void;
    onImport: () => void;
    categories: Category[];
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const debouncedSetSearchTerm = debounce(handleSearchChange, 300);

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || product.categoryIds.includes(Number(categoryFilter));
        const matchesStock = stockFilter === 'all' || 
                             (stockFilter === 'in-stock' && product.stock > 0) ||
                             (stockFilter === 'out-of-stock' && product.stock === 0);
        return matchesSearch && matchesCategory && matchesStock;
    });

    const getCategoryNames = (categoryIds: number[]) => {
        return categoryIds.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).join(', ');
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-2 justify-between">
                <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nombre o SKU..."
                        className="pl-8 w-full"
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                     <select onChange={(e) => setCategoryFilter(e.target.value)} className="w-full sm:w-auto px-3 h-10 text-sm border border-input rounded-md bg-transparent focus:ring-1 focus:ring-ring focus:outline-none">
                        <option value="all">Todas las categorías</option>
                        {categories.filter(c => !c.parentId).map(category => (
                            <optgroup label={category.name} key={category.id}>
                                <option value={category.id}>{category.name} (Principal)</option>
                                {categories.filter(c => c.parentId === category.id).map(child => (
                                     <option key={child.id} value={child.id}>- {child.name}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    <select onChange={(e) => setStockFilter(e.target.value)} className="w-full sm:w-auto px-3 h-10 text-sm border border-input rounded-md bg-transparent focus:ring-1 focus:ring-ring focus:outline-none">
                        <option value="all">Todo el stock</option>
                        <option value="in-stock">En stock</option>
                        <option value="out-of-stock">Agotado</option>
                    </select>
                </div>
                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={onExport}><FileDown className="mr-2 h-4 w-4"/>Exportar</Button>
                    <Button onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Producto</Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden w-[100px] sm:table-cell">Imagen</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead className="hidden md:table-cell">Categorías</TableHead>
                            <TableHead className="hidden md:table-cell">Precio</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead><span className="sr-only">Acciones</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center">Cargando productos...</TableCell></TableRow>
                        ) : filteredProducts.length === 0 ? (
                             <TableRow><TableCell colSpan={6} className="text-center">No se encontraron productos.</TableCell></TableRow>
                        ) : (
                            filteredProducts.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell className="hidden sm:table-cell">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img alt={product.name} className="aspect-square rounded-md object-cover" height="64" src={product.images[0]} width="64" />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="font-bold">{product.name}</div>
                                        <div className="text-sm text-muted-foreground md:hidden">{formatCurrency(product.price)}</div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{getCategoryNames(product.categoryIds)}</TableCell>
                                    <TableCell className="hidden md:table-cell">{formatCurrency(product.price)}</TableCell>
                                    <TableCell>
                                        {product.stock > 0 
                                            ? <Badge>{product.stock} en stock</Badge>
                                            : <Badge variant="destructive">Agotado</Badge>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => onEdit(product)}>Editar</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onDelete(product.id)} className="text-red-600">Eliminar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
