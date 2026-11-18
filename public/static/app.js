// Ask before destructive admin actions, in a small window on the page. (The browser's own confirm box is
// blocked in some embedded browsers, which made buttons like Delete look dead.) Kept out of inline HTML so
// the page can forbid inline scripts.
const confirmed = new WeakSet();
function askFirst(message, trigger, onYes) {
  const dlg = document.createElement("dialog");
  dlg.className = "confirm-dialog";
  dlg.setAttribute("aria-label", "Please confirm");
  const text = document.createElement("p");
  text.textContent = message;
  const actions = document.createElement("div");
  actions.className = "confirm-actions";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "btn ghost";
  cancel.textContent = "Cancel";
  cancel.autofocus = true;
  const yes = document.createElement("button");
  yes.type = "button";
  yes.className = "btn warn";
  yes.textContent = (trigger && trigger.textContent ? trigger.textContent.replace(/\u2026|\.\.\./g, "").trim() : "") || "Continue";
  cancel.addEventListener("click", () => dlg.close());
  yes.addEventListener("click", () => {
    dlg.close();
    onYes();
  });
  actions.append(cancel, yes);
  dlg.append(text, actions);
  dlg.addEventListener("close", () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
}
document.addEventListener("submit", (e) => {
  const form = e.target;
  const msg = form instanceof HTMLFormElement ? form.dataset.confirm : null;
  if (form instanceof HTMLFormElement && msg && !confirmed.has(form)) {
    e.preventDefault();
    const trigger = e.submitter instanceof HTMLElement ? e.submitter : null;
    askFirst(msg, trigger, () => {
      confirmed.add(form);
      if (trigger) form.requestSubmit(trigger);
      else form.requestSubmit();
    });
    return;
  }
  if (form instanceof HTMLFormElement) confirmed.delete(form);
  // One tap only: stop double submits on slow networks.
  if (!e.defaultPrevented && form instanceof HTMLFormElement) {
    if (form.dataset.sent) e.preventDefault();
    else {
      form.dataset.sent = "1";
      setTimeout(() => delete form.dataset.sent, 8000);
    }
  }
});

// Edit menus close when you click anywhere else, and only one is open at a time.
document.addEventListener("click", (e) => {
  for (const menu of document.querySelectorAll("details.menu[open]")) {
    if (!menu.contains(e.target)) menu.removeAttribute("open");
  }
});

// First-time setup. The pages work without this; it adds the small touches.
// Colours are set through the DOM, which the page's security policy allows (inline style attributes are not).

// The code box continues by itself once six digits are typed or pasted.
const codeBox = document.querySelector("input.code-input");
if (codeBox instanceof HTMLInputElement) {
  codeBox.addEventListener("input", () => {
    codeBox.value = codeBox.value.replace(/\D/g, "").slice(0, 6);
    if (codeBox.value.length === 6 && codeBox.form) codeBox.form.requestSubmit();
  });
}

// Show or hide a pasted key.
document.addEventListener("click", (e) => {
  const t = e.target instanceof Element ? e.target.closest("[data-reveal]") : null;
  if (!(t instanceof HTMLElement)) return;
  const input = document.getElementById(t.dataset.reveal || "");
  if (!(input instanceof HTMLInputElement)) return;
  input.type = input.type === "password" ? "text" : "password";
  t.textContent = input.type === "password" ? "Show" : "Hide";
});

// Colour swatches fill the colour box they belong to.
for (const s of document.querySelectorAll("[data-swatch]")) {
  if (!(s instanceof HTMLElement)) continue;
  s.style.background = s.dataset.swatch || "";
  s.hidden = false;
}
document.addEventListener("click", (e) => {
  const s = e.target instanceof Element ? e.target.closest("[data-swatch]") : null;
  if (!(s instanceof HTMLElement)) return;
  const input = document.querySelector(`input[name="${s.dataset.for}"]`);
  if (!(input instanceof HTMLInputElement)) return;
  input.value = (s.dataset.swatch || "").toLowerCase();
  input.dispatchEvent(new Event("input", { bubbles: true }));
});

// Live preview of the header and buttons while choosing the brand.
const preview = document.querySelector("[data-preview]");
const brandForm = preview ? preview.closest("form") : null;
if (preview && brandForm) {
  const $ = (sel) => preview.querySelector(sel);
  const field = (name) => brandForm.querySelector(`[name="${name}"]`);
  const update = () => {
    const name = (field("name")?.value || "").trim() || "Your company";
    const color = field("color")?.value;
    const dark = field("dark")?.value;
    $("[data-pv-name]").textContent = name;
    $("[data-pv-room]").textContent = `${name} data room`;
    if (dark) $("[data-pv-bar]").style.background = dark;
    if (color) {
      $("[data-pv-btn]").style.background = color;
      const finish = brandForm.querySelector(".brand-actions .btn");
      if (finish) finish.style.background = color;
    }
    for (const s of brandForm.querySelectorAll("[data-swatch]")) {
      const input = field(s.dataset.for);
      s.setAttribute("aria-pressed", String(!!input && input.value.toLowerCase() === (s.dataset.swatch || "").toLowerCase()));
    }
  };
  brandForm.addEventListener("input", update);
  const logo = field("logo");
  if (logo instanceof HTMLInputElement) {
    logo.addEventListener("change", () => {
      const file = logo.files && logo.files[0];
      const img = $("[data-pv-logo]");
      const label = brandForm.querySelector(".drop-text strong");
      if (!file || file.size > 512 * 1024) return;
      if (label) label.textContent = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        img.src = String(reader.result);
        img.hidden = false;
        $("[data-pv-name]").hidden = true;
      };
      reader.readAsDataURL(file);
    });
  }
  update();
}

