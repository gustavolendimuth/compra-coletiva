'use client';

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { authStorage } from "../lib/authStorage";
import { getSafeRedirectPath } from "../lib/safeRedirectPath";
import { API_URL } from "../lib/env";
import { Modal } from "./ui";
import { LoginForm, RegisterForm, AuthTabs } from "./auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
  onAuthenticated?: () => void;
}

export const AuthModal = ({
  isOpen,
  onClose,
  defaultTab = "login",
  onAuthenticated,
}: AuthModalProps) => {
  const { login, register, hasPendingAction } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const [isLoading, setIsLoading] = useState(false);

  // Reset active tab when modal opens with new defaultTab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await login({ email, password });
      onClose();
      onAuthenticated?.();
    } catch (error) {
      // Error is handled by AuthContext with toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (
    name: string,
    email: string,
    password: string,
    phone: string,
    acceptTerms: boolean,
    acceptPrivacy: boolean,
    hideNameInCampaigns: boolean
  ) => {
    setIsLoading(true);
    try {
      await register({
        name,
        email,
        password,
        phone,
        acceptTerms,
        acceptPrivacy,
        hideNameInCampaigns,
      });
      onClose();
      onAuthenticated?.();
    } catch (error) {
      // Error is handled by AuthContext with toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Mark that there's a pending action if one exists
    // This will be checked after OAuth callback completes
    // Note: returnUrl is already saved by requireAuth in AuthContext
    if (hasPendingAction()) {
      authStorage.setPendingActionFlag();
    }

    // Debug: verificar se returnUrl está salvo
    const savedReturnUrl = authStorage.getReturnUrl();
    console.log(
      "[AuthModal] handleGoogleLogin - returnUrl no storage:",
      savedReturnUrl
    );

    window.location.href = `${API_URL}/api/auth/google`;
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
      className="md:max-w-md"
    >
      <div className="-mt-5 -mx-5 md:-mt-6 md:-mx-6">
        <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="pt-6">
          {activeTab === "login" ? (
            <LoginForm
              onSubmit={handleLogin}
              onGoogleLogin={handleGoogleLogin}
              isLoading={isLoading}
            />
          ) : (
            <RegisterForm
              onSubmit={handleRegister}
              onGoogleLogin={handleGoogleLogin}
              isLoading={isLoading}
            />
          )}
        </div>
    </Modal>
  );
};

// Component to listen for openAuthModal events
export const AuthModalManager = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"login" | "register">("login");
  const redirectToRef = useRef<string | null>(null);

  useEffect(() => {
    const handleOpenModal = (event: Event) => {
      const customEvent = event as CustomEvent<{ tab?: "login" | "register" }>;
      setDefaultTab(customEvent.detail?.tab || "login");
      setIsOpen(true);
    };

    window.addEventListener("openAuthModal", handleOpenModal as EventListener);

    return () => {
      window.removeEventListener(
        "openAuthModal",
        handleOpenModal as EventListener
      );
    };
  }, []);

  // Rota protegida manda para ?requireLogin=true&redirectTo=/x: abre o login e volta para /x
  // depois. Lê window.location em vez de useSearchParams para não exigir Suspense no layout.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("requireLogin") !== "true") return;

    const target = getSafeRedirectPath(params.get("redirectTo"));
    redirectToRef.current = target;
    // Login com Google e cadastro (via completar perfil) voltam pelo returnUrl
    if (target) authStorage.setReturnUrl(target);

    params.delete("requireLogin");
    params.delete("redirectTo");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);

    window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab: "login" } }));
  }, [pathname, router]);

  return (
    <AuthModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      defaultTab={defaultTab}
      onAuthenticated={() => {
        const target = redirectToRef.current;
        if (!target) return;
        redirectToRef.current = null;
        authStorage.clearReturnUrl();
        router.push(target);
      }}
    />
  );
};
