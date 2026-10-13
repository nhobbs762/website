---
title: "Rigging an AI-generated knight: why it fell apart, and what finally worked"
description: "Turning an AI concept image into a walking 3D character looked like a two-step job. It took a lot more than that. The fix wasn't a better rig. It was a better starting pose and borrowed skin weights."
pubDate: 2026-09-22
tags: ["AI", "3D", "animation"]
---

The plan was simple: generate a knight concept image, turn it into a 3D mesh, attach a skeleton, and play a walk animation on it. Each step has a tool, and on paper they slot together.

In practice the knight fell apart, sometimes literally, several times before it walked properly. This post goes through every attempt in order. Every clip uses the same Mixamo walk, the same camera and a flat grey render, so the only thing that changes is how the knight was built.

## The starting point

The concept came from SDXL and was fed into Pixal3D, an image-to-3D model. The pose shows the knight in three-quarter view with his hands resting on the hip plates. It looks good as an illustration, but most of the problems that follow come from it.

<figure>
  <img src="/blog/knight-walk-cycle/concept-three-quarter.webp" alt="AI-generated concept art of an armoured knight in three-quarter view, arms down with his hands pressed against his hips" loading="lazy" />
  <figcaption>The original SDXL concept. The hands resting on the hips turn out to be a big problem later on.</figcaption>
</figure>

## Attempt 1: a knight made of confetti

The first walk used the raw Pixal3D mesh, with each part weighted to whichever bone was nearest. On screen the mesh looked solid. In fact it was 791 separate, disconnected pieces. Each piece followed its own nearest bone, so as soon as the knight moved, he came apart.

<figure>
  <video src="/blog/knight-walk-cycle/01-shredded.mp4" autoplay loop muted playsinline></video>
  <figcaption>Attempt 1: the raw mesh is 791 separate pieces, so each one follows the nearest bone on its own.</figcaption>
</figure>

## Attempt 2: repaired, but still tearing

I repaired the mesh in ComfyUI, which brought it from 791 pieces down to 14. Then I used Blender's automatic bone-heat weighting and cut the arms away from the hips. It was much better but still tore. The legs were separate pieces tucked under the armoured skirt, and the hands were still fused to the hips.

<figure>
  <video src="/blog/knight-walk-cycle/02-bone-heat.mp4" autoplay loop muted playsinline></video>
  <figcaption>Attempt 2: 14 pieces and proper bone-heat weights. It holds together better but still tears at the legs and hands.</figcaption>
</figure>

## Three ways to fix it

From there I tried three different approaches.

**A: fuse everything into one surface.** I voxel-fused the whole mesh into one watertight shell. That closed the gaps, but the hand was still joined to the hip, so every arm swing pulled a sheet of armour off his side.

<figure>
  <video src="/blog/knight-walk-cycle/03-a-join.mp4" autoplay loop muted playsinline></video>
  <figcaption>Approach A: one fused surface. No gaps, but the hand is welded to the hip and drags it along on every swing.</figcaption>
</figure>

**B: rigid armour plates.** Each plate was attached rigidly to a single bone, with overlapping flaps at the joints so no gaps would show. Nothing stretches, but small shards still break loose. This attempt also showed that the rig's left arm sat 12cm outside the mesh's left arm.

<figure>
  <video src="/blog/knight-walk-cycle/04-b-rigid-plates.mp4" autoplay loop muted playsinline></video>
  <figcaption>Approach B: each armour plate moves rigidly with one bone. Nothing stretches, but small shards still break off.</figcaption>
</figure>

**C: fix the pose at the source.** By this point it was clear the problem began with the concept image. Image-to-3D copies the pose it's given, so if the hands touch the hips in the picture, they're joined to the hips in the mesh. I re-rendered the same knight front-on in an A-pose, using FLUX.2 Klein guided by a skeleton, with the arms clear of the body and the feet apart.

<figure>
  <img src="/blog/knight-walk-cycle/concept-apose.webp" alt="The same knight re-rendered front-on in an A-pose, arms held away from the body and feet apart" loading="lazy" />
  <figcaption>The same knight in an A-pose. With the arms clear of the body and the feet apart, nothing is joined that shouldn't be.</figcaption>
</figure>

The mesh from that image came out 94% one piece. It was the cleanest result so far, apart from the feet.

<figure>
  <video src="/blog/knight-walk-cycle/05-c-apose.mp4" autoplay loop muted playsinline></video>
  <figcaption>Approach C: the A-pose knight, rigged. The mesh is 94% one piece and the cleanest of the three, apart from the feet.</figcaption>
</figure>

<figure>
  <video src="/blog/knight-walk-cycle/06-compare.mp4" autoplay loop muted playsinline></video>
  <figcaption>A, B and C side by side.</figcaption>
</figure>

## A detour that changed the approach

To find out whether my rigging or my mesh was at fault, I put the same rig on Blender's standard human base mesh. It walked cleanly. So the rig was fine and the generated mesh was the problem.

<figure>
  <video src="/blog/knight-walk-cycle/07-blender-base-mesh.mp4" autoplay loop muted playsinline></video>
  <figcaption>The same rig on Blender's human base mesh. A clean mesh rigs cleanly, so the rig wasn't the problem.</figcaption>
</figure>

Next I tried two free pre-rigged bodies, MPFB2 and Quaternius. Both come with good skin weights, done by people who know what they're doing. That suggested a different approach: borrow those weights instead of trying to compute my own.

<figure>
  <video src="/blog/knight-walk-cycle/08-mpfb-vs-quaternius.mp4" autoplay loop muted playsinline></video>
  <figcaption>Two free pre-rigged bodies, MPFB2 and Quaternius. You can get good weights off the shelf.</figcaption>
</figure>

## Attempt D: the knight as a skin

The approach that worked was to layer the knight onto a Mixamo character as a new "skin". The armour copies its weights from the professionally rigged body underneath. Pieces sitting over the same patch of skin move together, so there are no tears, gaps or floating shards.

<figure>
  <video src="/blog/knight-walk-cycle/09-d-first-good.mp4" autoplay loop muted playsinline></video>
  <figcaption>Approach D: the first good knight. His weights are copied from a Mixamo body underneath, so the armour moves as one piece.</figcaption>
</figure>

<figure>
  <video src="/blog/knight-walk-cycle/10-c-vs-d.mp4" autoplay loop muted playsinline></video>
  <figcaption>The previous best (C) next to the first good one (D).</figcaption>
</figure>

With a knight that holds together, it's easy to render him from any angle. Sprite-based games need exactly that.

<figure>
  <video src="/blog/knight-walk-cycle/11-eight-directions.mp4" autoplay loop muted playsinline></video>
  <figcaption>The finished knight walking in eight directions.</figcaption>
</figure>

## What I'd tell myself at the start

- **A mesh that looks solid may not be one surface.** Image-to-3D output can look perfect in a still render and still be hundreds of loose pieces. Count the pieces before you rig anything.
- **Image-to-3D copies the concept's pose.** Hands on hips in the image means hands joined to hips in the mesh. Fix the pose in the concept image, where it's cheap: an A-pose with the arms and legs apart.
- **Don't make up your own weights if you can borrow some.** A professionally rigged body already has good skin weights. Put the generated character on top of it as a skin and copy them.

---

*Working on something similar, or curious how AI tools fit into your own production pipeline? [Get in touch](/contact).*
