"use client";

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Coupon } from '@/lib/types';
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
import { PlusCircle, Edit, Trash2, Loader2, Download, CheckCircle, XCircle, ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Pagination } from './Pagination';

const ITEMS_PER_PAGE = 50;

type SortableKeys = 'code' | 'discountType' | 'discountValue' | 'minPurchaseAmount' | 'expiryDate';

export function CouponsTab({ coupons, isLoading, onAdd, onEdit, onDelete, onExport }: { coupons: Coupon[], isLoading: boolean, onAdd: () => void, onEdit: (c: Coupon) => void, onDelete: (id: number) => void, onExport: () => void }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys, direction: 'asc' | 'desc' } | null>(null);

    const sortedCoupons = useMemo(() => {
        let sortableItems = [...coupons];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const key = sortConfig.key;
                
                const rawA = a[key];
                const rawB = b[key];

                let comparableA: string | number | Date;
                let comparableB: string | number | Date;

                if (key === 'expiryDate') {
                    comparableA = rawA ? new Date(rawA as string) : new Date('9999-12-31');
                    comparableB = rawB ? new Date(rawB as string) : new Date('9999-12-31');
                } else if (key === 'minPurchaseAmount' || key === 'discountValue') {
                    comparableA = (rawA as number) ?? 0;
                    comparableB = (rawB as number) ?? 0;
                } else { // For 'code' and 'discountType', which are strings
                    comparableA = (rawA as string) ?? '';
                    comparableB = (rawB as string) ?? '';
                }

                if (comparableA < comparableB) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (comparableA > comparableB) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [coupons, sortConfig]);

    const totalPages = Math.ceil(sortedCoupons.length / ITEMS_PER_PAGE);
    const paginatedCoupons = sortedCoupons.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const requestSort = (key: SortableKeys) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
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

    const renderHeaderButton = (key: SortableKeys, label: string) => (
        <Button variant="ghost" onClick={() => requestSort(key)} className="px-2">
            {label}
            {getSortIcon(key)}
        </Button>
    );

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const isCouponActive = (coupon: Coupon) => {
        return coupon.isActive && (!coupon.expiryDate || new Date(coupon.expiryDate) > new Date());
    }

    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div><CardTitle>Gestionar Cupones</CardTitle><CardDescription>Crea y gestiona códigos de descuento.</CardDescription></div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button onClick={onExport} variant="outline"><Download className="mr-2 h-4 w-4" />Exportar a CSV</Button>
                    <Button onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4" />Crear Cupón</Button>
                </div>
            </CardHeader>
            <CardContent className='p-0'>
                {isLoading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                    <>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{renderHeaderButton('code', 'Código')}</TableHead>
                                        <TableHead>{renderHeaderButton('discountType', 'Tipo')}</TableHead>
                                        <TableHead className="text-center">{renderHeaderButton('discountValue', 'Valor')}</TableHead>
                                        <TableHead className="text-center">{renderHeaderButton('minPurchaseAmount', 'Compra Mínima')}</TableHead>
                                        <TableHead className="text-center">{renderHeaderButton('expiryDate', 'Expiración')}</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                        <TableHead className="text-right pr-4">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedCoupons.map(coupon => (
                                        <TableRow key={coupon.id}>
                                            <TableCell className="font-medium text-primary">{coupon.code}</TableCell>
                                            <TableCell>{coupon.discountType === 'percentage' ? 'Porcentaje' : 'Monto Fijo'}</TableCell>
                                            <TableCell className="text-center">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue.toLocaleString('es-AR')}`}</TableCell>
                                            <TableCell className="text-center">{coupon.minPurchaseAmount ? `$${coupon.minPurchaseAmount.toLocaleString('es-AR')}` : '-'}</TableCell>
                                            <TableCell className="text-center">{coupon.expiryDate ? format(new Date(coupon.expiryDate), 'PPP', { locale: es }) : 'Nunca'}</TableCell>
                                            <TableCell className="text-center">
                                                {isCouponActive(coupon)
                                                ? <CheckCircle className="h-5 w-5 text-green-500 inline-block" />
                                                : <XCircle className="h-5 w-5 text-destructive inline-block" />
                                                }
                                            </TableCell>
                                            <TableCell><div className="flex gap-2 justify-end pr-4">
                                                <Button variant="outline" size="icon" onClick={() => onEdit(coupon)}><Edit className="h-4 w-4" /></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el cupón.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onDelete(coupon.id)}>Eliminar</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div></TableCell>
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
