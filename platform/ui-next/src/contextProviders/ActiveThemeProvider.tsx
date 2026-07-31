import * as React from 'react';
import '../themes/themes.css';
import { themePresets, ThemePreset } from '../themes';

const STORAGE_KEY_THEME = 'ohif:theme';
const STORAGE_KEY_CUSTOM_CSS = 'ohif:custom-theme-css';
const CUSTOM_STYLE_ID = 'ohif-custom-theme';
const CONFIG_PRESET_STYLE_ID = 'ohif-config-theme-presets';

type ActiveThemeContextType = {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  customCss: string;
  applyCustomTheme: (cssText: string) => boolean;
  clearCustomTheme: () => void;
  /** Built-in presets merged with any supplied through app config. */
  presets: ThemePreset[];
  /** Theme applied when the visitor has made no explicit choice. */
  defaultTheme: string;
};

// 'custom' is deliberately not URL-addressable: the CSS behind it lives only in
// the visitor's own localStorage, so a ?theme=custom link cannot reproduce a look
// and would only strand the app in a custom state with no CSS behind it.
function isValidUrlTheme(theme: string | null, validThemes: Set<string>): theme is string {
  return !!theme && theme !== 'custom' && validThemes.has(theme);
}

/**
 * Config-supplied presets override built-ins of the same name, so a facility can
 * retune a shipped palette without forking it.
 */
function mergePresets(configPresets: ThemePreset[]): ThemePreset[] {
  const valid = configPresets.filter(p => p?.name && p?.cssVars?.dark);
  const overridden = new Set(valid.map(p => p.name));
  return [...themePresets.filter(p => !overridden.has(p.name)), ...valid];
}

const ActiveThemeContext = React.createContext<ActiveThemeContextType | undefined>(undefined);

function removeThemeClasses() {
  const classList = document.body.classList;
  const toRemove: string[] = [];
  classList.forEach(cls => {
    if (cls.startsWith('theme-')) {
      toRemove.push(cls);
    }
  });
  toRemove.forEach(cls => classList.remove(cls));
}

function removeCustomStyleElement() {
  const style = document.getElementById(CUSTOM_STYLE_ID);
  if (style) {
    style.remove();
  }
}

function parseCssVars(cssText: string): string[] {
  const vars: string[] = [];

  // Remove comment spans entirely (text included), then any unterminated tail,
  // so comment contents never bleed into a variable value.
  const stripped = cssText.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\*[\s\S]*$/, '');

  // Split on newlines AND semicolons so single-line/minified CSS parses too.
  for (const raw of stripped.split(/[\n;]/)) {
    let line = raw.trim();

    // Tolerate a selector prefix on the same segment, e.g. ":root {" or ".dark{".
    const braceIdx = line.lastIndexOf('{');
    if (braceIdx !== -1) {
      line = line.slice(braceIdx + 1).trim();
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const name = line.slice(0, colonIdx).trim();
    if (!/^--[a-zA-Z0-9-]+$/.test(name)) continue;

    const value = line
      .slice(colonIdx + 1)
      .replace(/[{}]/g, '')
      .trim();
    if (!value) continue;

    // Token values are plain HSL triplets — parentheses are never legitimate,
    // and rejecting them keeps url(...) out of the injected stylesheet even if
    // a future rule ever consumes a token outside hsl().
    if (value.includes('(') || value.includes(')')) continue;

    vars.push(`  ${name}: ${value};`);
  }

  return vars;
}

