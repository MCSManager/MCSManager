export function hasVersionUpdate(oldVersion?: string, newVersion?: string) {
  if (!oldVersion || !newVersion) return true;

  // eslint-disable-next-line no-unused-vars
  const [oldMajor, oldMinor, _oldPatch] = oldVersion.split(".");
  // eslint-disable-next-line no-unused-vars
  const [newMajor, newMinor, _newPatch] = newVersion.split(".");

  return oldMajor !== newMajor || oldMinor !== newMinor;
}
