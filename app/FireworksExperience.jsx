'use client';

import { useEffect, useRef } from 'react';
import { mountFireworks } from './fireworks-engine';

export default function FireworksExperience() {
  const experienceRef = useRef(null);
  const canvasRef = useRef(null);
  const formRef = useRef(null);
  const inputRef = useRef(null);
  const introRef = useRef(null);
  const messageLayerRef = useRef(null);

  useEffect(() => {
    return mountFireworks({
      experience: experienceRef.current,
      canvas: canvasRef.current,
      form: formRef.current,
      input: inputRef.current,
      intro: introRef.current,
      messageLayer: messageLayerRef.current,
    });
  }, []);

  return (
    <main className="experience" id="experience" ref={experienceRef}>
      <div className="sky-glow sky-glow--left" aria-hidden="true" />
      <div className="sky-glow sky-glow--right" aria-hidden="true" />
      <div className="horizon" aria-hidden="true" />
      <canvas id="sky" ref={canvasRef} aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="/" aria-label="Afterglow 홈">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          <span>afterglow<span className="brand-dot">.</span></span>
        </a>
        <div className="header-label">당신의 말로 완성되는 밤하늘</div>
      </header>

      <section className="intro" id="intro" aria-labelledby="intro-title" ref={introRef}>
        <div className="intro-kicker"><span className="tiny-star">✦</span> 마음을 전하는 작은 순간 <span className="tiny-star">✦</span></div>
        <h1 id="intro-title">마음을 <em>하늘에 피워요.</em></h1>
        <p>전하고 싶은 말을 적어보세요. 불꽃이 되어 밤하늘에 피어납니다.</p>
      </section>

      <div className="message-layer" id="message-layer" ref={messageLayerRef} aria-live="polite" aria-atomic="true" />

      <div className="bottom-area">
        <div className="composer-caption"><span className="caption-sparkle">✦</span> 작은 한마디, 빛나는 순간 <span className="caption-sparkle">✦</span></div>
        <form className="composer" id="composer" ref={formRef} autoComplete="off">
          <label className="sr-only" htmlFor="message-input">전할 메시지</label>
          <span className="composer-icon" aria-hidden="true">✧</span>
          <input id="message-input" ref={inputRef} name="message" type="text" maxLength={90} placeholder="전하고 싶은 말을 적어보세요" required />
          <button type="submit" id="send-button" aria-label="메시지를 불꽃으로 보내기">
            <span>보내기</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </form>
        <div className="bottom-notes"><span>엔터를 누르면 발사됩니다 <span aria-hidden="true">↵</span></span><span>소중한 순간을 위해 <span aria-hidden="true">✳</span></span></div>
      </div>
    </main>
  );
}
