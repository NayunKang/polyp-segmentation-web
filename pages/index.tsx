import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<string>('');
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 한 페이지당 9개의 아이템 표시

  useEffect(() => {
    const setupDataset = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSetupStatus('Initializing dataset...');

        const setupResponse = await fetch('/api/setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });
        
        if (!setupResponse.ok) {
          const errorData = await setupResponse.json();
          throw new Error(errorData.error || 'Failed to setup dataset');
        }

        const setupData = await setupResponse.json();
        console.log(`Processing ${setupData.count} images...`);

        setSetupStatus('Loading results...');

        const resultsResponse = await fetch('/results.json');
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

        setResults(annotatedData);
        setFilteredResults(annotatedData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dataset');
        setIsLoading(false);
      }
    };

    setupDataset();
  }, []);

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
    setCurrentPage(1); // 필터링할 때마다 첫 페이지로 이동
  }, [searchTerm, selectedSet, results]);

  const getSetStats = (setType: 'training' | 'validation' | 'test') => {
    const count = results.filter(r => r.set === setType).length;
    const percentage = ((count / results.length) * 100).toFixed(0);
    return { count, percentage };
  };

  // 페이지네이션 관련 계산
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = filteredResults.slice(startIndex, endIndex);

  // 페이지 변경 함수
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

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

          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">{setupStatus}</p>
            </div>
          ) : error ? (
            <Card className="mx-auto max-w-lg">
              <CardHeader>
                <h3 className="text-red-800 dark:text-red-400 font-semibold">Error</h3>
              </CardHeader>
              <CardBody>
                <p className="text-red-600 dark:text-red-300">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </CardBody>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {['training', 'validation', 'test'].map((setType) => (
                  <Card key={setType}>
                    <CardHeader>
                      <h2 className="text-xl font-semibold capitalize">{setType} Set</h2>
                    </CardHeader>
                    <CardBody>
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
                    </CardBody>
                  </Card>
                ))}
              </div>

              <div className="flex gap-4 mb-8">
                <Input
                  type="text"
                  placeholder="Search by image ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Select
                  value={selectedSet}
                  onChange={(e) => setSelectedSet(e.target.value as any)}
                >
                  <option value="all">All Sets</option>
                  <option value="training">Training</option>
                  <option value="validation">Validation</option>
                  <option value="test">Test</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {currentResults.map((result) => (
                  <Card 
                    key={result.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="relative h-48">
                      <Image
                        src={result.image}
                        alt={`Image ${result.id}`}
                        fill
                        className="object-cover"
                      />
                      <Badge
                        className={`absolute top-2 right-2
                          ${result.classification === 'cancer' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                          result.classification === 'polyp' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                          'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'}`}
                      >
                        {result.classification}
                      </Badge>
                    </div>
                    <CardBody>
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">ID:</p>
                        <p className="font-mono text-sm">{result.id}</p>
                        <Badge className="mt-2 capitalize">{result.set}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Dice</p>
                          <p className="font-semibold">{(result.dice * 100).toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">IoU</p>
                          <p className="font-semibold">{(result.iou * 100).toFixed(2)}%</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}

              {/* Image Analysis Modal */}
              <Modal
                isOpen={selectedResult !== null}
                onClose={() => setSelectedResult(null)}
                title={`Analysis Results: ${selectedResult?.id}`}
              >
                {selectedResult && <ImageAnalysis result={selectedResult} />}
              </Modal>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
