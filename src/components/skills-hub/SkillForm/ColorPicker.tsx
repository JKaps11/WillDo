import { useCallback, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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
  const [inputValue, setInputValue] = useState(value);

  const handleColorChange = useCallback(
    (color: string) => {
      setInputValue(color);
      onChange(color);
    },
    [onChange],
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  }

  function handleInputBlur(): void {
    if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      setInputValue(value);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <div
            className="size-5 rounded-full border border-border"
            style={{ backgroundColor: value }}
          />
          <span className="text-foreground">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-3">
          {/* Preset colors grid */}
          <div className="grid grid-cols-5 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border-2 transition-transform hover:scale-110',
                  value.toUpperCase() === color.toUpperCase()
                    ? 'border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background'
                    : 'border-transparent',
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
              >
                {value.toUpperCase() === color.toUpperCase() && (
                  <Check className="size-4 text-white drop-shadow-md" />
                )}
              </button>
            ))}
          </div>

          {/* Custom color picker */}
          <div className="color-picker-wrapper">
            <HexColorPicker color={value} onChange={handleColorChange} />
          </div>

          {/* Hex input */}
          <div className="flex items-center gap-2">
            <Label htmlFor="hex-input" className="text-sm shrink-0">
              Hex:
            </Label>
            <Input
              id="hex-input"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className="h-8 font-mono text-sm"
              placeholder="#000000"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
