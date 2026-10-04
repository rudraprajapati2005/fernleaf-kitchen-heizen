import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src/features/auth/auth-provider';
import { LoginForm } from '../src/features/auth/login-form';
import { AppShell } from '../src/features/shell/app-shell';

function AuthenticatedTestView() {
  const { status } = useAuth();
  return status === 'authenticated' ? <AppShell /> : <LoginForm />;
}

describe('login flow', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('shows invalid credentials from the API', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValueOnce(
      {
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid email or password' } }),
      },
    );
    fetchMock.mockResolvedValueOnce(
      {
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid email or password' } }),
      },
    );

    render(
      <AuthProvider>
        <AuthenticatedTestView />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByLabelText('Work email')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Work email'), {
      target: { value: 'staff@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to dashboard' }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  it('shows the authenticated workspace after successful login', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockRejectedValueOnce(new Error('not authenticated'));
    fetchMock.mockResolvedValueOnce(
      {
        ok: true,
        status: 201,
        json: async () => ({
          user: { id: 'user_1', email: 'staff@example.com', name: 'Staff', role: 'ADMIN' },
        }),
      },
    );

    render(
      <AuthProvider>
        <AuthenticatedTestView />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByLabelText('Work email')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Work email'), {
      target: { value: 'staff@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to dashboard' }));

    expect(await screen.findByText('Kitchen ops')).toBeInTheDocument();
  });
});
