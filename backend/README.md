# FinTec Laravel API Backend

This directory contains the backend API for the FinTec personal finance management platform, built with Laravel.

<p align="center">
  <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/laravel/laravel.png" width="100" alt="Laravel Logo">
</p>

## Technology Stack

-   **Laravel 12**: Latest version of the PHP framework for web applications
-   **PHP 8.2+**: Modern PHP with type declarations and improved performance
-   **MySQL**: Relational database for data storage
-   **JWT Authentication**: Secure API authentication using JSON Web Tokens
-   **Laravel Permission**: Role and permission management
-   **Eloquent ORM**: Expressive database interaction

## API Architecture

### Core Features

The API provides endpoints for managing:

-   **User Authentication**: Registration, login, profile management
-   **Accounts**: Bank account creation and management
-   **Transactions**: Financial transaction recording and analysis
-   **Budgets**: Budget creation and tracking
-   **Categories**: Custom categorization for transactions
-   **Investments**: Investment portfolio tracking
-   **Dashboard**: Aggregated financial data and statistics

### Project Structure

-   `app/Models/`: Eloquent models representing database entities
-   `app/Http/Controllers/API/`: API endpoint controllers
-   `app/Http/Requests/`: Form request validation classes
-   `app/Services/`: Business logic and service classes
-   `database/migrations/`: Database schema definitions
-   `database/seeders/`: Sample data generators
-   `routes/api.php`: API route definitions
-   `config/`: Application configuration files

### Database Schema

The application is built around these key models:

-   **User**: Core user account information
-   **Account**: Financial accounts (checking, savings, etc.)
-   **Transaction**: Income and expense records
-   **Category**: Transaction categorization
-   **Budget**: Spending limits by category or time period
-   **Investment**: Investment assets and performance tracking

### API Security

-   **JWT Authentication**: Secure token-based authentication
-   **CORS Configuration**: Cross-origin resource sharing settings
-   **Validation**: Request data validation using Form Request classes
-   **Authorization**: Policy-based access control for resources

## Development Setup

1. Install dependencies:

    ```
    composer install
    ```

2. Configure environment:

    ```
    cp .env.example .env
    php artisan key:generate
    ```

3. Set up the database:

    ```
    php artisan migrate
    php artisan db:seed
    ```

4. Generate JWT secret:

    ```
    php artisan jwt:secret
    ```

5. Start the development server:
    ```
    php artisan serve
    ```

## API Documentation

### Authentication Endpoints

-   `POST /api/register`: Create a new user account
-   `POST /api/login`: Authenticate and receive JWT token
-   `POST /api/logout`: Invalidate current token
-   `GET /api/profile`: Get current user profile
-   `PUT /api/profile`: Update user profile

### Resource Endpoints

-   **Accounts**

    -   `GET /api/accounts`: List user accounts
    -   `POST /api/accounts`: Create new account
    -   `GET /api/accounts/{id}`: View account details
    -   `PUT /api/accounts/{id}`: Update account
    -   `DELETE /api/accounts/{id}`: Delete account

-   **Transactions**

    -   `GET /api/transactions`: List transactions with filtering
    -   `POST /api/transactions`: Record new transaction
    -   `GET /api/transactions/{id}`: View transaction details
    -   `PUT /api/transactions/{id}`: Update transaction
    -   `DELETE /api/transactions/{id}`: Delete transaction

-   **Budgets**, **Categories**, and **Investments** follow similar RESTful patterns

### Dashboard Endpoints

-   `GET /api/dashboard/summary`: Financial overview statistics
-   `GET /api/dashboard/income-expense`: Income vs expense analysis
-   `GET /api/dashboard/category-breakdown`: Spending by category

## Design Decisions

-   **RESTful Architecture**: Consistent resource-based API design
-   **Eloquent Relationships**: Efficient data access through model relationships
-   **Repository Pattern**: Separation of data access from business logic
-   **Data Transformation**: Consistent API responses using resources
-   **Validation**: Request validation before processing
-   **Error Handling**: Standardized error responses
-   **Filtering & Pagination**: Efficient data retrieval
-   **Eager Loading**: Performance optimization for related data
