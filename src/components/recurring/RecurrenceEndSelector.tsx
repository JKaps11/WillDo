import type { RecurrenceEndType } from '@/db/schemas/task.schema';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface RecurrenceEndSelectorProps {
  endType: RecurrenceEndType;
  endValue?: number;
  onEndTypeChange: (type: RecurrenceEndType) => void;
  onEndValueChange: (value: number | undefined) => void;
}

export function RecurrenceEndSelector({
  endType,
  endValue,
  onEndTypeChange,
  onEndValueChange,
}: RecurrenceEndSelectorProps): React.ReactElement {
  const handleTypeChange = (type: RecurrenceEndType): void => {
    onEndTypeChange(type);
    if (type === 'never') {
      onEndValueChange(undefined);
    } else if (type === 'after_count' && !endValue) {
      onEndValueChange(10);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Ends</Label>
      <RadioGroup value={endType} onValueChange={handleTypeChange}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="never" id="end-never" />
          <Label htmlFor="end-never" className="font-normal">
            Never
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <RadioGroupItem value="after_count" id="end-after" />
          <Label
            htmlFor="end-after"
            className="flex items-center gap-2 font-normal"
          >
            After
            <Input
              type="number"
              min={1}
              max={999}
              value={endType === 'after_count' ? (endValue ?? 10) : ''}
              onChange={(e) =>
                onEndValueChange(
                  e.target.value ? parseInt(e.target.value, 10) : undefined,
                )
              }
              disabled={endType !== 'after_count'}
              className="h-8 w-16"
            />
            occurrences
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
