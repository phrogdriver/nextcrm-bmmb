"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export type ParsedAddress = {
  address: string;       // street address
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  formatted: string;     // full formatted address
};

interface AddressAutocompleteProps {
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (address: ParsedAddress) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

let googleLoaded = false;
let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (googleLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    return Promise.reject(new Error("Google Maps API key not configured"));
  }

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject();
    if ((window as any).google?.maps?.places) {
      googleLoaded = true;
      return resolve();
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => {
      googleLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

function parsePlace(place: google.maps.places.PlaceResult): ParsedAddress {
  const components = place.address_components ?? [];

  const get = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name ?? "";
  const getShort = (type: string) =>
    components.find((c) => c.types.includes(type))?.short_name ?? "";

  const streetNumber = get("street_number");
  const route = get("route");
  const address = streetNumber ? `${streetNumber} ${route}` : route;

  return {
    address,
    city: get("locality") || get("sublocality"),
    state: getShort("administrative_area_level_1"),
    zip: get("postal_code"),
    lat: place.geometry?.location?.lat() ?? null,
    lng: place.geometry?.location?.lng() ?? null,
    formatted: place.formatted_address ?? "",
  };
}

export function AddressAutocomplete({
  value = "",
  onChange,
  onSelect,
  placeholder = "Start typing an address...",
  disabled,
  className,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setLoaded(true))
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "us" },
      types: ["address"],
      fields: ["address_components", "formatted_address", "geometry"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      const parsed = parsePlace(place);
      onChange?.(parsed.address);
      onSelect?.(parsed);
    });

    autocompleteRef.current = autocomplete;

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [loaded, onChange, onSelect]);

  // If Google Maps fails to load, fall back to a plain input
  if (error) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
    );
  }

  return (
    <div className="relative">
      <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        defaultValue={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || !loaded}
        className={cn("pl-8", className)}
      />
    </div>
  );
}
