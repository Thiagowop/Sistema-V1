
import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Send, 
  MessageSquare, 
  User, 
  Tag, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface Suggestion {
  id: string;
  author: string;
  type: 'feature' | 'bug' | 'improvement' | 'other';
  message: string;
  date: string;
  status: 'pending' | 'reviewed';
}

export const SuggestionsDashboard: React.FC = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [formData, setFormData] = useState({
    author: '',
    type: 'feature',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mcsa_suggestions');
    if (saved) {
      try {
        setSuggestions(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading suggestions", e);
      }
    }
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('mcsa_suggestions', JSON.stringify(suggestions));
  }, [suggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.author || !formData.message) return;

    setIsSubmitting(true);

    // Simulate network delay
    setTimeout(() => {
      const newSuggestion: Suggestion = {
        id: Date.now().toString(),
        author: formData.author,
        type: formData.type as any,
        message: formData.message,
        date: new Date().toISOString(),
        status: 'pending'
      };

      setSuggestions([newSuggestion, ...suggestions]);
      setFormData({ author: '', type: 'feature', message: '' }); // Reset form
      setIsSubmitting(false);
    }, 600);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta sugestão?')) {
      setSuggestions(suggestions.filter(s => s.id !== id));
    }
  };

  const getBadgeConfig = (type: string) => {
    switch (type) {
      case 'feature': return { label: 'Nova Feature', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
      case 'bug': return { label: 'Bug / Erro', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
      case 'improvement': return { label: 'Melhoria', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
      default: return { label: 'Outro', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-500/20">
            <Lightbulb size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Caixa de Sugestões</h1>
            <p className="text-xs text-slate-500 font-medium">Envie ideias de melhoria ou reporte problemas no sistema.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: FORM */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-amber-500" />
                Nova Solicitação
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Seu Nome</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: João Silva"
                      value={formData.author}
                      onChange={e => setFormData({...formData, author: e.target.value})}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Tipo</label>
                  <div className="relative">
                    <Tag size={16} className="absolute left-3 top-3 text-slate-400" />
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="feature">Nova Funcionalidade</option>
                      <option value="improvement">Melhoria de Processo</option>
                      <option value="bug">Reportar Erro/Bug</option>
                      <option value="other">Outro Assunto</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Descrição Detalhada</label>
                  <textarea 
                    required
                    rows={5}
                    placeholder="Descreva sua ideia ou o problema encontrado..."
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Send size={16} /> Enviar Sugestão
                    </>
                  )}
                </button>

              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: LIST */}
          <div className="lg:col-span-8 space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <MessageSquare size={18} className="text-slate-400" />
                  Mural da Equipe
                </h3>
                <span className="text-xs font-bold bg-white border border-slate-200 px-3 py-1 rounded-full text-slate-500">
                  {suggestions.length} itens
                </span>
             </div>

             {suggestions.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Lightbulb size={32} className="text-slate-300" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-600">Nenhuma sugestão ainda</h4>
                  <p className="text-slate-400 text-sm max-w-xs mt-1">Seja o primeiro a contribuir com ideias para melhorar nosso sistema.</p>
               </div>
             ) : (
               <div className="grid gap-4">
                 {suggestions.map((item) => {
                   const badge = getBadgeConfig(item.type);
                   return (
                     <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
                        <div className="flex justify-between items-start mb-3">
                           <div className="flex items-center gap-2">
                              <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${badge.bg} ${badge.text} ${badge.border}`}>
                                {badge.label}
                              </div>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(item.date).toLocaleDateString('pt-BR')} às {new Date(item.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                              </span>
                           </div>
                           
                           <button 
                             onClick={() => handleDelete(item.id)}
                             className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-md hover:bg-rose-50 opacity-0 group-hover:opacity-100"
                             title="Remover"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>

                        <p className="text-slate-700 text-sm leading-relaxed mb-4 font-medium">
                          {item.message}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                           <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                {item.author.substring(0,2).toUpperCase()}
                              </div>
                              <span className="text-xs font-bold text-slate-600">{item.author}</span>
                           </div>
                           
                           {/* Status Indicator (Mock) */}
                           <div className="flex items-center gap-1.5">
                              {item.status === 'pending' ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                  <AlertCircle size={10} /> Pendente
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 size={10} /> Analisado
                                </span>
                              )}
                           </div>
                        </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};
