"use client";

import { useState, useRef } from 'react';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';

export function CategoriesTab({ categories, isLoading, onDelete, onAdd }: { categories: Category[], isLoading: boolean, onDelete: (id: number) => void, onAdd: (name: string) => Promise<void> }) {
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
