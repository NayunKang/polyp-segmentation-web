import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import numpy as np
from pathlib import Path
from predict import UNet
import matplotlib.pyplot as plt

class PolypDataset(Dataset):
    def __init__(self, image_dir, mask_dir, transform=None):
        self.image_dir = Path(image_dir)
        self.mask_dir = Path(mask_dir)
        self.transform = transform
        
        self.images = sorted(list(self.image_dir.glob('*.jpg')) + list(self.image_dir.glob('*.png')))
        self.masks = sorted(list(self.mask_dir.glob('*.jpg')) + list(self.mask_dir.glob('*.png')))
        
    def __len__(self):
        return len(self.images)
    
    def __getitem__(self, idx):
        img_path = self.images[idx]
        mask_path = self.masks[idx]
        
        image = Image.open(img_path).convert('RGB')
        mask = Image.open(mask_path).convert('L')  # grayscale
        
        if self.transform:
            image = self.transform(image)
            mask = transforms.ToTensor()(mask)
        
        # 마스크를 이진화 (0 또는 1)
        mask = (mask > 0.5).float()
        
        return image, mask

def train_model(model, train_loader, val_loader, criterion, optimizer, num_epochs, device):
    best_val_loss = float('inf')
    train_losses = []
    val_losses = []
    
    for epoch in range(num_epochs):
        # Training Phase
        model.train()
        train_loss = 0
        for batch_idx, (images, masks) in enumerate(train_loader):
            images, masks = images.to(device), masks.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, masks)
            
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            
            if batch_idx % 10 == 0:
                print(f'Epoch {epoch+1}/{num_epochs} | Batch {batch_idx}/{len(train_loader)} | '
                      f'Loss: {loss.item():.4f}')
        
        avg_train_loss = train_loss / len(train_loader)
        train_losses.append(avg_train_loss)
        
        # Validation Phase
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for images, masks in val_loader:
                images, masks = images.to(device), masks.to(device)
                outputs = model(images)
                loss = criterion(outputs, masks)
                val_loss += loss.item()
        
        avg_val_loss = val_loss / len(val_loader)
        val_losses.append(avg_val_loss)
        
        print(f'Epoch {epoch+1}/{num_epochs} | '
              f'Training Loss: {avg_train_loss:.4f} | '
              f'Validation Loss: {avg_val_loss:.4f}')
        
        # Save best model
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            torch.save(model.state_dict(), 'models/unet_model.pth')
            print(f'Model saved! Best validation loss: {best_val_loss:.4f}')
    
    # Plot training history
    plt.figure(figsize=(10, 5))
    plt.plot(train_losses, label='Training Loss')
    plt.plot(val_losses, label='Validation Loss')
    plt.title('Training History')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.savefig('training_history.png')
    plt.close()

def main():
    # 하이퍼파라미터 설정
    BATCH_SIZE = 8
    NUM_EPOCHS = 50
    LEARNING_RATE = 1e-4
    IMAGE_SIZE = 256
    
    # 디바이스 설정
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f'Using device: {device}')
    
    # 데이터 변환
    transform = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                           std=[0.229, 0.224, 0.225])
    ])
    
    # 데이터셋 로드
    train_dataset = PolypDataset(
        image_dir='data/train/images',
        mask_dir='data/train/masks',
        transform=transform
    )
    
    val_dataset = PolypDataset(
        image_dir='data/val/images',
        mask_dir='data/val/masks',
        transform=transform
    )
    
    # 데이터 로더 생성
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=4)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=4)
    
    # 모델 초기화
    model = UNet(n_channels=3, n_classes=1).to(device)
    
    # 손실 함수와 옵티마이저 설정
    criterion = nn.BCELoss()  # Binary Cross Entropy Loss
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    
    # 모델 학습
    train_model(model, train_loader, val_loader, criterion, optimizer, NUM_EPOCHS, device)

if __name__ == '__main__':
    # 필요한 디렉토리 생성
    os.makedirs('models', exist_ok=True)
    os.makedirs('data/train/images', exist_ok=True)
    os.makedirs('data/train/masks', exist_ok=True)
    os.makedirs('data/val/images', exist_ok=True)
    os.makedirs('data/val/masks', exist_ok=True)
    
    main() 