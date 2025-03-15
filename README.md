# FinTech React-PHP Application

A modern, full-stack fintech application built with React/TypeScript frontend and PHP Laravel backend.

## Features

- **User Authentication & Authorization**: Secure login, registration, and role-based access control
- **Dashboard**: Interactive financial dashboard with charts and analytics
- **Transaction Management**: Track, categorize, and analyze financial transactions
- **Account Management**: Manage multiple financial accounts
- **Budget Planning**: Create and track budgets
- **Investment Portfolio**: Track investments and performance
- **Secure API**: JWT-authenticated API endpoints
- **Responsive Design**: Mobile-friendly UI built with Material UI

## Tech Stack

### Frontend

- React with TypeScript
- Vite for build tooling
- Redux Toolkit for state management
- Material UI for component library
- Chart.js for data visualization
- React Router for navigation
- Formik & Yup for form handling and validation
- Axios for API requests

### Backend

- Laravel PHP framework
- Laravel Sanctum for API authentication
- JWT Auth for token-based authentication
- Spatie Permission for role management
- MySQL/PostgreSQL database

## Getting Started

### Prerequisites

- PHP 8.1+
- Composer
- Node.js 16+
- npm or yarn
- MySQL/PostgreSQL

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env file
# Then run migrations
php artisan migrate

# Generate JWT secret
php artisan jwt:secret

# Start the development server
php artisan serve
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

## API Documentation

The API documentation is available at `/api/documentation` when the backend server is running.

## Project Structure

### Backend

- `app/Models`: Database models
- `app/Http/Controllers`: API controllers
- `app/Http/Requests`: Form requests and validation
- `app/Services`: Business logic services
- `routes/api.php`: API routes
- `database/migrations`: Database migrations

### Frontend

- `src/components`: Reusable UI components
- `src/pages`: Application pages
- `src/services`: API service integrations
- `src/store`: Redux store configuration
- `src/hooks`: Custom React hooks
- `src/utils`: Utility functions
- `src/types`: TypeScript type definitions

## License

This project is licensed under the MIT License - see the LICENSE file for details.
