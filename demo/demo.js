// Openroom demo: the room and the admin side, running entirely in the browser.
// All data comes from data.js and lives in memory: reload and it is back to the start.
// Nothing is sent anywhere. Uses the real app.css, so it looks like the product.
(() => {
  "use strict";
  const D = window.DEMO;
  const DAY = 86400000;
  const T0 = Date.now();

  // ---------- Tiny template helper: values are escaped unless they are raw html ----------
  class Raw { constructor(s) { this.s = s; } }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const part = (v) => (v instanceof Raw ? v.s : Array.isArray(v) ? v.map(part).join("") : v == null || v === false ? "" : esc(v));
  const h = (s, ...v) => new Raw(s.reduce((o, str, i) => o + str + (i < v.length ? part(v[i]) : ""), ""));

  // ---------- State ----------
  const S = { role: null, folders: [], investors: [], requests: [], events: [] };
  let seq = 100;
  const uid = (p) => `${p}${++seq}`;
  function reset() {
    S.role = null;
    S.folders = D.folders.map((f) => ({ ...f, subs: f.subs.map((s) => ({ ...s, files: s.files.map((x) => ({ ...x, updated: T0 - x.age * DAY })) })) }));
    S.investors = D.investors.map((i) => ({ ...i, lastSeen: T0 - i.ago * DAY, endsAt: i.ends == null ? null : T0 + i.ends * DAY, folders: [...i.folders] }));
    S.requests = D.requests.map((r) => ({ ...r, at: T0 - r.hoursAgo * 3600000 }));
    S.events = [];
    for (const [who, fid, hrs, country] of D.activity) {
      const inv = S.investors.find((i) => i.id === who), f = fileInfo(fid);
      if (!inv || !f) continue;
      const at = T0 - hrs * 3600000;
      S.events.push({ at: at - 60000, email: inv.email, action: "sign_in" });
      S.events.push({ at, email: inv.email, action: hrs % 11 === 0 && f.file.download ? "download" : "view", fileId: fid, fileName: f.file.name, folderName: f.sub.name, country });
    }
  }
  function fileInfo(id) {
    for (const top of S.folders) for (const sub of top.subs) for (const file of sub.files) if (file.id === id) return { top, sub, file };
    return null;
  }
  const investor = (id) => S.investors.find((i) => i.id === id);
  const stats = (fid) => {
    const ev = S.events.filter((e) => e.fileId === fid && (e.action === "view" || e.action === "download"));
    return { opens: ev.length, people: new Set(ev.map((e) => e.email)).size };
  };
  const fmtDate = (t) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const fmtTime = (t) => new Date(t).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  const fmtSize = (kb) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
  const plural = (n, a, b = a + "s") => `${n} ${n === 1 ? a : b}`;
  const kindClass = (k) => `kind-${k.toLowerCase()}`;
  const visibleFiles = (sub) => sub.files.filter((f) => f.visible && !f.placeholder);

  // ---------- Page shell ----------
  const app = document.getElementById("app");
  function shell({ nav, body, narrow, preview }) {
    const admin = S.role === "admin" && !preview;
    const who = S.role === "admin" ? D.adminEmail : S.role === "investor" ? D.investorEmail : "";
    const n = narrow ? "narrow" : "";
    const tab = (id, href, label) => h`<a href="${href}" class="${nav === id ? "on" : ""}">${label}</a>`;
    return h`<header class="bar">
        <div class="bar-in ${n}">
          <a href="#/" class="brand" aria-label="${D.company} data room home"><span class="brand-name">${D.company}</span><span class="brand-tag">Data room</span></a>
          ${S.role ? h`<span class="signout"><span class="who">${who}</span><button type="button" class="link-btn" data-act="signout">Sign out</button></span>` : ""}
        </div>
        ${admin ? h`<div class="bar-in ${n}"><nav class="tabs" aria-label="Admin">${tab("documents", "#/admin", "Documents")}${tab("investors", "#/admin/investors", "Investors")}${tab("activity", "#/admin/activity", "Activity")}${tab("settings", "#/admin/settings", "Settings")}</nav></div>` : ""}
      </header>
      ${preview ? h`<div class="preview-bar" role="status"><div class="bar-in"><span><strong>Preview.</strong> ${preview.text}</span><a href="${preview.back}" class="btn small ghost">Back to admin</a></div></div>` : ""}
      <main class="wrap ${n}">${body}</main>
      <footer class="foot wrap ${n}">${D.legal} Confidential. Shared for due diligence only.<span class="credit">Powered by <a href="${D.repo}" rel="noopener">Openroom</a>.</span></footer>`;
  }

  function toast(text, kind = "info") {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<div class="notice ${kind}" role="status">${esc(text)}</div>`;
    document.body.append(el);
    setTimeout(() => el.remove(), 3800);
  }
  const DEMO_NOTE = "This is a demo. Nothing is saved or sent.";

  // ---------- Screens ----------
  function landing() {
    return shell({ narrow: true, body: h`<section class="hero">
        <p class="eyebrow">Live demo</p>
        <h1 class="display">${D.company} data room</h1>
        <p class="lead">Look around Openroom as an investor, or behind the scenes as the person who runs the room. No email, no password. Everything here is made up, and nothing you do is saved.</p>
      </section>
      <section class="card demo-choices">
        <div><h2 class="h3">See what an investor sees</h2><p class="muted">Folders you were invited to, documents marked with your email, nothing else.</p><button type="button" class="btn wide" data-act="enter" data-id="investor">Enter the demo room</button></div>
        <div><h2 class="h3">See how you run it</h2><p class="muted">Folders, who has access, the activity log and the download switches.</p><button type="button" class="btn wide ghost" data-act="enter" data-id="admin">See the admin side</button></div>
      </section>
      <p class="small center"><a href="${D.repo}" rel="noopener">Get your own Openroom</a>: free, open source, your documents on your own server.</p>
      <p class="small center muted">Found it useful? <a href="coffee">Buy me a coffee</a></p>` });
  }

  // The investor screens, shared by the real room and the admin Preview.
  function roomBody(inv, base) {
    const tops = S.folders.filter((f) => !inv || inv.folders.includes(f.id));
    const count = (t) => t.subs.reduce((n, s) => n + visibleFiles(s).length, 0);
    const shown = tops.filter((t) => inv || count(t) > 0);
    const total = shown.reduce((n, t) => n + count(t), 0);
    return h`<section class="hero">
        <p class="eyebrow">${inv ? inv.firm : D.company + " data room"}</p>
        <h1 class="display">${inv ? "Welcome, " + inv.name.split(" ")[0] : "Welcome"}</h1>
        <p class="lead">${shown.length ? `${plural(total, "document")} in ${plural(shown.length, "folder")}, shared with you for due diligence.` : "Nothing has been shared with you yet."}</p>
        ${inv && inv.endsAt ? h`<p class="small muted">Your access is open until ${fmtDate(inv.endsAt)}.</p>` : ""}
      </section>
      ${shown.length > 1 ? h`<nav class="chips" aria-label="Folders">${shown.map((t) => h`<a href="#" data-scroll="${t.id}" class="chip">${t.name}</a>`)}</nav>` : ""}
      ${shown.map((t) => h`<section class="card folder" id="${t.id}">
          <div class="folder-head"><div class="folder-icon" aria-hidden="true"></div>
            <div class="folder-title"><h2 class="h3">${t.name}</h2>${t.description ? h`<p class="muted small">${t.description}</p>` : ""}</div>
            <span class="count">${plural(count(t), "document")}</span></div>
          <div class="folder-body">
            ${t.subs.filter((s) => visibleFiles(s).length).map((s) => h`<div class="subfolder"><h3 class="subfolder-title">${s.name}</h3>
              <ul class="files">${visibleFiles(s).map((f) => h`<li><a class="file" href="${base}/d/${f.id}">
                <span class="kind ${kindClass(f.kind)}">${f.kind}</span>
                <span class="file-main"><span class="file-name">${f.name}</span><span class="file-meta">${fmtSize(f.size)} · Updated ${fmtDate(f.updated)}</span></span>
                <span class="chev" aria-hidden="true">›</span></a></li>`)}</ul></div>`)}
            ${!count(t) ? h`<p class="muted small empty">No documents here yet.</p>` : ""}
          </div></section>`)}`;
  }

  // A sample document drawn as pages or tables, marked with the viewer's email like the real stamp.
  function docFrame(file, stampEmail) {
    const stamp = stampEmail ? h`<div class="demo-stamp">${stampEmail} · ${fmtDate(T0)} · ${D.host}</div>` : "";
    const d = file.doc || { pages: [["Sample upload", "Nothing was really uploaded in this demo."]] };
    if (d.sheets) {
      return h`<div class="frame page sheet demo-sheets">${Object.entries(d.sheets).map(([name, rows]) => h`<h3 class="sheet-name">${name}</h3>
        <div class="table-wrap"><table class="demo-table">${rows.map((r, i) => h`<tr>${r.map((c) => (i === 0 ? h`<th>${c}</th>` : h`<td>${c}</td>`))}</tr>`)}</table></div>`)}${stamp}</div>`;
    }
    return h`<div class="frame demo-pages">${d.pages.map((p) => h`<article class="demo-page ${d.wide ? "wide" : ""}">
        <h3>${p[0]}</h3>${p.slice(1).map((l) => (l ? h`<p>${l}</p>` : h`<p class="gap"></p>`))}${stamp}
        <small class="sample">Sample document. ${D.company} is a made-up company.</small></article>`)}</div>`;
  }

  function viewer(fileId, base, crumbBack, asEmail) {
    const info = fileInfo(fileId);
    if (!info || (S.role === "investor" && !info.file.visible)) return notFound();
    const { file, sub } = info;
    if (S.role === "investor" && base.startsWith("#/room")) {
      const now = Date.now();
      if (!S.events.some((e) => e.email === D.investorEmail && e.fileId === file.id && now - e.at < 60000))
        S.events.push({ at: now, email: D.investorEmail, action: "view", fileId: file.id, fileName: file.name, folderName: sub.name, country: "GB" });
    }
    return h`<p class="crumbs"><a href="${crumbBack}">‹ ${sub.name}</a></p>
      <section class="viewer-head"><div><h1 class="h2 break">${file.name}</h1><p class="muted small">${file.kind} · ${fmtSize(file.size)} · Updated ${fmtDate(file.updated)}</p></div>
        <div class="actions"><button type="button" class="btn ghost" data-act="note" data-id="Opening full screen is off in the demo. The document is shown right here.">Open full screen</button>
        ${file.download ? h`<button type="button" class="btn" data-act="note" data-id="Downloads are off in the demo. Nothing here is real, so there is nothing to take away.">Download</button>` : ""}</div></section>
      ${docFrame(file, asEmail)}
      <p class="small muted center">Pages are marked with your email address.</p>`;
  }

  const notFound = () => h`<section class="card center"><h1 class="h2">Not found</h1><p class="muted">This page does not exist.</p><p><a class="btn" href="#/">Back</a></p></section>`;

  // ----- Admin -----
  const switchBtn = (f) => h`<button type="button" class="switch ${f.download ? "on" : ""}" role="switch" aria-checked="${f.download ? "true" : "false"}" data-act="dl" data-id="${f.id}"
      title="${f.download ? "Investors can download this file. Click to make it view only." : "View only. Click to let investors download this file."}"><span class="knob" aria-hidden="true"></span>Download</button>`;

  function fileRow(f, sub) {
    if (f.placeholder) {
      return h`<li class="file-row placeholder-row"><span class="kind ${kindClass(f.kind)}">${f.kind}</span>
        <span class="file-main"><span class="file-name">${f.name}</span><span class="file-meta">Placeholder. Upload your own version; investors never see this one.</span></span>
        <span class="row-actions"><span class="badge amber">To replace</span><button type="button" class="btn small" data-act="upload" data-id="${f.id}">Upload your version</button></span></li>`;
    }
    const s = stats(f.id);
    return h`<li class="file-row"><span class="kind ${kindClass(f.kind)}">${f.kind}</span>
      <span class="file-main"><span class="file-title"><a class="file-name" href="#/admin/preview/d/${f.id}">${f.name}</a></span>
        <span class="file-meta">${fmtSize(f.size)} · ${fmtDate(f.updated)} · <a href="#/admin/files/${f.id}">${s.opens ? `${plural(s.opens, "open")} by ${plural(s.people, "person", "people")}` : "Not opened yet"}</a></span></span>
      <span class="row-actions">${switchBtn(f)}<span class="badge ${f.visible ? "green" : "grey"}">${f.visible ? "Visible" : "Hidden"}</span>
        <a class="link-btn" href="#/admin/preview/d/${f.id}">Preview</a><button type="button" class="link-btn" data-act="edit" data-id="${f.id}">Edit</button></span></li>`;
  }

  function adminDocs() {
    const sharedWith = (t) => S.investors.filter((i) => !i.revoked && i.folders.includes(t.id));
    return shell({ nav: "documents", body: h`<section class="row-between"><div><h1 class="h2">Documents</h1>
        <p class="muted small">Investors see a folder only when you give them access to it, and only files marked Visible. Everything here works, but nothing is saved.</p></div>
        <span class="actions"><a class="btn ghost" href="#/admin/templates">Templates</a><a class="btn ghost" href="#/admin/preview">Preview</a></span></section>
      <details class="card add"><summary class="btn">New folder</summary>
        <form class="stack" data-form="folder"><label>Name <input name="name" required maxlength="80" placeholder="Corporate documents"></label>
          <label>Short description (investors see this) <input name="description" maxlength="200" placeholder="Certificate of incorporation, bylaws"></label>
          <button class="btn" type="submit">Create folder</button></form></details>
      ${S.folders.map((t) => {
        const files = t.subs.flatMap((s) => s.files), real = files.filter((f) => !f.placeholder);
        const toReplace = files.length - real.length, dl = real.filter((f) => f.download).length, people = sharedWith(t);
        return h`<details class="card folder fold" id="${t.id}" open>
          <summary class="folder-head"><span class="fold-arrow" aria-hidden="true"></span><div class="folder-icon" aria-hidden="true"></div>
            <div class="folder-title"><h2 class="h3">${t.name} <span class="count">${plural(real.length, "file")}</span></h2>${t.description ? h`<p class="small muted">${t.description}</p>` : ""}</div>
            <div class="folder-tags">${toReplace ? h`<span class="tag amber">${toReplace} to replace</span>` : ""}
              <span class="tag ${dl ? "blue" : "grey"}">${dl ? `${dl} downloadable` : "View only"}</span><span class="tag navy">PDFs stamped</span>
              <span class="tag ${people.length ? "green" : "grey"}">${!people.length ? "Not shared" : people.length <= 2 ? "Shared with " + people.map((p) => p.name).join(", ") : `Shared with ${people.length} investors`}</span></div></summary>
          <div class="folder-body">${t.subs.map((s) => h`<div class="subfolder admin"><div class="subfolder-head"><h3 class="subfolder-title">${s.name}</h3>
              <span class="subfolder-actions"><button type="button" class="link-btn small" data-act="upload" data-id="${s.id}">Add files</button></span></div>
              ${s.files.length ? h`<ul class="files admin">${s.files.map((f) => fileRow(f, s))}</ul>` : h`<p class="muted small empty">Empty.</p>`}</div>`)}
            <div class="folder-foot"><button type="button" class="btn small" data-act="upload" data-id="${t.id}">Upload</button>
              <details class="settings"><summary class="link-btn">New subfolder</summary><div class="settings-body"><form class="inline-form" data-form="subfolder" data-id="${t.id}">
                <input name="name" required maxlength="80" placeholder="Board minutes" aria-label="Subfolder name"><button class="btn small" type="submit">Add subfolder</button></form></div></details></div>
          </div></details>`;
      })}`});
  }

  function adminFile(id) {
    const info = fileInfo(id);
    if (!info) return shell({ nav: "documents", body: notFound() });
    const { file, sub } = info;
    const ev = S.events.filter((e) => e.fileId === id && (e.action === "view" || e.action === "download")).sort((a, b) => b.at - a.at);
    return shell({ nav: "documents", body: h`<p class="crumbs"><a href="#/admin">‹ Documents</a></p>
      <section class="row-between"><div><h1 class="h2 break">${file.name}</h1><p class="muted small">${sub.name} · ${file.kind} · ${fmtSize(file.size)}</p></div>
        <div class="actions">${switchBtn(file)}<a class="btn small" href="#/admin/preview/d/${file.id}">Preview</a></div></section>
      <section class="card"><h2 class="h3">Who opened it</h2>${activityList(ev, true)}</section>` });
  }

  const ACTION = { sign_in: "Signed in", view: "Viewed", download: "Downloaded", email_failed: "Email failed" };
  function activityList(events, who) {
    if (!events.length) return h`<p class="muted small">Nothing yet.</p>`;
    const names = new Map(S.investors.map((i) => [i.email, i.name]));
    return h`<ul class="activity">${events.map((e) => h`<li><span class="act act-${e.action}">${ACTION[e.action]}</span><span class="file-main">
      <span>${who ? h`<strong>${names.get(e.email) || e.email}</strong> ` : ""}${e.fileName || ""}${e.folderName ? h` <span class="muted">in ${e.folderName}</span>` : ""}</span>
      <span class="file-meta">${fmtTime(e.at)}${e.country ? " · " + e.country : ""}</span></span></li>`)}</ul>`;
  }

  const status = (i) => (i.revoked ? ["Revoked", "red"] : i.endsAt && i.endsAt < T0 ? ["Ended", "grey"] : i.lastSeen && T0 - i.lastSeen < 7 * DAY ? ["Active", "green"] : ["Invited", "blue"]);
  const folderChecks = (checked) => h`<fieldset class="checks"><legend>Folders they can see</legend>${S.folders.map((f) => h`<label class="check"><input type="checkbox" name="folders" value="${f.id}" ${checked.includes(f.id) ? raw("checked") : ""}> ${f.name}</label>`)}</fieldset>`;
  const raw = (s) => new Raw(s);

  function adminInvestors() {
    return shell({ nav: "investors", body: h`<section class="row-between"><div><h1 class="h2">Investors</h1><p class="muted small">Each investor signs in with their email and sees only the folders you tick.</p></div></section>
      ${S.requests.length ? h`<section class="card requests"><h2 class="h3">Access requests <span class="badge blue">${S.requests.length}</span></h2>${S.requests.map((r) => h`<div class="request">
        <p><strong>${r.name}</strong> · ${r.firm} · <span class="muted">${r.email}</span> · <span class="small muted">${fmtTime(r.at)}</span></p><p class="request-note">${r.note}</p>
        <button type="button" class="btn small" data-act="approve" data-id="${r.id}">Approve</button> <button type="button" class="link-btn small" data-act="decline" data-id="${r.id}">Decline</button></div>`)}</section>` : ""}
      <details class="card add"><summary class="btn">Add investor</summary><form class="stack" data-form="investor">
        <label>Email <input name="email" type="email" required maxlength="254" placeholder="partner@fund.com"></label>
        <div class="two"><label>Name <input name="name" maxlength="100" placeholder="Ada Okafor"></label><label>Firm <input name="firm" maxlength="100" placeholder="Plug and Play"></label></div>
        ${folderChecks([])}<button class="btn" type="submit">Add investor</button></form></details>
      <section class="card flush"><ul class="people">${S.investors.map((i) => { const [label, cls] = status(i); const opens = S.events.filter((e) => e.email === i.email && e.action !== "sign_in").length;
        return h`<li><a href="#/admin/investors/${i.id}" class="person"><span class="avatar" aria-hidden="true">${(i.name || i.email).slice(0, 1).toUpperCase()}</span>
          <span class="file-main"><span class="file-name">${i.name} <span class="muted">· ${i.firm}</span></span>
          <span class="file-meta">${i.email} · ${plural(i.folders.length, "folder")} · ${plural(opens, "open")} · Last seen ${fmtDate(i.lastSeen)}${i.endsAt ? " · Ends " + fmtDate(i.endsAt) : ""}</span></span>
          <span class="badge ${cls}">${label}</span></a></li>`; })}</ul></section>` });
  }

  function adminInvestor(id) {
    const i = investor(id);
    if (!i) return shell({ nav: "investors", body: notFound() });
    const [label, cls] = status(i);
    const ev = S.events.filter((e) => e.email === i.email).sort((a, b) => b.at - a.at);
    return shell({ nav: "investors", body: h`<p class="crumbs"><a href="#/admin/investors">‹ Investors</a></p>
      <section class="row-between"><div><h1 class="h2 break">${i.name} <span class="badge ${cls}">${label}</span></h1><p class="muted small">${i.email} · ${i.firm} · Last seen ${fmtTime(i.lastSeen)}</p></div>
        <div class="actions"><a class="btn small" href="#/admin/preview/i/${i.id}">Preview as ${i.name.split(" ")[0]}</a>
          <button type="button" class="btn ghost small" data-act="note" data-id="No email is sent in the demo.">Send invite email</button>
          <button type="button" class="btn ${i.revoked ? "" : "danger"} small" data-act="revoke" data-id="${i.id}">${i.revoked ? "Restore access" : "Revoke access"}</button></div></section>
      <section class="card"><form class="stack" data-form="investor-save" data-id="${i.id}"><div class="two"><label>Name <input name="name" value="${i.name}" maxlength="100"></label><label>Firm <input name="firm" value="${i.firm}" maxlength="100"></label></div>
        ${folderChecks(i.folders)}<button class="btn" type="submit">Save changes</button></form></section>
      <section class="card"><h2 class="h3">What they opened</h2>${activityList(ev, false)}</section>` });
  }

  function adminSettings() {
    return shell({ nav: "settings", body: h`<h1 class="h2">Settings</h1><p class="muted small">Name, colours, logo and email. In the demo they are for show.</p>
      <section class="card"><form class="stack" data-form="settings"><div class="two"><label>Room name <input name="name" value="${D.company}" maxlength="80"></label><label>Legal name <input name="legal" value="${D.legal}" maxlength="80"></label></div>
        <div class="two"><label>Button colour <input name="color" value="#2563EB" maxlength="7"></label><label>Header colour <input name="dark" value="#0F172A" maxlength="7"></label></div>
        <label>Email sender <input name="from" value="Data Room <rooms@example.com>" maxlength="120"></label><button class="btn" type="submit">Save settings</button></form></section>` });
  }

  function adminTemplates() {
    return shell({ nav: "documents", body: h`<p class="crumbs"><a href="#/admin">‹ Documents</a></p><section class="card setup-card"><h1 class="h2">Start from a template</h1>
      <p class="muted">Adds a ready-made set of folders after the ones you already have, each with a placeholder to replace with your own document.</p>
      ${D.templates.map((t) => h`<div class="request"><p><strong>${t.name}</strong></p><p class="muted small">${t.summary}</p><p class="small">${t.sections.map((s) => s[0]).join(" · ")}</p>
        <button type="button" class="btn small" data-act="template" data-id="${t.id}">Add these folders</button></div>`)}</section>` });
  }

  // ---------- Router ----------
  function route() {
    const path = (location.hash.replace(/^#/, "") || "/").split("?")[0];
    const seg = path.split("/").filter(Boolean);
    let view;
    if (!seg.length) view = S.role === "admin" ? (location.hash = "#/admin", null) : S.role === "investor" ? (location.hash = "#/room", null) : landing();
    else if (!S.role) { location.hash = "#/"; return; }
    else if (seg[0] === "room" && S.role === "investor") {
      const me = investor("i0");
      view = seg[1] === "d" ? shell({ body: viewer(seg[2], "#/room", "#/room", D.investorEmail) }) : shell({ body: roomBody(me, "#/room") });
    } else if (seg[0] === "admin" && S.role === "admin") {
      const [, a, b, c, d] = seg;
      if (!a) view = adminDocs();
      else if (a === "files") view = adminFile(b);
      else if (a === "investors") view = b ? adminInvestor(b) : adminInvestors();
      else if (a === "activity") view = shell({ nav: "activity", body: h`<h1 class="h2">Activity</h1><p class="muted small">The latest sign-ins, views and downloads. Times are UTC. Open a document in the investor room and it shows up here.</p><section class="card">${activityList([...S.events].sort((x, y) => y.at - x.at).slice(0, 300), true)}</section>` });
      else if (a === "settings") view = adminSettings();
      else if (a === "templates") view = adminTemplates();
      else if (a === "preview") {
        const pv = b === "i" ? investor(c) : null;
        const base = b === "i" ? `#/admin/preview/i/${c}` : "#/admin/preview";
        const text = pv ? `Showing exactly what ${pv.name} sees.` : "Showing the room as an investor with access to every folder sees it.";
        const fid = b === "i" ? (d === "d" ? seg[5] : null) : b === "d" ? c : null;
        const body = fid ? viewer(fid, base, base, pv ? pv.email : D.investorEmail) : roomBody(pv, base);
        view = shell({ body, preview: { text, back: "#/admin" } });
      } else view = shell({ nav: "documents", body: notFound() });
    } else { location.hash = "#/"; return; }
    if (view) { app.innerHTML = view.s; window.scrollTo(0, 0); }
  }

  // ---------- Actions ----------
  const uploadDlg = document.getElementById("upload-dlg"), editDlg = document.getElementById("edit-dlg");
  let uploadTarget = null, editTarget = null;
  const refresh = () => { const y = window.scrollY; route(); window.scrollTo(0, y); };
  const sampleFile = (name) => ({ id: uid("d"), name, kind: (name.split(".").pop() || "PDF").toUpperCase().slice(0, 5), size: 120, age: 0, updated: Date.now(), visible: true, download: false, doc: null });

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act], [data-scroll], [data-close]");
    if (!t) return;
    if (t.dataset.scroll) { e.preventDefault(); document.getElementById(t.dataset.scroll)?.scrollIntoView({ behavior: "smooth" }); return; }
    if (t.hasAttribute("data-close")) { t.closest("dialog")?.close(); return; }
    const id = t.dataset.id;
    switch (t.dataset.act) {
      case "enter": S.role = id; location.hash = id === "admin" ? "#/admin" : "#/room"; route(); break;
      case "signout": S.role = null; location.hash = "#/"; route(); break;
      case "note": toast(id); break;
      case "dl": { const f = fileInfo(id).file; f.download = !f.download; refresh(); toast(f.download ? "Download is on for this file. (Demo only.)" : "Download is off for this file. (Demo only.)", "ok"); break; }
      case "edit": { editTarget = id; const f = fileInfo(id).file; editDlg.querySelector("[name=name]").value = f.name; editDlg.querySelector("[name=visible]").checked = f.visible; editDlg.querySelector("h3").textContent = f.name; editDlg.showModal(); break; }
      case "upload": uploadTarget = id; uploadDlg.querySelector("input[type=file]").value = ""; uploadDlg.showModal(); break;
      case "revoke": { const i = investor(id); i.revoked = !i.revoked; refresh(); toast(i.revoked ? "Access revoked. (Demo only.)" : "Access restored. (Demo only.)", "ok"); break; }
      case "approve": { const r = S.requests.find((x) => x.id === id); S.requests = S.requests.filter((x) => x !== r); S.investors.push({ id: uid("i"), name: r.name, firm: r.firm, email: r.email, folders: ["f5"], lastSeen: null, endsAt: null, revoked: false }); refresh(); toast(`${r.name} now has access to Business plan. (Demo only.)`, "ok"); break; }
      case "decline": S.requests = S.requests.filter((x) => x.id !== id); refresh(); toast("Request declined. (Demo only.)", "ok"); break;
      case "template": {
        const tpl = D.templates.find((x) => x.id === id);
        for (const [name, items] of tpl.sections) S.folders.push({ id: uid("f"), name: `${S.folders.length + 1}. ${name}`, description: "", subs: items.map((it) => ({ id: uid("s"), name: it, files: [{ id: uid("d"), name: `${it}.pdf`, kind: "PDF", size: 40, age: 0, updated: Date.now(), visible: false, download: false, placeholder: true, doc: null }] })) });
        location.hash = "#/admin"; toast(`${tpl.name} folders added. Replace each placeholder with your own document. (Demo only.)`, "ok"); break;
      }
    }
  });

  document.addEventListener("submit", (e) => {
    const f = e.target;
    if (f.method === "dialog") return;
    e.preventDefault();
    const v = new FormData(f), kind = f.dataset.form, id = f.dataset.id || uploadTarget;
    if (f.id === "upload-form") {
      const name = (v.get("file") && v.get("file").name) || "Uploaded sample.pdf";
      const ph = fileInfo(id);
      if (ph && ph.file.placeholder) Object.assign(ph.file, sampleFile(name), { id: ph.file.id });
      else {
        const sub = S.folders.flatMap((t) => t.subs).find((s) => s.id === id) || S.folders.find((t) => t.id === id)?.subs[0];
        if (sub) sub.files.push(sampleFile(name)); else { const t = S.folders.find((x) => x.id === id); if (t) t.subs.push({ id: uid("s"), name: "Uploads", files: [sampleFile(name)] }); }
      }
      uploadDlg.close(); refresh(); toast("Sample file added. Nothing was really uploaded in the demo.", "ok"); return;
    }
    if (f.id === "edit-form") {
      const file = fileInfo(editTarget).file;
      file.name = String(v.get("name") || file.name).slice(0, 160); file.visible = v.has("visible");
      editDlg.close(); refresh(); toast("File saved. (Demo only.)", "ok"); return;
    }
    if (kind === "folder") S.folders.push({ id: uid("f"), name: String(v.get("name")), description: String(v.get("description") || ""), subs: [] });
    else if (kind === "subfolder") S.folders.find((t) => t.id === id).subs.push({ id: uid("s"), name: String(v.get("name")), files: [] });
    else if (kind === "investor") S.investors.push({ id: uid("i"), name: String(v.get("name") || ""), firm: String(v.get("firm") || ""), email: String(v.get("email")), folders: v.getAll("folders"), lastSeen: null, endsAt: null, revoked: false });
    else if (kind === "investor-save") { const i = investor(id); i.name = String(v.get("name")); i.firm = String(v.get("firm")); i.folders = v.getAll("folders"); }
    if (kind === "settings") return toast(DEMO_NOTE, "info");
    if (kind === "investor") location.hash = "#/admin/investors";
    refresh();
    toast(kind === "investor" ? "Investor added. No invite email is sent in the demo." : "Done. (Demo only: reload the page and it is gone.)", "ok");
  });

  window.addEventListener("hashchange", route);
  reset();
  route();
})();
