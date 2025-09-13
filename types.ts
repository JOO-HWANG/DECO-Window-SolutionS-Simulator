
export enum ProductType {
  VerticalBlinds = 'Vertical Blinds',
  RollerBlinds = 'Roller Blinds',
  Curtains = 'Curtains',
}

export enum CurtainStyle {
  SWave = 'S-WAVE',
  PinchPleat = 'Pinch Pleat',
}

export enum SimulationMode {
  Manual = 'Manual',
  Auto = 'Auto',
}

export interface Color {
  id: string;
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  colors: Color[];
}

export interface FabricCompany {
  id: string;
  name: string;
  products: Product[];
}

export interface ManualSelection {
  fabricCompanyId: string;
  productId: string;
  colorId: string;
}

export interface SimulationResult {
  dayImage: string | null;
  nightImage: string | null;
  recommendationText: string | null;
}

// For future quotation feature expandability
export interface QuotationData {
  id: string;
  customerName: string;
  customerContact: string;
  installationAddress: string;
  windowMeasurements: {
    width: number; // in cm
    height: number; // in cm
  };
  selectedProductId: string;
  selectedColorId: string;
  quantity: number;
  createdAt: Date;
}
