export const aiConfig = {
  openai: {
    maxRetries: 3,
    retryDelay: 1000, // milliseconds
    rateLimits: {
      imagesPerMinute: 50,
      tokensPerMinute: 150000,
    },
    models: {
      image: 'dall-e-3',
      chat: 'gpt-4-turbo-preview',
    },
  },
  suno: {
    maxRetries: 3,
    retryDelay: 2000,
    rateLimits: {
      requestsPerMinute: 10,
    },
  },
  generation: {
    image: {
      defaultSize: '1024x1024',
      defaultQuality: 'standard',
      defaultStyle: 'vivid',
      maxPromptLength: 4000,
      supportedFormats: ['png', 'jpg', 'webp'],
    },
    audio: {
      defaultDuration: 60,
      minDuration: 5,
      maxDuration: 300,
      supportedFormats: ['mp3', 'wav', 'ogg'],
    },
  },
};