import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Play,
  Pause,
  Maximize,
  Download,
  Trash2,
  Volume2,
  VolumeX,
  VideoOff,
} from 'lucide-react';
import { formatDuration, getFileExtensionForMime } from '@/lib/utils';

export interface VideoPlayerHandle {
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
  pause: () => void;
}

interface VideoPlayerProps {
  blob: Blob | null;
  mimeType: string;
  fallbackDuration: number;
  videoSize?: number;
  downloadFileName: string;
  onDeleteVideo?: () => void;
  onTimeChange?: (seconds: number) => void;
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer(
    {
      blob,
      mimeType,
      fallbackDuration,
      downloadFileName,
      onDeleteVideo,
      onTimeChange,
    },
    ref
  ) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(fallbackDuration || 0);
    const [playbackRate, setPlaybackRate] = useState<number>(1);
    const [isMuted, setIsMuted] = useState(false);

    useImperativeHandle(ref, () => ({
      getCurrentTime: () => {
        return videoRef.current ? videoRef.current.currentTime : currentTime;
      },
      seekTo: (seconds: number) => {
        const v = videoRef.current;
        const safeSec = Math.max(0, seconds);
        setCurrentTime(safeSec);
        if (v && Number.isFinite(safeSec)) {
          v.currentTime = safeSec;
        }
      },
      pause: () => {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      },
    }));

    useEffect(() => {
      if (!blob) {
        setVideoUrl(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(fallbackDuration || 0);
        return;
      }

      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(fallbackDuration || 0);

      return () => {
        URL.revokeObjectURL(url);
      };
    }, [blob, fallbackDuration]);

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.playbackRate = playbackRate;
      }
    }, [playbackRate, videoUrl]);

    const handleLoadedMetadata = () => {
      const v = videoRef.current;
      if (!v) return;
      if (Number.isFinite(v.duration) && v.duration > 0) {
        setDuration(v.duration);
      } else if (fallbackDuration > 0) {
        setDuration(fallbackDuration);
      }
    };

    const handleTimeUpdate = () => {
      const v = videoRef.current;
      if (!v) return;
      setCurrentTime(v.currentTime);
      onTimeChange?.(v.currentTime);
      if (
        Number.isFinite(v.duration) &&
        v.duration > 0 &&
        Math.abs(v.duration - duration) > 1
      ) {
        setDuration(v.duration);
      }
    };

    const togglePlay = async () => {
      const v = videoRef.current;
      if (!v) return;
      try {
        if (v.paused || v.ended) {
          if (v.ended) {
            v.currentTime = 0;
          }
          await v.play();
          setIsPlaying(true);
        } else {
          v.pause();
          setIsPlaying(false);
        }
      } catch (err) {
        console.error('Video play error:', err);
      }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = videoRef.current;
      const nextTime = parseFloat(e.target.value);
      setCurrentTime(nextTime);
      onTimeChange?.(nextTime);
      if (v && Number.isFinite(nextTime)) {
        v.currentTime = nextTime;
      }
    };

    const cyclePlaybackRate = () => {
      const currentIdx = PLAYBACK_RATES.indexOf(
        playbackRate as (typeof PLAYBACK_RATES)[number]
      );
      const nextRate =
        PLAYBACK_RATES[(currentIdx + 1) % PLAYBACK_RATES.length];
      setPlaybackRate(nextRate);
      if (videoRef.current) {
        videoRef.current.playbackRate = nextRate;
      }
    };

    const toggleMute = () => {
      const v = videoRef.current;
      if (!v) return;
      v.muted = !v.muted;
      setIsMuted(v.muted);
    };

    const handleFullscreen = () => {
      const el = containerRef.current || videoRef.current;
      if (!el) return;
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      }
    };

    const handleDownload = () => {
      if (!videoUrl || !blob) return;
      const ext = getFileExtensionForMime(mimeType || blob.type);
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `${downloadFileName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    const effectiveDuration = Math.max(
      duration,
      currentTime,
      fallbackDuration || 1
    );
    const progressPercent = Math.min(
      100,
      Math.max(0, (currentTime / effectiveDuration) * 100)
    );

    if (!blob || !videoUrl) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-100 aspect-video p-8 text-center">
          <VideoOff className="h-10 w-10 text-slate-400 mb-3" />
          <p className="text-sm font-semibold text-slate-700">
            아직 이 질문에 저장된 녹화 영상이 없습니다
          </p>
          <p className="text-xs text-slate-500 mt-1">
            [연습실] 탭 또는 아래 [다시 녹화] 버튼을 눌러 답변 영상을 녹화해 보세요.
          </p>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-sm aspect-video group"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="h-full w-full object-cover cursor-pointer"
          onClick={togglePlay}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          playsInline
        />

        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1 rounded-lg bg-black/65 hover:bg-black/85 text-white px-2.5 py-1.5 text-xs font-medium backdrop-blur-xs transition-colors"
            title="영상 다운로드"
          >
            <Download className="h-3.5 w-3.5" />
            <span>다운로드</span>
          </button>
          {onDeleteVideo && (
            <button
              type="button"
              onClick={onDeleteVideo}
              className="inline-flex items-center gap-1 rounded-lg bg-black/65 hover:bg-red-600/90 text-white px-2.5 py-1.5 text-xs font-medium backdrop-blur-xs transition-colors"
              title="영상 삭제"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent pt-8 pb-3 px-4 flex items-center gap-3.5">
          <button
            type="button"
            onClick={togglePlay}
            className="text-white hover:text-blue-400 transition-colors shrink-0"
            aria-label={isPlaying ? '일시정지' : '재생'}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current" />
            )}
          </button>

          <span className="text-xs font-medium font-mono text-white/95 shrink-0 tracking-tight">
            {formatDuration(currentTime)} / {formatDuration(effectiveDuration)}
          </span>

          <div className="relative flex-1 flex items-center">
            <div className="h-1.5 w-full rounded-full bg-white/30 overflow-hidden pointer-events-none">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={effectiveDuration}
              step={0.1}
              value={Math.min(currentTime, effectiveDuration)}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="영상 구간 탐색"
            />
            <div
              className="pointer-events-none absolute h-3.5 w-3.5 rounded-full bg-white shadow-md -translate-x-1/2"
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          <button
            type="button"
            onClick={cyclePlaybackRate}
            className="rounded px-1.5 py-0.5 text-xs font-mono font-semibold text-white/90 hover:text-white hover:bg-white/15 transition-colors shrink-0"
            title="클릭하여 재생 배속 변경 (0.75x ~ 2x)"
          >
            {playbackRate}x
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="text-white/90 hover:text-white transition-colors shrink-0"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleFullscreen}
            className="text-white/90 hover:text-white transition-colors shrink-0"
            title="전체 화면"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }
);
