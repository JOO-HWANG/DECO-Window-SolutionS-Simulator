
import { FabricCompany, ProductType } from './types';

export const MOCK_DATA: Record<ProductType, FabricCompany[]> = {
  [ProductType.VerticalBlinds]: [
    {
      id: 'vb-fc1',
      name: 'Sun-Kissed Fabrics',
      products: [
        {
          id: 'vb-p1',
          name: 'Classic Vinyl',
          colors: [
            { id: 'vb-c1', name: 'Alabaster White', hex: '#F0EBE3' },
            { id: 'vb-c2', name: 'Urban Grey', hex: '#A9A9A9' },
            { id: 'vb-c3', name: 'Coastal Beige', hex: '#EED9C4' },
          ],
        },
        {
          id: 'vb-p2',
          name: 'Textured Weave',
          colors: [
            { id: 'vb-c4', name: 'Oatmeal', hex: '#D2B48C' },
            { id: 'vb-c5', name: 'Charcoal', hex: '#36454F' },
          ],
        },
      ],
    },
  ],
  [ProductType.RollerBlinds]: [
    {
      id: 'rb-fc1',
      name: 'Modern Shade Co.',
      products: [
        {
          id: 'rb-p1',
          name: 'Blackout Pro',
          colors: [
            { id: 'rb-c1', name: 'Midnight Blue', hex: '#003366' },
            { id: 'rb-c2', name: 'Pure White', hex: '#FFFFFF' },
            { id: 'rb-c3', name: 'Slate Grey', hex: '#708090' },
          ],
        },
        {
          id: 'rb-p2',
          name: 'Light-Filtering Linen',
          colors: [
            { id: 'rb-c4', name: 'Natural Linen', hex: '#FAF0E6' },
            { id: 'rb-c5', name: 'Seafoam Green', hex: '#93E9BE' },
          ],
        },
      ],
    },
     {
      id: 'rb-fc2',
      name: 'Eco Weaves',
      products: [
        {
          id: 'rb-p3',
          name: 'Recycled Fiber',
          colors: [
            { id: 'rb-c6', name: 'Earth Brown', hex: '#5C4033' },
            { id: 'rb-c7', name: 'Forest Green', hex: '#228B22' },
          ],
        },
      ],
    },
  ],
  [ProductType.Curtains]: [
    {
      id: 'c-fc1',
      name: 'Drapery Dreams',
      products: [
        {
          id: 'c-p1',
          name: 'Velvet Luxe',
          colors: [
            { id: 'c-c1', name: 'Ruby Red', hex: '#9B111E' },
            { id: 'c-c2', name: 'Emerald Green', hex: '#50C878' },
            { id: 'c-c3', name: 'Royal Purple', hex: '#7851A9' },
          ],
        },
        {
          id: 'c-p2',
          name: 'Sheer Elegance',
          colors: [
            { id: 'c-c4', name: 'Ivory Sheer', hex: '#FFFFF0' },
            { id: 'c-c5', name: 'Champagne Glow', hex: '#F7E7CE' },
          ],
        },
      ],
    },
  ],
};
