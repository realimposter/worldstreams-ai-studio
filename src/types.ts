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
