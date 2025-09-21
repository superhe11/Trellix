export function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface text-surface-foreground">
      <div className="glass-panel flex h-36 w-36 items-center justify-center rounded-3xl">
        <div className="size-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-3xl font-semibold text-primary-foreground">T</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg text-slate-300">Загружаем рабочее пространство</p>
        <p className="text-sm text-slate-500">Подготовка данных и проверка доступа...</p>
      </div>
    </div>
  );
}