// "Upload your version" on a template placeholder: choosing the file is the whole action.
document.addEventListener("change", (e) => {
  const input = e.target;
  if (input instanceof HTMLInputElement && input.type === "file" && input.hasAttribute("data-autosubmit") && input.files?.length && input.form) {
    input.form.requestSubmit();
  }
});

// Drag and drop uploads. Drop a file on a placeholder to replace it, or on a folder or subfolder to
// fill its Add files form (you then press Upload, so "Visible now" and "Downloadable" stay your call).
(() => {
  const isFileDrag = (e) => !!e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files");

  const fill = (input, files) => {
    const dt = new DataTransfer();
    const list = Array.from(files);
    (input.multiple ? list : list.slice(0, 1)).forEach((f) => dt.items.add(f));
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // Where a drop at this spot would go: the element to highlight, and the file input to fill.
  const aim = (t) => {
    if (!(t instanceof Element)) return null;
    const dlg = t.closest("dialog");
    if (dlg) {
      const input = dlg.querySelector("input[type=file]");
      return input ? { zone: dlg.querySelector(".dz-box") || dlg, input, open: dlg } : null;
    }
    const row = t.closest(".placeholder-row");
    if (row) {
      const input = row.querySelector("input[data-autosubmit]");
      return input ? { zone: row, input, open: null } : null;
    }
    const sub = t.closest(".subfolder.admin");
    if (sub) {
      const input = sub.querySelector("input[type=file][name=files]");
      return input ? { zone: sub, input, open: input.closest("details") } : null;
    }
    const folder = t.closest("details.folder");
    if (folder) {
      const input = folder.querySelector(".folder-foot input[type=file][name=files]");
      return input ? { zone: folder, input, open: folder } : null;
    }
    const holder = t.closest(".drop") || t.closest("form");
    const input = holder && holder.querySelector("input[type=file]");
    return input && holder ? { zone: holder, input, open: null } : null;
  };

  let lit = null;
  const light = (zone) => {
    if (lit === zone) return;
    if (lit) lit.classList.remove("dz-over");
    lit = zone;
    if (lit) lit.classList.add("dz-over");
  };

  document.addEventListener("dragover", (e) => {
    if (!isFileDrag(e)) return;
    e.preventDefault(); // otherwise the browser would open the file instead
    const hit = aim(e.target);
    e.dataTransfer.dropEffect = hit ? "copy" : "none";
    light(hit ? hit.zone : null);
  });
  document.addEventListener("dragleave", (e) => {
    if (!e.relatedTarget) light(null);
  });
  document.addEventListener("drop", (e) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    light(null);
    const files = e.dataTransfer.files;
    const hit = aim(e.target);
    if (!hit || !files.length) return;
    if (hit.open instanceof HTMLDetailsElement) hit.open = true;
    fill(hit.input, files); // a placeholder's input submits itself on change
    // Anything else opens its upload window with the files ready, so Visible now stays your call.
    const dlg = hit.input.closest("dialog");
    if (dlg && !hit.input.hasAttribute("data-autosubmit") && !dlg.open) dlg.showModal();
  });
  document.addEventListener("dragend", () => light(null));

  // Dragging to put things in order, and to move files.
  //   A file row: drop it anywhere in any folder or subfolder (its own too, to reorder). While you drag, the
  //   row leaves its place and a gap opens in the list right where your pointer is; that is where it lands.
  //   A folder or subfolder's title bar: drop it among its own siblings. A gap opens where it will go.
  // A folded folder or subfolder you hover over opens by itself. Moving a file into a different top-level
  // folder changes who can see it, so that asks first. On drop the thing lands in the gap and the counts
  // update in place, and the server is told in the background: the screen stays exactly as it is (no reload,
  // no flash, no scrolling). Only if saving fails does the page reload, so it shows what is really saved.
  // (Uploads are the "Files" drags above; these carry their own types, so they never mix.)
  const ROW = "application/x-openroom-file";
  const FOLDER = "application/x-openroom-folder";
  let dragging = null; // { kind: "file" | "folder", id, name, el, ... }
  let zone = null; // a file's target: the folder or subfolder under the pointer
  let spring = null; // timer: opens a folded folder you are hovering over
  let springOn = null;
  const fileGap = document.createElement("li");
  fileGap.className = "drop-gap";
  fileGap.setAttribute("aria-hidden", "true");
  const folderGap = document.createElement("div");
  folderGap.setAttribute("aria-hidden", "true");

  const hasSubBoxes = (body) => !!body.querySelector(":scope > .subfolder");
  // Where a file dropped at this spot would go: a subfolder box, or a folder's own area. A folder that has
  // subfolders only offers its own area down by its Upload row, so the gap never opens away from the pointer.
  const zoneAt = (t) => {
    if (!(t instanceof Element)) return null;
    // Over an open folder's title bar: put it directly in that folder.
    const head = t.closest("summary.folder-head");
    if (head && head.parentElement.open) {
      const body = head.parentElement.querySelector(":scope > .folder-body");
      return (body && (body.querySelector(":scope > .subfolder.loose") || (hasSubBoxes(body) ? null : body))) || null;
    }
    const z = t.closest("[data-drop-folder]");
    if (!z) return null;
    if (z.classList.contains("folder-body") && hasSubBoxes(z) && !t.closest(".folder-foot")) return null;
    return z;
  };
  const listOf = (z, make) => {
    let list = z.querySelector(":scope > ul.files");
    if (!list && make) {
      list = document.createElement("ul");
      list.className = "files admin";
      const empty = z.querySelector(":scope > .empty");
      if (empty) empty.replaceWith(list);
      else z.insertBefore(list, z.classList.contains("folder-body") ? z.querySelector(":scope > .folder-foot") : null);
    }
    return list;
  };
  // A folder that has subfolders but no files of its own has nowhere to drop a file "directly in" it. While a
  // file is dragged, each such folder shows an empty "Files directly in ..." box at its top.
  const addLooseTargets = () => {
    for (const body of document.querySelectorAll("details.folder > .folder-body[data-drop-folder]")) {
      if (!hasSubBoxes(body) || body.querySelector(":scope > .subfolder.loose")) continue;
      const box = document.createElement("div");
      box.className = "subfolder admin loose temp-loose";
      box.dataset.dropFolder = body.dataset.dropFolder;
      box.dataset.top = body.dataset.top;
      box.dataset.folderName = body.dataset.folderName;
      const head = document.createElement("div");
      head.className = "subfolder-head";
      const title = document.createElement("h3");
      title.className = "subfolder-title";
      title.textContent = "Files directly in " + (body.dataset.folderName || "this folder");
      const count = document.createElement("span");
      count.className = "subfolder-count";
      count.textContent = "0 files";
      head.append(title, count);
      box.append(head);
      body.prepend(box);
    }
  };
  // A temporary box that nothing was dropped into goes away; one that got a file stays, as a real box.
  const settleLooseTargets = () => {
    for (const box of document.querySelectorAll(".temp-loose")) {
      if (!box.querySelector("li.file-row")) {
        box.remove();
        continue;
      }
      box.classList.remove("temp-loose");
      box.id = "loose-" + box.dataset.dropFolder;
      const title = box.querySelector(".subfolder-title");
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "sub-toggle";
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Fold or unfold this subfolder");
      toggle.title = "Fold or unfold";
      if (title) title.prepend(toggle);
    }
  };
  const closeGaps = () => {
    fileGap.remove();
    folderGap.remove();
    // A list made only to hold the gap goes away with it.
    document.querySelectorAll("ul.files.admin:empty").forEach((u) => u.remove());
  };
  const isSibling = (el, c) => c !== el && (el.matches("details.folder") ? c.matches("details.folder") : c.matches(".subfolder.admin:not(.loose)"));
  const siblingsOf = (el) => [...el.parentElement.children].filter((c) => isSibling(el, c));
  const firstBelow = (items, y) =>
    items.find((r) => {
      const b = r.getBoundingClientRect();
      return y < b.top + b.height / 2;
    });
  // Opens the gap between the two files the pointer is between.
  const moveFileGap = (z, y) => {
    if (z.classList.contains("is-collapsed")) return closeGaps();
    const list = listOf(z, true);
    const rows = [...list.querySelectorAll(":scope > li.file-row")].filter((r) => !r.classList.contains("dragging"));
    const before = firstBelow(rows, y);
    if (fileGap.parentElement === list && (before ? fileGap.nextElementSibling === before : fileGap === list.lastElementChild)) return;
    list.insertBefore(fileGap, before || null);
  };
  const moveFolderGap = (y) => {
    const el = dragging.el;
    const sibs = siblingsOf(el);
    const before = firstBelow(sibs, y);
    folderGap.className = "drop-gap folder-gap" + (el.matches("details.folder") ? "" : " is-sub");
    if (before) {
      if (folderGap.nextElementSibling !== before) before.before(folderGap);
    } else {
      const last = sibs[sibs.length - 1] || el;
      if (last.nextElementSibling !== folderGap) last.after(folderGap);
    }
  };
  // Hovering a folded folder or subfolder for a moment opens it, so it can be dropped into.
  const springOpen = (el) => {
    if (springOn === el) return;
    clearTimeout(spring);
    springOn = el;
    if (!el) return;
    spring = setTimeout(() => {
      if (el instanceof HTMLDetailsElement) el.open = true;
      else el.classList.remove("is-collapsed");
    }, 450);
  };
  const plural = (n, one) => `${n} ${n === 1 ? one : one + "s"}`;
  const realRows = (scope) => [...scope.querySelectorAll("li.file-row:not(.placeholder-row)")];
  // A folder's header tags that depend on its files: how many to replace, and how many can be downloaded.
  const refreshTop = (details) => {
    if (!details) return;
    const all = [...details.querySelectorAll("li.file-row")];
    const real = all.filter((r) => !r.classList.contains("placeholder-row"));
    const count = details.querySelector(":scope > summary .folder-title .count");
    if (count) count.textContent = plural(real.length, "file");
    const tags = details.querySelector(":scope > summary .folder-tags");
    if (!tags) return;
    const toReplace = all.length - real.length;
    let amber = tags.querySelector(".tag.amber");
    if (toReplace && !amber) {
      amber = document.createElement("span");
      amber.className = "tag amber";
      tags.prepend(amber);
    }
    if (amber) {
      if (toReplace) amber.textContent = `${toReplace} to replace`;
      else amber.remove();
    }
    const dl = real.filter((r) => r.querySelector(".switch.on")).length;
    const dlTag = [...tags.querySelectorAll(".tag")].find((t) => /downloadable|View only/.test(t.textContent));
    if (dlTag) {
      dlTag.textContent = dl ? `${dl} downloadable` : "View only";
      dlTag.classList.toggle("blue", !!dl);
      dlTag.classList.toggle("grey", !dl);
    }
  };
  // After a file has left or arrived: update the box's count, and take away a box that is now empty (the
  // server does the same for a subfolder, so a reload would agree).
  const tidyBox = (box) => {
    if (!box || !box.isConnected) return;
    if (box.classList.contains("subfolder")) {
      if (!box.querySelector("li.file-row")) return box.remove();
      const c = box.querySelector(":scope > .subfolder-head .subfolder-count");
      if (c) c.textContent = plural(realRows(box).length, "file");
    } else if (box.classList.contains("folder-body") && !box.querySelector(":scope > .subfolder, li.file-row") && !box.querySelector(":scope > .empty")) {
      const p = document.createElement("p");
      p.className = "muted small empty";
      p.textContent = "No files yet. Upload the first one below.";
      box.insertBefore(p, box.querySelector(":scope > .folder-foot"));
    }
    document.querySelectorAll("ul.files.admin:empty").forEach((u) => u.remove());
  };
  // Tell the server in the background. Nothing on the page changes when it answers; if it cannot be saved,
  // reload so the page shows what really is.
  const send = (url, params) => {
    fetch(url, {
      method: "POST",
      credentials: "same-origin",
      redirect: "manual", // the answer is a redirect to the Documents page, which we do not need
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
    })
      .then((r) => {
        if (!(r.ok || r.type === "opaqueredirect")) location.reload();
      })
      .catch(() => location.reload());
  };
  const idOfNext = (gapEl, test) => {
    const n = gapEl.nextElementSibling;
    return n && test(n) ? n.dataset.file || n.id || "" : "";
  };

  document.addEventListener("dragstart", (e) => {
    if (!(e.target instanceof Element) || !e.dataTransfer) return;
    let name = "";
    const row = e.target.closest("li.file-row[data-file]");
    if (row) {
      dragging = { kind: "file", id: row.dataset.file, name: row.dataset.name, folder: row.dataset.folder, top: row.dataset.top, el: row };
      dragging.nextId = (row.nextElementSibling && row.nextElementSibling.dataset.file) || "";
      e.dataTransfer.setData(ROW, dragging.id);
      name = dragging.name || "File";
    } else {
      const head = e.target.closest("summary.folder-head, .subfolder.admin[id]:not(.loose) > .subfolder-head");
      const el = head && head.closest("details.folder, .subfolder.admin");
      if (!head || !el || !el.id) return;
      const body = el.matches("details.folder") ? el.querySelector(":scope > .folder-body") : el;
      dragging = { kind: "folder", id: el.id, name: (body && body.dataset.folderName) || "Folder", el };
      const next = siblingsOf(el).find((c) => el.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING);
      dragging.nextId = next ? next.id : "";
      e.dataTransfer.setData(FOLDER, dragging.id);
      name = dragging.name;
    }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", name);
    // A small card with the name under the pointer, instead of the browser's faded copy.
    const ghost = document.createElement("div");
    ghost.className = "drag-ghost";
    ghost.textContent = name;
    document.body.append(ghost);
    e.dataTransfer.setDragImage(ghost, 18, 18);
    setTimeout(() => ghost.remove(), 0);
    // It leaves its place a moment later (changing the page at once can cancel the drag).
    const el = dragging.el;
    setTimeout(() => {
      if (!dragging) return;
      el.classList.add("dragging");
      if (dragging.kind === "file") addLooseTargets();
    }, 0);
  });
  document.addEventListener("dragover", (e) => {
    if (!dragging || !e.dataTransfer) return;
    const types = Array.from(e.dataTransfer.types);
    const t = e.target instanceof Element ? e.target : null;
    if (dragging.kind === "file" && types.includes(ROW)) {
      zone = zoneAt(t);
      const closedFolder = t && t.closest("details.folder:not([open])");
      springOpen(closedFolder || (zone && zone.classList.contains("is-collapsed") ? zone : null));
      if (!zone) {
        e.dataTransfer.dropEffect = "none";
        return closeGaps();
      }
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      moveFileGap(zone, e.clientY);
    } else if (dragging.kind === "folder" && types.includes(FOLDER)) {
      // Only among its own siblings: the pointer has to be inside the folder (or the page) it lives in.
      if (!t || !dragging.el.parentElement.contains(t)) {
        e.dataTransfer.dropEffect = "none";
        return closeGaps();
      }
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      moveFolderGap(e.clientY);
    }
  });
  document.addEventListener("drop", (e) => {
    if (!dragging || !e.dataTransfer) return;
    const types = Array.from(e.dataTransfer.types);
    const d = dragging;
    if (d.kind === "folder" && types.includes(FOLDER)) {
      if (!folderGap.parentElement) return;
      e.preventDefault();
      const before = idOfNext(folderGap, (n) => isSibling(d.el, n));
      d.el.classList.remove("dragging");
      if (before === d.nextId) return closeGaps(); // dropped back where it was
      folderGap.replaceWith(d.el);
      send("/admin/folders/" + encodeURIComponent(d.id) + "/place", { before });
      return;
    }
    if (d.kind !== "file" || !types.includes(ROW)) return;
    const z = zoneAt(e.target) || zone;
    if (!z) return;
    e.preventDefault();
    let ran = false;
    const go = () => {
      ran = true;
      const row = d.el;
      const before = idOfNext(fileGap, (n) => n.matches("li.file-row"));
      row.classList.remove("dragging");
      if (z.dataset.dropFolder === d.folder && before === d.nextId) {
        closeGaps();
        return settleLooseTargets(); // dropped back where it was
      }
      const from = row.closest("[data-drop-folder]");
      row.dataset.folder = z.dataset.dropFolder;
      row.dataset.top = z.dataset.top;
      if (fileGap.parentElement) fileGap.replaceWith(row);
      else listOf(z, true).append(row);
      closeGaps();
      settleLooseTargets();
      if (from && from !== z) tidyBox(from);
      tidyBox(z);
      refreshTop(document.getElementById(d.top));
      refreshTop(document.getElementById(z.dataset.top));
      send("/admin/files/" + encodeURIComponent(d.id) + "/place", { folder_id: z.dataset.dropFolder, before });
    };
    if (z.dataset.top === d.top) return go();
    const place = z.dataset.folderName || "that folder";
    askFirst(
      `Move ${d.name} to ${place}? Investors with access to that folder will be able to see it (if it is Visible), and investors who only had access to where it was will no longer see it.`,
      { textContent: "Move" }, // the confirm button reads "Move", not "Continue"
      go,
    );
    // If you say no, put everything back as it was.
    const dlg = document.querySelector("dialog.confirm-dialog[open]");
    if (dlg)
      dlg.addEventListener("close", () => {
        if (ran) return;
        d.el.classList.remove("dragging");
        closeGaps();
        settleLooseTargets();
      });
  });
  document.addEventListener("dragend", () => {
    // Still waiting on the "are you sure" window? Keep the gap; it closes when that does.
    if (!document.querySelector("dialog.confirm-dialog[open]")) {
      document.querySelectorAll(".dragging").forEach((el) => el.classList.remove("dragging"));
      closeGaps();
      settleLooseTargets();
    }
    springOpen(null);
    zone = null;
    dragging = null;
  });
  // The upload window and the Edit slider: opened by their button; closed by Cancel, the cross, Escape,
  // or a click on the dimmed page around them. (Both press and release must be outside, so selecting
  // text in a field and letting go outside does not close it.)
  let pressedOutside = false;
  document.addEventListener("mousedown", (e) => {
    pressedOutside = e.target instanceof HTMLDialogElement;
  });
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const opener = t.closest("[data-upload-open]");
    if (opener instanceof HTMLElement) {
      const dlg = document.getElementById(opener.dataset.uploadOpen || "");
      if (dlg instanceof HTMLDialogElement && !dlg.open) dlg.showModal();
      return;
    }
    const closer = t.closest("[data-close]");
    if (closer) closer.closest("dialog")?.close();
    else if (t instanceof HTMLDialogElement && pressedOutside) t.close();
    pressedOutside = false;
  });

  // Each file chooser becomes one drop box: drag files onto it, or click it to choose. The real
  // input stays inside (invisible, covering the box), so keyboards and form checks still work.
  const svg = (d) => {
    const ns = "http://www.w3.org/2000/svg";
    const el = document.createElementNS(ns, "svg");
    el.setAttribute("viewBox", "0 0 24 24");
    el.setAttribute("width", "18");
    el.setAttribute("height", "18");
    el.setAttribute("fill", "none");
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("stroke-width", "2");
    el.setAttribute("stroke-linecap", "round");
    el.setAttribute("stroke-linejoin", "round");
    el.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    el.append(path);
    return el;
  };
  const span = (cls, text) => {
    const el = document.createElement("span");
    if (cls) el.className = cls;
    if (text) el.textContent = text;
    return el;
  };
  document.querySelectorAll("form input[type=file][name=files], form input[type=file][name=file]").forEach((input) => {
    const single = !input.multiple;
    const idleHint = !single ? "PDF, Excel, Word, images or video, up to 50 MB each" : input.hasAttribute("data-autosubmit") ? "One file. It replaces this placeholder." : input.required ? "One file. It replaces the current version." : "Optional. One file. It replaces the current version.";
    const box = document.createElement("label");
    box.className = "dz-box";
    const icon = span("dz-icon");
    icon.append(svg("M12 16V5m0 0l-4 4m4-4l4 4M5 16v2a1 1 0 001 1h12a1 1 0 001-1v-2"));
    const text = span("dz-text");
    const title = document.createElement("strong");
    const drag = span("dz-drag", single ? "Drag your file here or " : "Drag files here or ");
    const link = span("dz-link", "click to choose");
    title.append(drag, link);
    const hint = span("", idleHint);
    text.append(title, hint);
    input.replaceWith(box);
    box.append(icon, text, input);
    input.addEventListener("change", () => {
      const names = input.files ? Array.from(input.files, (f) => f.name) : [];
      if (!names.length) {
        title.replaceChildren(drag, link);
        hint.textContent = idleHint;
        box.classList.remove("has-files");
        return;
      }
      title.textContent = names.length > 2 ? `${names.length} files: ${names.slice(0, 2).join(", ")}, ...` : names.join(", ");
      hint.textContent = "Click to change";
      box.classList.add("has-files");
    });
  });
})();

