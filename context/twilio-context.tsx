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
import { Client as ConversationsClient, type Conversation, type Message } from "@twilio/conversations";

// ── Types ────────────────────────────────────────────────

type CallState = {
  status: "idle" | "ringing" | "connecting" | "in-progress" | "completed";
  direction: "inbound" | "outbound" | null;
  phoneNumber: string | null;
  callSid: string | null;
  startedAt: Date | null;
};

type NewMessageEvent = {
  conversationSid: string;
  message: {
    sid: string;
    author: string;
    body: string;
    dateCreated: Date;
  };
};

type TwilioContextType = {
  // Voice
  isReady: boolean;
  callState: CallState;
  accept: () => void;
  reject: () => void;
  hangup: () => void;
  dial: (phoneNumber: string) => void;
  mute: (muted: boolean) => void;
  isMuted: boolean;
  // Messaging
  isMessagingReady: boolean;
  subscribeToConversation: (twilioConvSid: string) => Promise<void>;
  onNewMessage: (handler: (event: NewMessageEvent) => void) => () => void;
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
  isMessagingReady: false,
  subscribeToConversation: async () => {},
  onNewMessage: () => () => {},
});

export function useTwilio() {
  return useContext(TwilioContext);
}

export type { NewMessageEvent };

// ── Provider ─────────────────────────────────────────────

export function TwilioProvider({ children }: { children: ReactNode }) {
  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const incomingCallRef = useRef<Call | null>(null);
  const conversationsClientRef = useRef<ConversationsClient | null>(null);
  const subscribedConvsRef = useRef<Map<string, Conversation>>(new Map());
  const messageHandlersRef = useRef<Set<(event: NewMessageEvent) => void>>(new Set());

  const [isReady, setIsReady] = useState(false);
  const [isMessagingReady, setIsMessagingReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callState, setCallState] = useState<CallState>(INITIAL_CALL_STATE);

  const emitMessage = useCallback((message: Message) => {
    const event: NewMessageEvent = {
      conversationSid: message.conversation.sid,
      message: {
        sid: message.sid,
        author: message.author ?? "",
        body: message.body ?? "",
        dateCreated: message.dateCreated ?? new Date(),
      },
    };
    messageHandlersRef.current.forEach((handler) => handler(event));
  }, []);

  // Fetch token and initialize both Voice Device and Conversations Client
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const res = await fetch("/api/twilio/token", { method: "POST" });
        if (!res.ok) return;

        const { token } = await res.json();
        if (!mounted) return;

        // ── Voice SDK ──
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

        // ── Conversations SDK ──
        try {
          const convClient = new ConversationsClient(token);

          convClient.on("stateChanged", (state) => {
            console.log("[Conversations] State:", state);
            if (state === "initialized" && mounted) {
              setIsMessagingReady(true);
            }
            if (state === "failed") {
              console.error("[Conversations] Client failed to initialize");
            }
          });

          convClient.on("conversationAdded", (conv: Conversation) => {
            console.log("[Conversations] Conversation added:", conv.sid);
            conv.on("messageAdded", emitMessage);
            subscribedConvsRef.current.set(conv.sid, conv);
          });

          convClient.on("connectionError", (error) => {
            console.error("[Conversations] Connection error:", error);
          });

          conversationsClientRef.current = convClient;
        } catch (convErr) {
          console.error("[Conversations] Failed to create client:", convErr);
        }
      } catch (err) {
        console.error("Failed to initialize Twilio:", err);
      }
    }

    init();

    return () => {
      mounted = false;
      deviceRef.current?.destroy();
      // Clean up conversation listeners
      subscribedConvsRef.current.forEach((conv) => {
        conv.removeAllListeners();
      });
      subscribedConvsRef.current.clear();
      conversationsClientRef.current?.shutdown();
    };
  }, [emitMessage]);

  // ── Voice controls ──

  const setupCallEvents = useCallback((call: Call, _direction: "inbound" | "outbound") => {
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

  // ── Messaging: subscribe to a specific Twilio Conversation ──

  const subscribeToConversation = useCallback(
    async (twilioConvSid: string) => {
      const client = conversationsClientRef.current;
      if (!client || subscribedConvsRef.current.has(twilioConvSid)) return;

      try {
        const conv = await client.getConversationBySid(twilioConvSid);
        conv.on("messageAdded", emitMessage);
        subscribedConvsRef.current.set(twilioConvSid, conv);
      } catch (err) {
        console.error("Failed to subscribe to conversation:", twilioConvSid, err);
      }
    },
    [emitMessage]
  );

  const onNewMessage = useCallback(
    (handler: (event: NewMessageEvent) => void) => {
      messageHandlersRef.current.add(handler);
      return () => {
        messageHandlersRef.current.delete(handler);
      };
    },
    []
  );

  return (
    <TwilioContext.Provider
      value={{
        isReady,
        callState,
        accept,
        reject,
        hangup,
        dial,
        mute,
        isMuted,
        isMessagingReady,
        subscribeToConversation,
        onNewMessage,
      }}
    >
      {children}
    </TwilioContext.Provider>
  );
}
