+++
date = "2015-10-06"
title = "Video Glitch Art in Ruby"
slug = "2015/10/06/video-glitch-art-in-ruby"
+++

This is the text from a talk about my video glitch work on Fido's [Mobile Music Video](http://mobilemusicvideo.ca). Credit for making this kind of work so fun goes to [UCNV](https://github.com/ucnv/aviglitch) for creating the AviGlitch Gem.

***

A few months ago I got to work on a music video with Vice Magazine and Fido. When I tell people about this contract, both developers and artists alike ask “How did you get that job?”

I am going to answer the question in two ways. First from an experience stand point—What did I have in my portfolio and what connections did I have to land a cool contract like this?—and then second, from a technical standpoint—what did I do with code? How do you break videos with Ruby? What is Glitch Art?

I came into being a developer from a curiosity about making things with code. I never really thought I’d have a job as a developer, I just wanted to see what I could do.

<img class="img-fluid mx-auto d-block" src="/img/posts/video-glitch-art/civic-images-2.jpg" alt="Civic Images">

My very fist application was written in Processing, a Java-based language, and used the now-defunct ProcessingJS to embed it into a WordPress site. Everything I did there is now obsolete since HTML5 is old news now. It’s a little funny to look at now but that was a huge feat for me as my area of study had nothing to do with programming. I taught myself everything for that project.

<img class="img-fluid mx-auto d-block" src="/img/posts/video-glitch-art/toronto-sound-prints.jpg" alt="Toronto Sound Prints">

Shortly after that project I started collaborating with an urban planner and we were curated into an exhibit that explored themes of noise. For this project we partnered with a research lab from Ryerson to take data they have about the emotional effects of noise on human subjects and we created glitched photographs and a heat map to represent Toronto’s sonic stress environments. For this project I worked in Processing again as my input and output were data and graphic related.

<img class="img-fluid mx-auto d-block" src="/img/posts/video-glitch-art/teto.jpg" alt="TeTo">

Since then I have collaborated on media art projects that have to do with sensory experiences and translating sensory information from one domain to another. This is a picture of a suitcase that makes noise based on the texture of the ground.

Alongside these projects I was learning more about graphic design and taking on web development contracts starting with simple WordPress themes and eventually more complicated applications for corporate clients.

So that’s a quick background on my portfolio. The important part about this, though, is some of the connections I made. When I was curated into the Noise Project, I met artists and designers who work both in the art world and in the creative industry.

<img class="img-fluid mx-auto d-block" src="/img/posts/video-glitch-art/pizza.gif" alt="Pizza">

