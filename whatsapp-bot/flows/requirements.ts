export function renderRequirementProgress(selectedCount: number, maxCount: number) {
  return {
    text: `${selectedCount} requirement${selectedCount === 1 ? "" : "s"} selected. You can continue when ready.`,
    maxCount,
  };
}

