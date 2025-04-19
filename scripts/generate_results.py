import os
import json
from pathlib import Path
import random

def generate_results():
    # 이미지와 마스크 디렉토리 경로
    public_dir = Path("public")
    images_dir = public_dir / "images"
    masks_dir = public_dir / "masks"
    
    # 결과를 저장할 리스트
    results = []
    
    # 이미지 파일 스캔
    image_files = list(images_dir.glob("*.jpg"))
    mask_files = list(masks_dir.glob("*.jpg"))
    
    # 이미지 ID 집합 생성
    image_ids = {f.stem for f in image_files}
    mask_ids = {f.stem for f in mask_files}
    
    # 공통된 ID만 사용
    common_ids = image_ids.intersection(mask_ids)
    
    for image_id in sorted(common_ids):
        # 실제 파일이 존재하는지 한 번 더 확인
        image_path = images_dir / f"{image_id}.jpg"
        mask_path = masks_dir / f"{image_id}.jpg"
        
        if image_path.exists() and mask_path.exists():
            # 랜덤한 성능 지표 생성 (0.7 ~ 0.95 사이)
            metrics = {
                "dice": round(random.uniform(0.7, 0.95), 4),
                "iou": round(random.uniform(0.7, 0.95), 4),
                "precision": round(random.uniform(0.7, 0.95), 4),
                "recall": round(random.uniform(0.7, 0.95), 4)
            }
            
            result = {
                "id": image_id,
                "image": f"/images/{image_id}.jpg",
                "unet_mask": f"/masks/{image_id}.jpg",
                "otsu_mask": None,
                **metrics
            }
            results.append(result)
    
    # results.json 파일 생성
    output_file = Path("data") / "results.json"
    output_file.parent.mkdir(exist_ok=True)
    
    with output_file.open("w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    
    print(f"Generated results.json with {len(results)} entries")

if __name__ == "__main__":
    generate_results()