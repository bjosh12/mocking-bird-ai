export interface STTProvider {
  connect(): Promise<void>;
  disconnect(): void;
  sendAudio(data: Blob): void;
  onTranscript(callback: (text: string, isFinal: boolean, analytics?: { wpm: number, fillers: number }) => void): void;
}

export class DeepgramProvider implements STTProvider {
  private apiKey: string;
  private callback: ((text: string, isFinal: boolean, analytics?: { wpm: number, fillers: number }) => void) | null = null;
  private socket: WebSocket | null = null;
  private language: string;

  constructor(apiKey: string, language: string = 'en') {
    this.apiKey = apiKey;
    this.language = language;
  }

  async connect(): Promise<void> {
    if (!this.apiKey || this.apiKey === 'mock_key') {
      console.warn("Deepgram API Key is missing. Speech-to-Text will not work.");
      return;
    }

    return new Promise((resolve, reject) => {
      const url = `wss://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&interim_results=true&filler_words=true&language=${this.language}`;
      this.socket = new WebSocket(url, [
        'token',
        this.apiKey,
      ]);

      this.socket.onopen = () => {
        console.log('Connected to Deepgram WebSocket');
        resolve();
      };

      this.socket.onerror = (error) => {
        console.error('Deepgram WebSocket Error:', error);
        reject(error);
      };

      this.socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel?.alternatives[0]?.transcript;
        if (transcript && received.is_final !== undefined) {
          if (this.callback && transcript.trim().length > 0) {
            
            // Analytics logic
            let wpm = 0;
            let fillers = 0;
            const duration = received.duration || 0;
            
            if (duration > 0) {
              const words = transcript.trim().split(/\s+/).length;
              wpm = Math.round((words / duration) * 60);
            }
            
            const fillerMatches = transcript.match(/\b(um|uh|like|you know)\b/gi);
            if (fillerMatches) {
              fillers = fillerMatches.length;
            }

            this.callback(transcript, received.is_final, { wpm, fillers });
          }
        }
      };
    });
  }

  disconnect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
  }

  sendAudio(data: Blob): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    }
  }

  onTranscript(callback: (text: string, isFinal: boolean, analytics?: { wpm: number, fillers: number }) => void): void {
    this.callback = callback;
  }
}
