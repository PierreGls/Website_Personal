// scripts/upload-videos.mjs
//
// One-time migration script: uploads each project's video + icon to Vercel Blob,
// then rewrites assets/projects/index.json to include the new Blob URLs.
//
// Run this ONCE from your project root, locally (not on Vercel, not at build time).

import { put } from '@vercel/blob';
import fs from 'node:fs/promises';
import path from 'node:path';

// --- Adjust these two paths if your folder layout differs ---
const PROJECTS_JSON = './assets/projects/index.json';
const PROJECTS_ROOT = './assets/projects';
// ---------------------------------------------------------------

async function main() {
  const raw = await fs.readFile(PROJECTS_JSON, 'utf-8');
  const data = JSON.parse(raw);

  for (const project of data.projects) {
    const folder = `${project.id}`.slice(0, 2);
    const dir = path.join(PROJECTS_ROOT, folder, project.name);

    const videoPath = path.join(dir, 'preview.mp4');
    const logoPath = path.join(dir, 'icon.png');

    // Upload video
    try {
      const videoFile = await fs.readFile(videoPath);
      const videoBlob = await put(`projects/${project.name}/preview.mp4`, videoFile, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true, // lets you re-run the script safely
      });
      project.videoUrl = videoBlob.url;
      console.log(`✅ Video uploaded for "${project.name}": ${videoBlob.url}`);
    } catch (err) {
      console.error(`❌ Failed to upload video for "${project.name}":`, err.message);
    }

    // Upload icon/logo
    try {
      const logoFile = await fs.readFile(logoPath);
      const logoBlob = await put(`projects/${project.name}/icon.png`, logoFile, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      project.logoUrl = logoBlob.url;
      console.log(`✅ Icon uploaded for "${project.name}": ${logoBlob.url}`);
    } catch (err) {
      console.error(`❌ Failed to upload icon for "${project.name}":`, err.message);
    }
  }

  await fs.writeFile(PROJECTS_JSON, JSON.stringify(data, null, 2));
  console.log('\n✅ Done. index.json updated with videoUrl / logoUrl fields.');
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
