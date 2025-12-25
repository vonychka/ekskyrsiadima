import { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ToursProvider } from './context/ToursContext';
import Header from './components/Header';
import Footer from './components/Footer';
import TestEmailButton from './components/TestEmailButton';
import HomePage from './pages/HomePage';
import TourDetails from './pages/TourDetails';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentError from './pages/PaymentError';
import { TinkoffPaymentError } from './pages/TinkoffPaymentError';
import TicketPage from './pages/TicketPage';
import AdminPanel from './pages/AdminPanel';
import { LoadingSpinner } from './components/LoadingSpinner';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  return (
    <HelmetProvider>
      <ToursProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="flex-grow">
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/tour/:tourId" element={<TourDetails />} />
                  <Route path="/payment" element={<PaymentPage />} />
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/payment/failure" element={<TinkoffPaymentError />} />
                  <Route path="/payment/error" element={<PaymentError />} />
                  <Route path="/ticket" element={<TicketPage />} />
                  <Route path="/admin" element={<AdminPanel />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
            <TestEmailButton />
          </div>
        </Router>
      </ToursProvider>
    </HelmetProvider>
  );
}

export default App;
