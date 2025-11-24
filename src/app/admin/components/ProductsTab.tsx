
import { useState } from 'react';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileUp, FileDown, PlusCircle, Trash2, Pencil, Search } from "lucide-react";
import type { Product, Category } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';


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
    const [sortConfig, setSortConfig] = useState<{ key: keyof Product | 'id' | 'category'; direction: 'ascending' | 'descending' } | null>({ key: 'id', direction: 'ascending' });

    const sortedProducts = [...products].sort((a, b) => {
        if (!sortConfig) return 0;

        let aValue: any = a[sortConfig.key as keyof Product];
        let bValue: any = b[sortConfig.key as keyof Product];

        if (sortConfig.key === 'category') {
            const categoryA = categories.find(c => c.id === a.categoryIds[0])?.name || '';
            const categoryB = categories.find(c => c.id === b.categoryIds[0])?.name || '';
            aValue = categoryA;
            bValue = categoryB;
        }

        if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    const requestSort = (key: keyof Product | 'id' | 'category') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: keyof Product | 'id' | 'category') => {
        if (!sortConfig || sortConfig.key !== key) {
            return null;
        }
        return sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽';
    };

    const filteredProducts = sortedProducts.filter(product =>
        (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toString().includes(searchTerm))
    );
    
    const getCategoryNames = (categoryIds: number[]) => {
        return categoryIds.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).map(name => <Badge key={name} variant="outline" className="mr-1 mb-1">{name}</Badge>);
    }


    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold font-headline">Gestionar Productos</h2>
                <p className="text-muted-foreground">Añade, edita o elimina productos de tu catálogo.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-2 justify-between items-center">
                <div className="flex w-full md:w-auto gap-2">
                    <Input
                        placeholder="Buscar por nombre, SKU, categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-[300px] lg:w-[400px]"
                    />
                     <Button variant="outline" size="icon"><Search className="h-4 w-4"/></Button>
                </div>
                <div className="flex gap-2 self-end md:self-auto">
                    <Button variant="outline" onClick={onImport}><FileUp className="mr-2 h-4 w-4" />Importar</Button>
                    <Button variant="outline" onClick={onExport}><FileDown className="mr-2 h-4 w-4" />Exportar</Button>
                    <Button onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4" />Añadir Producto</Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden w-[80px] sm:table-cell">Imagen</TableHead>
                            <TableHead className="w-[60px] cursor-pointer" onClick={() => requestSort('id')}>ID{getSortIndicator('id')}</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => requestSort('name')}>Nombre{getSortIndicator('name')}</TableHead>
                            <TableHead className="hidden lg:table-cell cursor-pointer" onClick={() => requestSort('price')}>Precio{getSortIndicator('price')}</TableHead>
                             <TableHead className="hidden md:table-cell w-[100px] cursor-pointer" onClick={() => requestSort('discountPercentage')}>Descuento{getSortIndicator('discountPercentage')}</TableHead>
                            <TableHead className="hidden md:table-cell w-[80px] cursor-pointer" onClick={() => requestSort('stock')}>Stock{getSortIndicator('stock')}</TableHead>
                            <TableHead className="hidden lg:table-cell cursor-pointer" onClick={() => requestSort('category')}>Categorías{getSortIndicator('category')}</TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
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
                                    <TableCell className="font-medium text-xs">{product.id}</TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell className="hidden lg:table-cell">{formatCurrency(product.price)}</TableCell>
                                    <TableCell className="hidden md:table-cell">{product.discountPercentage ? `${product.discountPercentage}%` : '-'}</TableCell>
                                    <TableCell className="hidden md:table-cell">{product.stock}</TableCell>
                                    <TableCell className="hidden lg:table-cell">{getCategoryNames(product.categoryIds)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
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
