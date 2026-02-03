import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  snapPoints?: Array<number | string>;
  defaultSnapPoint?: number | string;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  showHandle?: boolean;
  modal?: boolean;
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  snapPoints = [0, 0.75, 1],
  defaultSnapPoint = 0.75,
  className,
  headerClassName,
  bodyClassName,
  showHandle = true,
  modal = true,
}: BottomSheetProps) {
  const [activeSnapPoint, setActiveSnapPoint] = React.useState<number | string | null>(defaultSnapPoint);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const ignoreCloseRef = React.useRef(false);
  const orderedSnapPoints = React.useMemo(() => {
    if (!snapPoints || snapPoints.length === 0) return snapPoints;
    const unique = Array.from(new Set(snapPoints));
    const defaultIndex = unique.findIndex((point) => point === defaultSnapPoint);
    if (defaultIndex === -1) return [defaultSnapPoint, ...unique];
    if (defaultIndex === 0) return unique;
    return [unique[defaultIndex], ...unique.slice(0, defaultIndex), ...unique.slice(defaultIndex + 1)];
  }, [snapPoints, defaultSnapPoint]);

  // Snap logic: reset to default when opening for a consistent entry height.
  React.useEffect(() => {
    if (open) {
      // Avoid closing immediately if the drawer last snapped to 0 when it was closed.
      ignoreCloseRef.current = true;
      setActiveSnapPoint(defaultSnapPoint);
      const id = requestAnimationFrame(() => {
        ignoreCloseRef.current = false;
      });
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [open, defaultSnapPoint]);

  // Gesture logic: when user drags to the 0 snap point, close the sheet.
  React.useEffect(() => {
    if (open && !ignoreCloseRef.current && activeSnapPoint === 0) {
      onOpenChange(false);
    }
  }, [open, activeSnapPoint, onOpenChange]);

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={orderedSnapPoints}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={setActiveSnapPoint}
      scrollLockTimeout={0}
      modal={modal}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/80" />
        <DrawerPrimitive.Content
          ref={contentRef}
          tabIndex={-1}
          onOpenAutoFocus={(event) => {
            // Ensure focus moves into the sheet even when there are no focusable elements.
            event.preventDefault();
            contentRef.current?.focus();
          }}
          className={cn(
            "fixed inset-x-0 bottom-0 z-[100] flex flex-col border bg-background outline-none",
            "rounded-t-2xl shadow-xl pb-[env(safe-area-inset-bottom)]",
            "h-[100dvh] max-h-[calc(100dvh-env(safe-area-inset-top))]",
            "sm:inset-x-1/2 sm:-translate-x-1/2 sm:bottom-6 sm:max-w-xl sm:rounded-2xl",
            activeSnapPoint === 1 && "rounded-none pt-[env(safe-area-inset-top)]",
            className,
          )}
        >
          {showHandle && (
            <DrawerPrimitive.Handle className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          )}

          {(title || description) && (
            <div className={cn("flex-shrink-0 px-4 pb-3 pt-3 border-b border-border", headerClassName)}>
              {title && (
                <DrawerPrimitive.Title className="text-lg font-semibold flex items-center gap-2">
                  {title}
                </DrawerPrimitive.Title>
              )}
              {description && (
                <DrawerPrimitive.Description className="text-sm text-muted-foreground">
                  {description}
                </DrawerPrimitive.Description>
              )}
            </div>
          )}

          <div
            className={cn(
              "flex-1 overflow-y-auto overscroll-contain",
              "pb-[calc(1rem+env(safe-area-inset-bottom))]",
              bodyClassName,
            )}
          >
            {children}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
