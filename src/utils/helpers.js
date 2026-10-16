export const exportToCSV = (data, filename, columns, t) => {
  if (!data || !data.length) return;
  const headers = columns.map(c => `"${c.l}"`).join(',');
  const rows = data.map((obj, idx) => columns.map(c => {
    if (c.k === '#') return `"${idx + 1}"`;
    let val = obj[c.k];
    val = t && t(val) !== val ? t(val) : val;
    return `"${String(val || '').replace(/"/g, '""')}"`;
  }).join(',')).join('\n');
  const csv = "\ufeff" + headers + '\n' + rows;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

export const exportToXLSX = async (data, filename, columns, t) => {
  if (!data || !data.length) return;
  const XLSX = await import('xlsx');
  const headers = columns.map(c => c.l);
  const rows = data.map((obj, idx) =>
    columns.map(c => {
      if (c.k === '#') return idx + 1;
      let val = obj[c.k];
      val = t && t(val) !== val ? t(val) : val;
      return val ?? '';
    })
  );
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = columns.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'HSE Data');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const simulateQRScan = (callback) => {
  setTimeout(() => { callback(Math.floor(Math.random() * 90000) + 10000); }, 600);
};

// Generate sequential permit number: PTW-YYYY-NNNN
export const generatePermitNumber = (existingPermits = []) => {
  const year = new Date().getFullYear();
  const nums = existingPermits
    .map(p => p.permitNumber || p.id || '')
    .map(pn => { const m = String(pn).match(/PTW-\d{4}-(\d+)/); return m ? parseInt(m[1], 10) : 0; });
  const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
  return `PTW-${year}-${String(next).padStart(4, '0')}`;
};
