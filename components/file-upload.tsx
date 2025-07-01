'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Upload, FileText } from 'lucide-react';

interface TranslationFile {
  name: string;
  content: Record<string, any>;
  language: string;
}

interface FileUploadProps {
  onFileUpload: (file: TranslationFile) => void;
  accept?: string;
  label?: string;
  description?: string;
  className?: string;
}

export function FileUpload({ 
  onFileUpload, 
  accept = '.json', 
  label = 'Drop files here',
  description = 'Upload JSON translation files',
  className 
}: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractLanguageFromFilename = (filename: string) => {
    const match = filename.match(/([a-z]{2}(-[A-Z]{2})?)\.(json)$/i);
    return match ? match[1].toLowerCase() : filename.replace('.json', '');
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsLoading(true);
    setError(null);

    for (const file of acceptedFiles) {
      try {
        const text = await file.text();
        const content = JSON.parse(text);
        const language = extractLanguageFromFilename(file.name);

        onFileUpload({
          name: file.name,
          content,
          language
        });
      } catch (err) {
        setError(`Error processing ${file.name}: Invalid JSON format`);
      }
    }

    setIsLoading(false);
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    multiple: true
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
          'border-gray-700 hover:border-gray-600 bg-gray-900/30',
          isDragActive && 'border-cyan-500 bg-cyan-500/10',
          isLoading && 'pointer-events-none opacity-50',
          className
        )}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            {isLoading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            ) : (
              <div className={cn(
                'p-3 rounded-full',
                isDragActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-400'
              )}>
                {isDragActive ? <Upload className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
            )}
          </div>
          
          <div>
            <p className={cn(
              'text-lg font-medium',
              isDragActive ? 'text-cyan-300' : 'text-gray-300'
            )}>
              {isLoading ? 'Processing files...' : label}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {description}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}