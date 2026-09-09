import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthModalProvider } from './hooks/useAuthModal';
import Header from './components/Header';
import Home from './pages/Home';
import Slots from './pages/Slots';
import History from './pages/History';
import Profile from './pages/Profile';

function App() {
  return (
    <AuthModalProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-casino-darker text-casino-text font-sans">
          <Header />
          <main className="max-w-7xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/slots" element={<Slots />} />
              <Route path="/history" element={<History />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthModalProvider>
  );
}

export default App;
