# Where the leads go

Every form on this site — the briefing modal on 23 pages and the page form on
`contact.html` — is wired by one sender in `site.js`. It has two delivery paths,
picked in this order:

1. **`SHEETS_ENDPOINT`** (what we use): a Google Apps Script `/exec` URL that
   appends the lead to a Google Sheet **and** emails team.marketing@lumiq.ai.
   Sent as a plain-text-body POST on purpose — Apps Script cannot answer a CORS
   preflight, and a JSON content type would trigger one.
2. **`LEAD_ENDPOINT`** (fallback, only while `SHEETS_ENDPOINT` is empty):
   FormSubmit.co ajax to the same address. Needs a one-time email activation.

Both constants live at the top of the lead-modal block in `site.js` and are kept
identical to litecone.ai.

## What the form sends

| Field | Where it comes from |
|---|---|
| `form_type` | the form's `data-form` — `briefing`, `briefing-page`, `brochure` |
| `page` | the page the form was submitted from |
| `cta` | the label of the button that opened the modal ("Book a briefing" vs "Request a demo") |
| `name` `email` `company` `role` `mobile` `sector` `timeframe` | the fields themselves |
| `coworkers` | ticked Worker boxes, joined — prefilled from a CTA's `data-coworker` |
| `brochure` | which PDF was taken, on the brochure form |
| `reason` `message` | free text, where a form has it |

`_hp` (honeypot) and `_ts` (render timestamp) are spam gates and are stripped
before sending — a filled honeypot or a sub-three-second fill is dropped
silently, with the success state still shown.

## The script (paste into Apps Script)

`COLUMNS` must list every field above, or the extra ones are silently dropped
from both the sheet and the email. This version also repairs the header row
in place, so adding a column later does not misalign existing rows.

```javascript
var TO = 'team.marketing@lumiq.ai';
var COLUMNS = ['timestamp','form_type','page','cta','name','email','company','role',
               'mobile','sector','timeframe','coworkers','brochure','reason','message'];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    d.timestamp = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');

    // 1) save to sheet, keeping the header row in step with COLUMNS
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Leads') || ss.insertSheet('Leads');
    var head = sh.getLastRow() === 0 ? [] : sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var missing = COLUMNS.filter(function (c) { return head.indexOf(c.toUpperCase()) === -1; });
    if (missing.length) {
      head = head.concat(missing.map(function (c) { return c.toUpperCase(); }));
      sh.getRange(1, 1, 1, head.length).setValues([head]);
      sh.setFrozenRows(1);
    }
    sh.appendRow(head.map(function (h) { return d[String(h).toLowerCase()] || ''; }));

    // 2) forward by email
    var rows = COLUMNS.filter(function (c) { return d[c]; }).map(function (c) {
      return '<tr><td style="padding:6px 12px;border:1px solid #ddd;text-transform:capitalize"><b>'
        + c.replace('_', ' ') + '</b></td><td style="padding:6px 12px;border:1px solid #ddd">'
        + d[c] + '</td></tr>';
    }).join('');
    MailApp.sendEmail({
      to: TO,
      replyTo: d.email || TO,
      subject: 'LiteCone lead · ' + (d.form_type || 'form')
        + (d.name ? ' · ' + d.name : '') + (d.company ? ' — ' + d.company : ''),
      htmlBody: '<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">'
        + rows + '</table>'
    });

    return ContentService.createTextOutput(JSON.stringify({success:true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success:false, error:String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Lets you verify the deployment is public: open the /exec URL in an incognito
// window and you should see {"ok":true}. A Google sign-in page means the
// "Who has access" setting is wrong.
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ok:true}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Deploying it

Deploy → New deployment → **Web app**, "Execute as" **Me**, "Who has access"
**Anyone**. Take the `/exec` URL. Every code change needs a *new version* of the
deployment, not just a save — an old version keeps serving the old script.

If a lead never arrives, open the `/exec` URL in an incognito window. `{"ok":true}`
means the deployment is public and the problem is elsewhere; a Google sign-in
page means "Who has access" is still restricted, and the browser sees a redirect
with no CORS header, so every submit fails.
