// Keep the original Kestrel lead inside the shared three-unresolved-site ceiling.
if (typeof draakFieldLeadPending === "function" && typeof fieldNetworkHasRoom === "function") {
  const draakFieldLeadPendingBeforeSharedCap = draakFieldLeadPending;
  draakFieldLeadPending = function draakFieldLeadPendingWithSharedCap() {
    return fieldNetworkHasRoom() && draakFieldLeadPendingBeforeSharedCap();
  };
}
