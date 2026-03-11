import stoneChariotHampi from "../assets/images/stone-chariot-hampi.jpg";
import teluguManuscript from "../assets/images/telugu-manuscript.jpg";
import vijayanagaraKrishnadevaraya from "../assets/images/vijayanagara-krishnadevaraya.jpg";
import visvesvarayaPortrait from "../assets/images/visvesvaraya-portrait.jpg";
import krsDam from "../assets/images/krs-dam.jpg";
import tirupatiTemple from "../assets/images/tirupati-temple.jpg";
import yadadriTemple from "../assets/images/yadadri-temple.jpg";
import sriharikotaLaunch from "../assets/images/sriharikota-launch.jpg";
import vemanaVerses from "../assets/images/vemana-verses.jpg";
import imageManifest from "../data/image-manifest.json";

const assets = {
  "stone-chariot-hampi": stoneChariotHampi,
  "vijayanagara-krishnadevaraya": vijayanagaraKrishnadevaraya,
  "telugu-manuscript": teluguManuscript,
  "visvesvaraya-portrait": visvesvarayaPortrait,
  "krs-dam": krsDam,
  "tirupati-temple": tirupatiTemple,
  "yadadri-temple": yadadriTemple,
  "sriharikota-launch": sriharikotaLaunch,
  "vemana-verses": vemanaVerses,
} as const;

export type ImageId = keyof typeof assets;

export type ResolvedImage = {
  id: ImageId;
  asset: (typeof assets)[ImageId];
  title: string;
  credit: string;
  license: string;
  sourceUrl: string;
  path: string;
};

export const imageMap: Record<ImageId, ResolvedImage> = Object.fromEntries(
  Object.entries(assets).map(([id, asset]) => [
    id,
    {
      id: id as ImageId,
      asset,
      ...(imageManifest[id as ImageId] as Omit<ResolvedImage, "asset" | "id">),
    },
  ]),
) as Record<ImageId, ResolvedImage>;

export function resolveImage(id: string) {
  return imageMap[id as ImageId];
}
