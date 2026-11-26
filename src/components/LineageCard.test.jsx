import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import LineageCard from './LineageCard';

vi.mock('../data/imageLoader', () => ({
  getFolderPhotos: () => [],
  getPhoto: (folder, name) => ({ name, src: `/${name}`, srcSet: `/${name} 1280w`, thumb: `/${name}` }),
}));

const lineage = {
  source: 'Wisdom Panel',
  sourceUrl: 'https://www.wisdompanel.com',
  tested: 'Bear',
  testedFrom: "Coco & Leo's first litter",
  photo: 'bear.jpg',
  breeds: { poodle: 47, havanese: 37, bichon: 13, other: 3 },
};

const renderCard = (fields = {}) => render(
  <LineageCard lineage={{ ...lineage, ...fields }} mom={{ name: 'Coco' }} dad={{ name: 'Leo' }} />,
);

test('starts closed, showing only the headline, the bar and the way in', () => {
  const { container } = renderCard();
  expect(container.querySelector('details')).not.toHaveAttribute('open');
  expect(screen.getByText('DNA-confirmed Havapoo pairing')).toBeVisible();
  expect(screen.getByRole('img', { name: '84% Poodle and Havanese, 13% Bichon family, 3% other' })).toBeInTheDocument();
  expect(screen.getByText('Bichon family')).not.toBeVisible();
});

test('opens on a tap of the summary, with the breakdown, the points and the cited source', () => {
  const { container } = renderCard();
  fireEvent.click(container.querySelector('summary'));
  expect(container.querySelector('details')).toHaveAttribute('open');
  expect(screen.getByText('Every puppy is half Coco, half Leo, so they all come from this same Poodle × Havanese line.')).toBeVisible();
  expect(screen.getByText('Applies to this litter and every future Coco × Leo litter.')).toBeVisible();
  expect(container.querySelector('.lineage-source')).toHaveTextContent('1 Wisdom Panel, breed ancestry results for Bear.');
  expect(screen.getByRole('link', { name: 'Wisdom Panel' })).toHaveAttribute('href', 'https://www.wisdompanel.com');
});

test('a 0% breed leaves no empty segment in the bar', () => {
  const { container } = renderCard({ breeds: { poodle: 50, havanese: 40, bichon: 10, other: 0 } });
  expect(container.querySelectorAll('.lineage-bar-segment')).toHaveLength(3);
});

test('without a sourceUrl the test is named as plain text', () => {
  renderCard({ sourceUrl: undefined });
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
