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

  // Drag a file row onto another folder or subfolder to move it there. (Uploads are the "Files" drags
  // above; this one carries its own type, so the two never mix.) Moving to a different top-level
  // folder changes who can see the file, so that asks first.
  const ROW = "application/x-openroom-file";
  let dragging = null;
  let over = null;
  const lightMove = (zone) => {
    if (over === zone) return;
    if (over) over.classList.remove("move-over");
    over = zone;
    if (over) over.classList.add("move-over");
  };
  const moveZone = (t) => {
    const zone = t instanceof Element ? t.closest("[data-drop-folder]") : null;
    return zone && dragging && zone.dataset.dropFolder !== dragging.folder ? zone : null;
  };
  document.addEventListener("dragstart", (e) => {
    const row = e.target instanceof Element ? e.target.closest("li.file-row[data-file]") : null;
    if (!row || !e.dataTransfer) return;
    dragging = { id: row.dataset.file, name: row.dataset.name, folder: row.dataset.folder, top: row.dataset.top };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(ROW, dragging.id);
    e.dataTransfer.setData("text/plain", dragging.name || "");
    row.classList.add("dragging");
  });
  document.addEventListener("dragover", (e) => {
    if (!dragging || !e.dataTransfer || !Array.from(e.dataTransfer.types).includes(ROW)) return;
    const zone = moveZone(e.target);
    if (zone) e.preventDefault();
    e.dataTransfer.dropEffect = zone ? "move" : "none";
    lightMove(zone);
  });
  document.addEventListener("drop", (e) => {
    if (!dragging || !e.dataTransfer || !Array.from(e.dataTransfer.types).includes(ROW)) return;
    const zone = moveZone(e.target);
    const file = dragging;
    lightMove(null);
    if (!zone) return;
    e.preventDefault();
    const go = () => {
      const form = document.createElement("form");
      form.method = "post";
      form.action = "/admin/files/" + encodeURIComponent(file.id);
      for (const [name, value] of [["action", "move"], ["folder_id", zone.dataset.dropFolder]]) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.append(input);
      }
      document.body.append(form);
      form.submit();
    };
    if (zone.dataset.top === file.top) return go();
    const place = zone.dataset.folderName || "that folder";
    askFirst(
      `Move ${file.name} to ${place}? Investors with access to that folder will be able to see it (if it is Visible), and investors who only had access to where it was will no longer see it.`,
      { textContent: "Move" }, // the confirm button reads "Move", not "Continue"
      go,
    );
  });
  document.addEventListener("dragend", () => {
    document.querySelectorAll(".dragging").forEach((el) => el.classList.remove("dragging"));
    lightMove(null);
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
