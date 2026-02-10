import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ReviewPage } from './pages/ReviewPage';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/r/:reviewId" element={<ReviewPage />} />
        <Route path="/admin/:reviewId" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/r/demo" replace />} />
      </Routes>
    </HashRouter>
  );
}
