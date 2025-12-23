import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ServerCard from './components/ServerCard';
import CreateUserForm from './components/CreateUserForm';
import UserList from './components/UserList';
import GlobalUserList from './components/GlobalUserList';
import { fetchServers, getExportUrl } from './services/api';
import { Server } from './types';
import { RefreshCw, Download, Server as ServerIcon, AlertCircle } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  const loadServers = async () => {
    setIsLoading(true);
    setError(null);
    const response = await fetchServers();
    if (response.success && response.data) {
      setServers(response.data);
    } else {
      setError(response.error || 'Failed to connect to backend.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadServers();
  }, []);

  const handleNavigate = (view: string) => {
    setActiveView(view);
    if (view === 'dashboard' || view === 'users-list') {
      setSelectedServer(null);
    }
  };

  const handleManageUsers = (server: Server) => {
    setSelectedServer(server);
    setActiveView('manage-users');
  };

  const handleCreateUser = (server: Server | null) => {
    setSelectedServer(server);
    setActiveView('create-user');
  };

  const handleUserCreationSuccess = () => {
    if (selectedServer) {
        // Go back to managing users for that server
        setActiveView('manage-users');
    } else {
        setActiveView('dashboard');
    }
  };

  const handleExport = () => {
    window.open(getExportUrl(), '_blank');
  };

  return (
    <Layout activeView={activeView} onNavigate={handleNavigate}>
      
      {activeView === 'dashboard' && (
        <div className="space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Server Fleet</h1>
              <p className="text-slate-500">Manage user access across your local infrastructure.</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleExport}
                className="flex items-center px-4 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Users
              </button>
              <button 
                onClick={loadServers} 
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{error} Ensure the backend is running at http://localhost:3000.</span>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {[1,2,3].map(i => (
                 <div key={i} className="h-48 bg-slate-200 rounded-xl animate-pulse"></div>
               ))}
            </div>
          ) : servers.length === 0 && !error ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
              <ServerIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No servers found</h3>
              <p className="text-slate-500">Ensure the backend is running and servers.json is populated.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {servers.map(server => (
                <ServerCard 
                  key={server.id} 
                  server={server} 
                  onManageUsers={handleManageUsers}
                  onCreateUser={handleCreateUser}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'users-list' && (
        <GlobalUserList />
      )}

      {activeView === 'manage-users' && selectedServer && (
        <UserList 
            server={selectedServer}
            onBack={() => setActiveView('dashboard')}
        />
      )}

      {activeView === 'create-user' && (
        <CreateUserForm 
          server={selectedServer}
          servers={servers}
          onCancel={() => setActiveView('dashboard')}
          onSuccess={handleUserCreationSuccess}
        />
      )}

      {activeView === 'settings' && (
         <div className="bg-white rounded-xl border border-slate-200 p-8 text-center py-20">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Settings</h2>
            <p className="text-slate-500">Backend URL configured to: http://localhost:3000</p>
         </div>
      )}

    </Layout>
  );
}

export default App;