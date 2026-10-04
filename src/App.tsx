import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'

import AppShell from '@/components/AppShell'
import PublicRoute from '@/components/PublicRoute'
import { PageLoader } from '@/components/ui'
import { AuthProvider } from '@/context/AuthContext'
import { AssistantProvider } from '@/context/AssistantContext'
import { useAuth } from '@/hooks/useAuth'
import { pageImporters } from '@/lib/routePrefetch'

const Accounts = lazy(pageImporters.accounts)
const Dashboard = lazy(pageImporters.dashboard)
const Debts = lazy(pageImporters.debts)
const ForgotPassword = lazy(pageImporters.forgotPassword)
const Home = lazy(pageImporters.home)
const Login = lazy(pageImporters.login)
const Monitoring = lazy(pageImporters.monitoring)
const NotFound = lazy(pageImporters.notFound)
const Profile = lazy(pageImporters.profile)
const Register = lazy(pageImporters.register)
const Reports = lazy(pageImporters.reports)
const ResetPassword = lazy(pageImporters.resetPassword)
const TermsAndConditions = lazy(pageImporters.terms)
const Transactions = lazy(pageImporters.transactions)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <AssistantProvider key={user?.id ?? 'anonymous'}>
      <Suspense fallback={<PageLoader forceLight />}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <Home />
              </PublicRoute>
            }
          />

          {/* One persistent shell for every signed-in page. */}
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/debts" element={<Debts />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/monitoring" element={<Monitoring />} />
          </Route>

          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AssistantProvider>
  )
}
