# Deployment Guide

Follow these steps to get your GrandTaste Backend up and running.

## Prerequisites
1.  **Node.js** installed (v16 or higher).
2.  **MySQL Server** installed (e.g., via MySQL Workbench, XAMPP, or WAMP).

## Step 1: Database Setup
1.  Open **MySQL Workbench** or any MySQL terminal.
2.  Run the following command to create your database:
    ```sql
    CREATE DATABASE grandtaste;
    ```

USE grandtaste;
UPDATE users SET email = 'superadmin@grandtaste.com' WHERE phone = '9638527410';


## Step 2: Environment Configuration
1.  Open the `.env` file in the project root.
2.  Ensure the following variables match your MySQL setup:
    ```env
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=your_mysql_password
    DB_NAME=grandtaste
    ```
3.  Add your **Firebase Service Account JSON** and **Storage Bucket** values as instructed previously.

## Step 3: Install Dependencies
Open your **PowerShell** or **Terminal** in the project directory and run:
```powershell
npm install
```

## Step 4: Run the Backend & Create Tables
Since the project uses Sequelize with `alter: true`, the tables are created automatically the first time you run the server.
In your terminal, run:
```powershell
npm run dev
```

### Verification
If you see **"MySQL Connected"** in your console, it means your tables have been successfully created! You can now check MySQL Workbench to see the `users`, `products`, `orders`, `carts`, and `wishlists` tables.

---

## Step 5: (Optional) Seeding the Superadmin
Since the system is hierarchical, you need at least one **Superadmin** to start registering others. You can manually change the `role` of the first registered user to `superadmin` in the database.

