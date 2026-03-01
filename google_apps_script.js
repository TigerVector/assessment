// ═══════════════════════════════════════════════════════════════
// TIGER VECTOR — Safety Assessment Lead Capture + Email
// Google Apps Script — paste this in script.google.com
// ═══════════════════════════════════════════════════════════════
//
// SETUP INSTRUCTIONS:
// 1. Go to https://script.google.com
// 2. Click "New project" — name it "TIGER VECTOR Assessment"
// 3. Paste this entire file, replacing the default code
// 4. Click "Deploy" → "New deployment"
// 5. Type: Web App | Execute as: Me | Who has access: Anyone
// 6. Click "Deploy" and copy the Web App URL
// 7. Paste that URL into index.html replacing YOUR_GOOGLE_APPS_SCRIPT_URL
// ═══════════════════════════════════════════════════════════════

const NOTIFY_EMAIL = 'support@tigervector.vip';
const SHEET_NAME   = 'TIGER VECTOR Leads';
const CALENDLY_URL = 'https://calendly.com/wakeupwarriorleader/tigervector';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    saveToSheet(data);
    sendNotificationTodaniel(data);
    sendResultsToRespondent(data);
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Save lead to Google Sheet ───────────────────────────────────
function saveToSheet(data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp','Name','Email','Company','Phone',
      'Job Title','Sector','Company Size','Country',
      'D1','D2','D3','D4','D5','D6','D7','D8',
      'Score','Maturity Level','Strategic Identity','Language'
    ]);
    const hdr = sheet.getRange(1,1,1,21);
    hdr.setBackground('#070D1B').setFontColor('#F0C040').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.name, data.email, data.company, data.phone || '',
    data.job, data.sector, data.size, data.country,
    data.d1||0, data.d2||0, data.d3||0, data.d4||0,
    data.d5||0, data.d6||0, data.d7||0, data.d8||0,
    data.totalScore||0, data.maturityLevel||'', data.identityType||'', data.language||'en'
  ]);

  const lastRow = sheet.getLastRow();
  const score   = parseInt(data.totalScore)||0;
  const color   = score<40?'#E63946':score<55?'#D97706':score<70?'#EAB308':score<85?'#059669':'#2563EB';
  sheet.getRange(lastRow,18).setBackground(color+'33');
  sheet.getRange(lastRow,19).setFontColor(color).setFontWeight('bold');
}

