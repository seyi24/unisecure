"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
  type SpeechRecognitionInstance,
} from "@/lib/speech-recognition";

type UseSpeechRecognitionOptions = {
  lang?: string;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
};

export function useSpeechRecognition({
  lang = "en-US",
  onTranscript,
  onError,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;
  }, [onTranscript, onError]);

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      onErrorRef.current?.(
        "Voice input is not supported in this browser. Try Chrome or Edge."
      );
      return;
    }

    stop();

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";

      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      if (finalText) {
        onTranscriptRef.current(finalText.trim(), true);
      } else if (interim) {
        onTranscriptRef.current(interim.trim(), false);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        onErrorRef.current?.(
          event.error === "not-allowed"
            ? "Microphone access was denied."
            : "Voice input failed. Please try again."
        );
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [lang, stop]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return { isListening, isSupported, start, stop, toggle };
}
