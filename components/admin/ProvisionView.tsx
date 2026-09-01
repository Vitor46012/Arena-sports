'use client';

import React, { useState } from 'react';
import ArenaModal, { ArenaInfraData } from './ArenaModal';

const INITIAL_ARENAS: ArenaInfraData[] = [
  {
    id: 'arena-01',
    name: 'Arena Society Paranaguá',
    cityState: 'Paranaguá - PR',
    courtsCount: 3,
    contactName: 'Carlos Eduardo Silva',
    contactPhone: '(41) 99876-1122',
    plan: 'Enterprise 4 Quadras',
    status: 'ONLINE',
    macAddress: 'B8:27:EB:A4:91:0F',
    ipLan: '192.168.15.200',
    mqttToken: 'tok_live_n100_pr112_987456',
    cameras: [
      {
        courtNumber: 1,
        cameraName: 'Câmera Principal (Society)',
        rtspUrl: 'rtsp://admin:pass123@192.168.15.51:554/stream1',
        esp32Ip: '192.168.15.101',
        status: 'ONLINE',
      },
      {
        courtNumber: 2,
        cameraName: 'Câmera Secundária (Futebol 7)',
        rtspUrl: 'rtsp://admin:pass123@192.168.15.52:554/stream1',
        esp32Ip: '192.168.15.102',
        status: 'ONLINE',
      },
      {
        courtNumber: 3,
        cameraName: 'Câmera Beach Tennis',
        rtspUrl: 'rtsp://admin:pass123@192.168.15.53:554/stream1',
        esp32Ip: '192.168.15.103',
        status: 'ONLINE',
      },
    ],
  },
  {
    id: 'arena-02',
    name: 'Clube Pinheiros Society',
    cityState: 'São Paulo - SP',
    courtsCount: 2,
    contactName: 'Marcelo Rossi',
    contactPhone: '(11) 98112-3344',
    plan: 'Pro 2 Quadras',
    status: 'ONLINE',
    macAddress: 'E4:5F:01:23:45:67',
    ipLan: '192.168.1.150',
    mqttToken: 'tok_live_n100_sp204_123456',
    cameras: [
      {
        courtNumber: 1,
        cameraName: 'Câmera Quadra 1',
        rtspUrl: 'rtsp://admin:pass123@192.168.1.61:554/stream1',
        esp32Ip: '192.168.1.111',
        status: 'ONLINE',
      },
      {
        courtNumber: 2,
        cameraName: 'Câmera Quadra 2',
        rtspUrl: 'rtsp://admin:pass123@192.168.1.62:554/stream1',
        esp32Ip: '192.168.1.112',
        status: 'ONLINE',
      },
    ],
  },
  {
    id: 'arena-03',
    name: 'Complexo Esportivo BH',
    cityState: 'Belo Horizonte - MG',
    courtsCount: 2,
    contactName: 'Fernanda Guimarães',
    contactPhone: '(31) 97334-5566',
    plan: 'Pro 2 Quadras',
    status: 'ONLINE',
    macAddress: 'DC:A6:32:89:AB:CD',
    ipLan: '10.0.0.80',
    mqttToken: 'tok_live_n100_mg305_778899',
    cameras: [
      {
        courtNumber: 1,
        cameraName: 'Câmera Campo 1',
        rtspUrl: 'rtsp://admin:pass123@10.0.0.81:554/stream1',
        esp32Ip: '10.0.0.121',
        status: 'ONLINE',
      },
      {
        courtNumber: 2,
        cameraName: 'Câmera Campo 2',
        rtspUrl: 'rtsp://admin:pass123@10.0.0.82:554/stream1',
        esp32Ip: '10.0.0.122',
        status: 'ONLINE',
      },
    ],
  },
  {
    id: 'arena-04',
    name: 'Quadras Gávea Beach & Fut',
    cityState: 'Rio de Janeiro - RJ',
    courtsCount: 4,
    contactName: 'Rodrigo Medeiros',
    contactPhone: '(21) 96554-7788',
    plan: 'Enterprise 4 Quadras',
    status: 'ONLINE',
    macAddress: 'B8:27:EB:FE:DC:BA',
    ipLan: '192.168.0.250',
    mqttToken: 'tok_live_n100_rj401_445566',
    cameras: [
      {
        courtNumber: 1,
        cameraName: 'Câmera Fut Principal',
        rtspUrl: 'rtsp://admin:pass123@192.168.0.71:554/stream1',
        esp32Ip: '192.168.0.131',
        status: 'ONLINE',
      },
      {
        courtNumber: 2,
        cameraName: 'Câmera Fut Secundária',
        rtspUrl: 'rtsp://admin:pass123@192.168.0.72:554/stream1',
        esp32Ip: '192.168.0.132',
        status: 'ONLINE',
      },
      {
        courtNumber: 3,
        cameraName: 'Câmera Beach 1',
        rtspUrl: 'rtsp://admin:pass123@192.168.0.73:554/stream1',
        esp32Ip: '192.168.0.133',
        status: 'ONLINE',
      },
      {
        courtNumber: 4,
        cameraName: 'Câmera Beach 2',
        rtspUrl: 'rtsp://admin:pass123@192.168.0.74:554/stream1',
        esp32Ip: '192.168.0.134',
        status: 'ONLINE',
      },
    ],
  },
];

export default function ProvisionView() {
  const [arenas, setArenas] = useState<ArenaInfraData[]>(INITIAL_ARENAS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArena, setEditingArena] = useState<ArenaInfraData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenNew = () => {
    setEditingArena(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (arena: ArenaInfraData) => {
    setEditingArena(arena);
    setIsModalOpen(true);
  };

  const handleSaveArena = (savedArena: ArenaInfraData) => {
    setArenas((prev) => {
      const exists = prev.some((a) => a.id === savedArena.id);
      if (exists) {
        return prev.map((a) => (a.id === savedArena.id ? savedArena : a));
      }
      return [savedArena, ...prev];
    });
    setIsModalOpen(false);
    showToast(`Arena "${savedArena.name}" provisionada com sucesso!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top-2 duration-200 bg-slate-900 border-slate-700 text-slate-100">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-['Sora'] tracking-tight">
            Provisionamento de Infraestrutura
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Cadastro de novos clientes, geração de scripts Edge N100 e vinculação de streams RTSP.
          </p>
        </div>

        <button
          type="button"
          id="btnNewArena"
          onClick={handleOpenNew}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Nova Arena</span>
        </button>
      </div>

      {/* Arenas Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-500 text-[20px]">
              stadium
            </span>
            <h2 className="text-sm font-bold font-['Sora'] text-slate-200 uppercase tracking-wider">
              Arenas & Clientes Ativos
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {arenas.length} arenas conectadas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Arena / Localização</th>
                <th className="py-3 px-4">Plano</th>
                <th className="py-3 px-4 text-center">Quadras</th>
                <th className="py-3 px-4 text-center">Câmeras RTSP</th>
                <th className="py-3 px-4 font-mono">Edge MAC / IP</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {arenas.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-200">{a.name}</div>
                    <div className="text-[11px] text-slate-400">{a.cityState} • {a.contactPhone}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-medium">
                    {a.plan}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                    {a.courtsCount}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">
                      {a.cameras.length} feeds
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div className="text-slate-300">{a.macAddress}</div>
                    <div className="text-slate-500">{a.ipLan}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(a)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-orange-400 font-bold text-xs transition-colors inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>Configurar</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Arena Provisioning Modal */}
      <ArenaModal
        isOpen={isModalOpen}
        arena={editingArena}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveArena}
      />
    </div>
  );
}
