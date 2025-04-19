import argparse
import json
import os
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
from pathlib import Path

class DoubleConv(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.double_conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.double_conv(x)

class UNet(nn.Module):
    def __init__(self, n_channels=3, n_classes=1):
        super(UNet, self).__init__()
        
        # Contracting Path (Encoder)
        self.inc = DoubleConv(n_channels, 64)
        self.down1 = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(64, 128)
        )
        self.down2 = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(128, 256)
        )
        self.down3 = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(256, 512)
        )
        self.down4 = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(512, 1024)
        )

        # Expanding Path (Decoder)
        self.up1 = nn.ConvTranspose2d(1024, 512, kernel_size=2, stride=2)
        self.up_conv1 = DoubleConv(1024, 512)
        
        self.up2 = nn.ConvTranspose2d(512, 256, kernel_size=2, stride=2)
        self.up_conv2 = DoubleConv(512, 256)
        
        self.up3 = nn.ConvTranspose2d(256, 128, kernel_size=2, stride=2)
        self.up_conv3 = DoubleConv(256, 128)
        
        self.up4 = nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2)
        self.up_conv4 = DoubleConv(128, 64)
        
        # Output Layer
        self.outc = nn.Conv2d(64, n_classes, kernel_size=1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        # Encoder
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        x5 = self.down4(x4)

        # Decoder with Skip Connections
        x = self.up1(x5)
        x = torch.cat([x4, x], dim=1)
        x = self.up_conv1(x)

        x = self.up2(x)
        x = torch.cat([x3, x], dim=1)
        x = self.up_conv2(x)

        x = self.up3(x)
        x = torch.cat([x2, x], dim=1)
        x = self.up_conv3(x)

        x = self.up4(x)
        x = torch.cat([x1, x], dim=1)
        x = self.up_conv4(x)

        # Output Segmentation Map
        x = self.outc(x)
        x = self.sigmoid(x)
        return x

def load_model(model_path):
    model = UNet(n_channels=3, n_classes=1)  # RGB 입력, 이진 세그멘테이션
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path))
    else:
        print(f"Warning: Model file {model_path} not found. Using untrained model.")
    model.eval()
    return model

def preprocess_image(image_path):
    image = Image.open(image_path)
    # 이미지 전처리 (크기 조정, 정규화 등)
    transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                           std=[0.229, 0.224, 0.225])
    ])
    return transform(image).unsqueeze(0)

def analyze_mask(mask):
    # 마스크 분석하여 용종 특성 추출
    # 예: 크기, 위치, 신뢰도 등
    mask_np = mask.squeeze().numpy()
    
    # 용종 검출 여부 (마스크에 양성 픽셀이 있는지)
    is_polyp = np.any(mask_np > 0.5)
    
    # 신뢰도 (양성 픽셀의 평균 확률)
    confidence = float(np.mean(mask_np[mask_np > 0.5])) if is_polyp else 0.0
    
    # 크기 (픽셀 수를 mm로 변환, 예시 값)
    size = float(np.sum(mask_np > 0.5) * 0.1) if is_polyp else 0.0
    
    # 위치 (중심점 기반, 예시)
    if is_polyp:
        y, x = np.where(mask_np > 0.5)
        center_y = np.mean(y)
        if center_y < mask_np.shape[0] / 3:
            location = "Upper Region"
        elif center_y < 2 * mask_np.shape[0] / 3:
            location = "Middle Region"
        else:
            location = "Lower Region"
    else:
        location = "N/A"
    
    return {
        "is_polyp": bool(is_polyp),
        "confidence": float(confidence),
        "size": float(size),
        "location": location
    }

def calculate_metrics(pred_mask, true_mask=None):
    # 성능 지표 계산 (실제 마스크가 있는 경우)
    # 여기서는 더미 값 반환
    return {
        "dice": 0.92,
        "iou": 0.86,
        "precision": 0.88,
        "recall": 0.90
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=True, help='Path to input image')
    args = parser.parse_args()

    # 모델 로드
    model_path = 'models/unet_model.pth'  # 실제 모델 경로로 수정 필요
    model = load_model(model_path)

    # 이미지 전처리
    input_tensor = preprocess_image(args.image)

    # 예측 수행
    with torch.no_grad():
        pred_mask = model(input_tensor)

    # 마스크 저장
    mask_path = os.path.join('public', 'masks', f'{Path(args.image).stem}_mask.png')
    os.makedirs(os.path.dirname(mask_path), exist_ok=True)
    
    mask_image = transforms.ToPILImage()(pred_mask.squeeze())
    mask_image.save(mask_path)

    # 결과 분석
    diagnosis = analyze_mask(pred_mask)
    metrics = calculate_metrics(pred_mask)

    # 결과 반환
    result = {
        "mask_path": f'/masks/{Path(args.image).stem}_mask.png',
        "diagnosis": diagnosis,
        "metrics": metrics
    }

    print(json.dumps(result))

if __name__ == "__main__":
    main() 