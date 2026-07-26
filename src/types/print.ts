export type PrintOrientation = "portrait" | "landscape";

export interface PrintOptions {
  title?: string;
  orientation?: PrintOrientation;
  showPrintButton?: boolean;
  autoPrint?: boolean;
}

export interface PrintManagerProps {
  children: React.ReactNode;
  title?: string;
  orientation?: PrintOrientation;
  showPrintButton?: boolean;
  autoPrint?: boolean;
  onPrint?: () => void;
  className?: string;
  headerTitle?: string;
  subtitle?: string;
}

export interface PrintButtonProps {
  label?: string;
  className?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export interface PrintPreviewProps {
  children: React.ReactNode;
  title?: string;
  orientation?: PrintOrientation;
  className?: string;
  showControls?: boolean;
}
