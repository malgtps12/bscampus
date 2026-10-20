import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/products", "/about", "/login", "/register", "/sell"];

  return routes.map((route) => ({
    url: new URL(route, APP_URL).toString(),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : route === "/products" ? 0.8 : 0.5,
  }));
}
