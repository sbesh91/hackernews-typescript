export function filterIncludes(
  includes?: Record<string, boolean | null | undefined> | null
) {
  if (!includes) return;

  const fixedIncludes = { ...includes };

  Object.keys(fixedIncludes).forEach((key) => {
    fixedIncludes[key] = Boolean(fixedIncludes[key]);
  });

  return fixedIncludes as Record<string, boolean>;
}
