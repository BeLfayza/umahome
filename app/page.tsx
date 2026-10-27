import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import Lobby from "./lobby";

const imageExtensions = new Set([".gif", ".webp", ".png", ".jpg", ".jpeg", ".avif"]);
const backgroundExtensions = new Set([...imageExtensions, ".svg"]);

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

async function getCharacters(): Promise<Character[]> {
  "use cache";
  cacheLife("hours");

  const charactersDirectory = path.join(process.cwd(), "public", "characters");
  const entries = await readdir(charactersDirectory, { withFileTypes: true });

  const characters = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const characterDirectory = path.join(charactersDirectory, entry.name);
        const files = await readdir(characterDirectory);
        const images = new Map(
          files
            .filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
            .map((file) => [path.basename(file, path.extname(file)).toLowerCase(), file]),
        );
        const stand = images.get("stand");
        const walkLeft = images.get("walk_left");
        const walkRight = images.get("walk_right");

        if (!stand || !walkLeft || !walkRight) {
          return null;
        }

        const basePath = `/characters/${encodeURIComponent(entry.name)}`;
        const linkFile = files.find((file) => file.toLowerCase() === "link.txt");
        const linkContent = linkFile
          ? (await readFile(path.join(characterDirectory, linkFile), "utf8")).trim()
          : "";

        let link: string | null = null;
        if (linkContent) {
          try {
            const url = new URL(linkContent);
            if (url.protocol === "http:" || url.protocol === "https:") {
              link = url.toString();
            }
          } catch {
            link = null;
          }
        }

        return {
          name: entry.name,
          stand: `${basePath}/${encodeURIComponent(stand)}`,
          walkLeft: `${basePath}/${encodeURIComponent(walkLeft)}`,
          walkRight: `${basePath}/${encodeURIComponent(walkRight)}`,
          link,
        };
      }),
  );

  return characters.filter((character): character is Character => character !== null);
}

async function getBackgrounds(): Promise<Background[]> {
  "use cache";
  cacheLife("hours");

  const backgroundsDirectory = path.join(process.cwd(), "public", "bekgron");
  const files = await readdir(backgroundsDirectory, { withFileTypes: true });

  return files
    .filter((file) => file.isFile() && backgroundExtensions.has(path.extname(file.name).toLowerCase()))
    .map((file) => ({
      name: path.basename(file.name, path.extname(file.name)),
      src: `/bekgron/${encodeURIComponent(file.name)}`,
    }));
}

export default async function Page() {
  const [characters, backgrounds] = await Promise.all([getCharacters(), getBackgrounds()]);

  return <Lobby characters={characters} backgrounds={backgrounds} />;
}
