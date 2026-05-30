import React, { useState } from 'react';
import { RefreshCcw, CheckCircle, XCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  payload: any;
  isSending: boolean;
  result?: { success: boolean; message?: string } | null;
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, payload, isSending, result }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 md:p-8 w-full max-w-lg shadow-2xl origin-bottom animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{title}</h3>
        <p className="text-zinc-400 text-sm mb-6">Você está prestes a enviar este comando. Revise o payload abaixo:</p>
        
        <div className="bg-zinc-950 rounded-[1.5rem] p-5 mb-6 border border-zinc-800/50 overflow-x-auto inset-shadow">
          <pre className="text-brand-neon font-mono text-xs">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>

        {result && (
          <div className={`p-5 rounded-[1.5rem] mb-6 flex items-start gap-4 border ${result.success ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' : 'bg-red-950/30 border-red-900/50 text-brand-red'}`}>
            {result.success ? <CheckCircle className="h-6 w-6 mt-0.5 shrink-0" /> : <XCircle className="h-6 w-6 mt-0.5 shrink-0" />}
            <div>
              <p className="font-bold text-base">{result.success ? 'Sucesso' : 'Erro'}</p>
              <p className="text-sm mt-1 opacity-90 leading-relaxed">{result.message || (result.success ? 'Comando executado com sucesso.' : 'Ocorreu um erro no envio.')}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end mt-8">
          <button 
            onClick={onClose}
            disabled={isSending}
            className="px-6 py-3 rounded-full text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            {result ? 'Fechar' : 'Cancelar'}
          </button>
          {!result && (
            <button 
              onClick={onConfirm}
              disabled={isSending}
              className="flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold bg-white text-zinc-950 hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50"
            >
              {isSending && <RefreshCcw className="h-4 w-4 animate-spin" />}
              {isSending ? 'Enviando...' : 'Confirmar Envio'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
