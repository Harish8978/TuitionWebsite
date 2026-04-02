/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Courses from './pages/Courses';
import Contact from './pages/Contact';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import DashboardOverview from './pages/DashboardOverview';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import ViewEnquiries from './pages/admin/ViewEnquiries';
import ManageCourses from './pages/admin/ManageCourses';
import ManageTestimonials from './pages/admin/ManageTestimonials';
import ManageStudents from './pages/admin/ManageStudents';
import ManageStaff from './pages/admin/ManageStaff';
import Notes from './pages/portal/Notes';
import Attendance from './pages/portal/Attendance';
import Marks from './pages/portal/Marks';
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffAttendance from './pages/staff/StaffAttendance';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  const [hasOnboarded, setHasOnboarded] = useState(() => {
    return localStorage.getItem('sk_tuition_onboarded') === 'true';
  });

  const handleOnboardComplete = () => {
    setHasOnboarded(true);
    localStorage.setItem('sk_tuition_onboarded', 'true');
  };

  return (
    <AuthProvider>
      <Router>
        {!hasOnboarded ? (
          <Onboarding onComplete={handleOnboardComplete} />
        ) : (
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/about" element={<Layout><About /></Layout>} />
            <Route path="/courses" element={<Layout><Courses /></Layout>} />
            <Route path="/contact" element={<Layout><Contact /></Layout>} />
            <Route path="/login" element={<Login />} />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <DashboardLayout role="admin">
                  <DashboardOverview />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/courses" element={
              <ProtectedRoute role="admin">
                <DashboardLayout role="admin">
                  <ManageCourses />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/enquiries" element={
              <ProtectedRoute role="admin">
                <DashboardLayout role="admin">
                  <ViewEnquiries />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/testimonials" element={
              <ProtectedRoute role="admin">
                <DashboardLayout role="admin">
                  <ManageTestimonials />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/students" element={
              <ProtectedRoute role="admin">
                <DashboardLayout role="admin">
                  <ManageStudents />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/staff" element={
              <ProtectedRoute role="admin">
                <DashboardLayout role="admin">
                  <ManageStaff />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Student Portal Routes */}
            <Route path="/portal" element={
              <ProtectedRoute role="student">
                <DashboardLayout role="student">
                  <DashboardOverview />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/portal/notes" element={
              <ProtectedRoute role="student">
                <DashboardLayout role="student">
                  <Notes />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/portal/attendance" element={
              <ProtectedRoute role="student">
                <DashboardLayout role="student">
                  <Attendance />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/portal/marks" element={
              <ProtectedRoute role="student">
                <DashboardLayout role="student">
                  <Marks />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Staff Portal Routes */}
            <Route path="/staff" element={
              <ProtectedRoute role="staff">
                <DashboardLayout role="staff">
                  <StaffDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/staff/attendance" element={
              <ProtectedRoute role="staff">
                <DashboardLayout role="staff">
                  <StaffAttendance />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/staff/students" element={
              <ProtectedRoute role="staff">
                <DashboardLayout role="staff">
                  <ManageStudents />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Router>
    </AuthProvider>
  );
}
