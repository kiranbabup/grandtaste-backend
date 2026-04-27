# Quick Reference Guide

## Essential Commands
*   **Start Dev Server:** `npm run dev`
*   **Install New Packages:** `npm install <package-name>`

## Main API Endpoints

### 👤 Users & Auth
*   `POST /api/users/register` - Hierarchical registration
*   `POST /api/users/login` - Login with Phone/Password
*   `GET /api/users/profile` - Get logged in user data

### 📦 Products
*   `GET /api/products/getProducts` - Paginated products
*   `POST /api/products/createProduct` - Create with Firebase Images (Admin)

### 🛒 Cart & Wishlist
*   `GET /api/cart/getCart`
*   `POST /api/cart/addToCart`
*   `GET /api/wishlist/getWishlist`

### 💰 Admin Dashboard & Earnings
*   `GET /api/admin/dashboard-stats` - Hierarchy-based stats
*   `GET /api/admin/monthly-income` - Sales chart data
*   `GET /api/admin/yearly-income` - Yearly chart data
*   `GET /api/admin/total-sale-report` - Summary by status
*   `GET /api/orders/userOrderEarning` - Personal referral earnings

## User Roles Hierarchy
1.  **superadmin**: Global control.
2.  **admin**: Branch manager (sees their tree).
3.  **supervisor**: Unit manager (sees their tree).
4.  **employee**: Staff member.
5.  **customer**: End user.
