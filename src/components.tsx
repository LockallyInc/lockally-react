import { useState, type FormEvent } from 'react';
import {
  fileToAttachment,
  type Attachment,
  type Contact,
  type SendMessage,
  type SendResult,
  type Signature,
  type Template,
} from '@lockally/ui-core';
import { useLockally } from './context.js';
import { useContacts, useTemplates } from './hooks.js';

// Components are intentionally lightly styled — every element carries a
// `data-lockally="…"` hook and accepts a `className` so you can theme with your
// own CSS. No stylesheet is required.

function splitAddresses(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── ContactPicker ────────────────────────────────────────────────────────────

export interface ContactPickerProps {
  onSelect: (contact: Contact) => void;
  placeholder?: string;
  className?: string;
}

export function ContactPicker({ onSelect, placeholder = 'Search contacts…', className }: ContactPickerProps) {
  const [q, setQ] = useState('');
  const { data, loading } = useContacts(q.trim() ? q.trim() : undefined);

  return (
    <div className={className} data-lockally="contact-picker">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Search contacts"
      />
      <ul data-lockally="contact-list">
        {loading && <li data-lockally="loading">Loading…</li>}
        {!loading &&
          data.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onSelect(c)}>
                {c.name ? `${c.name} <${c.email}>` : c.email}
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}

// ── TemplateSelector ─────────────────────────────────────────────────────────

export interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
  className?: string;
}

export function TemplateSelector({ onSelect, className }: TemplateSelectorProps) {
  const { data, loading } = useTemplates();
  return (
    <select
      className={className}
      data-lockally="template-selector"
      aria-label="Choose a template"
      disabled={loading}
      defaultValue=""
      onChange={(e) => {
        const t = data.find((x) => x.id === e.target.value);
        if (t) onSelect(t);
      }}
    >
      <option value="" disabled>
        {loading ? 'Loading templates…' : 'Choose a template…'}
      </option>
      {data.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}

// ── SignaturePicker (prop-driven; Lockally has no public signatures API) ───────

export interface SignaturePickerProps {
  signatures: Signature[];
  onSelect: (signature: Signature) => void;
  className?: string;
}

export function SignaturePicker({ signatures, onSelect, className }: SignaturePickerProps) {
  return (
    <select
      className={className}
      data-lockally="signature-picker"
      aria-label="Choose a signature"
      defaultValue=""
      onChange={(e) => {
        const s = signatures.find((x) => x.id === e.target.value);
        if (s) onSelect(s);
      }}
    >
      <option value="" disabled>
        Choose a signature…
      </option>
      {signatures.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}

// ── AttachmentUpload ─────────────────────────────────────────────────────────

export interface AttachmentUploadProps {
  value?: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  className?: string;
}

export function AttachmentUpload({ value = [], onChange, className }: AttachmentUploadProps) {
  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added = await Promise.all(Array.from(files).map(fileToAttachment));
    onChange([...value, ...added]);
  };

  return (
    <div className={className} data-lockally="attachment-upload">
      <input type="file" multiple aria-label="Add attachments" onChange={(e) => onFiles(e.target.files)} />
      <ul data-lockally="attachment-list">
        {value.map((a, i) => (
          <li key={`${a.filename}-${i}`}>
            <span>{a.filename}</span>
            <button
              type="button"
              aria-label={`Remove ${a.filename}`}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── EmailComposer ────────────────────────────────────────────────────────────

export interface EmailComposerProps {
  defaultFrom?: string;
  defaultTo?: string;
  /** Optional signatures for the built-in SignaturePicker (prop-driven). */
  signatures?: Signature[];
  onSent?: (result: SendResult) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function EmailComposer({
  defaultFrom = '',
  defaultTo = '',
  signatures,
  onSent,
  onError,
  className,
}: EmailComposerProps) {
  const client = useLockally();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(undefined);
    try {
      const message: SendMessage = {
        from,
        to: splitAddresses(to),
        ...(cc.trim() ? { cc: splitAddresses(cc) } : {}),
        ...(subject ? { subject } : {}),
        // A selected template drives the body; otherwise send the HTML body.
        ...(templateId ? { template_id: templateId } : { html: body }),
        ...(attachments.length ? { attachments } : {}),
      };
      const result = await client.send(message);
      onSent?.(result);
      setBody('');
      setAttachments([]);
      setTemplateId(undefined);
    } catch (err) {
      const e2 = err as Error;
      setError(e2.message);
      onError?.(e2);
    } finally {
      setSending(false);
    }
  };

  return (
    <form className={className} data-lockally="email-composer" onSubmit={submit}>
      <input aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" />
      <input
        aria-label="To"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        placeholder="To (comma-separated)"
      />
      <input aria-label="Cc" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="Cc" />
      <input aria-label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
      <TemplateSelector
        onSelect={(t) => {
          setTemplateId(t.id);
          if (t.subject) setSubject(t.subject);
          if (t.html) setBody(t.html);
        }}
      />
      <textarea
        aria-label="Body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your message…"
      />
      {signatures && signatures.length > 0 ? (
        <SignaturePicker signatures={signatures} onSelect={(s) => setBody((b) => b + s.html)} />
      ) : null}
      <AttachmentUpload value={attachments} onChange={setAttachments} />
      {error ? (
        <p role="alert" data-lockally="error">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={sending || !from || !to.trim()}>
        {sending ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
}
