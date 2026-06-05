// NOVA — Download proxy
// Streams a remote media file through our server so the user gets a real
// "Save As" download instead of the browser opening the video in a new tab.
// This also bypasses CORS restrictions some CDNs have for direct downloads.

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");
    const filename = searchParams.get("filename") || "download";

    if (!targetUrl) {
      return Response.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Validate it's a real URL
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Allow only http(s) — prevent SSRF to internal services
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return Response.json({ error: "Unsupported protocol" }, { status: 400 });
    }

    // Block internal/private IPs
    const hostname = parsed.hostname.toLowerCase();
    const blocked = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "169.254.169.254", // AWS metadata
    ];
    if (
      blocked.includes(hostname) ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    ) {
      return Response.json({ error: "Blocked host" }, { status: 400 });
    }

    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: parsed.origin,
      },
      redirect: "follow",
    });

    if (!upstream.ok) {
      return Response.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: 502 },
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");

    // Sanitize filename provided by the frontend
    const cleanName =
      String(filename)
        .replace(/[^\w\u0600-\u06FF.\- ]/g, "")
        .slice(0, 150)
        .trim() || "download";

    // Extract requested extension from frontend filename if exists
    const hasRequestedExt = cleanName.includes(".");
    const requestedExt = hasRequestedExt ? cleanName.split('.').pop().toLowerCase() : null;

    // Determine fallback extension from content type if frontend didn't provide one
    let ext = "bin";
    if (contentType.includes("mp4") || contentType.includes("video")) ext = "mp4";
    else if (contentType.includes("mpeg") || contentType.includes("audio")) ext = "mp3";
    else if (contentType.includes("webm")) ext = "webm";
    else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
    else if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("webp")) ext = "webp";

    // Force the requested extension if the user explicitly asked for mp3 or mp4, overriding the Content-Type
    if (requestedExt === "mp3" || requestedExt === "mp4" || requestedExt === "webm") {
      ext = requestedExt;
    }

    const finalName = hasRequestedExt ? cleanName : `${cleanName}.${ext}`;
    // Fallback safe ascii filename
    const safeAsciiName = `download.${ext}`;
    
    // Override contentType to match the forced extension so strict browsers don't ignore it
    let finalContentType = contentType;
    if (ext === "mp3") finalContentType = "audio/mpeg";
    else if (ext === "mp4") finalContentType = "video/mp4";
    else if (ext === "webm") finalContentType = "video/webm";

    const isPreview = searchParams.get("preview") === "1";

    const headers = {
      "Content-Type": finalContentType,
      "Cache-Control": isPreview ? "public, max-age=3600" : "no-store",
    };
    if (!isPreview) {
      headers["Content-Disposition"] = `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodeURIComponent(finalName)}`;
    }
    if (contentLength) headers["Content-Length"] = contentLength;

    return new Response(upstream.body, { status: 200, headers });
  } catch (err) {
    console.error("Download proxy error:", err);
    return Response.json(
      { error: err.message || "Proxy failed" },
      { status: 500 },
    );
  }
}
