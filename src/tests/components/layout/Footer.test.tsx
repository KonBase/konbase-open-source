import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/layout/Footer'; // Adjust path
import React from 'react';

describe('Footer', () => {
  it('renders logo, links, and copyright', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();

    expect(screen.getByAltText('KonBase Logo')).toBeInTheDocument();
    expect(screen.getByText('KonBase')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
    expect(screen.getByLabelText('Discord')).toBeInTheDocument();
    expect(screen.getByLabelText('Buy Me a Coffee')).toBeInTheDocument();
    expect(screen.getByText(`© ${currentYear} KonBase`)).toBeInTheDocument();
    expect(screen.getByText('Terms')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText(/Built with/)).toBeInTheDocument(); // Check for "Built with" text
  });

  it('links point to correct URLs', () => {
    render(<Footer />);
    expect(screen.getByLabelText('GitHub').closest('a')).toHaveAttribute('href', 'https://github.com/KonBase/konbase-open-source');
    expect(screen.getByLabelText('Discord').closest('a')).toHaveAttribute('href', 'https://discord.gg/wt6JYqBRzU');
    expect(screen.getByLabelText('Buy Me a Coffee').closest('a')).toHaveAttribute('href', 'https://buymeacoffee.com/konbase');
    expect(screen.getByText('Terms').closest('a')).toHaveAttribute('href', 'https://konbase.cfd/terms-of-service');
    expect(screen.getByText('Privacy').closest('a')).toHaveAttribute('href', 'https://konbase.cfd/privacy-policy');
  });
});
