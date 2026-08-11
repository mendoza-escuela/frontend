import { ErrorRoutePage } from './ErrorRoutePage';

export function AccessDeniedPage() {
  return <ErrorRoutePage statusCode={403} />;
}
