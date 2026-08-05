"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── helpers ──
function fmt(sec) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Custom video testimonial player matching the static .ba-vcard.
 * @param {{ t: { name?: string, achievement?: string, color?: string,
 *   video?: { url?: string, poster?: string, durationSeconds?: number } } }} props
 */
export default function VideoCard({ t }) {
  const v = t || {};
  const url = v.video?.url || "";
  const poster = v.video?.poster || "";
  const color = v.color || "var(--accent)";
  const initial = (v.name || "?").trim().charAt(0).toUpperCase();

  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const trackRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(v.video?.durationSeconds || 0);
  const [isFs, setIsFs] = useState(false);

  const frac = duration > 0 ? Math.min(1, current / duration) : 0;

  // keep fullscreen state in sync
  useEffect(() => {
    const onFs = () => setIsFs(document.fullscreenElement === wrapRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el || !url) return;
    if (el.paused) el.play();
    else el.pause();
  }, [url]);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  }, []);

  const toggleFs = useCallback(() => {
    const box = wrapRef.current;
    if (!box) return;
    if (document.fullscreenElement === box) document.exitFullscreen?.();
    else box.requestFullscreen?.();
  }, []);

  const seek = useCallback(
    (e) => {
      const el = videoRef.current;
      const track = trackRef.current;
      if (!el || !track || !duration) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      el.currentTime = ratio * duration;
      setCurrent(el.currentTime);
    },
    [duration]
  );

  // ── shared bits ──
  const caption = (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontFamily: "'Poppins'", fontWeight: 700, fontSize: 16, color: "#14141C", letterSpacing: "-.01em" }}>
        {v.name}
      </div>
      {v.achievement && (
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--accent)", marginTop: 3 }}>{v.achievement}</div>
      )}
    </div>
  );

  const PlayIcon = ({ size = 24, fill = "#fff", ml = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ fill, marginLeft: ml }} aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.79-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14z" />
    </svg>
  );
  const PauseIcon = ({ size = 22, fill = "#fff" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ fill }} aria-hidden="true">
      <rect x="6" y="4.5" width="4.5" height="15" rx="1.6" />
      <rect x="13.5" y="4.5" width="4.5" height="15" rx="1.6" />
    </svg>
  );

  // ── graceful: no video url → poster / placeholder ──
  if (!url) {
    return (
      <div>
        <div
          className="ba-vcard"
          style={{ position: "relative", aspectRatio: "3/4", borderRadius: 20, overflow: "hidden", background: poster ? "#0F1020" : color }}
        >
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt={v.name || ""} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <span style={{ fontFamily: "'Poppins'", fontWeight: 800, fontSize: 64, color: "rgba(255,255,255,.9)" }}>{initial}</span>
            </div>
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,.42), transparent 26%, transparent 52%, rgba(0,0,0,.82))", pointerEvents: "none" }} />
          {v.name && (
            <div style={{ position: "absolute", top: 12, left: 12, right: 12 }}>
              <span style={{ display: "inline-block", background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "5px 10px", borderRadius: 8, backdropFilter: "blur(4px)" }}>{v.name}</span>
            </div>
          )}
          {/* disabled play affordance */}
          <div
            aria-label="Video hazır deyil"
            style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 64, height: 64, borderRadius: 20, background: "var(--accent)", display: "grid", placeItems: "center", boxShadow: "0 12px 28px rgba(0,0,0,.45)", opacity: 0.55, cursor: "default" }}
          >
            <PlayIcon />
          </div>
        </div>
        {caption}
      </div>
    );
  }

  // ── full custom player ──
  return (
    <div>
      <div
        ref={wrapRef}
        className="ba-vcard"
        style={{ position: "relative", aspectRatio: "3/4", borderRadius: 20, overflow: "hidden", background: "#0F1020" }}
      >
        <video
          ref={videoRef}
          src={url}
          poster={poster || undefined}
          playsInline
          preload="metadata"
          onClick={togglePlay}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration);
          }}
          onEnded={() => setPlaying(false)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "pointer", background: "#0F1020" }}
        />

        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,.42), transparent 26%, transparent 52%, rgba(0,0,0,.82))", pointerEvents: "none", opacity: playing ? 0 : 1, transition: "opacity .25s" }} />

        {v.name && (
          <div style={{ position: "absolute", top: 12, left: 12, right: 12, pointerEvents: "none", opacity: playing ? 0 : 1, transition: "opacity .25s" }}>
            <span style={{ display: "inline-block", background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "5px 10px", borderRadius: 8, backdropFilter: "blur(4px)" }}>{v.name}</span>
            {v.achievement && (
              <span style={{ display: "block", marginTop: 6, fontSize: 11.5, fontWeight: 700, color: "#fff", background: "var(--accent)", padding: "4px 9px", borderRadius: 7, width: "fit-content" }}>{v.achievement}</span>
            )}
          </div>
        )}

        {/* big center play/pause toggle */}
        <button
          className="ba-vplay"
          onClick={togglePlay}
          aria-label={playing ? "Dayandır" : "Oynat"}
          style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 64, height: 64, borderRadius: 20, background: "var(--accent)", border: "none", cursor: "pointer", display: "grid", placeItems: "center", boxShadow: "0 12px 28px rgba(0,0,0,.45)", opacity: playing ? 0 : 1, transition: "opacity .25s, transform .2s" }}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* bottom control bar */}
        <div style={{ position: "absolute", left: 12, right: 12, bottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="ba-vmini"
            onClick={togglePlay}
            aria-label="Oynat / Dayandır"
            style={{ width: 26, height: 26, border: "none", borderRadius: "50%", background: "rgba(255,255,255,.92)", cursor: "pointer", display: "grid", placeItems: "center", flex: "none" }}
          >
            {playing ? <PauseIcon size={13} fill="#14141C" /> : <PlayIcon size={14} fill="#14141C" ml={2} />}
          </button>

          <div
            ref={trackRef}
            className="ba-vtrack"
            onClick={seek}
            role="slider"
            aria-label="Video vaxtı"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(current)}
            style={{ flex: 1, height: 5, borderRadius: 99, background: "rgba(255,255,255,.32)", overflow: "hidden", cursor: "pointer" }}
          >
            <div className="ba-vfill" style={{ height: "100%", width: `${frac * 100}%`, background: "var(--accent)", borderRadius: 99 }} />
          </div>

          <span className="ba-vtime" style={{ color: "#fff", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
            {fmt(current)} / {fmt(duration)}
          </span>

          <button
            onClick={toggleMute}
            aria-label={muted ? "Səsi aç" : "Səssiz et"}
            style={{ width: 26, height: 26, border: "none", borderRadius: "50%", background: "rgba(255,255,255,.92)", cursor: "pointer", display: "grid", placeItems: "center", flex: "none" }}
          >
            {muted ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#14141C" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3 2.7-2.7-1.06-1.06L15.4 11 12.7 8.3 11.6 9.4 14.3 12l-2.7 2.7 1.06 1.06L15.4 13l2.7 2.7 1.06-1.06L16.5 12z" /></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#14141C" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12z" /></svg>
            )}
          </button>

          <button
            onClick={toggleFs}
            aria-label={isFs ? "Tam ekrandan çıx" : "Tam ekran"}
            style={{ width: 26, height: 26, border: "none", borderRadius: "50%", background: "rgba(255,255,255,.92)", cursor: "pointer", display: "grid", placeItems: "center", flex: "none" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#14141C" aria-hidden="true"><path d="M4 9V4h5v2H6v3H4zm11-5h5v5h-2V6h-3V4zM4 15h2v3h3v2H4v-5zm14 3v-3h2v5h-5v-2h3z" /></svg>
          </button>
        </div>
      </div>
      {caption}
    </div>
  );
}
