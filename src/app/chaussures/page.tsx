import type { Metadata } from 'next';
import { getShoeArchiveItems } from '@/lib/shoeArchive';
import ShoeArchive3D from '@/components/ShoeArchive3D';

export const metadata: Metadata = {
  title: 'Shoe Archive 3D | Tous nos Tests Chaussures | RunPassion',
  description:
    'Explorez en 3D l’archive interactive des chaussures de running et de trail testées par RunPassion : poids, drop, stack, notes et meilleures offres.',
};

export default function ChaussuresArchivePage() {
  const items = getShoeArchiveItems();

  return <ShoeArchive3D items={items} />;
}
