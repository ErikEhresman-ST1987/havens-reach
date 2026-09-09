// Haven's Reach — transient field arrival correction
// Keep the first field-site experience immediate: arriving at the temporary coordinates
// opens the field overview rather than leaving the previous Travel tab active.

const travelBeforeFieldArrival = travel;
travel = function travelWithFieldArrivalView(destination, fuelCost) {
  if (destination === DRAAK_FIELD_ID) currentView = "overview";
  return travelBeforeFieldArrival(destination, fuelCost);
};
