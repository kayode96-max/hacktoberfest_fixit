'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History as HistoryIcon,
  Search,
  Trash2,
  ChevronRight,
  PlusCircle,
  Sun,
  Zap,
  Cpu,
  Home as HomeIcon,
} from 'lucide-react';
import { getStoredSessions, deleteSession } from '@/lib/storage';
import { DiagnosticSession, EquipmentCategory } from '@/types/diagnosis';

export default function HistoryPage() {
  const [sessions, setSessions] = useState<DiagnosticSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    setSessions(getStoredSessions());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Delete this diagnosis session?')) {
      deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const filtered = sessions.filter((s) => {
    const matchesSearch =
      s.equipmentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.problemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.resolutionSummary && s.resolutionSummary.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = filterCat === 'all' || s.category === filterCat;
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;

    return matchesSearch && matchesCat && matchesStatus;
  });

  const getCategoryBadge = (cat: EquipmentCategory) => {
    switch (cat) {
      case 'solar':
        return (
          <span className="badge badge-solar">
            <Sun size={12} />
            <span>Solar</span>
          </span>
        );
      case 'electrical':
        return (
          <span className="badge badge-electrical">
            <Zap size={12} />
            <span>Electrical</span>
          </span>
        );
      case 'electronics':
        return (
          <span className="badge badge-electronics">
            <Cpu size={12} />
            <span>Electronics</span>
          </span>
        );
      case 'appliances':
        return (
          <span className="badge badge-appliances">
            <HomeIcon size={12} />
            <span>Appliances</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: DiagnosticSession['status']) => {
    switch (status) {
      case 'solved':
        return <span className="badge badge-solved">Solved</span>;
      case 'technician_required':
        return <span className="badge badge-tech">Tech Required</span>;
      default:
        return <span className="badge badge-continue">In Progress</span>;
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>Diagnosis History</h1>
          <p style={{ fontSize: '13px', color: '#ffffff', opacity: 0.85 }}>
            Review past troubleshooting sessions and repair logs
          </p>
        </div>

        <Link href="/diagnose" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', minHeight: '32px', textDecoration: 'none' }}>
          <PlusCircle size={14} />
          <span>New</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="form-group" style={{ position: 'relative', marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Search equipment, symptom, or cause..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ paddingLeft: '34px' }}
        />
        <Search
          size={15}
          color="var(--text-muted)"
          style={{ position: 'absolute', left: '12px', top: '13px' }}
        />
      </div>

      {/* Category Filter Pills (No Emojis) */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '12px' }}>
        {[
          { id: 'all', label: 'All Equipment' },
          { id: 'solar', label: 'Solar' },
          { id: 'electrical', label: 'Electrical' },
          { id: 'electronics', label: 'Electronics' },
          { id: 'appliances', label: 'Appliances' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilterCat(item.id)}
            className={`btn btn-secondary ${filterCat === item.id ? 'btn-primary' : ''}`}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              minHeight: '28px',
              whiteSpace: 'nowrap',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {filtered.length === 0 ? (
        <div className="fix-card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <HistoryIcon size={28} color="var(--text-muted)" style={{ margin: '0 auto 8px auto' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', color: '#ffffff' }}>No Diagnoses Found</h3>
          <p style={{ fontSize: '12px', color: '#ffffff', opacity: 0.8 }}>
            No sessions match your search or filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((s) => (
            <Link
              key={s.id}
              href={`/diagnosis/${s.id}`}
              className="fix-card interactive"
              style={{ margin: 0, padding: '12px 14px', textDecoration: 'none' }}
              id={`history-item-${s.id}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {getCategoryBadge(s.category)}
                  {getStatusBadge(s.status)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#ffffff', opacity: 0.7, fontFamily: 'var(--font-mono)' }}>
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, s.id)}
                    className="icon-btn"
                    style={{ width: '26px', height: '26px', border: 'none', background: 'transparent', textDecoration: 'none' }}
                    title="Delete record"
                  >
                    <Trash2 size={13} color="var(--text-muted)" />
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px', color: '#ffffff' }}>
                {s.equipmentType}
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: '#ffffff',
                  opacity: 0.85,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: '6px',
                }}
              >
                {s.problemDescription}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#ffffff', opacity: 0.75 }}>
                <span>{s.stepsHistory.length} test(s) &bull; {s.confidence}% confidence</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--emerald-primary)' }}>
                  <span>View Details</span>
                  <ChevronRight size={13} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
