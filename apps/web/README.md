# Plyce Web Application

A modern web application for discovering local restaurants with TikTok reviews, menus, and more.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Maps API Key
- Backend API running (see Backend folder)

### Installation

```bash
# Navigate to web app directory
cd apps/web

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your values
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

## 🌐 Deploy to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd apps/web
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

### Option 2: Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set the Root Directory to `apps/web`
5. Add environment variables:
   - `NEXT_PUBLIC_API_URL` - Your deployed backend URL
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Your Google Maps API key
6. Deploy!

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (e.g., `https://api.plyce.app`) | Yes |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key | Yes |

## 📁 Project Structure

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MapView.tsx
│   │   ├── RestaurantCard.tsx
│   │   ├── RestaurantModal.tsx
│   │   └── FilterPanel.tsx
│   ├── services/         # API services
│   │   └── api.ts
│   ├── styles/           # CSS styles
│   │   └── globals.css
│   └── types/            # TypeScript types
│       └── index.ts
├── public/               # Static assets
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── vercel.json
```

## 🎨 Features

- **Interactive Map** - Google Maps with restaurant markers
- **Restaurant Discovery** - Browse restaurants by location
- **Filters** - Filter by cuisine, price, rating
- **TikTok Videos** - View TikTok content about restaurants
- **Reviews** - Read Google reviews
- **Menu Photos** - Browse restaurant photos
- **Responsive Design** - Works on desktop and mobile
- **Multiple Views** - Map, List, and Grid views

## 🔌 Backend API

The web app connects to the same FastAPI backend as the mobile app. Make sure to:

1. Deploy the backend (see `/Backend/README.md`)
2. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL

### Backend Deployment Options
- **Railway** - Easy Python hosting
- **Render** - Free tier available
- **Fly.io** - Global edge deployment
- **Heroku** - Classic PaaS option

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Maps**: @react-google-maps/api
- **Icons**: Lucide React
- **HTTP**: Axios
- **Animations**: Framer Motion
- **Language**: TypeScript

## 📝 Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Places API (for autocomplete)
4. Create an API key
5. Restrict the key to your domains for security

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
