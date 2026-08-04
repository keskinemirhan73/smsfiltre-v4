import { notFound } from 'next/navigation';

export default function DeprecatedPublicAdminPage() {
  // Public /admin route is permanently disabled and returns 404
  notFound();
}
