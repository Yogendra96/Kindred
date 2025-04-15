interface CarbonFootprint {
  transportation: number;
  food: number;
  energy: number;
  waste: number;
}

interface ActivityData {
  distance: number;
  vehicleType: string;
  meals: {
    meat: number;
    vegetarian: number;
    vegan: number;
  };
  energyUsage: {
    electricity: number;
    gas: number;
  };
  waste: {
    recycled: number;
    landfill: number;
  };
}

const calculateTransportation = (data: ActivityData): number => {
  const emissionFactors = {
    car: 0.404, // kg CO2 per mile
    bus: 0.089,
    train: 0.177,
    bike: 0,
    walk: 0,
  };

  return data.distance * (emissionFactors[data.vehicleType as keyof typeof emissionFactors] || 0);
};

const calculateFood = (data: ActivityData): number => {
  const emissionFactors = {
    meat: 2.5, // kg CO2 per meal
    vegetarian: 1.0,
    vegan: 0.7,
  };

  return (
    data.meals.meat * emissionFactors.meat +
    data.meals.vegetarian * emissionFactors.vegetarian +
    data.meals.vegan * emissionFactors.vegan
  );
};

const calculateEnergy = (data: ActivityData): number => {
  const emissionFactors = {
    electricity: 0.92, // kg CO2 per kWh
    gas: 0.18, // kg CO2 per kWh
  };

  return (
    data.energyUsage.electricity * emissionFactors.electricity +
    data.energyUsage.gas * emissionFactors.gas
  );
};

const calculateWaste = (data: ActivityData): number => {
  const emissionFactors = {
    recycled: 0.1, // kg CO2 per kg
    landfill: 0.5,
  };

  return (
    data.waste.recycled * emissionFactors.recycled +
    data.waste.landfill * emissionFactors.landfill
  );
};

export const calculateCarbonFootprint = async (): Promise<CarbonFootprint> => {
  // In a real app, this would fetch actual user data
  const mockData: ActivityData = {
    distance: 10,
    vehicleType: 'car',
    meals: {
      meat: 2,
      vegetarian: 1,
      vegan: 1,
    },
    energyUsage: {
      electricity: 30,
      gas: 20,
    },
    waste: {
      recycled: 5,
      landfill: 2,
    },
  };

  return {
    transportation: calculateTransportation(mockData),
    food: calculateFood(mockData),
    energy: calculateEnergy(mockData),
    waste: calculateWaste(mockData),
  };
};

export const getCarbonFootprintTips = (footprint: CarbonFootprint): string[] => {
  const tips: string[] = [];

  if (footprint.transportation > 5) {
    tips.push('Consider using public transportation or carpooling to reduce your transportation emissions');
  }

  if (footprint.food > 3) {
    tips.push('Try incorporating more plant-based meals into your diet to reduce food-related emissions');
  }

  if (footprint.energy > 10) {
    tips.push('Look into energy-efficient appliances and consider using renewable energy sources');
  }

  if (footprint.waste > 2) {
    tips.push('Increase your recycling efforts and consider composting organic waste');
  }

  return tips;
};