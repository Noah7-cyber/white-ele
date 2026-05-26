'use client';

export interface Parent {
  id: string;
  firstName: string;
  lastName?: string;
  relationship: string;
  email?: string;
  phone?: string;
  address?: string;
}

export function useParent() {
  const defaultParents: Parent[] = [
    {
      id: 'p1',
      firstName: 'Michael',
      lastName: 'Johnson',
      relationship: 'Father',
      email: 'sgc@gmail.com',
      phone: '09023456789',
      address: '123 Maple Street, Springfield',
    },
    {
      id: 'p2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      relationship: 'Mother',
      email: 'sgc@gmail.com',
      phone: '09023456789',
      address: '123 Maple Street, Springfield',
    },
  ];
  return { defaultParents };
}
