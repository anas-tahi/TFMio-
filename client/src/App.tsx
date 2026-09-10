import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store/auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProfileSetup from "./pages/ProfileSetup";
import CreateTopic from "./pages/CreateTopic";
import Recommendations from "./pages/Recommendations";
import Requests from "./pages/Requests";
import CoordinatorMatches from "./pages/CoordinatorMatches";
import ProposeTopic from "./pages/ProposeTopic";
import Proposals from "./pages/Proposals";
import MyProposals from "./pages/MyProposals";
import FinalDecisions from "./pages/FinalDecisions";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuth((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const token = useAuth((s) => s.token);
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const loadMe = useAuth((s) => s.loadMe);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/profile-setup"
          element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/topics/new"
          element={
            <ProtectedRoute>
              <CreateTopic />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <ProtectedRoute>
              <Recommendations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <Requests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/matches"
          element={
            <ProtectedRoute>
              <CoordinatorMatches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/propose-topic"
          element={
            <ProtectedRoute>
              <ProposeTopic />
            </ProtectedRoute>
          }
        />
        <Route
          path="/proposals"
          element={
            <ProtectedRoute>
              <Proposals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-proposals"
          element={
            <ProtectedRoute>
              <MyProposals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/final-decisions"
          element={
            <ProtectedRoute>
              <FinalDecisions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}