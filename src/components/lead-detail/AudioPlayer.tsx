'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'

interface AudioPlayerProps {
  audioUrl: string
  peaks?: number[]
  onTimeUpdate?: (time: number) => void
  seekTo?: number | null
}

export function AudioPlayer({ audioUrl, peaks, onTimeUpdate, seekTo }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [speed, setSpeed] = useState(1)

  useEffect(() => {
    if (!containerRef.current) return
    let ws: any = null
    let destroyed = false

    import('wavesurfer.js').then(({ default: WaveSurfer }) => {
      if (destroyed || !containerRef.current) return
      ws = WaveSurfer.create({
        container: containerRef.current!,
        waveColor: 'rgba(99,102,241,0.35)',
        progressColor: '#6366f1',
        cursorColor: 'rgba(0,0,0,0.4)',
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 64,
        normalize: true,
        interact: true,
        backend: 'WebAudio',
      })

      if (peaks && peaks.length > 0) {
        ws.load(audioUrl, peaks)
      } else {
        ws.load(audioUrl)
      }

      ws.on('ready', () => {
        if (!destroyed) {
          setDuration(ws.getDuration())
          setIsReady(true)
        }
      })
      ws.on('timeupdate', (t: number) => {
        if (!destroyed) {
          setCurrentTime(t)
          onTimeUpdate?.(t)
        }
      })
      ws.on('play', () => { if (!destroyed) setIsPlaying(true) })
      ws.on('pause', () => { if (!destroyed) setIsPlaying(false) })
      ws.on('finish', () => { if (!destroyed) setIsPlaying(false) })
      ws.on('error', (e: any) => console.warn('WaveSurfer error:', e))
      wavesurferRef.current = ws
    }).catch(console.error)

    return () => {
      destroyed = true
      try { ws?.destroy() } catch (_) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl])

  useEffect(() => {
    if (seekTo != null && wavesurferRef.current && duration > 0 && isReady) {
      const pos = Math.min(seekTo / duration, 1)
      wavesurferRef.current.seekTo(Math.max(0, pos))
    }
  }, [seekTo, duration, isReady])

  useEffect(() => {
    try { wavesurferRef.current?.setPlaybackRate?.(speed) } catch (_) {}
  }, [speed])

  const togglePlay = () => {
    try { wavesurferRef.current?.playPause() } catch (_) {}
  }

  const skip = (s: number) => {
    if (!wavesurferRef.current || !duration) return
    const newTime = Math.max(0, Math.min(currentTime + s, duration))
    wavesurferRef.current.seekTo(newTime / duration)
  }

  const fmt = (t: number) => `${Math.floor(t / 60)}:${Math.floor(t % 60).toString().padStart(2, '0')}`

  const btnBase: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 8,
    background: 'rgba(0,0,0,0.05)',
    border: '1px solid rgba(0,0,0,0.08)',
    color: '#64748b', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  }

  return (
    <div style={{
      background: '#f1f5f9', borderRadius: 12, padding: 16,
      border: '1px solid rgba(0,0,0,0.06)',
    }}>
      {/* Waveform */}
      <div style={{ position: 'relative', minHeight: 64 }}>
        <div ref={containerRef} style={{ minHeight: 64 }} />
        {!isReady && (
          <div className="shimmer" style={{
            position: 'absolute', inset: 0,
            height: 64, borderRadius: 6,
          }} />
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
        <button onClick={() => skip(-10)} style={btnBase} title="Back 10s">
          <SkipBack size={14} />
        </button>

        <button
          onClick={togglePlay}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: isReady ? '#6366f1' : '#374151',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: isReady ? 'pointer' : 'default',
            color: 'white', transition: 'background 0.15s', flexShrink: 0,
          }}
        >
          {isPlaying
            ? <Pause size={16} />
            : <Play size={16} style={{ marginLeft: 2 }} />
          }
        </button>

        <button onClick={() => skip(10)} style={btnBase} title="Forward 10s">
          <SkipForward size={14} />
        </button>

        <span style={{ color: '#475569', fontSize: 12, flex: 1, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>
          {fmt(currentTime)} / {fmt(duration)}
        </span>

        {/* Speed */}
        <div style={{ display: 'flex', gap: 3 }}>
          {[0.75, 1, 1.25, 1.5].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              style={{
                padding: '3px 7px', borderRadius: 5, fontSize: 11,
                background: speed === s ? 'rgba(99,102,241,0.25)' : 'transparent',
                border: speed === s ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(0,0,0,0.1)',
                color: speed === s ? '#6366f1' : '#64748b', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
