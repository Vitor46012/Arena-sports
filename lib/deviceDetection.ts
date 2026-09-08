'use client';

export type DeviceFormFactor = 'mobile' | 'tablet' | 'desktop' | 'tv';
export type ResolutionKey = 'auto' | '480p' | '720p' | '1080p' | '4k' | 'vertical-720p' | 'vertical-1080p';

export interface ResolutionProfile {
  id: ResolutionKey;
  name: string;
  shortTag: string;
  width: number;
  height: number;
  aspectRatio: string;
  fps: number;
  bitrateKbps: number;
  recommendedFor: string;
}

export const RESOLUTION_PRESETS: Record<Exclude<ResolutionKey, 'auto'>, ResolutionProfile> = {
  '480p': {
    id: '480p',
    name: 'SD 480p Econômico',
    shortTag: '480p 30FPS',
    width: 854,
    height: 480,
    aspectRatio: '16:9',
    fps: 30,
    bitrateKbps: 1200,
    recommendedFor: 'Redes móveis 3G ou modo economia de dados',
  },
  '720p': {
    id: '720p',
    name: 'HD 720p60 (Otimizado Mobile)',
    shortTag: '720p 60FPS',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    fps: 60,
    bitrateKbps: 2800,
    recommendedFor: 'Smartphones e tablets (baixo consumo e alta fluidez esportiva)',
  },
  '1080p': {
    id: '1080p',
    name: 'Full HD 1080p60 Broadcast',
    shortTag: '1080p 60FPS',
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    fps: 60,
    bitrateKbps: 5500,
    recommendedFor: 'Desktops, Notebooks, Totens e Smart TVs em quadras',
  },
  '4k': {
    id: '4k',
    name: 'Ultra HD 4K Pro',
    shortTag: '4K 60FPS',
    width: 3840,
    height: 2160,
    aspectRatio: '16:9',
    fps: 60,
    bitrateKbps: 14000,
    recommendedFor: 'Monitores 4K, Smart TVs grandes e painéis LED de alta densidade',
  },
  'vertical-720p': {
    id: 'vertical-720p',
    name: 'Vertical HD 720x1280 (Reels / Stories)',
    shortTag: 'Vertical 720p',
    width: 720,
    height: 1280,
    aspectRatio: '9:16',
    fps: 60,
    bitrateKbps: 2600,
    recommendedFor: 'Celular em pé (Visualização rápida vertical)',
  },
  'vertical-1080p': {
    id: 'vertical-1080p',
    name: 'Vertical Full HD 1080x1920 (Reels Pro)',
    shortTag: 'Vertical 1080p',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    fps: 60,
    bitrateKbps: 5000,
    recommendedFor: 'Smartphones OLED/Retina e Totens verticais de quadra',
  },
};

export interface DeviceSpecs {
  formFactor: DeviceFormFactor;
  modelName: string;
  osName: string;
  browserName: string;
  viewport: {
    width: number;
    height: number;
  };
  screen: {
    width: number;
    height: number;
    dpr: number;
    physicalWidth: number;
    physicalHeight: number;
    colorDepth: number;
  };
  orientation: 'portrait' | 'landscape';
  aspectRatio: {
    ratio: number;
    label: string;
  };
  isTouch: boolean;
  isRetina: boolean;
  isHDR: boolean;
  network?: {
    effectiveType?: string;
    downlinkMbps?: number;
    saveData?: boolean;
  };
  recommendedResolution: ResolutionProfile;
  detectionReason: string;
}

export const DEFAULT_DEVICE_SPECS: DeviceSpecs = {
  formFactor: 'desktop',
  modelName: 'Desktop / PC',
  osName: 'Desktop OS',
  browserName: 'Navegador Web',
  viewport: { width: 1280, height: 720 },
  screen: {
    width: 1920,
    height: 1080,
    dpr: 1,
    physicalWidth: 1920,
    physicalHeight: 1080,
    colorDepth: 24,
  },
  orientation: 'landscape',
  aspectRatio: { ratio: 1.78, label: '16:9' },
  isTouch: false,
  isRetina: false,
  isHDR: false,
  recommendedResolution: RESOLUTION_PRESETS['1080p'],
  detectionReason: 'Inicialização Servidor (Padrão Broadcast 1080p)',
};

/**
 * Executa a identificação completa de hardware, tela e dispositivo
 */
