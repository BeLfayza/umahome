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
const randomBackgroundStorageKey = "umahome-random-background";

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
        onContextMenu={(event) => event.preventDefault()}
      >
        {characterContent}
      </a>
    );
  }

  return (
    <div
      className="lobby-character"
      style={characterStyle}
      aria-label={character.name}
      onContextMenu={(event) => event.preventDefault()}
    >
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
  const [randomBackgroundOnRefresh, setRandomBackgroundOnRefresh] = useState(false);

  useEffect(() => {
    let restoreTimer: number | undefined;

    try {
      const shouldRandomize = window.localStorage.getItem(randomBackgroundStorageKey) === "true";
      const savedBackground = window.localStorage.getItem(backgroundStorageKey);

      if (savedBackground && !backgrounds.some((item) => item.src === savedBackground)) {
        window.localStorage.removeItem(backgroundStorageKey);
      }

      restoreTimer = window.setTimeout(() => {
        setRandomBackgroundOnRefresh(shouldRandomize);

        const selectedBackground = shouldRandomize && backgrounds.length > 0
          ? backgrounds[Math.floor(Math.random() * backgrounds.length)].src
          : savedBackground && backgrounds.some((item) => item.src === savedBackground)
            ? savedBackground
            : null;

        setBackground(selectedBackground);

        if (shouldRandomize && selectedBackground) {
          try {
            window.localStorage.setItem(backgroundStorageKey, selectedBackground);
          } catch (error) {
            console.error("Unable to save the randomized background to browser storage.", error);
          }
        }
      }, 0);
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

  const toggleRandomBackground = (enabled: boolean) => {
    setRandomBackgroundOnRefresh(enabled);
    try {
      window.localStorage.setItem(randomBackgroundStorageKey, String(enabled));
    } catch (error) {
      console.error("Unable to save the random background setting to browser storage.", error);
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
        <div className="footer-actions">
          <a
            className="github-link"
            href="https://github.com/BeLfayza"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit BeLfayza on GitHub"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.3-5.467-1.332-5.467-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.536-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.957-.266 1.983-.4 3.003-.405 1.02.005 2.046.139 3.006.405 2.29-1.552 3.296-1.23 3.296-1.23.655 1.653.243 2.873.12 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.626-5.48 5.92.43.372.814 1.103.814 2.222 0 1.606-.015 2.9-.015 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12Z"
              />
            </svg>
          </a>
          <button
            className="change-background"
            type="button"
            aria-expanded={backgroundPanelOpen}
            aria-controls="background-panel"
            onClick={() => setBackgroundPanelOpen(true)}
          >
            CHANGE BACKGROUND
          </button>
        </div>
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
            <div className={`random-background-toggle${randomBackgroundOnRefresh ? " is-enabled" : ""}`}>
              <div className="random-background-copy">
                <p className="random-background-title">RANDOM ON REFRESH</p>
                <p className="random-background-description">
                  Pick a random background each time you open the lobby.
                </p>
              </div>
              <button
                className={`random-background-switch${randomBackgroundOnRefresh ? " is-enabled" : ""}`}
                type="button"
                role="switch"
                aria-label="Random background on refresh"
                aria-checked={randomBackgroundOnRefresh}
                disabled={backgrounds.length === 0}
                onClick={() => toggleRandomBackground(!randomBackgroundOnRefresh)}
              >
                <span aria-hidden="true" />
              </button>
              <span className="random-background-state" aria-hidden="true">
                {randomBackgroundOnRefresh ? "ON" : "OFF"}
              </span>
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
