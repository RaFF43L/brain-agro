export type FilterConfig = {
  condition: string;
  getValue: (v: any) => Record<string, any>;
  shouldApply?: (v: any) => boolean;
};