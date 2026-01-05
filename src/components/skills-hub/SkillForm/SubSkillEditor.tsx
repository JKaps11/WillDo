import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { GeneratedSubSkill } from './AIPlanning';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SubSkillEditorProps {
  subSkill: GeneratedSubSkill;
  index: number;
  onChange: (updated: GeneratedSubSkill) => void;
  onDelete: () => void;
}

export function SubSkillEditor({
  subSkill,
  index,
  onChange,
  onDelete,
}: SubSkillEditorProps): React.ReactElement {
  const updateMetric = (
    metricIndex: number,
    field: string,
    value: string | number,
  ): void => {
    const newMetrics = [...subSkill.metrics];
    newMetrics[metricIndex] = { ...newMetrics[metricIndex], [field]: value };
    onChange({ ...subSkill, metrics: newMetrics });
  };

  const addMetric = (): void => {
    onChange({
      ...subSkill,
      metrics: [
        ...subSkill.metrics,
        { name: 'New Metric', targetValue: 1, unit: '' },
      ],
    });
  };

  const removeMetric = (metricIndex: number): void => {
    onChange({
      ...subSkill,
      metrics: subSkill.metrics.filter((_, i) => i !== metricIndex),
    });
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GripVertical className="size-4 cursor-grab" />
          <span className="text-sm font-medium">#{index + 1}</span>
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <Label htmlFor={`subskill-name-${index}`} className="sr-only">
              Sub-skill Name
            </Label>
            <Input
              id={`subskill-name-${index}`}
              value={subSkill.name}
              onChange={(e) => onChange({ ...subSkill, name: e.target.value })}
              placeholder="Sub-skill name"
              className="font-medium"
            />
          </div>
          <div>
            <Label htmlFor={`subskill-desc-${index}`} className="sr-only">
              Description
            </Label>
            <Input
              id={`subskill-desc-${index}`}
              value={subSkill.description || ''}
              onChange={(e) =>
                onChange({ ...subSkill, description: e.target.value })
              }
              placeholder="Description (optional)"
              className="text-sm"
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Metrics</Label>
          <Button variant="ghost" size="sm" onClick={addMetric}>
            <Plus className="mr-1 size-3" />
            Add Metric
          </Button>
        </div>
        {subSkill.metrics.map((metric, mIndex) => (
          <div key={mIndex} className="flex items-center gap-2">
            <Input
              value={metric.name}
              onChange={(e) => updateMetric(mIndex, 'name', e.target.value)}
              placeholder="Metric name"
              className="flex-1 text-sm"
            />
            <Input
              type="number"
              value={metric.targetValue}
              onChange={(e) =>
                updateMetric(
                  mIndex,
                  'targetValue',
                  parseInt(e.target.value) || 1,
                )
              }
              className="w-20 text-sm"
              min={1}
            />
            <Input
              value={metric.unit || ''}
              onChange={(e) => updateMetric(mIndex, 'unit', e.target.value)}
              placeholder="unit"
              className="w-24 text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => removeMetric(mIndex)}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
