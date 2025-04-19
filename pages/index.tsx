import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ImageAnalysis } from '../components/ImageAnalysis';

interface Result {
  id: string;
  image: string;
  unet_mask: string;
  otsu_mask: string | null;
  dice: number;
  iou: number;
  precision: number;
  recall: number;
  classification: string;
  set?: 'training' | 'validation' | 'test';
}

export async function getStaticProps() {
  try {
    // Setup the dataset
    const setupResponse = await fetch('http://localhost:3000/api/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!setupResponse.ok) {
      throw new Error('Failed to setup dataset');
    }

    // Load the results
    const resultsResponse = await fetch('http://localhost:3000/results.json');
    if (!resultsResponse.ok) {
      throw new Error('Failed to load results');
    }

    const data = await resultsResponse.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid or empty results data');
    }

    const totalCount = data.length;
    const trainingCount = Math.floor(totalCount * 0.7);
    const validationCount = Math.floor(totalCount * 0.15);

    const annotatedData = data.map((item, index) => ({
      ...item,
      set: index < trainingCount 
        ? 'training' 
        : index < trainingCount + validationCount 
          ? 'validation' 
          : 'test'
    }));

    return {
      props: {
        results: annotatedData,
        error: null,
      },
      // Revalidate every hour
      revalidate: 3600,
    };
  } catch (error) {
    return {
      props: {
        results: [],
        error: error instanceof Error ? error.message : 'Failed to load dataset',
      },
    };
  }
}

export default function Home({ results: initialResults, error: initialError }) {
  const [results] = useState<Result[]>(initialResults);
  const [filteredResults, setFilteredResults] = useState<Result[]>(initialResults);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSet, setSelectedSet] = useState<'all' | 'training' | 'validation' | 'test'>('all');
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Filter results when search term or selected set changes
  useEffect(() => {
    let filtered = [...results];
    
    if (selectedSet !== 'all') {
      filtered = filtered.filter(result => result.set === selectedSet);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(result => 
        result.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredResults(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedSet, results]);

  const getSetStats = (setType: 'training' | 'validation' | 'test') => {
    const count = results.filter(r => r.set === setType).length;
    const percentage = ((count / results.length) * 100).toFixed(0);
    return { count, percentage };
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = filteredResults.slice(startIndex, endIndex);

  // 페이지 변경 함수
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (initialError) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <h3 className="text-red-800 dark:text-red-400 font-semibold">Error</h3>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 dark:text-red-300">{initialError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Polyp Segmentation Dataset</title>
        <meta name="description" content="Polyp segmentation dataset visualization" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Polyp Segmentation Dataset
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {['training', 'validation', 'test'].map((setType) => (
              <Card key={setType}>
                <CardHeader>
                  <h2 className="text-xl font-semibold capitalize">{setType} Set</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Samples: {getSetStats(setType as any).count}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Percentage: {getSetStats(setType as any).percentage}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${getSetStats(setType as any).percentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-4 mb-8">
            <Input
              type="text"
              placeholder="Search by ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value as any)}
              className="max-w-xs"
            >
              <option value="all">All Sets</option>
              <option value="training">Training</option>
              <option value="validation">Validation</option>
              <option value="test">Test</option>
            </Select>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentResults.map((result) => (
              <Card key={result.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">ID: {result.id}</h3>
                    <Badge>{result.set}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="relative aspect-square mb-4">
                    <Image
                      src={result.image}
                      alt={`Image ${result.id}`}
                      layout="fill"
                      objectFit="cover"
                      className="rounded"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Precision</p>
                      <p className="font-semibold">{(result.precision * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Recall</p>
                      <p className="font-semibold">{(result.recall * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Dice</p>
                      <p className="font-semibold">{(result.dice * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">IoU</p>
                      <p className="font-semibold">{(result.iou * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => setSelectedResult(result)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
          )}

          {/* Detail Modal */}
          {selectedResult && (
            <Modal
              isOpen={!!selectedResult}
              onClose={() => setSelectedResult(null)}
              title={`Image Analysis - ID: ${selectedResult.id}`}
            >
              <ImageAnalysis result={selectedResult} />
            </Modal>
          )}
        </div>
      </main>
    </div>
  );
}
