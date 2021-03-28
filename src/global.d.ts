declare global {
  interface Window {
    api: {
      send: (channel: string, data?: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => void;
    }
  }

  interface Document {
    pictureInPictureElement: Document;
  }
}

export {};