// ── Notify Daniel ───────────────────────────────────────────────
function sendNotificationTodaniel(data) {
  const subject = `New Lead: ${data.name} — ${data.maturityLevel} | ${data.identityType} (${data.totalScore}/100)`;
  const body = `New assessment completed.\n\n` +
    `CONTACT\nName: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company}\nPhone: ${data.phone||'—'}\n\n` +
    `QUALIFIER\nJob: ${data.job}\nSector: ${data.sector}\nSize: ${data.size}\nCountry: ${data.country}\n\n` +
    `RESULTS\nScore: ${data.totalScore}/100\nMaturity: ${data.maturityLevel}\nIdentity: ${data.identityType}\n\n` +
    `D1:${data.d1} D2:${data.d2} D3:${data.d3} D4:${data.d4} D5:${data.d5} D6:${data.d6} D7:${data.d7} D8:${data.d8}`;
  GmailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

// ── Send results email TO the respondent ────────────────────────
function sendResultsToRespondent(data) {
  if (!data.email) return;

  const score    = parseInt(data.totalScore) || 0;
  const isEs     = data.language === 'es';
  const color    = score<40?'#E63946':score<55?'#D97706':score<70?'#EAB308':score<85?'#059669':'#2563EB';

  const dimNames = isEs
    ? ['Liderazgo','Just Culture','Reporte','Aprendizaje','Comunicación','Gestión del Cambio','Participación','Recursos']
    : ['Leadership','Just Culture','Reporting','Learning','Communication','Change Mgmt','Participation','Resources'];

  const dims = [data.d1,data.d2,data.d3,data.d4,data.d5,data.d6,data.d7,data.d8];

  const dimRows = dims.map((v,i) => {
    const pct = Math.round((v/5)*100);
    const bar = '█'.repeat(Math.round(pct/10)) + '░'.repeat(10-Math.round(pct/10));
    return `<tr>
      <td style="padding:6px 0;font-size:13px;color:#475569;width:160px">D${i+1} — ${dimNames[i]}</td>
      <td style="padding:6px 8px;font-family:monospace;color:${color};letter-spacing:1px">${bar}</td>
      <td style="padding:6px 0;font-size:13px;font-weight:700;color:#1e293b;text-align:right">${pct}%</td>
    </tr>`;
  }).join('');

  const subject = isEs
    ? `Sus resultados TIGER VECTOR — ${data.maturityLevel}`
    : `Your TIGER VECTOR Results — ${data.maturityLevel}`;

  const greeting   = isEs ? `Hola ${data.name},`       : `Hi ${data.name},`;
  const thankYou   = isEs ? 'Gracias por completar el <strong>TIGER VECTOR Safety Culture Maturity Assessment</strong>. Sus resultados están listos.'
                           : 'Thank you for completing the <strong>TIGER VECTOR Safety Culture Maturity Assessment</strong>. Your results are ready.';
  const scoreLabel = isEs ? 'SU PUNTAJE'            : 'YOUR SCORE';
  const levelLabel = isEs ? 'NIVEL DE MADUREZ'      : 'MATURITY LEVEL';
  const identLabel = isEs ? 'IDENTIDAD ESTRATÉGICA' : 'STRATEGIC IDENTITY';
  const dimsLabel  = isEs ? '8 DIMENSIONES'         : '8 DIMENSIONS';
  const ctaTitle   = isEs ? 'El siguiente paso es suyo.'  : 'Your next step is waiting.';
  const ctaSub     = isEs ? 'Reserve una sesión gratuita de 30 minutos y revisemos juntos qué significan estos resultados para su operación.'
                           : 'Book a free 30-minute session and let\'s review together what these results mean for your operation.';
  const ctaBtn     = isEs ? 'AGENDAR SESIÓN GRATUITA →' : 'BOOK FREE 30-MIN SESSION →';
  const footer1    = isEs ? 'Piloto de Caza · Fundador, TIGER VECTOR · Experto en Seguridad Aérea'
                           : 'Fighter Pilot · Founder, TIGER VECTOR · Aviation Safety Expert';

  const calendlyLink = `${CALENDLY_URL}?name=${encodeURIComponent(data.name)}&email=${encodeURIComponent(data.email)}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

  <!-- HEADER -->
  <tr><td style="background:#070D1B;border-radius:14px 14px 0 0;padding:28px 32px;text-align:center">
    <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:4px;color:#F0C040">TIGER VECTOR</p>
    <p style="margin:4px 0 0;font-size:9px;letter-spacing:2px;color:#475569;text-transform:uppercase">Safety Culture Maturity Advisor</p>
    <div style="width:40px;height:2px;background:#F0C040;margin:10px auto 0"></div>
  </td></tr>

  <!-- GREETING -->
  <tr><td style="background:#fff;padding:28px 32px">
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0f172a">${greeting}</p>
    <p style="margin:0;font-size:14px;color:#475569;line-height:1.6">${thankYou}</p>
  </td></tr>

  <!-- SCORE CARD -->
  <tr><td style="background:#070D1B;padding:28px 32px;text-align:center">
    <p style="margin:0 0 6px;font-size:10px;letter-spacing:3px;color:#64748B">${scoreLabel}</p>
    <p style="margin:0;font-size:72px;font-weight:800;color:#F0C040;line-height:1">${score}</p>
    <p style="margin:4px 0 16px;font-size:13px;color:#475569">${isEs?'de':'out of'} 100</p>
    <div style="display:inline-block;background:${color}22;border:1px solid ${color}66;border-radius:20px;padding:8px 20px;margin-bottom:16px">
      <span style="font-size:13px;font-weight:700;letter-spacing:2px;color:${color}">${data.maturityLevel}</span>
    </div>
  </td></tr>

  <!-- IDENTITY -->
  <tr><td style="background:#0A1628;padding:20px 32px;border-top:1px solid #1B3A6B">
    <p style="margin:0 0 10px;font-size:10px;letter-spacing:3px;color:#64748B">${identLabel}</p>
    <div style="background:#F0C04018;border:1px solid #F0C04055;border-radius:8px;padding:10px 18px;display:inline-block">
      <span style="font-size:13px;font-weight:700;letter-spacing:1.5px;color:#F0C040">${data.identityType||'—'}</span>
    </div>
  </td></tr>

  <!-- DIMENSIONS -->
  <tr><td style="background:#fff;padding:24px 32px">
    <p style="margin:0 0 16px;font-size:10px;letter-spacing:2px;color:#F0C040;font-weight:700">${dimsLabel}</p>
    <table width="100%" cellpadding="0" cellspacing="0">${dimRows}</table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="background:#070D1B;padding:32px;text-align:center;border-radius:0 0 14px 14px">
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#fff">${ctaTitle}</p>
    <p style="margin:0 0 24px;font-size:13px;color:#94A3B8;line-height:1.6">${ctaSub}</p>
    <a href="${calendlyLink}" target="_blank"
       style="display:inline-block;background:#F0C040;color:#070D1B;padding:16px 32px;
              border-radius:8px;font-size:15px;font-weight:700;letter-spacing:.5px;
              text-decoration:none">${ctaBtn}</a>
    <div style="margin-top:28px;border-top:1px solid #1B3A6B;padding-top:20px">
      <p style="margin:0;font-size:14px;font-weight:700;color:#F0C040">Daniel Meléndez</p>
      <p style="margin:4px 0 0;font-size:11px;color:#475569">${footer1}</p>
      <p style="margin:4px 0 0;font-size:11px;color:#334155">support@tigervector.vip</p>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  GmailApp.sendEmail(data.email, subject, '', {
    htmlBody: htmlBody,
    name: 'Daniel Meléndez — TIGER VECTOR',
    replyTo: 'support@tigervector.vip'
  });
}

// ── Test function ───────────────────────────────────────────────
function testSetup() {
  doPost({
    postData: {
      contents: JSON.stringify({
        name:'Carlos Rodríguez', email:'carlos@avianca.com',
        company:'Avianca', phone:'+57 300 123 4567',
        job:'Safety Director / CSO', sector:'Scheduled Commercial',
        size:'501–1,000', country:'Colombia',
        d1:4, d2:3, d3:4, d4:3, d5:4, d6:3, d7:4, d8:4,
        totalScore:78, maturityLevel:'N4 — INTEGRATED',
        identityType:'STRATEGICALLY CONFIGURED',
        language:'en', timestamp: new Date().toISOString()
      })
    }
  });
  Logger.log('Test complete — check sheet and both emails.');
}
