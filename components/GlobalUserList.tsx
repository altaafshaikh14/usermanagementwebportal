import React, { useEffect, useState } from 'react';
import { Server, ServerUser } from '../types';
import { fetchServers, fetchUsers, lockUser, unlockUser } from '../services/api';
import { Lock, Unlock, Loader2, User, RefreshCw, AlertCircle, Server as ServerIcon, Search } from 'lucide-react';

interface EnrichedUser extends ServerUser {
  serverId: string;
  serverName: string;
}

const GlobalUserList: React.FC = () => {
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadAllUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Servers
      const serversRes = await fetchServers();
      if (!serversRes.success || !serversRes.data) {
        throw new Error(serversRes.error || 'Failed to fetch servers');
      }

      const servers = serversRes.data;
      const allUsers: EnrichedUser[] = [];

      // 2. Fetch Users for each server
      // Using Promise.allSettled to avoid failing completely if one server is down
      const results = await Promise.allSettled(
        servers.map(async (server) => {
          const userRes = await fetchUsers(server.id);
          if (userRes.success && userRes.data) {
            return userRes.data.map(u => ({
              ...u,
              serverId: server.id,
              serverName: server.name
            }));
          }
          return [];
        })
      );

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          allUsers.push(...result.value);
        }
      });

      setUsers(allUsers);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllUsers();
  }, []);

  const handleToggleLock = async (user: EnrichedUser) => {
    const uniqueId = `${user.serverId}-${user.username}`;
    setActionLoading(uniqueId);
    
    const isLocked = user.status === 'locked';
    const action = isLocked ? unlockUser : lockUser;
    
    const res = await action(user.serverId, user.username);
    
    if (res.success) {
      // Optimistic update
      setUsers(prev => prev.map(u => {
        if (u.serverId === user.serverId && u.username === user.username) {
          return { ...u, status: isLocked ? 'active' : 'locked' };
        }
        return u;
      }));
    } else {
      alert("Action failed: " + res.error);
    }
    setActionLoading(null);
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.serverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-900">All Users</h2>
           <p className="text-slate-500">View and manage users across your entire fleet.</p>
        </div>
        <div className="flex gap-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search users or servers..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
            </div>
            <button 
            onClick={loadAllUsers} 
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Refresh List"
            >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            No users found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Server</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">UID / GID</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                    const uniqueId = `${user.serverId}-${user.username}`;
                    return (
                        <tr key={uniqueId} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center text-slate-700 font-medium">
                                    <ServerIcon className="w-4 h-4 mr-2 text-slate-400" />
                                    {user.serverName}
                                </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900">
                                {user.username}
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-mono text-sm">
                                {user.uid} / {user.gid}
                            </td>
                            <td className="px-6 py-4">
                                {user.status === 'locked' ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <Lock className="w-3 h-3 mr-1" /> Locked
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                    Active
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button
                                    onClick={() => handleToggleLock(user)}
                                    disabled={actionLoading === uniqueId}
                                    className={`inline-flex items-center px-3 py-1.5 border rounded text-xs font-medium transition-colors ${
                                    user.status === 'locked'
                                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                        : 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
                                    }`}
                                >
                                    {actionLoading === uniqueId ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : user.status === 'locked' ? (
                                    <>
                                        <Unlock className="w-3 h-3 mr-1" /> Unlock
                                    </>
                                    ) : (
                                    <>
                                        <Lock className="w-3 h-3 mr-1" /> Lock
                                    </>
                                    )}
                                </button>
                            </td>
                        </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalUserList;