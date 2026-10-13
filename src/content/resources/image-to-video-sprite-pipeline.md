---
title: "From one image to a pixel-art walk cycle: testing five AI video models on a 12GB GPU"
description: "Generating sprite frames one at a time is slow, and the frames never quite match. Generating a short video and pixelating it fixes both. Here's the pipeline, five models compared, and the problems I hit along the way."
pubDate: 2026-10-08
tags: ["AI", "animation", "pixel art"]
---

My previous approach to sprite animation was to generate every frame as a separate image with FLUX.2 Klein. That took about 186 seconds per frame, roughly 25 minutes for an 8-frame walk, and each frame was a fresh guess at the same character, so details drifted from one frame to the next.

The idea behind this pipeline is to let a video model do the hard part:

**reference image → image-to-video walk clip → keep one clean cycle → pixelate**

A video model renders motion as one continuous clip, so consistency between frames comes for free. Everything here ran locally on an RTX 4070 (12GB) with 64GB of RAM, using ComfyUI in Docker.

## Step 1: a reference that isn't pixel art

The target look was a small pixel-art sprite like this one:

<figure>
  <img class="pixel" src="/blog/sprite-pipeline/01-inspiration.png" alt="A small pixel-art character sprite used as style inspiration" loading="lazy" />
  <figcaption>The inspiration: the kind of pixel sprite the pipeline should end up producing.</figcaption>
</figure>

The counter-intuitive part is that the reference image should *not* be pixel art. Video models smear hard pixel edges into mush. It works better to give the video model a clean, detailed illustration and do the pixelating at the very end.

The first Klein pass came out chibi: big head, stubby body. That's not what I wanted.

<figure>
  <img src="/blog/sprite-pipeline/02-klein-chibi.webp" alt="First character options from FLUX.2 Klein, drawn in a chibi style with oversized heads" loading="lazy" />
  <figcaption>The first FLUX.2 Klein options came out chibi and were rejected.</figcaption>
</figure>

So I redefined the character as tall and thin, with a skull mask, white gloves and 1800s riding boots. I ran the same prompt through three image models (WAI-Illustrious and Hyphoria, both SDXL-based, and FLUX.1-dev), with two seeds each.

<figure>
  <img src="/blog/sprite-pipeline/03-model-comparison.webp" alt="A grid comparing the hooded wanderer character across three image models and two seeds" loading="lazy" />
  <figcaption>Same prompt on WAI-Illustrious, Hyphoria and FLUX.1-dev. Each row is a seed.</figcaption>
</figure>

Hyphoria with seed 2222 won.

<figure>
  <img src="/blog/sprite-pipeline/04-reference.webp" alt="The chosen reference: a tall, thin hooded wanderer with a skull mask, white gloves and riding boots" loading="lazy" />
  <figcaption>The chosen reference: Hyphoria, seed 2222.</figcaption>
</figure>

## Step 2: five video models, one prompt

Every model got the same reference image and the same walk prompt, for about three seconds of video each. I ran each at two resolutions.

<div class="table-wrap">

| Model | 512×768 | 384×576 | Result |
|---|---|---|---|
| LTX-Video 0.9.8 2B distilled | 63s | 62s | Walks, but drifts right |
| Wan 2.2 TI2V 5B | 374s | 229s | Walks in place |
| FramePack (HunyuanVideo, fp8) | 436s | 283s | Walks in place |
| LTX-2 19B distilled (Q4 GGUF) | 347s cold / 98s warm | 79s warm | Barely moved until fixed, then the winner |
| AnimateDiff v3 + IP-Adapter + SparseCtrl (SD1.5) | 252s | 246s | Lost the skull mask, so it's out |

</div>

<figure>
  <video src="/blog/sprite-pipeline/05-comparison-512.mp4" autoplay loop muted playsinline></video>
  <figcaption>All five models side by side at 512×768, from the same reference and the same walk prompt. LTX-2 appears twice: as it came, and after the preprocessing fix.</figcaption>
</figure>

<figure>
  <video src="/blog/sprite-pipeline/06-comparison-384.mp4" autoplay loop muted playsinline></video>
  <figcaption>The same comparison at 384×576.</figcaption>
</figure>

### Three things worth knowing

**LTX-2 stood still at first.** Out of the box it barely moved and mostly reproduced the input image.

<figure>
  <video src="/blog/sprite-pipeline/07-ltx2-unprocessed.mp4" autoplay loop muted playsinline></video>
  <figcaption>LTX-2 before the fix: it treats the reference as a frame to copy and hardly moves.</figcaption>
</figure>

The fix was to pass the reference through `LTXVPreprocess` first. It applies light compression so the model stops treating the image as a frame to copy and starts animating it. After that, LTX-2 gave the best walk of the five.

<figure>
  <video src="/blog/sprite-pipeline/08-ltx2-winner.mp4" autoplay loop muted playsinline></video>
  <figcaption>LTX-2 after the reference goes through LTXVPreprocess. This clip is the winner.</figcaption>
</figure>

**AnimateDiff can stall silently.** At 512×768 with 16 frames it sat at 100% GPU for 25 minutes without finishing a single step. VRAM had spilled into shared system memory. At 384×576 the same job ran in 4 minutes. It still lost the character's skull mask, though, so it was dropped.

