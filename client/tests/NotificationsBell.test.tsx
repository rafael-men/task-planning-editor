import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import NotificationsBell from '../src/components/ui/NotificationsBell';

const mockNotifications = [
  {
    id: 'n1',
    title: 'Playbook criado',
    body: 'Um novo playbook foi criado',
    created_at: new Date().toISOString(),
    read: false,
  },
];

class MockEventSource {
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  url: string;

  constructor(url: string) {
    this.url = url;
    (globalThis as any).__mockEventSource = this;
  }

  close() {}
}

describe('NotificationsBell', () => {
  beforeEach(() => {
    (globalThis as any).fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockNotifications) })
    );
    (globalThis as any).EventSource = MockEventSource as any;
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete (globalThis as any).__mockEventSource;
  });

  it('shows badge with unread count and opens menu with notification', async () => {
    render(<NotificationsBell />);

    expect(await screen.findByText('1')).toBeInTheDocument();

    const btn = screen.getByLabelText('Notificações');
    fireEvent.click(btn);

    expect(await screen.findByText('Playbook criado')).toBeInTheDocument();
  });

  it('marks notification as read when clicked and badge disappears', async () => {
    render(<NotificationsBell />);

    const btn = await screen.findByLabelText('Notificações');
    fireEvent.click(btn);

    const item = await screen.findByText('Playbook criado');
    fireEvent.click(item);

    await waitFor(() => {
      expect(screen.queryByRole('badge')).not.toBeInTheDocument();
    });
  });

  it('receives SSE messages and prepends new notifications', async () => {
    render(<NotificationsBell />);

    expect(await screen.findByText('1')).toBeInTheDocument();

    const es = (globalThis as any).__mockEventSource as MockEventSource;
    const newNotif = {
      id: 'n2',
      title: 'Onboarding criado',
      body: 'Novo onboarding',
      created_at: new Date().toISOString(),
      read: false,
    };

    await act(async () => {
      es.onmessage?.({ data: JSON.stringify({ notification: newNotif }) });
    });

    expect(await screen.findByText('2')).toBeInTheDocument();
  });
});