export function detectDeviceSpecs(
  windowObj?: Window,
  viewportWidth?: number,
  viewportHeight?: number
): DeviceSpecs {
  if (typeof window === 'undefined' && !windowObj) {
    return DEFAULT_DEVICE_SPECS;
  }

  const win = windowObj || window;
  const nav = win.navigator || ({} as Navigator);
  const ua = nav.userAgent || '';
  const dpr = Math.min(Math.max(win.devicePixelRatio || 1, 1), 4);

  // Viewport & Dimensões
  const vWidth = viewportWidth ?? (win.innerWidth || 1200);
  const vHeight = viewportHeight ?? (win.innerHeight || 800);

  const sWidth = win.screen?.width || vWidth;
  const sHeight = win.screen?.height || vHeight;
  const physicalWidth = Math.round(sWidth * dpr);
  const physicalHeight = Math.round(sHeight * dpr);

  // Orientação e Aspect Ratio
  const isPortrait = vHeight > vWidth;
  const orientation: 'portrait' | 'landscape' = isPortrait ? 'portrait' : 'landscape';
  const ratio = Number((vWidth / (vHeight || 1)).toFixed(2));

  let aspectLabel = '16:9';
  if (ratio >= 2.0) aspectLabel = '21:9 (Ultrawide)';
  else if (ratio >= 1.7) aspectLabel = '16:9 (Widescreen)';
  else if (ratio >= 1.55) aspectLabel = '16:10';
  else if (ratio >= 1.3) aspectLabel = '4:3';
  else if (ratio <= 0.6) aspectLabel = '9:16 (Vertical)';
  else if (ratio <= 0.8) aspectLabel = '3:4';
  else aspectLabel = `${ratio}:1`;

  // Toque & Capacidades de Hardware
  const isTouch = 'ontouchstart' in win || (nav.maxTouchPoints ?? 0) > 0;
  const isRetina = dpr >= 1.5;
  const isHDR = !!(win.matchMedia && win.matchMedia('(dynamic-range: high)').matches);

  // Detecção de Rede (se suportado pelo navegador)
  let networkInfo: DeviceSpecs['network'] = undefined;
  const conn = (nav as unknown as { connection?: { effectiveType?: string; downlink?: number; saveData?: boolean } }).connection;
  if (conn) {
    networkInfo = {
      effectiveType: conn.effectiveType,
      downlinkMbps: conn.downlink,
      saveData: conn.saveData,
    };
  }

  // Identificação do Modelo e Sistema
  let modelName = 'Desktop / PC';
  let osName = 'Desktop OS';
  let formFactor: DeviceFormFactor = 'desktop';

  const isSmartTV = /SmartTV|Tizen|Web0S|NetCast|HbbTV|AppleTV|BRAVIA|Roku|Viera|GoogleTV/i.test(ua);
  const isIpad = /iPad|Macintosh/i.test(ua) && isTouch && vWidth >= 768;
  const isIphone = /iPhone/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobileUa = /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera Mini/i.test(ua);

  if (isSmartTV || (vWidth >= 1920 && !isTouch && /TV/i.test(ua))) {
    formFactor = 'tv';
    modelName = 'Smart TV / Totem Digital';
    osName = 'TV Display OS';
  } else if (isIphone) {
    formFactor = 'mobile';
    modelName = 'Apple iPhone';
    osName = 'iOS';
  } else if (isIpad) {
    formFactor = 'tablet';
    modelName = 'Apple iPad';
    osName = 'iPadOS';
  } else if (isAndroid) {
    if (!isMobileUa || vWidth >= 768) {
      formFactor = 'tablet';
      modelName = 'Tablet Android';
    } else {
      formFactor = 'mobile';
      modelName = 'Smartphone Android';
    }
    osName = 'Android';
  } else if (isTouch && vWidth < 768) {
    formFactor = 'mobile';
    modelName = 'Smartphone Móvel';
    osName = 'Mobile Web';
  } else if (isTouch && vWidth < 1024) {
    formFactor = 'tablet';
    modelName = 'Tablet Touch';
    osName = 'Tablet OS';
  } else {
    formFactor = 'desktop';
    if (/Mac OS X|Macintosh/i.test(ua)) {
      osName = 'macOS';
      modelName = isRetina ? 'MacBook / iMac (Retina)' : 'Mac Desktop';
    } else if (/Windows/i.test(ua)) {
      osName = 'Windows';
      modelName = 'PC Desktop / Laptop';
    } else if (/Linux/i.test(ua)) {
      osName = 'Linux';
      modelName = 'Estação Linux';
    }
  }

  // Navegador
  let browserName = 'Navegador Web';
  if (/Edg\//i.test(ua)) browserName = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua)) browserName = 'Google Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browserName = 'Apple Safari';
  else if (/Firefox\//i.test(ua)) browserName = 'Mozilla Firefox';

  // Lógica de cálculo da Resolução Ideal Automática ("Pegar a Resolução Certa")
  let recommended: ResolutionProfile = RESOLUTION_PRESETS['1080p'];
  let reason = '';

  // 1. Caso modo economia de dados ou conexão 2G/3G lenta
  if (networkInfo?.saveData || networkInfo?.effectiveType === '2g' || networkInfo?.effectiveType === '3g') {
    recommended = RESOLUTION_PRESETS['480p'];
    reason = `Conexão limitada (${networkInfo.effectiveType?.toUpperCase() || 'Econômica'}). Resolução ajustada para 480p para evitar travamentos.`;
  }
  // 2. Dispositivo Móvel em modo Retrato (Vertical)
  else if (formFactor === 'mobile' && isPortrait) {
    if (dpr >= 2 && physicalWidth >= 1080) {
      recommended = RESOLUTION_PRESETS['vertical-1080p'];
      reason = `Smartphone em modo retrato com tela Super Retina (Física: ${physicalWidth}x${physicalHeight}px). Resolução vertical Full HD selecionada.`;
    } else {
      recommended = RESOLUTION_PRESETS['vertical-720p'];
      reason = `Smartphone em modo retrato. Resolução vertical 720p selecionada para otimização de bateria e reprodução ágil.`;
    }
  }
  // 3. Dispositivo Móvel em modo Paisagem (Horizontal)
  else if (formFactor === 'mobile') {
    recommended = RESOLUTION_PRESETS['720p'];
    reason = `Smartphone em tela horizontal. Resolução 720p a 60 FPS selecionada para fluidez máxima de replays esportivos sem superaquecimento.`;
  }
  // 4. Tablets
  else if (formFactor === 'tablet') {
    if (isRetina && Math.max(physicalWidth, physicalHeight) >= 1920) {
      recommended = RESOLUTION_PRESETS['1080p'];
      reason = `Tablet de alta densidade (${physicalWidth}x${physicalHeight}px). Resolução Full HD 1080p a 60 FPS aplicada.`;
    } else {
      recommended = RESOLUTION_PRESETS['720p'];
      reason = `Tablet compacto. Resolução HD 720p selecionada.`;
    }
  }
  // 5. Smart TVs, Totens ou Telas 4K
  else if (formFactor === 'tv' || (physicalWidth >= 3200 && physicalHeight >= 1800)) {
    // Se tela for 4K real e conexão rápida
    if (physicalWidth >= 3840 && (!networkInfo || networkInfo.downlinkMbps === undefined || networkInfo.downlinkMbps > 15)) {
      recommended = RESOLUTION_PRESETS['4k'];
      reason = `Tela 4K Ultra HD detectada (${physicalWidth}x${physicalHeight}px). Reprodução cristalina em 4K ativada.`;
    } else {
      recommended = RESOLUTION_PRESETS['1080p'];
      reason = `Display de grande formato / Totem. Resolução padrão profissional Full HD 1080p a 60 FPS.`;
    }
  }
  // 6. Desktop padrão
  else {
    if (physicalWidth >= 1920 || vWidth >= 1200) {
      recommended = RESOLUTION_PRESETS['1080p'];
      reason = `Desktop Full HD (${vWidth}x${vHeight}px @ ${dpr}x DPR). Taxa esportiva de 1080p a 60 FPS selecionada.`;
    } else {
      recommended = RESOLUTION_PRESETS['720p'];
      reason = `Tela de resolução moderada (${vWidth}x${vHeight}px). Resolução balanceada 720p60 aplicada.`;
    }
  }

  return {
    formFactor,
    modelName,
    osName,
    browserName,
    viewport: { width: vWidth, height: vHeight },
    screen: {
      width: sWidth,
      height: sHeight,
      dpr,
      physicalWidth,
      physicalHeight,
      colorDepth: win.screen?.colorDepth || 24,
    },
    orientation,
    aspectRatio: { ratio, label: aspectLabel },
    isTouch,
    isRetina,
    isHDR,
    network: networkInfo,
    recommendedResolution: recommended,
    detectionReason: reason,
  };
}

/**
 * Obtém a resolução correta considerando a preferência do usuário (Auto ou Manual)
 */
export function resolveTargetResolution(
  specs: DeviceSpecs,
  preference: ResolutionKey = 'auto'
): ResolutionProfile {
  if (preference === 'auto' || !preference) {
    return specs.recommendedResolution;
  }
  return RESOLUTION_PRESETS[preference] || specs.recommendedResolution;
}
