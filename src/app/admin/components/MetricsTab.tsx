"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Package, Wallet, DollarSign, ShoppingCart, TrendingUp, AlertTriangle, BarChart } from 'lucide-react';
import type { Product, SalesMetrics, Category } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart as RechartsBarChart, Bar as RechartsBar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function MetricsTab({ products, salesMetrics, isLoading, categories }: { products: Product[], salesMetrics: SalesMetrics | null, isLoading: boolean, categories: Category[] }) {
    const totalProducts = products.length;
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
    const lowStockProducts = products.filter(p => p.stock >= 0 && p.stock <= 3);

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
   
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle>Productos por Categoría</CardTitle>
                        <CardDescription>Un desglose de cuántos productos tienes en cada categoría.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="overflow-x-auto">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-80"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : categoryData.length > 0 ? (
                                <div className="min-w-[600px] h-80 pr-4">
                                    <ChartContainer config={{ products: { label: "Productos", color: "hsl(var(--primary))" } }} className="h-full w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsBarChart data={categoryData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                                <CartesianGrid vertical={false} />
                                                <XAxis dataKey="category" tickLine={false} axisLine={false} tickMargin={8} />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip cursor={false} content={<ChartTooltipContent />} />
                                                <RechartsBar dataKey="products" radius={8} />
                                            </RechartsBarChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                </div>
                            ) : (
                                <div className="flex justify-center items-center h-80">
                                    <BarChart className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-muted-foreground ml-4">No hay datos de categoría.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                 <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TrendingUp className="text-blue-500"/>Productos Más Vendidos</CardTitle>
                        <CardDescription>Tus productos más populares basados en unidades vendidas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            {isLoading || !salesMetrics ? <div className="flex justify-center items-center h-80"><Loader2 className="h-8 w-8 animate-spin" /></div> : salesMetrics.topSellingProducts.length > 0 ? (
                                <Table><TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="text-right">Unidades Vendidas</TableHead></TableRow></TableHeader><TableBody>
                                    {salesMetrics.topSellingProducts.map(p => <TableRow key={p.productId}><TableCell className="font-medium">{p.name}</TableCell><TableCell className="text-right font-bold text-primary">{p.count}</TableCell></TableRow>)}
                                </TableBody></Table>
                            ) : <div className="flex justify-center items-center h-80"><TrendingUp className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground ml-4">Aún no hay datos de ventas.</p></div>}
                        </div>
                    </CardContent>
                </Card>
            </div>

             <div className="grid gap-6">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-amber-500"/>Alertas de Stock Bajo</CardTitle>
                        <CardDescription>Productos con 3 unidades o menos en stock, incluyendo agotados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="overflow-x-auto">
                            {isLoading ? <div className="flex justify-center items-center h-80"><Loader2 className="h-8 w-8 animate-spin" /></div> : lowStockProducts.length > 0 ? (
                                <Table><TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="text-right">Stock Restante</TableHead></TableRow></TableHeader><TableBody>
                                    {lowStockProducts.map(p => <TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell className="text-right font-bold text-destructive">{p.stock}</TableCell></TableRow>)}
                                </TableBody></Table>
                            ) : <div className="flex justify-center items-center h-80"><Package className="h-8 w-8 text-muted-foreground" /><p className="text-muted-foreground ml-4">¡Todo bien! No hay productos con bajo stock.</p></div>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