// Copy a short link: the full address, ready to paste into an email or chat.
document.addEventListener("click", async (e) => {
  const b = e.target instanceof Element ? e.target.closest("[data-copy]") : null;
  if (!(b instanceof HTMLElement)) return;
  e.preventDefault(); // inside a folder header, copying must not fold the folder
  const url = location.origin + (b.dataset.copy || "");
  const icon = b.classList.contains("copy-icon");
  try {
    await navigator.clipboard.writeText(url);
    if (icon) b.classList.add("copied");
    else b.textContent = "Copied";
  } catch {
    window.prompt("Copy this link:", url);
    return;
  }
  setTimeout(() => (icon ? b.classList.remove("copied") : (b.textContent = "Copy link")), 1800);
});

// Folders on the Documents page fold up to one line. The browser remembers which, per room.
const folds = [...document.querySelectorAll("details[data-fold]")];
if (folds.length) {
  const KEY = "openroom.folded";
  const read = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {
      return new Set();
    }
  };
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(folds.filter((d) => !d.open).map((d) => d.id)));
    } catch {
      // Private mode or storage off: folding still works, it just is not remembered.
    }
  };
  const folded = read();
  // A link to a folder (#id, a short link, after an upload) always shows it open.
  const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  const targetFold = target ? target.closest("details[data-fold]") : null;
  for (const d of folds) if (folded.has(d.id) && d !== targetFold) d.open = false;
  if (targetFold) targetFold.scrollIntoView();
  for (const d of folds) d.addEventListener("toggle", save);
  const all = document.querySelector(".fold-all");
  if (all instanceof HTMLElement) all.hidden = false;
  document.addEventListener("click", (e) => {
    const b = e.target instanceof Element ? e.target.closest("[data-fold-all]") : null;
    if (!(b instanceof HTMLElement)) return;
    const open = b.dataset.foldAll === "open";
    for (const d of folds) d.open = open;
    save();
  });
}

