"use client";

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
import { PlusCircle, Edit, Trash2, Loader2, Download, CheckCircle, XCircle } from 'lucide-react';

export function CouponsTab({ coupons, isLoading, onAdd, onEdit, onDelete, onExport }: { coupons: Coupon[], isLoading: boolean, onAdd: () => void, onEdit: (c: Coupon) => void, onDelete: (id: number) => void, onExport: () => void }) {
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
                    <div className="overflow-x-auto">
                        <Table><TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Tipo</TableHead><TableHead>Valor</TableHead><TableHead>Compra Mínima</TableHead><TableHead>Expiración</TableHead><TableHead className="text-center">Estado</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader><TableBody>
                            {coupons.map(coupon => (
                                <TableRow key={coupon.id}>
                                    <TableCell className="font-medium text-primary">{coupon.code}</TableCell>
                                    <TableCell>{coupon.discountType === 'percentage' ? 'Porcentaje' : 'Monto Fijo'}</TableCell>
                                    <TableCell>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue.toLocaleString('es-AR')}`}</TableCell>
                                    <TableCell>{coupon.minPurchaseAmount ? `$${coupon.minPurchaseAmount.toLocaleString('es-AR')}` : 'N/A'}</TableCell>
                                    <TableCell>{coupon.expiryDate ? format(new Date(coupon.expiryDate), 'PPP', { locale: es }) : 'Nunca'}</TableCell>
                                    <TableCell className="text-center">
                                        {isCouponActive(coupon)
                                        ? <CheckCircle className="h-5 w-5 text-green-500 inline-block" />
                                        : <XCircle className="h-5 w-5 text-destructive inline-block" />
                                        }
                                    </TableCell>
                                    <TableCell><div className="flex gap-2">
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
                        </TableBody></Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
