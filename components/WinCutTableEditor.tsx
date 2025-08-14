"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Trash2, Plus } from "lucide-react";

interface WinCutTableEntry {
  minCards?: number;
  maxCards?: number;
  percent5to30?: number;
  percentAbove30?: number;
}

interface WinCutTableEditorProps {
  value: WinCutTableEntry[] | undefined;
  onChange: (value: WinCutTableEntry[]) => void;
}

export default function WinCutTableEditor({
  value,
  onChange,
}: WinCutTableEditorProps) {
  const [entries, setEntries] = useState<WinCutTableEntry[]>(value || []);

  const addEntry = () => {
    const newEntry: WinCutTableEntry = {
      minCards: (entries[entries.length - 1]?.maxCards || 0) + 1,
      maxCards: (entries[entries.length - 1]?.maxCards || 0) + 5,
      percent5to30: 0,
      percentAbove30: 5,
    };
    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    onChange(updatedEntries);
  };

  const removeEntry = (index: number) => {
    const updatedEntries = entries.filter((_, i) => i !== index);
    setEntries(updatedEntries);
    onChange(updatedEntries);
  };

  const updateEntry = (
    index: number,
    field: keyof WinCutTableEntry,
    value: string
  ) => {
    const updatedEntries = entries.map((entry, i) => {
      if (i === index) {
        // Handle empty string inputs properly
        if (value === "") {
          return { ...entry, [field]: undefined };
        }

        // Parse the value based on field type
        let parsedValue: number;
        if (field === "percent5to30" || field === "percentAbove30") {
          parsedValue = parseFloat(value);
        } else {
          parsedValue = parseInt(value);
        }

        // Only update if parsing was successful
        if (!isNaN(parsedValue)) {
          return { ...entry, [field]: parsedValue };
        }

        return entry;
      }
      return entry;
    });
    setEntries(updatedEntries);
    onChange(updatedEntries);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Win Cut by Card Range</h3>
        <Button type="button" onClick={addEntry} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No rows yet.</p>
          <p className="text-sm">Click "Add Row" to get started.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Min No Card</TableHead>
              <TableHead>Max No Card</TableHead>
              <TableHead>Percent for bet 5-30 birr</TableHead>
              <TableHead>Percent for bet &gt;30 birr</TableHead>
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    value={entry.minCards ?? ""}
                    onChange={(e) =>
                      updateEntry(index, "minCards", e.target.value)
                    }
                    className="w-28"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    value={entry.maxCards ?? ""}
                    onChange={(e) =>
                      updateEntry(index, "maxCards", e.target.value)
                    }
                    className="w-28"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={entry.percent5to30 ?? ""}
                    onChange={(e) =>
                      updateEntry(index, "percent5to30", e.target.value)
                    }
                    className="w-32"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={entry.percentAbove30 ?? ""}
                    onChange={(e) =>
                      updateEntry(index, "percentAbove30", e.target.value)
                    }
                    className="w-32"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEntry(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
