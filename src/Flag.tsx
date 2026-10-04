import { flagCode } from './flags';

export function Flag({ country }: { country: string }) {
  const code = flagCode(country);
  // Regions without a flag (e.g. a continent) keep an empty slot so the names stay aligned.
  return <span className={code ? `flag fi fi-${code}` : 'flag none'} aria-hidden="true" />;
}
