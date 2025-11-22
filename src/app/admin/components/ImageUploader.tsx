/* eslint-disable @next/next/no-img-element */
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlusIcon, XIcon } from 'lucide-react';

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
  initialImages?: string[];
}

export function ImageUploader({ initialImages = [] }: ImageUploaderProps) {
  const [imageUrls, setImageUrls] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageUrls(initialImages);
  }, [initialImages]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require a 5px drag to start sorting
      },
    })
  );

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const currentUrls = [...imageUrls];

    for (const file of Array.from(files)) {
      try {
        const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: 'POST',
          body: file,
        });

        if (!response.ok) throw new Error('Upload failed');
        const newBlob = await response.json();
        currentUrls.push(newBlob.url);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    setImageUrls(currentUrls);
    setUploading(false);
    // Reset file input to allow re-uploading the same file
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (urlToRemove: string) => {
    setImageUrls((prevUrls) => prevUrls.filter((url) => url !== urlToRemove));
  };

  const onDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setImageUrls((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={imageUrls} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {imageUrls.map((url, index) => (
              <SortableImage 
                key={url} 
                url={url} 
                isMain={index === 0} 
                onRemove={handleRemoveImage} 
              />
            ))}
            
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              ref={fileInputRef}
              className="hidden"
            />

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

          </div>
        </SortableContext>
      </DndContext>

      <input type="hidden" name="images" value={JSON.stringify(imageUrls)} />
    </div>
  );
}