<figure>
  <video src="/blog/sprite-pipeline/07-animatediff.mp4" autoplay loop muted playsinline></video>
  <figcaption>AnimateDiff: the motion is fine, but the skull mask is gone, and that rules it out.</figcaption>
</figure>

**Lower resolution only helps the heavy models.** Dropping to 384×576 saved 35–40% on Wan, FramePack and AnimateDiff, and nothing on the fast models. Their time goes on loading the model, not generating.

## Step 3: from clip to sprite

LTX-2 produced 73 frames. Turning that into a looping sprite took four steps.

1. **Find the loop.** I skipped the first 6 frames, which are near-copies of the still image. Then I searched for the start and length where the last frame best matches the first. The score is normalised by how much the pose changes in between. Without that, a character standing still "loops" perfectly. The best walk cycle was frames 19–43, about 1.04 seconds.
2. **Cut out the character.** BEN2 removed the background, but only on the frames I kept.
3. **Anchor it.** Horizontally I anchored on the head, because the bounding-box centre swings with the stride and the cloak. Vertically I anchored on the feet.
4. **Pixelate the whole cycle at once.** I used one downscale, one shared 24-colour palette and hard alpha for every frame. That stops pixels shimmering between frames. The character ends up 96px tall.

Then I compared 8 frames (every third source frame, 7.7fps) against 12 frames (every second one, 11.5fps):

<figure>
  <img class="pixel" src="/blog/sprite-pipeline/09-walk-8.gif" alt="Pixel-art walk cycle at 8 frames" loading="lazy" />
  <figcaption>8 frames at 7.7fps. It's readable but choppy.</figcaption>
</figure>

<figure>
  <img class="pixel" src="/blog/sprite-pipeline/10-walk-12.gif" alt="Pixel-art walk cycle at 12 frames" loading="lazy" />
  <figcaption>12 frames at 11.5fps. It's visibly smoother, so I chose it.</figcaption>
</figure>

<figure>
  <img class="pixel" src="/blog/sprite-pipeline/11-walk-sheet.png" alt="Sprite sheet of the 12-frame walk cycle shown at actual size" loading="lazy" />
  <figcaption>The final 12-frame walk sprite sheet at actual size, ready to drop into a game engine.</figcaption>
</figure>

## Step 4: a run cycle, and a stutter

The run used the same LTX-2 setup with a run prompt: 73 frames in 352 seconds, from a cold start. The result has a forward lean, airborne strides and the cloak streaming behind.

<figure>
  <video src="/blog/sprite-pipeline/12-run-clip.mp4" autoplay loop muted playsinline></video>
  <figcaption>The LTX-2 run clip: forward lean, both feet off the ground mid-stride, cloak streaming behind.</figcaption>
</figure>

The cycle was frames 11–30 (0.83 seconds, 20 frames). Taking every second frame gave 10 frames at 12fps, at 74×97 pixels. It stuttered visibly.

<figure>
  <img class="pixel" src="/blog/sprite-pipeline/13-run-10-stutter.gif" alt="10-frame pixel-art run cycle with a visible vertical stutter" loading="lazy" />
  <figcaption>The first run cycle: 10 frames, anchored on the feet. Notice the stutter as the body jumps up and down.</figcaption>
</figure>

The cause was the anchoring. Pinning each frame's lowest pixel to the ground works for a walk, where a foot is always down. In a run, both feet leave the ground, so the anchor dragged the whole body 8px down on the airborne frames, and the head's position jumped 1 → 9 → 1.

The fix was to keep the source video's vertical position as it was. The camera is static and the character runs in place, so the video already has the right height in every frame. Now the head bobs 1–5px and the feet visibly leave the ground. I also went to 12 frames (14.4fps), even though 20 source frames don't divide evenly by 12. It still looked better than 10.

<figure>
  <img class="pixel" src="/blog/sprite-pipeline/14-run-12.gif" alt="Smooth 12-frame pixel-art run cycle" loading="lazy" />
  <figcaption>The fixed run: 12 frames at 14.4fps with the source video's vertical position kept, so the feet properly leave the ground.</figcaption>
</figure>

<figure>
  <img class="pixel" src="/blog/sprite-pipeline/15-run-sheet.png" alt="Sprite sheet of the 12-frame run cycle shown at actual size" loading="lazy" />
  <figcaption>The final 12-frame run sprite sheet at actual size.</figcaption>
</figure>

## What I took away

- **Generate detailed, pixelate last.** Video models handle clean illustrations well and pixel art badly.
- **Preprocess the reference for LTX-2.** Without `LTXVPreprocess` it copies the image instead of animating it.
- **Watch your VRAM.** A job sitting at 100% GPU with no progress has probably spilled into shared memory. Drop the resolution.
- **Score loops by motion, not just similarity.** Otherwise the "best loop" is the character standing still.
- **One palette, one downscale.** Pixelating each frame separately makes pixels shimmer.
- **Anchor to suit the motion.** Feet work for walking, but not for running.

---

*Want to talk through how AI tools could speed up your own production work? [Get in touch](/contact).*
