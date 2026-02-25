'use client';

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authStorage } from "../lib/authStorage";
import { API_URL } from "../lib/env";
import { Modal } from "./ui";
import { LoginForm, RegisterForm, AuthTabs } from "./auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export const AuthModal = ({
  isOpen,
  onClose,
  defaultTab = "login",
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
    phone: string
  ) => {
    setIsLoading(true);
    try {
      await register({ name, email, password, phone });
      onClose();
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
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"login" | "register">("login");

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

  return (
    <AuthModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      defaultTab={defaultTab}
    />
  );
};