// Subfolders fold up to their title bar too: click the arrow or the name. Remembered in this browser, and a
// link to something inside one (after an upload, say) always shows it open. "Expand all" opens these as well.
(() => {
  const boxes = [...document.querySelectorAll(".subfolder.admin[id]")];
  if (!boxes.length) return;
  const KEY = "openroom.folded-subfolders";
  const read = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {
      return new Set();
    }
  };
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(boxes.filter((b) => b.classList.contains("is-collapsed")).map((b) => b.id)));
    } catch {
      // Storage off: folding still works, it just is not remembered.
    }
  };
  const set = (box, collapsed) => {
    box.classList.toggle("is-collapsed", collapsed);
    const t = box.querySelector(".sub-toggle");
    if (t) t.setAttribute("aria-expanded", String(!collapsed));
  };
  const saved = read();
  const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  for (const b of boxes) if (saved.has(b.id) && !(target && b.contains(target))) set(b, true);
  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const all = e.target.closest("[data-fold-all]");
    if (all instanceof HTMLElement && all.dataset.foldAll === "open") {
      for (const b of boxes) set(b, false);
      save();
      return;
    }
    const head = e.target.closest(".subfolder.admin[id] > .subfolder-head");
    if (!head || !head.parentElement) return;
    // Only the arrow and the name fold it; the buttons and menus on the right do their own thing.
    if (e.target.closest(".subfolder-actions, .copy-icon, a")) return;
    if (!e.target.closest(".sub-toggle, .subfolder-title")) return;
    set(head.parentElement, !head.parentElement.classList.contains("is-collapsed"));
    save();
  });
})();

