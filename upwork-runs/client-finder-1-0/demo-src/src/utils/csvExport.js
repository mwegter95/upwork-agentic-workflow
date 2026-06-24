export function exportCSV(leads, filename = 'client-finder-leads.csv') {
  const cols = [
    'id','company_name','industry','city','state','employee_count','website',
    'score_modernity','score_mobile','score_function','composite_score',
    'outdated_stack','stack_flags','dm_name','dm_title','dm_seniority','dm_source',
    'email','phone','contact_form_url','outreach_status','notes','created_at',
  ];
  const esc = v => {
    if (v == null) return '';
    const s = Array.isArray(v) ? v.join('; ') : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [cols.join(','), ...leads.map(l => cols.map(c => esc(l[c])).join(','))];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
