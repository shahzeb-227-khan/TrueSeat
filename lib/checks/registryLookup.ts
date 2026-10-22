import type { SupabaseClient } from "@supabase/supabase-js";
import type { DestinationCountry, Institution } from "@/lib/schemas";

const LISTED_THRESHOLD = 0.6;
const AMBIGUOUS_GAP = 0.08;

export function normaliseName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugFor(name: string): string {
  return normaliseName(name).replace(/\s+/g, "");
}

type InstitutionRow = {
  id: string;
  name: string;
  country: DestinationCountry;
  registry_id: string | null;
  registry_status: string | null;
  similarity: number;
};

export type RegistryLookupResult =
  | { result: "listed"; matched: Institution; candidates: Institution[]; snapshotId: string | null }
  | { result: "ambiguous"; matched: null; candidates: Institution[]; snapshotId: string | null }
  | { result: "not_found"; matched: null; candidates: Institution[]; snapshotId: string | null }
  | { result: "country_not_supported"; matched: null; candidates: Institution[]; snapshotId: string | null };

function toInstitution(row: InstitutionRow): Institution {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    registryId: row.registry_id,
    registryStatus: row.registry_status,
  };
}

/**
 * Looks up an institution name against the seeded registry subset using
 * trigram similarity (search_institutions RPC, added by the
 * create_reference_and_run_tables migration). Missing data -> not_found,
 * never a false positive match (AGENTS.md: "Missing domain... gives
 * unknown, never mismatch" -- the same principle applies to the registry).
 */
export async function lookupInstitution(
  supabase: SupabaseClient,
  rawName: string,
  country: DestinationCountry
): Promise<RegistryLookupResult> {
  if (country === "OTHER") {
    return { result: "country_not_supported", matched: null, candidates: [], snapshotId: null };
  }

  const { data, error } = await supabase.rpc("search_institutions", {
    query_name: normaliseName(rawName),
    query_country: country,
  });

  if (error || !data) {
    return { result: "not_found", matched: null, candidates: [], snapshotId: null };
  }

  const rows = data as InstitutionRow[];
  if (rows.length === 0) {
    return { result: "not_found", matched: null, candidates: [], snapshotId: null };
  }

  const candidates = rows.map(toInstitution);
  const best = rows[0];
  const second = rows[1];

  if (best.similarity < LISTED_THRESHOLD) {
    return { result: "not_found", matched: null, candidates, snapshotId: null };
  }

  if (second && best.similarity - second.similarity < AMBIGUOUS_GAP) {
    return { result: "ambiguous", matched: null, candidates, snapshotId: null };
  }

  return { result: "listed", matched: toInstitution(best), candidates, snapshotId: null };
}

export async function officialDomainsFor(supabase: SupabaseClient, institutionId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("institution_domains")
    .select("domain")
    .eq("institution_id", institutionId);
  if (error || !data) return [];
  return (data as Array<{ domain: string }>).map((d) => d.domain);
}
