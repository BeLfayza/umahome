"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Character = {
  name: string;
  stand: string;
  walkLeft: string;
  walkRight: string;
  link: string | null;
};

type Background = {
  name: string;
  src: string;
};

const backgroundStorageKey = "umahome-background";

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function CharacterSprite({
  character,
  initialPosition,
}: {
  character: Character;
  initialPosition: number;
}) {
  const [position, setPosition] = useState(initialPosition);
  const [walking, setWalking] = useState(false);
  const [facing, setFacing] = useState<"left" | "right">("right");
  const [walkDuration, setWalkDuration] = useState(4000);
  const positionRef = useRef(initialPosition);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let timer: number;
    let cancelled = false;

    const move = () => {
      if (cancelled) return;

      const viewportWidth = window.innerWidth;
      const characterWidth = Math.min(225, Math.max(132, viewportWidth * 0.18));
      const edgeMargin = (characterWidth / 2 + 8) / viewportWidth * 100;
      const minPosition = Math.max(5, edgeMargin);
      const maxPosition = Math.min(95, 100 - edgeMargin);
      const currentPosition = positionRef.current;
      let nextPosition = randomBetween(minPosition, maxPosition);

      if (Math.abs(nextPosition - currentPosition) < 12) {
        nextPosition = currentPosition < (minPosition + maxPosition) / 2
          ? randomBetween(Math.min(currentPosition + 12, maxPosition), maxPosition)
          : randomBetween(minPosition, Math.max(currentPosition - 12, minPosition));
      }

      const distance = Math.abs(nextPosition - currentPosition) / 100 * viewportWidth;
      const duration = Math.max(1800, Math.min(8500, distance / 65 * 1000));

      positionRef.current = nextPosition;
      setFacing(nextPosition < currentPosition ? "left" : "right");
      setWalkDuration(duration);
      setWalking(true);
      setPosition(nextPosition);

      timer = window.setTimeout(() => {
        if (cancelled) return;
        setWalking(false);
        timer = window.setTimeout(move, randomBetween(900, 2800));
      }, duration);
    };

    timer = window.setTimeout(move, randomBetween(500, 2200));

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const image = walking
    ? facing === "left"
      ? character.walkLeft
      : character.walkRight
    : character.stand;

  const characterStyle = {
    left: `${position}%`,
    transitionDuration: `${walkDuration}ms`,
  };
  const characterContent = (
    <>
      <Image
        src={image}
        alt={character.name}
        width={150}
        height={150}
        unoptimized
        loading="eager"
        draggable={false}
      />
      <Image
        className="lobby-character-shadow"
        src="/bayangan.svg"
        alt=""
        aria-hidden
        width={175}
        height={48}
        unoptimized
        draggable={false}
      />
      <span>{character.name}</span>
    </>
  );

  if (character.link) {
    return (
      <a
        className="lobby-character"
        style={characterStyle}
        aria-label={`Open ${character.name}`}
        href={character.link}
        target="_blank"
        rel="noopener noreferrer"
      >
        {characterContent}
      </a>
    );
  }

  return (
    <div className="lobby-character" style={characterStyle} aria-label={character.name}>
      {characterContent}
    </div>
  );
}

