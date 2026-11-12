export type Platform = 'YouTube' | 'Instagram' | 'TikTok' | 'LinkedIn' | 'Newsletter' | 'Podcast';

export type IdeaCategory = 'Tecnologia' | 'Storytelling' | 'Monetização' | 'Bastidores' | 'Design' | 'Produtividade' | 'Tendências';

export type IdeaStatus = 'Nova' | 'Em desenvolvimento' | 'Aprovada' | 'Arquivada';

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  platform: Platform;
  status: IdeaStatus;
  createdAt: string;
  isFavorite: boolean;
  tags?: string[];
}

export type ScriptStatus = 'Rascunho' | 'Em gravação' | 'Pronto' | 'Gravado';
export type ScriptFormat = 'Vídeo Curto (60s)' | 'Vídeo Longo (8-15 min)' | 'Carrossel Educativo' | 'Artigo / Newsletter' | 'Roteiro de Podcast';

export interface Script {
  id: string;
  title: string;
  platform: Platform;
  format: ScriptFormat;
  hook: string;
  body: string;
  cta: string;
  notes: string;
  status: ScriptStatus;
  wordCount: number;
  readingTimeMinutes: number;
  updatedAt: string;
}

export type PublicationStatus = 'rascunho' | 'pronto' | 'agendado' | 'publicado';

export interface Publication {
  id: string;
  title: string;
  platform: Platform;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: PublicationStatus;
  category: IdeaCategory;
  scriptId?: string;
  notes?: string;
}

export type LibraryCategory = 'Vídeos & Estética' | 'Moodboards & Design' | 'Setups & Equipamentos' | 'Modelos de Roteiro' | 'Frases & Ganchos';

export interface LibraryItem {
  id: string;
  title: string;
  category: LibraryCategory;
  type: 'image' | 'link' | 'text' | 'template';
  thumbnailUrl?: string;
  content: string;
  sourceUrl?: string;
  tags: string[];
  createdAt: string;
}

export interface UserProfile {
  name: string;
  handle: string;
  niche: string;
  bio: string;
  avatarUrl: string;
  targetPostsPerWeek: number;
  targetScriptsPerMonth: number;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionType?: 'ideas' | 'script' | 'hook' | 'repurpose' | 'caption';
  generatedContent?: {
    type: 'idea' | 'script' | 'hooks';
    data: any;
  };
}
