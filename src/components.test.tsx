import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { LockallyClient } from '@lockally/ui-core';
import { LockallyProvider } from './context.js';
import { ContactPicker, EmailComposer, SignaturePicker, TemplateSelector } from './components.js';

afterEach(cleanup);

function mockClient(overrides: Partial<LockallyClient> = {}): LockallyClient {
  return {
    send: vi.fn(async () => ({ id: 'm_1', message_id: '<x@lockally.com>', status: 'queued' as const })),
    listContacts: vi.fn(async () => []),
    listTemplates: vi.fn(async () => []),
    ...overrides,
  } as unknown as LockallyClient;
}

function renderWith(client: LockallyClient, ui: React.ReactElement) {
  return render(<LockallyProvider client={client}>{ui}</LockallyProvider>);
}

describe('EmailComposer', () => {
  it('maps fields to /v1/send and fires onSent', async () => {
    const client = mockClient();
    const onSent = vi.fn();
    renderWith(client, <EmailComposer defaultFrom="alerts@acme.com" defaultTo="user@example.com" onSent={onSent} />);

    fireEvent.change(screen.getByLabelText('Cc'), { target: { value: 'cc@example.com' } });
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Welcome' } });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: '<b>hi</b>' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(client.send).toHaveBeenCalledTimes(1));
    expect(client.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'alerts@acme.com',
        to: ['user@example.com'],
        cc: ['cc@example.com'],
        subject: 'Welcome',
        html: '<b>hi</b>',
      }),
    );
    await waitFor(() => expect(onSent).toHaveBeenCalledWith(expect.objectContaining({ id: 'm_1' })));
  });

  it('shows an error and calls onError when send fails', async () => {
    const client = mockClient({
      send: vi.fn(async () => {
        throw new Error('insufficient scope: send:write');
      }) as unknown as LockallyClient['send'],
    });
    const onError = vi.fn();
    renderWith(client, <EmailComposer defaultFrom="a@a.com" defaultTo="b@b.com" onError={onError} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('insufficient scope'));
    expect(onError).toHaveBeenCalled();
  });
});

describe('ContactPicker', () => {
  it('searches and selects a contact', async () => {
    const client = mockClient({
      listContacts: vi.fn(async () => [{ id: 'c1', name: 'Ada', email: 'ada@acme.com' }]) as unknown as LockallyClient['listContacts'],
    });
    const onSelect = vi.fn();
    renderWith(client, <ContactPicker onSelect={onSelect} />);

    fireEvent.change(screen.getByLabelText('Search contacts'), { target: { value: 'ada' } });
    const item = await screen.findByRole('button', { name: 'Ada <ada@acme.com>' });
    fireEvent.click(item);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ email: 'ada@acme.com' }));
  });
});

describe('TemplateSelector', () => {
  it('renders templates and fires onSelect', async () => {
    const client = mockClient({
      listTemplates: vi.fn(async () => [{ id: 't1', name: 'Welcome' }]) as unknown as LockallyClient['listTemplates'],
    });
    const onSelect = vi.fn();
    renderWith(client, <TemplateSelector onSelect={onSelect} />);
    await screen.findByRole('option', { name: 'Welcome' });
    fireEvent.change(screen.getByLabelText('Choose a template'), { target: { value: 't1' } });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 't1' }));
  });
});

describe('SignaturePicker', () => {
  it('is prop-driven and fires onSelect', () => {
    const onSelect = vi.fn();
    render(<SignaturePicker signatures={[{ id: 's1', name: 'Default', html: '<p>— Ada</p>' }]} onSelect={onSelect} />);
    fireEvent.change(screen.getByLabelText('Choose a signature'), { target: { value: 's1' } });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ html: '<p>— Ada</p>' }));
  });
});
