"use client";

import { motion } from "framer-motion";
import { Hash, MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { duration } from "@/lib/constants/animations";

// Stream of saves that will flow through
const SAVES_STREAM = [
  {
    id: 1,
    title: "How to build in public",
    note: "Great thread on transparency",
    url: "x.com/levelsio/status/1847382...",
    tag: "startup",
    tagColor: "denim",
  },
  {
    id: 2,
    title: "React Server Components",
    note: "Finally makes sense now",
    url: "vercel.com/blog/understanding-...",
    tag: "dev",
    tagColor: "mint",
  },
  {
    id: 3,
    title: "Naval on wealth creation",
    note: "Share with the team",
    url: "nav.al/rich",
    tag: "wisdom",
    tagColor: "rust",
  },
  {
    id: 4,
    title: "Design system patterns",
    note: "Reference for our rebrand",
    url: "designsystems.com/patterns/...",
    tag: "design",
    tagColor: "amber",
  },
];

const TIMING = {
  messageInterval: duration(3200),
  maxMessages: 3,
  cardHeight: 94,
  gap: 20,
};

interface QueuedMessage {
  id: number;
  save: (typeof SAVES_STREAM)[0];
}

const MessageCard = ({
  message,
  channel,
  style,
}: {
  message: QueuedMessage;
  channel: "slack" | "discord";
  style: React.CSSProperties;
}) => {
  const isSlack = channel === "slack";

  return (
    <div
      className="absolute left-0 right-0 transition-all duration-700 ease-out"
      style={style}
    >
      <div
        className={`rounded-lg border p-3 bg-muted/50 ${
          isSlack
            ? "border-[#E01E5A]/30"
            : "border-[#5865F2]/30"
        }`}
      >
        <div className="text-[11px] font-medium text-foreground truncate mb-0.5">
          {message.save.title}
        </div>
        <div className="text-[9px] text-muted-foreground/70 truncate mb-1 font-mono">
          {message.save.url}
        </div>
        <div className="text-[10px] text-muted-foreground truncate mb-1.5 italic">
          "{message.save.note}"
        </div>
        <span
          className={`inline-block text-[9px] font-medium px-2 py-0.5 rounded-full ${
            message.save.tagColor === "denim"
              ? "bg-denim/20 text-denim"
              : message.save.tagColor === "mint"
                ? "bg-mint/20 text-mint"
                : message.save.tagColor === "rust"
                  ? "bg-rust/20 text-rust"
                  : "bg-amber/20 text-amber"
          }`}
        >
          #{message.save.tag}
        </span>
      </div>
    </div>
  );
};

const MessageStack = ({
  messages,
  channel,
  pulse,
}: {
  messages: QueuedMessage[];
  channel: "slack" | "discord";
  pulse: boolean;
}) => {
  const isSlack = channel === "slack";
  const { cardHeight, gap } = TIMING;

  return (
    <div>
      {/* Channel Header */}
      <motion.div
        className="relative mb-2"
        animate={pulse ? { scale: [1, 1.01, 1] } : {}}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.div
          className={`absolute inset-0 rounded-lg blur-lg ${
            isSlack ? "bg-[#E01E5A]/10" : "bg-[#5865F2]/10"
          }`}
          animate={{ opacity: pulse ? 0.5 : 0.2 }}
          transition={{ duration: 0.5 }}
        />
        <div
          className={`relative flex items-center gap-1.5 rounded-lg border bg-muted px-2.5 py-2 ${
            isSlack ? "border-[#E01E5A]/30" : "border-[#5865F2]/30"
          }`}
        >
          {isSlack ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" aria-label="Slack">
              <title>Slack</title>
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
              <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
              <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D"/>
              <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="#5865F2" aria-label="Discord">
              <title>Discord</title>
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          )}
          <div className="flex items-center gap-0.5 min-w-0">
            {isSlack ? (
              <Hash className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
            ) : (
              <MessageCircle className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
            )}
            <span className="text-[11px] font-semibold text-foreground/80 truncate">
              {isSlack ? "brain-mario" : "mario-bookmarks"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Message Stack - Fixed height with CSS transitions */}
      <div
        className="relative"
        style={{ height: TIMING.maxMessages * cardHeight + (TIMING.maxMessages - 1) * gap }}
      >
        {messages.map((msg, index) => (
          <MessageCard
            key={msg.id}
            message={msg}
            channel={channel}
            style={{
              top: index * (cardHeight + gap),
              opacity: 1 - index * 0.15,
              transform: `scale(${1 - index * 0.01})`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export function IntegrationsComingSoon() {
  // Start with initial messages
  const [slackMessages, setSlackMessages] = useState<QueuedMessage[]>([
    { id: 1, save: SAVES_STREAM[0] },
  ]);
  const [discordMessages, setDiscordMessages] = useState<QueuedMessage[]>([
    { id: 2, save: SAVES_STREAM[1] },
  ]);
  const [messageCounter, setMessageCounter] = useState(2);
  const [slackPulse, setSlackPulse] = useState(false);
  const [discordPulse, setDiscordPulse] = useState(false);

  // Add messages alternating between channels, loops continuously
  useEffect(() => {
    const interval = setInterval(() => {
      const save = SAVES_STREAM[messageCounter % SAVES_STREAM.length];
      const isSlack = messageCounter % 2 === 0;
      const newMessage = { id: Date.now(), save };

      if (isSlack) {
        setSlackMessages((prev) => [newMessage, ...prev].slice(0, TIMING.maxMessages));
        setSlackPulse(true);
        setTimeout(() => setSlackPulse(false), 600);
      } else {
        setDiscordMessages((prev) => [newMessage, ...prev].slice(0, TIMING.maxMessages));
        setDiscordPulse(true);
        setTimeout(() => setDiscordPulse(false), 600);
      }

      setMessageCounter((c) => c + 1);
    }, TIMING.messageInterval);

    return () => clearInterval(interval);
  }, [messageCounter]);

  return (
    <div className="relative w-full">
      {/* Coming Soon Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute -top-3 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="relative flex items-center gap-1.5 rounded-full border border-border bg-card backdrop-blur-md px-4 py-1.5 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-amber" />
          <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            Coming Soon
          </span>
        </div>
      </motion.div>

      {/* Main Container */}
      <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
        {/* Content */}
        <div className="relative px-4 py-8 sm:px-6 sm:py-10">
          {/* Header */}
          <div className="text-center mb-6">
            <h4 className="text-base sm:text-lg font-semibold text-foreground mb-1.5">
              Stream Your Saves
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-[300px] mx-auto">
              Connect our official Slack and Discord bots to stream your saves with notes directly to your channels
            </p>
          </div>

          {/* Two-column message queues */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <MessageStack messages={slackMessages} channel="slack" pulse={slackPulse} />
            <MessageStack messages={discordMessages} channel="discord" pulse={discordPulse} />
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card/80 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
