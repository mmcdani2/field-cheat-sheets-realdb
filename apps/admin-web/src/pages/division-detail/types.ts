export type Division = {
  id: string;
  companyId: string;
  key: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DivisionModuleRow = {
  id: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  module: {
    id: string;
    key: string;
    name: string;
    category: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export type QuickEstimateCalculatorSettings = {
  laborRate: number;
  pricingTiers: number[];
};

export type DetailView = "overview" | "modules";