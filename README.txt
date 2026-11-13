GNC TERMINAL — LOCAL APP
========================

What it is
  GNC Terminal running on your own computer. It does not use Claude or claude.ai storage.
  A small program (server.mjs) fetches market data itself and the app opens in your browser
  at http://localhost:8765. Everything is stored in data/store.json in this folder.

What is new in orangegoat v2.0 Deluxe (internal version 5.0, November 13, 2026)
  - Funds are no longer shares only. A fund can hold BIST shares, US shares, TEFAS funds, gram gold (GAUTRY, derived
    from COMEX gold × USD/TRY), TRY and USD cash, TRY / USD time and demand deposits (rate, maturity, withholding tax)
    and VİOP futures (long or short). Fund sheet › "Cash, currency and deposits": Add money, Convert TRY ↔ USD,
    Open deposit, Take money out, Close deposit. Matured time deposits are credited automatically with their interest.
  - Back-dated funds: Packages › "New fund (any date)" and "Add trades (manual, any date)" — enter past trades with
    their real date, quantity, price, commission and BSMV. The fund is valued day by day from its start date
    ("Fund value since the start"). Every entry is in the transaction ledger (with commission and BSMV) and can be undone.
  - Simulation on any fund: bands for the end of the hold period (or 3 months – 2 years), the chance of beating the
    deposit, expected prices per holding, and more profitable alternatives with their risk. Bootstrap of the holdings'
    own history, or Monte Carlo when the fund holds futures or holdings with short history.
  - Stress test: TRY −20% against USD, BIST −15%, TRY rates +5 points. Comparison of the whole fund with a TRY deposit,
    money-market fund, BIST 100, USD deposit, USD cash, gram gold and inflation.
  - VİOP tab (Markets): every open futures contract from Borsa İstanbul's end-of-day files (settlement price, open
    interest, contract size), estimated initial margin (enter your broker's figure; Takasbank's file cannot be
    downloaded automatically), leverage, one-day 99% loss, chance of a margin call before expiry, expected price at
    expiry. Add a contract to a fund; margin and expiry warnings in the Inbox; expired positions close automatically.
  - Low-turnover BIST shares are no longer excluded: they carry a "low liq." mark (below 50 m TRY a day).
  - Reports: a plain-language sentence under each heading, a glossary of the terms used at the end of every report,
    new fund sections (whole fund, cash and deposits, futures, comparison, stress test, simulation, ledger), and no
    app name in the reports. Glossary page: Today › Glossary. Turkish interface (Settings › Language) is used for the
    new texts and the glossary.
  - Sources: data/ is unchanged; new store documents viop/contracts and viop/settles. Developers: engine.js,
    reports.js, deluxe.js and ui-deluxe.js are embedded in public/index.html by  node tools/build-page.mjs

What is new in 4.0 "orange goat" (November 3, 2026)
  - Speed: the server scores every instrument and sends the page a slim view; only the visible tab renders;
    price histories load on demand. No more freezes on refresh. Settings > Data health > Page performance.
  - Goat icon: "GNC Terminal.exe" (the goat) is the app: one click starts the hidden server and opens the
    app window; the first start offers the desktop and Start menu icon. Optional background start with Windows.
  - Packages > "Add fund from external investment report": drop or pick a broker confirmation (Ak Yatırım
    İşlem Sonuç Formu, Midas, generic PDF/CSV); a fund is created with the normal ID and stays editable.
    Duplicates are refused, sells reduce positions, matching open orders are filled. ID/tax numbers are
    never stored and the account number is masked.
  - Funds can be merged, split and deleted.
  - Wizard: starts with the target; "Beat the deposit" proposes BIST and US lines that lift expected return
    above the deposit; risk budget, swaps, earnings-date warnings, hedge sleeve, staged entry (Faber rule).
  - Forecast: deposit-rate path, survey FX, bootstrap fan ("70% chance" bands), EWMA volatility,
    horizon-dependent weights, a forecast ledger with calibration.
  - Backup and restore, one-click update from a zip, safe mode, LAN access with a PIN, Telegram and weekly
    e-mail reports, KAP corporate actions and disclosures, tax summary, fund X-ray, attribution,
    "since yesterday's close" digest, journal reminders, data pack export/import.

