"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import {
  HPX_PALETTES,
  useHpxPalette,
  useHpxThemeTransition,
  type HpxPalette,
} from "@/components/theme-provider";
import {
  HpxDropdownMenu,
  HpxDropdownMenuContent,
  HpxDropdownMenuItem,
  HpxDropdownMenuItemTitle,
  HpxDropdownMenuSeparator,
  HpxDropdownMenuRadioGroup,
  HpxDropdownMenuRadioItem,
  HpxDropdownMenuTrigger,
  HpxDropdownMenuTriggerIcon,
  HpxDropdownMenuValue,
} from "@/components/ui/dropdown-menu";

import * as React from "react";
import { PaletteIcon, Trash2Icon } from "lucide-react";
import { HpxThemeCustomizer } from "@/components/theme-customizer";
import { HpxButton } from "@/components/ui/button";

export function HpxThemeToggle() {
  const toggleTheme = useHpxThemeTransition();
  const { palette, setPalette, customThemes, deleteCustomTheme } =
    useHpxPalette();
  const [customizing, setCustomizing] = React.useState(false);
  const activeCustom = customThemes.find((t) => `custom:${t.id}` === palette);
  const current = activeCustom
    ? { label: activeCustom.name }
    : (HPX_PALETTES.find((p) => p.value === palette) ?? HPX_PALETTES[0]);

  return (
    <div className="flex items-center gap-2">
      <HpxButton
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        onClick={toggleTheme}
      >
        <SunIcon className="dark:hidden" />
        <MoonIcon className="hidden dark:block" />
      </HpxButton>
      <HpxDropdownMenu
        animation="scale"
        duration={0.3}
        delay={0.02}
        stagger={0.03}
        itemHighlight="slide"
        itemHighlightColor="muted"
        typeahead
      >
        <HpxDropdownMenuTrigger
          aria-label="Select theme"
          render={
            <HpxButton variant="ghost" className="w-36 justify-between" />
          }
        >
          <HpxDropdownMenuValue>{current.label}</HpxDropdownMenuValue>
          <HpxDropdownMenuTriggerIcon
            icon="chevron"
            className="size-3.5 text-muted-foreground"
          />
        </HpxDropdownMenuTrigger>
        <HpxDropdownMenuContent align="end" className="w-44 p-1.5">
          <HpxDropdownMenuRadioGroup
            aria-label="Theme"
            value={palette}
            onValueChange={(value) => setPalette(value as HpxPalette)}
          >
            {HPX_PALETTES.map((p) => (
              <HpxDropdownMenuRadioItem
                key={p.value}
                value={p.value}
                label={p.label}
              >
                <HpxDropdownMenuItemTitle>{p.label}</HpxDropdownMenuItemTitle>
              </HpxDropdownMenuRadioItem>
            ))}
            {customThemes.map((t) => (
              <HpxDropdownMenuRadioItem
                key={t.id}
                value={`custom:${t.id}`}
                label={t.name}
              >
                <HpxDropdownMenuItemTitle>{t.name}</HpxDropdownMenuItemTitle>
              </HpxDropdownMenuRadioItem>
            ))}
          </HpxDropdownMenuRadioGroup>
          <HpxDropdownMenuSeparator />
          <HpxDropdownMenuItem onClick={() => setCustomizing(true)}>
            <PaletteIcon />
            <HpxDropdownMenuItemTitle>Create theme</HpxDropdownMenuItemTitle>
          </HpxDropdownMenuItem>
          {activeCustom && (
            <HpxDropdownMenuItem
              variant="destructive"
              onClick={() => deleteCustomTheme(activeCustom.id)}
            >
              <Trash2Icon />
              <HpxDropdownMenuItemTitle>Delete theme</HpxDropdownMenuItemTitle>
            </HpxDropdownMenuItem>
          )}
        </HpxDropdownMenuContent>
      </HpxDropdownMenu>
      <HpxThemeCustomizer open={customizing} onOpenChange={setCustomizing} />
    </div>
  );
}
