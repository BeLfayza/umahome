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

type LobbyVisibility = {
  title: boolean;
  clock: boolean;
  search: boolean;
  count: boolean;
  tagline: boolean;
  characterNames: boolean;
  characterLinks: boolean;
};

const displaySettings: { key: keyof LobbyVisibility; label: string }[] = [
  { key: "title", label: "LOBBY TITLE" },
  { key: "clock", label: "CLOCK & DATE" },
  { key: "search", label: "SEARCH BAR" },
  { key: "count", label: "CHARACTER COUNT" },
  { key: "tagline", label: "FOOTER TAGLINE" },
  { key: "characterNames", label: "CHARACTER NAMES" },
  { key: "characterLinks", label: "ENABLE CLICKABLE CHARACTERS" },
];

const defaultLobbyVisibility: LobbyVisibility = {
  title: true,
  clock: true,
  search: true,
  count: true,
  tagline: true,
  characterNames: true,
  characterLinks: true,
};

const backgroundStorageKey = "umahome-background";
const randomBackgroundStorageKey = "umahome-random-background";
const visibilityStorageKey = "umahome-visibility";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

type SpawnPosition = {
  left: number;
  bottom: number;
};

function getRandomSpawnPositions(count: number): SpawnPosition[] {
  return Array.from({ length: count }, () => ({
    left: randomBetween(8, 92),
    bottom: randomBetween(4, 34),
  }));
}

