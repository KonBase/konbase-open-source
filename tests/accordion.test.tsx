import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

describe('Accordion Component', () => {
  it('should render accordion items and reveal content on click', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>
            Yes. It adheres to the WAI-ARIA design pattern.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Is it styled?</AccordionTrigger>
          <AccordionContent>
            Yes. It comes with default styles that matches the other components' aesthetic.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    const trigger1 = screen.getByRole('button', { name: /is it accessible/i });
    const trigger2 = screen.getByRole('button', { name: /is it styled/i });

    expect(trigger1).toBeInTheDocument();
    expect(trigger2).toBeInTheDocument();

    // Content should not be in the DOM initially (or hidden, queryByText returns null if not found)
    expect(screen.queryByText("Yes. It adheres to the WAI-ARIA design pattern.")).toBeNull();
    expect(screen.queryByText("Yes. It comes with default styles that matches the other components' aesthetic.")).toBeNull();

    // Click the first trigger
    fireEvent.click(trigger1);

    // First content should be visible, second should not be found (or not visible)
    expect(screen.getByText("Yes. It adheres to the WAI-ARIA design pattern.")).toBeVisible();
    expect(screen.queryByText("Yes. It comes with default styles that matches the other components' aesthetic.")).toBeNull();

    // Click the second trigger (since type="single", first should close)
    fireEvent.click(trigger2);

    // Second content should be visible, first should not be visible/found
    expect(screen.queryByText("Yes. It adheres to the WAI-ARIA design pattern.")).toBeNull();
    expect(screen.getByText("Yes. It comes with default styles that matches the other components' aesthetic.")).toBeVisible();
  });

  // Add more tests for interaction, multiple items, etc.
});