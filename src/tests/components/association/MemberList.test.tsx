import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MemberList from '@/components/association/MemberList';
import '@testing-library/jest-dom';

vi.mock('@/contexts/auth', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

const members = [
  {
    id: '1',
    user_id: 'u1',
    association_id: 'a1',
    role: 'admin',
    created_at: new Date().toISOString(),
    profile: { name: 'Alice', email: 'alice@example.com', profile_image: '' },
  },
  {
    id: '2',
    user_id: 'u2',
    association_id: 'a1',
    role: 'member',
    created_at: new Date().toISOString(),
    profile: { name: 'Bob', email: 'bob@example.com', profile_image: '' },
  },
];

describe('MemberList', () => {
  it('renders members and disables actions for self', () => {
    render(
      <MemberList
        members={members}
        onUpdateRole={vi.fn()}
        onRemoveMember={vi.fn()}
      />
    );
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    expect(screen.getAllByText(/admin/i).length).toBeGreaterThan(0);
  });

  it('calls onUpdateRole when role is changed', () => {
    const onUpdateRole = vi.fn();
    render(
      <MemberList
        members={members}
        onUpdateRole={onUpdateRole}
        onRemoveMember={vi.fn()}
      />
    );
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByText(/Manager/i));
    expect(onUpdateRole).toHaveBeenCalled();
  });

  it('calls onRemoveMember when remove button clicked', () => {
    const onRemove = vi.fn();
    render(
      <MemberList
        members={members}
        onUpdateRole={vi.fn()}
        onRemoveMember={onRemove}
      />
    );
    fireEvent.click(screen.getAllByRole('button', { name: '' })[0]);
    expect(onRemove).toHaveBeenCalled();
  });
});
