'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History as HistoryIcon,
  Search,
  Trash2,
  ChevronRight,
  Filter,
  PlusCircle,
  Clock,
  Sparkles,
  RotateCcw,
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

  const getStatusBadge = (status: DiagnosticSession['status']) => {
    switch (status) {
      case 'solved':
        return <span className="badge badge-solved">🟢 Solved</span>;
      case 'technician_required':
        return <span className="badge badge-tech">🔴 Tech Required</span>;
      default:
        return <span className="badge badge-continue">🟡 In Progress</span>;
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Diagnosis History</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Review past troubleshooting sessions and repair logs
          </p>
        </div>

        <Link href="/diagnose" className="btn btn-primary" style={{ padding: '8px 12px', fontSize: '13px' }}>
          <PlusCircle size={15} />
          <span>New</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="form-group" style={{ position: 'relative', marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="Search by equipment, symptom, or cause..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ paddingLeft: '36px' }}
        />
        <Search
          size={16}
          color="var(--text-muted)"
          style={{ position: 'absolute', left: '12px', top: '14px' }}
        />
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px' }}>
        {[
          { id: 'all', label: 'All Equipment' },
          { id: 'solar', label: '☀️ Solar' },
          { id: 'electrical', label: '⚡ Electrical' },
          { id: 'electronics', label: '🔌 Electronics' },
          { id: 'appliances', label: '🏠 Appliances' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilterCat(item.id)}
            className={`btn btn-secondary ${filterCat === item.id ? 'btn-primary' : ''}`}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              minHeight: '30px',
              whiteSpace: 'nowrap',
              borderRadius: '9999px',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {filtered.length === 0 ? (
        <div className="fix-card" style={{ textAlign: 'center', padding: '36px 16px' }}>
          <HistoryIcon size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>No Diagnoses Found</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            No sessions match your search or filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((s) => (
            <Link
              key={s.id}
              href={`/diagnosis/${s.id}`}
              className="fix-card interactive"
              style={{ margin: 0, padding: '14px 16px' }}
              id={`history-item-${s.id}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className={`badge badge-${s.category}`}>{s.category.toUpperCase()}</span>
                  {getStatusBadge(s.status)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, s.id)}
                    className="icon-btn"
                    style={{ width: '28px', height: '28px', border: 'none', background: 'transparent' }}
                    title="Delete record"
                  >
                    <Trash2 size={14} color="var(--text-muted)" />
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '3px' }}>
                {s.equipmentType}
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: '8px',
                }}
              >
                {s.problemDescription}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>{s.stepsHistory.length} check(s) performed &bull; {s.confidence}% confidence</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--accent-cyan)' }}>
                  <span>View Details</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
