import { useState } from 'react';
import Image from 'next/image';

interface ImageAnalysisProps {
  result: {
    id: string;
    image: string;
    unet_mask: string;
    otsu_mask: string | null;
    dice: number;
    iou: number;
    precision: number;
    recall: number;
  };
}

export function ImageAnalysis({ result }: ImageAnalysisProps) {
  const [showMask, setShowMask] = useState<'none' | 'unet' | 'otsu'>('none');
  const [maskOpacity, setMaskOpacity] = useState(0.5);

  return (
    <div className="space-y-8">
      {/* Image and Mask Display */}
      <div className="space-y-4">
        <div className="relative h-[400px] w-full">
          {/* Original Image */}
          <Image
            src={result.image}
            alt={`Image ${result.id}`}
            fill
            className="object-contain rounded-lg"
          />
          
          {/* Mask Overlay */}
          {showMask === 'unet' && (
            <Image
              src={result.unet_mask}
              alt="U-Net Mask"
              fill
              className="object-contain rounded-lg mix-blend-multiply"
              style={{ opacity: maskOpacity }}
            />
          )}
          {showMask === 'otsu' && result.otsu_mask && (
            <Image
              src={result.otsu_mask}
              alt="Otsu Mask"
              fill
              className="object-contain rounded-lg mix-blend-multiply"
              style={{ opacity: maskOpacity }}
            />
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="space-x-2">
            <button
              onClick={() => setShowMask('none')}
              className={`px-3 py-1 rounded ${
                showMask === 'none' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setShowMask('unet')}
              className={`px-3 py-1 rounded ${
                showMask === 'unet' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              U-Net Mask
            </button>
            {result.otsu_mask && (
              <button
                onClick={() => setShowMask('otsu')}
                className={`px-3 py-1 rounded ${
                  showMask === 'otsu' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Otsu Mask
              </button>
            )}
          </div>

          {showMask !== 'none' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Opacity:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={maskOpacity}
                onChange={(e) => setMaskOpacity(Number(e.target.value))}
                className="w-32"
              />
            </div>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Dice Score</h3>
          <p className="text-2xl font-semibold text-blue-600">{(result.dice * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">IoU Score</h3>
          <p className="text-2xl font-semibold text-blue-600">{(result.iou * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Precision</h3>
          <p className="text-2xl font-semibold text-blue-600">{(result.precision * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Recall</h3>
          <p className="text-2xl font-semibold text-blue-600">{(result.recall * 100).toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
} 