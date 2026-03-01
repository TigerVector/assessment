// ═══════════════════════════════════════════════════════════════
// TIGER VECTOR — Safety Assessment Lead Capture
// Google Apps Script — paste this in script.google.com
// ═══════════════════════════════════════════════════════════════
//
// SETUP INSTRUCTIONS:
// 1. Go to https://script.google.com
// 2. Click "New project"
// 3. Paste this entire file, replacing the default code
// 4. Click "Deploy" → "New deployment"
// 5. Type: Web App
// 6. Execute as: Me
// 7. Who has access: Anyone
// 8. Click "Deploy" and copy the Web App URL
// 9. Paste that URL into index.html replacing YOUR_GOOGLE_APPS_SCRIPT_URL
// ═══════════════════════════════════════════════════════════════

const NOTIFY_EMAIL = 'support@tigervector.vip';
const SHEET_NAME   = 'TIGER VECTOR Leads';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // ── Get or create the spreadsheet ──────────────────────────
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    let sheet   = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // ── Add headers if sheet is empty ──────────────────────────
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp','Name','Email','Company','Phone',
        'Job Title','Sector','Company Size','Country',
        'D1 Leadership','D2 Just Culture','D3 Reporting',
        'D4 Learning','D5 Communication','D6 Change Mgmt',
        'D7 Participation','D8 Resources',
        'Total Score (0-100)','Maturity Level','Language'
      ]);
      // Style header row
      const hdr = sheet.getRange(1, 1, 1, 20);
      hdr.setBackground('#070D1B');
      hdr.setFontColor('#F0C040');
      hdr.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // ── Append lead row ────────────────────────────────────────
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name      || '',
      data.email     || '',
      data.company   || '',
      data.phone     || '',
      data.job       || '',
      data.sector    || '',
      data.size      || '',
      data.country   || '',
      data.d1 || 0, data.d2 || 0, data.d3 || 0, data.d4 || 0,
      data.d5 || 0, data.d6 || 0, data.d7 || 0, data.d8 || 0,
      data.totalScore    || 0,
      data.maturityLevel || '',
      data.language      || 'en'
    ]);

    // ── Color-code by maturity level ───────────────────────────
    const lastRow = sheet.getLastRow();
    const score   = parseInt(data.totalScore) || 0;
    const color   = score < 40 ? '#E63946'
                  : score < 55 ? '#D97706'
                  : score < 70 ? '#EAB308'
                  : score < 85 ? '#059669'
                  :              '#2563EB';
    sheet.getRange(lastRow, 18).setBackground(color + '33');
    sheet.getRange(lastRow, 19).setFontColor(color).setFontWeight('bold');

    // ── Send email notification ────────────────────────────────
    const subject = `🎯 New Lead: ${data.name} — ${data.maturityLevel} (${data.totalScore}/100)`;
    const body = `
New safety assessment completed via TIGER VECTOR.

━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT
━━━━━━━━━━━━━━━━━━━━━━━━
Name:     ${data.name}
Email:    ${data.email}
Company:  ${data.company}
Phone:    ${data.phone || '—'}

━━━━━━━━━━━━━━━━━━━━━━━━
QUALIFIER
━━━━━━━━━━━━━━━━━━━━━━━━
Job Title:    ${data.job}
Sector:       ${data.sector}
Company Size: ${data.size}
Country:      ${data.country}
Language:     ${data.language}

━━━━━━━━━━━━━━━━━━━━━━━━
RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━
Score:          ${data.totalScore} / 100
Maturity Level: ${data.maturityLevel}

D1 Leadership:      ${data.d1}/5
D2 Just Culture:    ${data.d2}/5
D3 Reporting:       ${data.d3}/5
D4 Learning:        ${data.d4}/5
D5 Communication:   ${data.d5}/5
D6 Change Mgmt:     ${data.d6}/5
D7 Participation:   ${data.d7}/5
D8 Resources:       ${data.d8}/5
━━━━━━━━━━━━━━━━━━━━━━━━
Book session: https://calendly.com/wakeupwarriorleader/tigervector
    `.trim();

    GmailApp.sendEmail(NOTIFY_EMAIL, subject, body);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function — run manually from Apps Script to verify setup
function testSetup() {
  doPost({
    postData: {
      contents: JSON.stringify({
        name:'Test User', email:'test@test.com', company:'Test Co',
        phone:'+57 300 000 0000', job:'CEO / President',
        sector:'Scheduled Commercial', size:'101–250', country:'Colombia',
        d1:3, d2:2, d3:4, d4:3, d5:2, d6:3, d7:4, d8:2,
        totalScore:62, maturityLevel:'N3 — MANAGED',
        language:'en', timestamp: new Date().toISOString()
      })
    }
  });
  Logger.log('Test completed — check your sheet and email.');
}
