import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  isEditMode?: boolean;
}

export function TagInput({ tags, onChange, placeholder = "Add tag...", className, isEditMode = true }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    const next = inputValue.trim();
    if (!next) return;
    if (!tags.includes(next)) {
      onChange([...tags, next]);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className={cn("text-xs flex items-center", isEditMode ? "gap-1 pr-1" : "px-3 py-1")}
          >
            {tag}
            {isEditMode && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 rounded-full hover:bg-muted p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        {tags.length === 0 && !isEditMode && (
          <span className="text-sm text-muted-foreground italic">No vocabulary terms</span>
        )}
      </div>
      {isEditMode && (
        <>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="h-9"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTag}
              disabled={!inputValue.trim()}
              className="h-9 w-9 p-0"
              aria-label="Add subtopic"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
