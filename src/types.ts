export interface Worldstream {
  publicId: string;
  title: string;
  worldName: string;
  description: string;
  type: string;
  status: string;
  viewerCount: number | null;
  thumbnailUrl: string;
  worldLogoUrl: string;
  demoVideoEnabled: boolean;
  demoVideoUrl: string;
  isCustom?: boolean;
  visualStyle?: string;
  audienceMechanics?: string;
}

export interface CatalogResponse {
  worldstreams: Worldstream[];
  source: 'live' | 'cache';
  updatedAt: string;
}

export interface Recommendation {
  publicId: string;
  reason: string;
}

export interface DiscoveryResponse {
  intro: string;
  recommendations: Recommendation[];
  poweredBy: 'gemini' | 'catalog';
}

export interface PollChoice {
  id: string;
  text: string;
  votesPercent: number;
}

export interface AudienceReaction {
  user: string;
  message: string;
  sentiment: 'excited' | 'tense' | 'surprised' | 'analytical';
}

export interface DirectorBranch {
  sceneNumber: number;
  sceneTitle: string;
  narrativeEvent: string;
  videoGenerationPrompt: string;
  tensionLevel: 'low' | 'moderate' | 'critical' | 'chaotic';
  audiencePoll: {
    question: string;
    choices: PollChoice[];
  };
  audienceChat: AudienceReaction[];
  directorNotes: string;
}

export interface ArchitectResult {
  world: Worldstream;
  loreOverview: string;
  visualStyle: string;
  audienceRules: string;
  firstSceneDilemma: string;
}
