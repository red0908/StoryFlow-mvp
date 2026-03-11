import React from 'react';

function App() {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{
        backgroundImage: 'url(./main.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">欢迎来到 StoryFlow-mvp</h1>
        <p className="text-gray-600">纯前端互动恋爱剧本游戏项目已初始化</p>
      </div>
    </div>
  );
}

export default App;
