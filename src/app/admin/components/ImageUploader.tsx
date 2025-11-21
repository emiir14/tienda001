/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';

interface ImageUploaderProps {
  initialImages?: string[];
}

export function ImageUploader({ initialImages = [] }: ImageUploaderProps) {
  const [imageUrls, setImageUrls] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // This syncs the component with server-side initial data
    setImageUrls(initialImages);
  }, [initialImages]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const response = await fetch(`/api/upload?filename=${file.name}`, {
          method: 'POST',
          body: file,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const newBlob = await response.json();
        newUrls.push(newBlob.url);
      } catch (error) {
        console.error('Error uploading file:', error);
        // Optionally, add some user-facing error feedback here
      }
    }

    setImageUrls((prevUrls) => [...prevUrls, ...newUrls]);
    setUploading(false);
  };

  const handleRemoveImage = (urlToRemove: string) => {
    setImageUrls((prevUrls) => prevUrls.filter((url) => url !== urlToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {imageUrls.map((url) => (
          <div key={url} className="relative group">
            <img
              src={url}
              alt="Product image"
              className="w-full h-24 object-cover rounded-md"
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(url)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <XIcon className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div>
        <Input
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
        />
        {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
      </div>

      {/* Hidden input to pass the image URLs to the form */}
      <input type="hidden" name="images" value={JSON.stringify(imageUrls)} />
    </div>
  );
}
