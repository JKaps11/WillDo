import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ReflectionPromptInputProps {
  promptText: string;
  value: string;
  onChange: (value: string) => void;
  index: number;
}

export function ReflectionPromptInput({
  promptText,
  value,
  onChange,
  index,
}: ReflectionPromptInputProps): React.ReactElement {
  return (
    <div className="space-y-2">
      <Label htmlFor={`reflection-${index}`} className="text-sm font-medium">
        {promptText}
      </Label>
      <Textarea
        id={`reflection-${index}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your reflection..."
        className="min-h-[80px] resize-none"
      />
    </div>
  );
}
