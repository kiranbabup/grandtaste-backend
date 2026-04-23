# MongoDB to MySQL Conversion Summary

## Overview
Your GrandTaste backend has been successfully converted from MongoDB with Mongoose to MySQL with Sequelize ORM. This conversion makes it fully compatible with Hostinger VPS environments.

---

## Files Modified

### 1. **package.json**
**Changes:**
- Removed: `mongoose: ^9.2.1`
- Added: `sequelize: ^6.35.2`, `mysql2: ^3.6.5`

**Impact:** New ORM and MySQL driver dependencies installed

---

### 2. **config/db.js**
**Before:** MongoDB connection with Mongoose
**After:** Sequelize MySQL connection pool
**Key Features:**
- Auto table synchronization on startup
- Connection pooling for better performance
- UTF-8 support for international characters

---

### 3. **Models** - Complete Conversion

#### **models/User.js**
**Changes:**
- Mongoose Schema → Sequelize define()
- Password hashing moved to beforeCreate/beforeUpdate hooks
- ID field: `_id` (string) → `id` (integer, auto-increment)
- Addresses stored as JSON instead of nested array

**SQL Table Structure:**
```sql
users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(50),
  phone VARCHAR(20),
  details JSON,
  addresses JSON,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)
```

#### **models/Product.js**
**Changes:**
- Simplified model structure
- Price stored as DECIMAL(10,2) for accuracy
- Images stored as JSON array

**SQL Table Structure:**
```sql
products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  price DECIMAL(10,2),
  description TEXT,
  image VARCHAR(255),
  images JSON,
  category VARCHAR(100),
  discount DECIMAL(10,2),
  stock INT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)
```

#### **models/Cart.js**
**Changes:**
- **NEW:** Separate CartItem model (one-to-many relationship)
- Cart stores user reference only
- CartItems contain individual product quantities

**SQL Table Structures:**
```sql
carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
)

cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cartId INT,
  productId INT,
  qty INT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  FOREIGN KEY (cartId) REFERENCES carts(id),
  FOREIGN KEY (productId) REFERENCES products(id)
)
```

#### **models/Order.js**
**Changes:**
- **NEW:** Separate OrderItem model (one-to-many relationship)
- Status field uses MySQL ENUM for better performance
- Shipping address stored as JSON

**SQL Table Structures:**
```sql
orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  shippingAddress JSON,
  phone VARCHAR(20),
  paymentMethod VARCHAR(100),
  totalPrice DECIMAL(10,2),
  isPaid BOOLEAN,
  isDelivered BOOLEAN,
  status ENUM('Pending','Accepted','Shipped','Out for Delivery','Delivered','Rejected','Cancelled'),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
)

order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT,
  productId INT,
  name VARCHAR(255),
  qty INT,
  price DECIMAL(10,2),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id),
  FOREIGN KEY (productId) REFERENCES products(id)
)
```

---

### 4. **Controllers** - Query Syntax Changes

#### **controllers/userController.js**
**Before → After:**
- `User.findOne({ email })` → `User.findOne({ where: { email } })`
- `User.findById(id)` → `User.findByPk(id)`
- `user._id` → `user.id`
- Password hashing moved to model hooks

#### **controllers/productController.js**
**Before → After:**
- `Product.find()` → `Product.findAll()`
- `Product.findById(id)` → `Product.findByPk(id)`
- `product.save()` → `product.update()` and `product.destroy()`
- `Object.assign()` → `product.update()`

#### **controllers/cartController.js**
**Major Changes:**
- Cart items now queried separately using includes/associations
- Item addition creates CartItem record instead of pushing to array
- Item removal uses CartItem.destroy()

**Example Query Structure:**
```javascript
// Before (MongoDB)
Cart.findOne({ user: userId }).populate("items.product")

// After (Sequelize)
Cart.findOne({
  where: { userId },
  include: {
    model: CartItem,
    as: "items",
    include: { model: Product, as: "product" }
  }
})
```