Last Spring I was between contracts and a friend that I know from the art world called me up one night with a question about glitch art and mentioned that this was for a commercial contract. She sent me this sample and a link to some work by [ucnv](http://ucnv.org/) an artist who had written a [Ruby Gem](https://github.com/ucnv/aviglitch) that opens up AVI files lets you mess with them.

I thought, “Glitch art? I’m not a glitch artist? Am I? Am I even a _real_ developer?” Frankly, even though I had done some glitch-data viz with jpegs, I was skeptical of the phrase “glitch art”. I was also uncertain about stepping outside the domain of web development for a commercial contract. I had no idea what it was going to be like to work with a bunch of video compositors.

But I read the docs on the AviGlitch Gem to see what I could do and sent them a sample the next day. They called me and asked me if I was able to glitch 2,000 videos by the end of next week. I said yes. They asked how much it would cost and I aimed for a number I though would be high. They said start tomorrow.

It took me about a week of creating different types of glitches and to get the effects they wanted. Once I had those I build off of a some work from the Gem’s author to write a command line tool that could have glitched 2,000 videos in an hour if they had a powerful enough computer. No one there knew how to program, so I made it really simple. Put the videos in the input directory and type `glitch all` in the terminal and you get 11 variations of that movie to choose from.

So here’s a quick overview of what you can do with this Gem. AVI files have two types of frames—or, at least, two that we care about— i-frames and p-frames. i-frames are like jpegs. They’re static. p-frames represent paths. They tell your video player which direction things are moving in.

So the magic behind the AVI Glitch gem is that it puts these frames into an array and lets you ask the frame what kind it is. For most glitches, p-frames are the ones we want because they’re the ones with the motion. i-frames just make things look normal and normal is boring.

Once you have this array of frames you can shuffle them around, repeat them, stack the same frames onto of each other, delete the i-frames or anything else that you can think of doing with an array. You can also access and manipulate some of the frame’s data if you want.

The one trick to these glitches is that the Gem works with AVIs, so the scripts I wrote use ffmpeg to convert files from their current format to and AVI then saves them back in their original format. In this conversion process there are some cool glitches you can make by breaking codec files, but I didn’t get a chance to dig to deep into that for this work.

So here’s an example. There are two parts to this clip. In the first I took out all the i-frames and then looped the clip over top of itself a couple times. This creates that effect where pieces of people’s faces get left behind or the absorbs the colours from another part of the picture because there are no i-frames to reset the position of things.

Just to show you how boring they are, there’s an iframe in the middle of the clip. But then right after that I’ve created a 5 frame loop that gets messy.

<div class="embed-responsive embed-responsive-16by9" style="margin-bottom: 1.5rem;">
  <iframe src="https://player.vimeo.com/video/141620297?byline=0&portrait=0" width="600" height="400" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
</div>

In code, I can show you what that looks like. This script concatenates video clips with no i-frames between them. The only line we really care about is the on line where we mutate i-frames into p-frames (or key into delta, whichever words you choose). You’ll see that at the top and bottom there are two `ffmpeg` commands that convert the file.


{{< highlight ruby >}}
begin
  options = Docopt::docopt doc
  mktmpdir(options['--debug']) do |tmpdir|
    cmd = Cocaine::CommandLine.new 'ffmpeg', '-i :infile -c:v libxvid -y -q:v 0 :outfile'
    avi = nil
    options['<infile>'].each.with_index do |infile, i|
      avifile = tmpdir.join('mpeg4.avi')
      cmd.run infile: infile, outfile: avifile.to_s
      a = AviGlitch.open avifile
      unless i == 0
        a.glitch :keyframe do |f|
          ''
        end
      end
      a.mutate_keyframes_into_deltaframes!
      if avi.nil?
        avi = a
      else
        avi.frames.concat a.frames
        a.close
      end
    end
    glitchfile = tmpdir.join 'glitch.avi'
    avi.output glitchfile
    cmd = Cocaine::CommandLine.new 'ffmpeg', '-i :infile -q:v 0 :outfile'
    cmd.run infile: glitchfile.to_s, outfile: options['-o']
  end
rescue Docopt::Exit => e
  puts e.message
end
{{< / highlight >}}

Here’s what a couple of loops of this looks like. This is the same clip concatenated three times. If you’re out on the internet looking things up, this is also called datamoshing.

<div class="embed-responsive embed-responsive-16by9" style="margin-bottom: 1.5rem;">
  <iframe src="https://player.vimeo.com/video/141495756?byline=0&portrait=0" width="600" height="400" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
</div>

This melt effect is the one that you see a lot in glitched files. The real work here happens between `make_tmp_file` and just before the `if`. It opens the video up, grabs a start point and makes sure that it’s a p-frame then repeats that frame until the end of the file.

{{< highlight ruby >}}
begin
  options = Docopt::docopt doc
  mktmpdir(options['--debug']) do |tmpdir|
    infile  = options['<infile>']
    avifile = tmpdir.join('mpeg4.avi')
    make_tmp_file infile, avifile
    avi          = AviGlitch.open avifile
    num_frames   = avi.frames.count
    start        = options['-s'].to_i
    start_at     = start < num_frames ? start : num_frames/2
    start_at    += 1 if avi.frames[start_at].is_keyframe?
    melted       = avi.frames[start_at, 1] * num_frames
    if !options['--decap']
      base   = avi.frames[0..start_at].mutate_keyframes_into_deltaframes!
      melted = base.concat melted
    end
    glitchfile = tmpdir.join 'glitch.avi'
    melted.to_avi.output glitchfile
    if options['--raw']
      cmd = Cocaine::CommandLine.new 'cp', ':infile :outfile'
    else
      cmd = Cocaine::CommandLine.new 'ffmpeg', '-i :infile   -q:v 0 :outfile'
    end
    cmd.run infile: glitchfile.to_s, outfile: options['-o']
  end
rescue Docopt::Exit => e
  puts e.message
end
{{< / highlight >}}

Here’s the result. You’ll notice that the audio cuts out in this one. This is because not every frame is synchronized with the audio file, so when we glitch here we loose the audio.

<div class="embed-responsive embed-responsive-16by9" style="margin-bottom: 1.5rem;">
  <iframe src="https://player.vimeo.com/video/141495759?byline=0&portrait=0" width="600" height="400" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
</div>

If you wanted to mess with the frame data, you can get a result something like this. In this clip I randomly deleted pieces of data. It gives this sort of heatwave effect because the i-frames suddenly have motion that they didn’t have before.

<div class="embed-responsive embed-responsive-16by9" style="margin-bottom: 1.5rem;">
  <iframe src="https://player.vimeo.com/video/141495758?byline=0&portrait=0" width="600" height="400" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
</div>

Finally, if you want to get really wild, you can stack effects on top of each other like this one. This gets really cool when you take one totally glitched frame and concatenate it with a frame that has lots of motion. Check it out.

<div class="embed-responsive embed-responsive-16by9" style="margin-bottom: 1.5rem;">
  <iframe src="https://player.vimeo.com/video/141495760?byline=0&portrait=0" width="600" height="400" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
</div>
