import { Spinner } from "../ui/spinner";

export default function LoadingSpinner() {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Spinner className="size-12 text-primary"/>
        </div>
    )
}