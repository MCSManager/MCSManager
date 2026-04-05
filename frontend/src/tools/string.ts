export function removeTrail(origin: string, trail: string) {
  if (origin.endsWith(trail)) {
    return origin.slice(0, origin.length - trail.length);
  } else {
    return origin;
  }
}
