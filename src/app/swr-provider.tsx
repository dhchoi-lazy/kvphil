"use client";
import { SWRConfig } from "swr";
export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SWRConfig
      value={{
        fetcher: (url) => {
          // Check if this is an internal useChat key (they contain commas and special patterns)
          if (
            url.includes(",:R") ||
            url.includes(",error") ||
            url.includes(",streamData") ||
            url.includes(",loading")
          ) {
            // Return empty data for internal useChat keys to prevent actual HTTP requests
            return Promise.resolve([]);
          }

          // For normal URLs, proceed with the fetch
          return fetch(
            `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${url.trim()}`
          ).then((res) => {
            if (res.ok) {
              return res.json();
            } else {
              return Promise.reject(
                new Error(`Failed to fetch: ${res.status}`)
              );
            }
          });
        },
      }}
    >
      {children}
    </SWRConfig>
  );
};
