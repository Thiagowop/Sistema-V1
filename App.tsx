import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import {
  Users,
  Settings as SettingsIcon,
  LayoutDashboard,
  Database,
  BarChart3,
  Filter,
  Archive,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Calendar,
  TrendingUp,
  Shield,
  LogOut
} from 'lucide-react';
import { GroupedData, AppConfig, StandupEntry } from './types';
import { FilterState } from './types/FilterConfig';
import { processCSV } from './services/processor';
import { fetchClickUpData, loadMockData, ClickUpApiTask, applyClientSideFilters, fetchRawClickUpData, processApiTasks, fetchStandupSummaries, extractFilterMetadata } from './services/clickup';
import { FilterService } from './services/filterService';
import { advancedCache } from './services/advancedCacheService';
import { DEFAULT_CONFIG } from './constants';
import Dashboard from './components/Dashboard';
import TestDashboard from './components/TestDashboard';
import Settings from './components/Settings';
import FileUpload from './components/FileUpload';
import Filters from './components/Filters';
import CompletedProjects from './components/CompletedProjects';
import { LoginScreen } from './components/LoginScreen';
import TimesheetDashboard from './components/TimesheetDashboard';

type ViewMode = 'import' | 'projects' | 'alignment' | 'management2' | 'settings' | 'admin' | 'timesheet';

