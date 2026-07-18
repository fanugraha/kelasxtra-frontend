import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/auth/Login';
import Daftar from './pages/auth/Daftar';
import CekEmail from './pages/auth/CekEmail';
import LupaPassword from './pages/auth/LupaPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Beranda from './pages/dashboard/Beranda';
import Profile from './pages/dashboard/Profile';
import ChangePassword from './pages/dashboard/ChangePassword';
import Schedule from './pages/dashboard/Schedule';
import Leaderboard from './pages/dashboard/Leaderboard';
import Transactions from './pages/dashboard/Transactions';
import ExamAttempt from './pages/dashboard/ExamAttempt';
import ExamDetail from './pages/dashboard/ExamDetail';
import Packages from './pages/dashboard/Packages';
import PackageDetail from './pages/dashboard/PackageDetail';
import PackageExams from './pages/dashboard/PackageExams';
import TransactionStatus from './pages/dashboard/TransactionStatus';
import MyPackages from './pages/dashboard/MyPackages';
import ClassDetail from './pages/dashboard/ClassDetail';
import ClassList from './pages/dashboard/ClassList';
import ExamReview from './pages/dashboard/ExamReview';
import Landing from './pages/public/Landing';
import ArticleList from './pages/public/ArticleList';
import ArticleDetail from './pages/public/ArticleDetail';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/artikel" element={<ArticleList />} />
          <Route path="/artikel/:slug" element={<ArticleDetail />} />

          <Route path="/login" element={<Login />} />
          <Route path="/daftar" element={<Daftar />} />
          <Route path="/cek-email" element={<CekEmail />} />
          <Route path="/lupa-password" element={<LupaPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="packages" element={<Packages />} />
            <Route path="packages/:packageId" element={<PackageDetail />} />
            <Route path="packages/:packageId/exams" element={<PackageExams />} />
            <Route path="exams/:examId" element={<ExamDetail />} />
            <Route path="exam-attempts/:attemptId/review" element={<ExamReview />} />
            <Route path="my-packages" element={<MyPackages />} />
            <Route path="classes/:classId" element={<ClassDetail />} />
            <Route path="classes" element={<ClassList />} />
            <Route path="transactions/:transactionId" element={<TransactionStatus />} />
            <Route path="dashboard" element={<Beranda />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<ChangePassword />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="transactions" element={<Transactions />} />
          </Route>

          <Route
            path="/app/exam/:attemptId"
            element={
              <ProtectedRoute>
                <ExamAttempt />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;