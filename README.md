# 🚀 Smart Placement Tracker


### 🎯 A Complete Placement Management Platform for Colleges

*Streamlining Placement Activities for Students, Training & Placement Officers (TPOs), and Recruiters through an Intelligent, Centralized, and Scalable System.*

</div>

---

# 📖 Overview

Smart Placement Tracker is a comprehensive Placement Management System built using the MERN Stack that simplifies and automates the entire campus recruitment process.

The platform enables:

✅ Students to track applications, rounds, interviews, tests, and placement status.

✅ Administrators/TPOs to manage drives, applications, screening, tests, interviews, and student records.

✅ AI-powered Resume Analysis for role-based scoring, ATS evaluation, skill matching, and improvement suggestions.

✅ Real-time placement workflow tracking from application submission to final selection.

---

# ✨ Key Features

## 🎓 Student Portal

### 🔐 Authentication & Security

* Secure JWT Authentication
* Role-Based Access Control
* Protected Routes
* Session Management

### 📄 Resume Analyzer

* Resume Upload (PDF)
* ATS Score Calculation
* Resume Quality Score
* Skill Extraction
* Missing Skill Detection
* Role-Based Resume Analysis
* Dynamic Re-analysis when role changes
* Personalized Improvement Suggestions

### 🏢 Placement Drives

* Browse Active Drives
* View Eligibility Criteria
* Apply to Eligible Drives
* Application Status Tracking
* Deadline Validation

### 📊 Placement Progress Tracking

Track every recruitment stage:

```text
Applied
   ↓
Screening
   ↓
Online Assessment
   ↓
Technical Interview
   ↓
HR Interview
   ↓
Selected / Rejected
```

### 📝 Online Assessments

* Countdown Timer
* Auto Submission
* Question Palette
* Mark for Review
* One Attempt Restriction
* Company Specific Tests
* General Aptitude Tests

### 🔔 Notifications

* Application Updates
* Interview Schedules
* Round Results
* Test Assignments
* Placement Announcements

### 💬 Interview Experiences

* Share Experiences
* Read Previous Experiences
* Company Specific Insights

---

# 🏢 Admin / TPO Portal

## 📢 Placement Drive Management

* Create Placement Drives
* Edit Existing Drives
* Set Eligibility Criteria
* Set Application Deadlines
* Manage Company Information

### Eligibility Filters

* Minimum CGPA
* Allowed Branches
* Backlog Restrictions
* Passing Year
* Custom Criteria

---

## 👨‍🎓 Student Management

* View Students
* Search & Filter Students
* Branch-wise Filtering
* Placement Status Filtering
* Resume Verification
* Performance Tracking

---

## 📋 Application Management

* View Applications
* Screen Applications
* Approve / Reject Candidates
* Update Application Status
* Bulk Operations

---

## 🔄 Round Management

Manage recruitment process effectively:

### Available Rounds

* Resume Screening
* Aptitude Test
* Coding Test
* Group Discussion
* Technical Interview
* HR Interview
* Final Selection

### Admin Actions

* Create New Rounds
* Assign Students
* Update Results
* Move Candidates to Next Round
* Mark Selected/Rejected

---

## 📅 Interview Management

* Schedule Interviews
* Update Interview Status
* Add Interview Feedback
* Manage Candidate Progress

---

## 📝 Question Bank

### Supported Features

* CSV Upload
* Excel Upload
* Bulk Question Import
* Categorization
* Difficulty Management

### Categories

* Aptitude
* Reasoning
* Technical
* Coding
* Company-Specific

---

## 🎯 Online Test Builder

Create assessments instantly:

* Test Creation Wizard
* Auto Question Selection
* Difficulty Filters
* Topic Filters
* Duration Control
* Student Assignment
* Result Analytics

---

# 🤖 AI Resume Intelligence

The system includes an intelligent Resume Analyzer that evaluates resumes based on selected job roles.

### Analysis Metrics

✅ ATS Compatibility

✅ Resume Quality Score

✅ Skill Match Percentage

✅ Missing Skills

✅ Keyword Optimization

✅ Formatting Analysis

✅ Project Relevance

✅ Improvement Suggestions

### Supported Roles

* Software Engineer
* Full Stack Developer
* Frontend Developer
* Backend Developer
* Data Analyst
* Data Scientist
* Machine Learning Engineer
* Cloud Engineer
* DevOps Engineer

---

# 📈 Analytics Dashboard

Interactive dashboards powered by Recharts.

### Insights Available

📊 Placement Percentage

📊 Branch-wise Placements

📊 Company-wise Hiring

📊 Application Statistics

📊 Test Performance

📊 Student Progress

📊 Round Conversion Rates

---

# 🛠 Tech Stack

## Frontend

| Technology   | Purpose          |
| ------------ | ---------------- |
| React.js     | UI Development   |
| Vite         | Fast Build Tool  |
| Tailwind CSS | Styling          |
| React Router | Navigation       |
| Axios        | API Calls        |
| Zustand      | State Management |
| Recharts     | Analytics        |

---

## Backend

| Technology | Purpose         |
| ---------- | --------------- |
| Node.js    | Runtime         |
| Express.js | API Development |
| MongoDB    | Database        |
| Mongoose   | ODM             |
| JWT        | Authentication  |
| Multer     | File Upload     |
| PDF Parse  | Resume Parsing  |

---

## Optional AI Enhancement

| Service    | Purpose                  |
| ---------- | ------------------------ |
| OpenAI API | Advanced Resume Analysis |

---

# 📂 Project Structure

```text
smart-placement-tracker/

├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── store/
│   │   ├── hooks/
│   │   └── utils/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── uploads/
│
└── README.md
```

---

# ⚙️ Installation

## Prerequisites

* Node.js 18+
* MongoDB Atlas / Local MongoDB
* Git

---

## Clone Repository

```bash
git clone https://github.com/your-username/smart-placement-tracker.git

cd smart-placement-tracker
```

---

## Backend Setup

```bash
cd backend

npm install

cp .env.example .env

npm run dev
```

### Environment Variables

```env
PORT=5000

MONGO_URI=your_mongodb_connection

JWT_SECRET=your_secret_key

CLIENT_URL=http://localhost:5173

OPENAI_API_KEY=optional
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

# 🔑 Demo Credentials

| Role    | Email                                         | Password   |
| ------- | --------------------------------------------- | ---------- |
| Admin   | [admin@college.edu](mailto:admin@college.edu) | admin123   |
| Student | [demo@student.edu](mailto:demo@student.edu)   | student123 |

---

# 🚀 Deployment

## Frontend

* Vercel
* Netlify

## Backend

* Render
* Railway

## Database

* MongoDB Atlas

---

# 🎯 Future Enhancements

* AI Interview Preparation
* Resume Builder
* Real-time Chat System
* Recruiter Portal
* Email Automation
* Placement Prediction
* Campus Hiring Analytics
* Mobile Application
* Coding Assessment Engine
* AI Career Guidance

---

# 🤝 Contributing

Contributions are welcome!

1. Fork Repository
2. Create Feature Branch
3. Commit Changes
4. Push Changes
5. Create Pull Request

---

# 📜 License

This project is developed for educational and placement management purposes.

---

<div align="center">

### ⭐ If you like this project, don't forget to star the repository!

### 🚀 Smart Placement Tracker — Making Campus Placements Smarter & Simpler

</div>
