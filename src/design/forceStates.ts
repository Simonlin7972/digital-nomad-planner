// Shows interaction states without interacting: every rule in the page's stylesheets that uses :hover,
// :focus / :focus-visible or :active gets a twin that uses .is-hover, .is-focus or .is-active instead, inserted
// right after the original (inside the same @media), so the cascade is unchanged. The showcase then puts those
// classes on elements. Because the twins are made from the real component CSS, the page never drifts from it.

const PSEUDOS: [RegExp, string][] = [
  [/:hover(?![-\w])/g, '.is-hover'],
  [/:focus-visible(?![-\w])/g, '.is-focus'],
  [/:focus(?![-\w])/g, '.is-focus'],
  [/:active(?![-\w])/g, '.is-active'],
];

const done = new WeakSet<CSSStyleSheet>();

function forced(selector: string): string {
  return PSEUDOS.reduce((s, [re, cls]) => s.replace(re, cls), selector);
}

function mirrorRules(list: CSSRuleList, insert: (text: string, index: number) => void) {
  // Backwards, so an insertion doesn't shift the rules still to visit.
  for (let i = list.length - 1; i >= 0; i--) {
    const rule = list[i];
    if (rule instanceof CSSStyleRule) {
      // Only the selectors in the list that change: re-adding the unchanged ones would reorder the cascade.
      const parts = rule.selectorText.split(/,(?![^(]*\))/).map((s) => s.trim());
      const twins = parts.map(forced).filter((s, j) => s !== parts[j]);
      if (twins.length === 0) continue;
      try {
        insert(`${twins.join(', ')} { ${rule.style.cssText} }`, i + 1);
      } catch {
        // A selector this browser doesn't know (another engine's pseudo-element): skip it.
      }
    } else if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) {
      mirrorRules(rule.cssRules, (text, index) => rule.insertRule(text, index));
    }
  }
}

export function mirrorStates() {
  for (const sheet of document.styleSheets) {
    if (done.has(sheet)) continue;
    done.add(sheet);
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin font stylesheets
    }
    mirrorRules(rules, (text, index) => sheet.insertRule(text, index));
  }
}
