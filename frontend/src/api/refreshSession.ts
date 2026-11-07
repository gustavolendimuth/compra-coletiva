/**
 * Refresh de sessão serializado por aba.
 * O refresh token rotaciona a cada uso: duas chamadas paralelas na mesma aba
 * fariam a segunda reapresentar um token já rotacionado (o backend revoga
 * todas as sessões). Por isso há no máximo uma requisição em voo por aba.
 */
import { authClient } from "./client";
import { authStorage } from "../lib/authStorage";
import { updateSocketToken } from "../lib/socket";
import type { RefreshResponse } from "./types";

let inFlight: Promise<RefreshResponse> | null = null;

export function refreshSession(): Promise<RefreshResponse> {
  if (!inFlight) {
    inFlight = authClient
      .post<RefreshResponse>("/auth/refresh")
      .then((response) => {
        const { accessToken, user } = response.data;
        authStorage.setAccessToken(accessToken);
        if (user) {
          authStorage.setUser(user);
        }
        try {
          updateSocketToken(accessToken);
        } catch (err) {
          console.warn("Failed to update socket token:", err);
        }
        return response.data;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}
