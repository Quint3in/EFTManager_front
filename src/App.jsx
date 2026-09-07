import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GameModeProvider } from './context/GameModeContext';
import { LanguageProvider } from './context/LanguageContext';
import { FavoritesProvider } from './context/FavoritesContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import HideoutPage from './pages/HideoutPage';
import ItemsPage from './pages/ItemsPage';
import ItemDetailPage from './pages/ItemDetailPage';
import AdminRoute from './components/AdminRoute';
import AdminPage from './pages/AdminPage';
import TasksPage from './pages/TasksPage';
import TaskDetailPage from './pages/TaskDetailPage';
import CompareTasksPage from './pages/CompareTasksPage';
import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <GameModeProvider>
          <FavoritesProvider>
            <LanguageProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <DashboardPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hideout"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <HideoutPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/items"
                    element={<ProtectedRoute><Layout><ItemsPage /></Layout></ProtectedRoute>}
                  />
                  <Route
                    path="/items/:itemId"
                    element={<ProtectedRoute><Layout><ItemDetailPage /></Layout></ProtectedRoute>}
                  />
                  <Route
                    path="/admin"
                    element={<AdminRoute><Layout><AdminPage /></Layout></AdminRoute>}
                  />
                  <Route
                    path="/tasks"
                    element={<ProtectedRoute><Layout><TasksPage /></Layout></ProtectedRoute>}
                  />
                  <Route
                    path="/tasks/:taskId"
                    element={<ProtectedRoute><Layout><TaskDetailPage /></Layout></ProtectedRoute>}
                  />
                  <Route
                    path="/tasks/compare"
                    element={<ProtectedRoute><Layout><CompareTasksPage /></Layout></ProtectedRoute>}
                  />
                </Routes>
              </BrowserRouter>
            </LanguageProvider>
          </FavoritesProvider>
        </GameModeProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;