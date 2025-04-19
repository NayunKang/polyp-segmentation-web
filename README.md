# Polyp Segmentation Web

Advanced deep learning solution for polyp detection and segmentation.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- Git
- Git LFS

## Installation

1. Install Git LFS:
   ```bash
   # macOS (using Homebrew)
   brew install git-lfs

   # Ubuntu/Debian
   sudo apt-get install git-lfs

   # Windows (using Chocolatey)
   choco install git-lfs
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/your-username/polyp-segmentation-web.git
   cd polyp-segmentation-web
   ```

3. Initialize Git LFS:
   ```bash
   git lfs install
   ```

4. Pull LFS files:
   ```bash
   git lfs pull
   ```

5. Install dependencies:
   ```bash
   npm install
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Project Structure

```
polyp-segmentation-web/
├── public/
│   ├── images/     # Original polyp images (LFS tracked)
│   ├── masks/      # Segmentation masks (LFS tracked)
│   └── results.json
├── pages/
│   ├── api/
│   │   └── setup.ts   # API endpoint for dataset setup
│   └── index.tsx      # Main application page
└── components/        # React components
```

## Using Git LFS

This project uses Git LFS to handle large image and mask files. When you add new images or masks:

1. Make sure they are in the correct directory (`public/images/` or `public/masks/`)
2. Add them to Git as normal:
   ```bash
   git add public/images/new-image.jpg
   git add public/masks/new-mask.png
   ```
3. Commit and push:
   ```bash
   git commit -m "Add new image and mask"
   git push
   ```

Git LFS will automatically handle the large files appropriately.

## License

[Your license information here] 