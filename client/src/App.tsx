import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ArtistDetailPage from './pages/ArtistDetailPage';
import ArtistsPage from './pages/ArtistsPage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import DesignDetailPage from './pages/DesignDetailPage';
import DesignsPage from './pages/DesignsPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import RegisterPage from './pages/RegisterPage';
import MyAppointmentPage from './pages/MyAppointmentPage';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="artists" element={<ArtistsPage />} />
          <Route path="artists/:id" element={<ArtistDetailPage />} />
          <Route path="designs" element={<DesignsPage />} />
          <Route path="designs/:id" element={<DesignDetailPage />} />
          <Route path="book-appointment/:artistId" element={<BookAppointmentPage />} />
          <Route path="my-appointments" element={<MyAppointmentPage />} />
          {/* Add more routes as needed */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;