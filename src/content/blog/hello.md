---
title: "Starting a blog, finally"
description: "A short first post to prove the pipeline works — written in the browser, committed to git, deployed by Cloudflare without anyone touching a terminal."
pubDate: 2026-09-11
tags: ["meta"]
draft: true
author: "Nic Hobbs"
---

This is a placeholder post. It exists so the blog section has something in it
while the site is still on staging — feel free to rewrite it or delete it
entirely before launch.

It's marked as a draft, which means it shows up on branch previews but is
stripped out of the live site. Untick **Draft** in the editor to publish it.

## How this gets published

1. Write the post at `/admin`.
2. Save. The CMS commits the markdown straight to the repository.
3. Cloudflare Pages notices the commit and rebuilds the site.
4. A minute or so later it's live.

No terminal, no build step to run by hand, and the post is a plain markdown
file in git — so it's reviewable, revertable, and portable if this site ever
moves somewhere else.
