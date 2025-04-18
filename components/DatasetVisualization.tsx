import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Diagnosis {
  type: 'polyp' | 'cancer' | 'normal';
  confidence: number;
  confidenceLowReason?: string[];
  size?: number;
  location?: {
    segment: string;
    distanceFromAnus: number;
    landmarks: string[];
  };
  characteristics?: string[];
}

interface ImageData {
  id: string;
  image: string;
  mask: string;
  set: 'training' | 'validation' | 'test';
  metrics: {
    dice: number;
    iou: number;
    precision: number;
    recall: number;
  };
  diagnosis: Diagnosis;
}

const DatasetVisualization = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [viewMode, setViewMode] = useState<'original' | 'mask' | 'overlay'>('original');
  const [images, setImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [selectedSet, setSelectedSet] = useState<'all' | 'training' | 'validation' | 'test'>('all');

  const ITEMS_PER_PAGE = 9;

  const datasetStats = {
    training: { count: 700, percentage: 70 },
    validation: { count: 150, percentage: 15 },
    test: { count: 150, percentage: 15 }
  };

  useEffect(() => {
    const loadImages = async () => {
      try {
        const response = await fetch('/api/dataset');
        const data = await response.json();
        setImages(data);
        setFilteredImages(data);
      } catch (error) {
        console.error('Failed to load images:', error);
      }
    };
    loadImages();
  }, []);

  useEffect(() => {
    let filtered = images;
    
    if (selectedSet !== 'all') {
      filtered = filtered.filter(img => img.set === selectedSet);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(img => 
        img.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredImages(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedSet, images]);

  const totalPages = Math.ceil(filteredImages.length / ITEMS_PER_PAGE);
  const currentImages = filteredImages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatMetric = (value: number) => (value * 100).toFixed(2) + '%';

  const getDiagnosisColor = (type: Diagnosis['type']) => {
    switch (type) {
      case 'cancer':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'polyp':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Dataset Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Object.entries(datasetStats).map(([set, data]) => (
          <motion.div
            key={set}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-lg cursor-pointer"
            onClick={() => setSelectedSet(set as 'training' | 'validation' | 'test')}
          >
            <h3 className="text-lg font-semibold capitalize mb-2">{set} Set</h3>
            <div className="space-y-2">
              <p className="text-gray-600">
                Samples: <span className="font-bold text-gray-800">{data.count}</span>
              </p>
              <p className="text-gray-600">
                Percentage: <span className="font-bold text-gray-800">{data.percentage}%</span>
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${data.percentage}%` }}
                ></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow">
        <input
          type="text"
          placeholder="Search by image ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedSet}
          onChange={(e) => setSelectedSet(e.target.value as any)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Sets</option>
          <option value="training">Training</option>
          <option value="validation">Validation</option>
          <option value="test">Test</option>
        </select>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {currentImages.map((img) => (
          <motion.div
            key={img.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer"
            onClick={() => setSelectedImage(img)}
          >
            <div className="relative h-48 w-full">
              <Image
                src={img.image}
                alt={`Dataset image ${img.id}`}
                fill
                style={{ objectFit: 'cover' }}
                className="transition-transform hover:scale-105"
              />
              <div className={`absolute top-2 right-2 px-3 py-1 rounded-full ${getDiagnosisColor(img.diagnosis.type)}`}>
                {img.diagnosis.type}
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-800">ID: {img.id}</p>
                  <p className="text-sm text-gray-600 capitalize">Set: {img.set}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600">
                    Confidence: {(img.diagnosis.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-600">Dice</p>
                  <p className="font-semibold">{formatMetric(img.metrics.dice)}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-gray-600">IoU</p>
                  <p className="font-semibold">{formatMetric(img.metrics.iou)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300"
        >
          Previous
        </button>
        <span className="text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300"
        >
          Next
        </button>
      </div>

      {/* Image Comparison Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold">Image Details: {selectedImage.id}</h3>
                  <span className={`px-4 py-1 rounded-full text-sm font-medium ${getDiagnosisColor(selectedImage.diagnosis.type)}`}>
                    {selectedImage.diagnosis.type}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Diagnosis Information */}
              <div className="mb-6 bg-gray-50 rounded-xl p-4">
                <h4 className="text-lg font-semibold mb-3">Diagnosis Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Confidence</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {(selectedImage.diagnosis.confidence * 100).toFixed(1)}%
                    </p>
                    {selectedImage.diagnosis.confidenceLowReason && (
                      <div className="mt-2">
                        <p className="text-sm text-red-600">Low confidence reasons:</p>
                        <ul className="list-disc list-inside text-sm text-red-600">
                          {selectedImage.diagnosis.confidenceLowReason.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {selectedImage.diagnosis.size && (
                    <div>
                      <p className="text-sm text-gray-600">Size</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {selectedImage.diagnosis.size}mm
                      </p>
                    </div>
                  )}
                  {selectedImage.diagnosis.location && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Location Details</p>
                      <div className="mt-2 space-y-2">
                        <p className="font-semibold text-gray-800">
                          {selectedImage.diagnosis.location.segment} 
                          <span className="text-gray-600 ml-2">
                            ({selectedImage.diagnosis.location.distanceFromAnus}cm from anus)
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedImage.diagnosis.location.landmarks.map((landmark, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                            >
                              {landmark}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedImage.diagnosis.characteristics && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Characteristics</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedImage.diagnosis.characteristics.map((char, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                          >
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* View Mode Controls */}
              <div className="flex justify-center gap-4 mb-6">
                <button
                  onClick={() => setViewMode('original')}
                  className={`px-4 py-2 rounded-lg ${viewMode === 'original' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Original
                </button>
                <button
                  onClick={() => setViewMode('mask')}
                  className={`px-4 py-2 rounded-lg ${viewMode === 'mask' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Mask
                </button>
                <button
                  onClick={() => setViewMode('overlay')}
                  className={`px-4 py-2 rounded-lg ${viewMode === 'overlay' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Overlay
                </button>
              </div>

              {/* Image Display */}
              <div className="relative h-[60vh] w-full border rounded-xl overflow-hidden bg-gray-50">
                <Image
                  src={selectedImage.image}
                  alt={`Original image ${selectedImage.id}`}
                  fill
                  style={{ objectFit: 'contain' }}
                  className={viewMode === 'mask' ? 'hidden' : ''}
                />
                <Image
                  src={selectedImage.mask}
                  alt={`Mask image ${selectedImage.id}`}
                  fill
                  style={{ 
                    objectFit: 'contain',
                    opacity: viewMode === 'overlay' ? 0.5 : 1
                  }}
                  className={viewMode === 'original' ? 'hidden' : ''}
                />
              </div>

              {/* Metrics Display */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Dice Score', value: selectedImage.metrics.dice },
                  { label: 'IoU Score', value: selectedImage.metrics.iou },
                  { label: 'Precision', value: selectedImage.metrics.precision },
                  { label: 'Recall', value: selectedImage.metrics.recall }
                ].map((metric, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-xl border">
                    <p className="text-sm text-gray-600">{metric.label}</p>
                    <p className="text-xl font-semibold text-blue-600">
                      {formatMetric(metric.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetVisualization; 