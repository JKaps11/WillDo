import { Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Violet
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({
  value,
  onChange,
}: ColorPickerProps): React.ReactElement {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <div
            className="size-5 rounded-full border"
            style={{ backgroundColor: value }}
          />
          <span>{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid grid-cols-5 gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="flex size-8 items-center justify-center rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor: value === color ? 'white' : 'transparent',
              }}
              onClick={() => onChange(color)}
            >
              {value === color && <Check className="size-4 text-white" />}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor="customColor" className="text-sm">
            Custom:
          </label>
          <input
            id="customColor"
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="size-8 cursor-pointer rounded border-0"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
