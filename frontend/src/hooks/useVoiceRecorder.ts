import { useCallback, useEffect, useRef, useState } from 'react';
import { logWarn, logError, logInfo, recordMediaCaptured } from '../telemetry';

type RecorderStatus = 'idle' | 'recording' | 'ready' | 'error';

export interface VoiceCapture {
  url: string;
  duration: number;
  size: number;
}

export function useVoiceRecorder(maxSeconds = 90) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [recorded, setRecorded] = useState<VoiceCapture | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const convertBlobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
      
      const duration = elapsedRef.current;
      recordMediaCaptured('audio', duration * 1000);
      logInfo('Voice recording completed', {
        'component': 'useVoiceRecorder',
        'duration_seconds': duration.toString(),
        'max_seconds': maxSeconds.toString()
      });
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus((prev) => (prev === 'recording' ? 'ready' : prev));
    setElapsed(0);
  }, [maxSeconds]);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      logWarn('MediaDevices API not supported', {
        'component': 'useVoiceRecorder',
        'user_agent': navigator.userAgent
      });
      setError('Microphone access is not supported in this browser.');
      setStatus('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      logInfo('Microphone access granted', {
        'component': 'useVoiceRecorder',
        'max_seconds': maxSeconds.toString()
      });
      
      cleanupStream();
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = await convertBlobToDataUrl(blob);
        const duration = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0;
        setRecorded({ url, duration, size: blob.size });
        cleanupStream();
        recorderRef.current = null;
        startTimeRef.current = null;
      };

      recorder.start();
      setStatus('recording');
      setError(null);
      startTimeRef.current = Date.now();
      intervalRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          const next = (Date.now() - startTimeRef.current) / 1000;
          elapsedRef.current = next;
          setElapsed(next);
          if (next >= maxSeconds) {
            stopRecording();
          }
        }
      }, 200);
    } catch (error) {
      logError('Microphone access denied', error as Error, {
        'component': 'useVoiceRecorder'
      });
      setError('Unable to start recording. Please allow microphone access.');
      setStatus('error');
    }
  }, [maxSeconds, stopRecording]);

  const reset = useCallback(() => {
    stopRecording();
    setRecorded(null);
    setStatus('idle');
    setError(null);
    setElapsed(0);
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      stopRecording();
      cleanupStream();
    };
  }, [stopRecording]);

  return {
    startRecording,
    stopRecording,
    reset,
    status,
    error,
    recorded,
    elapsed: Math.min(elapsed, maxSeconds),
    maxSeconds,
  };
}
