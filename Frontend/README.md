# Omni-Valio Front-End

A world-class, Scandinavian-inspired interface designed for chefs, operations managers, and food-service professionals. Built with Next.js, TypeScript, and Tailwind CSS.

## 🎯 Features

### 1. **Dashboard - "Today at a Glance"**
- Hero summary card with animated statistics (odometer effect)
- Real-time delivery tracking with expandable items list
- Action center with prioritized alerts
- Risk-aware item displays with visual indicators

### 2. **Smart Order Builder**
- Product catalogue with search and filters
- Real-time risk awareness for each product
- Intelligent basket with priority controls
- AI-powered substitution suggestions
- Grid and list view modes

### 3. **Pre-Order Optimization Modal**
- Full-screen, premium modal experience
- AI-recommended substitutions with Good/Better/Best tiers
- Market-basket similarity indicators
- Critical risk alerts with contact options
- Smooth animations and transitions

### 4. **Real-Time Picking Alerts**
- Live timeline with animated event nodes
- Detailed alert viewer with product information
- Voice/chat transcript mockups
- Quick action buttons for issue resolution

### 5. **Claims & Credits**
- AI-handled claim tracking
- Evidence viewer with image analysis
- "See what AI sees" overlay toggle
- Credit note generation and PDF download
- Timeline of claim events

### 6. **Settings**
- **Profile:** Restaurant details and language preferences
- **Communication:** Channel preferences with time slider
- **Substitution Rules:** Category priorities and allergen restrictions
- **AI Transparency:** Clear explanations of how AI makes decisions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🎨 Design System

### Color Palette
- **Valio Blues:** Primary brand colors (50-900)
- **Glacier Whites:** Neutral tones for backgrounds and text
- **Risk Colors:** Green (low), Amber (medium), Red (high)

### Typography
- **Display XL/LG:** Page titles (28-32px)
- **Heading:** Section titles (24px)
- **Body:** Regular text (15-16px)
- **Caption/Label:** Small text (11-12px)

### Components
All components follow Scandinavian design principles:
- Clean, white-dominant backgrounds
- Soft shadows and rounded corners
- Subtle micro-animations
- Clear visual hierarchy

## 📁 Project Structure

```
├── app/                    # Next.js 14 app directory
│   ├── page.tsx           # Dashboard
│   ├── order/             # Smart Order Builder
│   ├── alerts/            # Real-Time Picking Alerts
│   ├── claims/            # Claims & Credits
│   └── settings/          # Settings
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── dashboard/        # Dashboard-specific components
│   ├── order/            # Order-specific components
│   ├── alerts/           # Alerts-specific components
│   ├── claims/           # Claims-specific components
│   └── settings/         # Settings-specific components
├── lib/                   # Utilities and types
│   ├── types.ts          # TypeScript type definitions
│   ├── utils.ts          # Helper functions
│   └── mockData.ts       # Mock data generators
└── public/               # Static assets
```

## 🎭 Mock Data

The application is fully functional with comprehensive mock data including:
- 20+ Products across multiple categories
- Deliveries with various risk levels
- Real-time alerts and timeline events
- Claims with AI analysis
- User preferences

All mock data is generated in `lib/mockData.ts` and can be easily customized.

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 3
- **Animations:** Framer Motion
- **UI Components:** Radix UI primitives
- **Icons:** Lucide React

## ✨ Micro-Interactions

The application features numerous micro-interactions:
- Pulsing risk indicators for high-risk items
- Hover shadows that brighten on cards
- Smooth slide and scale transitions
- Odometer-style number animations
- Live timeline event pulses
- Modal entrance/exit animations

## 📱 Responsive Design

Fully responsive across all device sizes:
- Mobile-first approach
- Adaptive layouts for tablets and desktops
- Touch-friendly interactive elements
- Optimized for both portrait and landscape orientations

## 🎪 Demo-Ready Features

- All features work with mock data
- No backend required for demonstration
- Realistic data and interactions
- Professional animations and transitions
- Production-ready build

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

This is a front-end demonstration project. For production use, integrate with your backend API by replacing mock data calls with actual API endpoints.

---

**Built with ❤️ for Omni-Valio**
