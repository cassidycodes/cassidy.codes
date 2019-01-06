+++
date = "2017-04-25"
title = "Optimizing GIFS with FFMPEG"
slug = "2017/04/25/ffmpeg-frames-to-gif-optimization"
+++

A few months back I was working on an iOS app that delivered GIFs to users. The idea was that someone would visit one of our 3D photo booths, and get an animated avatar created. We could then render animation frames to PNGs using our custom software. The problem was that some of our animations were rather long, so we needed to crunch the gifs down to the smallest possible size.

Before I dive in, I want to give big credit to the author of [this post about high quality GIFs with FFMPEG](http://blog.pkh.me/p/21-high-quality-gif-with-ffmpeg.html). I worked through their notes and dug deeper into FFMPEG docs to get the results here. If you're looking to convert movies to GIFs, check out that article.

## TL;DR

Here is my modified version of the script from the [Usage](http://blog.pkh.me/p/21-high-quality-gif-with-ffmpeg.html) section of the above blog post. What follows in a brief explanation for those who have the patience for digging into FFMPEG.

```bash
#!/bin/sh

palette="/tmp/palette.png"

filters="fps=15,scale=320:-1:flags=lanczos"

ffmpeg -v warning -i $1 -vf "$filters,palettegen=stats_mode=diff" -y $palette

ffmpeg -i $1 -i $palette -lavfi "$filters,paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" -y $2
```

## Filtergraphs

The filter options can get a little confusing. So here's a quick explanation of the Filtergraph Syntax.

The basic values we're passing in with our `$filters` variable are structured like a nested key-value pairs. If a visual representation helps, we could represent this variable like so:

```yaml
fps: 15
scale:
  [320, -1]
  flags: "lanczos"
```

When we add `,palettegen` on the end, we're just adding one more top level key to the filtergraph.

Things get a little more complex when we generate the GIF. Let's look at everything we pass in to the `-lavfi` option:

```yaml
fps: 15
scale:
  [320, -1]
  flags: "lanczos"
paletteuse:
  dither:
    bayer_scale: 5
    diff_mode: rectangle
```

You can find a more detailed explanation of this in FFMPEG's [Filtergraph Docs](http://www.ffmpeg.org/ffmpeg-filters.html#Filtering-Introduction.)


## Explanation of Options

I won't go into each option we're passing to FFMPEG here, but there are a couple things that differ from the original blog post.

1. Using `stats_mode=diff` when generating the palette. This will generate a smaller palette because FFMPEG will only look at the pixels that do not change from one frame to the next. I found that without this, some static pixels would still change colours ever so slightly between frames.

2. Dithering with a `bayer_scale=5`. Have a look a the different options for dithering as they'll each have a different effect depending on your content. In our case, since the images were synthetic (i.e., not photographic), dithering using the Bayer algorithm worked quite nicely.

3. `diff_mode=rectangle` restricts area to only the regions where there is motion. This means that the areas without motion will remain the transparent from one frame to the next.

## The Result

For our longer gifs, this method cut our file size down by about 40%. The image below works out to just 166K. We get a little bit of colour banding, but I think that's acceptable.

<img src="/images/posts/gif-optimization/final.gif" alt="An animated GIF of my avatar doing a backflip." class="img-fluid mx-auto d-block">

If you want to peak at the internals of a gif, you can use `gifsicle -e input.gif` to explode the frames. Here's the first three frames of the gif above. Notice that only the pixels that change from one frame to the next are present.

<img src="/images/posts/gif-optimization/final.000.gif" alt="An animated GIF of my avatar doing a backflip." class="img-fluid mx-auto d-block">
<img src="/images/posts/gif-optimization/final.001.gif" alt="An animated GIF of my avatar doing a backflip." class="img-fluid mx-auto d-block">
<img src="/images/posts/gif-optimization/final.002.gif" alt="An animated GIF of my avatar doing a backflip." class="img-fluid mx-auto d-block">
