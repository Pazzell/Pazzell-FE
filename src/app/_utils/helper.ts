import { BASE_URL } from "./constants";

// append endpoint url to base url
export const endpointUrl = (endpoint: string) => {
  return `${BASE_URL}${endpoint}`;
};

export const formatPuzzleType = (type: string) => {
  return type
    ?.split("_")
    ?.map((word) => word.charAt(0)?.toUpperCase() + word.slice(1))
    .join(" ");
};

export const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};
