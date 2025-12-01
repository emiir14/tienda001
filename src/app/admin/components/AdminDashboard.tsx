
"use client";

import { useState, useEffect } from 'react';
import type { Product, Coupon, SalesMetrics, Category, Order, OrderStatus } from '@/lib/types';
import { getProducts } from '@/lib/data/products';
import { getCoupons, getSalesMetrics, getCategories, getOrders } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, LogOut, Loader2, Mail, Database, HardDrive } from 'lucide-react';
import { addProductAction, updateProductAction, deleteProductAction, deleteOrphanedImageAction, deleteProductImageAction } from '@/app/actions/product-actions';
import { addCouponAction, updateCouponAction, deleteCouponAction } from '@/app/actions/coupon-actions';
import { updateOrderStatusAction } from '@/app/actions/order-actions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

// Import tab components
import { MetricsTab } from './MetricsTab';
import { ProductsTab } from './ProductsTab';
import { CategoriesTab } from './CategoriesTab';
import { CouponsTab } from './CouponsTab';
import { OrdersTab } from './OrdersTab';
import { ProductForm, CouponForm } from './Forms';

type FieldErrors = Record<string, string[] | undefined>;

function downloadCSV(csvContent: string, fileName: string) {
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export function AdminDashboard({ onLogout, dbConnected }: { onLogout: () => void, dbConnected: boolean }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dialogType, setDialogType] = useState<'product' | 'coupon' | 'import' | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<FieldErrors>({});
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const { toast } = useToast();
    const formId = "dialog-form";
    const mailchimpConfigured = process.env.NEXT_PUBLIC_MAILCHIMP_CONFIGURED === 'true';

    const fetchData = async () => {
        // Set loading to true only if it's the initial load
        if (isLoading) setIsLoading(true);
        try {
            const [fetchedProducts, fetchedCoupons, fetchedMetrics, fetchedCategories, fetchedOrders] = await Promise.all([
                getProducts(),
                getCoupons(),
                getSalesMetrics(),
                getCategories(),
                getOrders(),
            ]);
            setProducts(fetchedProducts);
            setCoupons(fetchedCoupons);
            setSalesMetrics(fetchedMetrics);
            setCategories(fetchedCategories);
            setOrders(fetchedOrders);
        } catch (error) {
            toast({ title: 'Error al cargar los datos del panel', description: (error as Error).message, variant: 'destructive' });
        }
        setIsLoading(false);
    }

    useEffect(() => { 
        fetchData();
    }, []);
    
    const handleOpenProductDialog = (product?: Product) => {
        setFormErrors({});
        setEditingProduct(product);
        setImageUrls(product?.images || []);
        setDialogType('product');
    };

    const handleOpenCouponDialog = (coupon?: Coupon) => {
        setFormErrors({});
        setEditingCoupon(coupon);
        setDialogType('coupon');
    };

    const handleOpenImportDialog = () => {
        setDialogType('import');
    };

    const handleCloseDialog = () => {
        setDialogType(null);
        setEditingProduct(undefined);
        setEditingCoupon(undefined);
        setFormErrors({});
        setImageUrls([]);
    };
    
    const handleFormSubmit = async () => {
        const formElement = document.getElementById(formId) as HTMLFormElement;
        if (!formElement) return;

        setIsSubmitting(true);
        setFormErrors({});
        const formData = new FormData(formElement);
        
        let result;
        if (dialogType === 'product') {
            const action = editingProduct ? updateProductAction.bind(null, editingProduct.id) : addProductAction;
            result = await action(formData);
        } else if (dialogType === 'coupon') {
            const action = editingCoupon ? updateCouponAction.bind(null, editingCoupon.id) : addCouponAction;
            result = await action(formData);
        }

        if (!result) {
            toast({ title: 'Error', description: 'La operación falló de forma inesperada.', variant: 'destructive' });
        } else if (result.error) {
            toast({ title: 'Error al Guardar', description: result.error, variant: 'destructive' });
            if (result.fieldErrors) {
                setFormErrors(result.fieldErrors);
            }
        } else {
            toast({ title: 'Éxito', description: result.message });
            handleCloseDialog();
            fetchData();
        }

        setIsSubmitting(false);
    };

    const handleImageRemove = async (urlToRemove: string) => {
        if (imageUrls.length <= 1) {
            toast({
                title: 'Acción no permitida',
                description: 'Un producto debe tener al menos una imagen.',
                variant: 'destructive'
            });
            return;
        }

        const newImageUrls = imageUrls.filter(url => url !== urlToRemove);
        setImageUrls(newImageUrls);

        let result;
        if (editingProduct && editingProduct.images.includes(urlToRemove)) {
            result = await deleteProductImageAction(editingProduct.id, urlToRemove);
        } else {
            result = await deleteOrphanedImageAction(urlToRemove);
        }

        if (result?.error) {
            toast({ title: 'Error al Eliminar Imagen', description: result.error, variant: 'destructive' });
            setImageUrls(currentUrls => [...currentUrls, urlToRemove]); // Revert on error
        } else {
            toast({ title: 'Éxito', description: result.message });
            if (editingProduct) {
                fetchData();
            }
        }
    };

    const handleDeleteProduct = async (id: number) => {
        const result = await deleteProductAction(id);
         if (result?.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Éxito', description: result.message });
            fetchData();
        }
    }

    const handleDeleteCoupon = async (id: number) => {
        const result = await deleteCouponAction(id);
        if (result?.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Éxito', description: result.message });
            fetchData();
        }
    }

    const handleOrderStatusChange = async (orderId: number, newStatus: OrderStatus) => {
        const originalOrders = [...orders];
        setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? {...o, status: newStatus} : o));
        const result = await updateOrderStatusAction(orderId, newStatus);
        if (result?.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
            setOrders(originalOrders);
        } else {
            toast({ title: 'Éxito', description: result.message });
            fetchData(); 
        }
    };

    const exportProductsToCSV = () => {
        const headers = ['ID', 'Name', 'Short Description', 'Price', 'Stock', 'Categories', 'Image URL 1', 'Image URL 2', 'Image URL 3', 'Image URL 4', 'Image URL 5', 'AI Hint', 'Discount Percentage', 'Offer Start Date', 'Offer End Date'];
        const rows = products.map(p => [
            p.id, `"${p.name.replace(/"/g, '""')}"`, `"${p.shortDescription?.replace(/"/g, '""') ?? ''}"`, p.price, p.stock,
            `"${p.categoryIds.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).join('; ')}"`,
            ...(p.images.map(img => `"${img}"`).concat(Array(5 - p.images.length).fill(''))),
            p.aiHint ?? '', p.discountPercentage ?? '', p.offerStartDate ? format(new Date(p.offerStartDate), 'yyyy-MM-dd') : '',
            p.offerEndDate ? format(new Date(p.offerEndDate), 'yyyy-MM-dd') : '',
        ].join(','));
        const csvContent = [headers.join(','), ...rows].join('\n');
        downloadCSV(csvContent, 'products.csv');
        toast({ title: 'Éxito', description: 'Datos de productos exportados a CSV.' });
    };

    const exportCouponsToCSV = () => {
        const headers = ['ID', 'Code', 'Discount Type', 'Discount Value','Min Purchase Amount', 'Expiry Date', 'Is Active'];
        const rows = coupons.map(c => [
            c.id, c.code, c.discountType, c.discountValue, c.minPurchaseAmount ?? '',
            c.expiryDate ? format(new Date(c.expiryDate), 'yyyy-MM-dd') : 'Never', c.isActive ? 'Yes' : 'No'
        ].join(','));
        const csvContent = [headers.join(','), ...rows].join('\n');
        downloadCSV(csvContent, 'coupons.csv');
        toast({ title: 'Éxito', description: 'Datos de cupones exportados a CSV.' });
    };

    const exportOrdersToCSV = () => {
        const headers = ['ID de Orden', 'Fecha', 'Cliente', 'Email', 'Total', 'Estado', 'Cupón', 'Descuento', 'ID de Pago', 'Dirección de Envío', 'Productos'];
        const rows = orders.map(o => {
            const productList = o.items.map(item => {
                const product = products.find(p => p.id === item.productId);
                const productName = product ? product.name.replace(/"/g, '""') : 'Producto Desconocido';
                return `${item.quantity}x ${productName}`;
            }).join('; ');
            return [
                o.id, format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm'), `"${o.customerName}"`, o.customerEmail, o.total, o.status,
                o.couponCode || '', o.discountAmount || 0, o.paymentId || '', `"${o.shippingAddress}, ${o.shippingCity}, ${o.shippingPostalCode}"`,
                `"${productList}"`
            ].join(',');
        });
        const csvContent = [headers.join(','), ...rows].join('\n');
        downloadCSV(csvContent, 'orders.csv');
        toast({ title: 'Éxito', description: 'Datos de órdenes exportados. CSV.' });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className='text-center md:text-left'>
                    <h1 className="text-3xl font-bold font-headline">Panel de Administración</h1>
                    <p className="text-muted-foreground">Métricas y gestión de productos, cupones y más.</p>
                </div>
                 <div className="flex items-center gap-2 self-center md:self-auto">
                    <Button variant="outline" size="icon" onClick={() => fetchData()} disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button>
                    <Button variant="outline" onClick={onLogout}><LogOut className="mr-2 h-4 w-4" />Cerrar Sesión</Button>
                </div>
            </div>
            <div className='flex flex-wrap items-center justify-center gap-x-4 gap-y-2'>
                {dbConnected ? (
                    <Badge className='bg-green-100 text-green-800 border-green-300 hover:bg-green-100'><Database className="mr-2 h-4 w-4"/>Data Source: Database</Badge>
                ) : (
                    <Badge className='bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100'><HardDrive className="mr-2 h-4 w-4"/>Data Source: Local Fallback</Badge>
                )}
                {mailchimpConfigured ? (
                    <Badge className='bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-100'><Mail className="mr-2 h-4 w-4"/>Mailchimp: Connected</Badge>
                ) : (
                    <Badge variant='outline' className='border-dashed'><Mail className="mr-2 h-4 w-4 text-muted-foreground"/>Mailchimp: Not Configured</Badge>
                )}
            </div>

            <Tabs defaultValue="overview">
                 <div className="w-full overflow-x-auto border-b">
                    <TabsList className="md:grid md:w-full md:grid-cols-5">
                        <TabsTrigger value="overview">Visión General</TabsTrigger>
                        <TabsTrigger value="products">Productos</TabsTrigger>
                        <TabsTrigger value="categories">Categorías</TabsTrigger>
                        <TabsTrigger value="coupons">Cupones</TabsTrigger>
                        <TabsTrigger value="orders">Órdenes</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="overview" className="mt-6"><MetricsTab products={products} salesMetrics={salesMetrics} isLoading={isLoading} categories={categories} /></TabsContent>
                <TabsContent value="products" className="mt-6"><ProductsTab products={products} isLoading={isLoading} onAdd={() => handleOpenProductDialog()} onEdit={handleOpenProductDialog} onDelete={handleDeleteProduct} onExport={exportProductsToCSV} onImport={handleOpenImportDialog} categories={categories} /></TabsContent>
                <TabsContent value="categories" className="mt-6"><CategoriesTab categories={categories} isLoading={isLoading} onActionComplete={fetchData} /></TabsContent>
                <TabsContent value="coupons" className="mt-6"><CouponsTab coupons={coupons} isLoading={isLoading} onAdd={() => handleOpenCouponDialog()} onEdit={handleOpenCouponDialog} onDelete={handleDeleteCoupon} onExport={exportCouponsToCSV} /></TabsContent>
                <TabsContent value="orders" className="mt-6"><OrdersTab orders={orders} isLoading={isLoading} onExport={exportOrdersToCSV} onStatusChange={handleOrderStatusChange} /></TabsContent>
            </Tabs>

            <Dialog open={dialogType !== null && dialogType !== 'import'} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
                <DialogContent className="sm:max-w-[625px] grid-rows-[auto_1fr_auto] max-h-[90vh] flex flex-col">
                    <DialogHeader><DialogTitle>{dialogType === 'product' ? (editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto') : (editingCoupon ? 'Editar Cupón' : 'Crear Nuevo Cupón')}</DialogTitle></DialogHeader>
                    <div className="overflow-y-auto pr-4 -mr-4">
                        {dialogType === 'product' && <ProductForm product={editingProduct} formId={formId} errors={formErrors} categories={categories} imageUrls={imageUrls} onImageUrlsChange={setImageUrls} onImageRemove={handleImageRemove} />}
                        {dialogType === 'coupon' && <CouponForm coupon={editingCoupon} formId={formId} errors={formErrors} />}
                    </div>
                     <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                        <Button type="button" onClick={handleFormSubmit} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={dialogType === 'import'} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Importar Productos desde CSV</DialogTitle></DialogHeader>
                    <p>Funcionalidad no implementada todavía.</p>
                    <DialogFooter><DialogClose asChild><Button>Cerrar</Button></DialogClose></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
