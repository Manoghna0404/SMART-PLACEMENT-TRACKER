# ⚙️ Smart Placement Tracker - Backend


### 🚀 Powerful Backend for Placement Automation

RESTful API built with Node.js, Express.js, MongoDB, and JWT Authentication.

</div>

---

# 📖 Overview

The backend powers all placement management operations, including authentication, placement drives, applications, round tracking, online tests, notifications, analytics, and AI resume analysis.

The system follows a scalable architecture using controllers, services, middleware, and modular APIs.

---

# 🏗 Architecture

```text
Client
   │
   ▼
Routes
   │
   ▼
Controllers
   │
   ▼
Services
   │
   ▼
Models
   │
   ▼
MongoDB
```

---

# 🔐 Authentication Module

### Features

* JWT Authentication
* Role-Based Authorization
* Protected APIs
* Secure Password Hashing
* Session Validation

### Roles

* Student
* Admin
* TPO

---

# 👨‍🎓 Student APIs

### Profile Management

* Get Profile
* Update Profile
* Upload Resume

### Placement Applications

* Apply For Drives
* View Applications
* Track Status

### Resume Analysis

* Upload Resume
* Extract Skills
* ATS Analysis
* Role-Based Scoring

---

# 🏢 Placement Drive APIs

### Admin Features

* Create Drive
* Update Drive
* Delete Drive
* Publish Drive
* Archive Drive

### Eligibility Rules

* CGPA Validation
* Branch Validation
* Backlog Validation
* Passout Year Validation

---

# 📋 Application Management

### Workflow

```text
Applied
 ↓
Screening
 ↓
Assessment
 ↓
Technical Round
 ↓
HR Round
 ↓
Selected / Rejected
```

### Admin Actions

* Approve Application
* Reject Application
* Move to Next Round
* Add Remarks

---

# 🔄 Round Tracking Module

### Supported Rounds

* Resume Screening
* Aptitude Test
* Coding Assessment
* Group Discussion
* Technical Interview
* HR Interview

### Features

* Round Creation
* Candidate Assignment
* Result Publishing
* Progress Tracking

---

# 📝 Online Assessment Engine

### Features

* Test Creation
* Question Bank
* Test Assignment
* Result Evaluation
* Auto Submission

### Question Types

* MCQ
* Technical Questions
* Company Specific Questions

---

# 🤖 AI Resume Analyzer

### Resume Processing

* PDF Parsing
* Skill Extraction
* ATS Scoring
* Keyword Matching
* Resume Ranking

### Dynamic Analysis

Resume scores update automatically whenever:

* Resume changes
* Role changes
* Job requirements change

---

# 📊 Analytics APIs

Provides:

* Placement Statistics
* Company Reports
* Student Reports
* Hiring Trends
* Branch Analytics

---

# 🛠 Backend Tech Stack

| Technology | Purpose          |
| ---------- | ---------------- |
| Node.js    | Runtime          |
| Express.js | API Server       |
| MongoDB    | Database         |
| Mongoose   | ODM              |
| JWT        | Authentication   |
| Multer     | File Upload      |
| PDF Parse  | Resume Parsing   |
| bcrypt     | Password Hashing |
| Cloudinary | File Storage     |

---

# 📂 Project Structure

```bash
backend/

├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
├── validators/
├── uploads/
├── scripts/
└── server.js
```

---

# ⚙️ Installation

```bash
npm install

npm run dev
```

---

# 🔧 Environment Variables

```env
PORT=5000

MONGO_URI=your_mongodb_uri

JWT_SECRET=your_secret_key

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=

OPENAI_API_KEY=
```

---

# 🚀 API Features

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Placement Drives

```http
GET    /api/drives
POST   /api/drives
PUT    /api/drives/:id
DELETE /api/drives/:id
```

### Applications

```http
POST /api/applications
GET  /api/applications
PUT  /api/applications/:id
```

### Resume Analysis

```http
POST /api/resume/upload
POST /api/resume/analyze
```

---

# 🌐 Deployment

### Backend Hosting

* Render
* Railway
* VPS

### Database

* MongoDB Atlas

---

# 🔒 Security Features

✅ JWT Authentication

✅ Password Hashing

✅ Protected Routes

✅ Role-Based Access

✅ Input Validation

✅ File Upload Validation

✅ Secure API Architecture

---

# 🎯 Future Enhancements

* Socket.IO Notifications
* AI Mock Interviews
* Recruiter Portal
* Email Automation
* Resume Builder
* Placement Prediction
* Multi-College Support

---

<div align="center">

### ⚙️ Smart Placement Tracker Backend

Scalable, Secure, and Production-Ready Placement Management API

</div>
