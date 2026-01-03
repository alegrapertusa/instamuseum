# InstaMuseum 📸

A beautiful, privacy-focused web application to visualize your downloaded Instagram data locally in your browser. No server uploads, no tracking - your data stays on your device.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8)

## ✨ Features

- 📱 **Posts, Stories & Archives** - View all your Instagram content in one place
- 🎠 **Carousel Support** - Navigate through multi-image posts with an elegant lightbox
- ⚡ **Smart Pagination** - Load 36 items at a time for optimal performance
- ⌨️ **Keyboard Navigation** - Use arrow keys to navigate, Esc to close
- 🎨 **Clean White Design** - Minimalist, modern interface
- 🔒 **100% Client-Side** - Your data never leaves your browser
- 🚀 **Fast & Responsive** - Built with Next.js and optimized for large datasets

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Your Instagram data export (download from Instagram settings)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/instamuseum.git
cd instamuseum
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### How to Get Your Instagram Data

1. Go to Instagram Settings → Security → Download Your Information
2. Request a download in **JSON format**
3. Wait for Instagram to prepare your data (can take a few days)
4. Download and extract the ZIP file
5. Upload the extracted folder to InstaMuseum

## 📖 Usage

1. Click "Upload Different Folder" or drag and drop your Instagram data folder
2. Browse your posts, archived content, and stories using the tabs
3. Click any image to open the lightbox viewer
4. Use arrow keys to navigate between posts/carousel slides
5. Click "Load More" to see additional content

## 🛠️ Built With

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- Client-side file processing - No backend required

## 🔐 Privacy

InstaMuseum processes all your data **entirely in your browser**. Nothing is uploaded to any server. Your Instagram data remains private and secure on your device.

## 📝 License

MIT License - feel free to use this project however you'd like!

## 🙏 Acknowledgments

Built with ❤️ for people who want to explore their Instagram memories privately and beautifully.
