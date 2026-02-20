import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFile: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  label?: string;
  hint?: string;
  preview?: string | null;
}

export function FileUpload({
  onFile,
  accept = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
  maxSize = 10 * 1024 * 1024,
  label = 'Upload a file',
  hint = 'JPEG or PNG, max 10MB',
  preview,
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFile(acceptedFiles[0]);
      }
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400'
        }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <img src={preview} alt="Preview" className="mx-auto h-32 w-32 object-cover rounded-lg" />
        ) : (
          <>
            <Upload className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive ? 'Drop file here' : 'Click or drag to upload'}
            </p>
          </>
        )}
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      </div>
    </div>
  );
}
