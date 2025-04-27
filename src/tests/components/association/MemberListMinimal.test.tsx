import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MemberListMinimal from '@/components/association/MemberListMinimal';
import React from 'react';

const members = Array.from({ length: 7 }).map((_, i) => ({
  id: String(i),
  user_id: `u${i}`,
  role: i % 2 === 0 ? 'member' : 'admin',
  created_at: new Date().toISOString(),
  profile: { name: `User${i}`, email: `user${i}@mail.com`, profile_image: '' },
}));

describe('MemberListMinimal', () => {
  it('renders up to 5 members', () => {
    render(<MemberListMinimal members={members.slice(0, 5)} />);
    expect(screen.getByText(/User0/)).toBeInTheDocument();
    expect(screen.queryByText(/\+2 more members/)).not.toBeInTheDocument();
  });

  it('shows "+N more members" if more than 5', () => {
    render(<MemberListMinimal members={members} />);
    expect(screen.getByText(/\+2 more members/)).toBeInTheDocument();
  });
});
