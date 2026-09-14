// Haven's Reach — Expansion Foundation Pass 5D4
// Contract Variety Mission-Outcome Migration
//
// Gives the later contract-variety owner explicit precedence for operator-mission
// choices. Matching by mission kind prevents delegation back into the dispatcher
// when an action does not belong to the active contract.

const resolveContractVarietyBeforeDispatcher = window.resolveEncounter;
const CONTRACT_VARIETY_ACTION_KINDS = new Map([
  ["missionSciencePrecision", "science"],
  ["missionScienceWide", "science"],
  ["missionMiningStable", "mining"],
  ["missionMiningDense", "mining"],
  ["missionTransportFast", "transport"],
  ["missionTransportDocumented", "transport"],
  ["missionSalvageRecorder", "salvage"],
  ["missionSalvageSearch", "salvage"]
]);

HavensInteractionDispatcher.registerEncounterInterceptor("contract-variety", action => {
  const expectedKind = CONTRACT_VARIETY_ACTION_KINDS.get(action);
  const contract = state.activeContract;

  if (!expectedKind ||
      !contract ||
      !isOperatorMission(contract) ||
      contract.kind !== expectedKind) return false;

  resolveContractVarietyBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();
