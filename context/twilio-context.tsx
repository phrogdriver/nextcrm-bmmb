"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { Device, Call } from "@twilio/voice-sdk";

type CallState = {
  status: "idle" | "ringing" | "connecting" | "in-progress" | "completed";
  direction: "inbound" | "outbound" | null;
  phoneNumber: string | null;
  callSid: string | null;
  startedAt: Date | null;
};

type TwilioContextType = {
  isReady: boolean;
  callState: CallState;
  accept: () => void;
  reject: () => void;
  hangup: () => void;
  dial: (phoneNumber: string) => void;
  mute: (muted: boolean) => void;
  isMuted: boolean;
};

const INITIAL_CALL_STATE: CallState = {
  status: "idle",
  direction: null,
  phoneNumber: null,
  callSid: null,
  startedAt: null,
};

const TwilioContext = createContext<TwilioContextType>({
  isReady: false,
  callState: INITIAL_CALL_STATE,
  accept: () => {},
  reject: () => {},
  hangup: () => {},
  dial: () => {},
  mute: () => {},
  isMuted: false,
});

export function useTwilio() {
  return useContext(TwilioContext);
}

export function TwilioProvider({ children }: { children: ReactNode }) {
  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const incomingCallRef = useRef<Call | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callState, setCallState] = useState<CallState>(INITIAL_CALL_STATE);

  // Fetch token and initialize device
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const res = await fetch("/api/twilio/token", { method: "POST" });
        if (!res.ok) return;

        const { token } = await res.json();
        if (!mounted) return;

        const device = new Device(token, {
          logLevel: 1,
          codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
        });

        device.on("registered", () => {
          if (mounted) setIsReady(true);
        });

        device.on("incoming", (call: Call) => {
          incomingCallRef.current = call;
          if (mounted) {
            setCallState({
              status: "ringing",
              direction: "inbound",
              phoneNumber: call.parameters.From ?? null,
              callSid: call.parameters.CallSid ?? null,
              startedAt: null,
            });
          }

          call.on("cancel", () => {
            incomingCallRef.current = null;
            if (mounted) setCallState(INITIAL_CALL_STATE);
          });

          call.on("disconnect", () => {
            incomingCallRef.current = null;
            activeCallRef.current = null;
            if (mounted) setCallState(INITIAL_CALL_STATE);
          });
        });

        device.on("error", (error) => {
          console.error("Twilio Device error:", error);
        });

        await device.register();
        deviceRef.current = device;
      } catch (err) {
        console.error("Failed to initialize Twilio:", err);
      }
    }

    init();

    return () => {
      mounted = false;
      deviceRef.current?.destroy();
    };
  }, []);

  const setupCallEvents = useCallback((call: Call, direction: "inbound" | "outbound") => {
    call.on("accept", () => {
      setCallState((prev) => ({
        ...prev,
        status: "in-progress",
        startedAt: new Date(),
      }));
    });

    call.on("disconnect", () => {
      activeCallRef.current = null;
      incomingCallRef.current = null;
      setCallState(INITIAL_CALL_STATE);
      setIsMuted(false);
    });

    call.on("error", (error) => {
      console.error("Call error:", error);
      activeCallRef.current = null;
      setCallState(INITIAL_CALL_STATE);
    });
  }, []);

  const accept = useCallback(() => {
    const call = incomingCallRef.current;
    if (!call) return;

    call.accept();
    activeCallRef.current = call;
    incomingCallRef.current = null;
    setupCallEvents(call, "inbound");
  }, [setupCallEvents]);

  const reject = useCallback(() => {
    const call = incomingCallRef.current;
    if (!call) return;

    call.reject();
    incomingCallRef.current = null;
    setCallState(INITIAL_CALL_STATE);
  }, []);

  const hangup = useCallback(() => {
    const call = activeCallRef.current ?? incomingCallRef.current;
    if (!call) return;

    call.disconnect();
    activeCallRef.current = null;
    incomingCallRef.current = null;
    setCallState(INITIAL_CALL_STATE);
    setIsMuted(false);
  }, []);

  const dial = useCallback(
    async (phoneNumber: string) => {
      const device = deviceRef.current;
      if (!device) return;

      setCallState({
        status: "connecting",
        direction: "outbound",
        phoneNumber,
        callSid: null,
        startedAt: null,
      });

      try {
        const call = await device.connect({
          params: { To: phoneNumber },
        });

        activeCallRef.current = call;
        setupCallEvents(call, "outbound");

        setCallState((prev) => ({
          ...prev,
          status: "ringing",
          callSid: call.parameters.CallSid ?? null,
        }));
      } catch (err) {
        console.error("Failed to connect call:", err);
        setCallState(INITIAL_CALL_STATE);
      }
    },
    [setupCallEvents]
  );

  const mute = useCallback((muted: boolean) => {
    const call = activeCallRef.current;
    if (call) {
      call.mute(muted);
      setIsMuted(muted);
    }
  }, []);

  return (
    <TwilioContext.Provider
      value={{ isReady, callState, accept, reject, hangup, dial, mute, isMuted }}
    >
      {children}
    </TwilioContext.Provider>
  );
}
