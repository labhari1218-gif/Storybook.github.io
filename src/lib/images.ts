import stoneChariotHampi from "../assets/images/stone-chariot-hampi.jpg";
import teluguManuscript from "../assets/images/telugu-manuscript.jpg";
import vijayanagaraKrishnadevaraya from "../assets/images/vijayanagara-krishnadevaraya.jpg";
import visvesvarayaPortrait from "../assets/images/visvesvaraya-portrait.jpg";
import krsDam from "../assets/images/krs-dam.jpg";
import tirupatiTemple from "../assets/images/tirupati-temple.jpg";
import yadadriTemple from "../assets/images/yadadri-temple.jpg";
import sriharikotaLaunch from "../assets/images/sriharikota-launch.jpg";
import vemanaVerses from "../assets/images/vemana-verses.jpg";
import storyCatIllustration from "../assets/images/story-cat-illustration.svg";
import storyPotIllustration from "../assets/images/story-pot-illustration.svg";
import storyHorseIllustration from "../assets/images/story-horse-illustration.svg";
import storyCheatIllustration from "../assets/images/story-cheat-illustration.svg";
import tongueTwistersIllustration from "../assets/images/tongue-twisters-illustration.svg";
import vemanaPortraitIllustration from "../assets/images/vemana-portrait-illustration.svg";
import tenaliRamaWeb from "../assets/images/tenali-rama-web.jpg";
import vemanaWeb from "../assets/images/vemana-web.jpg";
import baahubaliSwords from "../assets/images/quiz/baahubali-swords.svg";
import baahubaliMountain from "../assets/images/quiz/baahubali-mountain.svg";
import baahubaliCrown from "../assets/images/quiz/baahubali-crown.svg";
import baahubaliBaby from "../assets/images/quiz/baahubali-baby.svg";
import baahubaliFort from "../assets/images/quiz/baahubali-fort.svg";
import baahubaliWithPrabhas from "../assets/reference-images/baahubali-safe/bahubali-with-prabhas.jpg";
import prabhasBahubaliPm from "../assets/reference-images/baahubali-safe/prabhas-bahubali-pm.jpg";
import prabhasSathyarajBahubaliSet from "../assets/reference-images/baahubali-safe/prabhas-sathyaraj-bahubali-set.jpg";
import sathyarajBahubaliCropped from "../assets/reference-images/baahubali-safe/sathyaraj-bahubali-cropped.jpg";
import ramyaKrishnan from "../assets/reference-images/baahubali-safe/ramya-krishnan.jpg";
import anushkaBaahubaliTrailer from "../assets/reference-images/baahubali-safe/anushka-baahubali-trailer.jpg";
import anushkaShettyPortrait from "../assets/reference-images/baahubali-safe/anushka-shetty-portrait.jpg";
import imageManifest from "../data/image-manifest.json";

const rawAssets = {
  "stone-chariot-hampi": stoneChariotHampi,
  "vijayanagara-krishnadevaraya": vijayanagaraKrishnadevaraya,
  "telugu-manuscript": teluguManuscript,
  "visvesvaraya-portrait": visvesvarayaPortrait,
  "krs-dam": krsDam,
  "tirupati-temple": tirupatiTemple,
  "yadadri-temple": yadadriTemple,
  "sriharikota-launch": sriharikotaLaunch,
  "vemana-verses": vemanaVerses,
  "story-cat-illustration": storyCatIllustration,
  "story-pot-illustration": storyPotIllustration,
  "story-horse-illustration": storyHorseIllustration,
  "story-cheat-illustration": storyCheatIllustration,
  "tongue-twisters-illustration": tongueTwistersIllustration,
  "vemana-portrait-illustration": vemanaPortraitIllustration,
  "tenali-rama-web": tenaliRamaWeb,
  "vemana-web": vemanaWeb,
  "baahubali-swords": baahubaliSwords,
  "baahubali-mountain": baahubaliMountain,
  "baahubali-crown": baahubaliCrown,
  "baahubali-baby": baahubaliBaby,
  "baahubali-fort": baahubaliFort,
  "bahubali-with-prabhas": baahubaliWithPrabhas,
  "prabhas-bahubali-pm": prabhasBahubaliPm,
  "prabhas-sathyaraj-bahubali-set": prabhasSathyarajBahubaliSet,
  "sathyaraj-bahubali-cropped": sathyarajBahubaliCropped,
  "ramya-krishnan": ramyaKrishnan,
  "anushka-baahubali-trailer": anushkaBaahubaliTrailer,
  "anushka-shetty-portrait": anushkaShettyPortrait,
} as const;

export type ImageId = keyof typeof rawAssets;

type AssetData = {
  src: string;
  width?: number;
  height?: number;
};

export type ResolvedImage = {
  id: ImageId;
  asset: AssetData;
  title: string;
  credit: string;
  license: string;
  sourceUrl?: string;
  path: string;
  presentation?: "photo" | "illustration";
};

function normalizeAsset(asset: (typeof rawAssets)[ImageId]): AssetData {
  if (typeof asset === "string") {
    return { src: asset };
  }

  return {
    src: asset.src,
    width: asset.width,
    height: asset.height,
  };
}

export const imageMap: Record<ImageId, ResolvedImage> = Object.fromEntries(
  Object.entries(rawAssets).map(([id, asset]) => [
    id,
    {
      id: id as ImageId,
      asset: normalizeAsset(asset as (typeof rawAssets)[ImageId]),
      ...(imageManifest[id as ImageId] as Omit<ResolvedImage, "asset" | "id">),
    },
  ]),
) as Record<ImageId, ResolvedImage>;

export function resolveImage(id: string) {
  return imageMap[id as ImageId];
}
