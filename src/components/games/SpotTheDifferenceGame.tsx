"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { CampaignData } from "@/types";
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

interface Props {
  campaignDetails: CampaignData;
  campaignId: string;
  previewMode?: boolean;
  availableCampaigns?: any[];
}

export function SpotTheDifferenceGame({
  campaignDetails,
  campaignId,
  previewMode = false,
}: Props) {
  const user = useAtomValue(userAtom);
  const [marks, setMarks] = useState<{ x: number; y: number }[]>([]);
  const [startedAt] = useState<number>(() => Date.now());
  const [submitting, setSubmitting] = useState(false);

  const puzzleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMarks([]);
  }, [campaignId]);

  const handleClick = (e: React.MouseEvent) => {
    if (!puzzleRef.current) return;
    const rect = puzzleRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 1000;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 1000;
    setMarks((m) => [...m, { x, y }]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const timeTaken = Date.now() - startedAt;
    try {
      await axios.post(
        endpointUrl(ENDPOINTS.SUBMIT_PUZZLE_ANSWER(campaignId)),
        {
          timeTaken,
          solved: true,
          differencesFound: marks.map((p) => ({
            x: p.x,
            y: p.y,
            width: 0.03,
            height: 0.03,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );
      // TODO: show success toast / navigate to result
    } catch (err) {
      // TODO: handle error properly
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative bg-card/50 rounded overflow-hidden">
          <div className="p-2 text-sm text-white/70">Original</div>
          {campaignDetails.originalImageUrl ? (
            <img
              src={campaignDetails.originalImageUrl}
              alt="original"
              className="w-full h-auto object-contain"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-white/50">
              No original image provided
            </div>
          )}
        </div>

        <div className="relative bg-card/50 rounded overflow-hidden">
          <div className="p-2 text-sm text-white/70">Puzzle</div>
          <div
            ref={puzzleRef}
            onClick={handleClick}
            className="relative cursor-crosshair">
            {campaignDetails.puzzleImageUrl ? (
              <img
                src={campaignDetails.puzzleImageUrl}
                alt="puzzle"
                className="w-full h-auto object-contain"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-white/50">
                No puzzle image provided
              </div>
            )}
            {marks.map((m, idx) => (
              <div
                key={idx}
                style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                className="absolute w-6 h-6 rounded-full bg-red-500/80 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="text-white/80">
          Marks: <span className="font-mono">{marks.length}</span>
        </div>
        <div className="text-white/80">
          Time:{" "}
          <span className="font-mono">
            {formatTime(Date.now() - startedAt)}
          </span>
        </div>
        <div className="ml-auto">
          <Button
            onClick={handleSubmit}
            disabled={submitting || previewMode || marks.length === 0}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SpotTheDifferenceGame;
