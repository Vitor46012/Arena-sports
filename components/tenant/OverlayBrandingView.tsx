'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Upload, ImagePlus, X, Check, Copy, Video, QrCode, Info, Sparkles, Clock, Zap, ChevronRight } from 'lucide-react';

interface ArenaDetail {
  id: string;
  name: string;
  logoUrl: string | null;
  sponsor1Url: string | null;
  sponsor2Url: string | null;
  sponsor3Url: string | null;
  overlayText: string | null;
  courts: Array<{
    id: string;
    name: string;
    identifier: string;
  }>;
}

interface ArenaOption {
  id: string;
  name: string;
}

export default function OverlayBrandingView() {
  const [arenas, setArenas] = useState<ArenaOption[]>([]);
  const [selectedArenaId, setSelectedArenaId] = useState<string>('');
  const [arenaData, setArenaData] = useState<ArenaDetail | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Form State
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [sponsor1Url, setSponsor1Url] = useState<string>('');
  const [sponsor2Url, setSponsor2Url] = useState<string>('');
  const [sponsor3Url, setSponsor3Url] = useState<string>('');
  const [overlayText, setOverlayText] = useState<string>('AO VIVO • SPORTS REVIEW');

  // Preview State
  const [previewSponsorIndex, setPreviewSponsorIndex] = useState<number>(0);
  const [previewSponsorState, setPreviewSponsorState] = useState<'visible' | 'exiting' | 'entering'>('visible');
  const [previewSponsorProgress, setPreviewSponsorProgress] = useState<number>(0);
  const [simScore, setSimScore] = useState<{ home: number; away: number }>({ home: 3, away: 2 });
  const [simBump, setSimBump] = useState<'home' | 'away' | null>(null);
  const [simMetaUpdating, setSimMetaUpdating] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadField, setCurrentUploadField] = useState<string | null>(null);

  // Carregar arenas com retry resiliente
  useEffect(() => {
    let isMounted = true;

    const loadArenas = async (retry = 0) => {
      try {
        const res = await fetch('/api/arenas');
        if (res.ok) {
          const data: ArenaOption[] = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setArenas(data);
            setSelectedArenaId((prev) => prev || data[0].id);
            return;
          }
        }
      } catch (err) {
        if (retry < 1) {
          setTimeout(() => {
            if (isMounted) loadArenas(retry + 1);
          }, 1200);
          return;
        }
        console.warn('Aviso ao listar arenas (usando arena padrão):', err instanceof Error ? err.message : typeof err === "object" ? "Object error" : String(err));
      }

      if (isMounted) {
        // Fallback default para evitar estado travado
        const defaultArena: ArenaOption = {
          id: 'arena-pr-01',
          name: 'Arena Society Paranaguá',
        };
        setArenas([defaultArena]);
        setSelectedArenaId((prev) => prev || defaultArena.id);
      }
    };

    loadArenas();
    return () => {
      isMounted = false;
    };
  }, []);

  // Carregar dados da arena selecionada com resiliência
  useEffect(() => {
    if (!selectedArenaId) return;
    let isMounted = true;

    const loadArenaDetails = async (arenaId: string, retry = 0) => {
      try {
        const res = await fetch(`/api/arenas/${arenaId}`);
        if (res.ok) {
          const data: ArenaDetail = await res.json();
          if (isMounted && data) {
            setArenaData(data);
            setLogoUrl(data.logoUrl || '');
            setSponsor1Url(data.sponsor1Url || '');
            setSponsor2Url(data.sponsor2Url || '');
            setSponsor3Url(data.sponsor3Url || '');
            setOverlayText(data.overlayText || 'AO VIVO • SPORTS REVIEW');

            if (data.courts && data.courts.length > 0) {
              setSelectedCourtId(data.courts[0].id);
            }
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        if (retry < 1) {
          setTimeout(() => {
            if (isMounted) loadArenaDetails(arenaId, retry + 1);
          }, 1200);
          return;
        }
        console.warn('Aviso ao carregar detalhes da arena:', err instanceof Error ? err.message : typeof err === "object" ? "Object error" : String(err));
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadArenaDetails(selectedArenaId);

    return () => {
      isMounted = false;
    };
  }, [selectedArenaId]);

  const reloadArenaDetails = async () => {
    if (!selectedArenaId) return;
    try {
      const res = await fetch(`/api/arenas/${selectedArenaId}`);
      if (res.ok) {
        const data: ArenaDetail = await res.json();
        setArenaData(data);
        setLogoUrl(data.logoUrl || '');
        setSponsor1Url(data.sponsor1Url || '');
        setSponsor2Url(data.sponsor2Url || '');
        setSponsor3Url(data.sponsor3Url || '');
        setOverlayText(data.overlayText || 'AO VIVO • SPORTS REVIEW');
      }
    } catch (err) {
      console.warn('Aviso ao recarregar detalhes da arena:', err instanceof Error ? err.message : typeof err === "object" ? "Object error" : String(err));
    }
  };

  // Ciclo dos patrocinadores no preview do OBS com transição CSS suave
  const fallbackPreviewSponsors = [
    { name: 'Sports Review Pro', tag: 'Master Partner', color: 'from-orange-500 to-amber-500', text: 'SR' },
    { name: 'FastReplay AI', tag: 'Tech Partner', color: 'from-cyan-500 to-blue-600', text: 'FR' },
    { name: 'SportVision 4K', tag: 'Official Partner', color: 'from-emerald-500 to-teal-600', text: 'SV' },
  ];
  const activeSponsors = [sponsor1Url, sponsor2Url, sponsor3Url].filter(Boolean);
  const totalPreviewSponsors = activeSponsors.length > 0 ? activeSponsors.length : fallbackPreviewSponsors.length;

  useEffect(() => {
    const duration = 5000;
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setPreviewSponsorProgress(Math.min((elapsed / duration) * 100, 100));
    }, 60);

    const exitTimer = setTimeout(() => {
      setPreviewSponsorState('exiting');
    }, duration - 400);

    const switchTimer = setTimeout(() => {
      setPreviewSponsorIndex((prev) => (prev + 1) % totalPreviewSponsors);
      setPreviewSponsorState('entering');
      setTimeout(() => setPreviewSponsorState('visible'), 400);
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(exitTimer);
      clearTimeout(switchTimer);
    };
  }, [previewSponsorIndex, totalPreviewSponsors]);

  const triggerSimScore = (team: 'home' | 'away') => {
    setSimBump(team);
    setSimMetaUpdating(true);
    setSimScore((prev) => ({
      ...prev,
      [team]: prev[team] + 1,
    }));
    setTimeout(() => setSimBump(null), 800);
    setTimeout(() => setSimMetaUpdating(false), 1200);
  };

  const triggerNextPreviewSponsor = () => {
    setPreviewSponsorState('exiting');
    setTimeout(() => {
      setPreviewSponsorIndex((prev) => (prev + 1) % totalPreviewSponsors);
      setPreviewSponsorState('entering');
      setTimeout(() => setPreviewSponsorState('visible'), 400);
    }, 250);
  };

  const triggerUpload = (fieldName: string) => {
    setCurrentUploadField(fieldName);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadField) return;

    try {
      setIsUploading(currentUploadField);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', currentUploadField === 'logo' ? 'logo' : 'sponsor');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        const uploadedUrl = json.url;

        if (currentUploadField === 'logo') setLogoUrl(uploadedUrl);
        if (currentUploadField === 'sponsor1') setSponsor1Url(uploadedUrl);
        if (currentUploadField === 'sponsor2') setSponsor2Url(uploadedUrl);
        if (currentUploadField === 'sponsor3') setSponsor3Url(uploadedUrl);
      } else {
        const err = await res.json();
        alert(`Erro no upload: ${err.error || 'Falha ao enviar arquivo'}`);
      }
    } catch {
      alert('Erro de conexão ao enviar imagem.');
    } finally {
      setIsUploading(null);
      setCurrentUploadField(null);
    }
  };

  const handleSaveBranding = async () => {
    if (!selectedArenaId) return;
    try {
      setIsSaving(true);
      const res = await fetch(`/api/arenas/${selectedArenaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl: logoUrl.trim() || null,
          sponsor1Url: sponsor1Url.trim() || null,
          sponsor2Url: sponsor2Url.trim() || null,
          sponsor3Url: sponsor3Url.trim() || null,
          overlayText: overlayText.trim(),
        }),
      });

      if (res.ok) {
        alert('Design e Patrocinadores salvos com sucesso! O visual da live será atualizado em instantes.');
        await reloadArenaDetails();
      } else {
        const err = await res.json();
        alert(`Erro ao salvar: ${err.error || 'Falha na requisição'}`);
      }
    } catch {
      alert('Erro de conexão ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCourt =
    arenaData?.courts.find((c) => c.id === selectedCourtId) ||
    arenaData?.courts?.[0];

  const getObsUrl = () => {
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://arena-sports-five.vercel.app';
    const targetSlug =
      selectedCourt?.identifier ||
      selectedCourt?.id ||
      arenaData?.courts?.[0]?.identifier ||
      arenaData?.courts?.[0]?.id ||
      selectedArenaId ||
      'quadra-1';
    return `${origin}/overlay/${targetSlug}`;
  };

  const copyObsUrl = () => {
    navigator.clipboard.writeText(getObsUrl());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/png,image/webp,image/jpeg,image/svg+xml"
        className="hidden"
      />

      {/* Header Principal */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold font-mono">
              BROADCAST OBS
            </span>
            <h2 className="text-xl font-bold font-['Sora'] text-white">
              Design da Live & Patrocinadores
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Configure os patrocinadores, a logo do seu complexo e copie o link para transmitir no seu canal do YouTube com visual profissional.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {arenaData?.name && (
            <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold">
              {arenaData.name}
            </span>
          )}

          <button
            type="button"
            onClick={handleSaveBranding}
            disabled={isSaving || isLoading}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Carregando branding da arena...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUNA ESQUERDA: FORMULÁRIO DE LOGOS E SPONSORS (5 colunas) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Logo da Arena */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Logo da Arena</h3>
                  <p className="text-[11px] text-slate-400">Exibida no canto superior do overlay (PNG transparente recomendado).</p>
                </div>
                <button
                  type="button"
                  onClick={() => triggerUpload('logo')}
                  disabled={Boolean(isUploading)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isUploading === 'logo' ? 'Enviando...' : 'Enviar Imagem'}
                </button>
              </div>

              {logoUrl ? (
                <div className="flex items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-slate-900 rounded-lg p-1.5 border border-slate-800 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoUrl} alt="Logo Arena" className="max-h-full max-w-full object-contain" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:underline px-2 py-1 rounded cursor-pointer"
                  >
                    Remover imagem
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => triggerUpload('logo')}
                  className="border-2 border-dashed border-slate-800 hover:border-orange-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/40"
                >
                  <ImagePlus className="w-7 h-7 text-slate-500 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-400">Clique para enviar a logo da arena</p>
                  <span className="text-[10px] text-slate-600">PNG, WEBP ou SVG (Alta Resolução)</span>
                </div>
              )}
            </div>

            {/* Patrocinadores Oficiais */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Patrocinadores da Transmissão</h3>
                <p className="text-[11px] text-slate-400">Logos que se revezam na faixa inferior da tela no OBS Studio.</p>
              </div>

              {/* Sponsor 1 */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 font-mono">Patrocinador 1 (Principal)</span>
                  <button
                    type="button"
                    onClick={() => triggerUpload('sponsor1')}
                    className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
                  >
                    {isUploading === 'sponsor1' ? 'Enviando...' : 'Alterar logo'}
                  </button>
                </div>
                {sponsor1Url ? (
                  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="h-8 max-w-[120px] flex items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sponsor1Url} alt="Sponsor 1" className="max-h-8 object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSponsor1Url('')}
                      className="text-slate-500 hover:text-rose-400 text-xs p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => triggerUpload('sponsor1')}
                    className="w-full py-2 bg-slate-950 hover:bg-slate-800/80 border border-dashed border-slate-800 rounded-lg text-xs text-slate-400"
                  >
                    + Adicionar Patrocinador 1
                  </button>
                )}
              </div>

              {/* Sponsor 2 */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 font-mono">Patrocinador 2</span>
                  <button
                    type="button"
                    onClick={() => triggerUpload('sponsor2')}
                    className="text-xs text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
                  >
                    {isUploading === 'sponsor2' ? 'Enviando...' : 'Alterar logo'}
                  </button>
                </div>
                {sponsor2Url ? (
                  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="h-8 max-w-[120px] flex items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sponsor2Url} alt="Sponsor 2" className="max-h-8 object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSponsor2Url('')}
                      className="text-slate-500 hover:text-rose-400 text-xs p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => triggerUpload('sponsor2')}
                    className="w-full py-2 bg-slate-950 hover:bg-slate-800/80 border border-dashed border-slate-800 rounded-lg text-xs text-slate-400"
                  >
                    + Adicionar Patrocinador 2
                  </button>
                )}
              </div>

              {/* Sponsor 3 */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 font-mono">Patrocinador 3</span>
                  <button
                    type="button"
                    onClick={() => triggerUpload('sponsor3')}
                    className="text-xs text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
                  >
                    {isUploading === 'sponsor3' ? 'Enviando...' : 'Alterar logo'}
                  </button>
                </div>
                {sponsor3Url ? (
                  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="h-8 max-w-[120px] flex items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sponsor3Url} alt="Sponsor 3" className="max-h-8 object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSponsor3Url('')}
                      className="text-slate-500 hover:text-rose-400 text-xs p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => triggerUpload('sponsor3')}
                    className="w-full py-2 bg-slate-950 hover:bg-slate-800/80 border border-dashed border-slate-800 rounded-lg text-xs text-slate-400"
                  >
                    + Adicionar Patrocinador 3
                  </button>
                )}
              </div>

              {/* Texto de Overlay / Slogan */}
              <div className="pt-3 border-t border-slate-800">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Texto Institucional / Slogan
                </label>
                <input
                  type="text"
                  value={overlayText}
                  onChange={(e) => setOverlayText(e.target.value)}
                  placeholder="Ex: AO VIVO • SPORTS REVIEW"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs focus:border-orange-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: PREVIEW DO OVERLAY OBS EM TEMPO REAL + LINK (7 colunas) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* LINK PARA COPIAR NO OBS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Link para adicionar a Live no YouTube</h3>
                  <p className="text-[11px] text-slate-400">Copie e cole este link no programa de transmissão (Ex: OBS Studio)</p>
                </div>
                {arenaData?.courts && arenaData.courts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Quadra:</span>
                    <select
                      value={selectedCourtId}
                      onChange={(e) => setSelectedCourtId(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-2.5 py-1 text-xs font-semibold focus:border-orange-500 outline-none"
                    >
                      {arenaData.courts.map((court) => (
                        <option key={court.id} value={court.id}>
                          {court.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getObsUrl()}
                  className="flex-1 bg-slate-950 border border-slate-800 text-orange-400 font-mono text-xs rounded-lg px-3.5 py-2.5 outline-none"
                />
                <button
                  type="button"
                  onClick={copyObsUrl}
                  className="px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copySuccess ? 'Copiado!' : 'Copiar URL'}
                </button>
              </div>
            </div>

            {/* PREVIEW SIMULADO DO OBS 16:9 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Prévia da Tela da Live
                </span>
                <span className="text-[11px] font-mono text-slate-500">Auto-refresh 45s no OBS</span>
              </div>

              {/* Moldura 16:9 Simulando o Feed da Câmera com o Overlay por cima */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-between p-3 select-none">
                {/* Imagem de Fundo Simulando a Quadra */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800/80 opacity-90" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
                  <Video className="w-20 h-20 text-slate-600" />
                </div>

                {/* Camada Superior do Overlay Simulado: Branding & Scorebug de Metadados */}
                <div className="relative z-10 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Scorebug de Metadados com Animações CSS de Transição */}
                    <div
                      className={`relative overflow-hidden flex items-center bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-2.5 py-1.5 shadow-xl transition-all duration-500 ${
                        simMetaUpdating
                          ? 'border-orange-500/80 shadow-[0_0_20px_rgba(249,115,22,0.4)] animate-meta-flash'
                          : ''
                      }`}
                    >
                      {simMetaUpdating && (
                        <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-broadcast-sheen" />
                      )}

                      {/* Logo Arena */}
                      <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center p-0.5 mr-2 shrink-0">
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-orange-500 font-black text-[10px]">SR</span>
                        )}
                      </div>

                      {/* Arena & Quadra */}
                      <div className="border-r border-slate-800 pr-2 mr-2 hidden sm:block">
                        <span className="font-extrabold text-[11px] text-white uppercase block leading-tight truncate max-w-[90px]">
                          {arenaData?.name || 'Arena'}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-orange-400 block">
                          {selectedCourt?.name || 'Quadra 1'}
                        </span>
                      </div>

                      {/* Placar ao Vivo */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-200 uppercase max-w-[70px] truncate">
                          Time A
                        </span>

                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center font-mono font-black text-xs transition-all duration-500 ${
                            simBump === 'home'
                              ? 'scale-125 bg-orange-500 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.8)] animate-score-burst'
                              : 'bg-slate-900 border border-slate-700/80 text-orange-400'
                          }`}
                        >
                          {simScore.home}
                        </div>

                        <span className="text-slate-600 text-[10px] font-bold">:</span>

                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center font-mono font-black text-xs transition-all duration-500 ${
                            simBump === 'away'
                              ? 'scale-125 bg-orange-500 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.8)] animate-score-burst'
                              : 'bg-slate-900 border border-slate-700/80 text-orange-400'
                          }`}
                        >
                          {simScore.away}
                        </div>

                        <span className="text-[10px] font-bold text-slate-200 uppercase max-w-[70px] truncate">
                          Time B
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 backdrop-blur-sm border border-slate-700/80 px-2 py-1 rounded-lg flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                    <span className="text-[9px] font-mono font-bold text-red-400">REC 30s</span>
                  </div>
                </div>

                {/* Camada Inferior do Overlay Simulado */}
                <div className="relative z-10 flex items-end justify-between gap-2">
                  <div className="bg-slate-950/80 backdrop-blur-sm border border-slate-700/80 px-2 py-1 rounded-lg text-[9px] text-slate-300 flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-orange-500 shrink-0" />
                    <span className="truncate max-w-[140px] sm:max-w-none">
                      QR Code no alambrado para rever lances
                    </span>
                  </div>

                  {/* Carrossel de Patrocinadores com Transição CSS Suave */}
                  <div className="relative overflow-hidden bg-slate-950/90 backdrop-blur-sm border border-slate-700/80 px-2.5 py-1.5 rounded-xl flex flex-col gap-1 min-w-[160px] max-w-[200px]">
                    {previewSponsorState === 'entering' && (
                      <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-broadcast-sheen" />
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[8px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-orange-400 animate-pulse" />
                        Patrocínio
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: totalPreviewSponsors }).map((_, idx) => (
                          <span
                            key={idx}
                            className={`h-1 rounded-full transition-all duration-300 ${
                              idx === previewSponsorIndex % totalPreviewSponsors
                                ? 'w-3 bg-orange-500'
                                : 'w-1 bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="h-6 flex items-center justify-center overflow-hidden">
                      {activeSponsors.length > 0 ? (
                        <div
                          key={previewSponsorIndex}
                          className={`w-full h-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                            previewSponsorState === 'exiting'
                              ? 'opacity-0 -translate-x-3 scale-95 blur-sm'
                              : previewSponsorState === 'entering'
                              ? 'opacity-0 translate-x-3 scale-95 blur-sm'
                              : 'opacity-100 translate-x-0 scale-100 blur-0 animate-sponsor-wipe'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activeSponsors[previewSponsorIndex % activeSponsors.length]}
                            alt="Sponsor Preview"
                            className="max-h-5 object-contain"
                          />
                        </div>
                      ) : (
                        (() => {
                          const sp = fallbackPreviewSponsors[previewSponsorIndex % fallbackPreviewSponsors.length];
                          return (
                            <div
                              key={previewSponsorIndex}
                              className={`w-full flex items-center gap-1.5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                previewSponsorState === 'exiting'
                                  ? 'opacity-0 -translate-x-3 scale-95 blur-sm'
                                  : previewSponsorState === 'entering'
                                  ? 'opacity-0 translate-x-3 scale-95 blur-sm'
                                  : 'opacity-100 translate-x-0 scale-100 blur-0 animate-sponsor-wipe'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded bg-gradient-to-br ${sp.color} flex items-center justify-center text-white font-black text-[8px] shrink-0`}
                              >
                                {sp.text}
                              </div>
                              <span className="text-[9px] font-bold text-slate-200 truncate">
                                {sp.name}
                              </span>
                            </div>
                          );
                        })()
                      )}
                    </div>

                    {/* Barra de Progresso do Patrocinador */}
                    <div className="w-full bg-slate-800 h-0.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 transition-[width] duration-75 ease-linear"
                        style={{ width: `${previewSponsorProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Controles de Simulação de Transição para o Administrador */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-orange-400" />
                  Testar Animações do Overlay:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => triggerSimScore('home')}
                    className="px-2 py-1 rounded bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    +1 Gol Time A
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerSimScore('away')}
                    className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    +1 Gol Time B
                  </button>
                  <button
                    type="button"
                    onClick={triggerNextPreviewSponsor}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    Girar Patrocinador
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Guia Rápido de Configuração no OBS Studio */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-xs space-y-2">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-orange-500 shrink-0" />
                  Como transmitir no YouTube (via OBS Studio):
                </div>
                <ol className="list-decimal list-inside text-slate-400 space-y-1 text-[11px]">
                  <li>No OBS, clique em <strong>+ (Adicionar Fonte)</strong> e selecione <strong>Navegador (Browser)</strong>.</li>
                  <li>Cole a URL acima no campo <strong>URL</strong>.</li>
                  <li>Defina a <strong>Largura: 1920</strong> e <strong>Altura: 1080</strong>.</li>
                  <li>Marque a opção <em>&quot;Desativar fonte quando não visível&quot;</em> e clique em OK.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
