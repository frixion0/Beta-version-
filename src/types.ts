export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  settings: {
    model: string;
    style: string;
    dimensions: string;
    guidance: number;
    seed?: number;
  };
}

export type AppView = 'home' | 'gallery' | 'settings' | 'api';

export const PRESETS = [
  { name: 'None', keywords: '' },
  { name: 'Cinematic', keywords: '8k, anamorphic lens, dramatic lighting, highly detailed, cinematic composition' },
  { name: 'Digital Art', keywords: 'digital illustration, sharp focus, vibrant colors, artstation style, smooth gradients' },
  { name: 'Photography', keywords: 'photorealistic, 35mm lens, f/1.8, natural lighting, high resolution, raw photo' },
  { name: 'Cyberpunk', keywords: 'neon lights, futuristic, rainy streets, high tech, glowing accents, synthwave aesthetic' },
  { name: 'Fantasy', keywords: 'ethereal, magical, intricate details, epic scale, soft glow, mystical atmosphere' },
  { name: 'Anime', keywords: 'studio ghibli style, cel shaded, vibrant, expressive, high quality anime art' },
];

export const MODELS = [
  { id: '@cf/blackforestlabs/ux-1-schnell', name: 'Flux.1 Schnell' },
  { id: '@cf/stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL 1.0' },
];
