"use client";

import { useState } from "react";
import { 
  Check, X, User, Mail, Phone, GraduationCap, 
  BookOpen, MessageSquare, Calendar, ShieldCheck,
  MessageCircle, Copy, CheckCircle
} from "lucide-react";
import { approveApplication, rejectApplication, generateInviteCode } from "@/app/actions/admin";

interface ApplicationDetailManagerProps {
  studentApps: any[];
  tutorApps: any[];
}

export default function ApplicationDetailManager({ studentApps, tutorApps }: ApplicationDetailManagerProps) {
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [type, setType] = useState<'student' | 'tutor' | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleApprove = async () => {
    if (!selectedApp || !type) return;
    setLoading(true);
    setStatus(null);
    try {
      const result = await approveApplication(selectedApp.id, type);
      if (result.success) {
        setStatus({ type: 'success', message: 'Application approved successfully!' });
        setTimeout(() => handleClose(), 1500);
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to approve' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !type) return;
    if (!confirm("Are you sure you want to reject this application?")) return;
    setLoading(true);
    setStatus(null);
    try {
      const result = await rejectApplication(selectedApp.id, type);
      if (result.success) {
        setStatus({ type: 'success', message: 'Application rejected.' });
        setTimeout(() => handleClose(), 1500);
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to reject' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleGenerateAndLinkCode = async () => {
    if (!selectedApp || !type) return;
    setLoading(true);
    setStatus(null);
    
    const formData = new FormData();
    formData.append("email", selectedApp.email);
    formData.append("role", type);
    formData.append("applicationId", selectedApp.id.toString());

    try {
      const result = await generateInviteCode(formData);
      if (result.success && result.code) {
        setGeneratedCode(result.code);
        setStatus({ type: 'success', message: `Code ${result.code} generated and linked!` });
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to generate code' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Applications Table */}
      <div className="premium-card rounded-2xl p-0 overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Lora', serif" }}>Pending Student Applications</h2>
        </div>
        {!studentApps || studentApps.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm">No pending student applications.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-section-alt/50 border-b border-border">
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Student / Parent</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Grade / Curriculum</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {studentApps.filter(a => a.status === 'pending').map((app) => (
                  <tr 
                    key={app.id} 
                    className="hover:bg-section transition-colors cursor-pointer"
                    onClick={() => { setSelectedApp(app); setType('student'); }}
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold">{app.student_name}</p>
                      <p className="text-[11px] text-muted">{app.parent_name} • {app.email}</p>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <span className="px-2 py-1 bg-primary/5 text-primary rounded-lg font-bold mr-2">{app.grade_level}</span>
                      <span className="text-muted">{app.curriculum}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => { setSelectedApp(app); setType('student'); }}
                          className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all text-xs font-bold"
                        >
                          View Details
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

      {/* Tutor Applications Table */}
      <div className="premium-card rounded-2xl p-0 overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Lora', serif" }}>Pending Tutor Applications</h2>
        </div>
        {!tutorApps || tutorApps.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm">No pending tutor applications.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-section-alt/50 border-b border-border">
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Applicant</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Subjects</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {tutorApps.filter(a => a.status === 'pending').map((app) => (
                  <tr 
                    key={app.id} 
                    className="hover:bg-section transition-colors cursor-pointer"
                    onClick={() => { setSelectedApp(app); setType('tutor'); }}
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold">{app.full_name}</p>
                      <p className="text-[11px] text-muted">{app.email}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted">
                      {Array.isArray(app.subjects) ? app.subjects.join(", ") : app.subjects}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => { setSelectedApp(app); setType('tutor'); }}
                          className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all text-xs font-bold"
                        >
                          View Details
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

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="premium-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="p-6 border-b border-border flex items-center justify-between bg-section-alt/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  {type === 'student' ? <GraduationCap size={24} /> : <User size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: "'Lora', serif" }}>
                    {type === 'student' ? selectedApp.student_name : selectedApp.full_name}
                  </h3>
                  <p className="text-xs text-muted uppercase tracking-widest font-bold">
                    {type === 'student' ? 'Student Application' : 'Tutor Application'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Basic Contact Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem icon={<Mail size={16} />} label="Email Address" value={selectedApp.email} />
                <DetailItem icon={<Phone size={16} />} label="Phone Number" value={selectedApp.phone || "Not provided"} />
                <DetailItem 
                  icon={<MessageCircle size={16} className="text-green-500" />} 
                  label="Contact Preference" 
                  value={`${selectedApp.preferred_contact_method || 'Email'} (${selectedApp.contact_detail || 'N/A'})`} 
                />
                {type === 'student' && (
                  <>
                    <DetailItem icon={<User size={16} />} label="Parent / Guardian" value={selectedApp.parent_name} />
                    <DetailItem icon={<Calendar size={16} />} label="Grade Level" value={selectedApp.grade_level} />
                    <DetailItem icon={<ShieldCheck size={16} />} label="Curriculum" value={selectedApp.curriculum} />
                  </>
                )}
              </div>

              {/* Subjects Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                  <BookOpen size={14} /> Interested Subjects
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(selectedApp.subjects) ? selectedApp.subjects : []).map((s: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-primary/5 text-primary text-xs font-bold rounded-lg border border-primary/10">
                      {s}
                    </span>
                  ))}
                  {(!selectedApp.subjects || selectedApp.subjects.length === 0) && (
                    <p className="text-xs text-muted italic">No specific subjects listed.</p>
                  )}
                </div>
              </div>

              {/* Message / Experience */}
              <div className="space-y-3 p-4 bg-section-alt rounded-2xl border border-border/50">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                  <MessageSquare size={14} /> 
                  {type === 'student' ? 'Additional Information' : 'Experience & Background'}
                </h4>
                <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                  {type === 'student' ? selectedApp.message : selectedApp.experience}
                  {!(type === 'student' ? selectedApp.message : selectedApp.experience) && (
                    <span className="italic opacity-50">No additional information provided.</span>
                  )}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-section-alt/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {generatedCode ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-200 animate-fade-in">
                    <CheckCircle size={16} />
                    <span className="text-xs font-bold font-mono uppercase">Code: {generatedCode}</span>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(generatedCode); alert("Copied to clipboard!"); }}
                      className="ml-2 p-1 hover:bg-green-100 rounded-md transition-all"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleGenerateAndLinkCode}
                    disabled={loading}
                    className="px-4 py-2.5 bg-primary/10 text-primary rounded-xl font-bold text-xs hover:bg-primary hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <ShieldCheck size={16} /> Generate registration ID
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleReject}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold text-xs hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  Reject
                </button>
                <button 
                  onClick={handleApprove}
                  disabled={loading}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-xs hover:shadow-lg hover:shadow-green-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? '...' : (
                    <>
                      <Check size={16} /> Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
        {icon} {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
