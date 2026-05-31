import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';

import Home from '../pages/public/Home';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import ForgotPassword from '../pages/public/ForgotPassword';
import ResetPassword from '../pages/public/ResetPassword';
import NotFound from '../pages/public/NotFound';

import StudentDashboard from '../pages/student/StudentDashboard';
import Companies from '../pages/student/Companies';
import MyApplications from '../pages/student/MyApplications';
import EligibleCompanies from '../pages/student/EligibleCompanies';
import ResumePage from '../pages/student/ResumePage';
import MockTests from '../pages/student/MockTests';
import InterviewExperiences from '../pages/student/InterviewExperiences';
import Profile from '../pages/student/Profile';

import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageCompanies from '../pages/admin/ManageCompanies';
import ManageStudents from '../pages/admin/ManageStudents';
import Analytics from '../pages/admin/Analytics';
import QuestionBank from '../pages/admin/QuestionBank';
import ManageTests from '../pages/admin/ManageTests';
import AdminNotifications from '../pages/admin/AdminNotifications';
import ManageApplications from '../pages/admin/ManageApplications';
import ActivityLogs from '../pages/admin/ActivityLogs';
import StudentTracking from '../pages/admin/StudentTracking';
import Notifications from '../pages/student/Notifications';
import ProgressTracker from '../pages/student/ProgressTracker';

const AdminWrapper = () => <Outlet />;

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />

    <Route path="/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
    <Route path="/companies" element={<ProtectedRoute role="student"><Companies /></ProtectedRoute>} />
    <Route path="/applications" element={<ProtectedRoute role="student"><MyApplications /></ProtectedRoute>} />
    <Route path="/eligible" element={<ProtectedRoute role="student"><EligibleCompanies /></ProtectedRoute>} />
    <Route path="/resume" element={<ProtectedRoute role="student"><ResumePage /></ProtectedRoute>} />
    <Route path="/tests" element={<ProtectedRoute role="student"><MockTests /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute role="student"><Notifications /></ProtectedRoute>} />
    <Route path="/progress" element={<ProtectedRoute role="student"><ProgressTracker /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute role="student"><Profile /></ProtectedRoute>} />

    <Route path="/admin" element={<ProtectedRoute role="admin"><AdminWrapper /></ProtectedRoute>}>
      <Route index element={<AdminDashboard />} />
      <Route path="companies" element={<ManageCompanies />} />
      <Route path="applications" element={<ManageApplications />} />
      <Route path="question-bank" element={<QuestionBank />} />
      <Route path="tests" element={<ManageTests />} />
      <Route path="students" element={<ManageStudents />} />
      <Route path="analytics" element={<Analytics />} />

      <Route path="tracking" element={<StudentTracking />} />
      <Route path="notifications" element={<AdminNotifications />} />
      <Route path="*" element={<NotFound />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
