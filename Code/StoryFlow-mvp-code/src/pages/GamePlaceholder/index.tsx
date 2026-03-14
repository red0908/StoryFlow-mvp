import React from 'react';
import { useNavigate } from 'react-router-dom';

/** 剧情主界面占位，后续按剧本引擎实现 */
function GamePlaceholder() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900/95 text-white p-8">
      <h1 className="text-2xl font-semibold mb-4">剧情即将开始</h1>
      <p className="text-white/80 mb-6">你已选择相亲对象，剧情模块开发中。</p>
      <button
        type="button"
        onClick={() => navigate('/blindDate')}
        className="px-6 py-2 rounded-full border border-white/4 bg-white/10 hover:bg-white/20 transition"
      >
        返回选择对象
      </button>
    </div>
  );
}

export default GamePlaceholder;
