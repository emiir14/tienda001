

"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useFormState, useFormStatus } from 'react-dom';
import { authenticateAdmin } from './actions';
import { getProducts, getCoupons, getSalesMetrics, getCategories, getOrders } from '@/lib/data';
import type { Product, Coupon, SalesMetrics, Category, Order, OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Edit, Trash2, LogIn, RefreshCw, LogOut, Loader2, Package, Tag, Wallet, Calendar as CalendarIcon, BarChart, AlertTriangle, ShoppingCart, Ticket, Badge as BadgeIcon, TrendingUp, DollarSign, CheckCircle, XCircle, Download, ExternalLink, Mail, Database, HardDrive, Folder, ChevronDown, ChevronRight, User, Truck, Home as HomeIcon, Upload, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { addProductAction, updateProductAction, deleteProductAction, addCouponAction, updateCouponAction, deleteCouponAction, addCategoryAction, deleteCategoryAction, updateOrderStatusAction, importProductsAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart as RechartsBarChart, Bar as RechartsBar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


type FieldErrors = Record<string, string[] | undefined>;

const FormError = ({ message }: { message?: string }) => {
    if (!message) return null;
    return <p className="text-sm font-medium text-destructive mt-1">{message}</p>;
};

// ############################################################################
// Helper: CSV Export
// ############################################################################
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

// ############################################################################
// Component: ProductForm
// ############################################################################
function ProductForm({ product, formId, errors, categories }: { product?: Product, formId: string, errors: FieldErrors, categories: Category[] }) {
    const [startDate, setStartDate] = useState<Date | undefined>(product?.offerStartDate ? new Date(product.offerStartDate) : undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(product?.offerEndDate ? new Date(product.offerEndDate) : undefined);

    // This is a hidden component to pass date values to the form handler
    const HiddenDateInputs = () => (
        <>
            <input type="hidden" name="offerStartDate" value={startDate?.toISOString() ?? ''} />
            <input type="hidden" name="offerEndDate" value={endDate?.toISOString() ?? ''} />
        </>
    );

    return (
        <form id={formId} className="space-y-4">
             <HiddenDateInputs />
            <div><Label htmlFor="name">Nombre</Label><Input id="name" name="name" defaultValue={product?.name} className={cn(errors.name && "border-destructive")} /><FormError message={errors.name?.[0]} /></div>
            <div><Label htmlFor="shortDescription">Descripción Corta</Label><Input id="shortDescription" name="shortDescription" defaultValue={product?.shortDescription} placeholder="Un resumen breve para la tarjeta de producto." className={cn(errors.shortDescription && "border-destructive")}/><FormError message={errors.shortDescription?.[0]} /></div>
            <div><Label htmlFor="description">Descripción Completa</Label><Textarea id="description" name="description" defaultValue={product?.description} className={cn(errors.description && "border-destructive")} /><FormError message={errors.description?.[0]} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="price">Precio</Label><Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={product?.price} className={cn(errors.price && "border-destructive")}/><FormError message={errors.price?.[0]} /></div>
                <div><Label htmlFor="discountPercentage">Descuento (%)</Label><Input id="discountPercentage" name="discountPercentage" type="number" step="1" min="0" max="100" defaultValue={product?.discountPercentage ?? ''} placeholder="Ej: 15" className={cn(errors.discountPercentage && "border-destructive")} /><FormError message={errors.discountPercentage?.[0]} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Inicio de Oferta</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground", errors.offerStartDate && "border-destructive")}>\n                                    <CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "PPP", { locale: es }) : <span>Elegir fecha</span>}\n                                </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus fromDate={new Date()} /></PopoverContent>
                    </Popover>
                    <FormError message={errors.offerStartDate?.[0]} />
                </div>
                <div>
                    <Label>Fin de Oferta</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                             <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground", errors.offerEndDate && "border-destructive")}>\n                                    <CalendarIcon className="mr-2 h-4 w-4" />{endDate ? format(endDate, "PPP", { locale: es }) : <span>Elegir fecha</span>}\n                                </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus fromDate={startDate || new Date()} /></PopoverContent>
                    </Popover>
                    <FormError message={errors.offerEndDate?.[0]} />
                </div>
            </div>
            <div>
                <Label>Categorías</Label>
                <ScrollArea className="h-32 w-full rounded-md border p-2">
                    <div className="space-y-2">
                        {categories.map(category => (
                            <div key={category.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`category-${category.id}`}
                                    name="categoryIds"
                                    value={category.id}
                                    defaultChecked={(product?.categoryIds ?? []).includes(category.id)}
                                />
                                <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <FormError message={errors.categoryIds?.[0]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="stock">Stock</Label><Input id="stock" name="stock" type="number" min="0" step="1" defaultValue={product?.stock} className={cn(errors.stock && "border-destructive")} /><FormError message={errors.stock?.[0]} /></div>
            </div>
            <div className='space-y-2'>
                <Label>Imágenes del Producto (hasta 5)</Label>
                <Input id="image1" name="image1" type="url" defaultValue={product?.images?.[0]} placeholder="URL de la Imagen Principal (requerido)" className={cn(errors.images && "border-destructive")} />
                <Input id="image2" name="image2" type="url" defaultValue={product?.images?.[1]} placeholder="URL de la Imagen 2 (opcional)" />
                <Input id="image3" name="image3" type="url" defaultValue={product?.images?.[2]} placeholder="URL de la Imagen 3 (opcional)" />
                <Input id="image4" name="image4" type="url" defaultValue={product?.images?.[3]} placeholder="URL de la Imagen 4 (opcional)" />
                <Input id="image5" name="image5" type="url" defaultValue={product?.images?.[4]} placeholder="URL de la Imagen 5 (opcional)" />
                <FormError message={errors.images?.[0]} />
            </div>
            <div><Label htmlFor="aiHint">AI Hint</Label><Input id="aiHint" name="aiHint" defaultValue={product?.aiHint} /></div>
        </form>
    );
}


// ############################################################################
// Component: CouponForm
// ############################################################################
function CouponForm({ coupon, formId, errors }: { coupon?: Coupon, formId: string, errors: FieldErrors }) {
    const [expiryDate, setExpiryDate] = useState<Date | undefined>(coupon?.expiryDate ? new Date(coupon.expiryDate) : undefined);
    
    const HiddenDateInputs = () => (
        <input type="hidden" name="expiryDate" value={expiryDate?.toISOString() ?? ''} />
    );

    return (
        <form id={formId} className="space-y-4">
            <HiddenDateInputs />
            <div><Label htmlFor="code">Código del Cupón</Label><Input id="code" name="code" defaultValue={coupon?.code} placeholder="VERANO20" className={cn(errors.code && "border-destructive")} /><FormError message={errors.code?.[0]} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="discountType">Tipo de Descuento</Label>
                    <Select name="discountType" defaultValue={coupon?.discountType ?? 'percentage'}>
                        <SelectTrigger className={cn(errors.discountType && "border-destructive")}><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                            <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormError message={errors.discountType?.[0]} />
                </div>
                <div>
                    <Label htmlFor="discountValue">Valor</Label>
                    <Input id="discountValue" name="discountValue" type="number" step="0.01" min="0" defaultValue={coupon?.discountValue} placeholder="Ej: 20" className={cn(errors.discountValue && "border-destructive")} />
                     <FormError message={errors.discountValue?.[0]} />
                </div>
            </div>
             <div>
                <Label>Fecha de Expiración (Opcional)</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !expiryDate && "text-muted-foreground", errors.expiryDate && "border-destructive")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />{expiryDate ? format(expiryDate, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar 
                            mode="single" 
                            selected={expiryDate} 
                            onSelect={setExpiryDate} 
                            initialFocus 
                            fromDate={new Date()}
                        />
                    </PopoverContent>
                </Popover>
                 <FormError message={errors.expiryDate?.[0]} />
            </div>
            <div className="flex items-center space-x-2">
                <Switch id="isActive" name="isActive" defaultChecked={coupon?.isActive ?? true} />
                <Label htmlFor="isActive">Cupón Activo</Label>
            </div>
        </form>
    );
}

// ############################################################################
// Component: MetricsTab
// ############################################################################
function MetricsTab({ products, salesMetrics, isLoading, categories }: { products: Product[], salesMetrics: SalesMetrics | null, isLoading: boolean, categories: Category[] }) {
    const totalProducts = products.length;
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 3);

    const categoryData = useMemo(() => {
      const parentCategories = categories.filter(c => !c.parentId);
      const categoryMap = new Map(categories.map(c => [c.id, c.name]));
      
      const data = parentCategories.map(parentCat => {
        const childCategoryIds = categories.filter(c => c.parentId === parentCat.id).map(c => c.id);
        const allCategoryIds = [parentCat.id, ...childCategoryIds];
        
        const productCount = products.filter(p => p.categoryIds.some(catId => allCategoryIds.includes(catId))).length;

        return {
          category: parentCat.name,
          products: productCount
        };
      }).filter(d => d.products > 0);

      return data;
    }, [categories, products]);


    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{isLoading || !salesMetrics ? <Loader2 className="h-6 w-6 animate-spin" /> : `$${salesMetrics.totalRevenue.toLocaleString('es-AR')}`}</div><p className="text-xs text-muted-foreground">Suma de todas las ventas</p></CardContent></Card>
                <Card className="shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ventas Totales</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{isLoading || !salesMetrics ? <Loader2 className="h-6 w-6 animate-spin" /> : `+${salesMetrics.totalSales}`}</div><p className="text-xs text-muted-foreground">Cantidad de órdenes pagadas</p></CardContent></Card>
                <Card className="shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total de Productos</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : totalProducts}</div><p className="text-xs text-muted-foreground">Productos únicos en el catálogo</p></CardContent></Card>
                <Card className="shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Inventario Total</CardTitle><Wallet className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : totalStock}</div><p className="text-xs text-muted-foreground">Suma de stock de todos los productos</p></CardContent></Card>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="flex-1 shadow-md"><CardHeader><CardTitle>Productos por Categoría</CardTitle><CardDescription>Un desglose de cuántos productos tienes en cada categoría.</CardDescription></CardHeader><CardContent>
                    {isLoading ? <div className="flex justify-center items-center h-80"><Loader2 className="h-8 w-8 animate-spin" /></div> : categoryData.length > 0 ? (
                        <ChartContainer config={{ products: { label: "Productos", color: "hsl(var(--primary))" } }} className="h-80">
                            <ResponsiveContainer width="100%" height="100%"><RechartsBarChart data={categoryData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}><CartesianGrid vertical={false} /><XAxis dataKey="category" tickLine={false} axisLine={false} tickMargin={8} /><YAxis allowDecimals={false} /><Tooltip cursor={false} content={<ChartTooltipContent />} /><RechartsBar dataKey="products" radius={8} /></RechartsBarChart></ResponsiveContainer>
                        </ChartContainer>
                    ) : <div className="flex justify-center items-center h-80"><BarChart className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground ml-4">No hay datos de categoría.</p></div>}
                </CardContent></Card>
                 <Card className="shadow-md"><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="text-blue-500"/>Productos Más Vendidos</CardTitle><CardDescription>Tus productos más populares basados en unidades vendidas.</CardDescription></CardHeader><CardContent>
                    {isLoading || !salesMetrics ? <div className="flex justify-center items-center h-80"><Loader2 className="h-8 w-8 animate-spin" /></div> : salesMetrics.topSellingProducts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table><TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="text-right">Unidades Vendidas</TableHead></TableRow></TableHeader><TableBody>
                                {salesMetrics.topSellingProducts.map(p => <TableRow key={p.productId}><TableCell className="font-medium">{p.name}</TableCell><TableCell className="text-right font-bold text-primary">{p.count}</TableCell></TableRow>)}
                            </TableBody></Table>
                        </div>
                    ) : <div className="flex justify-center items-center h-80"><TrendingUp className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground ml-4">Aún no hay datos de ventas.</p></div>}
                </CardContent></Card>
            </div>
             <div className="grid gap-6">
                <Card className="shadow-md"><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="text-amber-500"/>Alertas de Stock Bajo</CardTitle><CardDescription>Productos con 3 unidades o menos en stock.</CardDescription></CardHeader><CardContent>
                    {isLoading ? <div className="flex justify-center items-center h-80"><Loader2 className="h-8 w-8 animate-spin" /></div> : lowStockProducts.length > 0 ? (
                        <div className="overflow-x-auto">   
                            <Table><TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="text-right">Stock Restante</TableHead></TableRow></TableHeader><TableBody>
                                {lowStockProducts.map(p => <TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell className="text-right font-bold text-destructive">{p.stock}</TableCell></TableRow>)}
                            </TableBody></Table>
                        </div>
                    ) : <div className="flex justify-center items-center h-80"><Package className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground ml-4">¡Todo bien! No hay productos con bajo stock.</p></div>}
                </CardContent></Card>
            </div>
        </div>
    );
}


// ############################################################################
// Component: ProductsTab
// ############################################################################
function ProductsTab({ products, isLoading, onEdit, onDelete, onAdd, onExport, onImport, categories }: { products: Product[], isLoading: boolean, onEdit: (p: Product) => void, onDelete: (id: number) => void, onAdd: () => void, onExport: () => void, onImport: () => void, categories: Category[] }) {
    return (
         <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Gestionar Productos</CardTitle><CardDescription>Añade, edita o elimina productos de tu catálogo.</CardDescription></div>
                <div className="flex gap-2">
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
                                        {/* --- ESTA ES LA LÍNEA CORREGIDA --- */}
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


// ############################################################################
// Component: CategoriesTab
// ############################################################################
function CategoriesTab({ categories, isLoading, onDelete, onAdd }: { categories: Category[], isLoading: boolean, onDelete: (id: number) => void, onAdd: (name: string) => void }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleAddCategory = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        await onAdd(formData.get('name') as string);
        formRef.current?.reset();
        setIsSubmitting(false);
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Gestionar Categorías</CardTitle>
                <CardDescription>Crea y elimina las categorías de productos.</CardDescription>
            </CardHeader>
            <CardContent>
                <form ref={formRef} onSubmit={handleAddCategory} className="flex gap-2 mb-6">
                    <Input name="name" placeholder="Nombre de la nueva categoría" required disabled={isSubmitting}/>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Añadir
                    </Button>
                </form>
                {isLoading ? <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                    <Table>
                        <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {categories.map(category => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>Esta acción no se puede deshacer. Eliminar una categoría no eliminará los productos dentro de ella.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDelete(category.id)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

// ############################################################################
// Component: CouponsTab
// ############################################################################
function CouponsTab({ coupons, isLoading, onAdd, onEdit, onDelete, onExport }: { coupons: Coupon[], isLoading: boolean, onAdd: () => void, onEdit: (c: Coupon) => void, onDelete: (id: number) => void, onExport: () => void }) {
    const isCouponActive = (coupon: Coupon) => {
        return coupon.isActive && (!coupon.expiryDate || new Date(coupon.expiryDate) > new Date());
    }

    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Gestionar Cupones</CardTitle><CardDescription>Crea y gestiona códigos de descuento.</CardDescription></div>
                <div className="flex gap-2">
                    <Button onClick={onExport} variant="outline"><Download className="mr-2 h-4 w-4" />Exportar a CSV</Button>
                    <Button onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4" />Crear Cupón</Button>
                </div>
            </CardHeader>
            <CardContent className='p-0'>
                {isLoading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                    <div className="overflow-x-auto">
                        <Table><TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Tipo</TableHead><TableHead>Valor</TableHead><TableHead>Expiración</TableHead><TableHead className="text-center">Estado</TableHead><TableHead>Acciones</TableHead></TableRow></TableHeader><TableBody>
                            {coupons.map(coupon => (
                                <TableRow key={coupon.id}>
                                    <TableCell className="font-medium text-primary">{coupon.code}</TableCell>
                                    <TableCell>{coupon.discountType === 'percentage' ? 'Porcentaje' : 'Monto Fijo'}</TableCell>
                                    <TableCell>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue.toLocaleString('es-AR')}`}</TableCell>
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

// ############################################################################
// Component: OrdersTab (Fixed)
// ############################################################################
function OrdersTab({ orders, isLoading, onExport, onStatusChange }: { orders: Order[], isLoading: boolean, onExport: () => void, onStatusChange: (orderId: number, newStatus: OrderStatus) => void }) {
    
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
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Historial de Órdenes</CardTitle><CardDescription>Visualiza y gestiona todas las órdenes de tus clientes.</CardDescription></div>
                <Button onClick={onExport} variant="outline" disabled={isLoading}><Download className="mr-2 h-4 w-4" />Exportar a CSV</Button>
            </CardHeader>
            <CardContent className='p-0'>
                {isLoading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
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
                                {orders.map(order => {
                                    const [isOpen, setIsOpen] = useState(false);
                                    
                                    return (
                                        <React.Fragment key={order.id}>
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
                                    );
                                })}
                            </TableBody>
                        </Table>
                        </div>
                )}
            </CardContent>
        </Card>
    );
}

// ############################################################################
// Component: AdminDashboard
// ############################################################################
function AdminDashboard({ onLogout, dbConnected }: { onLogout: () => void, dbConnected: boolean }) {
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
    const { toast } = useToast();
    const formId = "dialog-form";
    const mailchimpConfigured = process.env.NEXT_PUBLIC_MAILCHIMP_CONFIGURED === 'true';


    const fetchData = async () => {
        setIsLoading(true);
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

    const handleAddCategory = async (name: string) => {
        const formData = new FormData();
        formData.append('name', name);
        const result = await addCategoryAction(formData);
        if (result?.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Éxito', description: result.message });
            fetchData();
        }
    }
    
    const handleDeleteCategory = async (id: number) => {
        const result = await deleteCategoryAction(id);
        if (result?.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: 'Éxito', description: result.message });
            fetchData();
        }
    }

    const handleOrderStatusChange = async (orderId: number, newStatus: OrderStatus) => {
        const originalOrders = [...orders];
        
        // Optimistically update UI
        setOrders(prevOrders => 
            prevOrders.map(o => o.id === orderId ? {...o, status: newStatus} : o)
        );

        const result = await updateOrderStatusAction(orderId, newStatus);
        
        if (result?.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
            // Revert UI on error
            setOrders(originalOrders);
        } else {
            toast({ title: 'Éxito', description: result.message });
            // Re-fetch to ensure data consistency, even though UI is updated
            fetchData(); 
        }
    };

    const exportProductsToCSV = () => {
        const headers = ['ID', 'Name', 'Short Description', 'Price', 'Stock', 'Categories', 'Image URL 1', 'Image URL 2', 'Image URL 3', 'Image URL 4', 'Image URL 5', 'AI Hint', 'Discount Percentage', 'Offer Start Date', 'Offer End Date'];
        const rows = products.map(p => [
            p.id,
            `"${p.name.replace(/"/g, '""')}"`,
            `"${p.shortDescription?.replace(/"/g, '""') ?? ''}"`,
            p.price,
            p.stock,
            `"${p.categoryIds.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).join('; ')}"`,
            ...(p.images.map(img => `"${img}"`).concat(Array(5 - p.images.length).fill(''))),
            p.aiHint ?? '',
            p.discountPercentage ?? '',
            p.offerStartDate ? format(new Date(p.offerStartDate), 'yyyy-MM-dd') : '',
            p.offerEndDate ? format(new Date(p.offerEndDate), 'yyyy-MM-dd') : '',
        ].join(','));
        
        const csvContent = [headers.join(','), ...rows].join('\n');
        downloadCSV(csvContent, 'products.csv');
        toast({ title: 'Éxito', description: 'Datos de productos exportados a CSV.' });
    };

    const exportCouponsToCSV = () => {
        const headers = ['ID', 'Code', 'Discount Type', 'Discount Value', 'Expiry Date', 'Is Active'];
        const rows = coupons.map(c => [
            c.id,
            c.code,
            c.discountType,
            c.discountValue,
            c.expiryDate ? format(new Date(c.expiryDate), 'yyyy-MM-dd') : 'Never',
            c.isActive ? 'Yes' : 'No'
        ].join(','));

        const csvContent = [headers.join(','), ...rows].join('\n');
        downloadCSV(csvContent, 'coupons.csv');
        toast({ title: 'Éxito', description: 'Datos de cupones exportados a CSV.' });
    };

    const exportOrdersToCSV = () => {
        const headers = ['ID de Orden', 'Fecha', 'Cliente', 'Email', 'Total', 'Estado', 'Cupón', 'Descuento', 'ID de Pago', 'Dirección de Envío', 'Productos'];
        const rows = orders.map(o => {
            const productList = o.items.map(item => `${item.quantity}x ${item.product.name}`).join('; ');
            return [
                o.id,
                format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm'),
                `"${o.customerName}"`,
                o.customerEmail,
                o.total,
                o.status,
                o.couponCode || '',
                o.discountAmount || 0,
                o.paymentId || '',
                `"${o.shippingAddress}, ${o.shippingCity}, ${o.shippingPostalCode}"`,
                `"${productList}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        downloadCSV(csvContent, 'orders.csv');
        toast({ title: 'Éxito', description: 'Datos de órdenes exportados a CSV.' });
    }

    const [importFile, setImportFile] = useState<File | null>(null);
    const [importResults, setImportResults] = useState<{ createdCount: number, updatedCount: number, errors: { row: number, message: string }[] } | null>(null);
    const [showImportExamples, setShowImportExamples] = useState(false);

    const handleImportSubmit = async () => {
        if (!importFile) {
            toast({ title: 'Error', description: 'Por favor, selecciona un archivo.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        setImportResults(null);
        
        const fileType = importFile.name.endsWith('.json') ? 'json' : 'csv';

        const reader = new FileReader();
        reader.onload = async (event) => {
            const fileContent = event.target?.result as string;
            const result = await importProductsAction(fileContent, fileType);

            setImportResults(result);
            toast({ title: 'Importación Completa', description: `Creados: ${result.createdCount}, Actualizados: ${result.updatedCount}, Errores: ${result.errors.length}`});
            if (result.createdCount > 0 || result.updatedCount > 0) {
                fetchData();
            }
            setIsSubmitting(false);
        };
        reader.onerror = () => {
            toast({ title: 'Error', description: 'No se pudo leer el archivo.', variant: 'destructive' });
            setIsSubmitting(false);
        }
        reader.readAsText(importFile);
    }
    
    const jsonExample = `[
  {
    "Name": "Producto de Ejemplo JSON",
    "Price": "150.99",
    "Categories": "Perfumes; Hombre",
    "Image URL 1": "https://i.imgur.com/your-image.jpg"
  }
]`;
    const csvExample = `Name,Price,Categories,Image URL 1,Stock
"Producto de Ejemplo CSV",99.99,"Joyas; Anillos","https://i.imgur.com/your-image.jpg",10`;


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Panel de Administración</h1>
                    <div className='flex items-center gap-4 mt-2'>
                        <p className="text-muted-foreground">Métricas y gestión de productos, cupones y más.</p>
                         {dbConnected ? (
                            <Badge className='bg-green-100 text-green-800 border-green-300 hover:bg-green-100'>
                                <Database className="mr-2 h-4 w-4"/>
                                Data Source: Database
                            </Badge>
                         ) : (
                            <Badge className='bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100'>
                                <HardDrive className="mr-2 h-4 w-4"/>
                                Data Source: Local Fallback
                            </Badge>
                         )}
                         {mailchimpConfigured ? (
                            <Badge className='bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-100'>
                                <Mail className="mr-2 h-4 w-4"/>
                                Mailchimp: Connected
                            </Badge>
                         ) : (
                             <Badge variant='outline' className='border-dashed'>
                                <Mail className="mr-2 h-4 w-4 text-muted-foreground"/>
                                Mailchimp: Not Configured
                            </Badge>
                         )}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        <span className="sr-only">Actualizar Datos</span>
                    </Button>
                    <Button variant="outline" onClick={onLogout}><LogOut className="mr-2 h-4 w-4" />Cerrar Sesión</Button>
                </div>
            </div>

            <Tabs defaultValue="overview">
                <div className="w-full overflow-x-auto border-b">
                    <TabsList className="min-w-max">
                            <TabsTrigger value="overview">Visión General</TabsTrigger>
                            <TabsTrigger value="products">Productos</TabsTrigger>
                            <TabsTrigger value="categories">Categorías</TabsTrigger>
                            <TabsTrigger value="coupons">Cupones</TabsTrigger>
                            <TabsTrigger value="orders">Órdenes</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="overview" className="mt-6">
                    <MetricsTab products={products} salesMetrics={salesMetrics} isLoading={isLoading} categories={categories} />
                </TabsContent>
                <TabsContent value="products" className="mt-6">
                    <ProductsTab products={products} isLoading={isLoading} onAdd={() => handleOpenProductDialog()} onEdit={handleOpenProductDialog} onDelete={handleDeleteProduct} onExport={exportProductsToCSV} onImport={handleOpenImportDialog} categories={categories} />
                </TabsContent>
                <TabsContent value="categories" className="mt-6">
                    <CategoriesTab categories={categories} isLoading={isLoading} onAdd={handleAddCategory} onDelete={handleDeleteCategory} />
                </TabsContent>
                <TabsContent value="coupons" className="mt-6">
                    <CouponsTab coupons={coupons} isLoading={isLoading} onAdd={() => handleOpenCouponDialog()} onEdit={handleOpenCouponDialog} onDelete={handleDeleteCoupon} onExport={exportCouponsToCSV} />
                </TabsContent>
                <TabsContent value="orders" className="mt-6">
                    <OrdersTab orders={orders} isLoading={isLoading} onExport={exportOrdersToCSV} onStatusChange={handleOrderStatusChange} />
                </TabsContent>
            </Tabs>

            <Dialog open={dialogType !== null && dialogType !== 'import'} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
                <DialogContent className="sm:max-w-[625px] grid-rows-[auto_1fr_auto] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{dialogType === 'product' ? (editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto') : (editingCoupon ? 'Editar Cupón' : 'Crear Nuevo Cupón')}</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto pr-4 -mr-4">
                        {dialogType === 'product' && <ProductForm product={editingProduct} formId={formId} errors={formErrors} categories={categories} />}
                        {dialogType === 'coupon' && <CouponForm coupon={editingCoupon} formId={formId} errors={formErrors} />}
                    </div>
                     <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                        <Button type="button" onClick={handleFormSubmit} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={dialogType === 'import'} onOpenChange={(isOpen) => { if (!isOpen) { handleCloseDialog(); setImportResults(null); setImportFile(null); setShowImportExamples(false); } }}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Importar Productos desde Archivo</DialogTitle>
                        <DialogDescription>Sube un archivo CSV o JSON para añadir o actualizar productos en masa.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Formato Requerido</AlertTitle>
                            <AlertDescription>
                                Columnas requeridas: `Name`, `Price`, `Categories`, `Image URL 1`. Las columnas `Description` y `Stock` son opcionales. El stock por defecto será 1 si no se provee. Para actualizar, incluye una columna `ID`.
                            </AlertDescription>
                        </Alert>
                        <Input type="file" accept=".csv,.json" onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)} className="cursor-pointer" />
                         <Button variant="link" onClick={() => setShowImportExamples(!showImportExamples)} className="p-0 h-auto">
                            <Eye className="mr-2 h-4 w-4" />
                            {showImportExamples ? 'Ocultar Ejemplos' : 'Ver Ejemplos de Formato'}
                        </Button>
                        
                        {showImportExamples && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader><CardTitle className="text-base">Ejemplo CSV</CardTitle></CardHeader>
                                    <CardContent className="bg-muted p-4 rounded-md">
                                        <pre className="text-xs whitespace-pre-wrap"><code>{csvExample}</code></pre>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle className="text-base">Ejemplo JSON</CardTitle></CardHeader>
                                    <CardContent className="bg-muted p-4 rounded-md">
                                        <pre className="text-xs whitespace-pre-wrap"><code>{jsonExample}</code></pre>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                        
                        {importResults && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Resultados de la Importación</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p><CheckCircle className="h-4 w-4 inline mr-2 text-green-500"/>{importResults.createdCount} productos creados.</p>
                                    <p><Edit className="h-4 w-4 inline mr-2 text-blue-500"/>{importResults.updatedCount} productos actualizados.</p>
                                    {importResults.errors.length > 0 && (
                                        <>
                                            <p><XCircle className="h-4 w-4 inline mr-2 text-destructive"/>{importResults.errors.length} filas con errores.</p>
                                            <ScrollArea className="h-24 mt-2 border rounded-md p-2 bg-muted/50">
                                                <ul className="text-xs space-y-1">
                                                    {importResults.errors.map((err, i) => (
                                                        <li key={i}><strong>Fila {err.row}:</strong> {err.message}</li>
                                                    ))}
                                                </ul>
                                            </ScrollArea>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cerrar</Button></DialogClose>
                        <Button type="button" onClick={handleImportSubmit} disabled={isSubmitting || !importFile}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Importar Archivo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ############################################################################
// Component: AdminPage (Login and main export)
// ############################################################################
// Este componente gestiona el estado de envío del formulario
function LoginButton() {
    const { pending } = useFormStatus(); // Hook que sabe si el formulario se está enviando
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            Iniciar Sesión
        </Button>
    );
}

// Componente principal de la página
export default function AdminPage({ dbConnected }: { dbConnected: boolean }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Estado inicial para nuestro formulario
  const initialState = { success: false, error: null };
  // Conectamos el formulario a la Server Action 'authenticateAdmin'
  const [state, dispatch] = useFormState(authenticateAdmin, initialState);

  // Un 'effect' que se ejecuta cuando el estado del formulario cambia
  useEffect(() => {
    if (state.success) {
      setIsAuthenticated(true);
    }
  }, [state.success]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    // Opcional: podrías querer resetear el estado del formulario aquí también
  }

  if (!isAuthenticated) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-sm shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold font-headline">Admin Login</CardTitle>
                    <CardDescription>Ingresa a tu cuenta para gestionar la tienda.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* El 'action' ahora se encarga de todo */}
                    <form action={dispatch} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor='email'>Email</Label>
                            {/* Eliminamos 'value' y 'onChange' */}
                            <Input id="email" name="email" type="email" placeholder="email@ejemplo.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor='password'>Contraseña</Label>
                            {/* Eliminamos 'value' y 'onChange' */}
                            <Input id="password" name="password" type="password" required placeholder="Contraseña" />
                        </div>
                        
                        {/* Mostramos el error que viene del servidor */}
                        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
                        
                        <LoginButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <>
      <AdminDashboard onLogout={handleLogout} dbConnected={dbConnected} />
    </>
  );
}

    