What is new in 3.1 (November 2, 2026)
  - Wider US universe: S&P MidCap 400 and every US-listed stock above USD 5 bn market cap join the
    S&P 500 and Nasdaq-100 (switch in Settings > Universe; the list refreshes monthly). Extra symbols
    (Settings > Universe) still take any Yahoo ticker by hand.
  - Orders is a blotter: open orders show quantity and price fields; "Filled" records the trade, opens the
    position and says so; filled and skipped orders stay in the Filled / Skipped / All views, a buy fill
    can be corrected, and every action can be undone from the toast.
  - Funds can be edited after creation (name, reason, hold period, lines and amounts; after ordering the
    bought part is protected and pending tranches rescale) and deleted in any state — when lines were
    bought you choose between dropping the positions or keeping them as plain holdings. Both undoable.
  - Every fund has an ID (GNC-F26-003-M-7: year, running number, class T/U/M, check digit) shown on
    the fund page and on reports.
  - Fund report redesigned: cover in the house layout (seal space, "Prepared for" the account holder
    name from Settings > Profile), "The fund at a glance", industry and market distribution exhibits,
    horizon timeline, "Why this fund", "Exit plan — when and why", readable holdings schedule, risk
    factors, appendices.

What is new in 3.0 (November 2, 2026)
  - Point-in-time fundamentals: SEC EDGAR XBRL for US stocks, İş Yatırım / KAP statements for BIST stocks,
    stored with their filing dates; ten-year daily history per instrument; index membership history;
    TCMB expectations survey (12-month USD/TRY and policy-rate expectations) for the carry comparison.
    See "Fundamentals and history (point-in-time)" below.
  - Today board: key figures, inbox in three tiers (act now / today / for information), "since you last
    looked" (what entered or left the eligible set, big moves in your positions, source trouble, new
    regulator items), reports due in the next 14 days, regulator headlines, data-source status, and a
    getting-started checklist on first runs.
  - Chart drawer on every security page: candles or line, 50- and 200-day lines, target / stop / trailing
    stop / entry levels, shading below the 200-day line (Faber filter), volume, split and report markers;
    range buttons, drag to zoom, double-click to reset.
  - Factor profile (radar) against the universe median; Fundamentals panel with the point-in-time figures.
  - Markets › Compare: pin two to four instruments (button on the security page or "CMP THYAO GARAN"),
    rebased price chart, radars and a side-by-side table.
  - Fund wizard: step rail with a live summary, allocation donut (lines / sectors / exchange), the same
    money in a TRY deposit, a USD deposit and the fund, and a fan chart with the probability of beating
    the deposit (lognormal, the fund's own volatility).
  - Lighthouse timeline view (last 45 days, one lane per category); Settings › Data health shows a
    30-day grid per source, service levels, coverage and backfill progress.
  - Reports (PDF and Word) in an institutional research style: cover page with document number and
    legend, Roman-numeral sections, numbered paragraphs, leader-dot tables, exhibits, page x of y.
  - Modes (Settings › Appearance): Terminal (dense), Analyst (default), Comfortable, Reader (large type).
  - Command line: type ? in the symbol box for the list (views, FUND 2, CMP, REFRESH, FULL, REPORT,
    TR / EN, looks and modes, PRINT). Undo after deleting a fund or converting it to orders.
  - Screener: column picker (remembered), eligibility shown as a coloured edge on each row, explanations
    on hover over column headings; gate reasons now state the threshold ("turnover 31 m TRY — below the
    50 m gate"). Settings mark advisor and gate parameters that differ from the research defaults, with
    reset buttons. Print styles for every tab (Ctrl+P).

NOTE (launcher 1.3, November 6, 2026): "GNC Terminal.exe" is no longer part of this package. Antivirus programs
blocked it on Windows 11. Start the app with the "GNC Terminal" icon made by "GNC Terminal - setup.bat" (below).
The icon runs node.exe with launcher\gnc.mjs; no PowerShell, VBScript, conhost or registry changes are used.

Start without the .exe (recommended when Windows blocks "GNC Terminal.exe")
  - Double-click "GNC Terminal - setup.bat" once. It makes the "GNC Terminal" goat icon on the desktop, in the
    Start menu and in this folder, asks whether to start hidden with Windows, then starts the app.
  - The icon runs node.exe (signed by the Node.js project); its small window is minimized and closes at once:
    launcher\gnc.mjs starts a hidden keeper that runs server.mjs (restart after a crash, clean stop), waits
    until http://localhost:8765 answers and opens the Edge app window. A second click only opens the window.
  - If something fails, a report opens in Notepad (stays open until you close it):
    %LOCALAPPDATA%\GNC Terminal\GNC-Terminal-report.txt; the log is launcher.log in the same folder.
  - Stop: "Stop GNC Terminal.bat" (saves your data first). Report about the PC: "Diagnose GNC Terminal.bat".
  - Visible mode (if security software stops the hidden start): node launcher\gnc.mjs --setup --visible
    The icon then runs the server in its own window, minimized on the taskbar (as version 3.1 did); no hidden
    processes are used. Closing that window stops GNC Terminal after saving. Back to hidden: --setup without --visible.
  - Without .bat files, in a PowerShell window:  node "<this folder>\launcher\gnc.mjs" --setup --autostart-on
    (--autostart-off for no autostart; other modes: --stop, --diagnose, --background).

Install, desktop icon and starting
  Windows (10 or 11):
  1. Right-click GNC-Terminal-App.zip > "Extract All..." and choose a permanent place, e.g. Documents.
     (Do not start anything while you are only looking inside the zip.)
  2. Open the extracted "GNC Terminal" folder and double-click "GNC Terminal" - the file with the goat icon.
     The first time, Windows may show "Windows protected your PC": click "More info", then "Run anyway".
  3. If Node.js (the free program the app runs on) is missing, it offers to install it (Yes) or opens the
     download page (No). After installing from the page, double-click the goat again.
  4. The first start asks two questions: a goat icon on the desktop and in the Start menu (Yes recommended), and
     whether GNC Terminal should start hidden when you sign in to Windows (Yes recommended: the 15-minute
     updates then run all day). The app then opens in its own Edge window (Chrome if Edge is missing,
     otherwise the default browser). No black window appears.
  5. Taskbar: right-click the goat icon > (Windows 11: "Show more options") > "Pin to taskbar".
  6. Stop: "Stop GNC Terminal.bat" (or: GNC Terminal.exe --stop). To ask the two questions again, e.g. after
     moving the folder, delete %LOCALAPPDATA%\GNC Terminal\launcher_setup.json and double-click the goat.
  7. Troubleshooting: every start writes %LOCALAPPDATA%\GNC Terminal\launcher.log (paste that path into the Explorer
     address bar) and the server writes data\console.log; problems are
     shown in a message box, never in a window that disappears. "Troubleshooting - start with messages.bat"
     starts the server in a visible window with all messages (it stops a hidden copy first).
  Mac: double-click "Start GNC Terminal (Mac).command" (first time: right-click > Open). Keep its window open.
     Optional goat icon: open public/icon.png in Preview, press Cmd+A and Cmd+C, select the .command file,
     press Cmd+I and click the small icon at the top left of the info window, then press Cmd+V.

Universe
  - US: S&P 500 + Nasdaq-100 (about 520 names) plus the extended US list: the S&P MidCap 400 and every
    US-listed common stock or ADR on NYSE, Nasdaq and NYSE American with a market cap of at least USD 5 bn
    (config.json "usMinMcap", default 5000000000). The seed is universe/us_ext.txt (about 750 symbols:
    S&P 400, large ADRs such as TSM, BABA, SAP, NVO, recent IPOs such as CRCL, FIG, KLAR, midstream LPs,
    Canadian cross-listings). Extended names carry ext: true in their instrument record; a name that is
    already in the main US list is never duplicated.
  - BIST: every BIST share (BIST 100 and all others), BIST BYFs and about 40 TEFAS funds (hisse yoğun,
    money-market and other funds by size). US ETFs and gold are not included. Altogether roughly 1,800
    instruments (about 1,100 with the extended US list switched off).
  - Switches: Settings > Universe — "US" (uniUS), "Extended US list" (uniUSExt, on by default), BIST 100,
    other BIST shares, BYFs, TEFAS. Switching a group off removes its instruments unless you hold them (a
    position, package line or basket line keeps the instrument).
  - Monthly refresh (1st of the month at "universeAt", or the button): S&P 500 from the datasets csv,
    Nasdaq-100 and S&P MidCap 400 from Wikipedia, the extended list from the Nasdaq stock screener (three
    calls: NASDAQ, NYSE, AMEX; rows with market cap >= usMinMcap; warrants, units, rights, preferreds,
    notes, ETFs and fund/trust shares are dropped; LP common units stay). Extended list = S&P 400 + screener
    minus the S&P 500 / Nasdaq-100 names. A source that fails keeps its current list and is named in the
    universe note ("partly refreshed; failed: ..."); the static seed is always part of the list, so a name
    that falls below USD 5 bn stays until it stops trading.
  - Dead symbols: an extended or Extra symbol that still has no price and a fetch error more than 7 days
    after it was added (delisted, acquired, mistyped) is removed and noted in refresh.log ("dead symbol
    removed"); held symbols are never removed. Removed symbols are remembered until the next monthly
    refresh, which gives them one more try. For a mistyped Extra symbol, remove it from the field.
  - One instrument record per symbol: an extended US name that spells like a BIST share or TEFAS fund code
    (MAC = Macerich vs the Marmara Capital fund) is left out of the US list; the fund wins.
  - Refresh time: the extended list roughly adds 750 US names, so the nightly full history run takes
    about 60-70% longer (about 1,800 instruments at 4 downloads at a time), the 15-minute quote batches a
    few seconds more, and the company-profile and EDGAR slices need more nights to cover everyone. The
    first full history after switching the list on or off is the slow one.
  - Eligibility gate (Settings): picks, the fund wizard and the Improve/Mix steps only use instruments with
    enough turnover (BIST 50m TRY, US 20m USD per day), a price not older than 2 trading days, 120+ daily
    closes, no outliers and no watch-market flag. Everything else stays in the Screener, greyed out.
  - Extra symbols: Settings > Universe > "Extra symbols" takes any Yahoo Finance ticker outside the index lists
    (US as is, e.g. SOUN; BIST with .IS, e.g. TUPRS.IS). They are fetched at once (price and one year of history),
    scored and gated like the rest, and kept until you remove them from the field.

Data and timing
  - Every 15 minutes, weekdays 09:55–23:15 Istanbul time: batch quotes (price, P/E, P/B, dividend, market
    cap, volume) for all instruments from Yahoo Finance; BIST about 15 minutes delayed, US near real-time.
    Every price shows its source and fetch time (Screener "As of" column, security page, footer).
  - 00:30 nightly: full 1-year OHLCV history for every instrument, company profiles (sector, ROE, margins)
    for up to 150 instruments per night, integrity checks and picks when due (also at start-up when the
    history is missing or older than 20 hours). The bar under the header shows progress and the estimated
    finish time. The first start takes 10–20 minutes.
  - Failed symbols are retried 10 minutes later; a source that fails twice in a row raises an Inbox warning.
    Settings > Data health shows every source's last success and failure.
  - TEFAS funds (TIE, DZE, AKU, YEF, GAE, MMH, BDS): daily price from tefas.gov.tr.
    If TEFAS refuses the request, the fund stays on the BIST 100 proxy (~).
  - Picks (weekly / 21-day / 30-day) are issued automatically after a full run when due.
  - The Refresh button starts a quick (about 1 minute) or full (about 3–5 minutes) update now.
  - 10:15 and 16:45 daily (and at start-up if older than 12 hours): TCMB EVDS macro data -
    TRY deposit rate (up to 1 month), USD deposit rate, CPI, 12-month inflation expectation, policy rate
    and USD/TRY history. It needs "evdsKey" in config.json (already filled in). The deposit rate feeds the
    "vs TRY deposit" benchmark everywhere; tick "set by hand" in Settings > Currency and benchmark to stop
    the automatic update. If EVDS fails, the Inbox says why and the last values are kept.
  - Policy rate, CPI and the inflation expectation can also be edited in Settings > Turkiye macro inputs.
  - Change the timing in config.json (restart the app after editing).

IPOs and regulators
  - Markets > IPO tracker: BIST IPOs from halkarz.com (08:30 and 20:30) with offer price, book-building dates,
    broker, size and performance since listing; US IPOs from the Nasdaq calendar.
  - Markets > Lighthouse: SPK bulletins (PDF, read as text when possible), press releases and announcements
    plus SEC press releases, every 6 hours, with extractive outtakes; items that mention a position of yours
    raise an Inbox note.
  - The header shows whether BIST and the US market are open, with Istanbul and New York time.
  - Settings > Language switches the interface to Turkish.

Fundamentals and history (point-in-time)
  Beside store.json the app keeps a second, larger data layer (schema version 2) that the Lab and the security
  pages can use for point-in-time work. Nothing here needs an API key.
  - data/series/<SYMBOL>.json: ten years of daily bars per instrument (date, close, high, low, volume, splits),
    from Yahoo Finance. After each nightly full refresh the fresh one-year bars are merged in, so the files stay
    current without downloading ten years again. "/" in a symbol becomes "_" (USD_TRY.json).
  - data/facts.ndjson: fundamentals as append-only rows (symbol, metric, period end, filing date, value, unit,
    form, source). Metrics: rev, ni, eq, assets, eps, opinc, cfo, dps, shares (US also curAssets, curLiab).
    A value is only ever read "as known on a date" (filing date <= date), which is what makes backtests honest.
    Rows are kept once per period and filing; a restated figure is stored as a second row with its own filing date.
  - US stocks: SEC EDGAR XBRL (company facts + submissions, about 1-3 MB per company, downloaded one company at a
    time, at most 8 requests a second, with the User-Agent in config.json "edgarUserAgent" - put your own
    contact there, the SEC asks for it). 10-K and 10-Q facts, quarterly and annual; the fourth quarter is derived
    as fiscal year minus the three reported quarters. Filing dates are real.
  - BIST stocks: Is Yatirim financial statements (MaliTablo, group XI_29 for companies, UFRS for banks and
    insurers), the last 12 quarters. Statements are cumulative year-to-date and are differenced into single
    quarters. The service does not say when a statement was filed, so the filing date is ESTIMATED as period end
    + 45 days (Q1-Q3) or + 70 days (Q4), the KAP deadlines; such rows and the summary carry est: true. Values
    are taken as full TRY; when total assets are implausibly small against the market cap the statement is read
    as thousands (fund.scaled = true). Restated BIST figures are not detected (same estimated filing date).
  - Each stock gets a compact summary (fund): source, period end, filing date, revenue / net income / EPS /
    operating cash flow over the trailing twelve months (sum of the last four quarters; basis "FY" when fewer
    quarters are known), equity, assets, ROE, net margin, revenue growth (TTM vs the prior TTM) and book value per
    share. Yahoo's P/E and P/B stay as they are and remain the fallback when a source has no data.
  - Expected report dates (Today > calendar, doc calendar/reports) are estimates: US = last 10-Q/10-K filing
    + 91 days (+ 365 days for companies without 10-Qs); BIST = next period end + the KAP deadline above.
  - Index membership (data/membership.ndjson, membership/summary): S&P 500 and Nasdaq-100 changes are parsed
    from Wikipedia (best effort); BIST 30/50/100 membership is recorded as a snapshot on every constituent refresh
    and at start-up, and changes are written as added/removed events from then on. Borsa Istanbul's quarterly
    KAP announcements are not read, so BIST history starts the day the app first ran.
  - Data quality: after every refresh each instrument is checked for duplicate dates, gaps against the market
    calendar (more than 3 missing trading days in the last 60), zero-volume streaks, stale fundamentals (period
    end older than two quarters) and unit problems; flags appear as dq on the instrument and as counts in
    Settings > Data health. On full runs the last 5 closes of 40 BIST names (rotating) are compared with
    Is Yatirim's daily prices; a difference above 1% marks the stock "unverified" until the next check agrees.
  - Data health 2.0 (status/health): per source last success/failure, rows, a service level in hours
    (config.json "sla"; Yahoo quotes 1 h in market hours, else 24 h; history/TEFAS 30 h; EVDS 48 h; EDGAR and
    Is Yatirim 72 h; membership 45 days; Lighthouse 8 h; IPO 14 h; broker research 10 h) and a 30-day ok /
    partial / fail calendar per source. A breached service level raises one Inbox warning per source per day.
    Coverage shows the share of US and BIST stocks with fundamentals, of instruments with 10-year history, and
    of indices with a membership snapshot.
  - Backfill (status/backfill): runs nightly at "backfillAt" (01:30) until complete, and resumes three minutes
    after start-up when it is not complete ("backfillOnStart": false switches that off). Phases: prices10y
    (ten-year history, 4 downloads at a time, 250 ms apart; about 1,800 instruments, 15-30 minutes), edgar (all
    ~1,200 US companies in slices of "edgarPerRun" = 120, roughly 3-6 minutes a slice), isy (all ~550 BIST
    companies in slices of "isyPerRun" = 150, 3 calls each), membership. It never runs during a full refresh
    (it waits) and it picks up where it stopped after a restart. The nightly full refresh also runs one EDGAR
    and one Is Yatirim slice (progress phases "SEC EDGAR" and "Is Yatirim financials"), so fundamentals keep up
    even if the backfill is switched off. Fully loaded, facts.ndjson is a few hundred thousand rows (tens of MB)
    and the series folder about 150-250 MB.
  - Raw responses: the last response per source and day is kept in data/raw/<source>/ (5 files per source).
  - Endpoints (also for your own scripts): GET /api/series/THYAO (the series file), GET /api/facts/AAPL
    ({ symbol, facts }), GET /api/membership?index=XU100&date=2024-06-30 ({ index, date, symbols }),
    POST /api/backfill with { "action": "start" | "stop", "phase": "prices10y" | "edgar" | "isy" | "membership" }
    (phase optional), POST /api/edgar and POST /api/isy to run one slice now, POST /api/membership.
  - Known limits: Yahoo has no history for US companies that were delisted (taken over, bankrupt), so the
    ten-year US universe is the survivors only - the Lab warns about survivorship for US tests before the first
    snapshot. Is Yatirim labels differ between companies; a stock whose statement could not be mapped shows
    fundErr on its doc and keeps Yahoo's ratios. EDGAR has no data for foreign private issuers (20-F filers).

Broker research
  - The app reads every broker's published target price and rating for the BIST stocks in the universe
    (from hedeffiyat.com.tr, which lists İş, Garanti BBVA, Ak, Deniz, QNB, Ziraat, Halk, Gedik and others),
    plus the İş Yatırım research feed, at 09:30, 13:30 and 19:30 on weekdays and at start-up.
    Coverage grows as the app learns each stock's page address; Settings > Data shows how many are covered.
  - Today > IPOs and regulators
  - Markets > IPO tracker: BIST IPOs from halkarz.com (08:30 and 20:30) with offer price, book-building dates,
    broker, size and performance since listing; US IPOs from the Nasdaq calendar.
  - Markets > Lighthouse: SPK bulletins (PDF, read as text when possible), press releases and announcements
    plus SEC press releases, every 6 hours, with extractive outtakes; items that mention a position of yours
    raise an Inbox note.
  - The header shows whether BIST and the US market are open, with Istanbul and New York time.
  - Settings > Language switches the interface to Turkish.

Broker research: proposed actions (candidates where brokers and the app agree, warnings on what
    you hold, disagreements), the latest target and rating notes, and the weekly takeaways.
  - Weekly takeaways: every Sunday evening Claude sends you a digest (.json, PDF and Word). Save the .json
    into the "digests" folder of this app (or use Reports > Import weekly takeaways) and it appears on Today.
  - Reports > Broker digest: consolidated PDF/Word for any period.

Files
  server.mjs        the data engine and local web server
  engine.js         scoring, spans, packages and report logic (same as the claude.ai version)
  public/           the app page and the PDF/Word libraries
  data/store.json   all your data (portfolio, packages, settings, prices)
  data/backups/     a copy of store.json for each of the last 30 days (automatic)
  research.mjs      the broker research collector
  digests/          drop the weekly takeaways .json files here
  data/refresh.log  a line per update, with any symbols that failed
  store2.mjs        series files, facts.ndjson, membership.ndjson, raw responses (schema version 2)
  edgar.mjs / isyatirim.mjs / fundamentals.mjs   SEC EDGAR and Is Yatirim fundamentals, TTM summaries
  membership.mjs    index membership snapshots and history
  universe.mjs      the instrument universe (static seeds universe/us.txt, us_ext.txt, bist.txt; monthly refresh)
  validate.mjs      data-quality flags and BIST price reconciliation
  health.mjs        Data health 2.0 (service levels, daily calendar, coverage)
  backfill.mjs      the nightly backfill job
  data/series/      ten-year daily history, one file per instrument
  data/facts.ndjson, data/membership.ndjson, data/raw/   fundamentals rows, membership events, raw responses

If something does not work
  - "Not found" in the browser: an older GNC Terminal is still running from a folder you replaced or moved
    (for example started automatically with Windows). The goat (GNC Terminal.exe) now stops such a
    copy before starting.
  - Always start from the folder that contains server.mjs AND the public folder (the zip unpacks as an inner
    "GNC Terminal" folder). Do not unzip over a running copy; close it first.
  - Look at data/refresh.log: each update writes one line, with the first error if a source failed.
  - "fetch failed / ENOTFOUND" means no internet; "ECONNRESET" or "CERT" usually means a firewall,
    antivirus or company network is blocking Node.js.
  - To start over, close the app and delete data/store.json (your backups stay in data/backups).

Notes
  - Sources are free public endpoints used for personal viewing; they can change or rate-limit
    without notice. If an update fails, the app keeps the last prices and shows it in the Inbox.
  - Scores, spans, targets, picks and packages come from fixed rules; they are not investment
    advice within the meaning of Capital Markets Law No. 6362.

Taxes, corporate actions, X-ray and attribution
-----------------------------------------------
  Corporate actions (Portfolio › Positions › Corporate actions)
  - After every nightly full refresh the app asks Yahoo for the dividends and splits of the symbols
    you hold (last two years) and keeps them in corporate/main. Bedelli (rights) and bedelsiz (bonus)
    issues, splits and dividends can also be entered by hand: ratio 150% = 1.5 new shares per share,
    2:1 = two shares for one, rights at the subscription price (assumed exercised).
  - After the ex-date your lines are SHOWN adjusted (quantity, cost, value; an "adj." tag) without
    touching your records; "Apply to records" writes the new quantity and cost and logs it in the
    Journal. Dividends are booked in the Journal as income, net of the BIST stopaj (Settings, 15%)
    or 20% US withholding, and listed under Performance.
  KAP disclosures (Markets › Lighthouse › KAP)
  - Every 2 hours (08:00–23:30) the app reads KAP disclosures for the BIST symbols you hold, have in
    funds or in the basket (JSON query first, RSS feed second). If KAP cannot be reached nothing
    breaks: the source shows as "KAP" in Settings › Data health and the last items stay. KAP items
    come on top of the SPK / SEC regulator feed and have their own lane in the timeline.
  Lab (Lab)
  - With the app, a run uses the full stored history (up to ~10 years) on the computer, in a
    background thread, with a progress bar; choose the universe (all BIST shares, BIST 100, BIST 30,
    your symbols). The demo page still runs on the one year it carries.
  Tax summary (Portfolio › Tax)
  - For a chosen year: BIST shares and BYFs (0% stopaj), TEFAS funds by stopaj class and days held,
    US shares in TRY (cost at the purchase-date USD/TRY, proceeds at the sale-date rate, cost indexed
    by ÜFE — month before sale ÷ month before purchase — only when ÜFE rose 10% or more), dividends
    received and tax withheld. Enter the year's declaration limit to compare foreign gains and
    dividends against it. "Export CSV" saves the schedule; the Statement report gets a "Tax summary"
    section. ÜFE comes from the macro series when present, otherwise the ÜFE setting (% a year).
    It is an estimate from your records, not tax advice.
  Fund X-ray (Plan › Packages › X-ray)
  - Overlap between funds (shared symbols and the sum of the smaller weights), exposure by sector,
    exchange and currency across all funds and direct positions, the largest concentrations and
    warnings above your caps (single stock, sector, single fund).
  Attribution (Portfolio › Performance)
  - Monthly Brinson attribution for the whole portfolio or one fund against BIST 100 (TRY lines) and
    the S&P 500 in TRY (USD lines): allocation, selection and currency effects that add up to the
    active return each month; months are linked so the totals add up as well.
  Today
  - "Since yesterday's close": price, score, gate and signal changes of your symbols against the
    snapshot the app stores at 23:20 Istanbul every weekday (snapshots/<date>, five days kept).
  - "Decision check": fund lines whose exit is 7 days away or less ask whether the buying reason
    still holds (Still holds / Changed + a note); answers go to the Journal.
  Endpoints: GET/POST /api/corporate, POST /api/kap, POST /api/lab + GET /api/lab/<id>,
  GET /api/digest/yesterday, POST /api/digest/snapshot. Settings in config.json (optional):
  kapEveryHours (2), snapshotAt ("23:20").

Importing broker reports, merging and splitting funds
-----------------------------------------------------
  Add fund from external investment report (Plan › Packages, button at the top)
  - Drop the broker confirmation (PDF) or a Midas export (CSV) on the dialog, or choose files
    (several at once, up to 15 MB each). The file is read by this app on your computer; nothing is
    sent anywhere. Recognised: Ak Yatırım "İşlem Sonuç Formu", Midas CSV (Tarih, Sembol, İşlem, Adet,
    Fiyat, Tutar, Komisyon — English headers work too), Midas PDF statements (best effort) and other
    broker PDFs with ALIŞ/SATIŞ (BUY/SELL) rows. Turkish numbers are read correctly ("1.232,10",
    "80,000" = 80 shares); every quantity is checked against amount ÷ price.
  - The preview lets you untick rows, correct quantity, price, commission and unknown tickers;
    same-symbol buys become one fund line at the weighted average price. Then: Create new fund
    (fills with the trade date, amount including commission, 6-month hold by default, exit plans as
    for any fund), Add to an existing fund, or Fill open orders (matches open buy orders of the same
    symbol). Sales close or reduce the matching fund line or position. Everything is journaled and
    can be undone from the toast. A document that was imported before is flagged (document number or
    the same trades) and its rows start unticked.
  - Privacy: national ID / tax numbers are never stored; the account number is kept masked (***9313).
  - Watched folder (optional): set "importsWatch": true in config.json and put PDFs/CSVs into the
    imports folder next to server.mjs. Every 30 seconds new files are read, an Inbox message says how
    many trades were found, and the files move to imports\done. Confirm them in the same dialog.
  Merge and split
  - Packages › Select, tick two or more funds, Merge: lines with the same symbol are combined, tranches
    renumbered, a new fund ID is given and the oldest fund's name is kept unless you rename it.
  - In a fund page, Manage › Split…: the ticked lines move to a new fund with its own fund ID and the
    same dates and hold period. Both can be undone from the toast.
  Endpoints: POST /api/import/parse, GET/POST /api/import/log, GET /api/import/pending,
  POST /api/import/pending/clear, POST /api/import/scan. Log of imported documents: data\imports_log.json.

Backup, update, remote access and notifications
-----------------------------------------------
  Everything below is in Settings › System (only in the local app).
  Backup and restore
  - "Download backup" saves GNC-backup-<date>.json: settings, funds, positions, basket, journal,
    watchlist and alarms, orders, which Inbox messages you have read, picks and the picks log, macro
    inputs. "Download full backup" also holds every instrument record and status document (large).
  - Restore from file: Merge adds what is missing and keeps what is here (item lists such as funds or
    journal entries are united); Replace makes the backup win and removes user data that is not in it.
    Before either, a copy of the whole store is written to data\backups\pre-restore-<time>.json, so a
    restore can itself be undone by restoring that file.
  - The app still keeps its own daily copy of data\store.json (data\backups\store-<date>.json, 14 days).
  Data pack (moving the ten-year history to another computer)
  - "Export data pack" downloads GNC-datapack-<date>.zip with data\series, facts.ndjson and
    membership.ndjson. On the other computer, "Import data pack" (up to 500 MB) merges it: missing
    bars are added to each series file and fundamentals / index-membership rows are deduplicated, so
    the backfill there does not have to download ten years again.
  Update
  - Choose the new GNC-Terminal-App.zip and press "Install update". The app checks that the ZIP holds
    server.mjs and public\index.html, reads the new version, unpacks it into update_staging, copies
    every program file and never touches the data folder; config.json keeps your values and only gains
    new settings. The files that were replaced are kept in data\rollback\<old version>\ (ROLLBACK.txt
    there says how to go back). The app then restarts by itself (a new window may open on Windows) and
    the page reloads when the new version answers. If it does not come back, start it as usual.
  - Optional: "updateUrl" in config.json (or the field in the panel) pointing at a small JSON file
    { "version": "...", "url": "..." }. It is checked once a day; a newer version only raises an Inbox
    message. Nothing is ever installed automatically.
  Remote access (phone or tablet on the same Wi-Fi)
  - Tick "Allow access from the local network", set a PIN (4+ characters), Save, then "Restart now".
    The panel shows the address (e.g. http://192.168.1.23:8765/) in large type and as a QR code. The
    other device signs in once with the PIN; the session lasts 30 days ("Sign out all devices" ends
    them). Five wrong PINs lock sign-in for 10 minutes. Windows Firewall may ask once whether Node.js
    may accept connections on private networks: allow it.
  - Updates, restores, data-pack imports, restarts and these System settings only work on this
    computer itself (http://localhost), never from another device. Off by default; switching off and
    restarting makes the app answer this computer only again.
  Notifications
  - Telegram: create a bot with @BotFather, paste its token, send the bot any message, and enter your
    chat id (for example from @userinfobot). E-mail: SMTP server, port 465 with "TLS from the start"
    (Gmail: smtp.gmail.com, an app password), or port 587 without that tick (STARTTLS is used).
  - Inbox messages that are warnings or errors, and alarms, data-health, order and picks messages are
    forwarded to Telegram (at most 20 an hour, the same title once a day).
  - Every Sunday at 20:00 Istanbul time a weekly summary goes to Telegram and/or e-mail: portfolio
    value, the week's P/L, open orders, exits due in the next 7 days and data-source status, with the
    statement and up to four fund reports as PDF. "Send test" and "Send weekly summary now" try it.
  - Tokens and passwords are stored in config.json on this computer and shown only as •••• + last 4.
  Safe mode
  - If one part of the app fails to start (for example after a bad edit), it is switched off and
    listed under Modules, an Inbox warning says so, and everything else keeps running. If
    data\store.json itself cannot be read, the app starts from the newest data\backups\store-*.json,
    keeps the damaged file as store.damaged-<time>.json and says so in the Inbox.
  config.json keys: remote { enabled, pin }, telegram { token, chatId }, smtp { host, port, secure,
  user, pass, from, to }, notify { forward, weeklyTelegram, weeklyEmail, weeklyPdf }, updateUrl.
  Endpoints: GET /api/backup[?full=1], POST /api/restore, GET|POST /api/datapack, POST /api/update,
  GET /api/update/status, POST /api/update/check, POST /api/restart, GET /api/health/modules,
  GET /api/remote/info, POST /api/remote/sessions/clear, GET|PUT /api/config/platform,
  POST /api/notify/test {channel: telegram|email|weekly}, GET /api/notify/preview, GET|POST /remote-login.
