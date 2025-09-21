interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, description, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-medium text-slate-300">{label}</label>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
