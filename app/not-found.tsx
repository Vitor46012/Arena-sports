import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-2xl font-bold">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Página não encontrada
          </h1>
          <p className="text-sm text-slate-400">
            O recurso ou rota esportiva solicitado não existe ou foi movido.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-colors shadow-lg shadow-emerald-500/20"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
