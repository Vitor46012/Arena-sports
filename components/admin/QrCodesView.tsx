'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, QrCode, Link2, Download, Camera } from 'lucide-react';
import SportsReviewLogo from '@/components/common/SportsReviewLogo';

interface CourtData {
  id: string;
  name: string;
  identifier: string;
  arenaId: string;
  active: boolean;
  arena: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
}

interface ArenaOption {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface QrCodesViewProps {
  embedded?: boolean;
}

export default function QrCodesView({ embedded = false }: QrCodesViewProps) {
  const [arenas, setArenas] = useState<ArenaOption[]>([]);
  const [selectedArenaId, setSelectedArenaId] = useState<string>('');
  const [courts, setCourts] = useState<CourtData[]>([]);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [printTargetCourtId, setPrintTargetCourtId] = useState<string | null>(null);

  // Carregar lista de arenas com resiliência
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
      }

      if (isMounted) {
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

  // Carregar quadras da arena selecionada
  useEffect(() => {
    if (!selectedArenaId) return;
    let isMounted = true;

    const loadCourts = async () => {
      try {
        const res = await fetch(`/api/courts?arenaId=${selectedArenaId}`);
        const courtList: CourtData[] = res.ok ? await res.json() : [];
        if (!isMounted) return;

        setCourts(courtList);

        // URL base de produção obrigatória para impressão e escaneamento físico
        const envUrl = process.env.NEXT_PUBLIC_APP_URL;
        const baseUrl =
          envUrl && !envUrl.includes('localhost') && !envUrl.includes('ais-dev') && !envUrl.includes('run.app')
            ? envUrl.replace(/\/$/, '')
            : 'https://arena-sports-five.vercel.app';

        const codes: Record<string, string> = {};
        const QRCodeModule = await import('qrcode');
        const QRCode = QRCodeModule.default || QRCodeModule;
        for (const court of courtList) {
          const courtSlug = court.identifier || court.id;
          const targetUrl = `${baseUrl}/replays/${courtSlug}`;
          try {
            const dataUrl = await QRCode.toDataURL(targetUrl, {
              width: 512,
              margin: 2,
              color: {
                dark: '#0f172a',
                light: '#ffffff',
              },
              errorCorrectionLevel: 'H',
            });
            codes[court.id] = dataUrl;
          } catch (qrErr) {
            console.warn('Erro gerando QR Code', court.id, String(qrErr));
          }
        }
        if (isMounted) {
          setQrCodes(codes);
        }
      } catch (err) {
        console.warn('Erro ao carregar quadras:', err instanceof Error ? err.message : typeof err === "object" ? "Object error" : String(err));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCourts();
    return () => {
      isMounted = false;
    };
  }, [selectedArenaId]);

  const handlePrint = (courtId?: string) => {
    setPrintTargetCourtId(courtId || null);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const getBaseUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('ais-dev') && !envUrl.includes('run.app')) {
      return envUrl.replace(/\/$/, '');
    }
    return 'https://arena-sports-five.vercel.app';
  };

  const copyUrl = (court: CourtData) => {
    const baseUrl = getBaseUrl();
    const courtSlug = court.identifier || court.id;
    const targetUrl = `${baseUrl}/replays/${courtSlug}`;
    navigator.clipboard.writeText(targetUrl);
    alert(`Link da ${court.name} copiado para a área de transferência!`);
  };

  const downloadQr = (court: CourtData) => {
    const dataUrl = qrCodes[court.id];
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qrcode_${court.identifier || court.id}.png`;
    a.click();
  };

  const selectedArena = arenas.find((a) => a.id === selectedArenaId);

  return (
    <div className={`${embedded ? 'p-2 sm:p-4' : 'min-h-screen p-4 sm:p-8'} bg-slate-950 text-slate-100 font-sans antialiased`}>
      {/* Estilos específicos de impressão para Totem / Placa de Alambrado */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .totem-card {
            page-break-after: always;
            break-after: page;
            background: #ffffff !important;
            color: #0f172a !important;
            border: 4px solid #0f172a !important;
            box-shadow: none !important;
            margin: 0 auto 20mm auto !important;
            max-width: 170mm !important;
            padding: 15mm 10mm !important;
            border-radius: 16px !important;
          }
          .totem-card * {
            color: #0f172a !important;
          }
          .totem-accent {
            background-color: #f97316 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* HEADER DA PÁGINA (Não impresso) */}
      <header className="no-print max-w-6xl mx-auto mb-8 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <SportsReviewLogo variant="compact" size="sm" />
            <span className="px-2.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold font-mono uppercase">
              Totens & Alambrados
            </span>
          </div>
          <h1 className="text-2xl font-bold font-['Sora'] text-white">
            Gerador de Placas & QR Codes das Quadras
          </h1>
          <p className="text-xs text-slate-400">
            Imprima totens de alta resolução para fixar no alambrado e permitir acesso instantâneo aos replays pelos atletas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!embedded && (
            <Link
              href="/"
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Painel
            </Link>
          )}

          <button
            type="button"
            onClick={() => handlePrint()}
            disabled={courts.length === 0}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir Todas as Placas
          </button>
        </div>
      </header>

      {/* BARRA DE STATUS / CONTAGEM (Não impresso) */}
      <div className="no-print max-w-6xl mx-auto mb-8 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="text-xs font-semibold text-slate-300">
          {selectedArena?.name || 'Arena Esportiva'}
        </div>

        <div className="text-xs font-mono text-slate-400">
          Total: <span className="text-orange-400 font-bold">{courts.length}</span>{' '}
          {courts.length === 1 ? 'quadra configurada' : 'quadras configuradas'}
        </div>
      </div>

      {/* LISTA / GRID DE TOTENS */}
      <main className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            <span className="text-xs font-mono text-slate-400">Gerando QR Codes vetoriais...</span>
          </div>
        ) : courts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <QrCode className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">Nenhuma quadra cadastrada nesta arena</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Acesse a aba &quot;Gestão de Quadras&quot; no painel administrativo para cadastrar as quadras da arena.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print-container">
            {courts
              .filter((c) => !printTargetCourtId || c.id === printTargetCourtId)
              .map((court) => {
                const qrUrl = qrCodes[court.id];
                const baseUrl = getBaseUrl();
                const courtSlug = court.identifier || court.id;
                const directUrl = `${baseUrl}/replays/${courtSlug}`;

                return (
                  <div
                    key={court.id}
                    className="totem-card bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 pt-14 sm:pt-8 flex flex-col items-center text-center shadow-2xl relative transition-all group hover:border-slate-700"
                  >
                    {/* BARRINHA DE AÇÕES RÁPIDAS (Não impresso) */}
                    <div className="no-print absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={() => copyUrl(court)}
                        title="Copiar URL do Atleta"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadQr(court)}
                        title="Baixar PNG em Alta Resolução"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrint(court.id)}
                        title="Imprimir esta Placa"
                        className="p-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>

                    {/* MOLDURA PROFISSIONAL DO TOTEM / PLACA */}
                    <div className="w-full space-y-4">
                      {/* Topo do Totem */}
                      <div className="flex flex-col items-center space-y-2">
                        <div className="px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono font-bold text-[10px] sm:text-[11px] uppercase tracking-wider totem-accent whitespace-nowrap text-center inline-flex items-center justify-center max-w-full">
                          SPORTS REVIEW • REPLAY AUTOMÁTICO
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black font-['Sora'] text-white uppercase tracking-tight">
                          {court.name}
                        </h2>
                        <p className="text-xs font-semibold text-slate-400">
                          {selectedArena?.name || court.arena?.name || 'Arena Esportiva'}
                        </p>
                      </div>

                      {/* Caixa do QR Code em Alta Resolução com moldura de contraste */}
                      <div className="my-6 p-4 sm:p-5 bg-white rounded-2xl shadow-xl border-4 border-slate-950 inline-block">
                        {qrUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={qrUrl}
                            alt={`QR Code ${court.name}`}
                            className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                          />
                        ) : (
                          <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                            Carregando QR...
                          </div>
                        )}
                      </div>

                      {/* Mensagem de Chamada / Call to Action */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-center gap-2 text-base sm:text-lg font-extrabold text-slate-100">
                          <Camera className="w-5 h-5 text-orange-500" />
                          <span>Aponte a câmera para ver seu lance</span>
                        </div>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Apertou o botão na quadra? Escaneie e assista aos seus melhores lances na hora, direto no celular!
                        </p>
                      </div>

                      {/* Rodapé técnico do totem */}
                      <div className="pt-4 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
                        <span>Código: {court.identifier || court.id}</span>
                        <span className="text-right text-slate-300 font-semibold select-all break-all">{directUrl}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </main>
    </div>
  );
}
