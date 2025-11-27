# Lost & Found UII - API Specification

> Dokumentasi API untuk integrasi Frontend Angular dengan Backend
> 
> **Version:** 1.0.0  
> **Last Updated:** 27 November 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Items API](#items-api)
4. [Users API](#users-api)
5. [Upload API](#upload-api)
6. [Notifications API](#notifications-api)
7. [Data Models](#data-models)
8. [Error Handling](#error-handling)

---

## Overview

### Base URL
```
Production: https://api.lostfound-uii.com/v1
Development: http://localhost:3000/api/v1
```

### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>  // Required for protected routes
```

### Response Format
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

---

## Authentication

### 1. Login
Login menggunakan email. Badge ditentukan otomatis berdasarkan domain email.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@students.uii.ac.id"
}
```

**Badge Logic:**
| Email Domain | Badge | Role |
|--------------|-------|------|
| `@students.uii.ac.id` | `blue` | `student` |
| `@uii.ac.id` | `gold` | `staff` |
| Other | `gray` | `public` |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "user_123",
      "name": "Ahmad Fauzi",
      "email": "ahmad@students.uii.ac.id",
      "phone": "081234567890",
      "avatar": "https://storage.example.com/avatars/user_123.jpg",
      "badge": "blue",
      "role": "student",
      "faculty": "Fakultas Teknologi Industri",
      "studentId": "20523001"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Email tidak valid",
  "error": {
    "code": "INVALID_EMAIL"
  }
}
```

---

### 2. Get Current User
Mendapatkan data user yang sedang login.

**Endpoint:** `GET /auth/me`

**Headers:** `Authorization: Bearer <token>` *(required)*

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "name": "Ahmad Fauzi",
      "email": "ahmad@students.uii.ac.id",
      "phone": "081234567890",
      "avatar": "https://storage.example.com/avatars/user_123.jpg",
      "badge": "blue",
      "role": "student",
      "faculty": "Fakultas Teknologi Industri",
      "studentId": "20523001"
    }
  }
}
```

---

### 3. Logout
**Endpoint:** `POST /auth/logout`

**Headers:** `Authorization: Bearer <token>` *(required)*

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

---

## Items API

### 1. Get All Items (with filters)
Mendapatkan daftar barang dengan filter dan pagination.

**Endpoint:** `GET /items`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter: `lost`, `found`, `claimed` |
| `category` | string | No | Filter: `bags`, `wallet`, `phone`, `electronics`, `documents`, `keys`, `clothing`, `others` |
| `search` | string | No | Search by title or description |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 10, max: 50) |
| `sortBy` | string | No | Sort field: `createdAt`, `date` (default: `createdAt`) |
| `sortOrder` | string | No | `asc` or `desc` (default: `desc`) |

**Example Request:**
```
GET /items?status=lost&category=electronics&search=laptop&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "item_001",
        "title": "Laptop ASUS ROG",
        "description": "Laptop gaming warna hitam dengan sticker UII",
        "category": "electronics",
        "status": "lost",
        "imageUrl": "https://storage.example.com/items/item_001.jpg",
        "date": "25 Nov",
        "time": "14:30",
        "location": {
          "lat": -7.686944,
          "lng": 110.409167,
          "name": "Gedung FTI"
        },
        "reporterId": "user_123",
        "reporterName": "Ahmad Fauzi",
        "reporterBadge": "blue",
        "reporterPhone": "081234567890",
        "reward": true,
        "urgency": "very-important",
        "createdAt": "2025-11-25T07:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

---

### 2. Get Item by ID
Mendapatkan detail satu barang.

**Endpoint:** `GET /items/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "item": {
      "id": "item_001",
      "title": "Laptop ASUS ROG",
      "description": "Laptop gaming warna hitam dengan sticker UII di cover. Hilang di lab komputer lantai 3 setelah jam kuliah.",
      "category": "electronics",
      "status": "lost",
      "imageUrl": "https://storage.example.com/items/item_001.jpg",
      "date": "25 Nov",
      "time": "14:30",
      "location": {
        "lat": -7.686944,
        "lng": 110.409167,
        "name": "Gedung FTI"
      },
      "reporterId": "user_123",
      "reporterName": "Ahmad Fauzi",
      "reporterBadge": "blue",
      "reporterPhone": "081234567890",
      "reward": true,
      "urgency": "very-important",
      "createdAt": "2025-11-25T07:30:00.000Z",
      "updatedAt": "2025-11-25T07:30:00.000Z"
    }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Barang tidak ditemukan",
  "error": {
    "code": "ITEM_NOT_FOUND"
  }
}
```

---

### 3. Create Item
Membuat laporan barang baru (hilang/ditemukan).

**Endpoint:** `POST /items`

**Headers:** `Authorization: Bearer <token>` *(required)*

**Request Body (Lost Item):**
```json
{
  "title": "Dompet Kulit Coklat",
  "description": "Dompet kulit coklat merk Hush Puppies, berisi KTP dan kartu ATM BCA",
  "category": "wallet",
  "status": "lost",
  "imageUrl": "https://storage.example.com/items/temp_123.jpg",
  "date": "2025-11-27",
  "time": "10:30",
  "location": {
    "lat": -7.687500,
    "lng": 110.410000,
    "name": "Perpustakaan Pusat"
  },
  "reward": true,
  "urgency": "important"
}
```

**Request Body (Found Item):**
```json
{
  "title": "Kunci Motor Honda",
  "description": "Ditemukan kunci motor Honda dengan gantungan kunci biru",
  "category": "keys",
  "status": "found",
  "imageUrl": "https://storage.example.com/items/temp_456.jpg",
  "date": "2025-11-27",
  "time": "09:00",
  "location": {
    "lat": -7.686000,
    "lng": 110.408500,
    "name": "Masjid Ulil Albab"
  },
  "storageLocation": "entrusted",
  "entrustedTo": "Security Gedung FTI a/n Pak Budi",
  "willingToDeliver": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Laporan berhasil dibuat",
  "data": {
    "item": {
      "id": "item_new_001",
      "title": "Dompet Kulit Coklat",
      "description": "Dompet kulit coklat merk Hush Puppies...",
      "category": "wallet",
      "status": "lost",
      "reporterId": "user_123",
      "reporterName": "Ahmad Fauzi",
      "reporterBadge": "blue",
      "createdAt": "2025-11-27T03:30:00.000Z"
    }
  }
}
```

---

### 4. Update Item
Update item (misalnya ubah status ke `claimed`).

**Endpoint:** `PUT /items/:id`

**Headers:** `Authorization: Bearer <token>` *(required)*

**Request Body:**
```json
{
  "status": "claimed"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Laporan berhasil diupdate",
  "data": {
    "item": {
      "id": "item_001",
      "status": "claimed",
      "updatedAt": "2025-11-27T10:00:00.000Z"
    }
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Anda tidak memiliki akses untuk mengubah laporan ini",
  "error": {
    "code": "FORBIDDEN"
  }
}
```

---

### 5. Delete Item
Hapus laporan (hanya bisa oleh pemilik laporan).

**Endpoint:** `DELETE /items/:id`

**Headers:** `Authorization: Bearer <token>` *(required)*

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Laporan berhasil dihapus"
}
```

---

### 6. Get Similar Items (for suggestions)
Mencari barang serupa untuk fitur suggestion saat membuat laporan kehilangan.

**Endpoint:** `GET /items/similar`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Judul barang yang dicari |
| `description` | string | No | Deskripsi barang |
| `category` | string | Yes | Kategori barang |
| `status` | string | Yes | Target status: `found` (untuk cari barang yang ditemukan) |

**Example:**
```
GET /items/similar?title=laptop%20asus&category=electronics&status=found
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "item_match_001",
        "title": "Laptop Asus ROG Ditemukan",
        "description": "Ditemukan laptop Asus di Gedung FTI...",
        "category": "electronics",
        "status": "found",
        "imageUrl": "https://...",
        "matchScore": 0.85
      }
    ]
  }
}
```

---

## Users API

### 1. Get Public Profile
Mendapatkan profil publik user (untuk QR code scan).

**Endpoint:** `GET /users/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "name": "Ahmad Fauzi",
      "phone": "081234567890",
      "avatar": "https://storage.example.com/avatars/user_123.jpg",
      "badge": "blue",
      "faculty": "Fakultas Teknologi Industri",
      "studentId": "20523001"
    }
  }
}
```

> ⚠️ **Note:** Email tidak dikembalikan untuk alasan privasi.

---

### 2. Update My Profile
Update profil user yang sedang login.

**Endpoint:** `PUT /users/me`

**Headers:** `Authorization: Bearer <token>` *(required)*

**Request Body:**
```json
{
  "name": "Ahmad Fauzi Rahman",
  "phone": "081234567899",
  "faculty": "Fakultas Teknologi Industri"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profil berhasil diupdate",
  "data": {
    "user": {
      "id": "user_123",
      "name": "Ahmad Fauzi Rahman",
      "phone": "081234567899",
      "faculty": "Fakultas Teknologi Industri"
    }
  }
}
```

---

### 3. Get My Items
Mendapatkan semua laporan milik user yang sedang login.

**Endpoint:** `GET /users/me/items`

**Headers:** `Authorization: Bearer <token>` *(required)*

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter: `lost`, `found`, `claimed` |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "item_001",
        "title": "Laptop ASUS ROG",
        "status": "lost",
        "category": "electronics",
        "date": "25 Nov",
        "createdAt": "2025-11-25T07:30:00.000Z"
      },
      {
        "id": "item_002",
        "title": "Kunci Motor",
        "status": "found",
        "category": "keys",
        "date": "26 Nov",
        "createdAt": "2025-11-26T10:00:00.000Z"
      }
    ],
    "counts": {
      "all": 5,
      "lost": 2,
      "found": 2,
      "claimed": 1
    }
  }
}
```

---

## Upload API

### Upload File (Image)
Upload gambar untuk item atau avatar.

**Endpoint:** `POST /upload`

**Headers:** 
- `Authorization: Bearer <token>` *(required)*
- `Content-Type: multipart/form-data`

**Request Body (FormData):**
```
file: <binary>
type: "item" | "avatar"
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "File berhasil diupload",
  "data": {
    "url": "https://storage.example.com/items/abc123.jpg",
    "filename": "abc123.jpg",
    "size": 245678,
    "mimeType": "image/jpeg"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "File tidak valid",
  "error": {
    "code": "INVALID_FILE",
    "details": {
      "allowedTypes": ["image/jpeg", "image/png", "image/webp"],
      "maxSize": "5MB"
    }
  }
}
```

---

## Notifications API

> ⚠️ **Note:** Fitur ini akan dikerjakan oleh tim terpisah.

### 1. Get Notifications
**Endpoint:** `GET /notifications`

**Headers:** `Authorization: Bearer <token>` *(required)*

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `unreadOnly` | boolean | Hanya notifikasi belum dibaca |
| `limit` | number | Jumlah notifikasi (default: 20) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_001",
        "type": "item_match",
        "title": "Barang serupa ditemukan!",
        "message": "Ada barang yang cocok dengan laptop yang kamu laporkan hilang",
        "itemId": "item_match_001",
        "read": false,
        "createdAt": "2025-11-27T08:00:00.000Z"
      },
      {
        "id": "notif_002",
        "type": "item_claimed",
        "title": "Barang telah diklaim",
        "message": "Dompet yang kamu temukan telah diklaim oleh pemiliknya",
        "itemId": "item_002",
        "read": true,
        "createdAt": "2025-11-26T15:30:00.000Z"
      }
    ],
    "unreadCount": 3
  }
}
```

