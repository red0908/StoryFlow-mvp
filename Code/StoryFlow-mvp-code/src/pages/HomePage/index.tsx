import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { audioManager } from '../../audio';
import './HomePage.less';

const INTRO_CONTENT = `欢迎来到「MBTI心动互动局」！

这是一款轻量级、情景式的人格匹配互动游戏，结合 MBTI 人格理论，让玩家在互动选择中体验性格匹配的乐趣。故事发生在一间安静的咖啡店里——你将与互动对象在咖啡香中相遇，通过对话与选择推进剧情，探索心动的可能。

【四种人格】
本作登场四种人格类型，每种性格会对你做出的选择产生不同反应，影响好感与剧情走向：
· ENFJ — 热情的教育者，善于共情
· INTJ — 理性独立，有主见、带一丝神秘
· INFJ — 温柔洞察，宁静治愈
· ENTJ — 果敢有领导力，气场十足

【玩法介绍】
1. 创建角色：选择性别、年龄、职业与你的 MBTI、一句话介绍。
2. 选择对象：系统随机生成 5 位异性候选人，展示其 MBTI 与介绍，点击一位即锁定为本次互动对象。
3. 四章剧情：从「开头」到「发展」「高潮」「结束」，每章包含多个剧情节点，每个节点有 2～3 个选项，你的选择会增减对方好感度或触发不同分支。
4. 达成结局：根据累积好感度与关键选择，将走向「完美匹配」「略有遗憾」「分道扬镳」等不同结局。

祝你在心域奇旅中，找到属于你的那一份心动。`;

const INTRO_CLOSE_MS = 280;

function HomePage() {
  const navigate = useNavigate();
  const [introOpen, setIntroOpen] = useState(false);
  const [introClosing, setIntroClosing] = useState(false);

  const handlePlayIntro = useCallback(() => {
    setIntroClosing(false);
    setIntroOpen(true);
  }, []);

  const handleCloseIntro = useCallback(() => {
    setIntroClosing(true);
    setTimeout(() => {
      setIntroOpen(false);
      setIntroClosing(false);
    }, INTRO_CLOSE_MS);
  }, []);

  const handleStartGame = () => {
    navigate('/scripts');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleHeartMap = () => {
    navigate('/map');
  };

  // 主菜单 BGM：进入首页预加载并播放，离开时停止
  useEffect(() => {
    audioManager.preload();
    audioManager.playBGM('main_menu', true);
    return () => {
      audioManager.stopAll();
    };
  }, []);

  return (
    <div
      className="min-h-screen w-full min-w-0 lg:min-w-[1280px] flex flex-col bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: 'url(/background/bg-01.png)',
      }}
    >
      {/* 爱心泡泡雨：透明浮动装饰 */}
      <div className="home-bubbles" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            className="home-bubble"
            style={{
              left: `${(i * 7 + 3) % 100}%`,
              animationDelay: `${(i * 0.7 + 2) % 18}s`,
              animationDuration: `${14 + (i % 7)}s`,
              opacity: 0.15 + (i % 5) * 0.08,
              fontSize: `${14 + (i % 4) * 6}px`,
            }}
          >
            ♥
          </span>
        ))}
      </div>

      <div className="home-page-inner relative z-[1] flex flex-col flex-1 justify-center items-center">
      <div className="home-layout flex flex-col items-center w-full max-w-6xl">
      {/* 头部标题：艺术字图片 */}
      <header className="home-header flex-shrink-0 text-center">
        <h1 className="home-title">
          <img
            src="/base_img/main_title.png"
            alt="MBTI心动互动局 MBTI Heartbeat Interactive"
            className="home-title-img"
          />
        </h1>
        <div className="home-title-underline" />
      </header>

      {/* 中部：四人融合大图 */}
      {/* <main className="home-main flex-shrink-0 flex items-center justify-center px-4">
        <img
          src="/person_img/main_person.png"
          alt="人物"
          className="max-w-[min(90vw,720px)] max-h-[60vh] w-auto h-auto object-contain"
        />
      </main> */}

      {/* 底部按钮区 */}
      <footer className="home-footer flex-shrink-0 flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-10 px-4">
        <button
          type="button"
          onClick={() => {
            audioManager.playSFX('ui_click');
            handleProfile();
          }}
          className="home-btn home-btn-secondary"
        >
          玩家档案
        </button>
        <button
          type="button"
          onClick={() => {
            audioManager.playSFX('ui_click');
            handleHeartMap();
          }}
          className="home-btn home-btn-secondary"
        >
          心域地图
        </button>
        <button
          type="button"
          onClick={() => {
            audioManager.playSFX('ui_click');
            handlePlayIntro();
          }}
          className="home-btn home-btn-secondary"
        >
          玩法介绍
        </button>
        <button
          type="button"
          onClick={() => {
            audioManager.playSFX('ui_click');
            handleStartGame();
          }}
          className="home-btn home-btn-primary"
        >
          开始游戏
        </button>
      </footer>
      </div>
      </div>

      {/* 玩法介绍弹窗 */}
      {introOpen && (
        <div
          className={`home-intro-overlay ${introClosing ? 'home-intro-overlay-closing' : ''}`}
          onClick={handleCloseIntro}
          role="dialog"
          aria-modal="true"
          aria-labelledby="intro-title"
        >
          <div
            className={`home-intro-modal ${introClosing ? 'home-intro-modal-closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="home-intro-modal-header">
              <h2 id="intro-title" className="home-intro-title">玩法介绍</h2>
              <button
                type="button"
                className="home-intro-close"
                onClick={handleCloseIntro}
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <div className="home-intro-body">
              <div className="home-intro-content">
                {INTRO_CONTENT.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
