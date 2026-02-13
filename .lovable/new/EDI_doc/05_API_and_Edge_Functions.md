# 05 - Edge Functions & API

This document details the public API surface exposed by Supabase Edge Functions.

## Authentication

### `auth-login-username`
**Purpose**: Authenticate users (Staff or Manager) using a simple username/password combination.
**Method**: `POST`
**Access**: Public (Anon Key)

**Request Body**:
```json
{
  "business_slug": "my-restaurant",
  "username": "manager1",
  "password": "simple-password"
}
```

**Response**:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "...",
  "user": {
    "id": "uuid",
    "role": "manager"
  }
}
```

## Syrve Integration

### `syrve-connect-test`
**Purpose**: Validate Syrve credentials before saving.
**Method**: `POST`
**Access**: Authenticated (Manager only)

**Request Body**:
```json
{
  "server_url": "https://syrve.example.com:8080",
  "login": "admin",
  "password": "plaintext-password"
}
```

**Response**:
```json
{
  "success": true,
  "server_version": "7.9.2",
  "stores": [
    { "id": "uuid", "name": "Main Warehouse" }
  ]
}
```

### `syrve-sync-products`
**Purpose**: Trigger an immediate product sync.
**Method**: `POST`
**Access**: Authenticated (Manager only)

**Request Body**:
```json
{
  "business_id": "uuid" (optional, derived from auth)
}
```

**Response**:
```json
{
  "job_id": "uuid",
  "status": "queued"
}
```

### `inventory-submit`
**Purpose**: Send a completed inventory session to Syrve.
**Method**: `POST`
**Access**: Authenticated (Manager only)

**Request Body**:
```json
{
  "session_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "outbox_job_id": "uuid"
}
```

## AI Services

## AI Services

### `ai-scan`
**Purpose**: Identify a wine label from an image using Gemini Pro Vision.
**Method**: `POST`
**Access**: Authenticated (Staff/Manager)

**Request Body**:
```json
{
  "image_base64": "...",
  "session_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "product_name": "Chateau Margaux",
    "producer": "Margaux",
    "vintage": "2015",
    "region": "Bordeaux"
  },
  "attempt_id": "uuid"
}
```

## Utility

### `inventory-report-pdf`
**Purpose**: Generate a PDF report for a completed session.
**Method**: `GET`
**Access**: Authenticated (Manager)

**Query Params**:
*   `session_id`: UUID

**Response**: Binary PDF stream.
