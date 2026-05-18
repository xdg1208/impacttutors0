"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, X, Calendar, Video, Clock, 
  Trash2, CheckSquare, Square, Loader2
} from "lucide-react";
import { deleteSession, bulkDeleteSessions } from "@/app/actions/admin";

interface SessionDataManagerProps {
  sessions: any[];
}

export default function SessionDataManager({ sessions }: SessionDataManagerProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null); // 'bulk' or sessionId

  const filteredSessions = (sessions || []).filter(s => 
    s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.tutor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSessions.length) setSelectedIds([]);
    else setSelectedIds(filteredSessions.map(s => s.id));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    setLoading(id);
    try {
      await deleteSession(id);
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} sessions?`)) return;
    setLoading('bulk');
    try {
      await bulkDeleteSessions(selectedIds);
      setSelectedIds([]);
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
          <input 
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="text-xs font-bold text-muted uppercase tracking-widest">
           {filteredSessions.length} Scheduled Sessions
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-primary">{selectedIds.length} sessions selected</span>
          </div>
          <button 
            onClick={handleBulkDelete}
            disabled={loading === 'bulk'}
            className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading === 'bulk' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete Selected
          </button>
        </div>
      )}

      {/* Sessions List */}
      <div className="premium-card rounded-2xl p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-section-alt/50 border-b border-border">
              <th className="px-5 py-3 w-10">
                <button onClick={toggleSelectAll} className="text-muted hover:text-primary transition-colors">
                  {selectedIds.length === filteredSessions.length && filteredSessions.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </th>
              <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Session Info</th>
              <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Time & Status</th>
              <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filteredSessions.map(s => (
                <tr key={s.id} className={`hover:bg-section/5 transition-colors ${selectedIds.includes(s.id) ? 'bg-primary/[0.02]' : ''}`}>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleSelect(s.id)} className={`${selectedIds.includes(s.id) ? 'text-primary' : 'text-muted/40'} hover:text-primary transition-colors`}>
                      {selectedIds.includes(s.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold">{s.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 bg-section-alt rounded text-muted font-medium leading-none">{s.course_name}</span>
                      <span className="text-[10px] text-muted-foreground italic">with {s.tutor_name} for {s.student_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                     <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock size={12} className="text-primary" />
                        {new Date(s.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                     </div>
                     <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        s.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 
                        s.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                     }`}>
                        {s.status}
                     </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(s.id)}
                      disabled={loading === s.id}
                      className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-all disabled:opacity-50"
                      title="Delete Session"
                    >
                      {loading === s.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-muted text-sm italic">No sessions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
