import os
import json
import random

def generate_metrics():
    """Generate random metrics between 0.7 and 0.9"""
    base = 0.7
    variation = 0.2
    return base + random.random() * variation

def main():
    # Get the absolute path to the public directory
    public_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public')
    images_dir = os.path.join(public_dir, 'images')
    
    # Get all image files
    image_files = [f for f in os.listdir(images_dir) if f.endswith('.jpg')]
    
    # Generate data for each image
    data = []
    for image_file in sorted(image_files):
        image_id = os.path.splitext(image_file)[0]
        
        item = {
            "id": image_id,
            "image": f"/images/{image_file}",
            "unet_mask": f"/masks/{image_file}",
            "otsu_mask": None,
            "dice": round(generate_metrics(), 3),
            "iou": round(generate_metrics(), 3),
            "precision": round(generate_metrics(), 3),
            "recall": round(generate_metrics(), 3),
            "classification": "polyp"
        }
        data.append(item)
    
    # Write to data.json
    output_file = os.path.join(public_dir, 'data.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    
    print(f"Generated data.json with {len(data)} items")

if __name__ == "__main__":
    main() 