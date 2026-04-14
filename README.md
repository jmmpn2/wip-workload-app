# WIP Workload Version 2.7

This update makes six requested changes:
- tech detail page now shows all techs ranked against each other with Remaining Hours and Load %
- removed Remaining Mix KPI
- rounded all hours to the nearest whole hour throughout the app
- estimator is pulled from the real import position (column J fallback)
- WIP by Stage now shows each phase as its own stage, not grouped buckets
- added shop settings for load thresholds:
  - Needs Work under 125%
  - Overloaded over 250%

## Database
This version adds shop threshold settings and removes stage grouping from stage rules. Do a fresh reset.

## Local setup
```powershell
cd C:\path\to\wip_workload_v27_thresholds_phases
copy .env.example .env
npm install
npx prisma generate
npx prisma db push --force-reset
npm run db:seed
npm run dev
```


## v2.8 UI update
- added a Status pill column for Needs Work / Balanced / Overloaded
- added a Load % progress bar
- made the progress bar clickable so it opens the tech detail page


## v2.9 persistent job holds
- added persistent job holds keyed by RO number
- holds survive future uploads until released
- held jobs still appear on the technician page
- held jobs show 0 remaining hours and no longer count toward technician load
- optional hold reason can be saved, like back order


## v3.0 print and phase-order update
- technician jobs are sorted by the same phase order used on the dashboard
- hold buttons are hidden when printing the technician page
- printed technician pages still show ON HOLD status and hold reason


## v3.1 email report
- added dashboard buttons for Export Excel and Email Report
- added configurable email recipients in Settings
- email sends the latest workload workbook as an attachment
- email body includes dashboard totals plus top technicians who need work

## Email setup
Populate these values in `.env` or Railway variables:

```env
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER="your_microsoft_365_account"
SMTP_PASS="your_password_or_app_password"
SMTP_FROM="your_microsoft_365_account"
DEFAULT_REPORT_RECIPIENTS="optional-fallback@example.com"
```

Per-shop recipients can be set in Settings. Those override `DEFAULT_REPORT_RECIPIENTS`.


## Email report setup

The app now stores most email settings in **Settings > Email Delivery Settings**.

Keep only the SMTP password in your environment:

```env
SMTP_PASS="your-password-or-app-password"
```

For Gmail, save these values in the app:
- Provider: Gmail
- SMTP Host: smtp.gmail.com
- SMTP Port: 587
- Secure SSL: off
- SMTP Username: your Gmail address
- From Address: your Gmail address

For Microsoft 365 later, switch the provider to Microsoft 365 and use:
- SMTP Host: smtp.office365.com
- SMTP Port: 587
- Secure SSL: off


## Railway Gmail setup

For Railway, use the Gmail API instead of Gmail SMTP. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REFRESH_TOKEN` in Railway Variables, then choose `Gmail API` in the app settings.
