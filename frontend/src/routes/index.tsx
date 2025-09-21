import { Navigate, createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/layouts/app-layout";
import { AuthLayout } from "@/layouts/auth-layout";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
import { PublicRoute } from "@/components/routing/PublicRoute";
import { BoardsPage } from "@/features/boards/pages/boards-page";
import { BoardPage } from "@/features/boards/pages/board-page";
import { UsersPage } from "@/features/admin/pages/users-page";
import { LoginPage } from "@/features/auth/pages/login-page";
import { RegisterPage } from "@/features/auth/pages/register-page";
import { ErrorPage } from "@/routes/error-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/boards" replace />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { path: "/boards", element: <BoardsPage /> },
      { path: "/boards/:boardId", element: <BoardPage /> },
      {
        path: "/admin/users",
        element: (
          <ProtectedRoute roles={["ADMIN"]}>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
      },
      {
        path: "/register",
        element: (
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        ),
      },
    ],
  },
  { path: "*", element: <Navigate to="/boards" replace /> },
]);
