"use client";

import React, { useState } from 'react';
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
import { Loader2, Download, ChevronRight, User, Mail, Home as HomeIcon, Wallet, Ticket } from 'lucide-react';
import { Pagination } from './Pagination';

const ITEMS_PER_PAGE = 50;

function OrderRow({ order, onStatusChange }: { order: Order; onStatusChange: (orderId: number, newStatus: OrderStatus) => void; }) {
    const [isOpen, setIsOpen] = useState(false);
    const getStatusClasses = (status: Order['status']) => {
        switch (status) {
            case 'delivered': return "bg-green-100 text-green-800 border-green-200";
            case 'pending': return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case 'failed': return "bg-red-100 text-red-800 border-red-200";
            case 'cancelled': return "bg-red-100 text-red-800 border-red-200";
            case 'paid': return "bg-blue-100 text-blue-800 border-blue-200";
            case 'shipped': return "bg-purple-100 text-purple-800 border-purple-200";
            default: return "bg-background border-input";
        }
    }

    const orderStatuses: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'failed','refunded'];
    const statusLabels: Record<OrderStatus, string> = {
        pending: 'Pendiente',
        paid: 'Abonado',
        shipped: 'Enviado',
        delivered: 'Entregado',
        cancelled: 'Cancelado',
        failed: 'Fallido',
        refunded: 'Reintegrado'
    };

    return (
        <React.Fragment>
            <TableRow className="hover:bg-muted/50" data-state={isOpen ? 'open' : 'closed'}>
                <TableCell className="font-mono text-sm cursor-pointer" onClick={() => setIsOpen(!isOpen)}>#{order.id}</TableCell>
                <TableCell className="font-medium cursor-pointer" onClick={() => setIsOpen(!isOpen)}>{order.customerName}</TableCell>
                <TableCell className="cursor-pointer" onClick={() => setIsOpen(!isOpen)}>{format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}</TableCell>
                <TableCell className="font-semibold cursor-pointer" onClick={() => setIsOpen(!isOpen)}>${order.total.toLocaleString('es-AR')}</TableCell>
                <TableCell>
                    <Select
                        defaultValue={order.status}
                        onValueChange={(newStatus: OrderStatus) => onStatusChange(order.id, newStatus)}
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

export function OrdersTab({ orders, isLoading, onExport, onStatusChange }: { orders: Order[], isLoading: boolean, onExport: () => void, onStatusChange: (orderId: number, newStatus: OrderStatus) => void }) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
    const paginatedOrders = orders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Historial de Órdenes</CardTitle><CardDescription>Visualiza y gestiona todas las órdenes de tus clientes.</CardDescription></div>
                <Button onClick={onExport} variant="outline" disabled={isLoading}><Download className="mr-2 h-4 w-4" />Exportar a CSV</Button>
            </CardHeader>
            <CardContent className='p-0'>
                {isLoading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                    <>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead className="w-[180px]">Estado</TableHead>
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
                        <div className="px-4">
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
