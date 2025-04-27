import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MemberManager from '@/components/association/MemberManager';

const mockMembers = [
  {
    id: '1',
    user_id: 'u1',
    association_id: 'a1',
    role: 'member' as 'member' | 'admin',
    created_at: new Date().toISOString(),
    profile: { id: 'p1', name: 'Alice', email: 'alice@example.com', profile_image: '' },
  },
  {
    id: '2',
    user_id: 'u2',
    association_id: 'a1',
    role: 'admin' as 'member' | 'admin',
    created_at: new Date().toISOString(),
    profile: { id: 'p2', name: 'Bob', email: 'bob@example.com', profile_image: '' },
  },
];

describe('MemberManager', () => {
  it('renders loading state', () => {
    render(
      <MemberManager
        associationId="a1"
        members={[]}
        loading={true}
        onUpdateRole={vi.fn()}
        onRemoveMember={vi.fn()}
      />
    );
    expect(screen.getByText(/Association Members/i)).toBeInTheDocument();
  });

  it('renders minimal member list', () => {
    render(
      <MemberManager
        associationId="a1"
        members={mockMembers}
        loading={false}
        onUpdateRole={vi.fn()}
        onRemoveMember={vi.fn()}
        minimal={true}
      />
    );
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  it('renders full member list', () => {
    render(
      <MemberManager
        associationId="a1"
        members={mockMembers}
        loading={false}
        onUpdateRole={vi.fn()}
        onRemoveMember={vi.fn()}
      />
    );
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  it('calls onInviteMember when button clicked', () => {
    const onInvite = vi.fn();
    render(
      <MemberManager
        associationId="a1"
        members={mockMembers}
        loading={false}
        onUpdateRole={vi.fn()}
        onRemoveMember={vi.fn()}
        onInviteMember={onInvite}
      />
    );
    fireEvent.click(screen.getByText(/Invite Member/i));
    expect(onInvite).toHaveBeenCalled();
  });
});
