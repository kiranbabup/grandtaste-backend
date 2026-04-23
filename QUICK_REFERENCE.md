# Quick Reference Guide - MySQL Backend

## Pre-Deployment Checklist

```bash
# 1. Install dependencies
npm install

# 2. Update .env with your credentials
nano .env
# Edit these:
# DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
# JWT_SECRET, GOOGLE_CLIENT_ID
# CLOUDINARY_* credentials

# 3. Test locally
npm start
# Should show:
# - MySQL Connected
# - Server running on http://localhost:5000

# 4. Stop server
Ctrl + C
```

---

## Hostinger VPS Setup (Quick Steps)

```bash
# SSH into your VPS
ssh user@your_vps_ip

# 1. Clone or upload your repository
git clone your_repo_url
cd grandtaste-backend

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install project dependencies
npm install

# 4. Configure environment
nano .env

# 5. Install PM2
sudo npm install -g pm2

# 6. Start your backend
pm2 start index.js --name "grandtaste-api"
pm2 save
pm2 startup

# 7. Install Nginx
sudo apt-get install -y nginx

# 8. Create Nginx config (see DEPLOYMENT_GUIDE.md)
sudo nano /etc/nginx/sites-available/grandtaste

# 9. Enable and test Nginx
sudo ln -s /etc/nginx/sites-available/grandtaste /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 10. Optional: Setup SSL
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

---

## Frequently Used Commands

### PM2 Commands
```bash
pm2 list              # Show all processes
pm2 start index.js --name "grandtaste-api"
pm2 stop grandtaste-api
pm2 restart grandtaste-api
pm2 delete grandtaste-api
pm2 logs grandtaste-api              # View logs
pm2 logs grandtaste-api --err        # View errors only
pm2 monit             # Monitor in real-time
pm2 save              # Save current process list
pm2 startup           # Start PM2 on boot
```

### Database Commands
```bash
# Connect to MySQL
mysql -h your_host -u your_user -p your_password

# Inside MySQL
show databases;
use grandtaste;
show tables;
describe users;  # View table structure

# Check row counts
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM products;

# Backup database
mysqldump -h localhost -u user -p database > backup.sql

# Restore database
mysql -h localhost -u user -p database < backup.sql
```

### Nginx Commands
```bash
sudo systemctl status nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo nginx -t                    # Test configuration
sudo tail -f /var/log/nginx/error.log  # View error logs
sudo tail -f /var/log/nginx/access.log # View access logs
```

### Node.js/npm Commands
```bash
npm install            # Install dependencies
npm update            # Update packages
npm audit             # Check for vulnerabilities
npm audit fix         # Fix vulnerabilities
npm start             # Start server
npm list              # List installed packages
```

---

## API Endpoints Reference

### Users
```
POST   /api/users/register          - Register new user
POST   /api/users/login             - Login user
POST   /api/users/google-auth       - Google OAuth login
GET    /api/users/profile           - Get user profile (protected)
PUT    /api/users/profile           - Update profile (protected)
```

### Products
```
GET    /api/products                - Get all products
GET    /api/products/:id            - Get single product
POST   /api/products                - Create product (admin)
PUT    /api/products/:id            - Update product (admin)
DELETE /api/products/:id            - Delete product (admin)
```

### Cart
```
GET    /api/cart/:userId            - Get user's cart
POST   /api/cart/:userId            - Add to cart
DELETE /api/cart/:userId/:productId - Remove from cart
DELETE /api/cart/:userId/clear      - Clear cart
```

### Orders
```
POST   /api/orders                  - Create order (protected)
GET    /api/orders/my-orders        - Get user's orders (protected)
GET    /api/orders/:id              - Get order details (protected)
GET    /api/orders                  - Get all orders (admin)
PUT    /api/orders/:id/status       - Update order status (admin)
```

### Admin
```
GET    /api/admin/monthly-income    - Get income stats (admin)
GET    /api/admin/all-admins        - Get all admins (admin)
GET    /api/admin/all-supervisors   - Get all supervisors (admin)
GET    /api/admin/all-employees     - Get all employees (admin)
```

---

## Testing API with cURL

```bash
# Get all products
curl http://localhost:5000/api/products

