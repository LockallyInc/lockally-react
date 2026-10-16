<!-- lockally-brand-header -->
<p align="center">
  <a href="https://lockally.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/LockallyInc/community/main/brand/lockup-dark.png">
      <img alt="Lockally" src="https://raw.githubusercontent.com/LockallyInc/community/main/brand/lockup-light.png" width="260">
    </picture>
  </a>
</p>
<!-- /lockally-brand-header -->

# @lockally/react

Official [Lockally](https://lockally.com) React components — drop an email composer,
contact picker, attachment uploader, template selector, and signature picker into your
app.

```bash
npm install @lockally/react
```

## Secure setup

Browser code must **never** hold a secret `lk_live_` key. Wrap your app in
`LockallyProvider` and give it a `getToken()` that returns a **short-lived bearer minted
by your backend** (which holds the secret key):

```tsx
import { LockallyProvider } from '@lockally/react';

<LockallyProvider getToken={async () => (await fetch('/api/lockally-token')).json().then(r => r.token)}>
  <App />
</LockallyProvider>
```

Or point it at your own proxy and pass no token:

```tsx
<LockallyProvider baseUrl="/api/lockally"><App /></LockallyProvider>
```

## Components

```tsx
import { EmailComposer } from '@lockally/react';

<EmailComposer
  defaultFrom="alerts@yourapp.com"
  onSent={(res) => console.log('sent', res.id)}
/>
```

| Component | What it does |
|---|---|
| `<EmailComposer />` | Full compose form → `POST /v1/send` (to/cc/subject/body, attachments, template + signature). |
| `<ContactPicker onSelect />` | Search contacts (`GET /v1/contacts`). |
| `<TemplateSelector onSelect />` | Pick a stored template (`GET /v1/templates`). |
| `<AttachmentUpload value onChange />` | Turn files into `attachments[]` (client-side base64). |
| `<SignaturePicker signatures onSelect />` | Insert a signature. **Prop-driven** — Lockally has no public signatures API, so you pass the list. |

There are also hooks — `useContacts(q)`, `useTemplates()`, `useLockally()` — if you'd
rather build your own UI.

Every element carries a `data-lockally="…"` attribute and accepts `className`, so you
style them with your own CSS — no stylesheet is bundled.

## License

MIT © Lockally
