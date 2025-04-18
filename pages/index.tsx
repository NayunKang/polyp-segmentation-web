import Head from 'next/head';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Polyp Segmentation</title>
        <meta name="description" content="Polyp segmentation using U-Net and Otsu thresholding" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Polyp Segmentation Demo
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Original Image */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Original Image</h2>
            <div className="relative aspect-square w-full">
              <Image
                src="/images/sample_original.png"
                alt="Original"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                priority={true}
                quality={75}
                className="object-contain"
              />
            </div>
          </div>

          {/* U-Net Prediction */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">U-Net Prediction</h2>
            <div className="relative aspect-square w-full">
              <Image
                src="/images/sample_unet.png"
                alt="U-Net Prediction"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                priority={false}
                quality={75}
                className="object-contain"
              />
            </div>
          </div>

          {/* Otsu Thresholding */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Otsu Thresholding</h2>
            <div className="relative aspect-square w-full">
              <Image
                src="/images/sample_otsu.png"
                alt="Otsu Thresholding"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                priority={false}
                quality={75}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