function injectCustomStyles(vars: string[]) {
  const block = vars.join('\n');
  const css = `:root {\n${block}\n}\n.dark {\n${block}\n}`;

  let style = document.getElementById(CUSTOM_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = CUSTOM_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = css;
}

/**
 * Emits a `.theme-<name>` rule per config-supplied preset so they apply through
 * the same body-class mechanism as the presets compiled into themes.css.
 * Token names and values are held to the same shape the custom-CSS parser
 * enforces — bare HSL triplets, no parentheses — so a config file cannot smuggle
 * url(...) into the document.
 */
function injectConfigPresetStyles(presets: ThemePreset[]) {
  const blocks = presets
    .map(preset => {
      if (!/^[a-zA-Z0-9-]+$/.test(preset.name)) {
        return '';
      }

      const decls = Object.entries(preset.cssVars.dark)
        .filter(([token, value]) => {
          if (!/^[a-zA-Z0-9-]+$/.test(token)) {
            return false;
          }
          const v = String(value).trim();
          return !!v && !v.includes('(') && !v.includes(')') && !v.includes(';');
        })
        .map(([token, value]) => `  --${token}: ${String(value).trim()};`)
        .join('\n');

      return decls ? `.theme-${preset.name} {\n${decls}\n}` : '';
    })
    .filter(Boolean);

  let style = document.getElementById(CONFIG_PRESET_STYLE_ID) as HTMLStyleElement | null;

  if (!blocks.length) {
    style?.remove();
    return;
  }

  if (!style) {
    style = document.createElement('style');
    style.id = CONFIG_PRESET_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = blocks.join('\n\n');
}

export function ActiveThemeProvider({
  children,
  defaultTheme = 'default',
  presets: configPresets = [],
}: {
  children: React.ReactNode;
  /** Theme used when the visitor has no stored/URL choice. Set from app config. */
  defaultTheme?: string;
  /** Extra presets defined in app config; override built-ins of the same name. */
  presets?: ThemePreset[];
}) {
  const validConfigPresets = React.useMemo(
    () => configPresets.filter(p => p?.name && p?.cssVars?.dark),
    [configPresets]
  );

  const presets = React.useMemo(() => mergePresets(validConfigPresets), [validConfigPresets]);

  const validThemes = React.useMemo(
    () => new Set(['default', 'custom', ...presets.map(p => p.name)]),
    [presets]
  );

  // A config default naming a preset that does not exist would strand the app in
  // an unstyled theme-* class, so fall back to the built-in look instead.
  const resolvedDefaultTheme =
    defaultTheme !== 'custom' && validThemes.has(defaultTheme) ? defaultTheme : 'default';

  // The config-supplied rules must exist before the first theme class lands on
  // <body>, otherwise the initial paint is unstyled. Injecting during render
  // (rather than in an effect) keeps it ahead of the mount effect below.
  const configStylesInjected = React.useRef(false);
  if (typeof window !== 'undefined' && !configStylesInjected.current) {
    configStylesInjected.current = true;
    injectConfigPresetStyles(validConfigPresets);
  }

  const [activeTheme, setActiveThemeState] = React.useState<string>(() => {
    if (typeof window === 'undefined') return resolvedDefaultTheme;
    const urlTheme = new URLSearchParams(window.location.search).get('theme');
    if (isValidUrlTheme(urlTheme, validThemes)) return urlTheme;

    // Validate the stored value the same way the URL param is validated — a stale
    // key (renamed preset, older build) must not become a theme-* body class.
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    if (!stored || !validThemes.has(stored)) return resolvedDefaultTheme;
    if (stored === 'custom' && !localStorage.getItem(STORAGE_KEY_CUSTOM_CSS)) {
      return resolvedDefaultTheme;
    }
    return stored;
  });

  const [customCss, setCustomCssState] = React.useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEY_CUSTOM_CSS) || '';
  });

  const setActiveTheme = React.useCallback(
    (theme: string) => {
      if (!validThemes.has(theme)) return;

      setActiveThemeState(theme);
      removeThemeClasses();

      if (theme !== 'default' && theme !== 'custom') {
        document.body.classList.add(`theme-${theme}`);
      }

      if (theme !== 'custom') {
        removeCustomStyleElement();
      }

      // Choosing the configured default clears the override so the visitor keeps
      // tracking app config; anything else is an explicit choice worth persisting
      // — including 'default' when the facility default is a preset.
      if (theme === resolvedDefaultTheme) {
        localStorage.removeItem(STORAGE_KEY_THEME);
      } else {
        localStorage.setItem(STORAGE_KEY_THEME, theme);
      }
    },
    [validThemes, resolvedDefaultTheme]
  );

  const applyCustomTheme = React.useCallback((cssText: string): boolean => {
    const vars = parseCssVars(cssText);
    if (vars.length === 0) return false;

    injectCustomStyles(vars);

    setCustomCssState(cssText);
    localStorage.setItem(STORAGE_KEY_CUSTOM_CSS, cssText);

    setActiveThemeState('custom');
    removeThemeClasses();
    localStorage.setItem(STORAGE_KEY_THEME, 'custom');
    return true;
  }, []);

  const clearCustomTheme = React.useCallback(() => {
    removeCustomStyleElement();

    setCustomCssState('');
    localStorage.removeItem(STORAGE_KEY_CUSTOM_CSS);

    // Clearing returns to the facility default, not necessarily OHIF's.
    setActiveThemeState(resolvedDefaultTheme);
    removeThemeClasses();
    if (resolvedDefaultTheme !== 'default') {
      document.body.classList.add(`theme-${resolvedDefaultTheme}`);
    }
    localStorage.removeItem(STORAGE_KEY_THEME);
  }, [resolvedDefaultTheme]);

  // Persist URL param override to localStorage
  React.useEffect(() => {
    const urlTheme = new URLSearchParams(window.location.search).get('theme');
    if (isValidUrlTheme(urlTheme, validThemes)) {
      if (urlTheme === resolvedDefaultTheme) {
        localStorage.removeItem(STORAGE_KEY_THEME);
      } else {
        localStorage.setItem(STORAGE_KEY_THEME, urlTheme);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply initial theme on mount (including custom theme re-injection on reload)
  React.useEffect(() => {
    if (activeTheme === 'custom' && customCss) {
      applyCustomTheme(customCss);
    } else if (activeTheme !== 'default') {
      document.body.classList.add(`theme-${activeTheme}`);
    }

    return () => {
      removeThemeClasses();
      removeCustomStyleElement();
      document.getElementById(CONFIG_PRESET_STYLE_ID)?.remove();
      configStylesInjected.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = React.useMemo(
    () => ({
      activeTheme,
      setActiveTheme,
      customCss,
      applyCustomTheme,
      clearCustomTheme,
      presets,
      defaultTheme: resolvedDefaultTheme,
    }),
    [
      activeTheme,
      setActiveTheme,
      customCss,
      applyCustomTheme,
      clearCustomTheme,
      presets,
      resolvedDefaultTheme,
    ]
  );

  return <ActiveThemeContext.Provider value={value}>{children}</ActiveThemeContext.Provider>;
}

export function useActiveTheme() {
  const context = React.useContext(ActiveThemeContext);
  if (context === undefined) {
    throw new Error('useActiveTheme must be used within an ActiveThemeProvider');
  }
  return context;
}
