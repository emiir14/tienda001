'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { Product, Coupon, Category } from '@/lib/types';
import { ImageUploader } from './ImageUploader';

type FieldErrors = Record<string, string[] | undefined>;

const handleDecimalKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
  if (['e', 'E', '+', '-'].includes(event.key)) {
    event.preventDefault();
  }
};

const handleIntegerKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
  if (['e', 'E', '+', '-', '.'].includes(event.key)) {
    event.preventDefault();
  }
};

const FormError = ({ message }: { message?: string }) => {
    if (!message) return null;
    return <p className="text-sm font-medium text-destructive mt-1">{message}</p>;
};

export function ProductForm({
    product,
    formId,
    errors,
    categories,
    imageUrls,
    onImageUrlsChange,
    onImageRemove,
}: {
    product?: Product,
    formId: string,
    errors: FieldErrors,
    categories: Category[],
    imageUrls: string[],
    onImageUrlsChange: (urls: string[]) => void;
    onImageRemove: (url: string) => void;
}) {
    const [startDate, setStartDate] = useState<Date | undefined>(product?.offerStartDate ? new Date(product.offerStartDate) : undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(product?.offerEndDate ? new Date(product.offerEndDate) : undefined);
    const [isStartDatePickerOpen, setStartDatePickerOpen] = useState(false);
    const [isEndDatePickerOpen, setEndDatePickerOpen] = useState(false);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(product?.categoryIds ?? []);

    const handleCategoryChange = (categoryId: number, isChecked: boolean) => {
        setSelectedCategoryIds(prevIds => {
            if (isChecked) {
                return [...new Set([...prevIds, categoryId])];
            } else {
                return prevIds.filter(id => id !== categoryId);
            }
        });
    };

    const groupedCategories = useMemo(() => {
        const parentCategories = categories.filter(c => !c.parentId);
        const childCategories = categories.filter(c => c.parentId);

        return parentCategories.map(parent => ({
            ...parent,
            children: childCategories.filter(child => child.parentId === parent.id)
        }));
    }, [categories]);

    const defaultOpenAccordionItems = useMemo(() => {
        if (!product?.categoryIds) return [];

        const selectedCategoryIdsSet = new Set(product.categoryIds);
        const openItems = new Set<string>();

        groupedCategories.forEach(parent => {
            if (selectedCategoryIdsSet.has(parent.id)) {
                openItems.add(String(parent.id));
            }
            parent.children.forEach(child => {
                if (selectedCategoryIdsSet.has(child.id)) {
                    openItems.add(String(parent.id));
                }
            });
        });

        return Array.from(openItems);
    }, [product?.categoryIds, groupedCategories]);

    const HiddenInputs = () => (
        <>
            <input type="hidden" name="offerStartDate" value={startDate?.toISOString() ?? ''} />
            <input type="hidden" name="offerEndDate" value={endDate?.toISOString() ?? ''} />
            {selectedCategoryIds.map(id => (
                <input key={`cat_hidden_${id}`} type="hidden" name="categoryIds" value={String(id)} />
            ))}
            <input type="hidden" name="images" value={JSON.stringify(imageUrls)} />
        </>
    );

    return (
        <form id={formId} className="space-y-4">
             <HiddenInputs />
            <div><Label htmlFor="name">Nombre *</Label><Input id="name" name="name" defaultValue={product?.name} className={cn("border-2", errors.name && "border-destructive")} /><FormError message={errors.name?.[0]} /></div>
            <div><Label htmlFor="shortDescription">Descripción Corta</Label><Input id="shortDescription" name="shortDescription" defaultValue={product?.shortDescription} placeholder="Un resumen breve para la tarjeta de producto." className={cn("border-2", errors.shortDescription && "border-destructive")}/><FormError message={errors.shortDescription?.[0]} /></div>
            <div><Label htmlFor="description">Descripción Completa *</Label><Textarea id="description" name="description" defaultValue={product?.description} className={cn("border-2", errors.description && "border-destructive")} /><FormError message={errors.description?.[0]} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="price">Precio *</Label><Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={product?.price} onKeyDown={handleDecimalKeyDown} className={cn("border-2", errors.price && "border-destructive")} /><FormError message={errors.price?.[0]} /></div>
                <div><Label htmlFor="discountPercentage">Descuento (%)</Label><Input id="discountPercentage" name="discountPercentage" type="number" step="1" min="0" max="100" defaultValue={product?.discountPercentage ?? ''} onKeyDown={handleIntegerKeyDown} placeholder="Ej: 15" className={cn("border-2", errors.discountPercentage && "border-destructive")} /><FormError message={errors.discountPercentage?.[0]} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Inicio de Oferta</Label>
                     <Popover open={isStartDatePickerOpen} onOpenChange={setStartDatePickerOpen}>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("border-2 w-full justify-start text-left font-normal", !startDate && "text-muted-foreground", errors.offerStartDate && "border-destructive")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={(date) => {
                                    setStartDate(date);
                                    setStartDatePickerOpen(false);
                                }}
                                initialFocus
                                fromDate={new Date()}
                            />
                        </PopoverContent>
                    </Popover>
                    <FormError message={errors.offerStartDate?.[0]} />
                </div>
                <div>
                    <Label>Fin de Oferta</Label>
                     <Popover open={isEndDatePickerOpen} onOpenChange={setEndDatePickerOpen}>
                        <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("border-2 w-full justify-start text-left font-normal", !endDate && "text-muted-foreground", errors.offerEndDate && "border-destructive")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />{endDate ? format(endDate, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={(date) => {
                                    setEndDate(date);
                                    setEndDatePickerOpen(false);
                                }}
                                initialFocus
                                fromDate={startDate || new Date()}
                            />
                        </PopoverContent>
                    </Popover>
                    <FormError message={errors.offerEndDate?.[0]} />
                </div>
            </div>
            <div>
                <Label>Categorías *</Label>
                <ScrollArea className="h-48 w-full rounded-md border-2">
                    <Accordion type="multiple" className="w-full" defaultValue={defaultOpenAccordionItems}>
                        {groupedCategories.map(parent => (
                            <AccordionItem value={String(parent.id)} key={parent.id}>
                                <AccordionTrigger className="px-4 font-semibold">{parent.name}</AccordionTrigger>
                                <AccordionContent>
                                    <div className="pl-8 pr-4 space-y-3 py-2">
                                        {parent.children.length > 0
                                        ? (
                                            <>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`category-${parent.id}`}
                                                        checked={selectedCategoryIds.includes(parent.id)}
                                                        onCheckedChange={(isChecked) => handleCategoryChange(parent.id, isChecked === true)}
                                                    />
                                                    <Label htmlFor={`category-${parent.id}`} className="font-normal italic text-muted-foreground">Asignar a "{parent.name}" como principal</Label>
                                                </div>
                                                {parent.children.map(child => (
                                                    <div key={child.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`category-${child.id}`}
                                                            checked={selectedCategoryIds.includes(child.id)}
                                                            onCheckedChange={(isChecked) => handleCategoryChange(child.id, isChecked === true)}
                                                        />
                                                        <Label htmlFor={`category-${child.id}`} className="font-normal">{child.name}</Label>
                                                    </div>
                                                ))}
                                            </>
                                        )
                                        : (
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`category-${parent.id}`}
                                                    checked={selectedCategoryIds.includes(parent.id)}
                                                    onCheckedChange={(isChecked) => handleCategoryChange(parent.id, isChecked === true)}
                                                />
                                                <Label htmlFor={`category-${parent.id}`} className="font-normal">Asignar a categoría principal</Label>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </ScrollArea>
                <FormError message={errors.categoryIds?.[0]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="stock">Stock *</Label>
                    <Input id="stock" name="stock" type="number" min="0" step="1" defaultValue={product?.stock} onKeyDown={handleIntegerKeyDown} className={cn("border-2", errors.stock && "border-destructive")} />
                    <FormError message={errors.stock?.[0]} />
                </div>
                <div>
                    <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                    <Input id="sku" name="sku" defaultValue={product?.sku} placeholder="Ej: REM-NEG-S" className={cn("border-2", errors.sku && "border-destructive")} />
                    <FormError message={errors.sku?.[0]} />
                </div>
            </div>
            <div className='space-y-2'>
                <Label>Imágenes del Producto (Max: 4) *</Label>
                <ImageUploader
                    imageUrls={imageUrls}
                    onImageUrlsChange={onImageUrlsChange}
                    onImageRemove={onImageRemove}
                />
                <FormError message={errors.images?.[0]} />
            </div>
            <p className="text-sm text-muted-foreground pt-2">Los campos con * son obligatorios.</p>
        </form>
    );
}

export function CouponForm({ coupon, formId, errors }: { coupon?: Coupon, formId: string, errors: FieldErrors }) {
    const [expiryDate, setExpiryDate] = useState<Date | undefined>(coupon?.expiryDate ? new Date(coupon.expiryDate) : undefined);
    const [isExpiryDatePickerOpen, setExpiryDatePickerOpen] = useState(false);

    const HiddenDateInputs = () => (
        <input type="hidden" name="expiryDate" value={expiryDate?.toISOString() ?? ''} />
    );

    return (
        <form id={formId} className="space-y-4">
            <HiddenDateInputs />
            <div><Label htmlFor="code">Código del Cupón *</Label><Input id="code" name="code" defaultValue={coupon?.code} placeholder="VERANO20" className={cn("border-2", errors.code && "border-destructive")} /><FormError message={errors.code?.[0]} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="discountType">Tipo de Descuento *</Label>
                    <Select name="discountType" defaultValue={coupon?.discountType ?? 'percentage'}>
                        <SelectTrigger className={cn("border-2", errors.discountType && "border-destructive")}><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                            <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormError message={errors.discountType?.[0]} />
                </div>
                <div>
                    <Label htmlFor="discountValue">Valor *</Label>
                    <Input id="discountValue" name="discountValue" type="number" step="0.01" min="0" defaultValue={coupon?.discountValue} onKeyDown={handleDecimalKeyDown} placeholder="Ej: 20" className={cn("border-2", errors.discountValue && "border-destructive")} />
                     <FormError message={errors.discountValue?.[0]} />
                </div>
            </div>
            <div>
                <Label htmlFor="minPurchaseAmount">Compra Mínima (Opcional)</Label>
                <Input id="minPurchaseAmount" name="minPurchaseAmount" type="number" step="0.01" min="0" defaultValue={coupon?.minPurchaseAmount ?? ''} onKeyDown={handleDecimalKeyDown} placeholder="Ej: 5000" className={cn("border-2", errors.minPurchaseAmount && "border-destructive")} />
                <FormError message={errors.minPurchaseAmount?.[0]} />
            </div>
             <div>
                <Label>Fecha de Expiración <span className="text-xs text-muted-foreground">(Vacío = Sin Expiración)</span></Label>
                <Popover open={isExpiryDatePickerOpen} onOpenChange={setExpiryDatePickerOpen}>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("border-2 w-full justify-start text-left font-normal", !expiryDate && "text-muted-foreground", errors.expiryDate && "border-destructive")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />{expiryDate ? format(expiryDate, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={expiryDate}
                            onSelect={(date) => {
                                setExpiryDate(date);
                                setExpiryDatePickerOpen(false);
                            }}
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
            <p className="text-sm text-muted-foreground pt-2">Los campos con * son obligatorios.</p>
        </form>
    );
}
