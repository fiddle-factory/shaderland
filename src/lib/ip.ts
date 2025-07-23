import { NextRequest } from "next/server";
import { IPAPILocation } from "./types";

/**
 * Extracts the client's IP address from the request headers.
 * Works for both local development and Cloudflare Workers deployment.
 *
 * @param req - NextRequest object
 * @returns The client's IP address or null if not found
 */
export function getClientIP(req: NextRequest): string | null {
  // Check Cloudflare-specific header first
  const cfIP = req.headers.get("CF-Connecting-IP");
  if (cfIP) return cfIP;

  // Check standard forwarded headers
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return xForwardedFor.split(",")[0].trim();
  }

  // Check other common headers
  const xRealIP = req.headers.get("x-real-ip");
  if (xRealIP) return xRealIP;

  // Check forwarded header (RFC 7239)
  const forwarded = req.headers.get("forwarded");
  if (forwarded) {
    const forMatch = forwarded.match(/for=([^;,\s]+)/);
    if (forMatch) {
      const ip = forMatch[1].replace(/"/g, "");
      // Remove port if present (IPv4 format)
      return ip.includes(":") ? ip.split(":")[0] : ip;
    }
  }

  // For local development, this might be localhost
  return null;
}

/**
 * Fetches geolocation data for the given IP address using ip-api.com
 *
 * @param ip - IP address to look up
 * @returns Promise resolving to location data or null if failed
 */
export async function getLocationFromIP(
  ip: string
): Promise<IPAPILocation | null> {
  try {
    // Skip geolocation for localhost/private IPs
    if (isPrivateIP(ip)) {
      return null;
    }

    const response = await fetch(`http://ip-api.com/json/${ip}`, {
      headers: {
        "User-Agent": "shaderland-app/1.0",
      },
    });

    if (!response.ok) {
      console.warn(`Geolocation API failed: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as IPAPILocation;
    return data;
  } catch (error) {
    console.error("Failed to fetch geolocation:", error);
    return null;
  }
}

/**
 * Checks if an IP address is private/local
 *
 * @param ip - IP address to check
 * @returns true if the IP is private/local
 */
function isPrivateIP(ip: string): boolean {
  if (!ip) return true;

  // localhost
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
    return true;
  }

  // Private IPv4 ranges
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./, // link-local
  ];

  return privateRanges.some((range) => range.test(ip));
}
