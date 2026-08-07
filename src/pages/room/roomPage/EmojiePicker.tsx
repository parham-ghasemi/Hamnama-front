import { useEffect, useRef, useState } from "react";

type Props = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
};

const GROUPS: { id: string; icon: string; emojis: string[] }[] = [
  {
    id: "smileys",
    icon: "😀",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
      "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥳", "😏", "😶‍🌫️",
      "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🥴", "😵", "🤯", "🤠", "🥺", "😢", "😭", "😤",
      "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "🤗", "🤔", "🤭", "🤫", "🤥", "😶",
    ],
  },
  {
    id: "gestures",
    icon: "👍",
    emojis: [
      "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️",
      "🖖", "👋", "🤝", "🙏", "💪", "🦾", "👏", "🙌", "👐", "🤲", "✍️", "💅", "👀", "🫶", "🤌", "🫰",
    ],
  },
  {
    id: "hearts",
    icon: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
      "💘", "💝", "💟", "✨", "⭐", "🌟", "💫", "🔥", "💥", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "👑",
    ],
  },
  {
    id: "objects",
    icon: "🍿",
    emojis: [
      "🍿", "🎬", "🎥", "📺", "🎮", "🎧", "🎵", "🎤", "☕", "🍕", "🍔", "🍟", "🌮", "🍩", "🍪", "🍫",
      "🍭", "🥤", "🍺", "🍻", "🥂", "⚽", "🏀", "🎯", "🚀", "🌈", "☀️", "🌙", "⚡", "💤", "💯", "✅",
    ],
  },
];

const EmojiPicker = ({ onSelect, onClose }: Props) => {
  const [group, setGroup] = useState(GROUPS[0].id);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      const target = e.target as Node;
      if (!ref.current.contains(target) && !(target as HTMLElement).closest?.("[data-emoji-trigger]")) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const active = GROUPS.find((g) => g.id === group) ?? GROUPS[0];

  return (
    <div className="room-page__chat-container__foot__emoji-popover" ref={ref}>
      <div className="room-page__chat-container__foot__emoji-popover__tabs">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            className={g.id === group ? "is-active" : undefined}
            onClick={() => setGroup(g.id)}
            aria-label={g.id}
          >
            {g.icon}
          </button>
        ))}
      </div>

      <div className="room-page__chat-container__foot__emoji-popover__grid">
        {active.emojis.map((emoji, i) => (
          <button key={`${emoji}-${i}`} type="button" onClick={() => onSelect(emoji)}>
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
