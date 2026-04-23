# GrandTaste Backend - MySQL Deployment Guide for Hostinger VPS

## Overview
This backend has been converted from MongoDB to MySQL using Sequelize ORM. Follow this guide to deploy it on your Hostinger VPS.

---

## Prerequisites
- Hostinger VPS account with SSH access
- Node.js 16+ and npm installed on VPS
- MySQL/MariaDB database (provided by Hostinger)
- Domain name (optional but recommended)

---

## Step 1: Connect to Your VPS

```bash
ssh user@your_vps_ip
# Enter your password when prompted
```

---

## Step 2: Install Dependencies

### Install Node.js and npm (if not already installed)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### Install MySQL Client (if not already installed)
```bash
sudo apt-get update
sudo apt-get install -y mysql-client
```

---

## Step 3: Upload Your Backend Code

### Option A: Using Git
```bash
cd ~
git clone https://github.com/your-repo/grandtaste-backend.git
cd grandtaste-backend
npm install
```

### Option B: Using SCP/SFTP
Upload your entire project folder to your VPS home directory using an SFTP client.

```bash
cd ~/grandtaste-backend
npm install
```

---

## Step 4: Create and Configure MySQL Database

### Access MySQL
```bash
mysql -h your_mysql_host -u your_username -p
# Enter your MySQL password
```

### Create Database
```sql
CREATE DATABASE grandtaste CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE grandtaste;
EXIT;
```

---

## Step 5: Configure Environment Variables

Edit the `.env` file with your actual database credentials:

```bash
nano .env
```

Update these variables:

```env
# Database Configuration
DB_HOST=your_mysql_host           # e.g., localhost or your Hostinger MySQL host
DB_PORT=3306
DB_USER=your_mysql_username       # Your MySQL username
DB_PASSWORD=your_mysql_password   # Your MySQL password
DB_NAME=grandtaste

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Authentication
JWT_SECRET=your_secure_jwt_secret_key_change_this

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

Save and exit: `CTRL + X`, then `Y`, then `ENTER`

---

## Step 6: Test the Backend Locally

```bash
npm start
# Should output: Server running on http://localhost:5000
# And: MySQL Connected
```

If you see errors, check:
- Database credentials in `.env`
- MySQL is running and accessible
- All ports are correct

Stop the server: `CTRL + C`

---

## Step 7: Install PM2 for Process Management

```bash
sudo npm install -g pm2
pm2 startup
pm2 save
```

---

## Step 8: Start Backend with PM2

```bash
pm2 start index.js --name "grandtaste-api"
pm2 save
pm2 status
```

View logs:
```bash
pm2 logs grandtaste-api
```

---

## Step 9: Configure Nginx as Reverse Proxy

### Install Nginx
```bash
sudo apt-get install -y nginx
```

### Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/grandtaste
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    # For SSL (recommended)
    # listen 443 ssl;
    # ssl_certificate /path/to/certificate.crt;
    # ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Save and exit: `CTRL + X`, then `Y`, then `ENTER`

### Enable the Configuration
```bash
sudo ln -s /etc/nginx/sites-available/grandtaste /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 10: Set Up SSL Certificate (Recommended)

### Install Certbot
```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### Generate SSL Certificate
```bash
sudo certbot --nginx -d your_domain.com -d www.your_domain.com
```

Follow the prompts to secure your domain with HTTPS.

---

## Step 11: Configure Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## Step 12: Update Frontend Configuration

Update your frontend's API base URL to point to your backend:

```javascript
// In your frontend config
const API_BASE_URL = 'https://your_domain.com/api';
```

Update `ALLOWED_ORIGINS` in backend `.env` to match your frontend domain.

---

## Database Schema Information

The following tables will be automatically created:

- `users` - User accounts with roles
- `products` - Product catalog
- `carts` - Shopping carts
- `cart_items` - Cart line items
- `orders` - Customer orders
- `order_items` - Order line items

---

## Backup and Maintenance

### Backup Database
```bash
mysqldump -h your_host -u your_user -p your_password grandtaste > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database
```bash
mysql -h your_host -u your_user -p your_password grandtaste < backup_file.sql
```

### View PM2 Logs
```bash
pm2 logs grandtaste-api --lines 100
```

### Restart Backend
```bash
pm2 restart grandtaste-api
```

---

## Troubleshooting

### Database Connection Error
- Verify credentials in `.env`
- Check if MySQL is running: `mysql -u root -p`
- Verify firewall allows MySQL port

### Port Already in Use
```bash
sudo lsof -i :5000
sudo kill -9 <PID>
```

### Nginx Not Working
```bash
sudo systemctl status nginx
sudo journalctl -n 50 -u nginx
```

### Check PM2 Logs
```bash
pm2 logs grandtaste-api --err
```

---

## Useful Commands

```bash
# View running processes
pm2 list

# Monitor processes
pm2 monit

# Restart specific process
pm2 restart grandtaste-api

# Stop process
pm2 stop grandtaste-api

# Start process
pm2 start index.js --name "grandtaste-api"

# Update and restart
git pull origin main
npm install
pm2 restart grandtaste-api
```

---

## Key Changes from MongoDB to MySQL

1. **User ID Format**: Changed from MongoDB ObjectId to MySQL auto-increment integer
2. **Query Syntax**: All Mongoose queries converted to Sequelize
3. **Array Storage**: MongoDB arrays (items, addresses) now stored as JSON in MySQL
4. **Relationships**: Proper foreign keys used instead of nested documents
5. **Performance**: Consider adding database indexes for frequent queries

---

## Security Best Practices

1. ✅ Use strong JWT_SECRET
2. ✅ Enable HTTPS/SSL
3. ✅ Keep dependencies updated: `npm audit fix`
4. ✅ Set proper file permissions: `chmod 600 .env`
5. ✅ Use environment variables for sensitive data
6. ✅ Enable firewall rules
7. ✅ Regularly backup database
8. ✅ Monitor logs for suspicious activity

---

## Next Steps

1. Test all API endpoints thoroughly
2. Set up monitoring and alerting
3. Configure automated backups
4. Monitor server resources (CPU, RAM, Disk)
5. Plan for scaling if needed

For support, contact Hostinger support or refer to the Sequelize documentation.