function CharacterSprite({
  character,
  initialLeft,
  initialBottom,
  showName,
  allowLink,
}: {
  character: Character;
  initialLeft: number;
  initialBottom: number;
  showName: boolean;
  allowLink: boolean;
}) {
  const [position, setPosition] = useState(initialLeft);
  const [bottom, setBottom] = useState(initialBottom);
  const [walking, setWalking] = useState(false);
  const [facing, setFacing] = useState<"left" | "right">("right");
  const [walkDuration, setWalkDuration] = useState(4000);
  const positionRef = useRef(initialLeft);
  const facingRef = useRef<"left" | "right" | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    const updateDepth = () => {
      const layer = layerRef.current;
      if (layer) {
        const { bottom: screenBottom } = layer.getBoundingClientRect();
        layer.style.zIndex = String(Math.round(10000 + screenBottom * 10));
      }

      frame = window.requestAnimationFrame(updateDepth);
    };

    frame = window.requestAnimationFrame(updateDepth);
    return () => window.cancelAnimationFrame(frame);
  }, []);

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

      const shouldReverse = facingRef.current !== null && Math.random() < 0.2;
      if (shouldReverse) {
        const reverseDirection = facingRef.current === "left" ? "right" : "left";
        const hasRoomToReverse = reverseDirection === "left"
          ? currentPosition > minPosition
          : currentPosition < maxPosition;

        if (hasRoomToReverse) {
          nextPosition = reverseDirection === "left"
            ? randomBetween(minPosition, currentPosition)
            : randomBetween(currentPosition, maxPosition);
        }
      }

      if (nextPosition === currentPosition) {
        nextPosition = currentPosition === maxPosition ? minPosition : maxPosition;
      }

      const duration = Math.floor(Math.random() * 15 + 1) * 1000;
      const nextBottom = randomBetween(4, 34);
      const nextFacing = nextPosition < currentPosition ? "left" : "right";

      positionRef.current = nextPosition;
      facingRef.current = nextFacing;
      setFacing(nextFacing);
      setWalkDuration(duration);
      setWalking(true);
      setPosition(nextPosition);
      setBottom(nextBottom);

      timer = window.setTimeout(() => {
        if (cancelled) return;
        setWalking(false);
        timer = window.setTimeout(move, Math.floor(Math.random() * 15 + 1) * 1000);
      }, duration);
    };

    timer = window.setTimeout(move, Math.floor(Math.random() * 15 + 1) * 1000);

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

  const layerStyle = {
    left: `${position}%`,
    bottom: `${bottom}%`,
    zIndex: 1,
    transform: "translateX(-50%)",
    transitionDuration: `${walkDuration}ms`,
  };
  const characterContent = (
    <>
      <span className={showName ? undefined : "is-hidden"}>{character.name}</span>
      <Image
        src={image}
        alt={character.name}
        width={150}
        height={150}
        unoptimized
        loading="eager"
        draggable={false}
      />
    </>
  );

  return (
    <div ref={layerRef} className="lobby-character-layer" style={layerStyle}>
      <div className="lobby-character-shadow" aria-hidden="true">
        <Image
          className="lobby-shadow-image"
          src="/bayangan.svg"
          alt=""
          width={175}
          height={48}
          unoptimized
          draggable={false}
        />
      </div>
      <div
        className={`lobby-character${character.link && allowLink ? " is-link" : ""}`}
        style={{ transform: "translateY(-14px)" }}
        onContextMenu={(event) => event.preventDefault()}
      >
        {character.link && allowLink ? (
          <a
            className="lobby-character-link"
            href={character.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${character.name}`}
          >
            {characterContent}
          </a>
        ) : characterContent}
      </div>
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
  const [date, setDate] = useState("");
  const [background, setBackground] = useState<string | null>(null);
  const [backgroundPanelOpen, setBackgroundPanelOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [randomBackgroundOnRefresh, setRandomBackgroundOnRefresh] = useState(false);
  const [visibleElements, setVisibleElements] = useState(defaultLobbyVisibility);
  const [spawnPositions, setSpawnPositions] = useState<SpawnPosition[] | null>(null);

  useEffect(() => {
    const spawnTimer = window.setTimeout(() => {
      setSpawnPositions(getRandomSpawnPositions(characters.length));
    }, 0);

    return () => window.clearTimeout(spawnTimer);
  }, [characters.length]);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const savedVisibility = window.localStorage.getItem(visibilityStorageKey);
        if (!savedVisibility) return;

        const parsed: unknown = JSON.parse(savedVisibility);
        if (!isRecord(parsed)) {
          throw new Error("Saved visibility settings must be an object.");
        }

        const restoredVisibility = { ...defaultLobbyVisibility };
        for (const { key } of displaySettings) {
          const value = parsed[key];
          if (typeof value === "boolean") {
            restoredVisibility[key] = value;
          }
        }
        setVisibleElements(restoredVisibility);
      } catch (error) {
        console.error("Unable to load saved visibility settings from browser storage.", error);
      }
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

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
      const now = new Date();
      setClock(new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).format(now));
      setDate(new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(now));
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

  const toggleVisibility = (key: keyof LobbyVisibility) => {
    const updatedVisibility = { ...visibleElements, [key]: !visibleElements[key] };
    setVisibleElements(updatedVisibility);
    try {
      window.localStorage.setItem(visibilityStorageKey, JSON.stringify(updatedVisibility));
    } catch (error) {
      console.error("Unable to save visibility settings to browser storage.", error);
    }
  };

  return (
    <main
      className="lobby"
      style={background ? { backgroundImage: `url("${background}")` } : undefined}
    >
      <header className="lobby-header">
        <div className="lobby-brand">
          {visibleElements.title && <p className="lobby-title">UMA <span>LOBBY</span></p>}
          {visibleElements.clock && (
            <div className="lobby-datetime">
              <time className="lobby-clock" aria-label="Local time">{clock || "--:--:--"}</time>
              <time className="lobby-date" aria-label="Current date">{date}</time>
            </div>
          )}
        </div>
        {visibleElements.search && (
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
        )}
        {visibleElements.count && (
          <div className="lobby-meta">
            <p className="lobby-count">
              <span className="status-dot" />
              {characters.length} {characters.length === 1 ? "CHARACTER" : "CHARACTERS"}
            </p>
          </div>
        )}
      </header>

      <section className="lobby-scene" aria-label="Character lobby">
        {characters.length > 0 ? (
          spawnPositions?.length === characters.length && characters.map((character, index) => (
            <CharacterSprite
              key={character.name}
              character={character}
              initialLeft={spawnPositions[index].left}
              initialBottom={spawnPositions[index].bottom}
              showName={visibleElements.characterNames}
              allowLink={visibleElements.characterLinks}
            />
          ))
        ) : (
          <p className="empty-message">
            Add character folders to <code>public/characters</code> to populate the lobby.
          </p>
        )}
      </section>

      <footer className="lobby-footer">
        {visibleElements.tagline && (
          <span className="lobby-tagline">HANGING OUT · WALK · PAUSE · REPEAT</span>
        )}
        <div className="footer-actions">
          <button
            className="settings-button"
            type="button"
            aria-label="Open settings"
            aria-expanded={settingsPanelOpen}
            aria-controls="settings-panel"
            onClick={() => setSettingsPanelOpen(true)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
              />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.67 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
              />
            </svg>
          </button>
        </div>
      </footer>

      {(settingsPanelOpen || backgroundPanelOpen) && (
        <button
          className="background-overlay"
          type="button"
          aria-label="Close settings"
          onClick={() => {
            setBackgroundPanelOpen(false);
            setSettingsPanelOpen(false);
          }}
        />
      )}
      <aside
        id="settings-panel"
        className={`settings-panel${settingsPanelOpen ? " is-open" : ""}`}
        aria-label="Settings"
        aria-hidden={!settingsPanelOpen}
      >
        {settingsPanelOpen && (
          <>
            <div className="settings-panel-header">
              <h2>SETTINGS</h2>
              <button
                className="background-close"
                type="button"
                aria-label="Close settings"
                onClick={() => setSettingsPanelOpen(false)}
              >
                ×
              </button>
            </div>
            <section className="settings-section" aria-labelledby="display-settings-title">
              <h3 id="display-settings-title" className="settings-section-title">DISPLAY</h3>
              {displaySettings.map(({ key, label }) => (
                <div className="visibility-option" key={key}>
                  <span>{label}</span>
                  <button
                    className={`visibility-switch${visibleElements[key] ? " is-enabled" : ""}`}
                    type="button"
                    role="switch"
                    aria-label={`Show ${label.toLowerCase()}`}
                    aria-checked={visibleElements[key]}
                    onClick={() => toggleVisibility(key)}
                  >
                    <span aria-hidden="true" />
                  </button>
                </div>
              ))}
              <p className="settings-note">Character sprites always stay visible.</p>
            </section>
            <button
              className="change-background"
              type="button"
              aria-expanded={backgroundPanelOpen}
              aria-controls="background-panel"
              onClick={() => setBackgroundPanelOpen((open) => !open)}
            >
              <svg
                className="change-background-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="16"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <circle cx="8.5" cy="9" r="1.5" fill="currentColor" />
                <path
                  d="m5 17 5-5 3 3 2-2 4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>CHANGE BACKGROUND</span>
            </button>
            <div className="settings-actions">
              <a
                className="settings-link"
                href="https://github.com/BeLfayza"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.3-5.467-1.332-5.467-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.536-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.957-.266 1.983-.4 3.003-.405 1.02.005 2.046.139 3.006.405 2.29-1.552 3.296-1.23 3.296-1.23.655 1.653.243 2.873.12 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.626-5.48 5.92.43.372.814 1.103.814 2.222 0 1.606-.015 2.9-.015 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12Z"
                  />
                </svg>
                <span>GITHUB</span>
              </a>
              <div className="force-refresh-option">
                <p className="force-refresh-description">
                  Press CTRL + F5 if a new content is not loading
                </p>
              </div>
            </div>
          </>
        )}
      </aside>
      <aside
        id="background-panel"
        className={`background-panel${backgroundPanelOpen ? " is-open" : ""}${settingsPanelOpen ? " is-adjacent" : ""}`}
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
