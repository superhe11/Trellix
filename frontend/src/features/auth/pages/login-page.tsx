import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { useAuthStore } from "@/store/auth-store";
import toast from "react-hot-toast";
import { extractErrorMessage } from "@/utils/error";

const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Минимальная длина — 6 символов"),
});

type LoginSchema = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const status = useAuthStore((state) => state.status);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginSchema) => {
    try {
      await login(data);
      const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? "/boards";
      toast.success("С возвращением!");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Добро пожаловать в Trellix</h2>
        <p className="mt-2 text-sm text-slate-400">
          Войдите в свою учётную запись, чтобы продолжить работу с задачами команды.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField label="Email" error={errors.email?.message}>
          <Input type="email" placeholder="you@company.com" {...register("email")} />
        </FormField>

        <FormField label="Пароль" error={errors.password?.message}>
          <Input type="password" placeholder="Введите пароль" autoComplete="current-password" {...register("password")} />
        </FormField>

        <Button type="submit" className="w-full" loading={status === "loading"}>
          Войти
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Нет аккаунта?{" "}
        <Link to="/register" className="text-primary hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
