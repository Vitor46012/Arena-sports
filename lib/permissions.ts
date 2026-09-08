export type PlanType = "BASIC" | "PRO" | "MASTER";

export const PermissionRegistry = {
  transmission: {
    label: "Transmissão & Mesa de Corte",
    icon: "Tv",
    actions: {
      access: { label: "Acessar Painel de Transmissão", defaultBasic: true, defaultPro: true },
      edit_rtmp: { label: "Editar Servidor e Chave RTMP", defaultBasic: false, defaultPro: true },
      live_control: { label: "Iniciar/Parar Transmissão ao Vivo", defaultBasic: false, defaultPro: true }
    }
  },
  branding: {
    label: "Patrocinadores & Overlay",
    icon: "Image",
    actions: {
      access: { label: "Visualizar Patrocinadores", defaultBasic: true, defaultPro: true },
      upload: { label: "Fazer Upload de Novas Logos", defaultBasic: false, defaultPro: true }
    }
  },
  courts: {
    label: "Gestão de Quadras",
    icon: "LayoutGrid",
    actions: {
      access: { label: "Visualizar Quadras", defaultBasic: true, defaultPro: true },
      manage: { label: "Criar, Editar e Excluir Quadras", defaultBasic: false, defaultPro: true }
    }
  },
  totems: {
    label: "Totens & QR Codes",
    icon: "QrCode",
    actions: {
      generate: { label: "Gerar e Imprimir QR Codes", defaultBasic: false, defaultPro: true }
    }
  },
  cameras: {
    label: "Câmeras ao Vivo",
    icon: "Video",
    actions: {
      access: { label: "Acessar visualização RTSP", defaultBasic: false, defaultPro: true },
    }
  }
};

export const getPlanDefaults = (plan: PlanType): Record<string, boolean> => {
  const defaults: Record<string, boolean> = {};
  
  Object.entries(PermissionRegistry).forEach(([moduleKey, moduleData]) => {
    Object.entries(moduleData.actions).forEach(([actionKey, actionData]) => {
      const flatKey = `${moduleKey}.${actionKey}`;
      if (plan === 'BASIC') defaults[flatKey] = actionData.defaultBasic;
      else if (plan === 'PRO') defaults[flatKey] = actionData.defaultPro;
      else if (plan === 'MASTER') defaults[flatKey] = true; // Master has everything by default
    });
  });
  
  return defaults;
};

export const PLAN_DEFAULTS = {
  BASIC: getPlanDefaults('BASIC'),
  PRO: getPlanDefaults('PRO'),
  MASTER: getPlanDefaults('MASTER'),
};
