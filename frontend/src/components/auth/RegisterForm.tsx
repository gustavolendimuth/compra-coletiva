import { FormEvent, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Input, PhoneInput, Button, Divider, GoogleButton } from "../ui";
import { authService } from "../../api";

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
  const [nameSuggestion, setNameSuggestion] = useState<string | null>(null);
  const [checkingName, setCheckingName] = useState(false);

  // Check if name exists (debounced)
  useEffect(() => {
    if (!name || name.trim().length < 2) {
      setNameSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingName(true);
        const result = await authService.checkName(name.trim());
        setNameSuggestion(result.suggestion);
      } catch (error) {
        console.error("Error checking name:", error);
        setNameSuggestion(null);
      } finally {
        setCheckingName(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [name]);

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
        placeholder="Nome Sobrenome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        disabled={isLoading}
        autoComplete="name"
        helperText={
          checkingName
            ? "Verificando disponibilidade..."
            : nameSuggestion || "Informe seu nome completo"
        }
        variant={nameSuggestion ? "warning" : undefined}
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

      <div className="space-y-3">
        <p className="text-xs text-gray-600 text-center">
          Ao criar uma conta, você concorda com nossos{' '}
          <Link
            to="/terms"
            className="text-blue-600 hover:text-blue-700 font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            Termos de Serviço
          </Link>
          {' '}e{' '}
          <Link
            to="/privacy"
            className="text-blue-600 hover:text-blue-700 font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            Política de Privacidade
          </Link>
          .
        </p>

        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Criando conta..." : "Criar Conta"}
        </Button>
      </div>

      <Divider text="Ou continue com" />

      <GoogleButton onClick={onGoogleLogin} isLoading={isLoading} />
    </form>
  );
};

export default RegisterForm;
