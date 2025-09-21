import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { useAuthStore } from "@/store/auth-store";
import toast from "react-hot-toast";
import { extractErrorMessage } from "@/utils/error";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Минимум 2 символа"),
    email: z.string().email("Введите корректный email"),
    password: z.string().min(6, "Минимум 6 символов"),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

type RegisterSchema = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.register);
  const status = useAuthStore((state) => state.status);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterSchema) => {
    try {
      await registerUser({ email: data.email, password: data.password, fullName: data.fullName });
      toast.success("Аккаунт создан, приятной работы!");
      navigate("/boards", { replace: true });
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Создайте аккаунт</h2>
        <p className="mt-2 text-sm text-slate-400">Подключитесь к рабочему пространству и начните управлять задачами.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField label="Имя и фамилия" error={errors.fullName?.message}>
          <Input placeholder="Мария Иванова" {...register("fullName")} />
        </FormField>

        <FormField label="Email" error={errors.email?.message}>
          <Input type="email" placeholder="you@company.com" {...register("email")} />
        </FormField>

        <FormField label="Пароль" error={errors.password?.message}>
          <Input type="password" placeholder="••••••••" autoComplete="new-password" {...register("password")} />
        </FormField>

        <FormField label="Повторите пароль" error={errors.confirmPassword?.message}>
          <Input type="password" placeholder="••••••••" autoComplete="new-password" {...register("confirmPassword")} />
        </FormField>

        <Button type="submit" className="w-full" loading={status === "loading"}>
          Зарегистрироваться
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Уже есть аккаунт? {" "}
        <Link to="/login" className="text-primary hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}