export default function Lobby({
  characters,
  backgrounds,
}: {
  characters: Character[];
  backgrounds: Background[];
}) {
  const [clock, setClock] = useState("");
  const [background, setBackground] = useState<string | null>(null);
  const [backgroundPanelOpen, setBackgroundPanelOpen] = useState(false);

  useEffect(() => {
    let restoreTimer: number | undefined;

    try {
      const savedBackground = window.localStorage.getItem(backgroundStorageKey);
      if (savedBackground && backgrounds.some((item) => item.src === savedBackground)) {
        // Defer restoration so server and initial client markup stay in sync.
        restoreTimer = window.setTimeout(() => setBackground(savedBackground), 0);
      } else if (savedBackground) {
        window.localStorage.removeItem(backgroundStorageKey);
      }
    } catch (error) {
      console.error("Unable to load the saved background from browser storage.", error);
    }

    return () => {
      if (restoreTimer !== undefined) {
        window.clearTimeout(restoreTimer);
      }
    };
  }, [backgrounds]);

  useEffect(() => {
    const updateClock = () => {
      setClock(new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).format(new Date()));
    };

    updateClock();
    const interval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const selectBackground = (src: string | null) => {
    setBackground(src);
    try {
      if (src) {
        window.localStorage.setItem(backgroundStorageKey, src);
      } else {
        window.localStorage.removeItem(backgroundStorageKey);
      }
    } catch (error) {
      console.error("Unable to save the selected background to browser storage.", error);
    }
  };

  return (
    <main
      className="lobby"
      style={background ? { backgroundImage: `url("${background}")` } : undefined}
    >
      <header className="lobby-header">
        <div className="lobby-brand">
          <p className="lobby-title">UMA <span>LOBBY</span></p>
          <time className="lobby-clock" aria-label="Local time">{clock || "--:--:--"}</time>
        </div>
        <form className="google-search" action="https://www.google.com/search" method="get" role="search">
          <label className="visually-hidden" htmlFor="google-search">Search Google</label>
          <input
            id="google-search"
            name="q"
            type="search"
            placeholder="Search Google"
            autoComplete="off"
            required
          />
          <button type="submit" aria-label="Search Google">SEARCH</button>
        </form>
        <div className="lobby-meta">
          <p className="lobby-count">
            <span className="status-dot" />
            {characters.length} {characters.length === 1 ? "CHARACTER" : "CHARACTERS"}
          </p>
        </div>
      </header>

      <section className="lobby-scene" aria-label="Character lobby">
        {characters.length > 0 ? (
          characters.map((character, index) => (
            <CharacterSprite
              key={character.name}
              character={character}
              initialPosition={((index + 1) / (characters.length + 1)) * 100}
            />
          ))
        ) : (
          <p className="empty-message">
            Add character folders to <code>public/characters</code> to populate the lobby.
          </p>
        )}
      </section>

      <footer className="lobby-footer">
        <span className="lobby-tagline">HANGING OUT · WALK · PAUSE · REPEAT</span>
        <button
          className="change-background"
          type="button"
          aria-expanded={backgroundPanelOpen}
          aria-controls="background-panel"
          onClick={() => setBackgroundPanelOpen(true)}
        >
          CHANGE BACKGROUND
        </button>
      </footer>

      {backgroundPanelOpen && (
        <button
          className="background-overlay"
          type="button"
          aria-label="Close background options"
          onClick={() => setBackgroundPanelOpen(false)}
        />
      )}
      <aside
        id="background-panel"
        className={`background-panel${backgroundPanelOpen ? " is-open" : ""}`}
        aria-label="Background options"
        aria-hidden={!backgroundPanelOpen}
      >
        {backgroundPanelOpen && (
          <>
            <div className="background-panel-header">
              <h2>CHANGE BACKGROUND</h2>
              <button
                className="background-close"
                type="button"
                aria-label="Close background options"
                onClick={() => setBackgroundPanelOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="background-options">
              <button
                className={`background-option background-default${background === null ? " is-selected" : ""}`}
                type="button"
                aria-pressed={background === null}
                onClick={() => selectBackground(null)}
              >
                <span className="background-preview" />
                <span>DEFAULT</span>
              </button>
              {backgrounds.map((item) => (
                <button
                  key={item.src}
                  className={`background-option${background === item.src ? " is-selected" : ""}`}
                  type="button"
                  aria-pressed={background === item.src}
                  onClick={() => selectBackground(item.src)}
                >
                  <span
                    className="background-preview"
                    style={{ backgroundImage: `url("${item.src}")` }}
                  />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </aside>
    </main>
  );
}
