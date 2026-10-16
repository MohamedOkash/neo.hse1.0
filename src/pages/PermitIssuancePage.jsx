import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Download, Printer, Search, Filter, ChevronDown } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from '../components/ui/GlassComponents';
import { PermitIssuanceForm } from '../components/permits/PermitIssuanceForm';

/**
 * صفحة إصدار التصاريح المتقدمة
 * 
 * الميزات:
 * - إنشاء تصاريح جديدة
 * - البحث والتصفية المتقدمة
 * - عرض التصاريح في جدول أو بطاقات
 * - تحرير والتعديل السريع
 * - طباعة وتصدير
 */
export function PermitIssuancePage({ 
  t, 
  isRtl, 
  lang, 
  user, 
  permits = [], 
  onAddPermit, 
  onUpdatePermit, 
  onDeletePermit,
  onPrintPermit 
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPermit, setEditingPermit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [sortBy, setSortBy] = useState('createdAt');

  // تصفية التصاريح
  const filteredPermits = permits.filter(permit => {
    const matchesSearch = 
      permit.permitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.requesterName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || permit.status === filterStatus;
    const matchesType = filterType === 'all' || permit.type === filterType;
    const matchesApproval = filterApprovalStatus === 'all' || permit.approvalStatus === filterApprovalStatus;

    return matchesSearch && matchesStatus && matchesType && matchesApproval;
  });

  // ترتيب التصاريح
  const sortedPermits = [...filteredPermits].sort((a, b) => {
    if (sortBy === 'createdAt') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === 'validUntil') {
      return new Date(a.validUntil) - new Date(b.validUntil);
    } else if (sortBy === 'approvalLevel') {
      return (b.approvalLevel ?? 0) - (a.approvalLevel ?? 0);
    }
    return 0;
  });

  const handleCreatePermit = (permitData) => {
    onAddPermit?.(permitData);
    setIsFormOpen(false);
  };

  const handleUpdatePermit = (permitData) => {
    onUpdatePermit?.(editingPermit.id, permitData);
    setEditingPermit(null);
  };

  const handleDeletePermit = (permitId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التصريح؟')) {
      onDeletePermit?.(permitId);
    }
  };

  // إحصائيات سريعة
  const stats = {
    total: permits.length,
    active: permits.filter(p => p.status === 'open').length,
    pending: permits.filter(p => p.approvalStatus === 'pending').length,
    approved: permits.filter(p => p.approvalStatus === 'approved').length,
    rejected: permits.filter(p => p.approvalStatus === 'rejected').length,
  };

  return (
    <div className={`w-full h-full overflow-auto ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* الرأس */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-white/80 to-white/60 dark:from-slate-900/80 dark:to-slate-900/60 backdrop-blur-xl border-b border-black/10 dark:border-white/10 p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              📋 {t('permitIssuance') || 'إصدار التصاريح'}
            </h1>
            <p className="text-sm opacity-60 mt-1">{t('manageAllPermits') || 'إدارة جميع التصاريح'}</p>
          </div>

          <GlassButton
            onClick={() => {
              setEditingPermit(null);
              setIsFormOpen(true);
            }}
            className="gap-2 flex-shrink-0 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
          >
            <Plus size={18} /> {t('newPermit') || 'تصريح جديد'}
          </GlassButton>
        </div>

        {/* الإحصائيات السريعة */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label={t('total') || 'إجمالي'} value={stats.total} color="blue" />
          <StatCard label={t('active') || 'نشط'} value={stats.active} color="green" />
          <StatCard label={t('pending') || 'في الانتظار'} value={stats.pending} color="amber" />
          <StatCard label={t('approved') || 'موافق'} value={stats.approved} color="emerald" />
          <StatCard label={t('rejected') || 'مرفوض'} value={stats.rejected} color="red" />
        </div>

        {/* أدوات البحث والتصفية */}
        <div className="space-y-3">
          {/* شريط البحث */}
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
              <GlassInput
                type="text"
                placeholder={t('search') || 'البحث...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* الفلاتر */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <FilterSelect
              label={t('status') || 'الحالة'}
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: t('all') || 'الكل' },
                { value: 'open', label: t('active') || 'نشط' },
                { value: 'stopped', label: t('stopped') || 'موقوف' },
              ]}
            />
            <FilterSelect
              label={t('type') || 'النوع'}
              value={filterType}
              onChange={setFilterType}
              options={[
                { value: 'all', label: t('all') || 'الكل' },
                { value: 'hotwork', label: 'عمل ساخن' },
                { value: 'confined', label: 'مساحة محصورة' },
                { value: 'excavation', label: 'حفريات' },
                { value: 'electrical', label: 'كهربائي' },
              ]}
            />
            <FilterSelect
              label={t('approval') || 'الموافقة'}
              value={filterApprovalStatus}
              onChange={setFilterApprovalStatus}
              options={[
                { value: 'all', label: t('all') || 'الكل' },
                { value: 'pending', label: t('pending') || 'في الانتظار' },
                { value: 'approved', label: t('approved') || 'موافق' },
                { value: 'rejected', label: t('rejected') || 'مرفوض' },
              ]}
            />
            <FilterSelect
              label={t('sortBy') || 'ترتيب حسب'}
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'createdAt', label: 'الأحدث' },
                { value: 'validUntil', label: 'تاريخ الانتهاء' },
                { value: 'approvalLevel', label: 'مستوى الموافقة' },
              ]}
            />
          </div>

          {/* زر تبديل عرض النوع */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20'
              }`}
            >
              🎴 بطاقات
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20'
              }`}
            >
              📊 جدول
            </button>
          </div>
        </div>
      </div>

      {/* محتوى الصفحة */}
      <div className="p-4 md:p-6 space-y-4">
        {/* رسالة العدم وجود نتائج */}
        {sortedPermits.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg opacity-60 mb-3">
              {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                ? t('noResults') || 'لم يتم العثور على نتائج'
                : t('noPermits') || 'لا توجد تصاريح بعد'}
            </p>
            {!searchQuery && filterStatus === 'all' && filterType === 'all' && (
              <GlassButton
                onClick={() => setIsFormOpen(true)}
                className="gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300"
              >
                <Plus size={18} /> إنشاء التصريح الأول
              </GlassButton>
            )}
          </div>
        )}

        {/* عرض البطاقات */}
        {viewMode === 'cards' && sortedPermits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPermits.map(permit => (
              <PermitCard
                key={permit.id}
                permit={permit}
                t={t}
                isRtl={isRtl}
                onEdit={() => {
                  setEditingPermit(permit);
                  setIsFormOpen(true);
                }}
                onDelete={() => handleDeletePermit(permit.id)}
                onPrint={() => onPrintPermit?.(permit)}
              />
            ))}
          </div>
        )}

        {/* عرض الجدول */}
        {viewMode === 'table' && sortedPermits.length > 0 && (
          <PermitsTable
            permits={sortedPermits}
            t={t}
            isRtl={isRtl}
            onEdit={(permit) => {
              setEditingPermit(permit);
              setIsFormOpen(true);
            }}
            onDelete={handleDeletePermit}
            onPrint={() => onPrintPermit?.()}
          />
        )}
      </div>

      {/* نموذج الإصدار */}
      {isFormOpen && (
        <PermitIssuanceForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingPermit(null);
          }}
          onSubmit={editingPermit ? handleUpdatePermit : handleCreatePermit}
          initialPermit={editingPermit}
          user={user}
          t={t}
          isRtl={isRtl}
          lang={lang}
        />
      )}
    </div>
  );
}

/**
 * بطاقة التصريح
 */
function PermitCard({ permit, t, isRtl, onEdit, onDelete, onPrint }) {
  const statusColor = {
    open: 'emerald',
    stopped: 'slate',
  }[permit.status] || 'slate';

  const approvalColor = {
    pending: 'amber',
    approved: 'emerald',
    rejected: 'red',
  }[permit.approvalStatus] || 'slate';

  return (
    <GlassCard className="p-5 space-y-3">
      {/* الرأس */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{permit.type || 'تصريح'}</h3>
          <p className="text-xs opacity-60 mt-1">#{permit.permitNumber || permit.id.slice(0, 8)}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-2 hover:bg-white/20 dark:hover:bg-black/20 rounded-lg transition">
            <Edit2 size={16} className="opacity-60" />
          </button>
          <button onClick={onDelete} className="p-2 hover:bg-red-500/10 rounded-lg transition">
            <Trash2 size={16} className="opacity-60 hover:text-red-600" />
          </button>
        </div>
      </div>

      {/* البيانات */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="opacity-60">{t('location') || 'الموقع'}:</span>
          <span className="font-bold">{permit.location || '--'}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-60">{t('requester') || 'طالب'}:</span>
          <span className="font-bold">{permit.requesterName || '--'}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-60">{t('validUntil') || 'صالح إلى'}:</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{permit.validUntil || '--'}</span>
        </div>
      </div>

      {/* الحالة */}
      <div className="flex gap-2 pt-2 border-t border-black/10 dark:border-white/10">
        <span className={`text-xs font-bold px-2 py-1 rounded-full bg-${statusColor}-500/10 text-${statusColor}-700 dark:text-${statusColor}-300 border border-${statusColor}-500/20`}>
          {permit.status === 'open' ? t('active') : t('stopped')}
        </span>
        <span className={`text-xs font-bold px-2 py-1 rounded-full bg-${approvalColor}-500/10 text-${approvalColor}-700 dark:text-${approvalColor}-300 border border-${approvalColor}-500/20`}>
          {permit.approvalStatus}
        </span>
      </div>

      {/* الأزرار */}
      <div className="flex gap-2 pt-2 border-t border-black/10 dark:border-white/10">
        <button onClick={onPrint} className="flex-1 py-2 text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition flex items-center justify-center gap-1">
          <Printer size={14} /> طباعة
        </button>
        <button onClick={onEdit} className="flex-1 py-2 text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition flex items-center justify-center gap-1">
          <Eye size={14} /> عرض
        </button>
      </div>
    </GlassCard>
  );
}

/**
 * جدول التصاريح
 */
function PermitsTable({ permits, t, isRtl, onEdit, onDelete, onPrint }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
      <table className="w-full text-xs md:text-sm">
        <thead className="bg-white/20 dark:bg-black/20 border-b border-black/10 dark:border-white/10">
          <tr>
            <th className="px-4 py-3 text-right font-bold">{t('permit') || 'التصريح'}</th>
            <th className="px-4 py-3 text-right font-bold">{t('type') || 'النوع'}</th>
            <th className="px-4 py-3 text-right font-bold">{t('location') || 'الموقع'}</th>
            <th className="px-4 py-3 text-right font-bold">{t('validUntil') || 'صالح إلى'}</th>
            <th className="px-4 py-3 text-right font-bold">{t('status') || 'الحالة'}</th>
            <th className="px-4 py-3 text-right font-bold">{t('actions') || 'إجراءات'}</th>
          </tr>
        </thead>
        <tbody>
          {permits.map((permit, idx) => (
            <tr key={permit.id} className={`border-b border-black/10 dark:border-white/10 ${idx % 2 === 0 ? 'bg-white/5 dark:bg-black/5' : ''}`}>
              <td className="px-4 py-3 font-bold">#{permit.permitNumber || permit.id.slice(0, 8)}</td>
              <td className="px-4 py-3">{permit.type || '--'}</td>
              <td className="px-4 py-3">{permit.location || '--'}</td>
              <td className="px-4 py-3">{permit.validUntil || '--'}</td>
              <td className="px-4 py-3">
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  {permit.status === 'open' ? t('active') : t('stopped')}
                </span>
              </td>
              <td className="px-4 py-3 flex gap-1">
                <button onClick={() => onEdit(permit)} className="p-1.5 hover:bg-blue-500/10 rounded transition" title={t('edit')}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => onDelete(permit.id)} className="p-1.5 hover:bg-red-500/10 rounded transition" title={t('delete')}>
                  <Trash2 size={14} className="text-red-600" />
                </button>
                <button onClick={onPrint} className="p-1.5 hover:bg-indigo-500/10 rounded transition" title={t('print')}>
                  <Printer size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * مكون بطاقة الإحصائية
 */
function StatCard({ label, value, color }) {
  const bgColor = `bg-${color}-500/10`;
  const textColor = `text-${color}-700 dark:text-${color}-300`;
  const borderColor = `border-${color}-500/30`;

  return (
    <GlassCard className={`p-3 border ${borderColor} ${bgColor}`}>
      <p className="text-xs opacity-70 font-bold mb-1">{label}</p>
      <p className={`text-2xl font-black ${textColor}`}>{value}</p>
    </GlassCard>
  );
}

/**
 * مكون اختيار الفلتر
 */
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative group">
      <label className="text-xs opacity-60 font-bold block mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold appearance-none cursor-pointer hover:bg-white/20 dark:hover:bg-black/20 transition"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-7 opacity-40 pointer-events-none" />
    </div>
  );
}
