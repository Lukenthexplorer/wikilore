import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import DocView from './components/DocView'
import Home from './pages/Home'
import ReinoPage from './pages/ReinoPage'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path=":reino" element={<ReinoPage />} />
        <Route path=":reino/:doc" element={<DocView />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
