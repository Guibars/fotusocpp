import React, { useState, useEffect } from 'react';
import { RefreshCcw, CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { getCommandResultByMessageId } from '../services/api';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  payload: any;
  isSending: boolean;
  result?: { success: boolean; message?: string; messageId?: string; status?: string; error?: string } | null;
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, payload, isSending, result }: ConfirmModalProps) {
  const [pollStatus, setPollStatus] = useState<string>('Pending');
  const [pollDetails, setPollDetails] = useState<any | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPollStatus('Pending');
      setPollDetails(null);
      setPollError(null);
      return;
    }

    // Is there a messageId to poll?
    const messageId = result?.messageId;
    if (!messageId) {
      if (result) {
        // If there's a result but no messageId, default status to success/error based on success flag
        setPollStatus(result.success ? 'Accepted' : 'Error');
      }
      return;
    }

    setPollStatus('Pending');
    setPollDetails(null);
    setPollError(null);

    let intervalId: any;
    let attempts = 0;
    const maxAttempts = 30; // 45 seconds total

    const checkStatus = async () => {
      attempts++;
      if (attempts > maxAttempts) {
        setPollStatus('Expired');
        if (intervalId) clearInterval(intervalId);
        return;
      }

      try {
        const response = await getCommandResultByMessageId(messageId);
        if (response) {
          setPollDetails(response);
          const status = response.status || 'Pending';
          setPollStatus(status);

          // Stop polling if we reached a final state
          if (status !== 'Pending') {
            if (intervalId) clearInterval(intervalId);
          }
        }
      } catch (err) {
        console.error("Error polling command-results", err);
        // Do not crash, keep trying representing transient issues
      }
    };

    // First check immediately
    checkStatus();

    intervalId = setInterval(checkStatus, 1500);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, result?.messageId, result]);

  if (!isOpen) return null;

  // Visual status configurations
  const getStatusDisplay = () => {
    switch (pollStatus) {
      case 'Pending':
        return {
          bg: 'bg-amber-950/20 border-amber-800/30 text-amber-300',
          icon: <Loader2 className="h-6 w-6 text-brand-yellow animate-spin shrink-0" />,
          title: 'Enviado - Aguardando Confirmação...',
          desc: 'Mensagem recebida pelo barramento e pendente de processamento pelo carregador (OCPP).'
        };
      case 'Accepted':
      case 'Success':
        return {
          bg: 'bg-emerald-950/25 border-emerald-900/40 text-emerald-400',
          icon: <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />,
          title: 'Comando Aceito! (Accepted)',
          desc: 'O carregador processou o comando OCPP com sucesso e retornou conformidade.'
        };
      case 'Error':
      case 'Rejected':
      case 'Failed':
        return {
          bg: 'bg-red-950/35 border-red-900/50 text-red-400',
          icon: <XCircle className="h-6 w-6 text-red-500 shrink-0" />,
          title: 'Comando Rejeitado/Falhou (Error)',
          desc: pollDetails?.response_payload?.status || pollDetails?.response_payload?.error || result?.message || result?.error || 'O carregador recusou ou falhou na execução do comando.'
        };
      case 'Expired':
        return {
          bg: 'bg-zinc-900/50 border-zinc-700/50 text-zinc-400',
          icon: <Clock className="h-6 w-6 text-zinc-500 shrink-0" />,
          title: 'Tempo Limite Excedido (Expired)',
          desc: 'O carregador demorou muito para responder e a requisição expirou.'
        };
      default:
        return {
          bg: 'bg-zinc-900/50 border-zinc-700/50 text-zinc-400',
          icon: <Loader2 className="h-6 w-6 text-zinc-500 animate-spin shrink-0" />,
          title: `Status: ${pollStatus}`,
          desc: 'Aguardando atualização do barramento OCPP...'
        };
    }
  };

  const statusStyle = getStatusDisplay();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 md:p-8 w-full max-w-lg shadow-2xl origin-bottom animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{title}</h3>
        <p className="text-zinc-400 text-xs mb-6">Comando disparado para o barramento de carregadores rápidos Fotus.</p>
        
        {/* Payload display */}
        <div className="bg-zinc-950 rounded-[1.5rem] p-5 mb-6 border border-zinc-850 overflow-x-auto">
          <div className="text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Payload de Requisição</div>
          <pre className="text-emerald-400 font-mono text-xs max-h-40 overflow-y-auto">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>

        {/* Polling result container */}
        {result && (
          <div className={`p-5 rounded-[1.5rem] border ${statusStyle.bg} transition-all duration-350`}>
            <div className="flex items-start gap-4">
              {statusStyle.icon}
              <div className="space-y-1">
                <p className="font-extrabold text-sm tracking-wide uppercase">{statusStyle.title}</p>
                <p className="text-xs opacity-90 leading-relaxed font-medium">{statusStyle.desc}</p>
              </div>
            </div>

            {result.messageId && (
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px]">
                <span className="text-zinc-400 font-bold uppercase tracking-wider">Message ID</span>
                <span className="font-mono bg-white/5 opacity-70 text-white px-2 py-0.5 rounded text-[9px] truncate max-w-[200px]" title={result.messageId}>
                  {result.messageId}
                </span>
              </div>
            )}
            
            {pollDetails?.response_payload && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="text-[9px] font-bold text-zinc-400 mb-1.5 uppercase tracking-widest">Resposta do Carregador</div>
                <pre className="text-[10px] font-mono bg-black/30 p-2.5 rounded-lg text-amber-200 overflow-x-auto max-h-24">
                  {JSON.stringify(pollDetails.response_payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-end mt-8">
          <button 
            onClick={onClose}
            disabled={isSending && !result}
            className="px-6 py-3 rounded-full text-xs font-extrabold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            {result ? 'Fechar Janela' : 'Cancelar'}
          </button>
          
          {!result && (
            <button 
              onClick={onConfirm}
              disabled={isSending}
              className="flex items-center gap-2 px-8 py-3 rounded-full text-xs font-black bg-white text-zinc-950 hover:bg-zinc-200 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSending && <RefreshCcw className="h-3.5 w-3.5 animate-spin" />}
              {isSending ? 'Processando...' : 'Confirmar Comando'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
