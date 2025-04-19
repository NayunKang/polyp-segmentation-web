import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface Diagnosis {
  type: 'polyp' | 'cancer' | 'normal';
  confidence: number;
  confidenceLowReason?: string[];  // 신뢰도가 낮은 경우의 이유
  size?: number;  // mm 단위
  location?: {
    segment: string;  // 대장 구역
    distanceFromAnus: number;  // cm 단위
    landmarks: string[];  // 주변 해부학적 특징
  };
  characteristics?: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 실제 디렉토리 경로로 수정
    const imagesDir = path.join(process.cwd(), 'public', 'images');
    const masksDir = path.join(process.cwd(), 'public', 'masks');

    // 이미지 파일 목록 가져오기
    const imageFiles = fs.readdirSync(imagesDir)
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg'));

    // Calculate metrics for each image
    const dataset = await Promise.all(imageFiles.map(async (filename) => {
      const id = filename.split('.')[0];
      const set = assignSet(id);

      // TODO: 실제 메트릭스 계산 함수 구현 필요
      const metrics = {
        dice: Math.random(), // 임시 데이터
        iou: Math.random(),
        precision: Math.random(),
        recall: Math.random()
      };

      // 임시 진단 데이터 생성 (실제로는 모델이나 데이터베이스에서 가져와야 함)
      const diagnosis: Diagnosis = generateDetailedDiagnosis();

      return {
        id,
        image: `/images/${filename}`,
        unet_mask: `/masks/${id}.jpg`,
        otsu_mask: null,
        dice: metrics.dice,
        iou: metrics.iou,
        precision: metrics.precision,
        recall: metrics.recall,
        classification: diagnosis.type,
        set
      };
    }));

    res.status(200).json(dataset);
  } catch (error) {
    console.error('Error loading dataset:', error);
    res.status(500).json({ message: 'Failed to load dataset' });
  }
}

// 70/15/15 비율로 데이터셋 분할
function assignSet(id: string): 'training' | 'validation' | 'test' {
  const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const value = hash % 100;

  if (value < 70) return 'training';
  if (value < 85) return 'validation';
  return 'test';
}

function generateDetailedDiagnosis(): Diagnosis {
  const random = Math.random();
  const types: Diagnosis['type'][] = ['polyp', 'cancer', 'normal'];
  
  // 대장 구역 정보
  const segments = [
    { name: 'cecum', distance: 0 },
    { name: 'ascending colon', distance: 15 },
    { name: 'hepatic flexure', distance: 30 },
    { name: 'transverse colon', distance: 45 },
    { name: 'splenic flexure', distance: 60 },
    { name: 'descending colon', distance: 75 },
    { name: 'sigmoid colon', distance: 90 },
    { name: 'rectum', distance: 105 }
  ];

  // 특징 및 형태
  const characteristics = [
    'flat', 'elevated', 'depressed', 'sessile', 'pedunculated',
    'ulcerated', 'irregular borders', 'smooth surface'
  ];

  // 해부학적 랜드마크
  const landmarks = [
    'triangular fold', 'circular fold', 'appendiceal orifice',
    'ileocecal valve', 'diverticulum', 'vascular pattern',
    'taenia coli', 'rectal valve'
  ];

  // 신뢰도가 낮은 이유들
  const confidenceLowReasons = [
    'image blur',
    'poor bowel preparation',
    'complex morphology',
    'unusual appearance',
    'partial visibility',
    'similar to normal tissue',
    'inadequate lighting',
    'rapid movement'
  ];

  const type = types[Math.floor(random * 3)];
  const confidence = 0.4 + Math.random() * 0.6; // 40-100%
  const selectedSegment = segments[Math.floor(Math.random() * segments.length)];
  
  // 기본 진단 정보
  const diagnosis: Diagnosis = {
    type,
    confidence,
    location: {
      segment: selectedSegment.name,
      distanceFromAnus: selectedSegment.distance + Math.floor(Math.random() * 15),
      landmarks: Array.from(
        { length: 1 + Math.floor(Math.random() * 2) },
        () => landmarks[Math.floor(Math.random() * landmarks.length)]
      )
    }
  };

  // 신뢰도가 70% 미만인 경우 이유 추가
  if (confidence < 0.7) {
    diagnosis.confidenceLowReason = Array.from(
      { length: 1 + Math.floor(Math.random() * 2) },
      () => confidenceLowReasons[Math.floor(Math.random() * confidenceLowReasons.length)]
    );
  }

  // 비정상(용종/암) 케이스에 대한 추가 정보
  if (type !== 'normal') {
    diagnosis.size = Math.floor(5 + Math.random() * 25);
    diagnosis.characteristics = Array.from(
      { length: 1 + Math.floor(Math.random() * 2) },
      () => characteristics[Math.floor(Math.random() * characteristics.length)]
    );
  }

  return diagnosis;
} 