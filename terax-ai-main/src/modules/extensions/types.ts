export type ExtensionCategory =
  | "languages"
  | "formatters"
  | "linters"
  | "themes"
  | "tools"
  | "ai";

export interface ZyperExtension {
  id: string;
  name: string;
  publisher: string;
  version: string;
  description: string;
  category: ExtensionCategory;
  installed: boolean;
  enabled: boolean;
  icon: string;
  downloads: string;
  rating: number;
  tags?: string[];
  features?: string[];
  homepage?: string;
}
