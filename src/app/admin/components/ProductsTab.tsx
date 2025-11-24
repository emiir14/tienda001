import { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, FileDown, PlusCircle, Trash2, Pencil, Search, ChevronsUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { Product, Category } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';


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
    const [inputValue, setInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    type SortableKeys = 'id' | 'name' | 'price' | 'discountPercentage' | 'stock' | 'category';
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys, direction: 'asc' | 'desc' }>({ key: 'id', direction: 'asc' });

    const sortedProducts = useMemo(() => {
        let sortableItems = [...products];
        if (sortConfig) {
            sortableItems.sort((a, b) => {
                const key = sortConfig.key;
                let aValue: any = a[key as keyof Product];
                let bValue: any = b[key as keyof Product];

                if (key === 'category') {
                    aValue = categories.find(c => c.id === a.categoryIds[0])?.name || '';
                    bValue = categories.find(c => c.id === b.categoryIds[0])?.name || '';
                }

                if (aValue === null || aValue === undefined) aValue = -Infinity;
                if (bValue === null || bValue === undefined) bValue = -Infinity;

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [products, sortConfig, categories]);

    const filteredProducts = useMemo(() => {
        const lowercasedQuery = searchTerm.toLowerCase();
        if (!lowercasedQuery) return sortedProducts;

        return sortedProducts.filter(product => {
             const categoryNames = product.categoryIds.map(id => categories.find(c => c.id === id)?.name || '').join(' ');
             const fieldsToSearch = [
                product.id.toString(),
                product.name,
                product.sku || '',
                categoryNames
             ];
             return fieldsToSearch.some(field => field.toLowerCase().includes(lowercasedQuery));
        });
    }, [sortedProducts, searchTerm, categories]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground/70" />;
        }
        return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    const renderHeaderButton = (key: SortableKeys, label: string, className: string = "") => (
        <Button variant="ghost" onClick={() => requestSort(key)} className={cn("px-2 h-8", className)}>
            {label}{getSortIcon(key)}
        </Button>
    );

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchTerm(inputValue.trim());
    };
    
    const getCategoryNames = (categoryIds: number[]) => {
        return categoryIds.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).map(name => <Badge key={name} variant="outline" className="mr-1 mb-1">{name}</Badge>);
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                 <div>
                    <h2 className="text-2xl font-bold font-headline">Gestionar Productos</h2>
                    <p className="text-muted-foreground">Añade, edita o elimina productos de tu catálogo.</p>
                </div>
                <div className="flex gap-2 self-start md:self-auto">
                    <Button variant="outline" onClick={onImport}><FileUp className="mr-2 h-4 w-4" />Importar</Button>
                    <Button variant="outline" onClick={onExport}><FileDown className="mr-2 h-4 w-4" />Exportar</Button>
                    <Button onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Producto</Button>
                </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por nombre, SKU, categoría..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="pl-10 w-full md:w-[300px] lg:w-[400px]"
                    />
                </div>
                <Button type="submit">Buscar</Button>
            </form>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden w-[80px] sm:table-cell">Imagen</TableHead>
                            <TableHead className="w-[110px]">{renderHeaderButton('id', 'ID')}</TableHead>
                            <TableHead>{renderHeaderButton('name', 'Nombre')}</TableHead>
                            <TableHead className="hidden lg:table-cell">{renderHeaderButton('price', 'Precio')}</TableHead>
                            <TableHead className="hidden md:table-cell">{renderHeaderButton('discountPercentage', 'Descuento')}</TableHead>
                            <TableHead className="hidden md:table-cell">{renderHeaderButton('stock', 'Stock')}</TableHead>
                            <TableHead className="hidden lg:table-cell">Categorías</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">Cargando productos...</TableCell>
                            </TableRow>
                        ) : filteredProducts.length > 0 ? (
                            filteredProducts.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell className="hidden sm:table-cell">
                                        <img
                                            alt={product.name}
                                            className="aspect-square rounded-md object-cover"
                                            height="64"
                                            src={product.images[0] || '/placeholder.svg'}
                                            width="64"
                                        />
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">#{product.id}</TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell className="hidden lg:table-cell">{formatCurrency(product.price)}</TableCell>
                                    <TableCell className="hidden md:table-cell text-center">{product.discountPercentage ? `${product.discountPercentage}%` : '-'}</TableCell>
                                    <TableCell className="hidden md:table-cell text-center">{product.stock}</TableCell>
                                    <TableCell className="hidden lg:table-cell">{getCategoryNames(product.categoryIds)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center gap-2 justify-end">
                                            <Button variant="outline" size="icon" onClick={() => onEdit(product)}><Pencil className="h-4 w-4"/></Button>
                                            <Button variant="destructive" size="icon" onClick={() => onDelete(product.id)}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">No se encontraron productos.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
