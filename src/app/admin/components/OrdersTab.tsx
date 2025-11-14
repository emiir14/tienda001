"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus } from '@/lib/types';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuRadioGroup, 
    DropdownMenuRadioItem 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Download, ChevronRight, User, Mail, Home as HomeIcon, Wallet, Ticket, ChevronsUpDown, ArrowUp, ArrowDown, ListFilter } from 'lucide-react';
import { Pagination } from './Pagination';

const ITEMS_PER_PAGE = 50;

const orderStatuses: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded'];
const statusLabels: Record<OrderStatus, string> = {
    pending: 'Pendiente',
    paid: 'Abonado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    failed: 'Fallido',
    refunded: 'Reintegrado'
};

function OrderRow({ order, onStatusChange }: { order: Order; onStatusChange: (orderId: number, newStatus: OrderStatus) => void; }) {
    const [isOpen, setIsOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

    const getStatusClasses = (status: Order['status']) => {
        switch (status) {
            case 'delivered': return "bg-green-100 text-green-800 border-green-200";
            case 'pending': return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case 'failed':
            case 'cancelled': return "bg-red-100 text-red-800 border-red-200";
            case 'paid': return "bg-blue-100 text-blue-800 border-blue-200";
            case 'shipped': return "bg-purple-100 text-purple-800 border-purple-200";
            default: return "bg-background border-input";
        }
    }

    const handleStatusSelect = (newStatus: OrderStatus) => {
        if (newStatus !== order.status) {
            setPendingStatus(newStatus);
        }
    };

    const confirmStatusChange = () => {
        if (pendingStatus) {
            onStatusChange(order.id, pendingStatus);
            setPendingStatus(null);
        }
    };

    const cancelStatusChange = () => {
        setPendingStatus(null);
    };

    return (
        <React.Fragment>
            <AlertDialog open={!!pendingStatus} onOpenChange={(open) => !open && cancelStatusChange()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Cambio de Estado</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que quieres cambiar el estado de la orden de 
                            <span className="font-semibold"> "{statusLabels[order.status]}" </span> 
                            a 
                            <span className="font-semibold"> "{pendingStatus ? statusLabels[pendingStatus] : ''}"</span>?
                            {pendingStatus === 'refunded' && 
                                <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive font-bold">
                                    ¡Atención! Esta acción puede iniciar un proceso de devolución de dinero y no puede deshacerse fácilmente.
                                </div>
                            }
                            {pendingStatus === 'cancelled' && 
                                <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive font-bold">
                                    ¡Atención! Cancelar esta orden podría requerir acciones manuales adicionales (ej. devolver stock).
                                </div>
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelStatusChange}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmStatusChange}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <TableRow className="hover:bg-muted/50" data-state={isOpen ? 'open' : 'closed'}>
                <TableCell className="font-mono text-sm cursor-pointer" onClick={() => setIsOpen(!isOpen)}>#{order.id}</TableCell>
                <TableCell className="font-medium cursor-pointer" onClick={() => setIsOpen(!isOpen)}>{order.customerName}</TableCell>
                <TableCell className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>{format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}</TableCell>
                <TableCell className="font-semibold cursor-pointer text-center" onClick={() => setIsOpen(!isOpen)}>${order.total.toLocaleString('es-AR')}</TableCell>
                <TableCell>
                    <Select
                        value={order.status}
                        onValueChange={handleStatusSelect}
                    >
                        <SelectTrigger className={cn("h-8 text-xs font-semibold", getStatusClasses(order.status))}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {orderStatuses.map(status => (
                                <SelectItem key={status} value={status} className="text-xs">
                                    {statusLabels[status]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </TableCell>
                <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className="transition-transform data-[state=open]:rotate-90">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </TableCell>
            </TableRow>
            {isOpen && (
                 <TableRow>
                    <TableCell colSpan={6} className="p-0">
                        <div className="bg-muted/50 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-4">
                                    <h4 className="font-semibold text-lg">Productos Comprados</h4>
                                    {order.items.map(item => (
                                        <div key={item.product.id} className="flex items-center gap-4">
                                            <Image src={item.product.images[0]} alt={item.product.name} width={50} height={50} className="rounded-md border object-cover" data-ai-hint={item.product.aiHint}/>
                                            <div className="flex-1">
                                                <p className="font-semibold">{item.product.name}</p>
                                                <p className="text-sm text-muted-foreground">Cantidad: {item.quantity} | Precio Unit.: ${item.product.price.toLocaleString('es-AR')}</p>
                                            </div>
                                            <p className="font-semibold">${(item.product.price * item.quantity).toLocaleString('es-AR')}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-lg">Información del Cliente</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> <span>{order.customerName}</span></div>
                                        <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> <a href={`mailto:${order.customerEmail}`} className="text-primary hover:underline">{order.customerEmail}</a></div>
                                    </div>
                                    <h4 className="font-semibold text-lg">Envío</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-start gap-2"><HomeIcon className="h-4 w-4 text-muted-foreground mt-1"/><span>{order.shippingAddress}, {order.shippingCity}, {order.shippingPostalCode}</span></div>
                                    </div>
                                    <h4 className="font-semibold text-lg">Pago</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-muted-foreground" /><span>ID de Pago: <span className="font-mono">{order.paymentId || 'N/A'}</span></span></div>
                                        {order.couponCode && <div className="flex items-center gap-2"><Ticket className="h-4 w-4 text-muted-foreground" /><span>Cupón: <span className="font-semibold">{order.couponCode}</span> (-${order.discountAmount?.toLocaleString('es-AR')})</span></div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </React.Fragment>
    )
}

type SortableKeys = 'id' | 'customerName' | 'createdAt' | 'total';

export function OrdersTab({ orders, isLoading, onExport, onStatusChange }: { orders: Order[], isLoading: boolean, onExport: () => void, onStatusChange: (orderId: number, newStatus: OrderStatus) => void }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys, direction: 'asc' | 'desc' } | null>(null);
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

    const filteredOrders = useMemo(() => {
        if (statusFilter === 'all') {
            return orders;
        }
        return orders.filter(order => order.status === statusFilter);
    }, [orders, statusFilter]);

    const sortedOrders = useMemo(() => {
        let sortableItems = [...filteredOrders];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const key = sortConfig.key;
                const rawA = a[key];
                const rawB = b[key];

                let comparableA: string | number | Date;
                let comparableB: string | number | Date;

                if (key === 'createdAt') {
                    comparableA = new Date(rawA as string);
                    comparableB = new Date(rawB as string);
                } else if (key === 'id' || key === 'total') {
                    comparableA = (rawA as number) ?? 0;
                    comparableB = (rawB as number) ?? 0;
                } else { // customerName
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
    }, [filteredOrders, sortConfig]);

    const totalPages = Math.ceil(sortedOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = sortedOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

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
        return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    const renderHeaderButton = (key: SortableKeys, label: string, className: string = "") => (
        <Button variant="ghost" onClick={() => requestSort(key)} className={cn("px-2", className)}>
            {label}
            {getSortIcon(key)}
        </Button>
    );

    return (
        <Card className="shadow-lg">
             <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Historial de Órdenes</CardTitle>
                        <CardDescription>Visualiza y gestiona todas las órdenes de tus clientes.</CardDescription>
                    </div>
                    <Button onClick={onExport} variant="outline" disabled={isLoading}><Download className="mr-2 h-4 w-4" />Exportar a CSV</Button>
                </div>
                {totalPages > 1 && (
                     <div className="flex justify-end pt-4 border-t mt-4">
                        <Pagination 
                            currentPage={currentPage} 
                            totalPages={totalPages}
                            onPageChange={handlePageChange} 
                        />
                    </div>
                )}
            </CardHeader>
            <CardContent className='p-0'>
                {isLoading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                    <>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{renderHeaderButton('id', 'ID')}</TableHead>
                                        <TableHead>{renderHeaderButton('customerName', 'Cliente')}</TableHead>
                                        <TableHead>{renderHeaderButton('createdAt', 'Fecha')}</TableHead>
                                        <TableHead className="text-center">{renderHeaderButton('total', 'Total', 'w-full flex justify-center items-center')}</TableHead>
                                        <TableHead className="w-[180px]">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="px-2 w-full justify-start">
                                                        Estado
                                                        <ListFilter className="ml-auto h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    <DropdownMenuRadioGroup
                                                        value={statusFilter}
                                                        onValueChange={(value) => {
                                                            setStatusFilter(value as OrderStatus | 'all');
                                                            setCurrentPage(1);
                                                        }}
                                                    >
                                                        <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                                                        {orderStatuses.map(status => (
                                                            <DropdownMenuRadioItem key={status} value={status}>
                                                                {statusLabels[status]}
                                                            </DropdownMenuRadioItem>
                                                        ))}
                                                    </DropdownMenuRadioGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedOrders.map(order => (
                                        <OrderRow key={order.id} order={order} onStatusChange={onStatusChange} />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {totalPages > 1 && (
                            <div className="px-4 border-t">
                                <Pagination 
                                    currentPage={currentPage} 
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange} 
                                />
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
