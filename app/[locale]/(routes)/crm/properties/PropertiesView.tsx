"use client";

import Link from "next/link";
import { MapPin, Briefcase, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { PropertyListItem } from "@/actions/crm/properties/get-properties";

function getOwnerName(owner: PropertyListItem["owner"]): string {
  if (!owner) return "No owner";
  return [owner.first_name, owner.last_name].filter(Boolean).join(" ");
}

export function PropertiesView({ properties }: { properties: PropertyListItem[] }) {
  const [search, setSearch] = useState("");

  const filtered = properties.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.address.toLowerCase().includes(q) ||
      (p.city?.toLowerCase().includes(q) ?? false) ||
      (p.zip?.includes(q) ?? false) ||
      getOwnerName(p.owner).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by address, city, zip, or owner…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No properties found</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((property) => (
            <Card key={property.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">{property.address}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {[property.city, property.state, property.zip].filter(Boolean).join(", ")}
                    </p>
                    {property.owner && (
                      <div className="flex items-center gap-2 pl-6">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <Link
                          href={`/crm/contacts/${property.owner.id}`}
                          className="text-sm hover:underline"
                        >
                          {getOwnerName(property.owner)}
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {property.property_type && (
                      <Badge variant="outline" className="text-xs">{property.property_type}</Badge>
                    )}
                  </div>
                </div>
                {property.jobs.length > 0 && (
                  <div className="mt-3 pl-6 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Jobs ({property.jobs.length})
                    </p>
                    {property.jobs.map((job) => (
                      <div key={job.id} className="flex items-center gap-2">
                        <Briefcase className="h-3 w-3 text-muted-foreground" />
                        <Link
                          href={`/crm/opportunities/${job.id}`}
                          className="text-sm hover:underline"
                        >
                          {job.name || "Untitled"}
                        </Link>
                        {job.status && (
                          <Badge variant="secondary" className="text-[10px] h-4">
                            {job.status}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {property.jobs.length === 0 && (
                  <p className="mt-3 pl-6 text-xs text-muted-foreground">No jobs</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
