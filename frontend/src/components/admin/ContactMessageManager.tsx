"use client";

import { useState } from "react";
import { 
  Mail, User, MessageSquare, Calendar, 
  Trash2, X, ChevronRight, Inbox
} from "lucide-react";
import { deleteContactMessage } from "@/app/actions/admin";

interface ContactMessageManagerProps {
  messages: any[];
}

export default function ContactMessageManager({ messages }: ContactMessageManagerProps) {
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => setSelectedMessage(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    setLoading(true);
    await deleteContactMessage(id);
    setLoading(false);
    if (selectedMessage?.id === id) handleClose();
  };

  return (
    <div className="space-y-6">
      <div className="premium-card rounded-2xl p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Lora', serif" }}>Inquiry Inbox</h2>
          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">
            {messages.length} Total
          </span>
        </div>
        
        {!messages || messages.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-section-alt rounded-full flex items-center justify-center mx-auto text-muted/30">
              <Inbox size={32} />
            </div>
            <p className="text-muted text-sm italic">Your inbox is empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-section-alt/50 border-b border-border">
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Sender</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Subject</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Date</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {messages.map((msg) => (
                  <tr 
                    key={msg.id} 
                    className="hover:bg-section transition-colors cursor-pointer group"
                    onClick={() => setSelectedMessage(msg)}
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold">{msg.name}</p>
                      <p className="text-[11px] text-muted">{msg.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium line-clamp-1">{msg.subject}</p>
                    </td>
                    <td className="px-5 py-4 text-[11px] text-muted">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => setSelectedMessage(msg)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(msg.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="premium-card w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="p-6 border-b border-border flex items-center justify-between bg-section-alt/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {selectedMessage.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold">{selectedMessage.name}</h3>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Message Detail</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5"><Mail size={12}/> Email</p>
                  <p className="text-sm font-semibold">{selectedMessage.email}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center justify-end gap-1.5"><Calendar size={12}/> Date</p>
                  <p className="text-sm font-semibold">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Subject</p>
                <p className="text-lg font-bold" style={{ fontFamily: "'Lora', serif" }}>{selectedMessage.subject}</p>
              </div>

              <div className="p-6 bg-section-alt rounded-2xl border border-border/50">
                <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-section-alt/30 flex justify-end gap-3">
              <button 
                onClick={() => handleDelete(selectedMessage.id)}
                className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-all flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete Message
              </button>
              <a 
                href={`mailto:${selectedMessage.email}`}
                className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2"
              >
                <Mail size={16} /> Reply via Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
