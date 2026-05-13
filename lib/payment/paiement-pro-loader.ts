const PAIEMENT_PRO_SCRIPT_URL =
  "https://www.paiementpro.net/webservice/onlinepayment/js/paiementpro.v1.0.1.js";
const PAIEMENT_PRO_SCRIPT_ID = "paiementpro-sdk";

// Names the SDK might bind itself to on window.
const POSSIBLE_GLOBAL_NAMES = [
  "PaiementPro",
  "Paiementpro",
  "paiementPro",
  "paiementpro",
  "PAIEMENTPRO",
];

const POLL_INTERVAL_MS = 50;
const POLL_TIMEOUT_MS = 5000;

export type PaiementProInstance = {
  amount: number;
  description: string;
  channel: string;
  countryCurrencyCode: string;
  referenceNumber: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastname: string;
  customerPhoneNumber: string;
  notificationURL: string;
  returnURL: string;
  returnContext?: string;
  url?: string;
  success: boolean;
  getUrlPayment: () => Promise<void>;
};

type PaiementProConstructor = new (merchantId: string) => PaiementProInstance;

declare global {
  interface Window {
    PaiementPro?: PaiementProConstructor;
  }
}

function findConstructor(): PaiementProConstructor | null {
  const w = window as unknown as Record<string, unknown>;
  for (const name of POSSIBLE_GLOBAL_NAMES) {
    const candidate = w[name];
    if (typeof candidate === "function") {
      return candidate as PaiementProConstructor;
    }

    const globalCandidate = globalThis[name as keyof typeof globalThis];
    if (typeof globalCandidate === "function") {
      return globalCandidate as PaiementProConstructor;
    }

    try {
      const evaluated = (0, eval)(
        `typeof ${name} !== "undefined" ? ${name} : undefined`
      ) as unknown;
      if (typeof evaluated === "function") {
        return evaluated as PaiementProConstructor;
      }
    } catch {
      // Some SDKs expose globals as lexical bindings instead of window props.
    }
  }
  return null;
}

function waitForConstructor(): Promise<PaiementProConstructor> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const ctor = findConstructor();
      if (ctor) {
        resolve(ctor);
        return;
      }
      if (Date.now() - start > POLL_TIMEOUT_MS) {
        const keys = Object.keys(window).filter((k) =>
          k.toLowerCase().includes("pai")
        );
        reject(
          new Error(
            `PaiementPro SDK loaded but constructor is missing. Globals found that match /pai/i: ${
              keys.length ? keys.join(", ") : "(none)"
            }`
          )
        );
        return;
      }
      setTimeout(check, POLL_INTERVAL_MS);
    };
    check();
  });
}

let scriptPromise: Promise<PaiementProConstructor> | null = null;

export function loadPaiementPro(): Promise<PaiementProConstructor> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("PaiementPro can only be loaded in the browser")
    );
  }

  const existingCtor = findConstructor();
  if (existingCtor) {
    return Promise.resolve(existingCtor);
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(
      PAIEMENT_PRO_SCRIPT_ID
    ) as HTMLScriptElement | null;

    const onLoaded = () => {
      waitForConstructor().then(resolve, reject);
    };

    if (existingScript) {
      const ctor = findConstructor();
      if (ctor) {
        resolve(ctor);
        return;
      }
      existingScript.addEventListener("load", onLoaded);
      existingScript.addEventListener("error", () =>
        reject(new Error("Failed to load PaiementPro SDK"))
      );
      return;
    }

    const script = document.createElement("script");
    script.id = PAIEMENT_PRO_SCRIPT_ID;
    script.src = PAIEMENT_PRO_SCRIPT_URL;
    script.async = true;
    script.onload = onLoaded;
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load PaiementPro SDK"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}
