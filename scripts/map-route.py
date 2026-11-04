#!/usr/bin/env python3
"""Bakes one /map-route example: buildings, paths and the real walking route, from OpenStreetMap.

    python3 scripts/map-route.py <name> "<from lat,lng>" "<to lat,lng>"

Writes public/styles/<name>.json, so a render never touches the network. The minutes are the product's
own walking estimate: straight line x 1.3, at 88 m a minute (2026-11-01).
"""
import heapq, json, math, os, subprocess, sys

name, a, b = sys.argv[1:4]
start = tuple(float(v) for v in a.split(","))
end = tuple(float(v) for v in b.split(","))
pad = 0.0045
south, north = min(start[0], end[0]) - pad, max(start[0], end[0]) + pad
west, east = min(start[1], end[1]) - pad * 1.3, max(start[1], end[1]) + pad * 1.3
box = f"{south},{west},{north},{east}"
query = f'[out:json][timeout:40];(way["building"]({box});way["highway"~"footway|path|pedestrian|service|residential|tertiary|secondary"]({box}););out geom;'
raw = subprocess.run(
    ["curl", "-s", "-m", "60", "-A", "campusai-studio/1.0", "-H", "Accept: application/json", "--data-urlencode", f"data={query}",
     "https://overpass-api.de/api/interpreter"],
    capture_output=True, text=True, check=True,
).stdout
elements = json.loads(raw)["elements"]

lat0, lng0 = (start[0] + end[0]) / 2, (start[1] + end[1]) / 2
xy = lambda p: ((p[1] - lng0) * math.cos(math.radians(lat0)) * 111320, (lat0 - p[0]) * 110540)
out = lambda p: [round(v, 1) for v in xy(p)]
buildings, ways, graph = [], [], {}
for e in elements:
    if "geometry" not in e:
        continue
    tags = e.get("tags", {})
    pts = [(n["lat"], n["lon"]) for n in e["geometry"]]
    if "building" in tags:
        levels = tags.get("building:levels", "")
        guess = 10 + ((e["id"] * 2654435761) % 1000) / 1000 * 16
        height = float(levels) * 4 if levels.replace(".", "").isdigit() else guess
        buildings.append({"n": tags.get("name", ""), "h": round(height, 1), "p": [out(p) for p in pts[:-1]]})
        continue
    ways.append({"k": tags.get("highway"), "p": [out(p) for p in pts]})
    if tags.get("highway") != "secondary":
        for p, q in zip(pts, pts[1:]):
            d = math.dist(xy(p), xy(q))
            graph.setdefault(p, []).append((q, d))
            graph.setdefault(q, []).append((p, d))

near = lambda t: min(graph, key=lambda n: math.dist(xy(n), xy(t)))
s, t = near(start), near(end)
dist, prev, queue = {s: 0}, {}, [(0, s)]
while queue:
    c, u = heapq.heappop(queue)
    if u == t:
        break
    for v, l in graph[u]:
        if c + l < dist.get(v, 1e18):
            dist[v], prev[v] = c + l, u
            heapq.heappush(queue, (c + l, v))
if t not in dist:
    sys.exit("No walking path joins those two points in OpenStreetMap.")
route = [t]
while route[-1] != s:
    route.append(prev[route[-1]])
route.reverse()
air = math.dist(xy(start), xy(end))
path = os.path.join(os.path.dirname(__file__), "..", "public", "styles", f"{name}.json")
json.dump({"buildings": buildings, "ways": ways, "route": [out(p) for p in route], "routeMeters": round(dist[t]), "minutes": max(1, round(air * 1.3 / 88))},
          open(path, "w"), separators=(",", ":"))
print(f"{name}: {len(buildings)} buildings, {round(dist[t])} m, {max(1, round(air * 1.3 / 88))} min")
print("Named buildings near the end:", [b["n"] for b in buildings if b["n"]][:30])
