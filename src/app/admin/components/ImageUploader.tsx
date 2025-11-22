/* eslint-disable @next/next/no-img-element */
'use client';

import * as React from 'react';
import { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlusIcon, XIcon, ImageOff } from 'lucide-react';

interface SortableImageProps {
  url: string;
  isMain: boolean;
  onRemove: (url: string) => void;
}

function SortableImage({ url, isMain, onRemove }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group aspect-square">
      <img
        src={url}
        alt="Product image"
        className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // Prevent dnd listeners from firing
          onRemove(url);
        }}
        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <XIcon className="w-4 h-4" />
      </button>
      {isMain && (
        <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
          Principal
        </div>
      )}
    </div>
  );
}

interface ImageUploaderProps {
  imageUrls: string[];
  onImageUrlsChange: (urls: string[]) => void;
  onImageRemove: (url: string) => void;
  maxImages?: number;
}

export function ImageUploader({ 
  imageUrls,
  onImageUrlsChange,
  onImageRemove,
  maxImages = 4,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageCount = imageUrls.length;
  const canUploadMore = imageCount < maxImages;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require a 5px drag to start sorting
      },
    })
  );

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !canUploadMore) return;

    setUploading(true);
    const newUrls = [...imageUrls];
    const filesToUpload = Array.from(files).slice(0, maxImages - imageCount);

    for (const file of filesToUpload) {
      try {
        const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: 'POST',
          body: file,
        });

        if (!response.ok) throw new Error('Upload failed');
        const newBlob = await response.json();
        newUrls.push(newBlob.url);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    onImageUrlsChange(newUrls);
    setUploading(false);
    
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const onDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
        const oldIndex = imageUrls.indexOf(active.id as string);
        const newIndex = imageUrls.indexOf(over.id as string);
        onImageUrlsChange(arrayMove(imageUrls, oldIndex, newIndex));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={imageUrls} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {imageUrls.map((url, index) => (
            <SortableImage 
              key={url} 
              url={url} 
              isMain={index === 0} 
              onRemove={onImageRemove} 
            />
          ))}
          
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading || !canUploadMore}
            ref={fileInputRef}
            className="hidden"
          />

          {canUploadMore && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors duration-200"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              ) : (
                <PlusIcon className="h-12 w-12 text-gray-400" />
              )}
            </button>
          )}

          {!canUploadMore && (
             <div className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-200 bg-gray-50 rounded-lg text-center p-2">
                <ImageOff className="h-10 w-10 text-gray-400" />
                <p className="text-xs text-gray-500 mt-2">Límite de 4 imágenes alcanzado.</p>
            </div>
          )}

        </div>
      </SortableContext>
    </DndContext>
  );
}
