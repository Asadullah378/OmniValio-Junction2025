# Omni-Valio - Zero-Fail Logistics Portal

**Live URL**: https://omnivalio.live

Omni-Valio is a comprehensive logistics management platform designed for professional kitchens and operations teams. The platform leverages AI to predict shortages, manage substitutes, automate communication, and transform manual logistics management into a proactive, streamlined operation.

## 🚀 Features

### For Professional Kitchens (Customer Portal)

- **AI-Powered Order Management**
  - Browse products with real-time shortage risk assessment
  - Visual risk indicators (Safe, Low, Medium, High, Very High)
  - Per-item shortage risk percentages with live updates
  - AI-powered product recommendations and substitutes

- **Smart Ordering**
  - Cart-based ordering system
  - Set up to 2 substitute products per item
  - Delivery date and time window selection
  - Real-time cart state management

- **Order Tracking & Communication**
  - Real-time order status updates
  - Complete order history with tracking timeline
  - Embedded chat with operations team and AI assistant
  - Automatic notifications for order changes and status updates

- **Claims Management**
  - Create claims for delivered orders only
  - Multiple image attachments support
  - AI-powered claim processing with confidence scores
  - Chat support for claim resolution

- **Invoice & Payment Tracking**
  - View all invoices for orders
  - Automatic invoice regeneration on product substitutions
  - Invoice removal on order cancellation

### For Operations Teams (Admin Portal)

- **Order Management**
  - View all customer orders with status filtering
  - Update order statuses (placed, under_risk, waiting_for_customer_action, picking, delivering, delivered, cancelled)
  - Replace products with customer-approved substitutes
  - Automatic customer alerts on status changes

- **Inventory Management**
  - Real-time inventory tracking with low stock alerts
  - Batch inventory updates
  - Visual stock level indicators
  - Search and filter capabilities

- **Product Catalog**
  - Create, update, and delete products
  - Product categorization and temperature zone management
  - Paginated product listing with search and filters

- **Claims Processing**
  - AI-powered claim triage with confidence scores
  - Manual review queue for claims requiring human attention
  - Approve/reject claims with refund processing
  - Rejection reasoning capture

- **Customer Management**
  - Create and manage customer accounts
  - Customer user account creation
  - Customer details and preferences management

## 🔐 Test Credentials

### Customer Account
- **Username**: `unicafe`
- **Password**: `customer123`

**Customer Features**: Dashboard, New Orders, Order History, Claims, Invoices, Alerts

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`

**Admin Features**: Order Management, Inventory Management, Product Catalog, Claims Processing, Customer Management

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Form Management**: React Hook Form with Zod validation
- **Routing**: React Router v6
- **API Communication**: Axios
- **AI Integration**: ElevenLabs ConvAI widget (customer portal)
- **Date Handling**: date-fns
- **Icons**: Lucide React

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Backend API running (see backend documentation)

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd valio-nexus

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment with PM2

```bash
# Make run script executable (Linux/Mac)
chmod +x run.sh

# Run the deployment script
./run.sh
```

The script will:
1. Build the React application
2. Install PM2 if not already installed
3. Start the server on `localhost:3000`
4. Save the PM2 process for auto-restart

**PM2 Management Commands**:
- `pm2 logs omni-valio-frontend` - View logs
- `pm2 stop omni-valio-frontend` - Stop server
- `pm2 restart omni-valio-frontend` - Restart server
- `pm2 status` - Check process status

## 📁 Project Structure

```
valio-nexus/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn/ui components
│   │   └── ...          # Custom components (ChatWidget, Layout, etc.)
│   ├── contexts/        # React contexts (Auth, Language)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and API client
│   │   ├── api.ts       # API endpoints
│   │   ├── types.ts     # TypeScript types
│   │   └── validations.ts # Zod schemas
│   ├── pages/           # Page components
│   │   ├── admin/       # Admin portal pages
│   │   ├── customer/    # Customer portal pages
│   │   └── ...          # Public pages (Login, Landing)
│   └── main.tsx         # Application entry point
├── public/              # Static assets
├── index.html           # HTML template
├── server.cjs           # Production server (PM2)
├── run.sh              # Deployment script
└── package.json        # Dependencies and scripts
```

## 🔑 Key Features Explained

### AI-Powered Risk Assessment

The platform uses AI to assess shortage risk for products in the cart:
- Risk categories: Safe (<10%), Low (10-25%), Medium (25-40%), High (40-55%), Very High (>55%)
- Batch risk assessment for efficiency
- Real-time risk updates when delivery dates or quantities change
- Visual indicators with percentage displays

### Substitute Management

- Customers can select up to 2 substitute products per item
- AI-powered recommendations for similar products
- Admins can trigger substitutions with automatic invoice updates
- Chat notifications on product replacements

### Claims Processing Flow

1. Customer creates claim for delivered orders only
2. AI processes claim with confidence score
3. Automatic routing: Approved, Rejected, or Manual Review
4. Admin actions: Approve (with refund) or Reject (with reason)
5. Customer receives updates via chat

### Order Status Workflow

1. **Placed** - Order submitted by customer
2. **Under Risk** - AI detects potential shortages
3. **Waiting for Customer Action** - Customer alert triggered
4. **Picking** - Items being gathered
5. **Delivering** - In transit
6. **Delivered** - Order completed
7. **Cancelled** - Order cancelled (invoice removed)

## 🤝 Contributing

This is a proprietary project. For contributions or questions, please contact the development team.

## 📄 License

Proprietary - Valio Aimo

## 🔗 Links

- **Live Application**: https://omnivalio.live
- **Backend API Documentation**: See `backend_openapi.json`

---

**Version**: 2.0.0  
**Last Updated**: 2025
