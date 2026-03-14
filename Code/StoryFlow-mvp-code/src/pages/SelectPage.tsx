import React from 'react';
import { useNavigate } from 'react-router-dom';

/** 选择相亲对象页占位，后续按设计文档实现 */
function SelectPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900/95 text-white p-8">
      <h1 className="text-2xl font-semibold mb-4">选择相亲对象</h1>
      <p className="text-white/80 mb-6">该页面开发中，角色已创建并保存。</p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="px-6 py-2 rounded-full border border-white/4 bg-white/10 hover:bg-white/20 transition"
      >
        返回首页
      </button>
    </div>
  );
}

export default SelectPage;
