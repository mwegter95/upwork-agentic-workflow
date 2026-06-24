export function calcComposite(m, mob, f) {
  return Math.round(((m + mob + f) / 3) * 10) / 10;
}

export function isOutdated(lead) {
  if (lead.outdated_stack) return true;
  if (lead.composite_score < 4) return true;
  return false;
}

export function scoreColor(score) {
  if (score >= 7) return 'var(--cf-score-high)';
  if (score >= 4) return 'var(--cf-score-mid)';
  return 'var(--cf-score-low)';
}

export function statusClass(status) {
  const map = { New: 'status-New', Contacted: 'status-Contacted', 'In Progress': 'status-InProgress', Ignored: 'status-Ignored' };
  return map[status] || 'status-New';
}

export function dmInitials(name) {
  if (!name) return '?';
  const parts = name.replace(/^Dr\.?\s*/i, '').split(' ');
  return parts.map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

export const TWIN_CITIES = new Set([
  'Minneapolis','St. Paul','Bloomington','Edina','Eden Prairie','Plymouth',
  'Minnetonka','Eagan','Roseville','St. Louis Park','Burnsville','Golden Valley',
  'Woodbury','Brooklyn Park','Maple Grove','Blaine',
]);

export function getRegion(city) {
  return TWIN_CITIES.has(city) ? 'Twin Cities' : 'Greater MN';
}

export const ALL_INDUSTRIES = [
  'Entertainment','Professional Services','Home & Commercial Services',
  'Healthcare & Wellness','Retail & Hospitality','Manufacturing & Logistics',
];

export const ALL_STATUSES = ['New','Contacted','In Progress','Ignored'];

export const RANDOM_CITIES_TC = ['Minneapolis','St. Paul','Bloomington','Edina','Eden Prairie','Plymouth','Minnetonka','Eagan','Burnsville','Brooklyn Park'];
export const RANDOM_CITIES_GMN = ['Duluth','Rochester','St. Cloud','Mankato','Moorhead','Brainerd','Winona','Fergus Falls'];

const FIRST_NAMES = ['Alex','Jordan','Taylor','Morgan','Casey','Jamie','Riley','Dana','Cameron','Avery','Blake','Quinn','Reese','Sydney','Drew'];
const LAST_INITS = ['A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','R','S','T','W'];
const TITLES_CSUITE = ['CEO','Owner','Co-Founder','President','Founder','Managing Partner','Principal'];
const TITLES_DIR = ['Director of Operations','Creative Director','Clinical Director','Executive Director','VP of Marketing'];
const INDUSTRIES_LIST = ALL_INDUSTRIES;
const STACK_FLAGS_POOL = ['Legacy WordPress','Missing HTTPS','Non-responsive layout','Outdated jQuery','No meta viewport','No SSL certificate'];

export function generateNewLead(industry, region, idStart) {
  const cities = region === 'Twin Cities' ? RANDOM_CITIES_TC : (region === 'Greater MN' ? RANDOM_CITIES_GMN : [...RANDOM_CITIES_TC, ...RANDOM_CITIES_GMN]);
  const city = cities[Math.floor(Math.random() * cities.length)];
  const ind = industry || INDUSTRIES_LIST[Math.floor(Math.random() * INDUSTRIES_LIST.length)];
  const mod = Math.floor(Math.random() * 5) + 2;
  const mob = Math.floor(Math.random() * 5) + 1;
  const fun = Math.floor(Math.random() * 5) + 2;
  const comp = calcComposite(mod, mob, fun);
  const outdated = comp < 5 || Math.random() < 0.4;
  const numFlags = outdated ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 2);
  const flags = [...STACK_FLAGS_POOL].sort(() => Math.random() - 0.5).slice(0, numFlags);
  const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const li = LAST_INITS[Math.floor(Math.random() * LAST_INITS.length)];
  const isCsuite = Math.random() > 0.3;
  const title = isCsuite ? TITLES_CSUITE[Math.floor(Math.random() * TITLES_CSUITE.length)] : TITLES_DIR[Math.floor(Math.random() * TITLES_DIR.length)];
  const emp = Math.floor(Math.random() * 180) + 5;
  const domain = `${ind.toLowerCase().replace(/[^a-z]/g,'').slice(0,6)}${city.toLowerCase().replace(/[^a-z]/g,'').slice(0,4)}mn.com`;
  const hasEmail = Math.random() > 0.3;
  const hasPhone = Math.random() > 0.2;
  const areaCode = city === 'Minneapolis' || city === 'St. Paul' ? (Math.random() > 0.5 ? '612' : '651') : (city === 'Duluth' ? '218' : (city === 'Rochester' ? '507' : '320'));
  return {
    id: idStart + Math.floor(Math.random() * 9000),
    company_name: `${city} ${ind.split(' ')[0]} Solutions`,
    industry: ind,
    city,
    state: 'MN',
    employee_count: emp,
    website: domain,
    screenshot_url: null,
    score_modernity: mod,
    score_mobile: mob,
    score_function: fun,
    composite_score: comp,
    outdated_stack: outdated,
    stack_flags: flags,
    dm_name: `${fn} ${li}.`,
    dm_title: title,
    dm_seniority: isCsuite ? 'C-Suite' : 'Director',
    dm_source: 'Apollo',
    dm_linkedin: '',
    email: hasEmail ? `info@${domain}` : null,
    phone: hasPhone ? `(${areaCode}) 555-${String(Math.floor(Math.random()*9000)+1000).slice(0,4)}` : null,
    contact_form_url: Math.random() > 0.5 ? `${domain}/contact` : null,
    outreach_status: 'New',
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    _isNew: true,
  };
}