### 2. Mark as Read
**Endpoint:** `PUT /notifications/:id/read`

**Headers:** `Authorization: Bearer <token>` *(required)*

### 3. Mark All as Read
**Endpoint:** `PUT /notifications/read-all`

**Headers:** `Authorization: Bearer <token>` *(required)*

---

## Data Models

### User
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  badge: 'gold' | 'blue' | 'gray';
  role: 'student' | 'staff' | 'public';
  faculty?: string;
  studentId?: string;   // Untuk mahasiswa
  employeeId?: string;  // Untuk staff
  createdAt: Date;
  updatedAt?: Date;
}
```

### Item
```typescript
interface Item {
  id: string;
  title: string;
  description: string;
  category: ItemCategory;
  status: 'lost' | 'found' | 'claimed';
  imageUrl?: string;
  date: string;         // Format: "25 Nov"
  time?: string;        // Format: "14:30"
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  
  // Reporter info (denormalized for performance)
  reporterId: string;
  reporterName: string;
  reporterBadge: 'gold' | 'blue' | 'gray';
  reporterPhone?: string;
  
  // Lost item specific
  reward?: boolean;
  urgency?: 'normal' | 'important' | 'very-important';
  
  // Found item specific
  storageLocation?: 'with-me' | 'entrusted';
  entrustedTo?: string;
  willingToDeliver?: boolean;
  
