import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import SoruCozucuPage from './components/SoruCozucuPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-2 sm:p-4">
      <SoruCozucuPage />
    </div>
  );
}

export default App;
