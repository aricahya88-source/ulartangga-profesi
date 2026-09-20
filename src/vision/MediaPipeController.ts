import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

export type GestureHandler = (gesture: string, score: number) => void;

/**
 * Optional controller for a later gesture mode. It is not started automatically,
 * so the base game has no camera permission prompt. When enabled, video stays on-device.
 */
export class MediaPipeController {
  private recognizer: any = null;
  private raf = 0;

  async initialize(video: HTMLVideoElement, onGesture: GestureHandler) {
    const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm');
    this.recognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task'
      },
      runningMode: 'VIDEO',
      numHands: 1
    });
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;
    await video.play();

    const loop = () => {
      if (!this.recognizer) return;
      const result = this.recognizer.recognizeForVideo(video, performance.now());
      const best = result.gestures?.[0]?.[0];
      if (best) onGesture(best.categoryName, best.score ?? 0);
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  stop(video?: HTMLVideoElement) {
    cancelAnimationFrame(this.raf);
    this.recognizer?.close();
    this.recognizer = null;
    const stream = video?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (video) video.srcObject = null;
  }
}
