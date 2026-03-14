import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateRole from './pages/CreateRole';
import BlindDatePage from './pages/BlindDatePage';
import GamePage from './pages/GamePage';
import SelectPage from './pages/SelectPage';
import EndingPage from './pages/EndingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create/myRole" element={<CreateRole />} />
        <Route path="/blindDate" element={<BlindDatePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/ending" element={<EndingPage />} />
        <Route path="/select" element={<SelectPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
