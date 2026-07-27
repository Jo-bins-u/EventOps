import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import {
  DocumentPdfRegular,
  ImageRegular,
  DocumentRegular,
  DocumentTableRegular,
  DismissRegular,
  DeleteRegular,
  AddRegular,
  FolderRegular,
  ShareRegular,
  DocumentArrowDownRegular,
  DocumentArrowUpRegular,
  CheckmarkCircleRegular,
  EyeRegular
} from '@fluentui/react-icons';

const FILE_ICONS = { 
  'application/pdf': <DocumentPdfRegular style={{ width: '20px', height: '20px' }} />, 
  'image/png': <ImageRegular style={{ width: '20px', height: '20px' }} />, 
  'image/jpeg': <ImageRegular style={{ width: '20px', height: '20px' }} />, 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <DocumentRegular style={{ width: '20px', height: '20px' }} />, 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': <DocumentTableRegular style={{ width: '20px', height: '20px' }} /> 
};
const FILE_COLORS = { 'application/pdf': 'var(--red-bg)', 'image/png': 'var(--blue-bg)', 'image/jpeg': 'var(--blue-bg)', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'var(--purple-bg)', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'var(--green-bg)' };

export default function DocumentsPage() {
  const { user, hasPermission } = useAuthStore();
  const qc = useQueryClient();
  const fileInputRef = useRef();
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form, setForm] = useState({ name: '', event: '', accessModel: 'role', allowedRoles: ['admin', 'domain_head', 'event_head'], canShareInChat: true });
  const [filterEvent, setFilterEvent] = useState('');

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents', filterEvent],
    queryFn: () => api.get(`/documents${filterEvent ? `?event=${filterEvent}` : ''}`).then(r => r.data),
  });

  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => api.get('/events').then(r => r.data) });

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      return api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded / e.total) * 100)),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries(['documents']);
      setShowUpload(false);
      setUploadFile(null);
      setUploadProgress(0);
      toast.success('File uploaded!');
    },
    onError: () => toast.error('Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/documents/${id}`),
    onSuccess: () => { qc.invalidateQueries(['documents']); toast.success('File deleted'); },
  });

  const handleUpload = () => {
    if (!uploadFile) return toast.error('Please select a file');
    const fd = new FormData();
    fd.append('file', uploadFile);
    fd.append('name', form.name || uploadFile.name);
    if (form.event) fd.append('event', form.event);
    fd.append('accessModel', form.accessModel);
    fd.append('allowedRoles', JSON.stringify(form.allowedRoles));
    fd.append('canShareInChat', form.canShareInChat);
    uploadMutation.mutate(fd);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const ROLES = ['admin', 'domain_head', 'event_head', 'student_rep', 'volunteer'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ fontSize: '18px', fontWeight: 500 }}>Documents</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)} style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}>
            <option value="">All events</option>
            {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
          </select>
          {hasPermission('UPLOAD_DOCS') && (
            <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowUpload(true)}>
              <AddRegular style={{ width: '14px', height: '14px' }} /> Upload File
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)' }}>Loading documents…</div>
      ) : docs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FolderRegular style={{ width: '48px', height: '48px', marginBottom: '12px', color: 'var(--text3)' }} />
          <div>No documents found. {hasPermission('UPLOAD_DOCS') ? 'Upload the first one!' : ''}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {docs.map(doc => (
            <div key={doc._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: FILE_COLORS[doc.mimeType] || 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', flexShrink: 0 }}>
                {FILE_ICONS[doc.mimeType] || <DocumentRegular style={{ width: '20px', height: '20px' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
                  {doc.uploadedBy?.name} · {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''} · {formatSize(doc.size)}
                  {doc.event && ` · ${doc.event.name}`}
                  <span style={{ marginLeft: '6px', padding: '1px 6px', borderRadius: '4px', background: 'var(--surface2)', fontSize: '10px' }}>
                    {doc.accessModel === 'role' ? `Roles: ${doc.allowedRoles.slice(0, 2).join(', ')}${doc.allowedRoles.length > 2 ? '…' : ''}` : doc.accessModel}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                {doc.canPreview && (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <EyeRegular style={{ width: '12px', height: '12px' }} /> Preview
                  </a>
                )}
                <a href={doc.url} download={doc.name} className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <DocumentArrowDownRegular style={{ width: '12px', height: '12px' }} /> Download
                </a>
                {doc.canShareInChat && (
                  <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <ShareRegular style={{ width: '12px', height: '12px' }} /> Share
                  </button>
                )}
                {(user?.role === 'admin' || doc.uploadedBy?._id === user?._id) && (
                  <button className="btn btn-sm btn-danger" style={{ display: 'flex', alignItems: 'center' }} onClick={() => deleteMutation.mutate(doc._id)}>
                    <DeleteRegular style={{ width: '12px', height: '12px' }} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-bg open">
          <div className="modal" style={{ width: '520px' }}>
            <button className="modal-close" onClick={() => setShowUpload(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DismissRegular style={{ width: '18px', height: '18px' }} />
            </button>
            <div className="modal-title">Upload Document</div>

            {/* Drop zone */}
            <div
              style={{ border: `1.5px dashed ${uploadFile ? 'var(--green)' : 'var(--border2)'}`, borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: uploadFile ? 'var(--green-bg)' : 'var(--surface2)', marginBottom: '14px', transition: 'all 0.2s' }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setUploadFile(f); setForm(x => ({ ...x, name: f.name })); } }}
            >
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
                onChange={e => { const f = e.target.files[0]; if (f) { setUploadFile(f); setForm(x => ({ ...x, name: f.name })); } }} />
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                {uploadFile ? (
                  <CheckmarkCircleRegular style={{ width: '32px', height: '32px', color: 'var(--green)' }} />
                ) : (
                  <DocumentArrowUpRegular style={{ width: '32px', height: '32px', color: 'var(--text3)' }} />
                )}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>{uploadFile ? uploadFile.name : 'Click to browse or drag & drop'}</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '3px' }}>{uploadFile ? formatSize(uploadFile.size) : 'PDF, PNG, DOCX, XLSX · max 50MB'}</div>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}><span>Uploading…</span><span>{uploadProgress}%</span></div>
                <div className="pbar"><div className="pfill" style={{ width: `${uploadProgress}%`, background: 'var(--blue)', transition: 'width 0.3s' }} /></div>
              </div>
            )}

            <div className="field"><label className="label">File name / title</label><input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Display name…" /></div>
            <div className="field"><label className="label">Link to event</label>
              <select value={form.event} onChange={e => setForm(f => ({ ...f, event: e.target.value }))}>
                <option value="">— None —</option>
                {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
              </select>
            </div>
            <div className="field"><label className="label">Access model</label>
              <select value={form.accessModel} onChange={e => setForm(f => ({ ...f, accessModel: e.target.value }))}>
                <option value="role">Role-based</option>
                <option value="user">User-specific</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            {form.accessModel !== 'user' && (
              <div className="field">
                <label className="label">Allowed roles</label>
                {ROLES.map(role => (
                  <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', padding: '5px 0', borderBottom: '0.5px solid var(--border)' }}>
                    <input type="checkbox" checked={form.allowedRoles.includes(role)} style={{ accentColor: 'var(--blue)' }}
                      onChange={e => setForm(f => ({ ...f, allowedRoles: e.target.checked ? [...f.allowedRoles, role] : f.allowedRoles.filter(r => r !== role) }))} />
                    <span style={{ textTransform: 'capitalize' }}>{role.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px' }}>Allow sharing in chat</div>
              <div className={`toggle ${form.canShareInChat ? 'on' : ''}`} onClick={() => setForm(f => ({ ...f, canShareInChat: !f.canShareInChat }))} />
            </div>
            <div style={{ display: 'flex', gap: '9px' }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowUpload(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={!uploadFile || uploadMutation.isPending} onClick={handleUpload}>
                {uploadMutation.isPending ? 'Uploading…' : 'Upload & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
