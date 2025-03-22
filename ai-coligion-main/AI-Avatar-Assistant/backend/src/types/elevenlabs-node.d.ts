declare module 'elevenlabs-node' {
  interface VoiceSettings {
    stability: number;
    similarity_boost: number;
  }

  interface TextToSpeechParameters {
    text: string;
    voice_settings: VoiceSettings;
    model_id: string;
  }

  interface Voice {
    voice_id: string;
    name: string;
    settings?: VoiceSettings;
  }

  class TextToSpeech {
    constructor(apiKey: string);
    textToSpeechBinary(voiceId: string, params: TextToSpeechParameters): Promise<Buffer>;
    getVoices(): Promise<Voice[]>;
    getVoice(voiceId: string): Promise<Voice>;
  }

  const _default: {
    TextToSpeech: typeof TextToSpeech;
    VoiceSettings: VoiceSettings;
  };
  export default _default;
} 