import { Button } from './ui/Button'
import { Card } from './ui/Card'
import DatasetVisualization from './DatasetVisualization'

const features = [
  {
    name: 'Upload and Analyze',
    description: 'Upload colonoscopy images for instant polyp detection and segmentation.',
    icon: 'upload',
  },
  {
    name: 'Advanced Analytics',
    description: 'Get detailed metrics and visualizations of segmentation results.',
    icon: 'chart-bar',
  },
  {
    name: 'Secure Processing',
    description: 'Your medical data is processed with the highest security standards.',
    icon: 'shield-check',
  },
]

export default function Home() {
  return (
    <div className="bg-white">
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>
        
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Polyp Segmentation AI
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Advanced deep learning solution for accurate polyp detection and segmentation in colonoscopy images.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button variant="default" size="lg">
                Get started
              </Button>
              <Button variant="ghost" size="lg">
                Learn more
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">
              Faster Detection
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for polyp analysis
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.name} className="p-6">
                  <div className="flex items-center gap-x-3">
                    <div className="flex-none text-indigo-600">
                      {/* Icon will be handled separately */}
                    </div>
                    <h3 className="text-base font-semibold leading-7 text-gray-900">
                      {feature.name}
                    </h3>
                  </div>
                  <p className="mt-4 text-base leading-7 text-gray-600">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">
              Dataset Analysis
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Explore Our Dataset
            </p>
          </div>
          <DatasetVisualization />
        </div>
      </div>
    </div>
  )
} 