import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// 이미지 분류 함수 (cancer/polyp/normal)
async function classifyImage(imagePath: string) {
  try {
    // 이미지를 로드하고 전처리
    const imageBuffer = await sharp(imagePath)
      .resize(224, 224) // 일반적인 CNN 입력 크기
      .grayscale()
      .raw()
      .toBuffer();

    // TODO: 실제 분류 모델 구현
    // 현재는 임시로 이미지 특성에 따라 간단한 규칙 기반 분류
    const mean = Array.from(imageBuffer).reduce((a, b) => a + b, 0) / imageBuffer.length;
    
    if (mean > 200) return 'normal';
    if (mean > 150) return 'polyp';
    return 'cancer';
  } catch (error) {
    console.error('Classification error:', error);
    return 'unknown';
  }
}

// 이미지와 마스크를 비교하여 메트릭 계산
async function calculateMetrics(imagePath: string, maskPath: string) {
  try {
    const imageBuffer = await sharp(imagePath).raw().toBuffer();
    const maskBuffer = await sharp(maskPath).raw().toBuffer();

    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let trueNegatives = 0;

    for (let i = 0; i < imageBuffer.length; i++) {
      const imagePixel = imageBuffer[i] > 127;
      const maskPixel = maskBuffer[i] > 127;

      if (imagePixel && maskPixel) truePositives++;
      else if (imagePixel && !maskPixel) falsePositives++;
      else if (!imagePixel && maskPixel) falseNegatives++;
      else trueNegatives++;
    }

    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const dice = (2 * truePositives) / (2 * truePositives + falsePositives + falseNegatives) || 0;
    const iou = truePositives / (truePositives + falsePositives + falseNegatives) || 0;

    return { precision, recall, dice, iou };
  } catch (error) {
    console.error(`Error calculating metrics for ${imagePath}:`, error);
    return { precision: 0, recall: 0, dice: 0, iou: 0 };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 이미지 디렉토리에서 모든 파일 읽기
    const imagesDir = path.join(process.cwd(), 'public', 'images');
    const masksDir = path.join(process.cwd(), 'public', 'masks');
    
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    if (!fs.existsSync(masksDir)) {
      fs.mkdirSync(masksDir, { recursive: true });
    }

    const imageFiles = fs.readdirSync(imagesDir)
      .filter(file => file.endsWith('.jpg'));

    console.log(`Found ${imageFiles.length} image files`);

    const results = await Promise.all(
      imageFiles.map(async (filename) => {
        const id = filename.replace('.jpg', '');
        const imagePath = path.join(imagesDir, filename);
        const maskPath = path.join(masksDir, filename);

        // 이미지와 마스크가 존재하는지 확인
        if (!fs.existsSync(imagePath) || !fs.existsSync(maskPath)) {
          console.warn(`Missing files for ${filename}`);
          return null;
        }

        // 메트릭 계산
        const metrics = await calculateMetrics(imagePath, maskPath);
        
        // 분류 결정 (예시: IoU 점수 기반)
        let classification = 'normal';
        if (metrics.iou > 0.7) {
          classification = 'cancer';
        } else if (metrics.iou > 0.3) {
          classification = 'polyp';
        }

        return {
          id,
          image: `/images/${filename}`,
          unet_mask: `/masks/${filename}`,
          otsu_mask: null,
          ...metrics,
          classification
        };
      })
    );

    // null 값 제거 및 결과 필터링
    const validResults = results.filter(result => result !== null);

    // results.json 파일 저장
    const resultsPath = path.join(process.cwd(), 'public', 'results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(validResults, null, 2));

    console.log(`Processed ${validResults.length} valid results`);
    res.status(200).json({ success: true, count: validResults.length });
  } catch (error) {
    console.error('Error in setup:', error);
    res.status(500).json({ error: 'Failed to setup dataset' });
  }
} 