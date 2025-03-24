# FinTec React Frontend

This directory contains the frontend application for the FinTec personal finance management platform, built with React, TypeScript, and Material UI.

## Technology Stack

- **React 19**: Latest version of the React library for building user interfaces
- **TypeScript**: For type-safe code and better developer experience
- **Vite**: Fast, modern frontend build tool
- **Redux Toolkit**: State management solution
- **Material UI 6**: Comprehensive UI component library
- **React Router 7**: Declarative routing for React
- **Axios**: Promise-based HTTP client
- **Formik & Yup**: Form handling and validation
- **Chart.js & React-Chartjs-2**: Data visualization
- **JWT Authentication**: Secure authentication flow

## Application Architecture

### Core Features

The application provides comprehensive personal finance management tools including:

- **Dashboard**: Overview of financial status with charts and summaries
- **Accounts**: Manage bank accounts and track balances
- **Transactions**: Record, categorize, and analyze income and expenses
- **Budgets**: Create and monitor monthly or category-based budgets
- **Investments**: Track investment portfolio performance
- **Categories**: Customize transaction categories for better organization
- **User Profile**: Manage user information and settings

### Project Structure

- `src/components/`: Reusable UI components
- `src/pages/`: Main application views
- `src/services/`: API service layer and utilities
- `src/store/`: Redux state management
  - `src/store/slices/`: Feature-specific Redux slices
- `src/assets/`: Static assets like images
- `src/theme.ts`: Material UI theme customization

### State Management

The application uses Redux Toolkit with a slice-based architecture:

- `authSlice`: Authentication state
- `accountSlice`: User accounts management
- `transactionSlice`: Financial transactions
- `budgetSlice`: Budget tracking
- `categorySlice`: Transaction categories
- `investmentSlice`: Investment tracking

### API Integration

The frontend communicates with the Laravel backend API using axios. The `api.ts` service provides:

- Centralized API configuration
- JWT token management
- Request/response interceptors for authentication
- Automatic handling of expired tokens

## Development Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Configure environment variables:
   Create a `.env` file with:

   ```
   VITE_API_URL=http://localhost:8000/api
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Production Deployment

The application is configured for easy deployment on platforms like Heroku or Vercel:

1. Build the production bundle:

   ```
   npm run build
   ```

2. Serve the static files:
   ```
   npm start
   ```

## Design Decisions

- **Component Architecture**: Modular components designed for reusability
- **Responsive Design**: Mobile-first approach ensuring great UX across devices
- **Theme Customization**: Material UI theming for consistent visual identity
- **Form Validation**: Client-side validation using Yup schemas
- **Data Visualization**: Interactive charts for financial insights
- **Authentication Flow**: Protected routes with JWT token management
- **Error Handling**: Comprehensive error handling with user-friendly notifications
- **TypeScript Integration**: Strong typing throughout for improved code quality
