import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

describe('Avatar Component', () => {
  // Note: Testing actual image loading in jsdom is unreliable.
  // These tests primarily check if the fallback renders correctly based on props.

  it('should render AvatarFallback when src is provided (jsdom behavior)', () => {
    render(
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="User Avatar" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    );

    // In jsdom, the image might not load, so the fallback is often rendered immediately.
    // We check for the fallback text.
    expect(screen.getByText('CN')).toBeInTheDocument();
    // We can't reliably find the <img> tag by alt text in this scenario.
  });

  it('should render AvatarFallback when src is invalid or missing', () => {
    render(
      <Avatar>
        <AvatarImage src="/invalid-path.jpg" alt="User Avatar" />
        <AvatarFallback>FB</AvatarFallback>
      </Avatar>
    );

    // Check if the fallback text is rendered
    expect(screen.getByText('FB')).toBeInTheDocument();
    // The img element might exist but fail to load, or not exist at all depending on implementation.
    // Avoid asserting its presence if the fallback is the primary expectation.
    expect(screen.queryByAltText('User Avatar')).toBeNull(); // Expect image not to be found when fallback is shown
  });

   it('should render AvatarFallback when no image is provided', () => {
    render(
      <Avatar>
        <AvatarFallback>NA</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText('NA')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull(); // No image role should be present
  });
});