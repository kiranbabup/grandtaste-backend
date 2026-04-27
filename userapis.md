# User API Documentation

This document explains all the user-related API endpoints in the backend and provides examples of how to call them from your frontend application.

## Base URL
All routes are relative to your backend base URL, typically `http://localhost:5000/api/users`.

---

## 1. Authentication & Registration

### Register a User
Create a new user in the hierarchy.
- **Endpoint:** `POST /register`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "password": "Password123!",
    "phone": "1234567890",
    "referedby": "abc123ab"
  }
  ```
  *(Note: You do **not** pass a `role`. The role is strictly assigned based on who referred the user. E.g., An Admin's referral code creates a Supervisor. An Employee's referral code creates a Customer. `referedby` is strictly required.)*

### Login
Log in using phone number and password.
- **Endpoint:** `POST /login`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "phone": "1234567890",
    "password": "Password123!"
  }
  ```
- **Response:** Returns user details along with a `token` which you must save (e.g., in `localStorage`) and send in subsequent requests.

### Google Login
Log in using a Google ID token. This only works if the user has already updated their email address in their profile.
- **Endpoint:** `POST /google`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "token": "GOOGLE_ID_TOKEN_STRING"
  }
  ```

---

## 2. Personal Profile (The logged-in user)

### Get My Profile
Gets the profile of the currently logged-in user based on their token.
- **Endpoint:** `GET /profile`
- **Auth Required:** Yes (Bearer Token)

### Update My Profile
Updates the profile of the currently logged-in user.
- **Endpoint:** `PUT /profile`
- **Auth Required:** Yes (Bearer Token)
- **Request Body:** Only send the fields you want to update.
  ```json
  {
    "name": "John Doe Updated",
    "email": "johndoe@gmail.com"
  }
  ```

---

## 3. Hierarchy & Admin Controls

### Get All Users (Paginated)
Fetch all users in the system.
- **Endpoint:** `GET /getUsers?page=1&limit=10`
- **Auth Required:** Yes (Bearer Token)

### Search Users by String (Paginated)
Search across name, email, and phone fields.
- **Endpoint:** `GET /getUserbySearchByString/:searchString?page=1&limit=10`
- **Auth Required:** Yes (Bearer Token)

### Get Users by Role (Paginated)
Fetch users that have a specific role (e.g., all 'employees' or all 'customers').
- **Endpoint:** `GET /getUsersByRole/:role?page=1&limit=10`
- **Auth Required:** Yes (Bearer Token)

### Get User by Referral Code
Lookup a specific user using their unique referral code.
- **Endpoint:** `GET /getUserByReferalCode/:referalcode`
- **Auth Required:** Yes (Bearer Token)

### Get My Referrals (Paginated)
Fetch all users that were referred by a specific code (i.e., people who signed up using this code).
- **Endpoint:** `GET /getUsersByReferalCode/:referalcode?page=1&limit=10`
- **Auth Required:** Yes (Bearer Token)

### Update Any User by ID
Update any user's data. Only the fields sent in the request will be changed.
- **Endpoint:** `PUT /updateUserById/:id`
- **Auth Required:** Yes (Bearer Token)
- **Request Body:** 
  ```json
  {
    "status": "inactive",
    "role": "supervisor"
  }
  ```
---

## Frontend Integration Example

Here is how you can set up a generic API call in your frontend using modern JavaScript (`fetch`).

```javascript
// Example frontend service for making API calls

const API_BASE_URL = 'http://localhost:5000/api/users';

// Helper to get the auth token from local storage
const getAuthHeaders = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  return {
    'Content-Type': 'application/json',
    Authorization: userInfo && userInfo.token ? `Bearer ${userInfo.token}` : '',
  };
};

// 1. Example: Login
export const login = async (phone, password) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  
  // Save to local storage for future requests
  localStorage.setItem('userInfo', JSON.stringify(data));
  return data;
};

// 2. Example: Get Users with Pagination
export const fetchUsers = async (page = 1, limit = 10) => {
  const response = await fetch(`${API_BASE_URL}/getUsers?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  
  // Returns { totalItems, users, totalPages, currentPage }
  return data; 
};

// 3. Example: Update an employee's status
export const updateUserStatus = async (userId, newStatus) => {
  const response = await fetch(`${API_BASE_URL}/updateUserById/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status: newStatus })
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  
  return data;
};
```
