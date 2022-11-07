import type { ReactNode } from 'react';
// components
import AccordionItem from 'components/accordionItem';

interface Item {
  body: ReactNode;
  heading: string;
}

type Props = {
  border?: boolean;
  items: Item[];
  multiSelect?: boolean;
  styles?: string[];
};

export default function Accordion({
  border = false,
  items,
  multiSelect = true,
  styles = [],
}: Props) {
  const accordionStyles = [...styles];
  if (multiSelect) accordionStyles.push('usa-accordion--multiselectable');
  if (border) accordionStyles.push('usa-accordion--bordered');

  return (
    <div
      className={`usa-accordion ${accordionStyles.join(' ')}`}
      data-allow-multiple={multiSelect}
    >
      {items.map((item, i) => (
        <AccordionItem heading={item.heading} key={i}>
          {item.body}
        </AccordionItem>
      ))}
    </div>
  );
}
