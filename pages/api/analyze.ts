import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    
    if (!files.image || !files.image[0]) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const imageFile = files.image[0];
    const tempPath = imageFile.filepath;
    
    // 이미지를 임시 저장
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${imageFile.originalFilename}`;
    const newPath = path.join(uploadDir, fileName);
    fs.copyFileSync(tempPath, newPath);

    // Python 스크립트 실행 (U-Net 모델)
    const pythonProcess = spawn('python', [
      'scripts/predict.py',
      '--image',
      newPath,
    ]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(result);
        } else {
          reject(new Error(`Python process exited with code ${code}: ${error}`));
        }
      });
    });

    // 분석 결과 파싱
    const analysis = JSON.parse(result);
    
    // 결과 반환
    return res.status(200).json({
      id: fileName,
      image: `/uploads/${fileName}`,
      unet_mask: analysis.mask_path,
      otsu_mask: null,
      dice: analysis.metrics.dice,
      iou: analysis.metrics.iou,
      precision: analysis.metrics.precision,
      recall: analysis.metrics.recall,
      diagnosis: {
        isPolyp: analysis.diagnosis.is_polyp,
        confidence: analysis.diagnosis.confidence,
        size: analysis.diagnosis.size,
        location: analysis.diagnosis.location
      }
    });

  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({ message: 'Error processing image' });
  }
} 