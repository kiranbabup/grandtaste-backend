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

pm2 list

netstat -tulpn

root@srv655793:~# 
cd /var/www/grandtaste-backend

root@srv655793:/var/www# git clone https://github.com/kiranbabup/grandtaste-backend.git
Cloning into 'grandtaste-backend'...
remote: Enumerating objects: 74, done.
remote: Counting objects: 100% (74/74), done.
remote: Compressing objects: 100% (52/52), done.
remote: Total 74 (delta 22), reused 69 (delta 17), pack-reused 0 (from 0)
Receiving objects: 100% (74/74), 75.13 KiB | 384.00 KiB/s, done.
Resolving deltas: 100% (22/22), done.

root@srv655793:/var/www/grandtaste-backend#

npm install
nano .env

nano /etc/nginx/sites-available/grandtaste-backend
server {
    listen 80;
    server_name gtapi.invtechnologies.in;

    location / {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
## Save:
CTRL+O → ENTER → CTRL+X
## Step 2: Enable site
ln -s /etc/nginx/sites-available/grandtaste-backend /etc/nginx/sites-enabled/
## Step 3: Test
nginx -t
## Step 4: Reload
systemctl reload nginx
## Step 5: SSL
certbot --nginx -d gtapi.invtechnologies.in

mysql -u root -p
USE grandtaste;
SELECT * FROM users;

node
const bcrypt = require('bcryptjs');
bcrypt.hashSync('9111111111', 10);

INSERT INTO users
(name, email, password, role, phone, referedby, referalcode, status, createdAt, updatedAt)
VALUES
(
'Santosh customer',
'customer@gmail.com',
'$2b$10$NwkhZ0M/WlHIAikTMmj4JOFJXB9SjZ606LbodzfQB667BEZNqcNQS',
'customer',
'7111111111',
'emp111ab',
'cus111ab',
'active',
NOW(),
NOW()
);

9111111111
8111111111
7111111111
123456
$2b$10$NwkhZ0M/WlHIAikTMmj4JOFJXB9SjZ606LbodzfQB667BEZNqcNQS

7894561230
Kiran@admin1

9638527410
SuperAdmin@gt1