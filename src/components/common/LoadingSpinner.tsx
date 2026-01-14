import { Spinner } from '../ui/spinner';

export default function LoadingSpinner() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <Spinner className="size-12 text-primary" />
    </div>
  );
}
