export const EMAIL_LINK_STORAGE_KEY = "cluster_email_link_for_sign_in";

export const getGoogleAuthErrorMessage = (error) => {
  const code = String(error?.code || "").trim();
  if (code === "auth/unauthorized-domain")
    return "Google bloqueado: agrega 127.0.0.1 en Firebase Authorized domains o entra por http://localhost:5000.";
  if (code === "auth/operation-not-allowed")
    return "Google Sign-In no esta habilitado en Firebase Authentication.";
  if (code === "auth/popup-blocked")
    return "El navegador bloqueo el popup de Google.";
  if (code === "auth/popup-closed-by-user")
    return "El popup de Google se cerro antes de completar el login.";
  if (code === "auth/cancelled-popup-request")
    return "Ya habia un popup de autenticacion abierto.";
  return `No se pudo iniciar sesion con Google${code ? ` (${code})` : ""}.`;
};
export const getEmailLinkAuthErrorMessage = (error, phase = "send") => {
  const code = String(error?.code || "").trim();
  if (
    code === "auth/unauthorized-domain" ||
    code === "auth/unauthorized-continue-uri" ||
    code === "auth/invalid-continue-uri"
  ) {
    return "Firebase bloqueo el enlace: agrega este dominio en Authorized domains de Firebase Authentication.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Email link no esta habilitado en Firebase Authentication.";
  }
  if (code === "auth/invalid-email") {
    return "El correo no es valido.";
  }
  if (code === "auth/missing-client-config") {
    return "Falta configurar el SDK web de Firebase para enviar accesos por correo.";
  }
  if (
    phase === "complete" &&
    (code === "auth/invalid-action-code" || code === "auth/expired-action-code")
  ) {
    return "El enlace ya no es valido o vencio.";
  }
  if (phase === "complete" && code === "auth/user-disabled") {
    return "La cuenta asociada esta deshabilitada.";
  }
  if (phase === "complete" && code === "auth/user-not-found") {
    return "No existe una cuenta de Firebase para ese correo.";
  }
  return phase === "complete"
    ? `No se pudo completar el acceso por correo${code ? ` (${code})` : ""}.`
    : `No se pudo enviar el correo de acceso${code ? ` (${code})` : ""}.`;
};
export const buildEmailLinkActionUrl = () => {
  if (typeof window === "undefined") return "";
  const currentUrl = new URL(window.location.href);
  const target = new URL(window.location.origin + window.location.pathname);
  ["firestore", "callRoom", "callClient", "callMessage"].forEach((param) => {
    const value = currentUrl.searchParams.get(param);
    if (value) target.searchParams.set(param, value);
  });
  target.searchParams.set("email_link", "pending");
  return target.toString();
};
export const buildEmailLinkActionCodeSettings = () => ({
  url: buildEmailLinkActionUrl(),
  handleCodeInApp: true,
});
export const buildEmailLinkReturnUrl = (href = "") => {
  if (typeof window === "undefined") return null;
  const currentUrl = new URL(href || window.location.href);
  const continueUrl = currentUrl.searchParams.get("continueUrl");
  let nextUrl = new URL(window.location.origin + window.location.pathname);

  if (continueUrl) {
    try {
      nextUrl = new URL(continueUrl);
    } catch (error) {
      console.warn("No se pudo leer continueUrl del email link:", error);
    }
  } else {
    ["firestore", "callRoom", "callClient", "callMessage"].forEach((param) => {
      const value = currentUrl.searchParams.get(param);
      if (value) nextUrl.searchParams.set(param, value);
    });
  }

  ["email_link", "mode", "oobCode", "apiKey", "lang", "continueUrl"].forEach(
    (param) => nextUrl.searchParams.delete(param),
  );
  return nextUrl;
};
export const getAuthSource = (authUser = null) => {
  const providerIds = (authUser?.providerData || [])
    .map((provider) => provider?.providerId)
    .filter(Boolean);
  if (providerIds.includes("google.com")) return "google";
  if (providerIds.includes("password")) return "email_link";
  if (authUser?.isAnonymous) return "anonymous";
  return "auth";
};