const App: React.FC = () => {
  // Login com persistência em localStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('dailyFlow_isAuthenticated');
    return saved === 'true';
  });
  const [data, setData] = useState<GroupedData[] | null>(null);
  const [rawData, setRawData] = useState<ClickUpApiTask[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [standupEntries, setStandupEntries] = useState<StandupEntry[] | null>(null);
  const [standupFetched, setStandupFetched] = useState(false);
  const [standupLoading, setStandupLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [cachedTaskCount, setCachedTaskCount] = useState<number>(0);
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('dailyPresenterConfig');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const [filterState, setFilterState] = useState<FilterState>(() => {
    return FilterService.loadFilterState();
  });

  // Check if there's cached data to determine initial view
  const [activeView, setActiveView] = useState<ViewMode>(() => {
    try {
      const cachedData = localStorage.getItem('dailyFlowCachedData');
      if (cachedData) {
        const cache = JSON.parse(cachedData);
        if (cache.data && cache.data.length > 0) {
          return 'projects';
        }
      }
    } catch (e) {
      console.error('Error checking initial cache:', e);
    }
    return 'import';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Funções de login com persistência
  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('dailyFlow_isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('dailyFlow_isAuthenticated');
    setActiveView('import');
  };

  // Load cached data on mount (3-layer strategy)
  useEffect(() => {
    const loadCacheInLayers = async () => {
      console.log('🔍 Loading cache in layers...');

      // LAYER 1: Metadata (instant - for filters)
      const metadata = advancedCache.loadMetadata();
      if (metadata) {
        console.log('✅ Layer 1 loaded: Metadata');
        setLastSyncTime(new Date(metadata.lastSync));
        setCachedTaskCount(metadata.taskCount);
      }

      // LAYER 2: Processed Data (fast - show dashboard)
      const processedData = advancedCache.loadProcessedData();
      if (processedData && processedData.length > 0) {
        console.log('✅ Layer 2 loaded: Processed data');
        setData(processedData);
        setActiveView('projects'); // Show dashboard immediately
      }

      // LAYER 3: Raw Data (slow - for reprocessing)
      const rawData = await advancedCache.loadRawData();
      if (rawData && rawData.length > 0) {
        console.log('✅ Layer 3 loaded: Raw data');
        setRawData(rawData);
      }

      // LAYER 4: Recovery (se nenhum cache foi encontrado)
      if (!metadata && !processedData && !rawData) {
        console.log('🔧 Tentando recuperação de emergência...');
        const recovered = await advancedCache.tryRecoverFromOldCache();

        if (recovered.config && !config.clickupApiToken) {
          console.log('✅ Configurações recuperadas, aplicando...');
          setConfig(prev => ({ ...prev, ...recovered.config }));
        }

        if (recovered.data && recovered.data.length > 0) {
          console.log('✅ Dados recuperados:', recovered.data.length, 'grupos');
          setData(recovered.data);
          setActiveView('projects');
          setCachedTaskCount(recovered.data.reduce((sum, g) =>
            sum + g.projects.reduce((pSum, p) => pSum + p.tasks.length, 0), 0
          ));
        }
      }

      // Show cache status
      const status = await advancedCache.getCacheStatus();
      console.log('📊 Cache status:', status);
    };

    loadCacheInLayers().catch(console.error);
  }, []);

  useEffect(() => {
    localStorage.setItem('dailyPresenterConfig', JSON.stringify(config));
  }, [config]);

  // Migration: Clear apiTagFilters from saved config if it contains 'projeto'
  useEffect(() => {
    const savedConfig = localStorage.getItem('dailyPresenterConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.apiTagFilters && Array.isArray(parsed.apiTagFilters) && parsed.apiTagFilters.length > 0) {
          console.log('🔄 Migrating: Clearing API tag filters to fetch all tasks');
          parsed.apiTagFilters = [];
          localStorage.setItem('dailyPresenterConfig', JSON.stringify(parsed));
          setConfig(prev => ({ ...prev, apiTagFilters: [] }));
        }
      } catch (e) {
        console.error('Migration error:', e);
      }
    }
  }, []);

  useEffect(() => {
    FilterService.saveFilterState(filterState);
  }, [filterState]);

  useEffect(() => {
    if (rawData && rawData.length > 0) {
      const filtered = applyClientSideFilters(rawData, filterState.currentFilters);
      const processed = processApiTasks(filtered, config);
      setData(processed);
    }
  }, [filterState, rawData, config]);

  // Close mobile menu when view changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeView]);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      const processed = await processCSV(file, config);
      setData(processed);
      setRawData(null);
      setStandupEntries(null);
      setStandupFetched(false);
      setStandupLoading(false);
      setActiveView('projects');
    } catch (err) {
      console.error(err);
      alert("Falha ao processar CSV. Verifique o formato.");
    } finally {
      setLoading(false);
    }
  };

  const handleApiSync = async () => {
    setLoading(true);
    setStandupFetched(false);
    setStandupEntries(null);
    setStandupLoading(false);

    // Add timeout protection
    const timeoutId = setTimeout(() => {
      setLoading(false);
      alert('Sincronização demorou muito. Tente novamente.');
    }, 180000); // 180 seconds timeout (3 minutes for large datasets)

    try {
      // Check if we should do incremental sync
      const metadata = advancedCache.loadMetadata();
      const shouldUseIncremental = metadata && metadata.lastSync;

      let rawTasks: ClickUpApiTask[];

      if (shouldUseIncremental) {
        console.log('🔄 Using INCREMENTAL sync (faster)');
        const incrementalTasks = await fetchRawClickUpData(config, metadata.lastSync);

        // Merge with cached data
        rawTasks = await advancedCache.mergeIncrementalUpdate(incrementalTasks);

        console.log(`✅ Incremental sync: ${incrementalTasks.length} updated, ${rawTasks.length} total`);
      } else {
        console.log('📥 Using FULL sync (first time)');
        rawTasks = await fetchRawClickUpData(config);
      }

      clearTimeout(timeoutId);

      // STEP 1: Extract and save metadata FIRST (instant filter availability)
      const filterMetadata = extractFilterMetadata(rawTasks, config.nameMappings);
      advancedCache.saveMetadata(filterMetadata, rawTasks.length);

      // Update config with available tags, statuses, assignees
      const updatedConfig = {
        ...config,
        availableTags: filterMetadata.tags,
        availableStatuses: filterMetadata.statuses,
        availableAssignees: filterMetadata.assignees
      };
      setConfig(updatedConfig);
      localStorage.setItem('dailyPresenterConfig', JSON.stringify(updatedConfig));

      setRawData(rawTasks);
      const filtered = applyClientSideFilters(rawTasks, filterState.currentFilters);
      const processed = processApiTasks(filtered, config);

      if (processed.length === 0) {
        alert("Nenhuma tarefa encontrada com os filtros atuais.");
      } else {
        setData(processed);
        setActiveView('projects');

        // STEP 2: Save processed data (compressed, fast dashboard load)
        advancedCache.saveProcessedData(processed);

        // STEP 3: Save raw data to IndexedDB (background, for reprocessing)
        advancedCache.saveRawData(rawTasks).catch(err => {
          console.warn('⚠️  Failed to save raw data to IndexedDB:', err);
        });

        // Update UI state
        const syncTime = new Date();
        setLastSyncTime(syncTime);
        setCachedTaskCount(rawTasks.length);

        console.log('✅ All 3 cache layers saved successfully');
      }

      if (config.clickupStandupViewId && config.clickupStandupViewId.trim()) {
        setStandupEntries(null);
        setStandupFetched(false);
      } else {
        setStandupEntries(null);
        setStandupFetched(false);
      }
      setStandupLoading(false);
    } catch (err: any) {
      console.error(err);
      alert(`Falha na sincronização: ${err.message}`);
      setStandupEntries(null);
      setStandupFetched(false);
      setStandupLoading(false);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleStandupSync = async () => {
    if (!config.clickupStandupViewId || !config.clickupStandupViewId.trim()) {
      alert('Configure o ID da view de standup em Admin > Integração ClickUp API antes de sincronizar.');
      return;
    }

    setStandupLoading(true);
    try {
      const summaries = await fetchStandupSummaries(config, { limit: 30 });
      setStandupEntries(summaries);
      setStandupFetched(true);

      try {
        const cachedDataRaw = localStorage.getItem('dailyFlowCachedData');
        if (cachedDataRaw) {
          const cached = JSON.parse(cachedDataRaw);
          localStorage.setItem('dailyFlowCachedData', JSON.stringify({
            ...cached,
            standupEntries: summaries
          }));
        }
      } catch (cacheErr) {
        console.warn('Falha ao salvar resumo diário no cache:', cacheErr);
      }
    } catch (err: any) {
      console.error('Falha ao sincronizar resumo diário:', err);
      alert(`Falha ao carregar resumo diário: ${err?.message || err}`);
      setStandupFetched(false);
    } finally {
      setStandupLoading(false);
    }
  };

  const handleMockLoad = async () => {
    setLoading(true);
    try {
      const processed = await loadMockData(config);
      setData(processed);
      setRawData(null);
      setStandupEntries(null);
      setStandupFetched(false);
      setStandupLoading(false);
      setActiveView('projects');
    } catch (err: any) {
      console.error(err);
      alert(`Falha ao carregar dados mock: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = (newConfig: AppConfig) => {
    const standupChanged = newConfig.clickupStandupViewId !== config.clickupStandupViewId;
    setConfig(newConfig);
    if (standupChanged) {
      setStandupEntries(null);
      setStandupFetched(false);
      setStandupLoading(false);
    }
  };

  const hasApiConfig = !!(config.clickupApiToken && config.clickupListIds);
  const hasCachedData = !!(cachedTaskCount > 0);

  const navItems = [
    {
      section: 'Dados',
      items: [
        { view: 'import' as ViewMode, icon: Database, label: 'Importar / Sync', disabled: false },
      ]
    },
    {
      section: 'Visualização',
      items: [
        { view: 'projects' as ViewMode, icon: Calendar, label: 'Alinhamento Diário', disabled: !data },
        { view: 'alignment' as ViewMode, icon: Users, label: 'Alinhamento', disabled: !data },
        { view: 'timesheet' as ViewMode, icon: LayoutDashboard, label: 'Timesheet', disabled: !data },
        { view: 'management2' as ViewMode, icon: BarChart3, label: 'Gestão', disabled: !data },
      ]
    },
    {
      section: 'Sistema',
      items: [
        { view: 'settings' as ViewMode, icon: SettingsIcon, label: 'Configurações', disabled: false },
        { view: 'admin' as ViewMode, icon: Shield, label: 'Admin', disabled: false },
      ]
    }
  ];

  const NavButton: React.FC<{ view: ViewMode; icon: any; label: string; disabled?: boolean }> = ({ view, icon: Icon, label, disabled = false }) => (
    <button
      onClick={() => !disabled && setActiveView(view)}
      disabled={disabled}
      title={isSidebarCollapsed ? label : undefined}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
        ${isSidebarCollapsed ? 'justify-center' : ''}
        ${activeView === view
          ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25'
          : disabled
            ? 'opacity-40 cursor-not-allowed text-slate-400'
            : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
        }
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${activeView === view ? 'text-white' : ''}`} />
      {!isSidebarCollapsed && (
        <span className="font-medium text-sm truncate">{label}</span>
      )}
    </button>
  );

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Wrap with GoogleOAuthProvider if configured
    if (googleClientId) {
      return (
        <GoogleOAuthProvider clientId={googleClientId}>
          <LoginScreen onLogin={handleLogin} />
        </GoogleOAuthProvider>
      );
    }

    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        ${isSidebarCollapsed ? 'w-20' : 'w-72'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 
        text-white flex-shrink-0 flex flex-col shadow-2xl
        transition-all duration-300 ease-in-out
      `}>
        {/* Logo */}
        <div className={`p-4 border-b border-slate-800/50 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">MCSA Tecnologia</h1>
                <p className="text-[10px] text-slate-400 font-medium">Gestão de Projetos</p>
              </div>
            </div>
          )}
          {isSidebarCollapsed && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          )}

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
          {navItems.map((section, idx) => (
            <div key={idx}>
              {!isSidebarCollapsed && (
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                  {section.section}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavButton key={item.view} view={item.view} icon={item.icon} label={item.label} disabled={item.disabled} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-slate-800/50 space-y-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Sair do Sistema</span>
            </button>
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/50">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">ClickUp Sync</p>
                <p className="text-[10px] text-slate-400">v2.0.0</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">DailyFlow</span>
          </div>
          <div className="w-10" />
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'import' && (
            <div className="h-full flex items-center justify-center p-4 md:p-8 animate-fade-in overflow-y-auto">
              <FileUpload
                onApiSync={handleApiSync}
                loading={loading}
                hasApiConfig={hasApiConfig || hasCachedData}
                lastSyncTime={lastSyncTime}
                cachedTaskCount={cachedTaskCount}
                onClearCache={() => {
                  advancedCache.clearAll().then(() => {
                    setLastSyncTime(null);
                    setCachedTaskCount(0);
                    setData(null);
                    setRawData(null);
                    alert('✅ Cache limpo com sucesso!');
                  });
                }}
              />
            </div>
          )}

          {(activeView === 'projects' || activeView === 'alignment') && data && (
            <div className="h-full overflow-hidden flex flex-col">
              <Dashboard
                data={data}
                config={config}
                viewMode={activeView as 'projects' | 'alignment'}
                rawData={rawData}
                standupEntries={standupEntries ?? undefined}
                standupFetched={standupFetched}
                standupLoading={standupLoading}
                onStandupSync={handleStandupSync}
                onRefresh={activeView === 'projects' ? handleApiSync : undefined}
              />
            </div>
          )}

          {activeView === 'management2' && data && (
            <div className="h-full overflow-hidden flex flex-col">
              <TestDashboard
                data={data}
                config={config}
                rawData={rawData}
              />
            </div>
          )}

          {activeView === 'timesheet' && data && (
            <div className="h-full overflow-hidden">
              <TimesheetDashboard
                data={data}
                config={config}
              />
            </div>
          )}

          {activeView === 'settings' && (
            <div className="h-full overflow-y-auto p-4 md:p-8">
              <Settings config={config} onSave={handleConfigUpdate} data={data} variant="user" />
            </div>
          )}

          {activeView === 'admin' && (
            <div className="h-full overflow-y-auto p-4 md:p-8">
              <Settings
                config={config}
                onSave={handleConfigUpdate}
                data={data}
                variant="admin"
                onFileUpload={handleFileUpload}
                rawData={rawData}
                filterState={filterState}
                onFilterStateChange={setFilterState}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