// Keep your place on the Documents page. After an upload (or any change there) the page reloads; put
// the screen back on the thing you were using, instead of snapping to the top of its folder.
(() => {
  const KEY = "openroom-keep-place";
  if (location.pathname !== "/admin") return;

  document.addEventListener(
    "submit",
    (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement) || form.method.toLowerCase() !== "post") return;
      const dlg = form.closest("dialog");
      const opener = dlg ? document.querySelector(`[data-upload-open="${dlg.id}"]`) : null;
      const section = form.closest(".subfolder.admin, details.folder");
      const mark = (el) => (el ? { top: el.getBoundingClientRect().top } : null);
      try {
        sessionStorage.setItem(
          KEY,
          JSON.stringify({
            at: Date.now(),
            y: window.scrollY,
            opener: opener ? { key: dlg.id, ...mark(opener) } : null,
            section: section && section.id ? { key: section.id, ...mark(section) } : null,
          }),
        );
      } catch {
        /* private mode: the page just loads where the browser puts it */
      }
    },
    true,
  );

  let saved = null;
  try {
    saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
    sessionStorage.removeItem(KEY);
  } catch {
    saved = null;
  }
  if (!saved || Date.now() - saved.at > 20000) return;
  // No jump to the folder's anchor: we put the screen back ourselves.
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  const put = () => {
    const byOpener = saved.opener && document.querySelector(`[data-upload-open="${saved.opener.key}"]`);
    const bySection = saved.section && document.getElementById(saved.section.key);
    const el = byOpener || bySection;
    const was = byOpener ? saved.opener.top : bySection ? saved.section.top : null;
    const y = el && was !== null ? el.getBoundingClientRect().top + window.scrollY - was : saved.y;
    window.scrollTo(0, Math.max(0, y));
  };
  put();
  requestAnimationFrame(put);
  window.addEventListener("load", () => requestAnimationFrame(put), { once: true });
})();
