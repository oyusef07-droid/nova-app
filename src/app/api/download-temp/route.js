import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const filename = searchParams.get("filename") || "audio.mp3";

    if (!id || !id.startsWith("output_") || !id.endsWith(".mp3")) {
      return Response.json({ error: "Invalid ID" }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const filePath = path.join(os.tmpdir(), id);

    if (!fs.existsSync(filePath)) {
      return Response.json({ error: "File not found or already deleted" }, { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const buffer = fs.readFileSync(filePath);

    // Note: Do NOT delete the file here! 
    // Android's Download Manager makes multiple requests (e.g. HEAD then GET, or range requests).
    // If we delete it on the first request, the actual download fails.
    // The file will be deleted by the frontend's DELETE request or OS tmp cleanup.

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return Response.json({ error: "Download failed" }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id && id.startsWith("output_")) {
      const filePath = path.join(os.tmpdir(), id);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    return Response.json({ success: true }, { headers: { 'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return Response.json({ error: "Failed to delete" }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
