import { FormEvent, useState } from "react";
import { Input, PhoneInput, Button, Divider, GoogleButton } from "../ui";

interface RegisterFormProps {
  onSubmit: (
    name: string,
    email: string,
    password: string,
    phone: string
  ) => Promise<void>;
  onGoogleLogin: () => void;
  isLoading: boolean;
}

/**
 * RegisterForm Component
 *
 * Registration form with name/email/phone/password and Google OAuth.
 * Uses design system ui/ components.
 * Mobile-first with proper touch targets.
 */
export const RegisterForm = ({
  onSubmit,
  onGoogleLogin,
  isLoading,
}: RegisterFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(name, email, password, phone);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="register-name"
        type="text"
        label="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        disabled={isLoading}
        autoComplete="name"
      />

      <Input
        id="register-email"
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isLoading}
        autoComplete="email"
      />

      <PhoneInput
        id="register-phone"
        label="Celular/WhatsApp"
        value={phone}
        onChange={setPhone}
        required
        disabled={isLoading}
        autoComplete="tel"
        helperText="Número para contato via WhatsApp"
      />

      <Input
        id="register-password"
        type="password"
        label="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={isLoading}
        minLength={6}
        helperText="Mínimo 6 caracteres, 1 maiúscula, 1 minúscula, 1 número"
        autoComplete="new-password"
      />

      <Button
        type="submit"
        variant="primary"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Criando conta..." : "Criar Conta"}
      </Button>

      <Divider text="Ou continue com" />

      <GoogleButton onClick={onGoogleLogin} isLoading={isLoading} />
    </form>
  );
};

export default RegisterForm;