# Register user
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "9876543210"
  }'

# Login user
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Get user profile (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/users/profile

# Create product (admin only)
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "Robot Toy",
    "price": 99.99,
    "category": "robots",
    "stock": 50
  }'
```

---

## Environment Variables Template

```env
# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=grandtaste

# Server
NODE_ENV=production
PORT=5000

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# JWT Authentication
JWT_SECRET=your_very_secure_jwt_secret_key_minimum_32_chars

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Monitoring & Logging

### Check Server Status
```bash
# CPU, Memory, Disk usage
df -h
free -h
top

# Network connections
netstat -an | grep 5000
lsof -i :5000

# Process resource usage
ps aux | grep node
```

### View Application Logs
```bash
pm2 logs grandtaste-api
pm2 logs grandtaste-api --lines 50 --err

# View system logs
journalctl -u grandtaste-api -f
```

### Check Database Connectivity
```bash
# From VPS
mysql -h DB_HOST -u DB_USER -p

# Test connection timeout
nc -zv DB_HOST 3306
```

---

## Troubleshooting

### Port 5000 Already in Use
```bash
sudo lsof -i :5000
sudo kill -9 <PID>
```

### MySQL Connection Refused
```bash
# Check if MySQL is running
sudo systemctl status mysql
sudo systemctl start mysql

# Check if port is open
sudo ufw allow 3306
```

### Nginx 502 Bad Gateway
```bash
# Check if backend is running
pm2 list

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart backend
pm2 restart grandtaste-api
```

### High Memory Usage
```bash
# Check Node.js memory leak
pm2 monit

# Restart process
pm2 restart grandtaste-api

# Update dependencies
npm update
npm audit fix
```

### Database Tables Not Created
```bash
# Check if db.sync() ran successfully
pm2 logs grandtaste-api

# Manually create tables (if needed)
mysql -h host -u user -p database < schema.sql
```

---

## Performance Optimization

### Add Database Indexes
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_orders_userId ON orders(userId);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_cart_items_cartId ON cart_items(cartId);
CREATE INDEX idx_order_items_orderId ON order_items(orderId);
```

### Enable Gzip Compression in Nginx
```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_min_length 1000;
```

### Increase PM2 Instances
```bash
pm2 start index.js --name "grandtaste-api" -i max  # Use all CPU cores
```

---

## Security Checklist

- [ ] JWT_SECRET is strong (32+ characters, mix of characters)
- [ ] .env file has correct permissions: `chmod 600 .env`
- [ ] Database password is strong
- [ ] HTTPS/SSL is enabled
- [ ] Firewall only allows necessary ports (22, 80, 443)
- [ ] Dependencies are up-to-date: `npm audit`
- [ ] Sensitive data not logged: `console.log(password)` removed
- [ ] CORS origins restricted to your domain
- [ ] Admin authentication checked on all admin routes
- [ ] Input validation implemented
- [ ] Rate limiting configured (optional)

---

## Regular Maintenance

```bash
# Weekly
npm audit
pm2 logs grandtaste-api | grep ERROR

# Monthly
npm update
mysqldump -h host -u user -p database > backup_$(date +%Y%m%d).sql

# Quarterly
Review logs for errors
Check performance metrics
Update OS packages: sudo apt update && sudo apt upgrade
```

---

## Support Resources

- **Sequelize:** https://sequelize.org/master/
- **MySQL:** https://dev.mysql.com/doc/
- **Express.js:** https://expressjs.com/
- **PM2:** https://pm2.keymetrics.io/
- **Nginx:** https://nginx.org/en/docs/
- **Hostinger:** https://www.hostinger.com/help

---

## Still Having Issues?

1. Check `pm2 logs grandtaste-api --err`
2. Review `CONVERSION_SUMMARY.md` for model changes
3. Verify `.env` configuration
4. Test database connection
5. Check Nginx configuration with `sudo nginx -t`
6. Review firewall rules with `sudo ufw status`
