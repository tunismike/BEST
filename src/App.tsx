import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ReviewPage } from './pages/ReviewPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPrompt } from './components/LoginPrompt';

export default function App() {
  const [reviewerName, setReviewerName] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('best-reviewer-name');
    if (stored) {
      setReviewerName(stored);
    }
  }, []);

  const handleLogin = (name: string) => {
    localStorage.setItem('best-reviewer-name', name);
    setReviewerName(name);
  };

  const handleLogout = () => {
    localStorage.removeItem('best-reviewer-name');
    setReviewerName(null);
  };

  if (!reviewerName) {
    return <LoginPrompt onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/r/:reviewId" element={<ReviewPage reviewerName={reviewerName} onLogout={handleLogout} />} />
        <Route path="/admin/:reviewId" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/r/demo" replace />} />
      </Routes>
    </HashRouter>
  );
}
