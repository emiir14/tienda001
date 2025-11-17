"use client";

import { useState, useMemo, useRef } from 'react';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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
import { PlusCircle, Trash2, Loader2, Edit, CornerDownRight, Pencil } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { addCategoryAction, updateCategoryAction } from '@/app/actions';

type CategoryWithChildren = Category & { children: Category[] };

// --- EditCategoryDialog Component ---
function EditCategoryDialog({ parentCategory, onActionComplete }: { parentCategory: CategoryWithChildren, onActionComplete: () => void }) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isAddingChild, setIsAddingChild] = useState(false);
    const editFormRef = useRef<HTMLFormElement>(null);
    const addChildFormRef = useRef<HTMLFormElement>(null);

    const handleUpdateName = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsUpdating(true);
        const formData = new FormData(event.currentTarget);
        const result = await updateCategoryAction(parentCategory.id, formData);
        if (result?.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Éxito", description: "Nombre de la categoría actualizado." });
            editFormRef.current?.reset();
            onActionComplete(); 
        }
        setIsUpdating(false);
    };

    const handleAddChild = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsAddingChild(true);
        const formData = new FormData(event.currentTarget);
        formData.append('parentId', String(parentCategory.id));
        const result = await addCategoryAction(formData);
        if (result?.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Éxito", description: "Subcategoría añadida." });
            addChildFormRef.current?.reset();
            onActionComplete();
        }
        setIsAddingChild(false);
    };

    return (
        <Dialog onOpenChange={(isOpen) => !isOpen && onActionComplete()}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4"/>Editar / Añadir</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Categoría: {parentCategory.name}</DialogTitle>
                    <DialogDescription>Modifica el nombre de la categoría principal o añade nuevas subcategorías.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <form ref={editFormRef} onSubmit={handleUpdateName} className="space-y-3">
                        <label htmlFor="name" className="font-semibold text-sm">Editar nombre</label>
                        <div className="flex gap-2">
                           <Input id="name" name="name" defaultValue={parentCategory.name} required />
                           <Button type="submit" disabled={isUpdating}>
                               {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                           </Button>
                        </div>
                    </form>
                    <div className='border-b'></div>
                    <form ref={addChildFormRef} onSubmit={handleAddChild} className="space-y-3">
                        <label htmlFor="childName" className="font-semibold text-sm">Añadir subcategoría</label>
                         <div className="flex gap-2">
                            <Input id="childName" name="name" placeholder="Nombre de la nueva subcategoría" required />
                            <Button type="submit" variant="secondary" disabled={isAddingChild}>
                                {isAddingChild ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                Añadir
                            </Button>
                        </div>
                    </form>
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cerrar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


// --- Main CategoriesTab Component ---
export function CategoriesTab({ categories, isLoading, onDelete, onAdd }: { categories: Category[], isLoading: boolean, onDelete: (id: number) => void, onAdd: (formData: FormData) => Promise<any> }) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
    
    // This state is to force a re-render of the tree when an action happens
    const [_, setForceUpdate] = useState(0);

    const categoryTree = useMemo(() => {
        const tree: CategoryWithChildren[] = [];
        const map = new Map<number, CategoryWithChildren>();
        const items: CategoryWithChildren[] = categories.map(category => ({ ...category, children: [] }));
        items.forEach(category => map.set(category.id, category));
        items.forEach(category => {
            if (category.parentId) {
                map.get(category.parentId)?.children.push(category);
            } else {
                tree.push(category);
            }
        });
        return tree.sort((a,b) => a.name.localeCompare(b.name));
    }, [categories]);
    
    const handleAddParentCategory = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        const result = await onAdd(formData);
        if (result?.error) {
            toast({ variant: "destructive", title: "Error", description: result.error });
        } else {
            toast({ title: "Éxito", description: "Categoría principal creada." });
            formRef.current?.reset();
        }
        setIsSubmitting(false);
    };

    const handleActionComplete = () => {
       setForceUpdate(v => v + 1); 
       // We don't close the accordions to maintain the user's view
    };

    const handleDelete = async (id: number, name: string) => {
        await onDelete(id);
        toast({ title: "Éxito", description: `Categoría "${name}" eliminada.` });
        handleActionComplete();
    };


    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Gestionar Categorías</CardTitle>
                <CardDescription>Crea categorías principales y anida subcategorías dentro de ellas.</CardDescription>
            </CardHeader>
            <CardContent>
                <form ref={formRef} onSubmit={handleAddParentCategory} className="flex gap-2 mb-6">
                    <Input name="name" placeholder="Nombre de la nueva categoría principal" required disabled={isSubmitting}/>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Añadir
                    </Button>
                </form>

                {isLoading ? <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                    <Accordion type="multiple" className="w-full space-y-2" value={openAccordionItems} onValueChange={setOpenAccordionItems}>
                        {categoryTree.map(parent => (
                            <AccordionItem value={`item-${parent.id}`} key={parent.id} className="border rounded-md bg-background/80">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline font-medium text-base">
                                    {parent.name}
                                </AccordionTrigger>
                                <AccordionContent className="pt-0 border-t bg-background">
                                    <div className="p-4 space-y-4">
                                        <div className="pl-4 border-l-2 space-y-1">
                                            {parent.children.length > 0 ? parent.children.sort((a,b) => a.name.localeCompare(b.name)).map(child => (
                                                <div key={child.id} className="flex items-center justify-between py-1 group">
                                                    <div className="flex items-center gap-2">
                                                        <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium text-sm">{child.name}</span>
                                                    </div>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className='h-7 w-7 text-red-500 hover:text-red-500'><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Vas a eliminar la subcategoría "{child.name}".</AlertDialogDescription></AlertDialogHeader>
                                                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(child.id, child.name)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                            )) : <p className="text-sm text-muted-foreground italic py-2">No hay subcategorías.</p>}
                                        </div>
                                        <div className="flex justify-end gap-2 pt-4 border-t">
                                            <EditCategoryDialog parentCategory={parent} onActionComplete={handleActionComplete} />
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/>Eliminar Padre</Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Vas a eliminar la categoría "{parent.name}" y todas sus subcategorías. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(parent.id, parent.name)}>Eliminar Todo</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
}
