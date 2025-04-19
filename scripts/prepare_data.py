import os
import shutil
from pathlib import Path
import random

def safe_copy(src, dst):
    try:
        # 목적지 디렉토리가 없으면 생성
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        
        # 파일 복사
        with open(src, 'rb') as fsrc:
            with open(dst, 'wb') as fdst:
                while True:
                    buffer = fsrc.read(8192)  # 8KB씩 읽기
                    if not buffer:
                        break
                    fdst.write(buffer)
    except Exception as e:
        print(f"Error copying {src} to {dst}: {e}")
        return False
    return True

def split_dataset(src_img_dir, src_mask_dir, train_ratio=0.7, val_ratio=0.15):
    # 소스 디렉토리의 모든 이미지 파일 가져오기
    src_img_dir = Path(src_img_dir)
    src_mask_dir = Path(src_mask_dir)
    
    # 이미지와 마스크 파일 리스트 가져오기
    image_files = sorted(list(src_img_dir.glob('*.jpg')) + list(src_img_dir.glob('*.png')))
    mask_files = sorted(list(src_mask_dir.glob('*.jpg')) + list(src_mask_dir.glob('*.png')))
    
    if not image_files or not mask_files:
        print(f"No images found in {src_img_dir} or no masks found in {src_mask_dir}")
        return
    
    print(f"Found {len(image_files)} images and {len(mask_files)} masks")
    
    # 이미지와 마스크 파일 쌍 만들기
    file_pairs = list(zip(image_files, mask_files))
    
    # 랜덤하게 섞기
    random.seed(42)  # 재현성을 위한 시드 설정
    random.shuffle(file_pairs)
    
    # 학습/검증/테스트 세트로 나누기
    total_samples = len(file_pairs)
    train_size = int(total_samples * train_ratio)
    val_size = int(total_samples * val_ratio)
    
    train_pairs = file_pairs[:train_size]
    val_pairs = file_pairs[train_size:train_size + val_size]
    test_pairs = file_pairs[train_size + val_size:]
    
    # 데이터 디렉토리 생성
    for split in ['train', 'val', 'test']:
        os.makedirs(f'data/{split}/images', exist_ok=True)
        os.makedirs(f'data/{split}/masks', exist_ok=True)
    
    # 데이터 복사 함수
    def copy_pairs(pairs, split_name):
        success = 0
        total = len(pairs)
        print(f"\nCopying {split_name} data...")
        for i, (img_path, mask_path) in enumerate(pairs, 1):
            print(f"Processing {i}/{total}: {img_path.name}", end='\r')
            
            img_dst = f'data/{split_name}/images/{img_path.name}'
            mask_dst = f'data/{split_name}/masks/{mask_path.name}'
            
            if safe_copy(img_path, img_dst) and safe_copy(mask_path, mask_dst):
                success += 1
        print(f"\nCompleted {split_name} set: {success}/{total} files copied successfully")
        return success
    
    # 각 세트별로 데이터 복사
    train_success = copy_pairs(train_pairs, 'train')
    val_success = copy_pairs(val_pairs, 'val')
    test_success = copy_pairs(test_pairs, 'test')
    
    print(f"\nDataset split complete:")
    print(f"Training samples: {train_success} ({train_success/total_samples*100:.1f}%)")
    print(f"Validation samples: {val_success} ({val_success/total_samples*100:.1f}%)")
    print(f"Test samples: {test_success} ({test_success/total_samples*100:.1f}%)")

if __name__ == '__main__':
    split_dataset('public/images', 'public/masks') 