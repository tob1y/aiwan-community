import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CommunityProvider } from './context/CommunityContext'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Activities } from './pages/Activities'
import { Ideas } from './pages/Ideas'
import { IdeaDetail } from './pages/IdeaDetail'
import { Forum } from './pages/Forum'
import { ForumThread } from './pages/ForumThread'
import { Board } from './pages/Board'
import { Login } from './pages/Login'
import { Register } from './pages/Register'

export default function App() {
  return (
    <AuthProvider>
      <CommunityProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="activities" element={<Activities />} />
              <Route path="ideas" element={<Ideas />} />
              <Route path="ideas/:id" element={<IdeaDetail />} />
              <Route path="forum" element={<Forum />} />
              <Route path="forum/:id" element={<ForumThread />} />
              <Route path="board" element={<Board />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CommunityProvider>
    </AuthProvider>
  )
}
