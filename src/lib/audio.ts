export class AudioRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private onDataAvailable: (data: Blob) => void;
  private mode: 'system' | 'mic';

  constructor(onDataAvailable: (data: Blob) => void, mode: 'system' | 'mic' = 'mic') {
    this.onDataAvailable = onDataAvailable;
    this.mode = mode;
  }

  async start() {
    try {
      if (this.mode === 'system') {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: { mandatory: { chromeMediaSource: 'desktop' } } as any,
          video: { mandatory: { chromeMediaSource: 'desktop' } } as any
        });
        this.stream.getVideoTracks().forEach(track => track.stop());
      } else {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      this.recorder = new MediaRecorder(this.stream, { mimeType: 'audio/webm' });
      
      this.recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.onDataAvailable(e.data);
        }
      };

      // Collect data every 250ms for low latency
      this.recorder.start(250);
      return true;
    } catch (error) {
      console.error('Error starting system audio capture:', error);
      return false;
    }
  }

  stop() {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
}
