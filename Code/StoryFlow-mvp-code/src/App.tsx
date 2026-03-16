import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateRole from './pages/CreateRole';
import BlindDatePage from './pages/BlindDatePage';
import GamePage from './pages/GamePage';
import SelectPage from './pages/SelectPage';
import EndingPage from './pages/EndingPage';
import ScriptHall from './pages/ScriptHall';
import ProfilePage from './pages/ProfilePage';
import HeartMapPage from './pages/HeartMapPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/scripts" element={<ScriptHall />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/map" element={<HeartMapPage />} />
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
