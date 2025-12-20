/**
 * @id ERR-001
 * @name ErrorBoundary
 * @description Protects against component crashes - isolates errors
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    componentName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ERR-001] Component Error:', error, errorInfo);
        this.setState({ errorInfo });
        this.props.onError?.(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="h-full flex items-center justify-center bg-slate-50 p-8">
                    <div className="bg-white rounded-2xl border border-rose-200 shadow-lg max-w-lg w-full overflow-hidden">
                        {/* Header */}
                        <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center gap-3">
                            <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-rose-800">Erro no Componente</h3>
                                {this.props.componentName && (
                                    <p className="text-xs text-rose-600 font-mono">{this.props.componentName}</p>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Mensagem de Erro</p>
                                <p className="text-sm text-rose-700 font-mono break-all">
                                    {this.state.error?.message || 'Erro desconhecido'}
                                </p>
                            </div>

                            <p className="text-sm text-slate-500">
                                Este componente encontrou um erro. O restante do aplicativo continua funcionando.
                            </p>

                            <button
                                onClick={this.handleReset}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-all"
                            >
                                <RefreshCw size={16} />
                                Tentar Novamente
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
