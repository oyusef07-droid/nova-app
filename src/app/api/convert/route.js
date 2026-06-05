import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('video');
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No video file provided' }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 40MB limit enforcement
    if (file.size > 40 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File size exceeds 40MB limit' }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = os.tmpdir();
    const inputId = Date.now().toString() + Math.floor(Math.random() * 1000);
    const inputExt = file.name ? path.extname(file.name) || '.mp4' : '.mp4';
    const inputPath = path.join(tempDir, `input_${inputId}${inputExt}`);
    const outputPath = path.join(tempDir, `output_${inputId}.mp3`);

    fs.writeFileSync(inputPath, buffer);

    try {
      // Extract audio with ffmpeg. Added -loglevel error to prevent maxBuffer limits in exec
      await execAsync(`ffmpeg -loglevel error -y -i "${inputPath}" -vn -ar 44100 -ac 2 -b:a 128k "${outputPath}"`);
    } catch (ffmpegErr) {
      console.error('FFmpeg error:', ffmpegErr);
      try { fs.unlinkSync(inputPath); } catch(e) {}
      return new Response(JSON.stringify({ error: 'Conversion failed or file format not supported' }), { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Clean up input file ONLY, we leave output for download
    try {
      fs.unlinkSync(inputPath);
    } catch(e) {}

    // Extract filename without extension
    const originalName = file.name ? path.parse(file.name).name : 'audio';
    const safeName = originalName.replace(/[^\w\u0600-\u06FF.\- ]/g, "").trim() || 'converted_audio';

    return new Response(JSON.stringify({ 
      downloadId: `output_${inputId}.mp3`,
      filename: `${safeName}.mp3`
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
