import Head from 'next/head';
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

export default function Home() {
  const [results, setResults] = useState<Result[]>([]);
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSet, setSelectedSet] = useState<'all' | 'training' | 'validation' | 'test'>('all');
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        // Load the results directly from data.json
        const response = await fetch('/data.json');
        if (!response.ok) {
          throw new Error(`Failed to load dataset: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Loaded data:', data);
        
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Invalid or empty dataset');
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

        setResults(annotatedData);
        setFilteredResults(annotatedData);
        setError(null);
      } catch (err) {
        console.error('Error loading dataset:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dataset');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Spinner className="w-12 h-12 mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading dataset...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <h3 className="text-red-800 dark:text-red-400 font-semibold">Error</h3>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
            variant="default"
          >
            Try Again
          </Button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentResults.map((result) => (
              <Card 
                key={result.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div onClick={() => setSelectedResult(result)}>
                  <CardContent className="p-4">
                    <div className="aspect-w-16 aspect-h-9 mb-4 relative overflow-hidden rounded-lg">
                      <img
                        src={`/images/${result.id}.jpg`}
                        alt={`Polyp image ${result.id}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">{result.id}</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Badge variant="outline">
                          Dice: {result.dice.toFixed(3)}
                        </Badge>
                        <Badge variant="outline">
                          IoU: {result.iou.toFixed(3)}
                        </Badge>
                        <Badge variant="outline">
                          Precision: {result.precision.toFixed(3)}
                        </Badge>
                        <Badge variant="outline">
                          Recall: {result.recall.toFixed(3)}
                        </Badge>
                      </div>
                      <Badge className="mt-2" variant={
                        result.set === 'training' ? 'default' :
                        result.set === 'validation' ? 'outline' : 'secondary'
                      }>
                        {result.set}
                      </Badge>
                    </div>
                  </CardContent>
                </div>
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
