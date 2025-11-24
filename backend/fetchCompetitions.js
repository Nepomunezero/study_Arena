// fetchcompetitions.js
import fetch from "node-fetch";

/**
 * Fetch courses from Coursera API and normalize fields:
 * returns array of { id, name, description, startDate, type, url }
 */
export async function fetchCourses({ start = 0, limit = 50 } = {}) {
  const endpoint = `https://api.coursera.org/api/courses.v1?start=${start}&limit=${limit}`;
  const res = await fetch(endpoint, { timeout: 10000 });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Coursera API error ${res.status}: ${txt}`);
  }
  const json = await res.json();

  // 'elements' holds course info; map to normalized form
  const items = (json.elements || []).map(el => {
    const name = el.name || el.courseName || el.localizedName || "Untitled";
    const description = el.shortDescription || el.description || el.about || "";
    const startDate = el.startDate || el.launchDate || "";
    // Heuristic for "type"
    const type = (el.primaryLanguages && el.primaryLanguages.includes("en")) ? "academic" : "professional";
    const slug = el.slug || el.id || "";
    const url = slug ? `https://www.coursera.org/learn/${slug}` : "";
    return {
      id: el.id || slug,
      name,
      description,
      startDate,
      type,
      url
    };
  });

  return items;
}
