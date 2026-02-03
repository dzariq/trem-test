import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";
import { useIsSmallScreen } from "@/hooks/use-mobile";

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
  /**
   * When true, centers the sheet as a dialog on desktop (sm+) screens.
   * Bottom sheet behavior preserved on mobile.
   */
  centeredOnDesktop?: boolean;
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
  centeredOnDesktop = true,
}: BottomSheetProps) {
  const isSmallScreen = useIsSmallScreen();
  const useSnapPoints = !centeredOnDesktop || isSmallScreen;
  const [activeSnapPoint, setActiveSnapPoint] = React.useState<number | string | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const ignoreCloseRef = React.useRef(false);

  // Keep snap points in ascending order for proper gesture handling
  const sortedSnapPoints = React.useMemo(() => {
    if (!snapPoints || snapPoints.length === 0) return snapPoints;
    return [...new Set(snapPoints)].sort((a, b) => {
      const numA = typeof a === 'number' ? a : parseFloat(a);
      const numB = typeof b === 'number' ? b : parseFloat(b);
      return numA - numB;
    });
  }, [snapPoints]);

  // Snap logic: reset to default when opening for a consistent entry height.
  React.useEffect(() => {
    if (!useSnapPoints) {
      setActiveSnapPoint(null);
      return undefined;
    }
    if (open) {
      // Force a snap point update on open so Vaul applies the transform
      // after the content mounts (prevents the "first open is invisible" bug).
      ignoreCloseRef.current = true;
      setActiveSnapPoint(defaultSnapPoint);
      const id = requestAnimationFrame(() => {
        ignoreCloseRef.current = false;
      });
      return () => cancelAnimationFrame(id);
    }
    // Reset when closed so the next open always triggers a snap update.
    setActiveSnapPoint(null);
    return undefined;
  }, [open, defaultSnapPoint, useSnapPoints]);

  // Gesture logic: when user drags to the 0 snap point, close the sheet.
  React.useEffect(() => {
    if (!useSnapPoints) return;
    if (open && !ignoreCloseRef.current && activeSnapPoint === 0) {
      onOpenChange(false);
    }
  }, [open, activeSnapPoint, onOpenChange, useSnapPoints]);

  const snapPointsProp = useSnapPoints ? sortedSnapPoints : undefined;
  const activeSnapPointProp = useSnapPoints ? activeSnapPoint : undefined;
  const setActiveSnapPointProp = useSnapPoints ? setActiveSnapPoint : undefined;
  const isFullSnap = useSnapPoints && activeSnapPoint === 1;
  const shouldCenter = centeredOnDesktop && !useSnapPoints;

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPointsProp}
      activeSnapPoint={activeSnapPointProp}
      setActiveSnapPoint={setActiveSnapPointProp}
      scrollLockTimeout={0}
      modal={modal}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/80" />
        <div
          className={cn(
            "fixed inset-0 z-[100] flex",
            shouldCenter ? "items-center justify-center" : "items-end"
          )}
        >
          <DrawerPrimitive.Content
            ref={contentRef}
            tabIndex={-1}
            onOpenAutoFocus={(event) => {
              // Ensure focus moves into the sheet even when there are no focusable elements.
              event.preventDefault();
              contentRef.current?.focus();
            }}
            className={cn(
              "pointer-events-auto flex flex-col border bg-background outline-none shadow-xl",
              "pb-[env(safe-area-inset-bottom)]",
              useSnapPoints
                ? "fixed inset-x-0 bottom-0 z-[100] rounded-t-2xl h-[100dvh] max-h-[calc(100dvh-env(safe-area-inset-top))]"
                : "relative z-[100] rounded-2xl w-[min(90vw,640px)] max-h-[85vh] sm:after:hidden",
              !useSnapPoints && centeredOnDesktop === false &&
                "sm:inset-x-1/2 sm:-translate-x-1/2 sm:bottom-6 sm:max-w-xl sm:rounded-2xl",
              isFullSnap && "rounded-none pt-[env(safe-area-inset-top)] sm:rounded-2xl sm:pt-0",
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
        </div>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
