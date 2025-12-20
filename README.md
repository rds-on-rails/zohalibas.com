# Retail Shop Management System

A comprehensive full-stack system for managing daily sales and expenses in a retail clothing shop with role-based access control, detailed reporting, and data validation.

## ✨ Features

### 🔐 Authentication & Authorization
- Firebase Authentication (Email/Password + Google OAuth)
- Role-based access control (Owner, Manager, Worker)
- Protected routes and API endpoints

### 💰 Sales Management
- Create, view, edit, and delete sales transactions
- Support for cash and online payment modes
- Item tracking with quantity and pricing
- Photo attachment support
- Real-time validation

### 💸 Expense Management
- Categorized expense tracking
- Receipt photo attachments
- Detailed descriptions
- Edit and delete capabilities

### 📊 Reporting & Analytics
- Daily, weekly, and monthly summaries
- Detailed financial reports
- Sales trends and top-selling items
- Expense breakdown by category
- Data export (CSV/JSON)

### 👥 Staff Management
- Add, edit, and manage team members
- Role-based permissions system
- Active/inactive status management
- Comprehensive permission matrix

### 🔍 OCR Integration
- Receipt text extraction using Google Cloud Vision
- Automatic data parsing from images
- Smart amount detection

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, React 18
- **Backend**: Firebase Functions, Express.js, TypeScript
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage (for photos)
- **OCR**: Google Cloud Vision API
- **Hosting**: Firebase Hosting

## 📋 Prerequisites

- Node.js (v18 or later)
- Firebase CLI
- Google Cloud Project with Vision API enabled
- npm or yarn

## 🚀 Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd retail-shop-system

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../functions
npm install
```

### 2. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password and Google)
3. Enable Firestore Database
4. Enable Firebase Functions
5. Enable Firebase Hosting
6. Enable Firebase Storage

### 3. Environment Setup

Update the Firebase configuration in `frontend/src/lib/firebase.ts` with your project details:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
}
```

### 4. Google Cloud Vision Setup

1. Enable the Vision API in your Google Cloud Console
2. Create a service account key
3. Set up authentication for Firebase Functions

### 5. Database Initialization

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Run the seed script to create initial owner account
npm run seed
```

### 6. Deploy Functions

```bash
# Build and deploy functions
npm run build
firebase deploy --only functions
```

### 7. Build and Deploy Frontend

```bash
# Navigate to frontend directory
cd ../frontend

# Build the application
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## 🔑 Initial Setup

1. After deployment, create a Firebase Auth account with the email specified in the seed script (default: `owner@retailshop.com`)
2. Sign in to the application
3. You'll have full owner permissions
4. Use the Staff Management page to add team members

## 👥 User Roles & Permissions

### 🏆 Owner
- Full system access
- Manage staff members
- Delete any records
- Access all reports and exports
- All manager and worker permissions

### 👔 Manager
- Edit sales and expenses
- View detailed reports
- Export data
- All worker permissions
- Cannot manage staff

### 👷 Worker
- Create sales and expenses
- View dashboard
- View sales and expenses lists
- Basic data entry only

## 📱 Usage

### Creating Sales
1. Navigate to "Add Sale" from the dashboard
2. Fill in item details, quantity, and price
3. Select payment mode (cash/online)
4. Enter worker name
5. Optionally attach a photo
6. Submit to save

### Managing Expenses
1. Go to "Add Expense"
2. Select category and enter amount
3. Add description and receipt photo
4. Submit to record expense

### Viewing Reports
1. Access "View Reports" (Manager/Owner only)
2. Set date range and report type
3. Generate detailed analytics
4. Export data as needed

### Staff Management
1. Go to "Manage Staff" (Owner only)
2. Add new team members with roles
3. Edit existing staff details
4. Activate/deactivate accounts

## 🔧 Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd functions
npm run build
firebase emulators:start
```

### Testing
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd functions
npm test
```

## 📊 API Endpoints

### Sales
- `GET /sales` - List sales with filters
- `POST /sales` - Create new sale
- `PUT /sales/:id` - Update sale
- `DELETE /sales/:id` - Delete sale

### Expenses
- `GET /expenses` - List expenses with filters
- `POST /expenses` - Create new expense
- `PUT /expenses/:id` - Update expense
- `DELETE /expenses/:id` - Delete expense

### Reports
- `GET /get-summary` - Get daily/weekly/monthly summary
- `GET /reports/detailed` - Get detailed report
- `GET /reports/export` - Export data

### Staff
- `GET /staff` - List staff members
- `POST /staff` - Create staff member
- `PUT /staff/:id` - Update staff member
- `DELETE /staff/:id` - Delete staff member

### OCR
- `POST /upload` - Process receipt image

## 🔒 Security Features

- JWT token authentication
- Role-based API access control
- Input validation and sanitization
- XSS protection
- CORS configuration
- Rate limiting (recommended for production)

## 🚀 Production Deployment

1. Set up environment variables
2. Configure Firebase project for production
3. Enable security rules for Firestore
4. Set up monitoring and logging
5. Configure backup strategies
6. Implement rate limiting

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please create an issue in the repository or contact the development team.