  createdAt: Date;
  updatedAt?: Date;
}

type ItemCategory = 
  | 'bags' 
  | 'wallet' 
  | 'phone' 
  | 'electronics' 
  | 'documents' 
  | 'keys' 
  | 'clothing' 
  | 'others';
```

### Notification
```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'item_match' | 'item_claimed' | 'item_found' | 'system';
  title: string;
  message: string;
  itemId?: string;
  read: boolean;
  createdAt: Date;
}
```

---

## Error Handling

### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | OK - Request berhasil |
| 201 | Created - Resource berhasil dibuat |
| 400 | Bad Request - Request tidak valid |
| 401 | Unauthorized - Token tidak valid atau expired |
| 403 | Forbidden - Tidak punya akses |
| 404 | Not Found - Resource tidak ditemukan |
| 422 | Unprocessable Entity - Validasi gagal |
| 500 | Internal Server Error |

### Error Codes
| Code | Description |
|------|-------------|
| `INVALID_EMAIL` | Format email tidak valid |
| `INVALID_TOKEN` | Token tidak valid |
| `TOKEN_EXPIRED` | Token sudah expired |
| `ITEM_NOT_FOUND` | Barang tidak ditemukan |
| `USER_NOT_FOUND` | User tidak ditemukan |
| `FORBIDDEN` | Tidak punya akses ke resource |
| `VALIDATION_ERROR` | Validasi input gagal |
| `INVALID_FILE` | File upload tidak valid |
| `FILE_TOO_LARGE` | Ukuran file melebihi batas |

---

## Notes untuk Backend Developer

### Prioritas Implementasi
1. ⭐ **High Priority**
   - `POST /auth/login`
   - `GET /auth/me`
   - `GET /items` (dengan filter)
   - `GET /items/:id`
   - `POST /items`
   - `POST /upload`

2. 🔶 **Medium Priority**
   - `GET /users/:id`
   - `PUT /users/me`
   - `GET /users/me/items`
   - `PUT /items/:id`
   - `DELETE /items/:id`

3. 🔷 **Low Priority** (dikerjakan terpisah)
   - All `/notifications` endpoints
   - `GET /items/similar`

### Catatan Teknis
1. **Image Storage**: Rekomendasikan gunakan cloud storage (Cloudinary/AWS S3/Google Cloud Storage)
2. **JWT Token**: Expired time 7 hari, refresh token optional
3. **Rate Limiting**: 100 requests/minute per IP
4. **CORS**: Allow origin dari `localhost:4200` (dev) dan domain production

---

## Contoh Implementasi Frontend

### Auth Service
```typescript
// auth.service.ts
async login(email: string): Promise<User> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    return data.data.user;
  }
  throw new Error(data.message);
}
```

### Items Service
```typescript
// items.service.ts
async getItems(filters: ItemFilters): Promise<ItemsResponse> {
  const params = new URLSearchParams(filters as any);
  const response = await fetch(`${API_URL}/items?${params}`, {
    headers: { 'Authorization': `Bearer ${this.getToken()}` }
  });
  return response.json();
}
```

---

**Questions?** Hubungi tim frontend untuk diskusi lebih lanjut.
