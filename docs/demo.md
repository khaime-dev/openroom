# The live demo

`demo/` is a self-contained, static copy of Openroom for people who want to look around before they install anything. It is plain HTML, CSS and JavaScript: no server, no database, no build step, about 60 KB of its own code on top of the app's stylesheet.

- Open it and click **Enter the demo room** (the investor's view) or **See the admin side**.
- Everything runs in the browser. The sample company ("Lumen Harbor"), folders, documents, investors and activity are in [`demo/data.js`](../demo/data.js). Reload the page and it is back to the start. Nothing is saved or sent anywhere.
- You can click through folders and documents, open the admin pages (Documents, Investors, Activity, Settings, Templates, Preview), flip download switches, tick which folders an investor can see, hide a file, add a folder or an investor, replace a template placeholder. Things the real room would do on a server (send an invite, upload a file, download) show a short "this is a demo" note instead.
- A banner on every page says "This is a demo. Nothing here is real." with a **Get your own** link.
- It is separate from the real app. Nothing in `src/`, the tests, Docker or the Cloudflare deploy uses it or changes because of it.

## Try it on your computer

```bash
python3 -m http.server 8788 --directory demo
```

Then open http://localhost:8788. Any static file server works.

## Publish it at openroomdemo.buildwithgabe.io

Publish the `demo/` folder as plain static files. Pick one host.

### Cloudflare Pages (recommended)

1. In the Cloudflare dashboard open **Workers & Pages → Create → Pages → Connect to Git** and pick the `plato15/openroom` repository.
2. Set **Production branch** to `main`, **Build command** to nothing, and **Build output directory** to `demo`. Save and deploy.
3. Open the new Pages project, then **Custom domains → Set up a custom domain** and enter `openroomdemo.buildwithgabe.io`.
4. If `buildwithgabe.io` is a Cloudflare zone in the same account, Cloudflare adds the DNS record by itself. First delete the existing `openroomdemo` record that points at the parked host, or Cloudflare will say the name is already in use. If the domain's DNS is elsewhere, add a `CNAME` record for `openroomdemo` pointing at `<project>.pages.dev` and wait for the certificate.
5. Open https://openroomdemo.buildwithgabe.io. Every later push to `main` that changes `demo/` redeploys it.

### GitHub Pages

1. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Open the **Actions** tab, choose **Publish the demo**, and click **Run workflow**. It publishes the `demo/` folder.
3. Back in **Settings → Pages**, under **Custom domain**, enter `openroomdemo.buildwithgabe.io` and save.
4. At the DNS provider for `buildwithgabe.io`, replace the existing `openroomdemo` record with a `CNAME` pointing at `plato15.github.io`.
5. When GitHub's DNS check passes, tick **Enforce HTTPS**.

## Changing the demo

- **The story and the numbers:** edit `demo/data.js`.
- **How it behaves:** `demo/demo.js` (one file, no framework).
- **The look** comes from the app's own stylesheet. After changing `public/static/app.css`, run `node demo/sync.mjs` to refresh the copy in `demo/`.
- Keep the demo light: it should stay quick on a weak connection, so no frameworks and no large files.