#### **controllers/orderController.js**
**Major Changes:**
- Order items created separately as OrderItem records
- Order creation now requires loop to add each item
- Relationships populated using includes instead of populate()

---

### 5. **Middleware**

#### **middleware/authMiddleware.js**
**Changes:**
- `User.findById(decoded.id)` → `User.findByPk(decoded.id, { attributes: { exclude: ["password"] } })`
- MongoDB ObjectId → MySQL integer ID

---

### 6. **Routes**

#### **routes/adminRoutes.js**
**Changes:**
- `Order.find({ status: "Delivered" })` → `Order.findAll({ where: { status: "Delivered" } })`
- `Order.countDocuments()` → `Order.count()`
- `User.find({ role: 'admin' })` → `User.findAll({ where: { role: 'admin' } })`

---

### 7. **.env Configuration**

**Removed:**
```
MONGO_URI=mongodb+srv://...
```

**Added:**
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=grandtaste
```

---

## Key Advantages of This Conversion

### ✅ **Performance**
- Faster query execution for relational data
- Better index support
- Connection pooling built-in

### ✅ **Reliability**
- ACID transactions support
- Foreign key constraints
- Data consistency guaranteed

### ✅ **Scalability**
- Better suited for large datasets
- Easier to optimize with indexes
- SQL query optimization tools available

### ✅ **Cost**
- MySQL included in most hosting plans (including Hostinger)
- Lower database size for structured data

### ✅ **Compatibility**
- Works on any standard hosting provider
- Easy backups and migrations
- Wide tool support

---

## Migration Notes

### 1. **User IDs**
- Old: MongoDB ObjectId (24-char hex string)
- New: MySQL auto-increment integer
- **Important:** Update any frontend code that depends on ID format

### 2. **Array Fields**
- Orders, Addresses, and Cart items now use proper table relationships
- JSON storage used for flexibility where needed

### 3. **Timestamps**
- Both still have createdAt and updatedAt
- MySQL TIMESTAMP type used (auto-managed by Sequelize)

### 4. **Query Performance**
- Foreign keys enable faster joins
- Consider adding indexes for:
  - `users.email`
  - `users.phone`
  - `orders.userId`
  - `orders.status`

---

## Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Profile update works
- [ ] Product listing works
- [ ] Product creation/update works
- [ ] Add to cart works
- [ ] Cart retrieval works
- [ ] Create order works
- [ ] Order history works
- [ ] Admin endpoints work
- [ ] Google OAuth works
- [ ] File uploads to Cloudinary work

---

## Database Indexes (Recommended)

Add these indexes for better performance:

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_orders_userId ON orders(userId);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_cart_items_cartId ON cart_items(cartId);
CREATE INDEX idx_order_items_orderId ON order_items(orderId);
```

---

## Rollback Plan

If you need to revert to MongoDB:
1. Keep the old code in a separate branch
2. Keep database backups from both systems
3. Update models/controllers back to Mongoose syntax
4. Update .env to use MONGO_URI

---

## Next Steps

1. **Development:** Test all endpoints locally
2. **Staging:** Deploy to staging environment first
3. **Production:** Deploy to Hostinger VPS (see DEPLOYMENT_GUIDE.md)
4. **Monitoring:** Set up error tracking and logging
5. **Optimization:** Add database indexes and cache layers as needed

---

## Common Issues & Solutions

### Issue: "Unknown column 'id'"
**Solution:** Delete existing tables and restart app (Sequelize will recreate them)

### Issue: "Foreign key constraint fails"
**Solution:** Ensure related records exist before inserting

### Issue: "Sequelize is not defined"
**Solution:** Check that Sequelize is imported in each file that needs it

### Issue: "Decimal values become strings"
**Solution:** Parse price values as floats in frontend: `parseFloat(price)`

---

For questions or issues, refer to:
- Sequelize Docs: https://sequelize.org
- MySQL Docs: https://dev.mysql.com/doc
- Hostinger Support: https://www.hostinger.com/support
